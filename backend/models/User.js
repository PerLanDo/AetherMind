const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  // Basic Auth
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true, unique: true },

  // Profile Information
  profile: {
    firstName: String,
    lastName: String,
    bio: { type: String, maxlength: 500 },
    avatar: {
      url: String,
      publicId: String, // For Cloudinary
    },
    location: String,
    profession: String,
    interests: [String],
    socialLinks: {
      twitter: String,
      linkedin: String,
      github: String,
      website: String,
    },
  },

  // Privacy & Security
  privacy: {
    profileVisibility: {
      type: String,
      enum: ["public", "private", "followers"],
      default: "public",
    },
    searchable: { type: Boolean, default: true },
    showActivity: { type: Boolean, default: true },
    dataSharing: { type: Boolean, default: false },
  },

  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: String,
    loginHistory: [
      {
        timestamp: Date,
        ip: String,
        userAgent: String,
        location: String,
      },
    ],
    lastPasswordChange: Date,
  },

  // Preferences
  preferences: {
    theme: { type: String, enum: ["light", "dark", "auto"], default: "light" },
    language: { type: String, default: "en" },
    timezone: { type: String, default: "UTC" },
    dateFormat: { type: String, default: "MM/DD/YYYY" },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
    },
  },

  // Social Features
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // AI Preferences
  aiPreferences: {
    preferredModels: [String],
    responseStyle: {
      type: String,
      enum: ["casual", "formal", "technical"],
      default: "casual",
    },
    topicsOfInterest: [String],
    learningPath: String,
  },

  // Account Status
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
