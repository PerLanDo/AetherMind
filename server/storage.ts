import {
  users,
  files,
  projects,
  projectMembers,
  conversations,
  messages,
  tasks,
  documentVersions,
  changeRecords,
  conflictResolutions,
  notifications,
  type User,
  type InsertUser,
  type Project,
  type InsertProject,
  type File,
  type InsertFile,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Task,
  type InsertTask,
  type DocumentVersion,
  type InsertDocumentVersion,
  type ChangeRecord,
  type InsertChangeRecord,
  type ConflictResolution,
  type InsertConflictResolution,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or, ilike, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { StorageService } from "./storage-service";

// Storage interface for OMNISCI AI - based on javascript_database integration
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Project methods
  getUserProjects(userId: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: string): Promise<Project | undefined>;
  addProjectMember(
    projectId: string,
    userId: string,
    role: string
  ): Promise<void>;

  // File methods
  createFile(file: InsertFile): Promise<File>;
  getUserFiles(
    userId: string,
    options?: { projectId?: string; search?: string }
  ): Promise<File[]>;
  getProjectFiles(projectId: string): Promise<File[]>;
  getFile(id: string): Promise<File | undefined>;
  deleteFile(id: string): Promise<void>;

  // Conversation methods
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getProjectConversations(projectId: string): Promise<Conversation[]>;
  addMessage(message: InsertMessage): Promise<Message>;
  getConversationMessages(conversationId: string): Promise<Message[]>;

  // Task methods
  createTask(task: InsertTask): Promise<Task>;
  getProjectTasks(projectId: string): Promise<Task[]>;
  updateTaskStatus(
    taskId: string,
    status: string,
    progress?: number
  ): Promise<void>;

  // Authorization helpers
  verifyProjectAccess(userId: string, projectId: string): Promise<boolean>;
  verifyConversationAccess(
    userId: string,
    conversationId: string
  ): Promise<string | null>; // returns projectId
  verifyTaskAccess(userId: string, taskId: string): Promise<string | null>; // returns projectId
  verifyFileAccess(userId: string, fileId: string): Promise<string | null>; // returns projectId

  // Team management methods
  getProjectMembers(projectId: string): Promise<
    Array<{
      id: string;
      username: string;
      email?: string;
      role: string;
      joinedAt: Date;
    }>
  >;
  removeProjectMember(projectId: string, userId: string): Promise<void>;
  updateMemberRole(
    projectId: string,
    userId: string,
    role: string
  ): Promise<void>;
  getUserProjectRole(userId: string, projectId: string): Promise<string | null>;

  // Project access with role-based permissions
  getUserProjectsWithRole(
    userId: string
  ): Promise<Array<Project & { role: string }>>;

  // Version control methods
  saveDocumentVersion(
    version: InsertDocumentVersion & { id: string; createdAt: Date | string }
  ): Promise<DocumentVersion>;
  getVersionHistory(fileId: string): Promise<DocumentVersion[]>;
  getCurrentVersion(fileId: string): Promise<DocumentVersion | null>;
  getVersion(
    fileId: string,
    versionNumber: number
  ): Promise<DocumentVersion | null>;
  getRecentVersions(fileId: string, limit: number): Promise<DocumentVersion[]>;
  deactivateVersion(versionId: string): Promise<void>;
  getConflictResolution(conflictId: string): Promise<ConflictResolution | null>;
  updateConflictResolution(
    conflictId: string,
    updates: Partial<ConflictResolution>
  ): Promise<void>;
  saveConflictResolution(
    conflict: InsertConflictResolution & {
      id: string;
      createdAt: Date | string;
    }
  ): Promise<ConflictResolution>;
  canUserEditProject(userId: string, projectId: string): Promise<boolean>;
  canUserViewProject(userId: string, projectId: string): Promise<boolean>;
  canUserManageMembers(userId: string, projectId: string): Promise<boolean>;

  // Data management
  clearAllUserData(userId: string): Promise<void>;

  // Notification methods
  saveNotification(notification: {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    read: boolean;
    createdAt: Date;
  }): Promise<void>;
  getUserNotifications(
    userId: string,
    limit?: number
  ): Promise<
    Array<{
      id: string;
      userId: string;
      type: string;
      title: string;
      message: string;
      data: any;
      read: boolean;
      createdAt: Date;
    }>
  >;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  sessionStore: any;
}

