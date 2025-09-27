// Authentication setup for OMNISCI AI - based on javascript_auth_all_persistance integration
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import jwt from "jsonwebtoken";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// JWT secret key
const JWT_SECRET = process.env.SESSION_SECRET || "fallback-secret-key";

// JWT token utilities
function generateToken(user: SelectUser): string {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: "24h",
  });
}

function verifyToken(token: string): { id: string; username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; username: string };
  } catch {
    return null;
  }
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    name: "sessionId", // Custom session cookie name
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax", // Important for localhost development
      domain: undefined, // Let it default to the request domain
    },
  };

  app.set("trust proxy", 1);

  // Add session debugging middleware
  app.use((req, res, next) => {
    console.log("🍪 Cookie headers:", req.headers.cookie);
    next();
  });

  app.use(session(sessionSettings));

  // Add middleware to log session info
  app.use((req, res, next) => {
    res.on("finish", () => {
      console.log(
        `🔄 Response finished - Session ID: ${
          req.sessionID
        }, Authenticated: ${req.isAuthenticated()}`
      );
    });
    next();
  });

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    })
  );

  passport.serializeUser((user, done) => {
    console.log("Serializing user:", user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    console.log("Deserializing user ID:", id);
    try {
      const user = await storage.getUser(id);
      console.log("Retrieved user:", user ? "Found" : "Not found");
      done(null, user);
    } catch (error) {
      console.error("Deserialize user error:", error);
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Generate JWT token
      const token = generateToken(user);

      // Set JWT as HTTP-only cookie
      res.cookie("authToken", token, {
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      console.log(
        "Registration successful - JWT token generated for:",
        user.username
      );

      // Try session login as backup
      req.login(user, (err) => {
        if (err) console.warn("Session login failed:", err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", async (req, res, next) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);

      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT token
      const token = generateToken(user);

      console.log("Login successful - JWT token generated for:", user.username);

      // Try session login as backup
      req.login(user, (err) => {
        if (err) console.warn("Session login failed:", err);
        // Return the token in the response so frontend can store it
        res.status(200).json({ ...user, token });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    console.log("User route called - Session ID:", req.sessionID);
    console.log("Is authenticated:", req.isAuthenticated());
    console.log("User in session:", req.user ? "Present" : "Not present");
    console.log("All cookies:", req.cookies);
    console.log("Cookie header:", req.headers.cookie);

    // First try session authentication
    if (req.isAuthenticated() && req.user) {
      console.log("✅ Authenticated via session");
      return res.json(req.user);
    }

    // Try JWT from Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      console.log("🔑 Bearer token present:", !!token);

      const decoded = verifyToken(token);
      console.log("🔓 JWT Token decoded:", !!decoded);

      if (decoded) {
        try {
          const user = await storage.getUser(decoded.id);
          if (user) {
            console.log("✅ Authenticated via Bearer token");
            return res.json(user);
          }
        } catch (error) {
          console.error("JWT user lookup error:", error);
        }
      }
    }

    // Fallback to JWT authentication
    const token = req.cookies?.authToken;
    console.log("🍪 JWT Token present:", !!token);

    if (token) {
      const decoded = verifyToken(token);
      console.log("🔓 JWT Token decoded:", !!decoded);

      if (decoded) {
        try {
          const user = await storage.getUser(decoded.id);
          if (user) {
            console.log("✅ Authenticated via JWT token");
            return res.json(user);
          }
        } catch (error) {
          console.error("JWT user lookup error:", error);
        }
      }
    }

    console.log("❌ Not authenticated via session or JWT");
    return res.sendStatus(401);
  });
}
