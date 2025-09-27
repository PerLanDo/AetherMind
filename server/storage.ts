import {
  users,
  files,
  projects,
  projectMembers,
  conversations,
  messages,
  tasks,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or, ilike } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

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

  // Data management
  clearAllUserData(userId: string): Promise<void>;

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

  // Data management method to clear all user data
  async clearAllUserData(userId: string): Promise<void> {
    // Get all user's projects (where they are the owner)
    const userProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.ownerId, userId));

    // For each project, delete all associated data
    for (const project of userProjects) {
      // Get all conversations for this project
      const projectConversations = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.projectId, project.id));

      // Delete messages for each conversation
      for (const conversation of projectConversations) {
        await db
          .delete(messages)
          .where(eq(messages.conversationId, conversation.id));
      }

      // Delete conversations
      await db
        .delete(conversations)
        .where(eq(conversations.projectId, project.id));

      // Delete tasks
      await db.delete(tasks).where(eq(tasks.projectId, project.id));

      // Delete files
      await db.delete(files).where(eq(files.projectId, project.id));

      // Delete project members
      await db
        .delete(projectMembers)
        .where(eq(projectMembers.projectId, project.id));

      // Delete the project itself
      await db.delete(projects).where(eq(projects.id, project.id));
    }

    console.log(`Cleared all data for user: ${userId}`);
  }
}

export const storage = new DatabaseStorage();
