import { AIService } from "./ai-service";

export interface CitationRequest {
  source: string; // URL, DOI, or raw text
  sourceType: "url" | "doi" | "text" | "manual";
  format: "apa" | "mla" | "chicago" | "harvard" | "ieee";
  extractedInfo?: {
    title?: string;
    authors?: string[];
    publicationDate?: string;
    publisher?: string;
    url?: string;
    doi?: string;
    journal?: string;
    volume?: string;
    issue?: string;
    pages?: string;
  };
}

export interface Citation {
  id: string;
  format: string;
  citation: string;
  inText: string;
  source: string;
  sourceType: string;
  extractedInfo: any;
  createdAt: string;
}

export class CitationService {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  async generateCitation(request: CitationRequest): Promise<Citation> {
    let extractedInfo = request.extractedInfo;

    // If no extracted info provided, try to extract it
    if (!extractedInfo) {
      extractedInfo = await this.extractSourceInfo(
        request.source,
        request.sourceType
      );
    }

    const citation = await this.formatCitation(extractedInfo, request.format);
    const inText = await this.generateInTextCitation(
      extractedInfo,
      request.format
    );

    return {
      id: this.generateId(),
      format: request.format,
      citation,
      inText,
      source: request.source,
      sourceType: request.sourceType,
      extractedInfo,
      createdAt: new Date().toISOString(),
    };
  }

  private async extractSourceInfo(
    source: string,
    sourceType: string
  ): Promise<any> {
    switch (sourceType) {
      case "url":
        return await this.extractFromURL(source);
      case "doi":
        return await this.extractFromDOI(source);
      case "text":
        return await this.extractFromText(source);
      default:
        return {};
    }
  }

  private async extractFromURL(url: string): Promise<any> {
    try {
      // Try to fetch webpage content
      const response = await fetch(url);
      const html = await response.text();

      // Use AI to extract citation information from HTML
      const aiRequest = {
        text: html,
        prompt: `Extract citation information from this webpage. Return a JSON object with:
        - title: the article/page title
        - authors: array of author names
        - publicationDate: publication or access date
        - publisher: website name or organization
        - url: the URL
        Format the response as valid JSON only.`,
        analysisType: "citation" as const,
      };

      const aiResponse = await this.aiService.analyzeText(aiRequest);

      try {
        return JSON.parse(aiResponse.result);
      } catch {
        // Fallback to basic extraction
        return this.extractBasicInfoFromHTML(html, url);
      }
    } catch (error) {
      console.error("Error extracting from URL:", error);
      return { url, accessDate: new Date().toISOString().split("T")[0] };
    }
  }

