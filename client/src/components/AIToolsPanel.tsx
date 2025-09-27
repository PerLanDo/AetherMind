import { useState } from "react";
import {
  MessageSquare,
  CheckCircle2,
  RotateCcw,
  FileText,
  Lightbulb,
  BookOpen,
  BarChart3,
  PenTool,
  Volume2,
  Eye,
  Shield,
  Layout,
  Hash,
  GraduationCap,
  Feather,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import WritingAssistant from "@/components/WritingAssistant";
import CitationGenerator from "@/components/CitationGenerator";
import LiteratureSearch from "@/components/LiteratureSearch";
import OutlineBuilder from "@/components/OutlineBuilder";
import DataAnalysisHelper from "@/components/DataAnalysisHelper";

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
  const [showWritingAssistant, setShowWritingAssistant] = useState(false);
  const [showCitationGenerator, setShowCitationGenerator] = useState(false);
  const [showLiteratureSearch, setShowLiteratureSearch] = useState(false);
  const [showOutlineBuilder, setShowOutlineBuilder] = useState(false);
  const [showDataAnalysis, setShowDataAnalysis] = useState(false);

  const writingTools = [
    "grammar",
    "writing_improvement",
    "tone_adjustment",
    "readability_check",
    "plagiarism_check",
    "structure_analysis",
    "keyword_extraction",
    "academic_style",
    "creative_writing",
    "technical_writing",
    "paraphrase",
  ];

  const handleToolActivation = (toolId: string) => {
    setSelectedTool(toolId);

    // Reset all tool states
    setShowWritingAssistant(false);
    setShowCitationGenerator(false);
    setShowLiteratureSearch(false);
    setShowOutlineBuilder(false);
    setShowDataAnalysis(false);

    if (writingTools.includes(toolId)) {
      setShowWritingAssistant(true);
    } else if (toolId === "citation") {
      setShowCitationGenerator(true);
    } else if (toolId === "literature") {
      setShowLiteratureSearch(true);
    } else if (toolId === "outline") {
      setShowOutlineBuilder(true);
    } else if (toolId === "analysis") {
      setShowDataAnalysis(true);
    } else {
      console.log(`${toolId} activated`);
    }
  };

  const aiTools: AITool[] = [
    {
      id: "qa",
      title: "AI Q&A",
      description: "Ask questions about your uploaded research files",
      icon: MessageSquare,
      status: "available",
      action: () => handleToolActivation("qa"),
    },
    {
      id: "grammar",
      title: "Grammar & Spelling",
      description: "Check grammar, punctuation, and spelling errors",
      icon: CheckCircle2,
      status: "available",
      action: () => handleToolActivation("grammar"),
    },
    {
      id: "writing_improvement",
      title: "Writing Enhancement",
      description: "Improve clarity, flow, and overall writing quality",
      icon: PenTool,
      status: "new",
      action: () => handleToolActivation("writing_improvement"),
    },
    {
      id: "tone_adjustment",
      title: "Tone & Style Adjustment",
      description:
        "Adjust tone for academic, professional, or creative writing",
      icon: Volume2,
      status: "new",
      action: () => handleToolActivation("tone_adjustment"),
    },
    {
      id: "readability_check",
      title: "Readability Analysis",
      description: "Analyze text complexity and improve accessibility",
      icon: Eye,
      status: "new",
      action: () => handleToolActivation("readability_check"),
    },
    {
      id: "paraphrase",
      title: "Paraphrase & Summarize",
      description: "Rephrase text and create summaries",
      icon: RotateCcw,
      status: "available",
      action: () => handleToolActivation("paraphrase"),
    },
    {
      id: "plagiarism_check",
      title: "Originality Check",
      description: "Check for potential plagiarism and improve originality",
      icon: Shield,
      status: "new",
      action: () => handleToolActivation("plagiarism_check"),
    },
    {
      id: "structure_analysis",
      title: "Structure Analysis",
      description: "Analyze document organization and logical flow",
      icon: Layout,
      status: "new",
      action: () => handleToolActivation("structure_analysis"),
    },
    {
      id: "keyword_extraction",
      title: "Keyword Extraction",
      description: "Extract key terms and important concepts",
      icon: Hash,
      status: "new",
      action: () => handleToolActivation("keyword_extraction"),
    },
    {
      id: "academic_style",
      title: "Academic Style Guide",
      description: "Transform text to proper academic conventions",
      icon: GraduationCap,
      status: "new",
      action: () => handleToolActivation("academic_style"),
    },
    {
      id: "creative_writing",
      title: "Creative Writing Helper",
      description: "Enhance narrative flow and creative expression",
      icon: Feather,
      status: "new",
      action: () => handleToolActivation("creative_writing"),
    },
    {
      id: "technical_writing",
      title: "Technical Writing",
      description: "Improve clarity and precision of technical content",
      icon: Settings,
      status: "new",
      action: () => handleToolActivation("technical_writing"),
    },
    {
      id: "citation",
      title: "Citation Generator",
      description: "Generate proper academic citations (APA, MLA, Chicago)",
      icon: FileText,
      status: "available",
      action: () => handleToolActivation("citation"),
    },
    {
      id: "literature",
      title: "Literature Suggestions",
      description: "Discover relevant research papers",
      icon: Lightbulb,
      status: "available",
      action: () => handleToolActivation("literature"),
    },
    {
      id: "outline",
      title: "Outline & Draft Builder",
      description: "Structure your thesis or essays",
      icon: BookOpen,
      status: "available",
      action: () => handleToolActivation("outline"),
    },
    {
      id: "analysis",
      title: "Data Analysis Helper",
      description: "Basic statistics and coding assistance",
      icon: BarChart3,
      status: "available",
      action: () => handleToolActivation("analysis"),
    },
  ];

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "new":
        return (
          <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
            New
          </Badge>
        );
      case "coming-soon":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Coming Soon
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {aiTools.map((tool) => {
          const IconComponent = tool.icon;
          const isSelected = selectedTool === tool.id;
          const isDisabled = tool.status === "coming-soon";

          return (
            <Card
              key={tool.id}
              className={`cursor-pointer transition-all hover-elevate ${
                isSelected ? "ring-2 ring-primary bg-primary/5" : ""
              } ${isDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
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
                      <CardTitle className="text-sm font-medium">
                        {tool.title}
                      </CardTitle>
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
                  {isSelected
                    ? "Active"
                    : isDisabled
                    ? "Coming Soon"
                    : "Activate"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showWritingAssistant && selectedTool && (
        <WritingAssistant
          selectedTool={selectedTool}
          onClose={() => {
            setShowWritingAssistant(false);
            setSelectedTool(null);
          }}
        />
      )}

      {showCitationGenerator && <CitationGenerator />}

      {showLiteratureSearch && (
        <LiteratureSearch
          onClose={() => {
            setShowLiteratureSearch(false);
            setSelectedTool(null);
          }}
        />
      )}

      {showOutlineBuilder && (
        <OutlineBuilder
          onClose={() => {
            setShowOutlineBuilder(false);
            setSelectedTool(null);
          }}
        />
      )}

      {showDataAnalysis && (
        <DataAnalysisHelper
          onClose={() => {
            setShowDataAnalysis(false);
            setSelectedTool(null);
          }}
        />
      )}
    </>
  );
}
