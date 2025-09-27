import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Users,
  FileText,
  CheckSquare,
  MessageSquare,
  Plus,
  Settings,
  Share,
  Crown,
  Edit,
  Eye,
} from "lucide-react";
import AIToolsPanel from "@/components/AIToolsPanel";
import FileUploadZone from "@/components/FileUploadZone";
import ChatInterface from "@/components/ChatInterface";
import TaskDashboard from "@/components/TaskDashboard";
import { TeamManagement } from "@/components/TeamManagement";

interface Project {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  role: "Owner" | "Editor" | "Viewer";
}

interface ProjectDashboardProps {
  project: Project;
  onBack: () => void;
}

export default function ProjectDashboard({
  project,
  onBack,
}: ProjectDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge variant="outline">Active</Badge>
              <Badge variant="secondary" className="gap-1">
                {project.role === "Owner" && <Crown className="h-3 w-3" />}
                {project.role === "Editor" && <Edit className="h-3 w-3" />}
                {project.role === "Viewer" && <Eye className="h-3 w-3" />}
                {project.role}
              </Badge>
            </div>
            {project.description && (
              <p className="text-muted-foreground mt-1">
                {project.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Share className="h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Files</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckSquare className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Tasks</p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Conversations</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Members</p>
                <p className="text-2xl font-bold">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="research">Research Assistant</TabsTrigger>
          <TabsTrigger value="tasks">Task Management</TabsTrigger>
          <TabsTrigger value="chat">Team Chat</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Project created</p>
                      <p className="text-xs text-muted-foreground">
                        2 hours ago
                      </p>
                    </div>
                  </div>
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">
                      Start using your project to see activity here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveTab("research")}
                  >
                    <FileText className="h-6 w-6" />
                    <span className="text-sm">Upload Files</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveTab("tasks")}
                  >
                    <Plus className="h-6 w-6" />
                    <span className="text-sm">Create Task</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveTab("chat")}
                  >
                    <MessageSquare className="h-6 w-6" />
                    <span className="text-sm">Start Chat</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Users className="h-6 w-6" />
                    <span className="text-sm">Invite Team</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="research" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    AI-Powered Research Tools
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Select the AI tools you need for your research and writing
                    tasks
                  </p>
                </CardHeader>
                <CardContent>
                  <AIToolsPanel />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Document Management</CardTitle>
                  <p className="text-muted-foreground">
                    Upload and manage your research files for AI analysis
                  </p>
                </CardHeader>
                <CardContent>
                  <FileUploadZone />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Chat */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <ChatInterface />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <TaskDashboard />
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <div className="max-w-4xl mx-auto">
            <div className="h-[700px]">
              <ChatInterface />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <div className="max-w-4xl mx-auto">
            <TeamManagement projectId={project.id} userRole={project.role} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
