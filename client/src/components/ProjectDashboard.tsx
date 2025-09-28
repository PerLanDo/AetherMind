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
  initialTab?: string;
}

export default function ProjectDashboard({
  project,
  onBack,
  initialTab = "overview",
}: ProjectDashboardProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

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

      {/* Interactive Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105"
          onClick={() => setActiveTab("files")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Files</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">2.4 MB</p>
                <p className="text-xs text-green-600">+2 today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105"
          onClick={() => setActiveTab("tasks")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckSquare className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Tasks</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">75% done</p>
                <p className="text-xs text-green-600">6 completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105"
          onClick={() => setActiveTab("chat")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Conversations</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">24 messages</p>
                <p className="text-xs text-blue-600">Active now</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105"
          onClick={() => setActiveTab("team")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Members</p>
                  <p className="text-2xl font-bold">1</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Owner</p>
                <p className="text-xs text-green-600">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
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
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveTab("team")}
                  >
                    <Users className="h-6 w-6" />
                    <span className="text-sm">Invite Team</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="files" className="mt-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Project Files</CardTitle>
                <p className="text-muted-foreground">
                  Upload and manage research documents, papers, and resources
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    File management interface will be integrated here
                  </p>
                  <Button className="mt-4" onClick={() => window.location.href = '/files'}>
                    Go to Files Page
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
