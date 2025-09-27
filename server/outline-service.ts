// Outline and draft builder service for academic writing
import { aiService } from "./ai-service";

export interface OutlineSection {
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

export interface OutlineRequest {
  topic: string;
  type:
    | "thesis"
    | "essay"
    | "research-paper"
    | "dissertation"
    | "report"
    | "article";
  length: "short" | "medium" | "long" | "custom";
  customLength?: number; // word count for custom length
  style: "academic" | "scientific" | "formal" | "analytical" | "argumentative";
  requirements?: string;
  sources?: string[];
  existingContent?: string;
}

export interface OutlineResponse {
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

export interface DraftRequest {
  outlineSection: OutlineSection;
  context?: string;
  previousSections?: OutlineSection[];
  targetWordCount?: number;
  tone?: "formal" | "academic" | "persuasive" | "descriptive";
  includeTransitions?: boolean;
}

export interface DraftResponse {
  content: string;
  wordCount: number;
  suggestions: string[];
  nextSteps: string[];
  citationPlaceholders: string[];
  timestamp: string;
}

export class OutlineService {
  // Generate structured outline based on topic and requirements
  async generateOutline(request: OutlineRequest): Promise<OutlineResponse> {
    try {
      const outlinePrompt = this.buildOutlinePrompt(request);

      const aiResponse = await aiService.analyzeText({
        text: outlinePrompt,
        prompt: "Generate a detailed academic outline",
        analysisType: "structure_analysis",
      });

      const outline = this.parseAIOutline(aiResponse.result, request);
      const metadata = this.calculateMetadata(outline, request);

      return {
        outline,
        metadata,
        writingTips: this.generateWritingTips(request.type, request.style),
        researchSuggestions: this.generateResearchSuggestions(
          request.topic,
          request.type
        ),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Outline generation error:", error);
      throw new Error("Failed to generate outline");
    }
  }

  // Generate draft content for a specific section
  async generateSectionDraft(request: DraftRequest): Promise<DraftResponse> {
    try {
      const draftPrompt = this.buildDraftPrompt(request);

      const aiResponse = await aiService.analyzeText({
        text: draftPrompt,
        prompt: "Generate academic section content",
        analysisType: "academic_style",
      });

      const content = aiResponse.result;
      const wordCount = this.countWords(content);

      return {
        content,
        wordCount,
        suggestions: this.generateSectionSuggestions(
          request.outlineSection,
          content
        ),
        nextSteps: this.generateNextSteps(request.outlineSection),
        citationPlaceholders: this.extractCitationPlaceholders(content),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Draft generation error:", error);
      throw new Error("Failed to generate section draft");
    }
  }

  // Improve existing outline
  async improveOutline(
    outline: OutlineSection[],
    feedback: string,
    type: string
  ): Promise<OutlineSection[]> {
    try {
      const improvementPrompt = `
Please improve this academic outline based on the feedback provided.

Current Outline:
${this.outlineToText(outline)}

Feedback: ${feedback}
Document Type: ${type}

Please provide an improved version that addresses the feedback while maintaining academic structure and coherence.
Focus on:
1. Logical flow and organization
2. Appropriate depth for each section
3. Clear transitions between sections
4. Comprehensive coverage of the topic

Format the response as a structured outline with clear hierarchy.`;

      const aiResponse = await aiService.analyzeText({
        text: improvementPrompt,
        prompt: "Improve academic outline structure",
        analysisType: "structure_analysis",
      });

      return this.parseAIOutline(aiResponse.result, { type } as OutlineRequest);
    } catch (error) {
      console.error("Outline improvement error:", error);
      throw new Error("Failed to improve outline");
    }
  }

  // Convert outline to different formats
  async exportOutline(
    outline: OutlineSection[],
    format: "markdown" | "word" | "latex" | "json"
  ): Promise<string> {
    switch (format) {
      case "markdown":
        return this.outlineToMarkdown(outline);
      case "word":
        return this.outlineToWord(outline);
      case "latex":
        return this.outlineToLatex(outline);
      case "json":
        return JSON.stringify(outline, null, 2);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Private helper methods

  private buildOutlinePrompt(request: OutlineRequest): string {
    const lengthDescriptions = {
      short: "1,000-2,500 words",
      medium: "2,500-5,000 words",
      long: "5,000-10,000 words",
      custom: `${request.customLength} words`,
    };

    return `
Generate a detailed academic outline for the following requirements:

Topic: ${request.topic}
Type: ${request.type}
Length: ${lengthDescriptions[request.length]}
Style: ${request.style}
${
  request.requirements ? `Additional Requirements: ${request.requirements}` : ""
}
${
  request.existingContent
    ? `Existing Content to Incorporate: ${request.existingContent}`
    : ""
}

Please create a comprehensive outline with:
1. Clear hierarchical structure (main sections, subsections)
2. Detailed content descriptions for each section
3. Estimated word counts per section
4. Key points to cover in each section
5. Logical flow and transitions

Format as a structured outline with:
- Main sections (Roman numerals: I, II, III...)
- Subsections (Capital letters: A, B, C...)
- Sub-subsections (Numbers: 1, 2, 3...)
- Content descriptions and key points for each section

Focus on academic rigor, logical progression, and comprehensive coverage of the topic.`;
  }

  private buildDraftPrompt(request: DraftRequest): string {
    const contextInfo = request.context ? `\nContext: ${request.context}` : "";
    const previousInfo = request.previousSections
      ? `\nPrevious sections covered: ${request.previousSections
          .map((s) => s.title)
          .join(", ")}`
      : "";
    const wordCountInfo = request.targetWordCount
      ? `\nTarget word count: ${request.targetWordCount} words`
      : "";

    return `
Generate academic content for the following outline section:

Section Title: ${request.outlineSection.title}
Section Content Description: ${request.outlineSection.content}
Level: ${request.outlineSection.level}
Tone: ${request.tone || "academic"}
Include Transitions: ${request.includeTransitions ? "Yes" : "No"}
${contextInfo}
${previousInfo}
${wordCountInfo}

Please write well-structured, academic content that:
1. Follows proper academic writing conventions
2. Uses appropriate terminology and style
3. Includes clear topic sentences and transitions
4. Maintains logical flow and coherence
5. Incorporates citation placeholders where appropriate (use [Citation needed] format)
6. Provides comprehensive coverage of the outlined points

The content should be ready for academic use with proper paragraph structure and scholarly tone.`;
  }

  private parseAIOutline(
    aiText: string,
    request: OutlineRequest
  ): OutlineSection[] {
    const lines = aiText.split("\n").filter((line) => line.trim());
    const sections: OutlineSection[] = [];
    let currentSection: OutlineSection | null = null;
    let currentSubsection: OutlineSection | null = null;
    let sectionCounter = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Main sections (I, II, III or 1, 2, 3)
      if (trimmed.match(/^(I{1,3}|IV|V|VI{0,3}|IX|X|\d+)\./)) {
        if (currentSection) {
          sections.push(currentSection);
        }

        const title = trimmed.replace(
          /^(I{1,3}|IV|V|VI{0,3}|IX|X|\d+)\.\s*/,
          ""
        );
        currentSection = {
          id: `section-${++sectionCounter}`,
          title,
          content: "",
          subsections: [],
          order: sectionCounter,
          level: 1,
          wordCount: this.estimateSectionWordCount(request, 1),
        };
        currentSubsection = null;
      }
      // Subsections (A, B, C)
      else if (trimmed.match(/^[A-Z]\./)) {
        if (currentSection) {
          const title = trimmed.replace(/^[A-Z]\.\s*/, "");
          const subsection: OutlineSection = {
            id: `subsection-${sectionCounter}-${
              currentSection.subsections!.length + 1
            }`,
            title,
            content: "",
            order: currentSection.subsections!.length + 1,
            level: 2,
            wordCount: this.estimateSectionWordCount(request, 2),
          };
          currentSection.subsections!.push(subsection);
          currentSubsection = subsection;
        }
      }
      // Content descriptions
      else if (trimmed.startsWith("-") || trimmed.startsWith("•")) {
        const content = trimmed.replace(/^[-•]\s*/, "");
        if (currentSubsection) {
          currentSubsection.content = currentSubsection.content
            ? `${currentSubsection.content} ${content}`
            : content;
        } else if (currentSection) {
          currentSection.content = currentSection.content
            ? `${currentSection.content} ${content}`
            : content;
        }
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections.length > 0 ? sections : this.createDefaultOutline(request);
  }

  private createDefaultOutline(request: OutlineRequest): OutlineSection[] {
    // Fallback outline structure based on document type
    const templates = {
      thesis: [
        {
          title: "Introduction",
          content:
            "Background, problem statement, objectives, and thesis statement",
        },
        {
          title: "Literature Review",
          content: "Review of existing research and theoretical framework",
        },
        {
          title: "Methodology",
          content: "Research design, data collection, and analysis methods",
        },
        {
          title: "Results and Analysis",
          content: "Findings, data analysis, and interpretation",
        },
        {
          title: "Discussion",
          content: "Implications, limitations, and future research",
        },
        {
          title: "Conclusion",
          content: "Summary of findings and final recommendations",
        },
      ],
      essay: [
        {
          title: "Introduction",
          content: "Hook, background, and thesis statement",
        },
        {
          title: "Body Paragraph 1",
          content: "First main argument with supporting evidence",
        },
        {
          title: "Body Paragraph 2",
          content: "Second main argument with supporting evidence",
        },
        {
          title: "Body Paragraph 3",
          content: "Third main argument with supporting evidence",
        },
        {
          title: "Conclusion",
          content: "Restate thesis and summarize key points",
        },
      ],
      "research-paper": [
        {
          title: "Abstract",
          content: "Brief summary of the research and findings",
        },
        {
          title: "Introduction",
          content: "Background, research question, and objectives",
        },
        {
          title: "Literature Review",
          content: "Existing research and theoretical foundation",
        },
        {
          title: "Methodology",
          content: "Research approach and data collection methods",
        },
        { title: "Results", content: "Findings and data analysis" },
        {
          title: "Discussion",
          content: "Interpretation and implications of results",
        },
        {
          title: "Conclusion",
          content: "Summary and future research directions",
        },
      ],
    };

    const template =
      templates[request.type as keyof typeof templates] || templates.essay;

    return template.map((section, index) => ({
      id: `default-section-${index + 1}`,
      title: section.title,
      content: section.content,
      order: index + 1,
      level: 1,
      wordCount: this.estimateSectionWordCount(request, 1),
      subsections: [],
    }));
  }

  private estimateSectionWordCount(
    request: OutlineRequest,
    level: number
  ): number {
    const baseCounts = {
      short: { 1: 300, 2: 150 },
      medium: { 1: 600, 2: 300 },
      long: { 1: 1200, 2: 600 },
      custom: {
        1: (request.customLength || 2000) / 6,
        2: (request.customLength || 2000) / 12,
      },
    };

    return Math.round(
      baseCounts[request.length][level as keyof typeof baseCounts.short] || 300
    );
  }

  private calculateMetadata(
    outline: OutlineSection[],
    request: OutlineRequest
  ) {
    const totalWordCount = outline.reduce((total, section) => {
      const sectionWords =
        (section.wordCount || 0) +
        (section.subsections?.reduce(
          (subTotal, sub) => subTotal + (sub.wordCount || 0),
          0
        ) || 0);
      return total + sectionWords;
    }, 0);

    const timeFrames = {
      short: "1-2 weeks",
      medium: "3-4 weeks",
      long: "6-8 weeks",
      custom:
        totalWordCount > 5000
          ? "6-8 weeks"
          : totalWordCount > 2500
          ? "3-4 weeks"
          : "1-2 weeks",
    };

    const difficulties = {
      thesis: "advanced",
      dissertation: "advanced",
      "research-paper": "intermediate",
      essay: "beginner",
      report: "intermediate",
      article: "intermediate",
    };

    return {
      estimatedWordCount: totalWordCount,
      suggestedTimeFrame: timeFrames[request.length],
      difficulty: difficulties[request.type as keyof typeof difficulties] as
        | "beginner"
        | "intermediate"
        | "advanced",
      keyComponents: outline.map((section) => section.title),
    };
  }

  private generateWritingTips(type: string, style: string): string[] {
    const tips = [
      "Start each section with a clear topic sentence",
      "Use transitions to connect ideas smoothly",
      "Support arguments with credible sources and evidence",
      "Maintain consistent academic tone throughout",
      "Review and revise each section multiple times",
    ];

    if (type === "thesis" || type === "dissertation") {
      tips.push(
        "Ensure your research question is clearly defined and addressed"
      );
      tips.push(
        "Maintain a logical argument structure throughout all chapters"
      );
    }

    if (style === "argumentative") {
      tips.push("Present counterarguments and refute them effectively");
      tips.push("Use strong evidence to support your position");
    }

    return tips;
  }

  private generateResearchSuggestions(topic: string, type: string): string[] {
    return [
      `Search for recent peer-reviewed articles on "${topic}"`,
      "Look for systematic reviews and meta-analyses in your field",
      "Check citation patterns to find influential works",
      "Explore interdisciplinary perspectives on your topic",
      "Consider both theoretical and empirical research approaches",
    ];
  }

  private generateSectionSuggestions(
    section: OutlineSection,
    content: string
  ): string[] {
    const suggestions = [
      "Consider adding more specific examples or case studies",
      "Ensure smooth transitions between paragraphs",
      "Check that all claims are properly supported with citations",
    ];

    if (section.level === 1) {
      suggestions.push(
        "Make sure this section clearly connects to your main thesis"
      );
    }

    if (content.length < 200) {
      suggestions.push("This section may need more detailed development");
    }

    return suggestions;
  }

  private generateNextSteps(section: OutlineSection): string[] {
    return [
      "Review and revise the generated content",
      "Add proper citations where indicated",
      "Check alignment with overall document structure",
      "Consider peer review or feedback from advisors",
    ];
  }

  private extractCitationPlaceholders(content: string): string[] {
    const matches = content.match(/\[Citation needed[^\]]*\]/g);
    return matches || [];
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  private outlineToText(outline: OutlineSection[]): string {
    let text = "";

    outline.forEach((section, index) => {
      text += `${index + 1}. ${section.title}\n`;
      if (section.content) {
        text += `   ${section.content}\n`;
      }

      section.subsections?.forEach((subsection, subIndex) => {
        text += `   ${String.fromCharCode(65 + subIndex)}. ${
          subsection.title
        }\n`;
        if (subsection.content) {
          text += `      ${subsection.content}\n`;
        }
      });
      text += "\n";
    });

    return text;
  }

  private outlineToMarkdown(outline: OutlineSection[]): string {
    let markdown = "# Document Outline\n\n";

    outline.forEach((section) => {
      markdown += `## ${section.title}\n\n`;
      if (section.content) {
        markdown += `${section.content}\n\n`;
      }

      section.subsections?.forEach((subsection) => {
        markdown += `### ${subsection.title}\n\n`;
        if (subsection.content) {
          markdown += `${subsection.content}\n\n`;
        }
      });
    });

    return markdown;
  }

  private outlineToWord(outline: OutlineSection[]): string {
    // Return formatted text suitable for Word document
    return this.outlineToText(outline);
  }

  private outlineToLatex(outline: OutlineSection[]): string {
    let latex = "\\documentclass{article}\n\\begin{document}\n\n";
    latex += "\\title{Document Outline}\n\\maketitle\n\n";

    outline.forEach((section) => {
      latex += `\\section{${section.title}}\n\n`;
      if (section.content) {
        latex += `${section.content}\n\n`;
      }

      section.subsections?.forEach((subsection) => {
        latex += `\\subsection{${subsection.title}}\n\n`;
        if (subsection.content) {
          latex += `${subsection.content}\n\n`;
        }
      });
    });

    latex += "\\end{document}";
    return latex;
  }
}

export const outlineService = new OutlineService();
