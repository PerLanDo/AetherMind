import { useState, useEffect } from "react";
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
  ChevronDown,
  ChevronRight,
  Star,
  Zap,
  Search,
  FileCheck,
  Users,
  Pin,
  X,
  Sparkles,
  Brain,
  Target,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import WritingAssistant from "@/components/WritingAssistant";
import CitationGeneratorModal from "@/components/CitationGeneratorModal";
import LiteratureSearch from "@/components/LiteratureSearch";
import OutlineBuilder from "@/components/OutlineBuilder";
import DataAnalysisHelper from "@/components/DataAnalysisHelper";

interface AITool {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: "writing" | "research" | "analysis" | "collaboration";
  status?: "new" | "popular" | "recommended";
  usage: number;
  isPinned?: boolean;
  action: () => void;
}

interface ToolCategory {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  tools: AITool[];
  isOpen: boolean;
}

export default function AIToolsPanel() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("tools");
  const [pinnedTools, setPinnedTools] = useState<string[]>([]);
  const [categories, setCategories] = useState<ToolCategory[]>([]);
  
  // Component states for different tools
  const [showWritingAssistant, setShowWritingAssistant] = useState(false);
  const [showCitationGenerator, setShowCitationGenerator] = useState(false);
  const [showLiteratureSearch, setShowLiteratureSearch] = useState(false);
  const [showOutlineBuilder, setShowOutlineBuilder] = useState(false);
  const [showDataAnalysis, setShowDataAnalysis] = useState(false);

  // Initialize tools data
  useEffect(() => {
    const toolsData: ToolCategory[] = [
      {
        id: "writing",
        title: "Writing & Editing",
        icon: PenTool,
        description: "Improve your academic writing with AI assistance",
        isOpen: true,
        tools: [
          {
            id: "grammar",
            title: "Grammar & Spelling",
            description: "Check grammar, punctuation, and spelling errors",
            icon: CheckCircle2,
            category: "writing",
            status: "popular",
            usage: 85,
            action: () => setShowWritingAssistant(true)
          },
          {
            id: "writing_improvement",
            title: "Writing Enhancement",
            description: "Improve clarity, flow, and overall writing quality",
            icon: Sparkles,
            category: "writing",
            status: "new",
            usage: 72,
            action: () => setShowWritingAssistant(true)
          },
          {
            id: "tone_adjustment",
            title: "Tone & Style",
            description: "Adjust tone for academic, professional, or creative writing",
            icon: Volume2,
            category: "writing",
            usage: 68,
            action: () => setShowWritingAssistant(true)
          },
          {
            id: "paraphrase",
            title: "Paraphrase & Summarize",
            description: "Rephrase text and create summaries",
            icon: RotateCcw,
            category: "writing",
            status: "recommended",
            usage: 91,
            action: () => setShowWritingAssistant(true)
          }
        ]
      },
      {
        id: "research",
        title: "Research & Discovery",
        icon: Search,
        description: "Find and organize academic resources",
        isOpen: true,
        tools: [
          {
            id: "literature_search",
            title: "Literature Discovery",
            description: "Find relevant academic papers and sources",
            icon: BookOpen,
            category: "research",
            status: "popular",
            usage: 78,
            action: () => setShowLiteratureSearch(true)
          },
          {
            id: "citation_generator",
            title: "Citation Generator",
            description: "Generate proper citations (APA, MLA, Chicago)",
            icon: FileText,
            category: "research",
            status: "popular",
            usage: 95,
            action: () => setShowCitationGenerator(true)
          },
          {
            id: "outline_builder",
            title: "Outline & Structure",
            description: "Create structured outlines for papers and theses",
            icon: Layout,
            category: "research",
            status: "new",
            usage: 64,
            action: () => setShowOutlineBuilder(true)
          },
          {
            id: "keyword_extraction",
            title: "Keyword Extraction",
            description: "Extract key terms and important concepts",
            icon: Hash,
            category: "research",
            usage: 55,
            action: () => setShowWritingAssistant(true)
          }
        ]
      },
      {
        id: "analysis",
        title: "Analysis & Insights",
        icon: BarChart3,
        description: "Analyze data and generate insights",
        isOpen: false,
        tools: [
          {
            id: "data_analysis",
            title: "Data Analysis Helper",
            description: "Basic statistics and coding assistance",
            icon: BarChart3,
            category: "analysis",
            status: "recommended",
            usage: 73,
            action: () => setShowDataAnalysis(true)
          },
          {
            id: "readability",
            title: "Readability Analysis",
            description: "Analyze text complexity and improve accessibility",
            icon: Eye,
            category: "analysis",
            status: "new",
            usage: 42,
            action: () => setShowWritingAssistant(true)
          },
          {
            id: "originality",
            title: "Originality Check",
            description: "Check for potential plagiarism and improve originality",
            icon: Shield,
            category: "analysis",
            usage: 67,
            action: () => setShowWritingAssistant(true)
          }
        ]
      },
      {
        id: "collaboration",
        title: "Team & Collaboration",
        icon: Users,
        description: "Tools for team research and collaboration",
        isOpen: false,
        tools: [
          {
            id: "academic_style",
            title: "Academic Style Guide",
            description: "Transform text to proper academic conventions",
            icon: GraduationCap,
            category: "collaboration",
            usage: 38,
            action: () => setShowWritingAssistant(true)
          },
          {
            id: "creative_writing",
            title: "Creative Writing Helper",
            description: "Enhance narrative flow and creative expression",
            icon: Feather,
            category: "collaboration",
            usage: 29,
            action: () => setShowWritingAssistant(true)
          }
        ]
      }
    ];

    setCategories(toolsData);
    
    // Load pinned tools from localStorage
    const saved = localStorage.getItem('pinnedTools');
    if (saved) {
      setPinnedTools(JSON.parse(saved));
    }
  }, []);

  // Toggle category open/closed
  const toggleCategory = (categoryId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, isOpen: !cat.isOpen } : cat
    ));
  };

  // Toggle tool pinned status
  const togglePin = (toolId: string) => {
    const newPinned = pinnedTools.includes(toolId) 
      ? pinnedTools.filter(id => id !== toolId)
      : [...pinnedTools, toolId];
    
    setPinnedTools(newPinned);
    localStorage.setItem('pinnedTools', JSON.stringify(newPinned));
  };

  // Get all tools flattened
  const allTools = categories.flatMap(cat => cat.tools);
  
  // Get pinned tools
  const pinnedToolsData = allTools.filter(tool => pinnedTools.includes(tool.id));
  
  // Get recommended tools (high usage or marked as recommended)
  const recommendedTools = allTools
    .filter(tool => tool.usage > 70 || tool.status === 'recommended')
    .slice(0, 4);

  // Filter tools based on search
  const filteredCategories = categories.map(category => ({
    ...category,
    tools: category.tools.filter(tool => 
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.tools.length > 0);

  // Render individual tool card
  const renderToolCard = (tool: AITool, showPin = true) => (
    <Card 
      key={tool.id} 
      className="group hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 border-l-transparent hover:border-l-primary"
      onClick={tool.action}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <tool.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{tool.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {tool.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 ml-2">
            {showPin && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(tool.id);
                }}
              >
                <Pin className={`h-3 w-3 ${pinnedTools.includes(tool.id) ? 'fill-current text-primary' : ''}`} />
              </Button>
            )}
            
            {tool.status && (
              <Badge 
                variant={tool.status === 'new' ? 'default' : 'secondary'} 
                className="text-xs px-1.5 py-0.5"
              >
                {tool.status === 'new' ? 'New' : 
                 tool.status === 'popular' ? 'Popular' : 'Rec'}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Usage indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          <span>{tool.usage}% usage rate</span>
          <div className="flex-1">
            <Progress value={tool.usage} className="h-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // If a tool is selected, show its component
  if (showWritingAssistant) {
    return <WritingAssistant selectedTool="grammar" onClose={() => setShowWritingAssistant(false)} />;
  }
  if (showCitationGenerator) {
    return <CitationGeneratorModal onClose={() => setShowCitationGenerator(false)} />;
  }
  if (showLiteratureSearch) {
    return <LiteratureSearch onClose={() => setShowLiteratureSearch(false)} />;
  }
  if (showOutlineBuilder) {
    return <OutlineBuilder onClose={() => setShowOutlineBuilder(false)} />;
  }
  if (showDataAnalysis) {
    return <DataAnalysisHelper onClose={() => setShowDataAnalysis(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Research Assistant
          </h2>
          <p className="text-muted-foreground">
            Powerful AI tools to enhance your research and writing
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            All Tools
          </TabsTrigger>
          <TabsTrigger value="pinned" className="flex items-center gap-2">
            <Pin className="h-4 w-4" />
            Pinned ({pinnedTools.length})
          </TabsTrigger>
          <TabsTrigger value="recommended" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Recommended
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Writing Tools</span>
                </div>
                <p className="text-2xl font-bold text-blue-500 mt-1">
                  {categories.find(c => c.id === 'writing')?.tools.length || 0}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Research Tools</span>
                </div>
                <p className="text-2xl font-bold text-green-500 mt-1">
                  {categories.find(c => c.id === 'research')?.tools.length || 0}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Analysis Tools</span>
                </div>
                <p className="text-2xl font-bold text-purple-500 mt-1">
                  {categories.find(c => c.id === 'analysis')?.tools.length || 0}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Pin className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Pinned Tools</span>
                </div>
                <p className="text-2xl font-bold text-orange-500 mt-1">
                  {pinnedTools.length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Categorized Tools */}
          <div className="space-y-4">
            {(searchQuery ? filteredCategories : categories).map((category) => (
              <Card key={category.id} className="overflow-hidden">
                <Collapsible open={category.isOpen} onOpenChange={() => toggleCategory(category.id)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <category.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{category.title}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {category.description} • {category.tools.length} tools
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {category.tools.filter(t => t.status === 'new').length} new
                          </Badge>
                          {category.isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {category.tools.map(tool => renderToolCard(tool))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pinned" className="space-y-6">
          {pinnedToolsData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pinnedToolsData.map(tool => renderToolCard(tool))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Pin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Pinned Tools</h3>
              <p className="text-muted-foreground mb-4">
                Pin your frequently used tools for quick access
              </p>
              <Button onClick={() => setActiveTab("tools")}>
                Browse All Tools
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommended" className="space-y-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Recommended for You</h3>
            <p className="text-muted-foreground">
              Based on usage patterns and your research focus
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedTools.map(tool => renderToolCard(tool))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}