// Load environment variables securely
import { config } from "dotenv";

// Load environment variables from .env file
config();

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

console.log("Environment setup complete");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Present" : "Missing");
console.log("GROK_4_FAST_FREE_API_KEY:", process.env.GROK_4_FAST_FREE_API_KEY ? "Present" : "Missing");

// Now import other modules after environment is set up
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Configure CORS to allow credentials (cookies)
app.use(
  cors({
    origin: "http://localhost:5000", // Allow same origin
    credentials: true, // Important: allows cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Import and setup routes after environment is configured
  const { registerRoutes } = await import("./routes");
  const server = await registerRoutes(app);

  // Initialize notification service with WebSocket support
  const { NotificationService } = await import("./notification-service");
  const { notificationHelper } = await import("./notification-helper");

  const notificationService = new NotificationService();
  notificationService.initialize(server);
  notificationHelper.setNotificationService(notificationService);

  console.log("Notification WebSocket service initialized");

  // Setup periodic deadline reminders (run every hour)
  setInterval(() => {
    notificationHelper.checkAndSendDeadlineReminders();
  }, 60 * 60 * 1000); // 1 hour

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
