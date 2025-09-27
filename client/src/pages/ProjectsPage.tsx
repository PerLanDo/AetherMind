import { useState } from "react";
import ProjectList from "@/components/ProjectList";
import ProjectDashboard from "@/components/ProjectDashboard";

interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  if (selectedProject) {
    return (
      <div className="p-6">
        <ProjectDashboard
          project={selectedProject}
          onBack={() => setSelectedProject(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <ProjectList onSelectProject={setSelectedProject} />
    </div>
  );
}