  private async extractFromDOI(doi: string): Promise<any> {
    try {
      // Try CrossRef API for DOI lookup
      const apiUrl = `https://api.crossref.org/works/${doi}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      const work = data.message;
      return {
        title: work.title?.[0],
        authors: work.author?.map((a: any) => `${a.given} ${a.family}`),
        journal: work["container-title"]?.[0],
        publicationDate: work.published?.["date-parts"]?.[0]?.join("-"),
        volume: work.volume,
        issue: work.issue,
        pages: work.page,
        doi: work.DOI,
        publisher: work.publisher,
      };
    } catch (error) {
      console.error("Error extracting from DOI:", error);
      return { doi };
    }
  }

  private async extractFromText(text: string): Promise<any> {
    const aiRequest = {
      text,
      prompt: `Extract citation information from this text. Look for:
      - Title of work
      - Author names
      - Publication date
      - Publisher or journal name
      - Any other relevant citation details
      Return as JSON object with appropriate fields.`,
      analysisType: "citation" as const,
    };

    try {
      const aiResponse = await this.aiService.analyzeText(aiRequest);
      return JSON.parse(aiResponse.result);
    } catch (error) {
      console.error("Error extracting from text:", error);
      return {};
    }
  }

  private extractBasicInfoFromHTML(html: string, url: string): any {
    // Basic HTML parsing for title, meta tags
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const authorMatch = html.match(
      /<meta\s+name=["']author["']\s+content=["'](.*?)["']/i
    );
    const descriptionMatch = html.match(
      /<meta\s+name=["']description["']\s+content=["'](.*?)["']/i
    );

    return {
      title: titleMatch?.[1]?.trim(),
      authors: authorMatch?.[1] ? [authorMatch[1].trim()] : [],
      publisher: new URL(url).hostname,
      url,
      accessDate: new Date().toISOString().split("T")[0],
    };
  }

  private async formatCitation(info: any, format: string): Promise<string> {
    const prompt = `Format this citation information in ${format.toUpperCase()} style:
    ${JSON.stringify(info, null, 2)}
    
    Return only the formatted citation, following ${format.toUpperCase()} guidelines exactly.`;

    const aiRequest = {
      text: JSON.stringify(info),
      prompt,
      analysisType: "citation" as const,
    };

    const aiResponse = await this.aiService.analyzeText(aiRequest);
    return aiResponse.result.trim();
  }

  private async generateInTextCitation(
    info: any,
    format: string
  ): Promise<string> {
    const prompt = `Generate an in-text citation in ${format.toUpperCase()} style for:
    ${JSON.stringify(info, null, 2)}
    
    Return only the in-text citation format (e.g., "(Smith, 2023)" for APA).`;

    const aiRequest = {
      text: JSON.stringify(info),
      prompt,
      analysisType: "citation" as const,
    };

    const aiResponse = await this.aiService.analyzeText(aiRequest);
    return aiResponse.result.trim();
  }

  async validateCitation(
    citation: string,
    format: string
  ): Promise<{ isValid: boolean; suggestions: string[] }> {
    const prompt = `Validate this ${format.toUpperCase()} citation and provide suggestions for improvement:
    "${citation}"
    
    Return JSON with:
    - isValid: boolean
    - suggestions: array of improvement suggestions
    
    Check for proper formatting, punctuation, and style compliance.`;

    const aiRequest = {
      text: citation,
      prompt,
      analysisType: "citation" as const,
    };

    try {
      const aiResponse = await this.aiService.analyzeText(aiRequest);
      return JSON.parse(aiResponse.result);
    } catch (error) {
      return {
        isValid: false,
        suggestions: ["Unable to validate citation format"],
      };
    }
  }

  async generateBibliography(
    citations: Citation[],
    format: string
  ): Promise<string> {
    const citationTexts = citations.map((c) => c.citation).join("\n\n");

    const prompt = `Format these citations as a bibliography in ${format.toUpperCase()} style:
    
    ${citationTexts}
    
    Return a properly formatted bibliography with:
    - Correct alphabetical ordering
    - Proper indentation and spacing
    - ${format.toUpperCase()} style formatting`;

    const aiRequest = {
      text: citationTexts,
      prompt,
      analysisType: "citation" as const,
    };

    const aiResponse = await this.aiService.analyzeText(aiRequest);
    return aiResponse.result;
  }

  async convertCitationFormat(
    citation: Citation,
    newFormat: string
  ): Promise<Citation> {
    const newCitation = await this.formatCitation(
      citation.extractedInfo,
      newFormat
    );
    const newInText = await this.generateInTextCitation(
      citation.extractedInfo,
      newFormat
    );

    return {
      ...citation,
      id: this.generateId(),
      format: newFormat,
      citation: newCitation,
      inText: newInText,
      createdAt: new Date().toISOString(),
    };
  }

  private generateId(): string {
    return "cit_" + Math.random().toString(36).substr(2, 9);
  }

  // Citation templates for common formats
  getFormatGuidelines(format: string): any {
    const guidelines = {
      apa: {
        name: "APA 7th Edition",
        inText: "(Author, Year)",
        book: "Author, A. A. (Year). Title of work. Publisher.",
        journal:
          "Author, A. A. (Year). Title of article. Title of Journal, Volume(Issue), pages.",
        website:
          "Author, A. A. (Year, Month Date). Title of webpage. Website Name. URL",
      },
      mla: {
        name: "MLA 8th Edition",
        inText: "(Author Page#)",
        book: "Author. Title of Book. Publisher, Year.",
        journal:
          'Author. "Title of Article." Title of Journal, vol. #, no. #, Year, pp. #-#.',
        website: 'Author. "Title of Webpage." Website Name, Date, URL.',
      },
      chicago: {
        name: "Chicago 17th Edition",
        inText: "(Author Year, Page#)",
        book: "Author. Title of Book. Place: Publisher, Year.",
        journal:
          'Author. "Title of Article." Title of Journal Volume, no. Issue (Year): pages.',
        website:
          'Author. "Title of Webpage." Website Name. Accessed Date. URL.',
      },
      harvard: {
        name: "Harvard Style",
        inText: "(Author, Year)",
        book: "Author, A.A., Year. Title of book. Publisher.",
        journal:
          "Author, A.A., Year. Title of article. Title of Journal, Volume(Issue), pp.pages.",
        website:
          "Author, A.A., Year. Title of webpage. [Online] Available at: URL [Accessed Date].",
      },
      ieee: {
        name: "IEEE Style",
        inText: "[#]",
        book: "[#] A. Author, Title of book. Publisher, Year.",
        journal:
          '[#] A. Author, "Title of article," Title of Journal, vol. #, no. #, pp. pages, Year.',
        website:
          '[#] A. Author. "Title of webpage." Website. URL (accessed Date).',
      },
    };

    return guidelines[format as keyof typeof guidelines] || guidelines.apa;
  }
}

export const citationService = new CitationService();
