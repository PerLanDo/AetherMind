import { WebSocketServer, WebSocket } from "ws";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import { storage } from "./storage";

export interface NotificationData {
  id: string;
  type:
    | "task_assigned"
    | "task_updated"
    | "deadline_reminder"
    | "document_changed"
    | "team_update"
    | "system_alert";
  title: string;
  message: string;
  userId: string;
  projectId?: string;
  relatedId?: string; // task id, file id, etc.
  priority: "low" | "medium" | "high" | "urgent";
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface WebSocketClient {
  ws: WebSocket;
  userId: string;
  isAuthenticated: boolean;
  subscribedProjects: string[];
  lastSeen: Date;
}

export class NotificationService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocketClient> = new Map();
  private server: Server | null = null;

  initialize(server: Server): void {
    this.server = server;
    this.wss = new WebSocketServer({
      server,
      path: "/notifications",
    });

    this.wss.on("connection", (ws: WebSocket, req) => {
      console.log("New WebSocket connection");

      // Initialize client
      const clientId = this.generateClientId();
      const client: WebSocketClient = {
        ws,
        userId: "",
        isAuthenticated: false,
        subscribedProjects: [],
        lastSeen: new Date(),
      };

      this.clients.set(clientId, client);

      // Handle messages
      ws.on("message", async (message: string) => {
        try {
          await this.handleClientMessage(clientId, message);
        } catch (error) {
          console.error("Error handling client message:", error);
          this.sendError(clientId, "Failed to process message");
        }
      });

      // Handle client disconnect
      ws.on("close", () => {
        console.log(`Client ${clientId} disconnected`);
        this.clients.delete(clientId);
      });

      // Handle errors
      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        this.clients.delete(clientId);
      });

      // Send welcome message
      this.sendMessage(clientId, {
        type: "system",
        action: "connected",
        data: { clientId, timestamp: new Date().toISOString() },
      });
    });

    // Clean up inactive clients every 5 minutes
    setInterval(() => {
      this.cleanupInactiveClients();
    }, 5 * 60 * 1000);

    console.log("NotificationService initialized with WebSocket support");
  }

  private async handleClientMessage(
    clientId: string,
    message: string
  ): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    let parsedMessage: any;
    try {
      parsedMessage = JSON.parse(message);
    } catch (error) {
      this.sendError(clientId, "Invalid JSON message");
      return;
    }

    const { type, action, data } = parsedMessage;

    switch (type) {
      case "auth":
        await this.handleAuthentication(clientId, data);
        break;

      case "subscribe":
        await this.handleSubscription(clientId, data);
        break;

      case "unsubscribe":
        await this.handleUnsubscription(clientId, data);
        break;

      case "mark_read":
        await this.handleMarkAsRead(clientId, data);
        break;

      case "ping":
        this.handlePing(clientId);
        break;

      default:
        this.sendError(clientId, `Unknown message type: ${type}`);
    }
  }

  private async handleAuthentication(
    clientId: string,
    data: any
  ): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { token } = data;
    if (!token) {
      this.sendError(clientId, "Authentication token required");
      return;
    }

    try {
      const JWT_SECRET = process.env.SESSION_SECRET || "fallback-secret-key";
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        username: string;
      };

      // Verify user exists
      const user = await storage.getUser(decoded.id);
      if (!user) {
        this.sendError(clientId, "Invalid user");
        return;
      }

      // Update client
      client.userId = user.id;
      client.isAuthenticated = true;
      client.lastSeen = new Date();

      // Get user's projects for auto-subscription
      const projects = await storage.getUserProjectsWithRole(user.id);
      client.subscribedProjects = projects.map((p) => p.id);

      this.sendMessage(clientId, {
        type: "auth",
        action: "success",
        data: {
          userId: user.id,
          username: user.username,
          subscribedProjects: client.subscribedProjects,
        },
      });

      // Send any pending notifications
      await this.sendPendingNotifications(clientId);
    } catch (error) {
      console.error("Authentication error:", error);
      this.sendError(clientId, "Authentication failed");
    }
  }

  private async handleSubscription(clientId: string, data: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client || !client.isAuthenticated) {
      this.sendError(clientId, "Authentication required");
      return;
    }

    const { projectId } = data;
    if (!projectId) {
      this.sendError(clientId, "Project ID required");
      return;
    }

    // Verify user has access to project
    const hasAccess = await storage.verifyProjectAccess(
      client.userId,
      projectId
    );
    if (!hasAccess) {
      this.sendError(clientId, "Access denied to project");
      return;
    }

    // Add to subscriptions
    if (!client.subscribedProjects.includes(projectId)) {
      client.subscribedProjects.push(projectId);
    }

    this.sendMessage(clientId, {
      type: "subscription",
      action: "success",
      data: { projectId, subscribed: true },
    });
  }

  private async handleUnsubscription(
    clientId: string,
    data: any
  ): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { projectId } = data;
    client.subscribedProjects = client.subscribedProjects.filter(
      (id) => id !== projectId
    );

    this.sendMessage(clientId, {
      type: "subscription",
      action: "success",
      data: { projectId, subscribed: false },
    });
  }

  private async handleMarkAsRead(clientId: string, data: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client || !client.isAuthenticated) return;

    const { notificationId } = data;
    if (notificationId) {
      // Mark specific notification as read
      await this.markNotificationAsRead(notificationId, client.userId);
    }

    this.sendMessage(clientId, {
      type: "notification",
      action: "marked_read",
      data: { notificationId },
    });
  }

  private handlePing(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastSeen = new Date();
      this.sendMessage(clientId, {
        type: "pong",
        action: "response",
        data: { timestamp: new Date().toISOString() },
      });
    }
  }

  // Public methods for sending notifications

  async sendNotification(notification: NotificationData): Promise<void> {
    try {
      // Save notification to database
      await this.saveNotification(notification);

      // Send to connected clients
      await this.broadcastToUser(notification.userId, {
        type: "notification",
        action: "new",
        data: notification,
      });

      // Send to project subscribers if applicable
      if (notification.projectId) {
        await this.broadcastToProject(
          notification.projectId,
          {
            type: "notification",
            action: "project_update",
            data: notification,
          },
          notification.userId
        ); // Exclude the sender
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }

  async sendTaskNotification(
    type: "assigned" | "updated" | "completed",
    taskId: string,
    assigneeId?: string
  ): Promise<void> {
    try {
      // Get task details
      const task = await this.getTaskDetails(taskId);
      if (!task) return;

      let notification: NotificationData;

      switch (type) {
        case "assigned":
          notification = {
            id: this.generateNotificationId(),
            type: "task_assigned",
            title: "New Task Assigned",
            message: `You have been assigned to task: ${task.title}`,
            userId: assigneeId || task.assignedTo || "",
            projectId: task.projectId,
            relatedId: taskId,
            priority: task.priority === "high" ? "high" : "medium",
            timestamp: new Date().toISOString(),
            read: false,
            actionUrl: `/tasks/${taskId}`,
            metadata: { taskTitle: task.title, dueDate: task.dueDate },
          };
          break;

        case "updated":
          notification = {
            id: this.generateNotificationId(),
            type: "task_updated",
            title: "Task Updated",
            message: `Task "${task.title}" has been updated`,
            userId: task.assignedTo || "",
            projectId: task.projectId,
            relatedId: taskId,
            priority: "medium",
            timestamp: new Date().toISOString(),
            read: false,
            actionUrl: `/tasks/${taskId}`,
            metadata: { taskTitle: task.title, status: task.status },
          };
          break;

        case "completed":
          notification = {
            id: this.generateNotificationId(),
            type: "task_updated",
            title: "Task Completed",
            message: `Task "${task.title}" has been marked as completed`,
            userId: task.createdBy,
            projectId: task.projectId,
            relatedId: taskId,
            priority: "low",
            timestamp: new Date().toISOString(),
            read: false,
            actionUrl: `/tasks/${taskId}`,
            metadata: { taskTitle: task.title, completedBy: task.assignedTo },
          };
          break;
      }

      await this.sendNotification(notification);
    } catch (error) {
      console.error("Error sending task notification:", error);
    }
  }

  async sendDeadlineReminder(
    taskId: string,
    hoursUntilDeadline: number
  ): Promise<void> {
    try {
      const task = await this.getTaskDetails(taskId);
      if (!task || !task.assignedTo) return;

      const urgencyLevel =
        hoursUntilDeadline <= 2
          ? "urgent"
          : hoursUntilDeadline <= 24
          ? "high"
          : "medium";

      const notification: NotificationData = {
        id: this.generateNotificationId(),
        type: "deadline_reminder",
        title: "Deadline Approaching",
        message: `Task "${task.title}" is due in ${hoursUntilDeadline} hours`,
        userId: task.assignedTo,
        projectId: task.projectId,
        relatedId: taskId,
        priority: urgencyLevel,
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: `/tasks/${taskId}`,
        metadata: {
          taskTitle: task.title,
          dueDate: task.dueDate,
          hoursRemaining: hoursUntilDeadline,
        },
      };

      await this.sendNotification(notification);
    } catch (error) {
      console.error("Error sending deadline reminder:", error);
    }
  }

  async sendDocumentChangeNotification(
    fileId: string,
    changedBy: string,
    changeType: string
  ): Promise<void> {
    try {
      const file = await this.getFileDetails(fileId);
      if (!file) return;

      // Get project members to notify
      const members = await storage.getProjectMembers(file.projectId);

      for (const member of members) {
        if (member.id === changedBy) continue; // Don't notify the person who made the change

        const notification: NotificationData = {
          id: this.generateNotificationId(),
          type: "document_changed",
          title: "Document Updated",
          message: `"${file.name}" has been ${changeType}`,
          userId: member.id,
          projectId: file.projectId,
          relatedId: fileId,
          priority: "medium",
          timestamp: new Date().toISOString(),
          read: false,
          actionUrl: `/files/${fileId}`,
          metadata: {
            fileName: file.name,
            changeType,
            changedBy: changedBy,
          },
        };

        await this.sendNotification(notification);
      }
    } catch (error) {
      console.error("Error sending document change notification:", error);
    }
  }

  async sendTeamUpdateNotification(
    projectId: string,
    updateType: string,
    details: any
  ): Promise<void> {
    try {
      const members = await storage.getProjectMembers(projectId);

      for (const member of members) {
        const notification: NotificationData = {
          id: this.generateNotificationId(),
          type: "team_update",
          title: "Team Update",
          message: this.getTeamUpdateMessage(updateType, details),
          userId: member.id,
          projectId,
          relatedId: projectId,
          priority: "medium",
          timestamp: new Date().toISOString(),
          read: false,
          actionUrl: `/projects/${projectId}`,
          metadata: { updateType, details },
        };

        await this.sendNotification(notification);
      }
    } catch (error) {
      console.error("Error sending team update notification:", error);
    }
  }

  // Private helper methods

  private async broadcastToUser(userId: string, message: any): Promise<void> {
    Array.from(this.clients.entries()).forEach(([clientId, client]) => {
      if (client.userId === userId && client.isAuthenticated) {
        this.sendMessage(clientId, message);
      }
    });
  }

  private async broadcastToProject(
    projectId: string,
    message: any,
    excludeUserId?: string
  ): Promise<void> {
    Array.from(this.clients.entries()).forEach(([clientId, client]) => {
      if (
        client.isAuthenticated &&
        client.subscribedProjects.includes(projectId) &&
        client.userId !== excludeUserId
      ) {
        this.sendMessage(clientId, message);
      }
    });
  }

  private sendMessage(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  private sendError(clientId: string, error: string): void {
    this.sendMessage(clientId, {
      type: "error",
      action: "message",
      data: { error, timestamp: new Date().toISOString() },
    });
  }

  private async sendPendingNotifications(clientId: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const pendingNotifications = await this.getPendingNotifications(
        client.userId
      );

      if (pendingNotifications.length > 0) {
        this.sendMessage(clientId, {
          type: "notifications",
          action: "pending",
          data: { notifications: pendingNotifications },
        });
      }
    } catch (error) {
      console.error("Error sending pending notifications:", error);
    }
  }

  private cleanupInactiveClients(): void {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    Array.from(this.clients.entries()).forEach(([clientId, client]) => {
      if (client.lastSeen < fiveMinutesAgo) {
        console.log(`Cleaning up inactive client: ${clientId}`);
        client.ws.terminate();
        this.clients.delete(clientId);
      }
    });
  }

  private generateClientId(): string {
    return "client_" + Math.random().toString(36).substr(2, 9);
  }

  private generateNotificationId(): string {
    return "notif_" + Math.random().toString(36).substr(2, 9);
  }

  private getTeamUpdateMessage(updateType: string, details: any): string {
    switch (updateType) {
      case "member_added":
        return `${details.username} has joined the project`;
      case "member_removed":
        return `${details.username} has left the project`;
      case "role_changed":
        return `${details.username}'s role has been changed to ${details.newRole}`;
      case "project_updated":
        return `Project settings have been updated`;
      default:
        return `Team update: ${updateType}`;
    }
  }

  // Database operations (these would need to be implemented)
  private async saveNotification(
    notification: NotificationData
  ): Promise<void> {
    // TODO: Implement database storage for notifications
    console.log("Saving notification:", notification.id);
  }

  private async markNotificationAsRead(
    notificationId: string,
    userId: string
  ): Promise<void> {
    // TODO: Implement database update for read status
    console.log("Marking notification as read:", notificationId);
  }

  private async getPendingNotifications(
    userId: string
  ): Promise<NotificationData[]> {
    // TODO: Implement database query for unread notifications
    return [];
  }

  private async getTaskDetails(taskId: string): Promise<any> {
    // TODO: Get full task details from storage
    return null;
  }

  private async getFileDetails(fileId: string): Promise<any> {
    // TODO: Get full file details from storage
    return null;
  }

  // Scheduled notification methods
  startDeadlineChecker(): void {
    // Check for upcoming deadlines every hour
    setInterval(async () => {
      await this.checkUpcomingDeadlines();
    }, 60 * 60 * 1000);

    console.log("Deadline checker started");
  }

  private async checkUpcomingDeadlines(): Promise<void> {
    try {
      // TODO: Implement deadline checking logic
      console.log("Checking upcoming deadlines...");
    } catch (error) {
      console.error("Error checking deadlines:", error);
    }
  }

  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  getAuthenticatedClientsCount(): number {
    return Array.from(this.clients.values()).filter((c) => c.isAuthenticated)
      .length;
  }
}

export const notificationService = new NotificationService();
