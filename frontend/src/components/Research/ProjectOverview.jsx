import React, { useEffect, useState } from "react";
import { researchAPI } from "../../../api";
import { formatDate, formatTimeAgo, getActivityIcon } from "../../../utils";
import "./ProjectOverview.css";

const ProjectOverview = ({ project, stats, setActiveTab }) => {
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (project?._id) {
      fetchRecentActivity();
    }
  }, [project]);

  const fetchRecentActivity = async () => {
    try {
      const response = await researchAPI.getProjectActivity(project._id, 10);
      setRecentActivity(response.data || []);
    } catch (error) {
      console.error("Failed to fetch recent activity:", error);
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const renderEmptyActivity = () => (
    <div className="activity-empty">
      <div className="empty-icon">📋</div>
      <h4>No activity yet</h4>
      <p>
        Start by uploading files, creating tasks, or chatting with the AI
        assistant.
      </p>
    </div>
  );

  const renderQuickActions = () => (
    <div className="quick-actions">
      <h4>Quick Actions</h4>
      <div className="actions-grid">
        <button
          className="action-card"
          onClick={() => document.querySelector(".file-upload-input")?.click()}
        >
          <span className="action-icon">📤</span>
          <span>Upload Files</span>
        </button>
        <button className="action-card" onClick={() => setActiveTab("tasks")}>
          <span className="action-icon">✅</span>
          <span>Create Task</span>
        </button>
        <button className="action-card" onClick={() => setActiveTab("chat")}>
          <span className="action-icon">🤖</span>
          <span>Ask AI</span>
        </button>
        <button
          className="action-card"
          onClick={() => window.open("/research/templates")}
        >
          <span className="action-icon">📝</span>
          <span>Templates</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="project-overview">
      <div className="overview-header">
        <div className="project-info">
          <h2>{project?.name || "Untitled Project"}</h2>
          <p className="project-description">
            {project?.description || "No description provided"}
          </p>
          <div className="project-meta">
            <span>Created: {formatDate(project?.createdAt)}</span>
            <span>Last updated: {formatDate(project?.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-info">
            <div className="stat-number">{stats.files}</div>
            <div className="stat-label">Files</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-number">{stats.tasks}</div>
            <div className="stat-label">Tasks</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-info">
            <div className="stat-number">{stats.conversations}</div>
            <div className="stat-label">Conversations</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-number">{stats.members}</div>
            <div className="stat-label">Members</div>
          </div>
        </div>
      </div>

      <div className="overview-content">
        <div className="recent-activity-section">
          <h3>Recent Activity</h3>
          {recentActivity.length === 0 ? (
            renderEmptyActivity()
          ) : (
            <div className="activity-list">
              {recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="activity-details">
                    <div className="activity-description">
                      {activity.description}
                    </div>
                    <div className="activity-time">
                      {formatTimeAgo(activity.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {stats.files === 0 &&
          stats.tasks === 0 &&
          stats.conversations === 0 &&
          renderQuickActions()}
      </div>
    </div>
  );
};

export default ProjectOverview;
