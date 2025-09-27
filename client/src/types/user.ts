export type UserRole = 'admin' | 'member' | 'viewer';

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  roles?: UserRole[];
  teams?: Team[];
}

export interface Team {
  id: number;
  name: string;
  ownerId: string;
  createdAt: Date;
  members?: TeamMember[];
}

export interface TeamMember {
  id: number;
  userId: string;
  teamId: number;
  role: UserRole;
  invitedAt: Date;
  user?: User;
}

export interface UserRoleAssignment {
  id: number;
  userId: string;
  role: UserRole;
  projectId?: string;
  createdAt: Date;
}

// API request/response types
export interface CreateTeamRequest {
  name: string;
}

export interface CreateTeamResponse extends Team {}

export interface InviteTeamMemberRequest {
  userId: string;
  role: UserRole;
}

export interface InviteTeamMemberResponse extends TeamMember {}

export interface UpdateUserRoleRequest {
  role: UserRole;
  projectId?: string;
}

export interface UpdateUserRoleResponse {
  success: boolean;
  message: string;
}

export interface GetUserPermissionsResponse {
  userId: string;
  globalRoles: UserRole[];
  projectRoles: { [projectId: string]: UserRole[] };
  teamMemberships: {
    teamId: number;
    teamName: string;
    role: UserRole;
  }[];
}

// Permission types
export type Permission = 'read' | 'write' | 'admin';

export interface RolePermissions {
  [role: string]: Permission[];
}

// Default role permissions mapping
export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  admin: ['read', 'write', 'admin'],
  member: ['read', 'write'],
  viewer: ['read']
};

// Helper functions
export function hasPermission(userRoles: UserRole[], requiredPermission: Permission): boolean {
  return userRoles.some(role => {
    const permissions = DEFAULT_ROLE_PERMISSIONS[role];
    return permissions && permissions.includes(requiredPermission);
  });
}

export function getHighestRole(roles: UserRole[]): UserRole | null {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('member')) return 'member';
  if (roles.includes('viewer')) return 'viewer';
  return null;
}

export function canManageUser(actorRoles: UserRole[], targetUserId: string, actorUserId: string): boolean {
  // Users can always manage themselves
  if (actorUserId === targetUserId) {
    return true;
  }
  
  // Only admins can manage other users
  return hasPermission(actorRoles, 'admin');
}