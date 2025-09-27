import { useState } from "react";
import { 
  MessageSquare, 
  CheckCircle2, 
  RotateCcw, 
  FileText, 
  Lightbulb, 
  BookOpen,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AITool {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status?: "new" | "available" | "coming-soon";
  action: () => void;
}

export default function AIToolsPanel() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const aiTools: AITool[] = [
    {
      id: "qa",
      title: "AI Q&A",
      description: "Ask questions about your uploaded research files",
      icon: MessageSquare,
      status: "available",
      action: () => {
        setSelectedTool("qa");
        console.log('AI Q&A activated');
      }
    },
    {
      id: "grammar",
      title: "Grammar & Style Checks",
      description: "Improve your academic writing quality",
      icon: CheckCircle2,
      status: "available",
      action: () => {
        setSelectedTool("grammar");
        console.log('Grammar check activated');
      }
    },
    {
      id: "paraphrase",
      title: "Paraphrase & Summarize",
      description: "Rephrase text and create summaries",
      icon: RotateCcw,
      status: "available",
      action: () => {
        setSelectedTool("paraphrase");
        console.log('Paraphrase tool activated');
      }
    },
    {
      id: "citation",
      title: "Auto Citation Generator (APA)",
      description: "Generate proper academic citations",
      icon: FileText,
      status: "new",
      action: () => {
        setSelectedTool("citation");
        console.log('Citation generator activated');
      }
    },
    {
      id: "literature",
      title: "Literature Suggestions",
      description: "Discover relevant research papers",
      icon: Lightbulb,
      status: "available",
      action: () => {
        setSelectedTool("literature");
        console.log('Literature suggestions activated');
      }
    },
    {
      id: "outline",
      title: "Outline & Draft Builder",
      description: "Structure your thesis or essays",
      icon: BookOpen,
      status: "coming-soon",
      action: () => {
        setSelectedTool("outline");
        console.log('Outline builder activated');
      }
    },
    {
      id: "analysis",
      title: "Data Analysis Helper",
      description: "Basic statistics and coding assistance",
      icon: BarChart3,
      status: "coming-soon",
      action: () => {
        setSelectedTool("analysis");
        console.log('Data analysis activated');
      }
    }
  ];

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">New</Badge>;
      case "coming-soon":
        return <Badge variant="outline" className="text-muted-foreground">Coming Soon</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {aiTools.map((tool) => {
        const IconComponent = tool.icon;
        const isSelected = selectedTool === tool.id;
        const isDisabled = tool.status === "coming-soon";
        
        return (
          <Card 
            key={tool.id}
            className={`cursor-pointer transition-all hover-elevate ${
              isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
            } ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            onClick={!isDisabled ? tool.action : undefined}
            data-testid={`card-ai-tool-${tool.id}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">{tool.title}</CardTitle>
                  </div>
                </div>
                {getStatusBadge(tool.status)}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                {tool.description}
              </p>
              <Button 
                size="sm" 
                variant={isSelected ? "default" : "outline"} 
                className="w-full"
                disabled={isDisabled}
                data-testid={`button-activate-${tool.id}`}
              >
                {isSelected ? "Active" : isDisabled ? "Coming Soon" : "Activate"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}