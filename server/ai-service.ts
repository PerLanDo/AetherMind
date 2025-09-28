// AI service using mock responses for testing
import mammoth from "mammoth";

// Mock client - no external API calls
const client = null;

export interface AIAnalysisRequest {
  text: string;
  prompt: string;
  fileContext?: string;
  analysisType:
    | "qa"
    | "grammar"
    | "paraphrase"
    | "summary"
    | "citation"
    | "literature"
    | "writing_improvement"
    | "tone_adjustment"
    | "readability_check"
    | "plagiarism_check"
    | "structure_analysis"
    | "keyword_extraction"
    | "academic_style"
    | "creative_writing"
    | "technical_writing";
}

export interface AIAnalysisResponse {
  result: string;
  model: string;
  analysisType: string;
  timestamp: string;
}

export class AIService {
  private model = "mistralai/mistral-nemo:free";

  async analyzeText(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    // For now, use fallback response to avoid external API calls
    console.log("Using fallback AI response for:", request.analysisType);
    return this.getFallbackResponse(request);
  }

  private getFallbackResponse(request: AIAnalysisRequest): AIAnalysisResponse {
    const fallbackResponses = {
      summary: `Summary: This text appears to be about ${request.text.substring(0, 50)}...`,
      qa: "I'm currently unable to process this request due to AI service limitations. Please try again later.",
      citation: "Citation generation is temporarily unavailable. Please try again later.",
      grammar: "Grammar checking is temporarily unavailable. Please try again later.",
      paraphrase: "Paraphrasing is temporarily unavailable. Please try again later.",
      writing_improvement: "Writing improvement suggestions are temporarily unavailable. Please try again later.",
    };

    return {
      result: fallbackResponses[request.analysisType] || "AI service is temporarily unavailable. Please try again later.",
      model: "fallback",
      analysisType: request.analysisType,
      timestamp: new Date().toISOString(),
    };
  }

