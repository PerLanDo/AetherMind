import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string | null;
    password: string;
    createdAt: Date | null;
    updatedAt: Date | null;
    roles?: string[];
  };
}

const JWT_SECRET = process.env.SESSION_SECRET || "fallback-secret-key";

export function requireRole(requiredRole: 'admin' | 'member' | 'viewer') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated first
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get user's roles from database
      const userRoles = await storage.getUserRoles(req.user.id);
      
      // Check if user has the required role (globally or for any project)
      const hasRole = userRoles.some(role => role.role === requiredRole);
      
      if (!hasRole) {
        return res.status(403).json({ 
          error: `Access denied. Required role: ${requiredRole}` 
        });
      }

      // Attach roles to user object for further use
      req.user.roles = userRoles.map(role => role.role);
      
      next();
    } catch (error) {
      console.error('Role verification error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

export function requireProjectAccess(permission: 'read' | 'write' | 'admin') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const projectId = req.params.projectId;
      if (!projectId) {
        return res.status(400).json({ error: "Project ID required" });
      }

      // Check if user has access to project via existing project members table
      const hasAccess = await storage.verifyProjectAccess(req.user.id, projectId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this project" });
      }

      // For more granular permissions, check user roles in this project
      const userRoles = await storage.getUserRolesForProject(req.user.id, projectId);
      
      // Define permission hierarchy
      const canRead = userRoles.some(role => ['viewer', 'member', 'admin'].includes(role.role));
      const canWrite = userRoles.some(role => ['member', 'admin'].includes(role.role));
      const canAdmin = userRoles.some(role => role.role === 'admin');

      let hasPermission = false;
      switch (permission) {
        case 'read':
          hasPermission = canRead;
          break;
        case 'write':
          hasPermission = canWrite;
          break;
        case 'admin':
          hasPermission = canAdmin;
          break;
      }

      if (!hasPermission) {
        return res.status(403).json({ 
          error: `Access denied. Required permission: ${permission}` 
        });
      }

      next();
    } catch (error) {
      console.error('Project access verification error:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

// Enhanced auth middleware that also loads user roles
export async function requireAuthWithRoles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // First try session authentication
    if (req.isAuthenticated() && req.user) {
      // Load user roles
      const userRoles = await storage.getUserRoles(req.user.id);
      (req.user as any).roles = userRoles.map(role => role.role);
      return next();
    }

    // Try JWT from Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
          id: string;
          username: string;
        };
        
        if (decoded) {
          // Get user from storage and attach to req.user
          const user = await storage.getUser(decoded.id);
          if (user) {
            // Load user roles
            const userRoles = await storage.getUserRoles(user.id);
            req.user = {
              ...user,
              roles: userRoles.map(role => role.role),
            };
            return next();
          }
        }
      } catch (error) {
        // JWT verification failed, fall through to 401
      }
    }

    return res.status(401).json({ error: "Authentication required" });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
}