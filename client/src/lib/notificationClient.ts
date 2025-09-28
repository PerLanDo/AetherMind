import React from "react";

interface NotificationData {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

interface WebSocketMessage {
  type:
    | "notification"
    | "unread_count"
    | "connection_status"
    | "error"
    | "ping"
    | "pong";
  data?: any;
  notification?: NotificationData;
  count?: number;
  message?: string;
  error?: string;
  timestamp?: string;
}

export type NotificationHandler = (notification: NotificationData) => void;
export type UnreadCountHandler = (count: number) => void;
export type ConnectionStatusHandler = (connected: boolean) => void;

export class NotificationWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private pingInterval: number | null = null;
  private heartbeatInterval: number | null = null;
  private isIntentionalDisconnect = false;

  // Event handlers
  private notificationHandlers: Set<NotificationHandler> = new Set();
  private unreadCountHandlers: Set<UnreadCountHandler> = new Set();
  private connectionStatusHandlers: Set<ConnectionStatusHandler> = new Set();

  constructor() {
    // Determine WebSocket URL based on current location
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host || 'localhost:5000';  // Fallback to localhost:5000
    // Fix: server uses /notifications path, not /ws/notifications
    this.url = `${protocol}//${host}/notifications`;
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.token = token;
  }

  // Connect to WebSocket server
  connect(userId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.isIntentionalDisconnect = false;

        // Build connection URL with auth params
        let wsUrl = this.url;
        const params = new URLSearchParams();

        if (this.token) {
          params.append("token", this.token);
        }
        if (userId) {
          params.append("userId", userId);
        }

        if (params.toString()) {
          wsUrl += "?" + params.toString();
        }

        console.log("Connecting to WebSocket:", wsUrl);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("WebSocket connected");
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.startHeartbeat();
          this.notifyConnectionStatus(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error(
              "Failed to parse WebSocket message:",
              error,
              event.data
            );
          }
        };

        this.ws.onclose = (event) => {
          console.log("WebSocket disconnected:", event.code, event.reason);
          this.cleanup();
          this.notifyConnectionStatus(false);

          if (
            !this.isIntentionalDisconnect &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          reject(new Error("WebSocket connection failed"));
        };

        // Connection timeout
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.ws?.close();
            reject(new Error("WebSocket connection timeout"));
          }
        }, 10000); // 10 second timeout
      } catch (error) {
        reject(error);
      }
    });
  }

  // Handle incoming messages
  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case "notification":
        if (message.notification) {
          // Convert date string back to Date object
          const notification = {
            ...message.notification,
            createdAt: new Date(message.notification.createdAt),
          };
          this.notifyNotificationHandlers(notification);
        }
        break;

      case "unread_count":
        if (typeof message.count === "number") {
          this.notifyUnreadCountHandlers(message.count);
        }
        break;

      case "connection_status":
        console.log("Connection status update:", message.message);
        break;

      case "error":
        console.error("Server error:", message.error);
        break;

      case "ping":
        // Respond to server ping
        this.send({ type: "pong", timestamp: new Date().toISOString() });
        break;

      case "pong":
        // Server responded to our ping
        console.log("Received pong from server");
        break;

      default:
        console.warn("Unknown message type:", message);
    }
  }

  // Send message to server
  private send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("Cannot send message: WebSocket not connected");
    }
  }

  // Start heartbeat to keep connection alive
  private startHeartbeat() {
    this.heartbeatInterval = window.setInterval(() => {
      this.send({ type: "ping", timestamp: new Date().toISOString() });
    }, 30000); // Ping every 30 seconds
  }

  // Schedule reconnection attempt
  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000
    );

    console.log(
      `Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
    );

    setTimeout(() => {
      if (!this.isIntentionalDisconnect) {
        this.connect().catch((error) => {
          console.error("Reconnection attempt failed:", error);
        });
      }
    }, delay);
  }

  // Clean up timers and connection
  private cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Disconnect from WebSocket
  disconnect() {
    this.isIntentionalDisconnect = true;
    this.cleanup();

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.notifyConnectionStatus(false);
  }

  // Subscribe to project notifications (optional filtering)
  subscribeToProject(projectId: string) {
    this.send({
      type: "connection_status",
      data: { action: "subscribe", projectId },
    });
  }

  // Unsubscribe from project notifications
  unsubscribeFromProject(projectId: string) {
    this.send({
      type: "connection_status",
      data: { action: "unsubscribe", projectId },
    });
  }

  // Event handler management
  onNotification(handler: NotificationHandler) {
    this.notificationHandlers.add(handler);
    return () => this.notificationHandlers.delete(handler);
  }

  onUnreadCountUpdate(handler: UnreadCountHandler) {
    this.unreadCountHandlers.add(handler);
    return () => this.unreadCountHandlers.delete(handler);
  }

  onConnectionStatusChange(handler: ConnectionStatusHandler) {
    this.connectionStatusHandlers.add(handler);
    return () => this.connectionStatusHandlers.delete(handler);
  }

  // Notify handlers
  private notifyNotificationHandlers(notification: NotificationData) {
    this.notificationHandlers.forEach((handler) => {
      try {
        handler(notification);
      } catch (error) {
        console.error("Error in notification handler:", error);
      }
    });
  }

  private notifyUnreadCountHandlers(count: number) {
    this.unreadCountHandlers.forEach((handler) => {
      try {
        handler(count);
      } catch (error) {
        console.error("Error in unread count handler:", error);
      }
    });
  }

  private notifyConnectionStatus(connected: boolean) {
    this.connectionStatusHandlers.forEach((handler) => {
      try {
        handler(connected);
      } catch (error) {
        console.error("Error in connection status handler:", error);
      }
    });
  }

  // Get connection status
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Get connection state
  get connectionState(): string {
    if (!this.ws) return "CLOSED";

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "CONNECTING";
      case WebSocket.OPEN:
        return "OPEN";
      case WebSocket.CLOSING:
        return "CLOSING";
      case WebSocket.CLOSED:
        return "CLOSED";
      default:
        return "UNKNOWN";
    }
  }
}

// Create singleton instance
export const notificationClient = new NotificationWebSocketClient();

// React hook for using notifications
export function useNotifications() {
  const [connected, setConnected] = React.useState(
    notificationClient.isConnected
  );
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const unsubscribeConnection =
      notificationClient.onConnectionStatusChange(setConnected);
    const unsubscribeUnread =
      notificationClient.onUnreadCountUpdate(setUnreadCount);

    return () => {
      unsubscribeConnection();
      unsubscribeUnread();
    };
  }, []);

  return {
    connected,
    unreadCount,
    client: notificationClient,
    connect: notificationClient.connect.bind(notificationClient),
    disconnect: notificationClient.disconnect.bind(notificationClient),
    onNotification: notificationClient.onNotification.bind(notificationClient),
  };
}

export default notificationClient;
