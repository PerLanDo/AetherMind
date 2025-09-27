import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectMembers = pgTable("project_members", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  projectId: varchar("project_id")
    .references(() => projects.id)
    .notNull(),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  role: text("role").notNull(), // 'Owner', 'Editor', 'Viewer'
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const files = pgTable("files", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  projectId: varchar("project_id")
    .references(() => projects.id)
    .notNull(),
  uploadedBy: varchar("uploaded_by")
    .references(() => users.id)
    .notNull(),
  content: text("content"), // Extracted text content for AI analysis
  metadata: jsonb("metadata"), // Additional file metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  projectId: varchar("project_id")
    .references(() => projects.id)
    .notNull(),
  title: text("title"),
  createdBy: varchar("created_by")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id")
    .references(() => conversations.id)
    .notNull(),
  content: text("content").notNull(),
  sender: text("sender").notNull(), // 'user' or 'ai'
  senderId: varchar("sender_id").references(() => users.id),
  aiModel: text("ai_model"), // 'grok-4-fast' etc.
  metadata: jsonb("metadata"), // Tool used, file references, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  projectId: varchar("project_id")
    .references(() => projects.id)
    .notNull(),
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdBy: varchar("created_by")
    .references(() => users.id)
    .notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed', 'overdue'
  priority: text("priority").notNull().default("medium"), // 'high', 'medium', 'low'
  dueDate: timestamp("due_date"),
  progress: integer("progress").default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documentVersions = pgTable("document_versions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  fileId: varchar("file_id")
    .references(() => files.id)
    .notNull(),
  versionNumber: integer("version_number").notNull(),
  content: text("content").notNull(),
  contentHash: varchar("content_hash").notNull(),
  title: text("title").notNull(),
  createdBy: varchar("created_by")
    .references(() => users.id)
    .notNull(),
  comment: text("comment"),
  isActive: boolean("is_active").default(true),
  size: integer("size").notNull(),
  metadata: jsonb("metadata").notNull(), // word count, changes, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const changeRecords = pgTable("change_records", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  versionId: varchar("version_id")
    .references(() => documentVersions.id)
    .notNull(),
  type: text("type").notNull(), // 'insertion', 'deletion', 'modification'
  position: jsonb("position").notNull(), // {line: number, column: number}
  oldContent: text("old_content"),
  newContent: text("new_content"),
  author: varchar("author")
    .references(() => users.id)
    .notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const conflictResolutions = pgTable("conflict_resolutions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  fileId: varchar("file_id")
    .references(() => files.id)
    .notNull(),
  baseVersion: integer("base_version").notNull(),
  conflictingVersions: jsonb("conflicting_versions").notNull(), // array of version numbers
  conflicts: jsonb("conflicts").notNull(), // conflict details
  status: text("status").notNull().default("pending"), // 'pending', 'resolved', 'auto-resolved'
  resolvedBy: varchar("resolved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const notifications = pgTable("notifications", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  type: text("type").notNull(), // 'task_assigned', 'task_completed', 'document_changed', 'deadline_reminder', 'team_update'
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // Additional notification data
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedProjects: many(projects),
  projectMemberships: many(projectMembers),
  uploadedFiles: many(files),
  createdConversations: many(conversations),
  sentMessages: many(messages),
  createdTasks: many(tasks),
  assignedTasks: many(tasks),
  notifications: many(notifications),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  members: many(projectMembers),
  files: many(files),
  conversations: many(conversations),
  tasks: many(tasks),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));

export const filesRelations = relations(files, ({ one, many }) => ({
  project: one(projects, {
    fields: [files.projectId],
    references: [projects.id],
  }),
  uploader: one(users, {
    fields: [files.uploadedBy],
    references: [users.id],
  }),
  versions: many(documentVersions),
}));

export const documentVersionsRelations = relations(
  documentVersions,
  ({ one, many }) => ({
    file: one(files, {
      fields: [documentVersions.fileId],
      references: [files.id],
    }),
    author: one(users, {
      fields: [documentVersions.createdBy],
      references: [users.id],
    }),
    changes: many(changeRecords),
  })
);

export const changeRecordsRelations = relations(changeRecords, ({ one }) => ({
  version: one(documentVersions, {
    fields: [changeRecords.versionId],
    references: [documentVersions.id],
  }),
  author: one(users, {
    fields: [changeRecords.author],
    references: [users.id],
  }),
}));

export const conflictResolutionsRelations = relations(
  conflictResolutions,
  ({ one }) => ({
    file: one(files, {
      fields: [conflictResolutions.fileId],
      references: [files.id],
    }),
    resolver: one(users, {
      fields: [conflictResolutions.resolvedBy],
      references: [users.id],
    }),
  })
);

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [conversations.projectId],
      references: [projects.id],
    }),
    creator: one(users, {
      fields: [conversations.createdBy],
      references: [users.id],
    }),
    messages: many(messages),
  })
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentVersionSchema = createInsertSchema(
  documentVersions
).omit({
  id: true,
  createdAt: true,
});

export const insertChangeRecordSchema = createInsertSchema(changeRecords).omit({
  id: true,
  timestamp: true,
});

export const insertConflictResolutionSchema = createInsertSchema(
  conflictResolutions
).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertDocumentVersion = z.infer<typeof insertDocumentVersionSchema>;
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertChangeRecord = z.infer<typeof insertChangeRecordSchema>;
export type ChangeRecord = typeof changeRecords.$inferSelect;
export type InsertConflictResolution = z.infer<
  typeof insertConflictResolutionSchema
>;
export type ConflictResolution = typeof conflictResolutions.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