  async chatWithContext(
    message: string,
    fileContexts: string[] = [],
    conversationHistory: Array<{
      role: "user" | "assistant";
      content: string;
    }> = []
  ): Promise<string> {
    const systemPrompt = `You are OMNISCI AI, an expert research assistant and project manager designed for academic users. You help with:

1. Research Analysis: Analyze uploaded documents, extract key insights, answer questions about research papers
2. Academic Writing: Grammar checking, style improvement, paraphrasing, summarization
3. Project Management: Task organization, deadline tracking, collaboration guidance
4. Citation Help: Generate proper academic citations in APA, MLA, Chicago formats
5. Literature Discovery: Suggest relevant papers and research directions

Context: You are working within a collaborative research workspace where users can upload documents, manage projects, and work with team members.

File Context Available: ${fileContexts.length > 0 ? "Yes" : "No"}
${
  fileContexts.length > 0
    ? `\nDocument Content:\n${fileContexts.join("\n\n---\n\n")}`
    : ""
}

Provide helpful, accurate, and academically appropriate responses. Be concise but thorough.`;

    try {
      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...conversationHistory,
        { role: "user" as const, content: message },
      ];

      const completion = await client.chat.completions.create(
        {
          model: this.model,
          messages,
          max_tokens: 1500,
        },
        {
          headers: {
            "HTTP-Referer": "https://omnisci-ai.replit.app",
            "X-Title": "OMNISCI AI Research Assistant",
          },
        }
      );

      return (
        completion.choices[0].message.content ||
        "I'm sorry, I couldn't process your request."
      );
    } catch (error) {
      console.error("Chat Error:", error);
      throw new Error(
        `Chat failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private getSystemPrompt(analysisType: string): string {
    const prompts = {
      qa: "You are an expert research assistant. Answer questions about the provided text with academic precision. Cite specific sections when possible.",

      grammar:
        "You are an academic writing expert. Check the provided text for grammar, punctuation, spelling, and syntax errors. Provide specific corrections with explanations and maintain the original meaning.",

      paraphrase:
        "You are a writing assistant. Paraphrase the provided text while maintaining its academic meaning and improving clarity. Preserve technical terms and key concepts.",

      summary:
        "You are a research analyst. Create a concise, well-structured summary that captures the main arguments, findings, and conclusions of the text.",

      citation:
        "You are a citation expert. Generate proper academic citations in the requested format (APA, MLA, or Chicago) based on the provided information.",

      literature:
        "You are a research librarian. Suggest relevant academic papers and research directions based on the provided text and research focus.",

      writing_improvement:
        "You are a professional writing coach. Analyze the text for clarity, coherence, flow, and engagement. Provide specific suggestions to improve readability, eliminate redundancy, and enhance the overall quality of writing.",

      tone_adjustment:
        "You are a writing style expert. Analyze the tone of the provided text and adjust it according to the specified requirements (formal, informal, academic, professional, friendly, persuasive, etc.). Maintain the core message while adapting the voice.",

      readability_check:
        "You are a readability specialist. Analyze the text for complexity, sentence structure, vocabulary level, and overall accessibility. Provide a readability score and suggestions to make the text more accessible to the target audience.",

      plagiarism_check:
        "You are an academic integrity expert. Analyze the text for potential plagiarism indicators, improper paraphrasing, missing citations, and provide recommendations for proper attribution and originality.",

      structure_analysis:
        "You are a document structure expert. Analyze the organization, logical flow, paragraph structure, and transitions of the text. Provide recommendations for better organization and coherence.",

      keyword_extraction:
        "You are a content analysis expert. Extract key terms, concepts, themes, and important phrases from the text. Organize them by relevance and provide context for their significance.",

      academic_style:
        "You are an academic writing specialist. Transform the text to follow proper academic conventions including formal tone, objective language, proper terminology, and scholarly presentation while maintaining accuracy.",

      creative_writing:
        "You are a creative writing mentor. Help improve narrative flow, character development, dialogue, imagery, and creative expression. Provide suggestions for enhancing creativity while maintaining good writing fundamentals.",

      technical_writing:
        "You are a technical communication expert. Improve clarity, precision, and accessibility of technical content. Focus on proper terminology, logical structure, clear explanations, and effective use of examples and illustrations.",
    };

    return prompts[analysisType as keyof typeof prompts] || prompts.qa;
  }

  private buildUserPrompt(request: AIAnalysisRequest): string {
    let prompt = request.prompt;

    if (request.fileContext) {
      prompt += `\n\nDocument Content:\n${request.fileContext}`;
    }

    if (request.text && request.text !== request.fileContext) {
      prompt += `\n\nText to Analyze:\n${request.text}`;
    }

    return prompt;
  }

  async analyzeDocument(
    content: string,
    fileName: string,
    analysisType:
      | "summary"
      | "key_points"
      | "research_questions"
      | "methodology"
      | "references" = "summary"
  ): Promise<string> {
    const prompts = {
      summary: `Please provide a comprehensive summary of the following document "${fileName}". Focus on the main points, key findings, and conclusions:`,
      key_points: `Extract the key points and important insights from this document "${fileName}". Present them as a bulleted list:`,
      research_questions: `Identify the main research questions or objectives addressed in this document "${fileName}":`,
      methodology: `Analyze and describe the methodology, approach, or methods used in this document "${fileName}":`,
      references: `Extract and organize any references, citations, or sources mentioned in this document "${fileName}":`,
    };

    try {
      const completion = await client.chat.completions.create(
        {
          model: this.model,
          messages: [
            {
              role: "system",
              content: `You are OMNISCI AI, an expert research assistant specializing in document analysis. Provide detailed, academic-level analysis of the provided content.`,
            },
            {
              role: "user",
              content: `${prompts[analysisType]}\n\n${content.slice(0, 15000)}`, // Limit content to avoid token limits
            },
          ],
          max_tokens: 2000,
        },
        {
          headers: {
            "HTTP-Referer": "https://aethermind-ai.local",
            "X-Title": "ScholarSync Document Analysis",
          },
        }
      );

      return (
        completion.choices[0]?.message?.content || "Unable to analyze document."
      );
    } catch (error) {
      console.error("Document analysis error:", error);
      throw new Error("Failed to analyze document content");
    }
  }

  async extractTextContent(
    fileName: string,
    mimeType: string,
    buffer: Buffer
  ): Promise<string> {
    try {
      console.log(`Extracting text from ${fileName} (${mimeType})`);

      // Handle plain text files
      if (mimeType.includes("text/")) {
        return buffer.toString("utf-8");
      }

      // Handle JSON files
      if (mimeType.includes("json")) {
        try {
          return JSON.stringify(JSON.parse(buffer.toString("utf-8")), null, 2);
        } catch {
          return buffer.toString("utf-8");
        }
      }

      // Handle PDF files
      if (mimeType === "application/pdf") {
        try {
          const pdfParse = (await import("pdf-parse")).default;
          const data = await pdfParse(buffer);
          console.log(`Extracted ${data.text.length} characters from PDF`);
          return (
            data.text || `[PDF content could not be extracted from ${fileName}]`
          );
        } catch (error) {
          console.error("PDF parsing error:", error);
          return `[Error extracting PDF content from ${fileName}. Please try a different file format.]`;
        }
      }

      // Handle Word documents (.docx)
      if (
        mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        try {
          const result = await mammoth.extractRawText({ buffer });
          console.log(
            `Extracted ${result.value.length} characters from Word document`
          );
          return (
            result.value ||
            `[Word document content could not be extracted from ${fileName}]`
          );
        } catch (error) {
          console.error("Word document parsing error:", error);
          return `[Error extracting Word document content from ${fileName}. Please try a different file format.]`;
        }
      }

      // Handle legacy Word documents (.doc)
      if (mimeType === "application/msword") {
        // Note: mammoth primarily handles .docx files
        // For .doc files, we'd need additional tools like antiword or textract
        return `[Legacy Word document (.doc) format detected in ${fileName}. Please convert to .docx format for better text extraction.]`;
      }

      // Handle CSV files
      if (mimeType === "text/csv" || fileName.toLowerCase().endsWith(".csv")) {
        const csvText = buffer.toString("utf-8");
        return `CSV Data from ${fileName}:\n\n${csvText}`;
      }

      // Fallback for unsupported formats
      return `[${fileName}] - File format ${mimeType} is not currently supported for text extraction. Supported formats: PDF (.pdf), Word Documents (.docx), Text files (.txt), CSV (.csv), and JSON (.json).]`;
    } catch (error) {
      console.error(`Error extracting text from ${fileName}:`, error);
      return `[Error occurred while processing ${fileName}. Please try re-uploading the file or use a supported format.]`;
    }
  }
}

export const aiService = new AIService();
