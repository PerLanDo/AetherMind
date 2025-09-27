const User = require("../models/User");
const Activity = require("../models/Activity");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../utils/cloudinary");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

class ProfileController {
  // Get user profile
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id)
        .populate(
          "followers",
          "username profile.firstName profile.lastName profile.avatar"
        )
        .populate(
          "following",
          "username profile.firstName profile.lastName profile.avatar"
        )
        .select("-password -security.twoFactorSecret");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  // Update profile information
  async updateProfile(req, res) {
    try {
      const {
        firstName,
        lastName,
        bio,
        location,
        profession,
        interests,
        socialLinks,
      } = req.body;

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update profile fields
      if (firstName !== undefined) user.profile.firstName = firstName;
      if (lastName !== undefined) user.profile.lastName = lastName;
      if (bio !== undefined) user.profile.bio = bio;
      if (location !== undefined) user.profile.location = location;
      if (profession !== undefined) user.profile.profession = profession;
      if (interests !== undefined) user.profile.interests = interests;
      if (socialLinks !== undefined)
        user.profile.socialLinks = {
          ...user.profile.socialLinks,
          ...socialLinks,
        };

      user.updatedAt = new Date();
      await user.save();

      // Log activity
      await new Activity({
        userId: user._id,
        type: "profile_update",
        description: "Profile information updated",
      }).save();

      res.json({ message: "Profile updated successfully", user });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  // Upload avatar
  async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete existing avatar if exists
      if (user.profile.avatar?.publicId) {
        await deleteFromCloudinary(user.profile.avatar.publicId);
      }

      // Upload new avatar
      const result = await uploadToCloudinary(
        req.file.buffer,
        `avatars/${user._id}`
      );

      user.profile.avatar = {
        url: result.secure_url,
        publicId: result.public_id,
      };

      await user.save();

      res.json({
        message: "Avatar uploaded successfully",
        avatar: user.profile.avatar,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  // Update privacy settings
  async updatePrivacySettings(req, res) {
    try {
      const { profileVisibility, searchable, showActivity, dataSharing } =
        req.body;

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (profileVisibility !== undefined)
        user.privacy.profileVisibility = profileVisibility;
      if (searchable !== undefined) user.privacy.searchable = searchable;
      if (showActivity !== undefined) user.privacy.showActivity = showActivity;
      if (dataSharing !== undefined) user.privacy.dataSharing = dataSharing;

      await user.save();

      res.json({ message: "Privacy settings updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  // Enable/disable 2FA
  async setup2FA(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const secret = speakeasy.generateSecret({
        name: `AetherMind (${user.email})`,
        issuer: "AetherMind",
      });

      user.security.twoFactorSecret = secret.base32;
      await user.save();

      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      res.json({
        secret: secret.base32,
        qrCode: qrCodeUrl,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  // Verify and enable 2FA
  async verify2FA(req, res) {
    try {
      const { token } = req.body;
      const user = await User.findById(req.user.id);

      const verified = speakeasy.totp.verify({
        secret: user.security.twoFactorSecret,
        encoding: "base32",
        token,
        window: 2,
      });

      if (verified) {
        user.security.twoFactorEnabled = true;
        await user.save();
        res.json({ message: "2FA enabled successfully" });
      } else {
        res.status(400).json({ message: "Invalid token" });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  // Get user analytics
  async getAnalytics(req, res) {
    try {
      const { period = "30d" } = req.query;
      const userId = req.user.id;

      let startDate;
      switch (period) {
        case "7d":
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "90d":
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      const activities = await Activity.aggregate([
        {
          $match: {
            userId: mongoose.Types.ObjectId(userId),
            timestamp: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
              },
              type: "$type",
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.date": 1 } },
      ]);

      const totalActivities = await Activity.countDocuments({
        userId,
        timestamp: { $gte: startDate },
      });

      res.json({
        period,
        totalActivities,
        dailyBreakdown: activities,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
}

module.exports = new ProfileController();
