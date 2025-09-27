import React, { useEffect, useState } from "react";
import { researchAPI } from "../../../api/researchAPI";

const ResearchDashboard = () => {
  const [activeProject, setActiveProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Initialize with empty data instead of placeholders
  const [projectStats, setProjectStats] = useState({
    files: 0,
    tasks: 0,
    conversations: 0,
    members: 1, // Only the current user
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      // Fetch real projects from API
      const response = await researchAPI.getProjects();
      setProjects(response.data);

      // Set first project as active or create new one if none exist
      if (response.data.length > 0) {
        setActiveProject(response.data[0]);
        updateProjectStats(response.data[0]._id);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const updateProjectStats = async (projectId) => {
    try {
      const response = await researchAPI.getProjectStats(projectId);
      setProjectStats(response.data);
    } catch (error) {
      console.error("Failed to fetch project stats:", error);
      // Keep default empty stats
    }
  };

  // ...existing code...
};

export default ResearchDashboard;
