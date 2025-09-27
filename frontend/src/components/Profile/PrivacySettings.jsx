import React, { useState } from "react";
import { profileAPI } from "../../services/api";
import TwoFactorAuth from "./TwoFactorAuth";
import "./PrivacySettings.css";

const PrivacySettings = ({ privacySettings, onUpdate }) => {
  const [settings, setSettings] = useState(privacySettings || {});
  const [saving, setSaving] = useState(false);

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await profileAPI.updatePrivacySettings(settings);
      onUpdate();
    } catch (error) {
      console.error("Failed to update privacy settings:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="privacy-settings">
      <h2>Privacy & Security Settings</h2>

      <div className="settings-section">
        <h3>Profile Visibility</h3>
        <div className="setting-item">
          <label>Who can view your profile?</label>
          <select
            value={settings.profileVisibility || "public"}
            onChange={(e) =>
              handleSettingChange("profileVisibility", e.target.value)
            }
          >
            <option value="public">Everyone</option>
            <option value="followers">Followers Only</option>
            <option value="private">Private</option>
          </select>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.searchable !== false}
              onChange={(e) =>
                handleSettingChange("searchable", e.target.checked)
              }
            />
            Allow others to find you in search
          </label>
        </div>

        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.showActivity !== false}
              onChange={(e) =>
                handleSettingChange("showActivity", e.target.checked)
              }
            />
            Show your activity to others
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3>Data & Analytics</h3>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.dataSharing === true}
              onChange={(e) =>
                handleSettingChange("dataSharing", e.target.checked)
              }
            />
            Allow anonymous data sharing for platform improvement
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3>Two-Factor Authentication</h3>
        <TwoFactorAuth />
      </div>

      <div className="settings-actions">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="save-button"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default PrivacySettings;
