import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  FolderOpen,
  Plus,
  MoreHorizontal,
  Users,
  Lock,
  Home,
  BarChart3,
  CheckSquare,
  Upload,
  PenTool,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export default function Sidebar() {
  const [location] = useLocation();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  // Fetch user's projects
  const { data: projects = [], isLoading } = useQuery({
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

  const navigationItems = [
    {
      path: "/",
      label: "Projects",
      icon: Home,
      isActive: location === "/",
    },
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: BarChart3,
      isActive: location === "/dashboard",
    },
    {
      path: "/tasks",
      label: "Tasks",
      icon: CheckSquare,
      isActive: location?.startsWith("/tasks"),
    },
    {
      path: "/files",
      label: "Files",
      icon: FileText,
      isActive: location?.startsWith("/files"),
    },
    {
      path: "/ai-tools",
      label: "AI Tools",
      icon: PenTool,
      isActive: location?.startsWith("/ai-tools"),
    },
  ];

  const handleProjectSelect = (projectId: number) => {
    setSelectedProject(projectId);
    // Navigate to project-specific page
    window.location.href = `/project/${projectId}`;
  };

  return (
    <aside className="w-72 bg-sidebar border-r border-sidebar-border h-full flex flex-col">
      {/* Main Navigation */}
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="font-semibold text-sidebar-foreground mb-4">
          NAVIGATION
        </h2>
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={item.isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${
                    item.isActive ? "bg-sidebar-accent" : ""
                  }`}
                  size="sm"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>

      <Separator />

      {/* Your Projects Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sidebar-foreground">
            YOUR PROJECTS
          </h2>
          <Link href="/?create=true">
            <Button size="icon" variant="ghost" className="h-6 w-6">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">Loading projects...</div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground" />
            <div className="text-sm text-muted-foreground">No projects yet</div>
            <Link href="/?create=true">
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </Link>
          </div>
        ) : (
          projects.map((project) => {
            const isSelected = selectedProject === project.id;

            return (
              <Card
                key={project.id}
                className={`p-3 cursor-pointer transition-colors hover-elevate ${
                  isSelected ? "bg-sidebar-accent border-sidebar-primary" : ""
                }`}
                onClick={() => handleProjectSelect(project.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-sm truncate text-sidebar-foreground">
                        {project.name}
                      </span>
                    </div>

                    {project.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs h-5">
                        <Lock className="h-3 w-3 mr-1" />
                        Owner
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(project.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleProjectSelect(project.id)}
                      >
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem>Share</DropdownMenuItem>
                      <DropdownMenuItem>Settings</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Link href="/files?action=upload">
          <Button variant="outline" className="w-full justify-start" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </Button>
        </Link>
        <Link href="/ai-tools">
          <Button variant="default" className="w-full justify-start" size="sm">
            <PenTool className="mr-2 h-4 w-4" />
            AI Writing Tools
          </Button>
        </Link>
      </div>
    </aside>
  );
}
