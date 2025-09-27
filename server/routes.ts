import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { aiService } from "./ai-service";
import { setupAuth } from "./auth";
import {
  insertProjectSchema,
  insertFileSchema,
  insertTaskSchema,
  insertConversationSchema,
  insertMessageSchema,
  insertTeamSchema,
  insertTeamMemberSchema,
  insertUserRoleSchema,
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

  // Project routes
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const projects = await storage.getUserProjects(req.user!.id);
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
        // Authorization check: verify user has access to project
        const hasAccess = await storage.verifyProjectAccess(
          req.user!.id,
          req.params.projectId
        );
        if (!hasAccess) {
          return res
            .status(403)
            .json({ error: "Access denied to this project" });
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
      // Authorization check: verify user has access to project
      const hasAccess = await storage.verifyProjectAccess(
        req.user!.id,
        req.params.projectId
      );
      if (!hasAccess) {
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
      // Authorization check: verify user has access to file's project
      const projectId = await storage.verifyFileAccess(
        req.user!.id,
        req.params.fileId
      );
      if (!projectId) {
        return res.status(403).json({ error: "Access denied to this file" });
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

  // Chat routes
  app.post(
    "/api/projects/:projectId/conversations",
    requireAuth,
    async (req, res) => {
      try {
        // Authorization check: verify user has access to project
        const hasAccess = await storage.verifyProjectAccess(
          req.user!.id,
          req.params.projectId
        );
        if (!hasAccess) {
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
      // Authorization check: verify user has access to project
      const hasAccess = await storage.verifyProjectAccess(
        req.user!.id,
        req.params.projectId
      );
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this project" });
      }

      const taskData = {
        ...req.body,
        projectId: req.params.projectId,
        createdBy: req.user!.id,
      };

      // Validate with Zod schema
      const validated = insertTaskSchema.parse(taskData);
      const task = await storage.createTask(validated);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res
          .status(400)
          .json({ error: "Invalid task data", details: (error as any).errors });
      }
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.get("/api/projects/:projectId/tasks", requireAuth, async (req, res) => {
    try {
      // Authorization check: verify user has access to project
      const hasAccess = await storage.verifyProjectAccess(
        req.user!.id,
        req.params.projectId
      );
      if (!hasAccess) {
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
      // Authorization check: verify user has access to task
      const projectId = await storage.verifyTaskAccess(
        req.user!.id,
        req.params.taskId
      );
      if (!projectId) {
        return res.status(403).json({ error: "Access denied to this task" });
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
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  // Role-based user management endpoints

  // Team management endpoints
  app.post("/api/teams", requireAuth, async (req, res) => {
    try {
      const teamData = {
        ...req.body,
        ownerId: req.user!.id,
      };

      const validated = insertTeamSchema.parse(teamData);
      const team = await storage.createTeam(validated);

      // Automatically add the owner as an admin member of the team
      await storage.addTeamMember(team.id, req.user!.id, "admin");

      res.status(201).json(team);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({
          error: "Invalid team data",
          details: (error as any).errors,
        });
      }
      res.status(500).json({ error: "Failed to create team" });
    }
  });

  app.get("/api/teams/:id/members", requireAuth, async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      if (isNaN(teamId)) {
        return res.status(400).json({ error: "Invalid team ID" });
      }

      // Check if user has access to this team
      const teamMembership = await storage.getTeamMembership(req.user!.id, teamId);
      const team = await storage.getTeam(teamId);
      
      if (!teamMembership && team?.ownerId !== req.user!.id) {
        return res.status(403).json({ error: "Access denied to this team" });
      }

      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  app.post("/api/teams/:id/invite", requireAuth, async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      if (isNaN(teamId)) {
        return res.status(400).json({ error: "Invalid team ID" });
      }

      // Check if user can invite members (must be team owner or admin)
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      const membership = await storage.getTeamMembership(req.user!.id, teamId);
      const canInvite = team.ownerId === req.user!.id || 
                       (membership && membership.role === 'admin');
      
      if (!canInvite) {
        return res.status(403).json({ 
          error: "Access denied. Only team owners and admins can invite members" 
        });
      }

      const { userId, role = "member" } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      // Validate role
      const validRoles = ["admin", "member", "viewer"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          error: "Invalid role. Must be one of: " + validRoles.join(", ") 
        });
      }

      // Check if user is already a member
      const existingMembership = await storage.getTeamMembership(userId, teamId);
      if (existingMembership) {
        return res.status(400).json({ error: "User is already a team member" });
      }

      const teamMember = await storage.addTeamMember(teamId, userId, role);
      res.status(201).json(teamMember);
    } catch (error) {
      res.status(500).json({ error: "Failed to invite team member" });
    }
  });

  // User role management endpoints
  app.put("/api/users/:id/role", requireAuth, async (req, res) => {
    try {
      const targetUserId = req.params.id;
      const { role, projectId } = req.body;

      // Validate role
      const validRoles = ["admin", "member", "viewer"];
      if (!role || !validRoles.includes(role)) {
        return res.status(400).json({
          error: "Invalid role. Must be one of: " + validRoles.join(", "),
        });
      }

      // Check if user can manage the target user
      const userRoles = await storage.getUserRoles(req.user!.id);
      const isAdmin = userRoles.some(r => r.role === 'admin');
      const isSelf = targetUserId === req.user!.id;

      if (!isAdmin && !isSelf) {
        return res.status(403).json({ 
          error: "Access denied. Only admins can modify other users' roles" 
        });
      }

      // If projectId is specified, verify user has access to that project
      if (projectId) {
        const hasProjectAccess = await storage.verifyProjectAccess(req.user!.id, projectId);
        if (!hasProjectAccess) {
          return res.status(403).json({ error: "Access denied to this project" });
        }
      }

      // Remove existing roles for this user/project combination
      const existingRoles = projectId 
        ? await storage.getUserRolesForProject(targetUserId, projectId)
        : await storage.getUserRoles(targetUserId).then(roles => roles.filter(r => !r.projectId));

      for (const existingRole of existingRoles) {
        await storage.removeUserRole(targetUserId, existingRole.role, existingRole.projectId || undefined);
      }

      // Assign new role
      await storage.assignUserRole(targetUserId, role, projectId);

      res.json({ success: true, message: "User role updated successfully" });
    } catch (error) {
      console.error("Role update error:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  app.get("/api/users/me/permissions", requireAuth, async (req, res) => {
    try {
      const allRoles = await storage.getUserRoles(req.user!.id);
      const userTeams = await storage.getUserTeams(req.user!.id);
      
      // Separate global and project-specific roles
      const globalRoles = allRoles
        .filter(role => !role.projectId)
        .map(role => role.role);
      
      const projectRoles: { [projectId: string]: string[] } = {};
      allRoles
        .filter(role => role.projectId)
        .forEach(role => {
          if (!projectRoles[role.projectId!]) {
            projectRoles[role.projectId!] = [];
          }
          projectRoles[role.projectId!].push(role.role);
        });

      // Get team memberships
      const teamMemberships = [];
      for (const team of userTeams) {
        const membership = await storage.getTeamMembership(req.user!.id, team.id);
        if (membership) {
          teamMemberships.push({
            teamId: team.id,
            teamName: team.name,
            role: membership.role,
          });
        }
      }

      res.json({
        userId: req.user!.id,
        globalRoles,
        projectRoles,
        teamMemberships,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user permissions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
