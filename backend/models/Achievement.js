const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  icon: String,
  category: {
    type: String,
    enum: ["ai", "social", "profile", "engagement"],
    required: true,
  },
  points: { type: Number, default: 0 },
  criteria: {
    type: String, // JSON string of criteria
    required: true,
  },
  isActive: { type: Boolean, default: true },
});

const userAchievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  achievementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Achievement",
    required: true,
  },
  earnedAt: { type: Date, default: Date.now },
  progress: { type: Number, default: 100 },
});

module.exports = {
  Achievement: mongoose.model("Achievement", achievementSchema),
  UserAchievement: mongoose.model("UserAchievement", userAchievementSchema),
};
