import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AIToolsPanel from "./AIToolsPanel";
import FileUploadZone from "./FileUploadZone";
import ChatInterface from "./ChatInterface";
import TaskDashboard from "./TaskDashboard";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("research");

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="research" data-testid="tab-research-assistant">
              Research Assistant
            </TabsTrigger>
            <TabsTrigger value="tasks" data-testid="tab-task-dashboard">
              Task Dashboard
            </TabsTrigger>
            <TabsTrigger value="chat" data-testid="tab-collaborative-chat">
              Collaborative Chat
            </TabsTrigger>
          </TabsList>

          {/* Research Assistant Tab */}
          <TabsContent value="research" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content Area */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">AI-Powered Research Tools</CardTitle>
                    <p className="text-muted-foreground">
                      Select the AI tools you need for your research and writing tasks
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

          {/* Task Dashboard Tab */}
          <TabsContent value="tasks" className="mt-6">
            <TaskDashboard />
          </TabsContent>

          {/* Collaborative Chat Tab */}
          <TabsContent value="chat" className="mt-6">
            <div className="max-w-4xl mx-auto">
              <div className="h-[700px]">
                <ChatInterface />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}