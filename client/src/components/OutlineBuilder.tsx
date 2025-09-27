import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FileText,
  Plus,
  ChevronDown,
  ChevronRight,
  Edit3,
  Download,
  Loader2,
  BookOpen,
  CheckCircle2,
  Clock,
  Target,
  Lightbulb,
  X,
  GripVertical,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OutlineSection {
  id: string;
  title: string;
  content: string;
  subsections?: OutlineSection[];
  order: number;
  level: number;
  suggestions?: string[];
  wordCount?: number;
  completed?: boolean;
}

interface OutlineResponse {
  outline: OutlineSection[];
  metadata: {
    estimatedWordCount: number;
    suggestedTimeFrame: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    keyComponents: string[];
  };
  writingTips: string[];
  researchSuggestions: string[];
  timestamp: string;
}

interface OutlineBuilderProps {
  onClose?: () => void;
  projectId?: string;
}

export default function OutlineBuilder({
  onClose,
  projectId,
}: OutlineBuilderProps) {
  const [activeTab, setActiveTab] = useState("create");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDraftGenerating, setIsDraftGenerating] = useState(false);
  const [outline, setOutline] = useState<OutlineResponse | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [selectedSection, setSelectedSection] = useState<OutlineSection | null>(
    null
  );
  const [sectionDraft, setSectionDraft] = useState("");
  const [error, setError] = useState("");

  // Form state
  const [topic, setTopic] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [length, setLength] = useState("medium");
  const [customLength, setCustomLength] = useState("");
  const [style, setStyle] = useState("academic");
  const [requirements, setRequirements] = useState("");
  const [improvementFeedback, setImprovementFeedback] = useState("");

  const { toast } = useToast();

  const documentTypes = [
    { value: "thesis", label: "Thesis" },
    { value: "essay", label: "Essay" },
    { value: "research-paper", label: "Research Paper" },
    { value: "dissertation", label: "Dissertation" },
    { value: "report", label: "Report" },
    { value: "article", label: "Article" },
  ];

  const lengthOptions = [
    { value: "short", label: "Short (1,000-2,500 words)" },
    { value: "medium", label: "Medium (2,500-5,000 words)" },
    { value: "long", label: "Long (5,000-10,000 words)" },
    { value: "custom", label: "Custom Length" },
  ];

  const styleOptions = [
    { value: "academic", label: "Academic" },
    { value: "scientific", label: "Scientific" },
    { value: "formal", label: "Formal" },
    { value: "analytical", label: "Analytical" },
    { value: "argumentative", label: "Argumentative" },
  ];

  const handleGenerateOutline = async () => {
    if (!topic.trim() || !documentType) {
      toast({
        title: "Error",
        description: "Please provide a topic and document type.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const request = {
        topic: topic.trim(),
        type: documentType,
        length,
        customLength: length === "custom" ? parseInt(customLength) : undefined,
        style,
        requirements: requirements.trim() || undefined,
        projectId,
      };

      const response = await fetch("/api/outline/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to generate outline");
      }

      const data: OutlineResponse = await response.json();
      setOutline(data);
      setActiveTab("outline");

      // Expand all main sections by default
      const mainSectionIds = new Set(data.outline.map((section) => section.id));
      setExpandedSections(mainSectionIds);

      toast({
        title: "Outline Generated",
        description: "Your outline has been successfully created!",
      });
    } catch (error) {
      console.error("Outline generation error:", error);
      setError("Failed to generate outline. Please try again.");
      toast({
        title: "Generation Failed",
        description: "There was an error generating the outline.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSectionDraft = async (section: OutlineSection) => {
    setSelectedSection(section);
    setIsDraftGenerating(true);
    setSectionDraft("");

    try {
      const request = {
        outlineSection: section,
        tone: style,
        targetWordCount: section.wordCount,
        includeTransitions: true,
      };

      const response = await fetch("/api/outline/generate-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to generate draft");
      }

      const data = await response.json();
      setSectionDraft(data.content);
      setActiveTab("draft");

      toast({
        title: "Draft Generated",
        description: `Generated ${data.wordCount} words for "${section.title}"`,
      });
    } catch (error) {
      console.error("Draft generation error:", error);
      toast({
        title: "Draft Generation Failed",
        description: "There was an error generating the section draft.",
        variant: "destructive",
      });
    } finally {
      setIsDraftGenerating(false);
    }
  };

  const handleImproveOutline = async () => {
    if (!outline || !improvementFeedback.trim()) {
      toast({
        title: "Error",
        description: "Please provide feedback for outline improvement.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const request = {
        outline: outline.outline,
        feedback: improvementFeedback.trim(),
        type: documentType,
      };

      const response = await fetch("/api/outline/improve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to improve outline");
      }

      const data = await response.json();
      setOutline((prev) => (prev ? { ...prev, outline: data.outline } : null));
      setImprovementFeedback("");

      toast({
        title: "Outline Improved",
        description: "Your outline has been updated based on your feedback.",
      });
    } catch (error) {
      console.error("Outline improvement error:", error);
      toast({
        title: "Improvement Failed",
        description: "There was an error improving the outline.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportOutline = async (format: string) => {
    if (!outline) return;

    try {
      const response = await fetch("/api/outline/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          outline: outline.outline,
          format,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to export outline");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `outline.${
        format === "markdown" ? "md" : format === "latex" ? "tex" : format
      }`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Outline exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting the outline.",
        variant: "destructive",
      });
    }
  };

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const renderSection = (section: OutlineSection, depth = 0) => {
    const isExpanded = expandedSections.has(section.id);
    const hasSubsections =
      section.subsections && section.subsections.length > 0;

    return (
      <div
        key={section.id}
        className={`border-l-2 border-muted ${depth > 0 ? "ml-4" : ""}`}
      >
        <Collapsible
          open={isExpanded}
          onOpenChange={() => toggleSection(section.id)}
        >
          <div className="flex items-center p-3 hover:bg-muted/30 rounded-lg group">
            <div className="flex items-center flex-1 gap-2">
              {hasSubsections && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              )}

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4
                    className={`font-medium ${
                      depth === 0 ? "text-lg" : "text-base"
                    }`}
                  >
                    {section.title}
                  </h4>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {section.wordCount && (
                      <Badge variant="outline" className="text-xs">
                        ~{section.wordCount} words
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGenerateSectionDraft(section)}
                      disabled={isDraftGenerating}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {section.content && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {section.content}
                  </p>
                )}

                {section.suggestions && section.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {section.suggestions
                      .slice(0, 2)
                      .map((suggestion, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {suggestion}
                        </Badge>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {hasSubsections && (
            <CollapsibleContent className="pl-4">
              {section.subsections!.map((subsection) =>
                renderSection(subsection, depth + 1)
              )}
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Outline & Draft Builder</h2>
            <p className="text-muted-foreground">
              Create structured outlines and generate draft content for your
              academic writing
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">Create Outline</TabsTrigger>
          <TabsTrigger value="outline" disabled={!outline}>
            View Outline
          </TabsTrigger>
          <TabsTrigger value="draft" disabled={!selectedSection}>
            Section Draft
          </TabsTrigger>
          <TabsTrigger value="export" disabled={!outline}>
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Outline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic / Research Question</Label>
                  <Textarea
                    id="topic"
                    placeholder="Enter your research topic or question..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Document Type</Label>
                    <Select
                      value={documentType}
                      onValueChange={setDocumentType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Length</Label>
                    <Select value={length} onValueChange={setLength}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {lengthOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {length === "custom" && (
                    <div className="space-y-2">
                      <Label>Custom Word Count</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 3000"
                        value={customLength}
                        onChange={(e) => setCustomLength(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Writing Style</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {styleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Additional Requirements (Optional)</Label>
                  <Textarea
                    placeholder="Any specific requirements, guidelines, or constraints..."
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerateOutline}
                disabled={isGenerating || !topic.trim() || !documentType}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Outline...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Outline
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="outline" className="space-y-6">
          {outline && (
            <>
              {/* Outline Metadata */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Word Count</p>
                        <p className="text-lg font-bold">
                          {outline.metadata.estimatedWordCount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">Time Frame</p>
                        <p className="text-lg font-bold">
                          {outline.metadata.suggestedTimeFrame}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium">Difficulty</p>
                        <Badge variant="outline" className="mt-1">
                          {outline.metadata.difficulty}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium">Sections</p>
                        <p className="text-lg font-bold">
                          {outline.outline.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Outline Structure */}
              <Card>
                <CardHeader>
                  <CardTitle>Outline Structure</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setExpandedSections(
                          new Set(outline.outline.map((s) => s.id))
                        )
                      }
                    >
                      Expand All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedSections(new Set())}
                    >
                      Collapse All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {outline.outline.map((section) => renderSection(section))}
                  </div>
                </CardContent>
              </Card>

              {/* Improvement Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Improve Outline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Feedback for Improvement</Label>
                    <Textarea
                      placeholder="Provide feedback on what you'd like to improve in the outline..."
                      value={improvementFeedback}
                      onChange={(e) => setImprovementFeedback(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleImproveOutline}
                    disabled={isGenerating || !improvementFeedback.trim()}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Improving...
                      </>
                    ) : (
                      <>
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Improve Outline
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Tips and Suggestions */}
              {(outline.writingTips.length > 0 ||
                outline.researchSuggestions.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {outline.writingTips.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Edit3 className="h-5 w-5" />
                          Writing Tips
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {outline.writingTips.map((tip, index) => (
                            <li
                              key={index}
                              className="text-sm flex items-start gap-2"
                            >
                              <span className="text-blue-500 mt-1">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {outline.researchSuggestions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Research Suggestions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {outline.researchSuggestions.map(
                            (suggestion, index) => (
                              <li
                                key={index}
                                className="text-sm flex items-start gap-2"
                              >
                                <span className="text-green-500 mt-1">•</span>
                                {suggestion}
                              </li>
                            )
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="draft" className="space-y-6">
          {selectedSection && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Section Draft: {selectedSection.title}</CardTitle>
                  <p className="text-muted-foreground">
                    AI-generated draft content for this section
                  </p>
                </CardHeader>
                <CardContent>
                  {isDraftGenerating ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Generating draft content...
                    </div>
                  ) : sectionDraft ? (
                    <div className="space-y-4">
                      <div className="prose prose-sm max-w-none bg-muted/20 p-4 rounded-lg">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                          {sectionDraft}
                        </pre>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() =>
                            navigator.clipboard.writeText(sectionDraft)
                          }
                        >
                          Copy to Clipboard
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const blob = new Blob([sectionDraft], {
                              type: "text/plain",
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${selectedSection.title.replace(
                              /[^a-zA-Z0-9]/g,
                              "_"
                            )}.txt`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                        >
                          Download as Text
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Click "Generate Draft" on any section to create content
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Outline</CardTitle>
              <p className="text-muted-foreground">
                Download your outline in various formats
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleExportOutline("markdown")}
                  className="h-20 flex-col gap-2"
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">Markdown</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleExportOutline("word")}
                  className="h-20 flex-col gap-2"
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">Word Doc</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleExportOutline("latex")}
                  className="h-20 flex-col gap-2"
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">LaTeX</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleExportOutline("json")}
                  className="h-20 flex-col gap-2"
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">JSON</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
