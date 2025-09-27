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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Code2,
  Calculator,
  TrendingUp,
  FileSpreadsheet,
  Loader2,
  Copy,
  Download,
  X,
  Lightbulb,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DataAnalysisProps {
  onClose?: () => void;
}

interface AnalysisResult {
  result: string;
  code?: string;
  explanation: string;
  recommendations: string[];
  visualizationSuggestions?: string[];
  nextSteps: string[];
  timestamp: string;
}

interface BasicStats {
  count: number;
  mean: number;
  median: number;
  mode?: number;
  standardDeviation: number;
  variance: number;
  minimum: number;
  maximum: number;
  range: number;
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
    iqr: number;
  };
}

export default function DataAnalysisHelper({ onClose }: DataAnalysisProps) {
  const [activeTab, setActiveTab] = useState("analyze");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [basicStats, setBasicStats] = useState<BasicStats | null>(null);
  const [error, setError] = useState("");

  // Form state
  const [dataInput, setDataInput] = useState("");
  const [analysisType, setAnalysisType] = useState("");
  const [language, setLanguage] = useState("python");
  const [question, setQuestion] = useState("");
  const [variables, setVariables] = useState("");

  // Code generation state
  const [generatedCode, setGeneratedCode] = useState("");
  const [codeExplanation, setCodeExplanation] = useState("");

  const { toast } = useToast();

  const analysisTypes = [
    {
      value: "descriptive_stats",
      label: "Descriptive Statistics",
      icon: Calculator,
    },
    { value: "correlation", label: "Correlation Analysis", icon: TrendingUp },
    { value: "regression", label: "Regression Analysis", icon: BarChart3 },
    { value: "visualization", label: "Data Visualization", icon: BarChart3 },
    { value: "hypothesis_test", label: "Hypothesis Testing", icon: Calculator },
    { value: "data_cleaning", label: "Data Cleaning", icon: FileSpreadsheet },
    { value: "exploratory", label: "Exploratory Analysis", icon: Lightbulb },
  ];

  const languages = [
    { value: "python", label: "Python (pandas, numpy, matplotlib)" },
    { value: "r", label: "R (dplyr, ggplot2)" },
    { value: "excel", label: "Excel Functions" },
  ];

  const handleAnalyzeData = async () => {
    if (!dataInput.trim() || !analysisType) {
      toast({
        title: "Error",
        description: "Please provide data and select an analysis type.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setResults(null);

    try {
      const request = {
        data: dataInput.trim(),
        analysisType,
        language,
        question: question.trim() || undefined,
        variables: variables.trim()
          ? variables.split(",").map((v) => v.trim())
          : undefined,
      };

      const response = await fetch("/api/analysis/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data: AnalysisResult = await response.json();
      setResults(data);
      setActiveTab("results");

      toast({
        title: "Analysis Complete",
        description: "Your data analysis has been completed successfully!",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      setError(
        "Failed to analyze data. Please check your input and try again."
      );
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing your data.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!analysisType) {
      toast({
        title: "Error",
        description: "Please select an analysis type.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const request = {
        analysisType,
        language,
        data: dataInput.trim() || undefined,
        question: question.trim() || undefined,
        variables: variables.trim()
          ? variables.split(",").map((v) => v.trim())
          : undefined,
      };

      const response = await fetch("/api/analysis/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Code generation failed");
      }

      const data = await response.json();
      setGeneratedCode(data.code);
      setCodeExplanation(data.explanation);
      setActiveTab("code");

      toast({
        title: "Code Generated",
        description: `${language} code has been generated for your analysis.`,
      });
    } catch (error) {
      console.error("Code generation error:", error);
      toast({
        title: "Code Generation Failed",
        description: "There was an error generating the analysis code.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCalculateBasicStats = async () => {
    if (!dataInput.trim()) {
      toast({
        title: "Error",
        description: "Please provide numeric data.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Try to parse numeric data from input
      const numericData = dataInput
        .split(/[,\s\n]+/)
        .map((val) => parseFloat(val.trim()))
        .filter((val) => !isNaN(val));

      if (numericData.length === 0) {
        throw new Error("No numeric values found");
      }

      const response = await fetch("/api/analysis/basic-stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: numericData }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Statistics calculation failed");
      }

      const stats: BasicStats = await response.json();
      setBasicStats(stats);
      setActiveTab("stats");

      toast({
        title: "Statistics Calculated",
        description: `Calculated statistics for ${stats.count} data points.`,
      });
    } catch (error) {
      console.error("Stats calculation error:", error);
      toast({
        title: "Calculation Failed",
        description:
          "Failed to calculate basic statistics. Please check your data format.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied",
        description: "Content copied to clipboard.",
      });
    });
  };

  const downloadAsFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Data Analysis Helper</h2>
            <p className="text-muted-foreground">
              Perform statistical analysis and generate code for your research
              data
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="analyze">Analyze Data</TabsTrigger>
          <TabsTrigger value="results" disabled={!results}>
            Results
          </TabsTrigger>
          <TabsTrigger value="code">Generate Code</TabsTrigger>
          <TabsTrigger value="stats">Quick Stats</TabsTrigger>
          <TabsTrigger value="help">Help & Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="analyze" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Analysis Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Data Input */}
              <div className="space-y-2">
                <Label htmlFor="data">Data</Label>
                <Textarea
                  id="data"
                  placeholder="Enter your data here (CSV format, comma-separated values, or paste from Excel)&#10;Example:&#10;Height,Weight&#10;170,65&#10;175,70&#10;180,75"
                  value={dataInput}
                  onChange={(e) => setDataInput(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Supported formats: CSV data, comma-separated numbers, or
                  structured text
                </p>
              </div>

              {/* Analysis Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Analysis Type</Label>
                  <Select value={analysisType} onValueChange={setAnalysisType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select analysis type" />
                    </SelectTrigger>
                    <SelectContent>
                      {analysisTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Programming Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Optional Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Research Question (Optional)</Label>
                  <Input
                    placeholder="e.g., Is there a correlation between height and weight?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Variables of Interest (Optional)</Label>
                  <Input
                    placeholder="e.g., height, weight, age"
                    value={variables}
                    onChange={(e) => setVariables(e.target.value)}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleAnalyzeData}
                  disabled={isAnalyzing || !dataInput.trim() || !analysisType}
                  className="flex-1"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analyze Data
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleGenerateCode}
                  disabled={isAnalyzing || !analysisType}
                >
                  <Code2 className="h-4 w-4 mr-2" />
                  Generate Code
                </Button>

                <Button
                  variant="outline"
                  onClick={handleCalculateBasicStats}
                  disabled={!dataInput.trim()}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Quick Stats
                </Button>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {results && (
            <>
              {/* Analysis Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Results</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(results.result)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Results
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadAsFile(results.result, "analysis_results.txt")
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none bg-muted/20 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {results.result}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Generated Code */}
              {results.code && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code2 className="h-5 w-5" />
                      Generated {language.toUpperCase()} Code
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(results.code!)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          downloadAsFile(
                            results.code!,
                            `analysis.${
                              language === "python"
                                ? "py"
                                : language === "r"
                                ? "R"
                                : "txt"
                            }`
                          )
                        }
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Code
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                      <pre>{results.code}</pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Explanation and Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Explanation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{results.explanation}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {results.recommendations.map((rec, index) => (
                        <li
                          key={index}
                          className="text-sm flex items-start gap-2"
                        >
                          <span className="text-blue-500 mt-1">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Visualization Suggestions */}
              {results.visualizationSuggestions &&
                results.visualizationSuggestions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Visualization Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {results.visualizationSuggestions.map(
                          (suggestion, index) => (
                            <Badge key={index} variant="outline">
                              {suggestion}
                            </Badge>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Next Steps */}
              <Card>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {results.nextSteps.map((step, index) => (
                      <li
                        key={index}
                        className="text-sm flex items-start gap-2"
                      >
                        <span className="text-green-500 mt-1">•</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="code" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Code Generation</CardTitle>
              <p className="text-muted-foreground">
                Generate analysis code without running the full analysis
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Analysis Type</Label>
                  <Select value={analysisType} onValueChange={setAnalysisType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select analysis type" />
                    </SelectTrigger>
                    <SelectContent>
                      {analysisTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerateCode}
                disabled={isAnalyzing || !analysisType}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Code...
                  </>
                ) : (
                  <>
                    <Code2 className="h-4 w-4 mr-2" />
                    Generate {language.toUpperCase()} Code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {generatedCode && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Generated Code</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedCode)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Code
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadAsFile(
                          generatedCode,
                          `analysis.${language === "python" ? "py" : "R"}`
                        )
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre>{generatedCode}</pre>
                  </div>
                </CardContent>
              </Card>

              {codeExplanation && (
                <Card>
                  <CardHeader>
                    <CardTitle>Code Explanation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{codeExplanation}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {basicStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Central Tendency</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Mean:</span>
                    <span className="font-mono">{basicStats.mean}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Median:</span>
                    <span className="font-mono">{basicStats.median}</span>
                  </div>
                  {basicStats.mode && (
                    <div className="flex justify-between">
                      <span>Mode:</span>
                      <span className="font-mono">{basicStats.mode}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Variability</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Std Dev:</span>
                    <span className="font-mono">
                      {basicStats.standardDeviation}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Variance:</span>
                    <span className="font-mono">{basicStats.variance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Range:</span>
                    <span className="font-mono">{basicStats.range}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quartiles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Q1:</span>
                    <span className="font-mono">{basicStats.quartiles.q1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Q2:</span>
                    <span className="font-mono">{basicStats.quartiles.q2}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Q3:</span>
                    <span className="font-mono">{basicStats.quartiles.q3}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IQR:</span>
                    <span className="font-mono">
                      {basicStats.quartiles.iqr}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Range</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Minimum:</span>
                    <span className="font-mono">{basicStats.minimum}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maximum:</span>
                    <span className="font-mono">{basicStats.maximum}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Count:</span>
                    <span className="font-mono">{basicStats.count}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Quick Statistics Calculator</CardTitle>
              <p className="text-muted-foreground">
                Enter numeric data to get instant descriptive statistics
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Numeric Data</Label>
                <Textarea
                  placeholder="Enter numbers separated by commas, spaces, or new lines&#10;Example: 1, 2, 3, 4, 5 or 1 2 3 4 5"
                  value={dataInput}
                  onChange={(e) => setDataInput(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                onClick={handleCalculateBasicStats}
                disabled={!dataInput.trim()}
                className="w-full"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Statistics
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="help" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How to Use Data Analysis Helper</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Data Formats Supported</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• CSV data with headers</li>
                    <li>• Comma-separated numbers</li>
                    <li>• Space-separated values</li>
                    <li>• Copy-paste from Excel</li>
                    <li>• Plain text data</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Analysis Types</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>
                      • <strong>Descriptive:</strong> Mean, median, std dev
                    </li>
                    <li>
                      • <strong>Correlation:</strong> Relationship strength
                    </li>
                    <li>
                      • <strong>Regression:</strong> Prediction models
                    </li>
                    <li>
                      • <strong>Hypothesis:</strong> Statistical testing
                    </li>
                    <li>
                      • <strong>Visualization:</strong> Chart recommendations
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Example Data Formats</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-sm font-medium mb-1">
                      CSV with Headers
                    </h5>
                    <div className="bg-muted/20 p-3 rounded text-sm font-mono">
                      <pre>{`Height,Weight,Age
170,65,25
175,70,28
180,75,30`}</pre>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium mb-1">Simple Numbers</h5>
                    <div className="bg-muted/20 p-3 rounded text-sm font-mono">
                      <pre>{`23, 45, 67, 89, 12
34, 56, 78, 90, 23`}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tips for Better Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>
                    <strong>Clean your data:</strong> Remove missing values and
                    outliers before analysis
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>
                    <strong>Provide context:</strong> Use the research question
                    field to get more relevant insights
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>
                    <strong>Specify variables:</strong> List the variables
                    you're most interested in analyzing
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>
                    <strong>Choose the right analysis:</strong> Start with
                    descriptive statistics before advanced methods
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
