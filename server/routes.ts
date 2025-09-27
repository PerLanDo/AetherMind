import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { StorageService } from "./storage-service";
import { storage } from "./storage";
import { aiService } from "./ai-service";
import { citationService } from "./citation-service";
import { literatureService } from "./literature-service";
import { outlineService } from "./outline-service";
import { dataAnalysisService } from "./data-analysis-service";
import { setupAuth } from "./auth";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { files } from "@shared/schema";
import {
  insertProjectSchema,
  insertFileSchema,
  insertTaskSchema,
  insertConversationSchema,
  insertMessageSchema,
} from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Auth middleware
async function requireAuth(req: any, res: any, next: any) {
  // First try session authentication
  if (req.isAuthenticated() && req.user) {
    return next();
  }

  // Try JWT from Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    const JWT_SECRET = process.env.SESSION_SECRET || "fallback-secret-key";

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        username: string;
      };
      if (decoded) {
        // Get user from storage and attach to req.user
        const user = await storage.getUser(decoded.id);
        if (user) {
          req.user = user;
          return next();
        }
      }
    } catch (error) {
      // JWT verification failed, fall through to 401
    }
  }

  return res.status(401).json({ error: "Authentication required" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up authentication routes: /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
    });
  });

  // Project routes
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      // Return all projects where user is a member, with their role
      const projects = await storage.getUserProjectsWithRole(req.user!.id);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", requireAuth, async (req, res) => {
    try {
      const validated = insertProjectSchema.parse({
        ...req.body,
        ownerId: req.user!.id,
      });
      const project = await storage.createProject(validated);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid project data" });
    }
  });

  // Enhanced project routes with role-based access
  app.get("/api/projects/with-roles", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getUserProjectsWithRole(req.user!.id);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects with roles" });
    }
  });

  // Team management routes
  app.get("/api/projects/:projectId/members", requireAuth, async (req, res) => {
    try {
      // Check if user can view the project
      const canView = await storage.canUserViewProject(
        req.user!.id,
        req.params.projectId
      );
      if (!canView) {
        return res.status(403).json({ error: "Access denied to this project" });
      }

      const members = await storage.getProjectMembers(req.params.projectId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project members" });
    }
  });

  app.post(
    "/api/projects/:projectId/members",
    requireAuth,
    async (req, res) => {
      try {
        // Check if user can manage members (only owners)
        const canManage = await storage.canUserManageMembers(
          req.user!.id,
          req.params.projectId
        );
        if (!canManage) {
          return res
            .status(403)
            .json({ error: "Only project owners can add members" });
        }

        const { userId, role = "Viewer" } = req.body;

        if (!userId) {
          return res.status(400).json({ error: "User ID is required" });
        }

        // Validate role
        const validRoles = ["Owner", "Editor", "Viewer"];
        if (!validRoles.includes(role)) {
          return res
            .status(400)
            .json({ error: "Invalid role. Must be Owner, Editor, or Viewer" });
        }

        // Check if user exists
        const targetUser = await storage.getUser(userId);
        if (!targetUser) {
          return res.status(404).json({ error: "User not found" });
        }

        // Check if user is already a member
        const existingRole = await storage.getUserProjectRole(
          userId,
          req.params.projectId
        );
        if (existingRole) {
          return res
            .status(400)
            .json({ error: "User is already a member of this project" });
        }

        await storage.addProjectMember(req.params.projectId, userId, role);
        res.status(201).json({ message: "Member added successfully" });
      } catch (error) {
        res.status(500).json({ error: "Failed to add project member" });
      }
    }
  );

  app.put(
    "/api/projects/:projectId/members/:userId/role",
    requireAuth,
    async (req, res) => {
      try {
        // Check if user can manage members (only owners)
        const canManage = await storage.canUserManageMembers(
          req.user!.id,
          req.params.projectId
        );
        if (!canManage) {
          return res
            .status(403)
            .json({ error: "Only project owners can change member roles" });
        }

        const { role } = req.body;

        // Validate role
        const validRoles = ["Owner", "Editor", "Viewer"];
        if (!validRoles.includes(role)) {
          return res
            .status(400)
            .json({ error: "Invalid role. Must be Owner, Editor, or Viewer" });
        }

        // Prevent changing your own role
        if (req.params.userId === req.user!.id) {
          return res.status(400).json({ error: "Cannot change your own role" });
        }

        await storage.updateMemberRole(
          req.params.projectId,
          req.params.userId,
          role
        );
        res.json({ message: "Member role updated successfully" });
      } catch (error) {
        res.status(500).json({ error: "Failed to update member role" });
      }
    }
  );

  app.delete(
    "/api/projects/:projectId/members/:userId",
    requireAuth,
    async (req, res) => {
      try {
        // Check if user can manage members (only owners) OR if it's the user removing themselves
        const canManage = await storage.canUserManageMembers(
          req.user!.id,
          req.params.projectId
        );
        const isSelfRemoval = req.params.userId === req.user!.id;

        if (!canManage && !isSelfRemoval) {
          return res.status(403).json({
            error:
              "Only project owners can remove members, or users can remove themselves",
          });
        }

        // Prevent owner from removing themselves if they're the last owner
        if (isSelfRemoval) {
          const members = await storage.getProjectMembers(req.params.projectId);
          const owners = members.filter((m) => m.role === "Owner");
          if (owners.length === 1 && owners[0].id === req.user!.id) {
            return res
              .status(400)
              .json({ error: "Cannot remove the last owner from the project" });
          }
        }

        await storage.removeProjectMember(
          req.params.projectId,
          req.params.userId
        );
        res.json({ message: "Member removed successfully" });
      } catch (error) {
        res.status(500).json({ error: "Failed to remove project member" });
      }
    }
  );

  // User search for team invitations
  app.get("/api/users/search", requireAuth, async (req, res) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== "string" || query.length < 2) {
        return res
          .status(400)
          .json({ error: "Search query must be at least 2 characters" });
      }

      // For now, we'll implement a simple username search
      // In production, you might want to implement more sophisticated search
      const user = await storage.getUserByUsername(query);
      const results = user
        ? [{ id: user.id, username: user.username, email: user.email }]
        : [];

      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // Clear all user data endpoint
  app.delete("/api/user/data", requireAuth, async (req, res) => {
    try {
      await storage.clearAllUserData(req.user!.id);
      res.json({ message: "All user data cleared successfully" });
    } catch (error) {
      console.error("Error clearing user data:", error);
      res.status(500).json({ error: "Failed to clear user data" });
    }
  });

  // General files endpoint (for all user files across projects)
  app.get("/api/files", requireAuth, async (req, res) => {
    try {
      const { project_id, search } = req.query;
      const files = await storage.getUserFiles(req.user!.id, {
        projectId: project_id ? String(project_id) : undefined,
        search: search ? String(search) : undefined,
      });
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch files" });
    }
  });

  // File upload and management
  app.post(
    "/api/projects/:projectId/files",
    requireAuth,
    upload.single("file"),
    async (req, res) => {
      try {
        // Authorization check: verify user can edit the project (Editor or Owner)
        const canEdit = await storage.canUserEditProject(
          req.user!.id,
          req.params.projectId
        );
        if (!canEdit) {
          return res.status(403).json({
            error: "You need Editor or Owner permissions to upload files",
          });
        }

        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        // Validate file type for security
        const allowedTypes = [
          "text/plain",
          "text/csv",
          "application/json",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!allowedTypes.includes(req.file.mimetype)) {
          return res.status(400).json({
            error:
              "Unsupported file type. Please upload text, PDF, or Word documents.",
          });
        }

        // Extract text content for AI analysis
        const content = await aiService.extractTextContent(
          req.file.originalname,
          req.file.mimetype,
          req.file.buffer
        );

        const fileData = {
          name: req.file.filename || req.file.originalname,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          content,
          projectId: req.params.projectId,
          uploadedBy: req.user!.id,
          metadata: {
            originalSize: req.file.size,
            uploadedAt: new Date().toISOString(),
          },
        };

        // Validate with Zod schema
        const validated = insertFileSchema.parse(fileData);
        const file = await storage.createFile(validated);

        // Send notification about document upload
        try {
          const { notificationHelper } = await import("./notification-helper");
          await notificationHelper.notifyDocumentChange(
            file.id,
            req.user!.id,
            "created"
          );
        } catch (notificationError) {
          console.error(
            "Failed to send document upload notification:",
            notificationError
          );
          // Don't fail the request if notification fails
        }

        res.status(201).json(file);
      } catch (error) {
        console.error("File upload error:", error);
        if (error instanceof Error && error.name === "ZodError") {
          return res.status(400).json({
            error: "Invalid file data",
            details: (error as any).errors,
          });
        }
        res.status(500).json({ error: "File upload failed" });
      }
    }
  );

  app.get("/api/projects/:projectId/files", requireAuth, async (req, res) => {
    try {
      // Authorization check: verify user can view the project (any role)
      const canView = await storage.canUserViewProject(
        req.user!.id,
        req.params.projectId
      );
      if (!canView) {
        return res.status(403).json({ error: "Access denied to this project" });
      }

      const files = await storage.getProjectFiles(req.params.projectId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch files" });
    }
  });

  app.delete("/api/files/:fileId", requireAuth, async (req, res) => {
    try {
      // Authorization check: verify user has access to file's project and can edit
      const projectId = await storage.verifyFileAccess(
        req.user!.id,
        req.params.fileId
      );
      if (!projectId) {
        return res.status(403).json({ error: "Access denied to this file" });
      }

      // Check if user can edit the project (Editor or Owner)
      const canEdit = await storage.canUserEditProject(req.user!.id, projectId);
      if (!canEdit) {
        return res.status(403).json({
          error: "You need Editor or Owner permissions to delete files",
        });
      }

      await storage.deleteFile(req.params.fileId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  // Document analysis endpoint
  app.post("/api/files/:fileId/analyze", requireAuth, async (req, res) => {
    try {
      const projectId = await storage.verifyFileAccess(
        req.user!.id,
        req.params.fileId
      );
      if (!projectId) {
        return res.status(403).json({ error: "Access denied to this file" });
      }

      const file = await storage.getFile(req.params.fileId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      const { analysisType = "summary" } = req.body;
      const validAnalysisTypes = [
        "summary",
        "key_points",
        "research_questions",
        "methodology",
        "references",
      ];

      if (!validAnalysisTypes.includes(analysisType)) {
        return res.status(400).json({
          error: "Invalid analysis type",
          validTypes: validAnalysisTypes,
        });
      }

      const analysis = await aiService.analyzeDocument(
        file.content || "[No content available for analysis]",
        file.originalName || file.name,
        analysisType
      );

      res.json({
        fileId: req.params.fileId,
        fileName: file.originalName || file.name,
        analysisType,
        analysis,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Document analysis error:", error);
      res.status(500).json({ error: "Failed to analyze document" });
    }
  });

  // AI analysis routes
  app.post("/api/ai/analyze", requireAuth, async (req, res) => {
    try {
      const { text, prompt, fileId, projectId, analysisType = "qa" } = req.body;

      // Input validation
      if (!text && !fileId) {
        return res
          .status(400)
          .json({ error: "Either text or fileId must be provided" });
      }
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // If using fileId, verify project context to prevent cross-project leakage
      if (fileId && projectId) {
        // Verify user has access to the specified project
        const hasProjectAccess = await storage.verifyProjectAccess(
          req.user!.id,
          projectId
        );
        if (!hasProjectAccess) {
          return res
            .status(403)
            .json({ error: "Access denied to this project" });
        }

        // Verify user has access to file and it belongs to the specified project
        const fileProjectId = await storage.verifyFileAccess(
          req.user!.id,
          fileId
        );
        if (!fileProjectId) {
          return res.status(403).json({ error: "Access denied to this file" });
        }
        if (fileProjectId !== projectId) {
          return res
            .status(403)
            .json({ error: "File does not belong to the specified project" });
        }
      }

      let fileContext = "";
      if (fileId) {
        // If no projectId specified but fileId provided, still verify file access
        if (!projectId) {
          const fileProjectId = await storage.verifyFileAccess(
            req.user!.id,
            fileId
          );
          if (!fileProjectId) {
            return res
              .status(403)
              .json({ error: "Access denied to this file" });
          }
        }

        const file = await storage.getFile(fileId);
        fileContext = file?.content || "";
      }

      const result = await aiService.analyzeText({
        text,
        prompt,
        fileContext,
        analysisType,
      });

      res.json(result);
    } catch (error) {
      console.error("AI analysis error:", error);
      res.status(500).json({ error: "AI analysis failed" });
    }
  });

  // Citation routes
  app.post("/api/citations/generate", requireAuth, async (req, res) => {
    try {
      const { source, sourceType, format, extractedInfo } = req.body;

      // Input validation
      if (!source || !sourceType || !format) {
        return res.status(400).json({
          error: "source, sourceType, and format are required",
        });
      }

      const supportedFormats = ["apa", "mla", "chicago", "harvard", "ieee"];
      if (!supportedFormats.includes(format)) {
        return res.status(400).json({
          error: `Format must be one of: ${supportedFormats.join(", ")}`,
        });
      }

      const supportedTypes = ["url", "doi", "text", "manual"];
      if (!supportedTypes.includes(sourceType)) {
        return res.status(400).json({
          error: `Source type must be one of: ${supportedTypes.join(", ")}`,
        });
      }

      const citation = await citationService.generateCitation({
        source,
        sourceType,
        format,
        extractedInfo,
      });

      res.json(citation);
    } catch (error) {
      console.error("Citation generation error:", error);
      res.status(500).json({ error: "Failed to generate citation" });
    }
  });

  app.post("/api/citations/validate", requireAuth, async (req, res) => {
    try {
      const { citation, format } = req.body;

      if (!citation || !format) {
        return res.status(400).json({
          error: "citation and format are required",
        });
      }

      const validation = await citationService.validateCitation(
        citation,
        format
      );
      res.json(validation);
    } catch (error) {
      console.error("Citation validation error:", error);
      res.status(500).json({ error: "Failed to validate citation" });
    }
  });

  app.post("/api/citations/convert", requireAuth, async (req, res) => {
    try {
      const { citation, newFormat } = req.body;

      if (!citation || !newFormat) {
        return res.status(400).json({
          error: "citation and newFormat are required",
        });
      }

      const convertedCitation = await citationService.convertCitationFormat(
        citation,
        newFormat
      );
      res.json(convertedCitation);
    } catch (error) {
      console.error("Citation conversion error:", error);
      res.status(500).json({ error: "Failed to convert citation format" });
    }
  });

  app.post("/api/citations/bibliography", requireAuth, async (req, res) => {
    try {
      const { citations, format } = req.body;

      if (!citations || !Array.isArray(citations) || !format) {
        return res.status(400).json({
          error: "citations array and format are required",
        });
      }

      const bibliography = await citationService.generateBibliography(
        citations,
        format
      );
      res.json({ bibliography });
    } catch (error) {
      console.error("Bibliography generation error:", error);
      res.status(500).json({ error: "Failed to generate bibliography" });
    }
  });

  app.get("/api/citations/formats", requireAuth, async (req, res) => {
    try {
      const formats = {
        apa: citationService.getFormatGuidelines("apa"),
        mla: citationService.getFormatGuidelines("mla"),
        chicago: citationService.getFormatGuidelines("chicago"),
        harvard: citationService.getFormatGuidelines("harvard"),
        ieee: citationService.getFormatGuidelines("ieee"),
      };

      res.json(formats);
    } catch (error) {
      console.error("Format guidelines error:", error);
      res.status(500).json({ error: "Failed to get format guidelines" });
    }
  });

  // Chat routes
  app.post(
    "/api/projects/:projectId/conversations",
    requireAuth,
    async (req, res) => {
      try {
        // Authorization check: verify user can view the project (any role can create conversations)
        const canView = await storage.canUserViewProject(
          req.user!.id,
          req.params.projectId
        );
        if (!canView) {
          return res
            .status(403)
            .json({ error: "Access denied to this project" });
        }

        const conversationData = {
          ...req.body,
          projectId: req.params.projectId,
          createdBy: req.user!.id,
        };

        // Validate with Zod schema
        const validated = insertConversationSchema.parse(conversationData);
        const conversation = await storage.createConversation(validated);
        res.status(201).json(conversation);
      } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
          return res.status(400).json({
            error: "Invalid conversation data",
            details: (error as any).errors,
          });
        }
        res.status(500).json({ error: "Failed to create conversation" });
      }
    }
  );

  app.post(
    "/api/conversations/:conversationId/messages",
    requireAuth,
    async (req, res) => {
      try {
        const { content, fileIds = [] } = req.body;

        // Authorization check: verify user has access to conversation
        const projectId = await storage.verifyConversationAccess(
          req.user!.id,
          req.params.conversationId
        );
        if (!projectId) {
          return res
            .status(403)
            .json({ error: "Access denied to this conversation" });
        }

        // Input validation
        if (
          !content ||
          typeof content !== "string" ||
          content.trim().length === 0
        ) {
          return res.status(400).json({ error: "Message content is required" });
        }

        // Verify access to all referenced files AND ensure they belong to the same project
        if (fileIds.length > 0) {
          for (const fileId of fileIds) {
            const fileProjectId = await storage.verifyFileAccess(
              req.user!.id,
              fileId
            );
            if (!fileProjectId) {
              return res
                .status(403)
                .json({ error: `Access denied to file ${fileId}` });
            }
            // Critical security check: ensure file belongs to same project as conversation
            if (fileProjectId !== projectId) {
              return res.status(403).json({
                error: `File ${fileId} does not belong to this project`,
              });
            }
          }
        }

        // Validate and add user message
        const userMessageData = {
          conversationId: req.params.conversationId,
          content,
          sender: "user",
          senderId: req.user!.id,
          metadata: { fileIds },
        };

        const validatedUserMessage = insertMessageSchema.parse(userMessageData);
        const userMessage = await storage.addMessage(validatedUserMessage);

        // Get file contexts for AI
        const fileContexts = [];
        if (fileIds.length > 0) {
          for (const fileId of fileIds) {
            const file = await storage.getFile(fileId);
            if (file?.content) {
              fileContexts.push(file.content);
            }
          }
        }

        // Get conversation history (last 10 messages)
        const allMessages = await storage.getConversationMessages(
          req.params.conversationId
        );
        const conversationHistory = allMessages.slice(-10).map((msg) => ({
          role:
            msg.sender === "user" ? ("user" as const) : ("assistant" as const),
          content: msg.content,
        }));

        // Generate AI response
        const aiResponse = await aiService.chatWithContext(
          content,
          fileContexts,
          conversationHistory
        );

        // Validate and add AI message
        const aiMessageData = {
          conversationId: req.params.conversationId,
          content: aiResponse,
          sender: "ai",
          aiModel: "grok-4-fast",
          metadata: { fileContexts: fileIds },
        };

        const validatedAiMessage = insertMessageSchema.parse(aiMessageData);
        const aiMessage = await storage.addMessage(validatedAiMessage);

        res.json({ userMessage, aiMessage });
      } catch (error) {
        console.error("Chat error:", error);
        if (error instanceof Error && error.name === "ZodError") {
          return res.status(400).json({
            error: "Invalid message data",
            details: (error as any).errors,
          });
        }
        res.status(500).json({ error: "Chat failed" });
      }
    }
  );

  app.get(
    "/api/conversations/:conversationId/messages",
    requireAuth,
    async (req, res) => {
      try {
        // Authorization check: verify user has access to conversation
        const projectId = await storage.verifyConversationAccess(
          req.user!.id,
          req.params.conversationId
        );
        if (!projectId) {
          return res
            .status(403)
            .json({ error: "Access denied to this conversation" });
        }

        const messages = await storage.getConversationMessages(
          req.params.conversationId
        );
        res.json(messages);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages" });
      }
    }
  );

  // Task management routes
  app.post("/api/projects/:projectId/tasks", requireAuth, async (req, res) => {
    try {
      // Authorization check: verify user can edit the project (Editor or Owner)
      const canEdit = await storage.canUserEditProject(
        req.user!.id,
        req.params.projectId
      );
      if (!canEdit) {
        return res.status(403).json({
          error: "You need Editor or Owner permissions to create tasks",
        });
      }

      const taskData = {
        ...req.body,
        projectId: req.params.projectId,
        createdBy: req.user!.id,
      };

      // Validate with Zod schema
      const validated = insertTaskSchema.parse(taskData);
      const task = await storage.createTask(validated);

      // Send notification about task assignment if task is assigned to someone
      if (task.assignedTo && task.assignedTo !== req.user!.id) {
        try {
          const { notificationHelper } = await import("./notification-helper");
          await notificationHelper.notifyTaskAssignment(
            task.id,
            task.assignedTo,
            req.user!.id
          );
        } catch (notificationError) {
          console.error(
            "Failed to send task assignment notification:",
            notificationError
          );
          // Don't fail the request if notification fails
        }
      }

      res.status(201).json(task);
    } catch (error) {
      console.error("Task creation error:", error);
      if (error instanceof Error && error.name === "ZodError") {
        return res
          .status(400)
          .json({ 
            error: "Invalid task data", 
            details: (error as any).errors,
            receivedData: req.body 
          });
      }
      if (error instanceof Error) {
        return res.status(500).json({ error: "Failed to create task", details: error.message });
      }
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.get("/api/projects/:projectId/tasks", requireAuth, async (req, res) => {
    try {
      // Authorization check: verify user can view the project (any role)
      const canView = await storage.canUserViewProject(
        req.user!.id,
        req.params.projectId
      );
      if (!canView) {
        return res.status(403).json({ error: "Access denied to this project" });
      }

      const tasks = await storage.getProjectTasks(req.params.projectId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.patch("/api/tasks/:taskId/status", requireAuth, async (req, res) => {
    try {
      // Authorization check: verify user has access to task and can edit
      const projectId = await storage.verifyTaskAccess(
        req.user!.id,
        req.params.taskId
      );
      if (!projectId) {
        return res.status(403).json({ error: "Access denied to this task" });
      }

      // Check if user can edit the project (Editor or Owner)
      const canEdit = await storage.canUserEditProject(req.user!.id, projectId);
      if (!canEdit) {
        return res.status(403).json({
          error: "You need Editor or Owner permissions to update tasks",
        });
      }

      const { status, progress } = req.body;

      // Input validation
      const validStatuses = ["pending", "in_progress", "completed", "overdue"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          error: "Invalid status. Must be one of: " + validStatuses.join(", "),
        });
      }

      if (
        progress !== undefined &&
        (typeof progress !== "number" || progress < 0 || progress > 100)
      ) {
        return res
          .status(400)
          .json({ error: "Progress must be a number between 0 and 100" });
      }

      await storage.updateTaskStatus(req.params.taskId, status, progress);

      // Send notification about task status change
      try {
        const { notificationHelper } = await import("./notification-helper");
        await notificationHelper.notifyTaskStatusChange(
          req.params.taskId,
          status,
          req.user!.id
        );
      } catch (notificationError) {
        console.error(
          "Failed to send task status notification:",
          notificationError
        );
        // Don't fail the request if notification fails
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  // Notification Routes
  // Get user notifications
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const notifications = await storage.getUserNotifications(
        req.user!.id,
        limit
      );
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Get unread notification count
  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.user!.id);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  // Mark notification as read
  app.patch(
    "/api/notifications/:notificationId/read",
    requireAuth,
    async (req, res) => {
      try {
        await storage.markNotificationAsRead(req.params.notificationId);
        res.status(204).send();
      } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ error: "Failed to mark notification as read" });
      }
    }
  );

  // Mark all notifications as read
  app.patch(
    "/api/notifications/mark-all-read",
    requireAuth,
    async (req, res) => {
      try {
        await storage.markAllNotificationsAsRead(req.user!.id);
        res.status(204).send();
      } catch (error) {
        console.error("Error marking all notifications as read:", error);
        res
          .status(500)
          .json({ error: "Failed to mark all notifications as read" });
      }
    }
  );

  // Delete notification
  app.delete(
    "/api/notifications/:notificationId",
    requireAuth,
    async (req, res) => {
      try {
        await storage.deleteNotification(req.params.notificationId);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ error: "Failed to delete notification" });
      }
    }
  );

  // Literature discovery routes
  app.post("/api/literature/search", requireAuth, async (req, res) => {
    try {
      const { query, keywords, subject, dateRange, maxResults, projectId } =
        req.body;

      if (!query?.trim()) {
        return res.status(400).json({ error: "Search query is required" });
      }

      // Get document context from project if provided
      let documentContext = "";
      if (projectId) {
        const canView = await storage.canUserViewProject(
          req.user!.id,
          projectId
        );
        if (!canView) {
          return res
            .status(403)
            .json({ error: "Access denied to this project" });
        }

        // Get recent project files for context
        const files = await storage.getProjectFiles(projectId);
        const recentFiles = files.slice(0, 3); // Use up to 3 most recent files for context
        documentContext = recentFiles
          .map((file) => file.content)
          .filter(Boolean)
          .join("\n\n")
          .substring(0, 2000); // Limit context size
      }

      const literatureRequest = {
        query: query.trim(),
        keywords: keywords || [],
        subject,
        dateRange,
        maxResults: Math.min(maxResults || 15, 50),
        documentContext,
      };

      const results = await literatureService.searchLiterature(
        literatureRequest
      );
      res.json(results);
    } catch (error) {
      console.error("Literature search error:", error);
      res.status(500).json({ error: "Failed to search literature" });
    }
  });

  app.post(
    "/api/literature/suggest-from-document",
    requireAuth,
    async (req, res) => {
      try {
        const { fileId, maxResults } = req.body;

        if (!fileId) {
          return res.status(400).json({ error: "File ID is required" });
        }

        // Verify user has access to the file
        const projectId = await storage.verifyFileAccess(req.user!.id, fileId);
        if (!projectId) {
          return res.status(403).json({ error: "Access denied to this file" });
        }

        const file = await storage.getFile(fileId);
        if (!file) {
          return res.status(404).json({ error: "File not found" });
        }

        if (!file.content) {
          return res
            .status(400)
            .json({ error: "File content not available for analysis" });
        }

        const results = await literatureService.suggestFromDocument(
          file.content,
          file.originalName,
          maxResults || 10
        );

        res.json(results);
      } catch (error) {
        console.error("Document-based literature suggestion error:", error);
        res
          .status(500)
          .json({ error: "Failed to generate literature suggestions" });
      }
    }
  );

  // Get literature search history (optional enhancement)
  app.get("/api/literature/history", requireAuth, async (req, res) => {
    try {
      // This could be implemented to store and retrieve search history
      // For now, return empty array
      res.json({ searches: [] });
    } catch (error) {
      console.error("Literature history error:", error);
      res.status(500).json({ error: "Failed to fetch literature history" });
    }
  });

  // Outline builder routes
  app.post("/api/outline/generate", requireAuth, async (req, res) => {
    try {
      const {
        topic,
        type,
        length,
        customLength,
        style,
        requirements,
        sources,
        existingContent,
      } = req.body;

      if (!topic?.trim()) {
        return res.status(400).json({ error: "Topic is required" });
      }

      if (
        !type ||
        ![
          "thesis",
          "essay",
          "research-paper",
          "dissertation",
          "report",
          "article",
        ].includes(type)
      ) {
        return res
          .status(400)
          .json({ error: "Valid document type is required" });
      }

      const outlineRequest = {
        topic: topic.trim(),
        type,
        length: length || "medium",
        customLength,
        style: style || "academic",
        requirements,
        sources,
        existingContent,
      };

      const outline = await outlineService.generateOutline(outlineRequest);
      res.json(outline);
    } catch (error) {
      console.error("Outline generation error:", error);
      res.status(500).json({ error: "Failed to generate outline" });
    }
  });

  app.post("/api/outline/generate-draft", requireAuth, async (req, res) => {
    try {
      const {
        outlineSection,
        context,
        previousSections,
        targetWordCount,
        tone,
        includeTransitions,
      } = req.body;

      if (!outlineSection || !outlineSection.title) {
        return res.status(400).json({ error: "Outline section is required" });
      }

      const draftRequest = {
        outlineSection,
        context,
        previousSections,
        targetWordCount,
        tone: tone || "academic",
        includeTransitions: includeTransitions !== false,
      };

      const draft = await outlineService.generateSectionDraft(draftRequest);
      res.json(draft);
    } catch (error) {
      console.error("Draft generation error:", error);
      res.status(500).json({ error: "Failed to generate section draft" });
    }
  });

  app.post("/api/outline/improve", requireAuth, async (req, res) => {
    try {
      const { outline, feedback, type } = req.body;

      if (!outline || !Array.isArray(outline)) {
        return res
          .status(400)
          .json({ error: "Valid outline array is required" });
      }

      if (!feedback?.trim()) {
        return res.status(400).json({ error: "Feedback is required" });
      }

      const improvedOutline = await outlineService.improveOutline(
        outline,
        feedback.trim(),
        type || "essay"
      );

      res.json({ outline: improvedOutline });
    } catch (error) {
      console.error("Outline improvement error:", error);
      res.status(500).json({ error: "Failed to improve outline" });
    }
  });

  app.post("/api/outline/export", requireAuth, async (req, res) => {
    try {
      const { outline, format } = req.body;

      if (!outline || !Array.isArray(outline)) {
        return res
          .status(400)
          .json({ error: "Valid outline array is required" });
      }

      if (!format || !["markdown", "word", "latex", "json"].includes(format)) {
        return res.status(400).json({
          error:
            "Valid export format is required (markdown, word, latex, json)",
        });
      }

      const exportedContent = await outlineService.exportOutline(
        outline,
        format
      );

      const contentTypes = {
        markdown: "text/markdown",
        word: "text/plain",
        latex: "text/x-latex",
        json: "application/json",
      };

      const extensions = {
        markdown: "md",
        word: "txt",
        latex: "tex",
        json: "json",
      };

      res.setHeader(
        "Content-Type",
        contentTypes[format as keyof typeof contentTypes]
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="outline.${
          extensions[format as keyof typeof extensions]
        }"`
      );
      res.send(exportedContent);
    } catch (error) {
      console.error("Outline export error:", error);
      res.status(500).json({ error: "Failed to export outline" });
    }
  });

  // Data analysis routes
  app.post("/api/analysis/analyze", requireAuth, async (req, res) => {
    try {
      const { data, analysisType, variables, language, question, parameters } =
        req.body;

      if (
        !analysisType ||
        ![
          "descriptive_stats",
          "correlation",
          "regression",
          "visualization",
          "hypothesis_test",
          "code_generation",
          "data_cleaning",
          "exploratory",
        ].includes(analysisType)
      ) {
        return res
          .status(400)
          .json({ error: "Valid analysis type is required" });
      }

      const analysisRequest = {
        data,
        analysisType,
        variables,
        language: language || "python",
        question,
        parameters,
      };

      const results = await dataAnalysisService.analyzeData(analysisRequest);
      res.json(results);
    } catch (error) {
      console.error("Data analysis error:", error);
      res.status(500).json({ error: "Failed to perform data analysis" });
    }
  });

  app.post("/api/analysis/generate-code", requireAuth, async (req, res) => {
    try {
      const { analysisType, language, data, question, variables } = req.body;

      if (!analysisType) {
        return res.status(400).json({ error: "Analysis type is required" });
      }

      const codeRequest = {
        analysisType,
        language: language || "python",
        data,
        question,
        variables,
      };

      const codeResult = await dataAnalysisService.generateAnalysisCode(
        codeRequest
      );
      res.json(codeResult);
    } catch (error) {
      console.error("Code generation error:", error);
      res.status(500).json({ error: "Failed to generate analysis code" });
    }
  });

  app.post("/api/analysis/basic-stats", requireAuth, async (req, res) => {
    try {
      const { data } = req.body;

      if (!data || !Array.isArray(data)) {
        return res
          .status(400)
          .json({ error: "Numeric data array is required" });
      }

      const numericData = data.filter((val) => typeof val === "number");

      if (numericData.length === 0) {
        return res
          .status(400)
          .json({ error: "No numeric values found in data" });
      }

      const stats = dataAnalysisService.calculateBasicStats(numericData);
      res.json(stats);
    } catch (error) {
      console.error("Basic stats calculation error:", error);
      res.status(500).json({ error: "Failed to calculate basic statistics" });
    }
  });

  app.post("/api/analysis/correlation", requireAuth, async (req, res) => {
    try {
      const { x, y } = req.body;

      if (!Array.isArray(x) || !Array.isArray(y)) {
        return res
          .status(400)
          .json({ error: "Two numeric arrays (x and y) are required" });
      }

      const numericX = x.filter((val) => typeof val === "number");
      const numericY = y.filter((val) => typeof val === "number");

      if (numericX.length === 0 || numericY.length === 0) {
        return res
          .status(400)
          .json({ error: "No numeric values found in provided arrays" });
      }

      if (numericX.length !== numericY.length) {
        return res
          .status(400)
          .json({ error: "Arrays must have the same length" });
      }

      const correlation = dataAnalysisService.calculateCorrelation(
        numericX,
        numericY
      );
      res.json(correlation);
    } catch (error) {
      console.error("Correlation calculation error:", error);
      res.status(500).json({ error: "Failed to calculate correlation" });
    }
  });

  app.post("/api/analysis/parse-data", requireAuth, async (req, res) => {
    try {
      const { dataString } = req.body;

      if (!dataString?.trim()) {
        return res.status(400).json({ error: "Data string is required" });
      }

      const parsed = dataAnalysisService.parseDataString(dataString);
      res.json(parsed);
    } catch (error) {
      console.error("Data parsing error:", error);
      res.status(500).json({ error: "Failed to parse data string" });
    }
  });

  // Upload file endpoint
  app.post(
    "/api/files/upload",
    requireAuth,
    upload.single("file"),
    async (req, res) => {
      try {
        const file = req.file;
        const { projectId } = req.body;

        if (!file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        if (!projectId) {
          return res.status(400).json({ error: "Project ID is required" });
        }

        // Check if user can edit the project
        const canEdit = await storage.canUserEditProject(
          req.user!.id,
          projectId
        );
        if (!canEdit) {
          return res.status(403).json({
            error: "You need Editor or Owner permissions to upload files",
          });
        }

        // Upload to Backblaze B2
        const uploadResult = await StorageService.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          req.user!.id
        );

        // Extract text content for AI analysis
        const content = await aiService.extractTextContent(
          file.originalname,
          file.mimetype,
          file.buffer
        );

        // Save file metadata to database
        const [newFile] = await db
          .insert(files)
          .values({
            name: file.originalname,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: uploadResult.size,
            cloudKey: uploadResult.cloudKey,
            projectId: projectId,
            uploadedBy: req.user!.id,
            content: content,
            metadata: {
              originalSize: file.size,
              uploadedAt: new Date().toISOString(),
            },
          })
          .returning();

        res.json(newFile);
      } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Failed to upload file" });
      }
    }
  );

  // Download file endpoint - return signed URL
  app.get("/api/files/:id/download", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const [file] = await db.select().from(files).where(eq(files.id, id));

      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      // Check if user can view the project
      const canView = await storage.canUserViewProject(
        req.user!.id,
        file.projectId
      );
      if (!canView) {
        return res.status(403).json({ error: "Access denied to this file" });
      }

      if (!file.cloudKey) {
        // Fallback for files without cloudKey (old files)
        return res.json({ content: file.content, isLegacy: true });
      }

      // Generate signed URL for download
      const signedUrl = await StorageService.getSignedDownloadUrl(
        file.cloudKey,
        3600
      );

      res.json({
        downloadUrl: signedUrl.url,
        expiresIn: signedUrl.expiresIn,
        fileName: file.name,
        mimeType: file.mimeType,
      });
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ error: "Failed to generate download URL" });
    }
  });

  // Get file content for editing
  app.get("/api/files/:id/content", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const [file] = await db.select().from(files).where(eq(files.id, id));

      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      // Check if user can view the project
      const canView = await storage.canUserViewProject(
        req.user!.id,
        file.projectId
      );
      if (!canView) {
        return res.status(403).json({ error: "Access denied to this file" });
      }

      if (!file.cloudKey) {
        // Fallback for legacy files
        return res.json({ content: file.content });
      }

      // Download content from cloud for editing
      const buffer = await StorageService.downloadFile(file.cloudKey);
      const content = buffer.toString("utf-8");

      res.json({ content });
    } catch (error) {
      console.error("Content fetch error:", error);
      res.status(500).json({ error: "Failed to fetch file content" });
    }
  });

  // Update file content
  app.put("/api/files/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;

      const [existingFile] = await db
        .select()
        .from(files)
        .where(eq(files.id, id));

      if (!existingFile) {
        return res.status(404).json({ error: "File not found" });
      }

      // Check if user can edit the project
      const canEdit = await storage.canUserEditProject(
        req.user!.id,
        existingFile.projectId
      );
      if (!canEdit) {
        return res.status(403).json({
          error: "You need Editor or Owner permissions to update files",
        });
      }

      // Upload updated content to cloud
      const buffer = Buffer.from(content, "utf-8");
      const uploadResult = await StorageService.uploadFile(
        buffer,
        existingFile.name,
        existingFile.mimeType || "text/plain",
        req.user!.id
      );

      // Delete old version if it exists
      if (existingFile.cloudKey) {
        try {
          await StorageService.deleteFile(existingFile.cloudKey);
        } catch (error) {
          console.warn("Failed to delete old version:", error);
        }
      }

      // Update database record
      const [updatedFile] = await db
        .update(files)
        .set({
          content: content,
          updatedAt: new Date(),
          cloudKey: uploadResult.cloudKey,
          size: uploadResult.size,
        })
        .where(eq(files.id, id))
        .returning();

      res.json(updatedFile);
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ error: "Failed to update file" });
    }
  });

  // Delete file endpoint
  app.delete("/api/files/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const [file] = await db.select().from(files).where(eq(files.id, id));

      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      // Check if user can edit the project
      const canEdit = await storage.canUserEditProject(
        req.user!.id,
        file.projectId
      );
      if (!canEdit) {
        return res.status(403).json({
          error: "You need Editor or Owner permissions to delete files",
        });
      }

      // Delete from cloud storage
      if (file.cloudKey) {
        try {
          await StorageService.deleteFile(file.cloudKey);
        } catch (error) {
          console.warn("Failed to delete from cloud storage:", error);
        }
      }

      // Delete from database
      await db.delete(files).where(eq(files.id, id));

      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
