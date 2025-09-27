import { storage } from "./storage";
import { NotificationService } from "./notification-service";
import { db } from "./db";
import { tasks } from "@shared/schema";
import { eq, and, gte, lt, ne } from "drizzle-orm";

export class NotificationHelper {
  private static instance: NotificationHelper | null = null;
  private notificationService: NotificationService | null = null;

  static getInstance(): NotificationHelper {
    if (!NotificationHelper.instance) {
      NotificationHelper.instance = new NotificationHelper();
    }
    return NotificationHelper.instance;
  }

  setNotificationService(service: NotificationService) {
    this.notificationService = service;
  }

  async notifyTaskAssignment(
    taskId: string,
    assignedToUserId: string,
    assignedByUserId: string
  ) {
    try {
      // Get task details
      const task = await this.getTaskDetails(taskId);
      if (!task) return;

      // Don't notify if user assigned task to themselves
      if (assignedToUserId === assignedByUserId) return;

      const assignedByUser = await storage.getUser(assignedByUserId);
      if (!assignedByUser) return;

      await this.createAndBroadcastNotification({
        userId: assignedToUserId,
        type: "task_assigned",
        title: "New Task Assignment",
        message: `You have been assigned to task "${task.title}" by ${assignedByUser.username}`,
        data: {
          taskId: task.id,
          projectId: task.projectId,
          assignedBy: assignedByUser.username,
          dueDate: task.dueDate,
        },
      });
    } catch (error) {
      console.error("Failed to send task assignment notification:", error);
    }
  }

  async notifyTaskStatusChange(
    taskId: string,
    newStatus: string,
    updatedByUserId: string
  ) {
    try {
      const task = await this.getTaskDetails(taskId);
      if (!task) return;

      const updatedByUser = await storage.getUser(updatedByUserId);
      if (!updatedByUser) return;

      // Get project members to notify (excluding the user who made the change)
      const projectMembers = await storage.getProjectMembers(task.projectId);
      const membersToNotify = projectMembers.filter(
        (member) => member.id !== updatedByUserId
      );

      const statusMessages: Record<string, string> = {
        pending: "is now pending",
        in_progress: "is now in progress",
        completed: "has been completed",
        overdue: "is now overdue",
      };

      const message = `Task "${task.title}" ${
        statusMessages[newStatus] || `status changed to ${newStatus}`
      } by ${updatedByUser.username}`;

      // Send notification to all relevant project members
      for (const member of membersToNotify) {
        await this.createAndBroadcastNotification({
          userId: member.id,
          type: newStatus === "completed" ? "task_completed" : "team_update",
          title: `Task Status Updated`,
          message,
          data: {
            taskId: task.id,
            projectId: task.projectId,
            status: newStatus,
            updatedBy: updatedByUser.username,
          },
        });
      }

      // Special notification for task completion to the assignee
      if (
        newStatus === "completed" &&
        task.assignedTo &&
        task.assignedTo !== updatedByUserId
      ) {
        await this.createAndBroadcastNotification({
          userId: task.assignedTo,
          type: "task_completed",
          title: "Task Completed! 🎉",
          message: `Great job! You completed "${task.title}"`,
          data: {
            taskId: task.id,
            projectId: task.projectId,
            completedBy: updatedByUser.username,
          },
        });
      }
    } catch (error) {
      console.error("Failed to send task status change notification:", error);
    }
  }

  async notifyDocumentChange(
    fileId: string,
    changedByUserId: string,
    changeType: "created" | "updated" | "deleted"
  ) {
    try {
      const file = await storage.getFile(fileId);
      if (!file) return;

      const changedByUser = await storage.getUser(changedByUserId);
      if (!changedByUser) return;

      // Get project members to notify (excluding the user who made the change)
      const projectMembers = await storage.getProjectMembers(file.projectId);
      const membersToNotify = projectMembers.filter(
        (member) => member.id !== changedByUserId
      );

      const actionMessages = {
        created: "uploaded",
        updated: "updated",
        deleted: "deleted",
      };

      const message = `${changedByUser.username} ${actionMessages[changeType]} document "${file.name}"`;

      for (const member of membersToNotify) {
        await this.createAndBroadcastNotification({
          userId: member.id,
          type: "document_changed",
          title: `Document ${
            changeType.charAt(0).toUpperCase() + changeType.slice(1)
          }`,
          message,
          data: {
            fileId: file.id,
            projectId: file.projectId,
            fileName: file.name,
            changeType,
            changedBy: changedByUser.username,
          },
        });
      }
    } catch (error) {
      console.error("Failed to send document change notification:", error);
    }
  }

  async notifyDeadlineReminder(taskId: string) {
    try {
      const task = await this.getTaskDetails(taskId);
      if (!task || !task.assignedTo || !task.dueDate) return;

      await this.createAndBroadcastNotification({
        userId: task.assignedTo,
        type: "deadline_reminder",
        title: "Deadline Reminder ⏰",
        message: `Task "${task.title}" is due soon (${new Date(
          task.dueDate
        ).toLocaleDateString()})`,
        data: {
          taskId: task.id,
          projectId: task.projectId,
          dueDate: task.dueDate,
        },
      });
    } catch (error) {
      console.error("Failed to send deadline reminder:", error);
    }
  }

  async notifyProjectInvite(
    projectId: string,
    invitedUserId: string,
    invitedByUserId: string
  ) {
    try {
      const project = await storage.getProject(projectId);
      const invitedByUser = await storage.getUser(invitedByUserId);

      if (!project || !invitedByUser) return;

      await this.createAndBroadcastNotification({
        userId: invitedUserId,
        type: "team_update",
        title: "Project Invitation",
        message: `You have been invited to join "${project.name}" by ${invitedByUser.username}`,
        data: {
          projectId: project.id,
          projectName: project.name,
          invitedBy: invitedByUser.username,
        },
      });
    } catch (error) {
      console.error("Failed to send project invite notification:", error);
    }
  }

  private async getTaskDetails(taskId: string) {
    // Get task with additional details we need
    const [task] = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        projectId: tasks.projectId,
        assignedTo: tasks.assignedTo,
        dueDate: tasks.dueDate,
        status: tasks.status,
      })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    return task;
  }

  private async createAndBroadcastNotification(notificationData: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data: any;
  }) {
    try {
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: notificationData.userId,
        type: notificationData.type as any,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data,
        read: false,
        createdAt: new Date(),
        // Additional properties for NotificationService
        priority: "medium" as const,
        timestamp: new Date().toISOString(),
        projectId: notificationData.data?.projectId,
        relatedId:
          notificationData.data?.taskId || notificationData.data?.fileId,
        metadata: notificationData.data,
      };

      // Save to database
      await storage.saveNotification(notification);

      // Broadcast via WebSocket if notification service is available
      if (this.notificationService) {
        this.notificationService.sendNotification(notification);
      }
    } catch (error) {
      console.error("Failed to create and broadcast notification:", error);
    }
  }

  // Schedule deadline reminders (to be called periodically)
  async checkAndSendDeadlineReminders() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // Find tasks due tomorrow that haven't been completed
      const upcomingTasks = await db
        .select()
        .from(tasks)
        .where(
          and(
            gte(tasks.dueDate, tomorrow),
            lt(tasks.dueDate, dayAfterTomorrow),
            ne(tasks.status, "completed")
          )
        );

      for (const task of upcomingTasks) {
        await this.notifyDeadlineReminder(task.id);
      }
    } catch (error) {
      console.error("Failed to check deadline reminders:", error);
    }
  }
}

export const notificationHelper = NotificationHelper.getInstance();
