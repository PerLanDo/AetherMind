import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Download,
  Check,
  Loader2,
  BookOpen,
  Globe,
  FileText,
  Edit,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Citation {
  id: string;
  format: string;
  citation: string;
  inText: string;
  source: string;
  sourceType: string;
  extractedInfo: any;
  createdAt: string;
}

interface FormatGuideline {
  name: string;
  inText: string;
  book: string;
  journal: string;
  website: string;
}

interface CitationGeneratorProps {
  onClose?: () => void;
}

export default function CitationGenerator({ onClose }: CitationGeneratorProps) {
  const [activeTab, setActiveTab] = useState("generate");
  const [source, setSource] = useState("");
  const [sourceType, setSourceType] = useState<
    "url" | "doi" | "text" | "manual"
  >("url");
  const [format, setFormat] = useState("apa");
  const [isGenerating, setIsGenerating] = useState(false);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formatGuidelines, setFormatGuidelines] = useState<
    Record<string, FormatGuideline>
  >({});
  const [manualInfo, setManualInfo] = useState({
    title: "",
    authors: "",
    publicationDate: "",
    publisher: "",
    journal: "",
    volume: "",
    issue: "",
    pages: "",
    url: "",
    doi: "",
  });

  const { toast } = useToast();

  const generateCitation = async () => {
    if (!source.trim()) {
      toast({
        title: "Missing source",
        description: "Please enter a source to generate citation",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/citations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          source: source.trim(),
          sourceType,
          format,
          extractedInfo:
            sourceType === "manual"
              ? {
                  title: manualInfo.title,
                  authors: manualInfo.authors
                    .split(",")
                    .map((a) => a.trim())
                    .filter(Boolean),
                  publicationDate: manualInfo.publicationDate,
                  publisher: manualInfo.publisher,
                  journal: manualInfo.journal,
                  volume: manualInfo.volume,
                  issue: manualInfo.issue,
                  pages: manualInfo.pages,
                  url: manualInfo.url,
                  doi: manualInfo.doi,
                }
              : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate citation");
      }

      const citation = await response.json();
      setCitations((prev) => [citation, ...prev]);
      setSource("");

      toast({
        title: "Citation generated",
        description: `Successfully generated ${format.toUpperCase()} citation`,
      });
    } catch (error) {
      console.error("Citation generation error:", error);
      toast({
        title: "Generation failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate citation",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: "Copied!",
        description: "Citation copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const convertFormat = async (citation: Citation, newFormat: string) => {
    try {
      const response = await fetch("/api/citations/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ citation, newFormat }),
      });

      if (!response.ok) throw new Error("Conversion failed");

      const convertedCitation = await response.json();
      setCitations((prev) => [convertedCitation, ...prev]);

      toast({
        title: "Format converted",
        description: `Citation converted to ${newFormat.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Conversion failed",
        description: "Could not convert citation format",
        variant: "destructive",
      });
    }
  };

  const generateBibliography = async () => {
    if (citations.length === 0) {
      toast({
        title: "No citations",
        description: "Generate some citations first",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/citations/bibliography", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ citations, format }),
      });

      if (!response.ok) throw new Error("Bibliography generation failed");

      const { bibliography } = await response.json();

      // Create and download bibliography file
      const blob = new Blob([bibliography], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bibliography_${format}_${
        new Date().toISOString().split("T")[0]
      }.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Bibliography generated",
        description: "Bibliography downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Could not generate bibliography",
        variant: "destructive",
      });
    }
  };

  const loadFormatGuidelines = async () => {
    try {
      const response = await fetch("/api/citations/formats", {
        credentials: "include",
      });
      if (response.ok) {
        const guidelines = await response.json();
        setFormatGuidelines(guidelines);
      }
    } catch (error) {
      console.error("Error loading format guidelines:", error);
    }
  };

  // Load format guidelines on mount
  useState(() => {
    loadFormatGuidelines();
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Citation Generator</h1>
            <p className="text-muted-foreground">
              Generate citations in APA, MLA, Chicago, Harvard, and IEEE formats
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate Citation</TabsTrigger>
          <TabsTrigger value="library">Citation Library</TabsTrigger>
          <TabsTrigger value="guidelines">Format Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Citation</CardTitle>
              <CardDescription>
                Enter a URL, DOI, text excerpt, or manual information to
                generate a formatted citation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sourceType">Source Type</Label>
                  <Select
                    value={sourceType}
                    onValueChange={(value: any) => setSourceType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="url">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Website URL
                        </div>
                      </SelectItem>
                      <SelectItem value="doi">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          DOI
                        </div>
                      </SelectItem>
                      <SelectItem value="text">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Text Excerpt
                        </div>
                      </SelectItem>
                      <SelectItem value="manual">
                        <div className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          Manual Entry
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Citation Format</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apa">APA 7th Edition</SelectItem>
                      <SelectItem value="mla">MLA 8th Edition</SelectItem>
                      <SelectItem value="chicago">
                        Chicago 17th Edition
                      </SelectItem>
                      <SelectItem value="harvard">Harvard Style</SelectItem>
                      <SelectItem value="ieee">IEEE Style</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {sourceType !== "manual" ? (
                <div className="space-y-2">
                  <Label htmlFor="source">
                    {sourceType === "url" && "Website URL"}
                    {sourceType === "doi" && "DOI (e.g., 10.1000/123456)"}
                    {sourceType === "text" && "Text or Reference"}
                  </Label>
                  <Textarea
                    id="source"
                    placeholder={
                      sourceType === "url"
                        ? "https://example.com/article"
                        : sourceType === "doi"
                        ? "10.1000/123456"
                        : "Paste the text containing citation information..."
                    }
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    rows={3}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Manual Citation Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="Article or book title"
                        value={manualInfo.title}
                        onChange={(e) =>
                          setManualInfo((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authors">Authors *</Label>
                      <Input
                        id="authors"
                        placeholder="Smith, J., Doe, A. (comma-separated)"
                        value={manualInfo.authors}
                        onChange={(e) =>
                          setManualInfo((prev) => ({
                            ...prev,
                            authors: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="publicationDate">Publication Date</Label>
                      <Input
                        id="publicationDate"
                        placeholder="2023-01-15 or 2023"
                        value={manualInfo.publicationDate}
                        onChange={(e) =>
                          setManualInfo((prev) => ({
                            ...prev,
                            publicationDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="publisher">Publisher</Label>
                      <Input
                        id="publisher"
                        placeholder="Publisher name"
                        value={manualInfo.publisher}
                        onChange={(e) =>
                          setManualInfo((prev) => ({
                            ...prev,
                            publisher: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="journal">Journal Name</Label>
                      <Input
                        id="journal"
                        placeholder="Journal of Example Research"
                        value={manualInfo.journal}
                        onChange={(e) =>
                          setManualInfo((prev) => ({
                            ...prev,
                            journal: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="volume">Volume/Issue/Pages</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Vol."
                          value={manualInfo.volume}
                          onChange={(e) =>
                            setManualInfo((prev) => ({
                              ...prev,
                              volume: e.target.value,
                            }))
                          }
                        />
                        <Input
                          placeholder="Issue"
                          value={manualInfo.issue}
                          onChange={(e) =>
                            setManualInfo((prev) => ({
                              ...prev,
                              issue: e.target.value,
                            }))
                          }
                        />
                        <Input
                          placeholder="Pages"
                          value={manualInfo.pages}
                          onChange={(e) =>
                            setManualInfo((prev) => ({
                              ...prev,
                              pages: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="url">URL (optional)</Label>
                      <Input
                        id="url"
                        placeholder="https://..."
                        value={manualInfo.url}
                        onChange={(e) =>
                          setManualInfo((prev) => ({
                            ...prev,
                            url: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doi">DOI (optional)</Label>
                      <Input
                        id="doi"
                        placeholder="10.1000/123456"
                        value={manualInfo.doi}
                        onChange={(e) =>
                          setManualInfo((prev) => ({
                            ...prev,
                            doi: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manualSource">Source Reference</Label>
                    <Input
                      id="manualSource"
                      placeholder="Brief description for internal reference"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={generateCitation}
                disabled={
                  isGenerating ||
                  !source.trim() ||
                  (sourceType === "manual" && !manualInfo.title)
                }
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Citation...
                  </>
                ) : (
                  `Generate ${format.toUpperCase()} Citation`
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Citation Library</h2>
              <p className="text-muted-foreground">
                {citations.length} citations generated
              </p>
            </div>
            <Button
              onClick={generateBibliography}
              disabled={citations.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Generate Bibliography
            </Button>
          </div>

          {citations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Citations Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Generate your first citation to start building your
                  bibliography
                </p>
                <Button onClick={() => setActiveTab("generate")}>
                  Generate Citation
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {citations.map((citation) => (
                <Card key={citation.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          {citation.format.toUpperCase()}
                        </Badge>
                        <div className="flex gap-2">
                          {["apa", "mla", "chicago", "harvard", "ieee"]
                            .filter((fmt) => fmt !== citation.format)
                            .map((fmt) => (
                              <Button
                                key={fmt}
                                variant="ghost"
                                size="sm"
                                onClick={() => convertFormat(citation, fmt)}
                              >
                                Convert to {fmt.toUpperCase()}
                              </Button>
                            ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm text-muted-foreground">
                          Full Citation
                        </Label>
                        <div className="flex items-start gap-2 mt-1">
                          <p className="text-sm flex-1 font-mono bg-muted p-2 rounded">
                            {citation.citation}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(
                                citation.citation,
                                `full-${citation.id}`
                              )
                            }
                          >
                            {copiedId === `full-${citation.id}` ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm text-muted-foreground">
                          In-Text Citation
                        </Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                            {citation.inText}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(
                                citation.inText,
                                `intext-${citation.id}`
                              )
                            }
                          >
                            {copiedId === `intext-${citation.id}` ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Source: {citation.source} • {citation.sourceType} •{" "}
                        {new Date(citation.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Citation Format Guidelines</CardTitle>
              <CardDescription>
                Quick reference for different citation styles and formats
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.entries(formatGuidelines).map(
                ([formatKey, guidelines]) => (
                  <div key={formatKey} className="mb-6 last:mb-0">
                    <h3 className="text-lg font-semibold mb-3">
                      {guidelines.name}
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm font-medium">
                          In-Text Citation:
                        </Label>
                        <code className="block text-sm bg-muted p-2 rounded mt-1">
                          {guidelines.inText}
                        </code>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Book:</Label>
                        <code className="block text-sm bg-muted p-2 rounded mt-1">
                          {guidelines.book}
                        </code>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">
                          Journal Article:
                        </Label>
                        <code className="block text-sm bg-muted p-2 rounded mt-1">
                          {guidelines.journal}
                        </code>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Website:</Label>
                        <code className="block text-sm bg-muted p-2 rounded mt-1">
                          {guidelines.website}
                        </code>
                      </div>
                    </div>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
