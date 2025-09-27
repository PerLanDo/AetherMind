import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { aiService } from "./ai-service";
import { setupAuth } from "./auth";
import { 
  insertProjectSchema, insertFileSchema, insertTaskSchema, 
  insertConversationSchema, insertMessageSchema 
} from "@shared/schema";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Auth middleware
function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up authentication routes: /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Project routes
  app.get('/api/projects', requireAuth, async (req, res) => {
    try {
      const projects = await storage.getUserProjects(req.user!.id);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  app.post('/api/projects', requireAuth, async (req, res) => {
    try {
      const validated = insertProjectSchema.parse({
        ...req.body,
        ownerId: req.user!.id
      });
      const project = await storage.createProject(validated);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: 'Invalid project data' });
    }
  });

  // File upload and management
  app.post('/api/projects/:projectId/files', requireAuth, upload.single('file'), async (req, res) => {
    try {
      // Authorization check: verify user has access to project
      const hasAccess = await storage.verifyProjectAccess(req.user!.id, req.params.projectId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Validate file type for security
      const allowedTypes = ['text/plain', 'text/csv', 'application/json', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Unsupported file type. Please upload text, PDF, or Word documents.' });
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
          uploadedAt: new Date().toISOString()
        }
      };

      // Validate with Zod schema
      const validated = insertFileSchema.parse(fileData);
      const file = await storage.createFile(validated);
      res.status(201).json(file);
    } catch (error) {
      console.error('File upload error:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid file data', details: (error as any).errors });
      }
      res.status(500).json({ error: 'File upload failed' });
    }
  });

  app.get('/api/projects/:projectId/files', requireAuth, async (req, res) => {
    try {
      // Authorization check: verify user has access to project
      const hasAccess = await storage.verifyProjectAccess(req.user!.id, req.params.projectId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }

      const files = await storage.getProjectFiles(req.params.projectId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch files' });
    }
  });

  app.delete('/api/files/:fileId', requireAuth, async (req, res) => {
    try {
      // Authorization check: verify user has access to file's project
      const projectId = await storage.verifyFileAccess(req.user!.id, req.params.fileId);
      if (!projectId) {
        return res.status(403).json({ error: 'Access denied to this file' });
      }

      await storage.deleteFile(req.params.fileId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete file' });
    }
  });

  // AI analysis routes
  app.post('/api/ai/analyze', requireAuth, async (req, res) => {
    try {
      const { text, prompt, fileId, projectId, analysisType = 'qa' } = req.body;
      
      // Input validation
      if (!text && !fileId) {
        return res.status(400).json({ error: 'Either text or fileId must be provided' });
      }
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }
      
      // If using fileId, verify project context to prevent cross-project leakage
      if (fileId && projectId) {
        // Verify user has access to the specified project
        const hasProjectAccess = await storage.verifyProjectAccess(req.user!.id, projectId);
        if (!hasProjectAccess) {
          return res.status(403).json({ error: 'Access denied to this project' });
        }
        
        // Verify user has access to file and it belongs to the specified project
        const fileProjectId = await storage.verifyFileAccess(req.user!.id, fileId);
        if (!fileProjectId) {
          return res.status(403).json({ error: 'Access denied to this file' });
        }
        if (fileProjectId !== projectId) {
          return res.status(403).json({ error: 'File does not belong to the specified project' });
        }
      }
      
      let fileContext = '';
      if (fileId) {
        // If no projectId specified but fileId provided, still verify file access
        if (!projectId) {
          const fileProjectId = await storage.verifyFileAccess(req.user!.id, fileId);
          if (!fileProjectId) {
            return res.status(403).json({ error: 'Access denied to this file' });
          }
        }
        
        const file = await storage.getFile(fileId);
        fileContext = file?.content || '';
      }

      const result = await aiService.analyzeText({
        text,
        prompt,
        fileContext,
        analysisType
      });

      res.json(result);
    } catch (error) {
      console.error('AI analysis error:', error);
      res.status(500).json({ error: 'AI analysis failed' });
    }
  });

  // Chat routes
  app.post('/api/projects/:projectId/conversations', requireAuth, async (req, res) => {
    try {
      // Authorization check: verify user has access to project
      const hasAccess = await storage.verifyProjectAccess(req.user!.id, req.params.projectId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }

      const conversationData = {
        ...req.body,
        projectId: req.params.projectId,
        createdBy: req.user!.id
      };
      
      // Validate with Zod schema
      const validated = insertConversationSchema.parse(conversationData);
      const conversation = await storage.createConversation(validated);
      res.status(201).json(conversation);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid conversation data', details: (error as any).errors });
      }
      res.status(500).json({ error: 'Failed to create conversation' });
    }
  });

  app.post('/api/conversations/:conversationId/messages', requireAuth, async (req, res) => {
    try {
      const { content, fileIds = [] } = req.body;
      
      // Authorization check: verify user has access to conversation
      const projectId = await storage.verifyConversationAccess(req.user!.id, req.params.conversationId);
      if (!projectId) {
        return res.status(403).json({ error: 'Access denied to this conversation' });
      }

      // Input validation
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      // Verify access to all referenced files AND ensure they belong to the same project
      if (fileIds.length > 0) {
        for (const fileId of fileIds) {
          const fileProjectId = await storage.verifyFileAccess(req.user!.id, fileId);
          if (!fileProjectId) {
            return res.status(403).json({ error: `Access denied to file ${fileId}` });
          }
          // Critical security check: ensure file belongs to same project as conversation
          if (fileProjectId !== projectId) {
            return res.status(403).json({ error: `File ${fileId} does not belong to this project` });
          }
        }
      }
      
      // Validate and add user message
      const userMessageData = {
        conversationId: req.params.conversationId,
        content,
        sender: 'user',
        senderId: req.user!.id,
        metadata: { fileIds }
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
      const allMessages = await storage.getConversationMessages(req.params.conversationId);
      const conversationHistory = allMessages
        .slice(-10)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
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
        sender: 'ai',
        aiModel: 'grok-4-fast',
        metadata: { fileContexts: fileIds }
      };
      
      const validatedAiMessage = insertMessageSchema.parse(aiMessageData);
      const aiMessage = await storage.addMessage(validatedAiMessage);

      res.json({ userMessage, aiMessage });
    } catch (error) {
      console.error('Chat error:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid message data', details: (error as any).errors });
      }
      res.status(500).json({ error: 'Chat failed' });
    }
  });

  app.get('/api/conversations/:conversationId/messages', requireAuth, async (req, res) => {
    try {
      // Authorization check: verify user has access to conversation
      const projectId = await storage.verifyConversationAccess(req.user!.id, req.params.conversationId);
      if (!projectId) {
        return res.status(403).json({ error: 'Access denied to this conversation' });
      }

      const messages = await storage.getConversationMessages(req.params.conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  // Task management routes
  app.post('/api/projects/:projectId/tasks', requireAuth, async (req, res) => {
    try {
      // Authorization check: verify user has access to project
      const hasAccess = await storage.verifyProjectAccess(req.user!.id, req.params.projectId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }

      const taskData = {
        ...req.body,
        projectId: req.params.projectId,
        createdBy: req.user!.id
      };
      
      // Validate with Zod schema
      const validated = insertTaskSchema.parse(taskData);
      const task = await storage.createTask(validated);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid task data', details: (error as any).errors });
      }
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  app.get('/api/projects/:projectId/tasks', requireAuth, async (req, res) => {
    try {
      // Authorization check: verify user has access to project
      const hasAccess = await storage.verifyProjectAccess(req.user!.id, req.params.projectId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this project' });
      }

      const tasks = await storage.getProjectTasks(req.params.projectId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  app.patch('/api/tasks/:taskId/status', requireAuth, async (req, res) => {
    try {
      // Authorization check: verify user has access to task
      const projectId = await storage.verifyTaskAccess(req.user!.id, req.params.taskId);
      if (!projectId) {
        return res.status(403).json({ error: 'Access denied to this task' });
      }

      const { status, progress } = req.body;
      
      // Input validation
      const validStatuses = ['pending', 'in_progress', 'completed', 'overdue'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
      }
      
      if (progress !== undefined && (typeof progress !== 'number' || progress < 0 || progress > 100)) {
        return res.status(400).json({ error: 'Progress must be a number between 0 and 100' });
      }
      
      await storage.updateTaskStatus(req.params.taskId, status, progress);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
