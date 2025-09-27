// Load environment variables FIRST before any other imports
import path from "path";
import { config } from "dotenv";
config({ path: path.resolve(process.cwd(), ".env"), debug: true });

// Force override DATABASE_URL if it's set to the default dev.db
if (process.env.DATABASE_URL === "file:./dev.db") {
  process.env.DATABASE_URL =
    "postgresql://neondb_owner:npg_ZaBACckG5ER4@ep-hidden-poetry-a1kompbw-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
}

// Force set API key if not present
if (!process.env.GROK_4_FAST_FREE_API_KEY) {
  process.env.GROK_4_FAST_FREE_API_KEY =
    "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";
}

console.log("Environment check (after override):");
console.log("Current working directory:", process.cwd());
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);
console.log("DATABASE_URL length:", process.env.DATABASE_URL?.length);
console.log(
  "DATABASE_URL preview:",
  process.env.DATABASE_URL?.substring(0, 50) + "..."
);
console.log(
  "GROK_4_FAST_FREE_API_KEY present:",
  !!process.env.GROK_4_FAST_FREE_API_KEY
);

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

console.log("Environment check:");
console.log("Current working directory:", process.cwd());
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);
console.log("DATABASE_URL length:", process.env.DATABASE_URL?.length);
console.log(
  "DATABASE_URL preview:",
  process.env.DATABASE_URL?.substring(0, 50) + "..."
);
console.log(
  "All env vars containing DATABASE:",
  Object.keys(process.env)
    .filter((key) => key.includes("DATABASE"))
    .map((key) => `${key}=${process.env[key]}`)
);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  const server = await registerRoutes(app);

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
  server.listen(port, "localhost", () => {
    log(`serving on port ${port}`);
  });
})();
