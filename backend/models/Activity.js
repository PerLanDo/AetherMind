const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: [
      "login",
      "logout",
      "profile_update",
      "ai_chat",
      "achievement_earned",
      "post_created",
      "follow",
      "unfollow",
    ],
    required: true,
  },
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
  ip: String,
  userAgent: String,
});

activitySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model("Activity", activitySchema);
