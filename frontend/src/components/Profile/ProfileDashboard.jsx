import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { profileAPI } from "../../services/api";
import ProfileEditor from "./ProfileEditor";
import PrivacySettings from "./PrivacySettings";
import ActivityAnalytics from "./ActivityAnalytics";
import AvatarUpload from "./AvatarUpload";
import "./ProfileDashboard.css";

const ProfileDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await profileAPI.getProfile();
      setProfileData(response.data);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "privacy", label: "Privacy", icon: "🔒" },
    { id: "analytics", label: "Analytics", icon: "📊" },
    { id: "preferences", label: "Preferences", icon: "⚙️" },
    { id: "ai", label: "AI Settings", icon: "🤖" },
  ];

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  return (
    <div className="profile-dashboard">
      <div className="profile-header">
        <div className="profile-avatar-section">
          <AvatarUpload
            currentAvatar={profileData?.profile?.avatar?.url}
            onAvatarUpdate={fetchProfile}
          />
          <div className="profile-basic-info">
            <h1>
              {profileData?.profile?.firstName} {profileData?.profile?.lastName}
            </h1>
            <p className="username">@{profileData?.username}</p>
            <p className="bio">{profileData?.profile?.bio}</p>
            <div className="profile-stats">
              <span>{profileData?.followers?.length || 0} Followers</span>
              <span>{profileData?.following?.length || 0} Following</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="profile-content">
        {activeTab === "profile" && (
          <ProfileEditor profileData={profileData} onUpdate={fetchProfile} />
        )}
        {activeTab === "privacy" && (
          <PrivacySettings
            privacySettings={profileData?.privacy}
            onUpdate={fetchProfile}
          />
        )}
        {activeTab === "analytics" && (
          <ActivityAnalytics userId={profileData?._id} />
        )}
        {activeTab === "preferences" && (
          <PreferencesSettings
            preferences={profileData?.preferences}
            onUpdate={fetchProfile}
          />
        )}
        {activeTab === "ai" && (
          <AISettings
            aiPreferences={profileData?.aiPreferences}
            onUpdate={fetchProfile}
          />
        )}
      </div>
    </div>
  );
};

export default ProfileDashboard;
