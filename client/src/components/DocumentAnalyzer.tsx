import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  FileText,
  Loader2,
  Brain,
  List,
  Search,
  BookOpen,
  Quote,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentAnalyzerProps {
  fileId: string;
  fileName: string;
  onClose?: () => void;
}

export type AnalysisType =
  | "summary"
  | "key_points"
  | "research_questions"
  | "methodology"
  | "references";

interface AnalysisResponse {
  fileId: string;
  fileName: string;
  analysisType: AnalysisType;
  analysis: string;
  timestamp: string;
}

const analysisTypeConfig = {
  summary: {
    label: "Document Summary",
    description: "Get a comprehensive overview of the document's main points",
    icon: FileText,
  },
  key_points: {
    label: "Key Points",
    description: "Extract the most important insights and findings",
    icon: List,
  },
  research_questions: {
    label: "Research Questions",
    description: "Identify the main research objectives and questions",
    icon: Search,
  },
  methodology: {
    label: "Methodology",
    description: "Analyze the research methods and approach used",
    icon: BookOpen,
  },
  references: {
    label: "References & Citations",
    description: "Extract and organize references and sources",
    icon: Quote,
  },
};

export default function DocumentAnalyzer({
  fileId,
  fileName,
  onClose,
}: DocumentAnalyzerProps) {
  const [selectedType, setSelectedType] = useState<AnalysisType>("summary");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError("");
    setAnalysis("");

    try {
      const response = await fetch(`/api/files/${fileId}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ analysisType: selectedType }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to analyze document");
      }

      const result: AnalysisResponse = await response.json();
      setAnalysis(result.analysis);

      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${fileName}`,
      });
    } catch (error) {
      console.error("Document analysis error:", error);
      setError("Failed to analyze document. Please try again.");
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const config = analysisTypeConfig[selectedType];
  const IconComponent = config.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Document Analysis</h2>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{fileName}</span>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        )}
      </div>

      {/* Analysis Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            Analysis Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Analysis Type</label>
            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as AnalysisType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(analysisTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <config.icon className="h-4 w-4" />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {config.description}
            </p>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Document...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Analyze Document
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <IconComponent className="h-5 w-5" />
                {config.label}
              </CardTitle>
              <Badge variant="secondary">{new Date().toLocaleString()}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap">{analysis}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
