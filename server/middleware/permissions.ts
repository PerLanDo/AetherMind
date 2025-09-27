import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { storage } from '../storage';

export type Permission = 'read' | 'write' | 'admin';
export type UserRoleType = 'admin' | 'member' | 'viewer';

// Permission hierarchy mapping
const ROLE_PERMISSIONS: Record<UserRoleType, Permission[]> = {
  admin: ['read', 'write', 'admin'],
  member: ['read', 'write'],
  viewer: ['read']
};

/**
 * Check if a user has a specific permission based on their roles
 */
export function hasPermission(userRoles: string[], requiredPermission: Permission): boolean {
  return userRoles.some(role => {
    const rolePermissions = ROLE_PERMISSIONS[role as UserRoleType];
    return rolePermissions && rolePermissions.includes(requiredPermission);
  });
}

/**
 * Middleware to check if user has a specific permission globally
 */
export function requirePermission(permission: Permission) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Load user roles if not already loaded
      if (!req.user.roles) {
        const userRoles = await storage.getUserRoles(req.user.id);
        req.user.roles = userRoles.map(role => role.role);
      }

      if (!hasPermission(req.user.roles, permission)) {
        return res.status(403).json({ 
          error: `Access denied. Required permission: ${permission}` 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

/**
 * Middleware to check if user has a specific permission for a project
 */
export function requireProjectPermission(permission: Permission) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const projectId = req.params.projectId;
      if (!projectId) {
        return res.status(400).json({ error: "Project ID required" });
      }

      // First, verify basic project access via project members
      const hasBasicAccess = await storage.verifyProjectAccess(req.user.id, projectId);
      if (!hasBasicAccess) {
        return res.status(403).json({ error: "Access denied to this project" });
      }

      // Then check role-based permissions for this specific project
      const projectRoles = await storage.getUserRolesForProject(req.user.id, projectId);
      const roleNames = projectRoles.map(role => role.role);

      if (!hasPermission(roleNames, permission)) {
        return res.status(403).json({ 
          error: `Access denied. Required permission for project: ${permission}` 
        });
      }

      next();
    } catch (error) {
      console.error('Project permission check error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

/**
 * Middleware to check if user has a specific permission for a team
 */
export function requireTeamPermission(permission: Permission) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const teamId = req.params.teamId || req.params.id;
      if (!teamId) {
        return res.status(400).json({ error: "Team ID required" });
      }

      // Check if user is a member of the team
      const teamMembership = await storage.getTeamMembership(req.user.id, parseInt(teamId));
      if (!teamMembership) {
        return res.status(403).json({ error: "Access denied to this team" });
      }

      // Check role-based permissions within the team
      if (!hasPermission([teamMembership.role], permission)) {
        return res.status(403).json({ 
          error: `Access denied. Required team permission: ${permission}` 
        });
      }

      next();
    } catch (error) {
      console.error('Team permission check error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

/**
 * Check if user is team owner (convenience function)
 */
export function requireTeamOwnership() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const teamId = req.params.teamId || req.params.id;
      if (!teamId) {
        return res.status(400).json({ error: "Team ID required" });
      }

      const team = await storage.getTeam(parseInt(teamId));
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      if (team.ownerId !== req.user.id) {
        return res.status(403).json({ error: "Access denied. Team ownership required" });
      }

      next();
    } catch (error) {
      console.error('Team ownership check error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

/**
 * Helper to check if a user can perform an action on another user (for admin operations)
 */
export function canManageUser(actorRoles: string[], targetUserId: string, actorUserId: string): boolean {
  // Users can always manage themselves
  if (actorUserId === targetUserId) {
    return true;
  }
  
  // Only admins can manage other users
  return hasPermission(actorRoles, 'admin');
}