import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ProjectList from "@/components/ProjectList";
import ProjectDashboard from "@/components/ProjectDashboard";

interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  role: "Owner" | "Editor" | "Viewer"; // Add role property
}

export default function ProjectsPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [initialTab, setInitialTab] = useState<string>("overview");
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [location] = useLocation();

  // Check for query parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Handle create project parameter
    if (urlParams.get('create') === 'true') {
      setShowCreateProject(true);
      // Clean up the URL
      window.history.replaceState({}, '', '/projects');
    }
    
    // Handle project selection parameter
    const projectId = urlParams.get('project');
    if (projectId && projects.length > 0) {
      selectProjectById(projectId);
      // Clean up the URL
      window.history.replaceState({}, '', '/projects');
    }
  }, [location, projects]);

  // Fetch all projects
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async (): Promise<Project[]> => {
      const response = await fetch("/api/projects", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      return response.json();
    },
  });

  // Function to select a specific project from the loaded projects
  const selectProjectById = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
    } else {
      console.error('Project not found:', projectId);
    }
  };

  const handleProjectSelect = (project: Project, tab: string = "overview") => {
    setSelectedProject(project);
    setInitialTab(tab);
  };

  if (selectedProject) {
    return (
      <div className="p-6">
        <ProjectDashboard
          project={selectedProject}
          onBack={() => {
            setSelectedProject(null);
            setInitialTab("overview");
          }}
          initialTab={initialTab}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <ProjectList 
        onSelectProject={handleProjectSelect} 
        showCreateProject={showCreateProject}
        onCloseCreateProject={() => setShowCreateProject(false)}
      />
    </div>
  );
}