// Database storage implementation - based on javascript_database integration
const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  // Project methods
  async getUserProjects(userId: string): Promise<Project[]> {
    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.ownerId, userId))
      .orderBy(desc(projects.updatedAt));

    return userProjects;
  }

  async getUserProjectsWithRole(
    userId: string
  ): Promise<Array<Project & { role: string }>> {
    const result = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        ownerId: projects.ownerId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        role: projectMembers.role,
      })
      .from(projects)
      .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .where(eq(projectMembers.userId, userId))
      .orderBy(desc(projects.updatedAt));

    return result;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values({
        ...project,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Add owner as project member
    await this.addProjectMember(newProject.id, project.ownerId, "Owner");

    return newProject;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return project || undefined;
  }

  async addProjectMember(
    projectId: string,
    userId: string,
    role: string
  ): Promise<void> {
    await db.insert(projectMembers).values({
      projectId,
      userId,
      role,
      joinedAt: new Date(),
    });
  }

  // Team management methods
  async getProjectMembers(projectId: string): Promise<
    Array<{
      id: string;
      username: string;
      email?: string;
      role: string;
      joinedAt: Date;
    }>
  > {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: projectMembers.role,
        joinedAt: projectMembers.joinedAt,
      })
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId))
      .orderBy(projectMembers.joinedAt);

    return result.map((member) => ({
      id: member.id,
      username: member.username,
      email: member.email || undefined,
      role: member.role,
      joinedAt: member.joinedAt!,
    }));
  }

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    await db
      .delete(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        )
      );
  }

  async updateMemberRole(
    projectId: string,
    userId: string,
    role: string
  ): Promise<void> {
    await db
      .update(projectMembers)
      .set({ role })
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        )
      );
  }

  async getUserProjectRole(
    userId: string,
    projectId: string
  ): Promise<string | null> {
    const [result] = await db
      .select({ role: projectMembers.role })
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.userId, userId),
          eq(projectMembers.projectId, projectId)
        )
      );

    return result?.role || null;
  }

  // Permission check methods
  async canUserEditProject(
    userId: string,
    projectId: string
  ): Promise<boolean> {
    const role = await this.getUserProjectRole(userId, projectId);
    return role === "Owner" || role === "Editor";
  }

  async canUserViewProject(
    userId: string,
    projectId: string
  ): Promise<boolean> {
    const role = await this.getUserProjectRole(userId, projectId);
    return role === "Owner" || role === "Editor" || role === "Viewer";
  }

  async canUserManageMembers(
    userId: string,
    projectId: string
  ): Promise<boolean> {
    const role = await this.getUserProjectRole(userId, projectId);
    return role === "Owner";
  }

  // File methods
  async createFile(file: InsertFile): Promise<File> {
    const [newFile] = await db
      .insert(files)
      .values({
        ...file,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newFile;
  }

  async getProjectFiles(projectId: string): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(eq(files.projectId, projectId))
      .orderBy(desc(files.createdAt));
  }

  async getUserFiles(
    userId: string,
    options: { projectId?: string; search?: string } = {}
  ): Promise<File[]> {
    // Build WHERE conditions
    const conditions = [eq(projectMembers.userId, userId)];

    if (options.projectId) {
      conditions.push(eq(files.projectId, options.projectId));
    }

    if (options.search) {
      conditions.push(
        or(
          ilike(files.name, `%${options.search}%`),
          ilike(files.originalName, `%${options.search}%`)
        )!
      );
    }

    const result = await db
      .select({
        id: files.id,
        name: files.name,
        createdAt: files.createdAt,
        updatedAt: files.updatedAt,
        originalName: files.originalName,
        mimeType: files.mimeType,
        size: files.size,
        projectId: files.projectId,
        uploadedBy: files.uploadedBy,
        content: files.content,
        metadata: files.metadata,
        cloudKey: files.cloudKey,
      })
      .from(files)
      .innerJoin(projectMembers, eq(files.projectId, projectMembers.projectId))
      .where(and(...conditions))
      .orderBy(desc(files.createdAt));

    return result;
  }

  async getFile(id: string): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file || undefined;
  }

  async deleteFile(id: string): Promise<void> {
    await db.delete(files).where(eq(files.id, id));
  }

  // Conversation methods
  async createConversation(
    conversation: InsertConversation
  ): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values({
        ...conversation,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newConversation;
  }

  async getProjectConversations(projectId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.projectId, projectId))
      .orderBy(desc(conversations.updatedAt));
  }

  async addMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values({
        ...message,
        createdAt: new Date(),
      })
      .returning();
    return newMessage;
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  // Task methods
  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values({
        ...task,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newTask;
  }

  async getProjectTasks(projectId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(desc(tasks.createdAt));
  }

  async updateTaskStatus(
    taskId: string,
    status: string,
    progress?: number
  ): Promise<void> {
    const updateData: any = { status, updatedAt: new Date() };
    if (progress !== undefined) {
      updateData.progress = progress;
    }

    await db.update(tasks).set(updateData).where(eq(tasks.id, taskId));
  }

  // Authorization helpers to prevent IDOR vulnerabilities
  async verifyProjectAccess(
    userId: string,
    projectId: string
  ): Promise<boolean> {
    const result = await db
      .select({ id: projectMembers.id })
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        )
      )
      .limit(1);

    return result.length > 0;
  }

  async verifyConversationAccess(
    userId: string,
    conversationId: string
  ): Promise<string | null> {
    const result = await db
      .select({ projectId: conversations.projectId })
      .from(conversations)
      .innerJoin(
        projectMembers,
        eq(conversations.projectId, projectMembers.projectId)
      )
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(projectMembers.userId, userId)
        )
      )
      .limit(1);

    return result.length > 0 ? result[0].projectId : null;
  }

  async verifyTaskAccess(
    userId: string,
    taskId: string
  ): Promise<string | null> {
    const result = await db
      .select({ projectId: tasks.projectId })
      .from(tasks)
      .innerJoin(projectMembers, eq(tasks.projectId, projectMembers.projectId))
      .where(and(eq(tasks.id, taskId), eq(projectMembers.userId, userId)))
      .limit(1);

    return result.length > 0 ? result[0].projectId : null;
  }

  async verifyFileAccess(
    userId: string,
    fileId: string
  ): Promise<string | null> {
    const result = await db
      .select({ projectId: files.projectId })
      .from(files)
      .innerJoin(projectMembers, eq(files.projectId, projectMembers.projectId))
      .where(and(eq(files.id, fileId), eq(projectMembers.userId, userId)))
      .limit(1);

    return result.length > 0 ? result[0].projectId : null;
  }

  // Delete a single project and all its associated data
  async deleteProject(projectId: string, userId: string): Promise<void> {
    // First verify that the user is the owner of the project
    const project = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)))
      .limit(1);

    if (project.length === 0) {
      throw new Error("Project not found or you don't have permission to delete it");
    }

    // Delete all associated data for this project
    
    // Get all conversations for this project
    const projectConversations = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.projectId, projectId));

    // Delete messages for each conversation
    for (const conversation of projectConversations) {
      await db
        .delete(messages)
        .where(eq(messages.conversationId, conversation.id));
    }

    // Delete conversations
    await db
      .delete(conversations)
      .where(eq(conversations.projectId, projectId));

    // Delete tasks
    await db.delete(tasks).where(eq(tasks.projectId, projectId));

    // Get all files for this project to delete from cloud storage
    const projectFiles = await db
      .select({ cloudKey: files.cloudKey })
      .from(files)
      .where(eq(files.projectId, projectId));

    // Delete files from cloud storage
    for (const file of projectFiles) {
      if (file.cloudKey) {
        try {
          await StorageService.deleteFile(file.cloudKey);
        } catch (error) {
          console.warn("Failed to delete file from cloud storage:", error);
        }
      }
    }

    // Delete files from database
    await db.delete(files).where(eq(files.projectId, projectId));

    // Delete project members
    await db
      .delete(projectMembers)
      .where(eq(projectMembers.projectId, projectId));

    // Delete the project itself
    await db.delete(projects).where(eq(projects.id, projectId));

    console.log(`Deleted project: ${projectId}`);
  }

  // Data management method to clear all user data
  async clearAllUserData(userId: string): Promise<void> {
    // Get all user's projects (where they are the owner)
    const userProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.ownerId, userId));

    // For each project, delete all associated data
    for (const project of userProjects) {
      await this.deleteProject(project.id, userId);
    }

    console.log(`Cleared all data for user: ${userId}`);
  }

  // Version control methods
  async saveDocumentVersion(
    version: InsertDocumentVersion & { id: string; createdAt: Date | string }
  ): Promise<DocumentVersion> {
    const [result] = await db
      .insert(documentVersions)
      .values({
        id: version.id,
        fileId: version.fileId,
        versionNumber: version.versionNumber,
        content: version.content,
        contentHash: version.contentHash,
        title: version.title,
        createdBy: version.createdBy,
        comment: version.comment,
        isActive: version.isActive,
        size: version.size,
        metadata: version.metadata,
        createdAt:
          typeof version.createdAt === "string"
            ? new Date(version.createdAt)
            : version.createdAt,
      })
      .returning();

    return result;
  }

  async getVersionHistory(fileId: string): Promise<DocumentVersion[]> {
    return await db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.fileId, fileId))
      .orderBy(desc(documentVersions.versionNumber));
  }

  async getCurrentVersion(fileId: string): Promise<DocumentVersion | null> {
    const [result] = await db
      .select()
      .from(documentVersions)
      .where(
        and(
          eq(documentVersions.fileId, fileId),
          eq(documentVersions.isActive, true)
        )
      )
      .limit(1);

    return result || null;
  }

  async getVersion(
    fileId: string,
    versionNumber: number
  ): Promise<DocumentVersion | null> {
    const [result] = await db
      .select()
      .from(documentVersions)
      .where(
        and(
          eq(documentVersions.fileId, fileId),
          eq(documentVersions.versionNumber, versionNumber)
        )
      )
      .limit(1);

    return result || null;
  }

  async getRecentVersions(
    fileId: string,
    limit: number
  ): Promise<DocumentVersion[]> {
    return await db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.fileId, fileId))
      .orderBy(desc(documentVersions.createdAt))
      .limit(limit);
  }

  async deactivateVersion(versionId: string): Promise<void> {
    await db
      .update(documentVersions)
      .set({ isActive: false })
      .where(eq(documentVersions.id, versionId));
  }

  async getConflictResolution(
    conflictId: string
  ): Promise<ConflictResolution | null> {
    const [result] = await db
      .select()
      .from(conflictResolutions)
      .where(eq(conflictResolutions.id, conflictId))
      .limit(1);

    return result || null;
  }

  async updateConflictResolution(
    conflictId: string,
    updates: Partial<ConflictResolution>
  ): Promise<void> {
    await db
      .update(conflictResolutions)
      .set(updates)
      .where(eq(conflictResolutions.id, conflictId));
  }

  async saveConflictResolution(
    conflict: InsertConflictResolution & {
      id: string;
      createdAt: Date | string;
    }
  ): Promise<ConflictResolution> {
    const [result] = await db
      .insert(conflictResolutions)
      .values({
        id: conflict.id,
        fileId: conflict.fileId,
        baseVersion: conflict.baseVersion,
        conflictingVersions: conflict.conflictingVersions,
        conflicts: conflict.conflicts,
        status: conflict.status,
        resolvedBy: conflict.resolvedBy,
        createdAt:
          typeof conflict.createdAt === "string"
            ? new Date(conflict.createdAt)
            : conflict.createdAt,
      })
      .returning();

    return result;
  }

  // Notification methods
  async saveNotification(notification: {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    read: boolean;
    createdAt: Date;
  }): Promise<void> {
    await db.insert(notifications).values({
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || null,
      read: notification.read,
      createdAt: notification.createdAt,
    });
  }

  async getUserNotifications(
    userId: string,
    limit: number = 50
  ): Promise<
    Array<{
      id: string;
      userId: string;
      type: string;
      title: string;
      message: string;
      data: any;
      read: boolean;
      createdAt: Date;
    }>
  > {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return result.map((notification) => ({
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      read: notification.read || false,
      createdAt: notification.createdAt || new Date(),
    }));
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, notificationId));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.read, false))
      );

    return result[0]?.count || 0;
  }
}

export const storage = new DatabaseStorage();
