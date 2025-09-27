import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  FileText, 
  FolderOpen, 
  Plus, 
  MoreHorizontal,
  Users,
  Lock,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Project {
  id: string;
  name: string;
  role: "Owner" | "Editor" | "Viewer";
  filesCount: number;
  isShared: boolean;
}

const mockProjects: Project[] = [
  { id: "1", name: "Thesis on Climate Change", role: "Owner", filesCount: 12, isShared: false },
  { id: "2", name: "Grant Proposal - Renewable Energy", role: "Owner", filesCount: 8, isShared: false },
  { id: "3", name: "Literature Review - AI Ethics", role: "Owner", filesCount: 15, isShared: false },
  { id: "4", name: "Shared", role: "Editor", filesCount: 5, isShared: true },
];

const roleIcons = {
  Owner: Lock,
  Editor: Users,
  Viewer: Eye,
};

export default function Sidebar() {
  const [location] = useLocation();
  const [selectedProject, setSelectedProject] = useState("1");

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    console.log('Selected project:', projectId);
  };

  return (
    <aside className="w-72 bg-sidebar border-r border-sidebar-border h-full flex flex-col">
      {/* Your Projects Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sidebar-foreground">YOUR PROJECTS</h2>
          <Button size="icon" variant="ghost" className="h-6 w-6" data-testid="button-add-project">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {mockProjects.map((project) => {
          const RoleIcon = roleIcons[project.role];
          const isSelected = selectedProject === project.id;
          
          return (
            <Card
              key={project.id}
              className={`p-3 cursor-pointer transition-colors hover-elevate ${
                isSelected ? 'bg-sidebar-accent border-sidebar-primary' : ''
              }`}
              onClick={() => handleProjectSelect(project.id)}
              data-testid={`card-project-${project.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-sm truncate text-sidebar-foreground">
                      {project.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs h-5">
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {project.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {project.filesCount} files
                    </span>
                    {project.isShared && (
                      <Users className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-6 w-6 flex-shrink-0" data-testid={`button-project-menu-${project.id}`}>
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem data-testid={`menu-open-${project.id}`}>Open</DropdownMenuItem>
                    <DropdownMenuItem data-testid={`menu-share-${project.id}`}>Share</DropdownMenuItem>
                    <DropdownMenuItem data-testid={`menu-settings-${project.id}`}>Settings</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button 
          variant="outline" 
          className="w-full justify-start" 
          size="sm"
          data-testid="button-upload-file"
          onClick={() => console.log('Upload file clicked')}
        >
          <FileText className="mr-2 h-4 w-4" />
          Upload File
        </Button>
        <Button 
          variant="default" 
          className="w-full justify-start" 
          size="sm"
          data-testid="button-new-document"
          onClick={() => console.log('New document clicked')}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Document
        </Button>
      </div>
    </aside>
  );
}