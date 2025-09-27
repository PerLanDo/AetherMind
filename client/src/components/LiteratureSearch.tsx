import { useState } from "react";
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
import {
  Search,
  BookOpen,
  ExternalLink,
  Calendar,
  Users,
  Quote,
  Loader2,
  Lightbulb,
  FileText,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaperResult {
  title: string;
  authors: string[];
  abstract?: string;
  journal?: string;
  year?: number;
  doi?: string;
  url?: string;
  relevanceScore?: number;
  citationCount?: number;
  subjects?: string[];
}

interface LiteratureResponse {
  papers: PaperResult[];
  suggestions: string[];
  searchStrategy: string;
  totalResults: number;
  query: string;
  timestamp: string;
}

interface LiteratureSearchProps {
  onClose?: () => void;
  initialQuery?: string;
  projectId?: string;
}

export default function LiteratureSearch({
  onClose,
  initialQuery = "",
  projectId,
}: LiteratureSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [subject, setSubject] = useState("");
  const [maxResults, setMaxResults] = useState(15);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<LiteratureResponse | null>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const subjectAreas = [
    "Computer Science",
    "Medicine",
    "Biology",
    "Physics",
    "Chemistry",
    "Psychology",
    "Economics",
    "Engineering",
    "Mathematics",
    "Social Sciences",
    "Environmental Science",
    "Education",
    "Business",
    "Law",
  ];

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setError("");

    try {
      const searchRequest = {
        query: query.trim(),
        keywords,
        subject: subject || undefined,
        maxResults,
        projectId: projectId || undefined,
      };

      const response = await fetch("/api/literature/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchRequest),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data: LiteratureResponse = await response.json();
      setResults(data);

      toast({
        title: "Search Complete",
        description: `Found ${data.papers.length} papers`,
      });
    } catch (error) {
      console.error("Literature search error:", error);
      setError("Failed to search literature. Please try again.");
      toast({
        title: "Search Failed",
        description: "There was an error searching for literature.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handlePaperClick = (paper: PaperResult) => {
    if (paper.url) {
      window.open(paper.url, "_blank", "noopener,noreferrer");
    } else if (paper.doi) {
      window.open(
        `https://doi.org/${paper.doi}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const formatAuthors = (authors: string[]) => {
    if (authors.length === 0) return "Unknown authors";
    if (authors.length <= 3) return authors.join(", ");
    return `${authors.slice(0, 3).join(", ")}, et al.`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Literature Discovery</h2>
            <p className="text-muted-foreground">
              Find relevant academic papers and research
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Literature Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Search Query */}
          <div className="space-y-2">
            <Label htmlFor="query">Search Query</Label>
            <Textarea
              id="query"
              placeholder="Enter your research topic, question, or keywords..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
            />
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label>Additional Keywords</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add keyword..."
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={handleKeywordKeyPress}
              />
              <Button type="button" onClick={handleAddKeyword} size="sm">
                Add
              </Button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {keywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveKeyword(keyword)}
                  >
                    {keyword} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject Area</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All subjects</SelectItem>
                  {subjectAreas.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Max Results</Label>
              <Select
                value={maxResults.toString()}
                onValueChange={(value) => setMaxResults(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 results</SelectItem>
                  <SelectItem value="15">15 results</SelectItem>
                  <SelectItem value="25">25 results</SelectItem>
                  <SelectItem value="50">50 results</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="w-full"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching Literature...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search Literature
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search Results */}
      {results && (
        <div className="space-y-4">
          {/* Search Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Search Results</h3>
                  <p className="text-sm text-muted-foreground">
                    Found {results.papers.length} papers for "{results.query}"
                  </p>
                </div>
                <Badge variant="outline">{results.totalResults} total</Badge>
              </div>

              {/* Search Strategy */}
              {results.searchStrategy &&
                results.searchStrategy !== results.query && (
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">
                        Enhanced Search Strategy:
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {results.searchStrategy}
                    </p>
                  </div>
                )}

              {/* AI Suggestions */}
              {results.suggestions.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-500" />
                    Search Suggestions
                  </h4>
                  <ul className="space-y-1">
                    {results.suggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-blue-500 mt-1">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Papers List */}
          <div className="space-y-3">
            {results.papers.map((paper, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handlePaperClick(paper)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 pr-4">
                      <h4 className="font-semibold text-lg leading-tight mb-2 hover:text-blue-600">
                        {paper.title}
                      </h4>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {formatAuthors(paper.authors)}
                        </div>

                        {paper.year && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {paper.year}
                          </div>
                        )}

                        {paper.citationCount !== undefined &&
                          paper.citationCount > 0 && (
                            <div className="flex items-center gap-1">
                              <Quote className="h-3 w-3" />
                              {paper.citationCount} citations
                            </div>
                          )}
                      </div>

                      {paper.journal && (
                        <p className="text-sm font-medium text-blue-600 mb-2">
                          {paper.journal}
                        </p>
                      )}

                      {paper.abstract && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {paper.abstract}
                        </p>
                      )}

                      {paper.subjects && paper.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {paper.subjects.slice(0, 3).map((subject) => (
                            <Badge
                              key={subject}
                              variant="outline"
                              className="text-xs"
                            >
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {paper.relevanceScore && (
                        <Badge variant="secondary" className="text-xs">
                          Score: {paper.relevanceScore.toFixed(1)}
                        </Badge>
                      )}
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  {paper.doi && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        DOI:
                      </span>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {paper.doi}
                      </code>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {results.papers.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No papers found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or removing filters
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Suggestions:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Use broader keywords</li>
                    <li>Try different synonyms</li>
                    <li>Remove subject area filter</li>
                    <li>Check spelling of technical terms</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
