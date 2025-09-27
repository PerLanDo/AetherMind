import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WritingAssistantProps {
  selectedTool: string;
  onClose: () => void;
}

export default function WritingAssistant({
  selectedTool,
  onClose,
}: WritingAssistantProps) {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toneType, setToneType] = useState("academic");
  const { toast } = useToast();

  const toolConfig = {
    grammar: {
      title: "Grammar & Spelling Check",
      description:
        "Check and correct grammar, punctuation, and spelling errors",
      placeholder:
        "Paste your text here to check for grammar and spelling errors...",
    },
    writing_improvement: {
      title: "Writing Enhancement",
      description: "Improve clarity, flow, and overall writing quality",
      placeholder: "Enter your text to enhance clarity and writing quality...",
    },
    tone_adjustment: {
      title: "Tone & Style Adjustment",
      description: "Adjust the tone and style of your writing",
      placeholder: "Paste your text to adjust its tone and style...",
    },
    readability_check: {
      title: "Readability Analysis",
      description: "Analyze and improve text readability",
      placeholder: "Enter text to analyze its readability and complexity...",
    },
    plagiarism_check: {
      title: "Originality Check",
      description: "Check for potential plagiarism and improve originality",
      placeholder:
        "Paste text to check for originality and proper attribution...",
    },
    structure_analysis: {
      title: "Structure Analysis",
      description: "Analyze document organization and flow",
      placeholder: "Enter your document text to analyze its structure...",
    },
    keyword_extraction: {
      title: "Keyword Extraction",
      description: "Extract key terms and concepts",
      placeholder: "Paste text to extract important keywords and concepts...",
    },
    academic_style: {
      title: "Academic Style Guide",
      description: "Transform text to academic style",
      placeholder: "Enter text to convert to proper academic style...",
    },
    creative_writing: {
      title: "Creative Writing Helper",
      description: "Enhance narrative and creative elements",
      placeholder: "Share your creative writing to enhance narrative flow...",
    },
    technical_writing: {
      title: "Technical Writing Assistant",
      description: "Improve technical documentation clarity",
      placeholder:
        "Enter technical content to improve clarity and precision...",
    },
    paraphrase: {
      title: "Paraphrase & Summarize",
      description: "Rephrase text while maintaining meaning",
      placeholder: "Paste text to paraphrase or summarize...",
    },
  };

  const config = toolConfig[selectedTool as keyof typeof toolConfig];

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const prompt =
        selectedTool === "tone_adjustment"
          ? `Please adjust the tone of this text to be ${toneType}: ${text}`
          : text;

      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          prompt: prompt,
          analysisType: selectedTool,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze text");
      }

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze text. Please try again.",
        variant: "destructive",
      });
      console.error("Analysis error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Result copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  if (!config) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {config.title}
                <Badge variant="secondary">AI-Powered</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {config.description}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Input Section */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Input Text
                </label>
                <Textarea
                  placeholder={config.placeholder}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[300px] resize-none"
                />
              </div>

              {/* Tone Selection for Tone Adjustment Tool */}
              {selectedTool === "tone_adjustment" && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Target Tone
                  </label>
                  <Select value={toneType} onValueChange={setToneType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="persuasive">Persuasive</SelectItem>
                      <SelectItem value="conversational">
                        Conversational
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={isLoading || !text.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  `Analyze with AI`
                )}
              </Button>
            </div>

            {/* Result Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  AI Analysis Result
                </label>
                {result && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    disabled={copied}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="mr-2 h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-3 w-3" />
                        Copy
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="border rounded-lg p-4 min-h-[300px] bg-muted/20">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : result ? (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {result}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center mt-20">
                    Click "Analyze with AI" to see results here
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
