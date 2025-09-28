// Literature discovery service for academic paper recommendations
import { aiService } from "./ai-service";

export interface LiteratureRequest {
  query: string;
  keywords?: string[];
  subject?: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
  maxResults?: number;
  documentContext?: string; // Content from uploaded documents for context
}

export interface PaperResult {
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

export interface LiteratureResponse {
  papers: PaperResult[];
  suggestions: string[];
  searchStrategy: string;
  totalResults: number;
  query: string;
  timestamp: string;
}

export class LiteratureService {
  // Search CrossRef API for academic papers
  private async searchCrossRef(
    query: string,
    maxResults: number = 10
  ): Promise<PaperResult[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `https://api.crossref.org/works?query=${encodedQuery}&rows=${maxResults}&sort=relevance&order=desc`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "ScholarSync/1.0 (mailto:research@aethermind.ai)",
        },
      });

      if (!response.ok) {
        console.warn("CrossRef API request failed:", response.status);
        return [];
      }

      const data = await response.json();
      const works = data.message?.items || [];

      return works.map((work: any) => ({
        title: work.title?.[0] || "No title available",
        authors:
          work.author?.map((a: any) =>
            `${a.given || ""} ${a.family || ""}`.trim()
          ) || [],
        abstract: work.abstract,
        journal: work["container-title"]?.[0],
        year: work.published?.["date-parts"]?.[0]?.[0],
        doi: work.DOI,
        url: work.URL,
        citationCount: work["is-referenced-by-count"] || 0,
        subjects: work.subject || [],
      }));
    } catch (error) {
      console.error("CrossRef search error:", error);
      return [];
    }
  }

  // Search arXiv for preprints
  private async searchArXiv(
    query: string,
    maxResults: number = 5
  ): Promise<PaperResult[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `http://export.arxiv.org/api/query?search_query=all:${encodedQuery}&start=0&max_results=${maxResults}&sortBy=relevance&sortOrder=descending`;

      const response = await fetch(url);
      if (!response.ok) {
        console.warn("arXiv API request failed:", response.status);
        return [];
      }

      const xmlText = await response.text();

      // Simple XML parsing for arXiv feed
      const entries = xmlText.match(/<entry>[\s\S]*?<\/entry>/g) || [];

      return entries.map((entry) => {
        const titleMatch = entry.match(/<title>(.*?)<\/title>/);
        const authorsMatch = entry.match(/<name>(.*?)<\/name>/g);
        const abstractMatch = entry.match(/<summary>(.*?)<\/summary>/);
        const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
        const urlMatch = entry.match(/<id>(.*?)<\/id>/);

        return {
          title:
            titleMatch?.[1]?.replace(/\s+/g, " ").trim() ||
            "No title available",
          authors:
            authorsMatch?.map((match) => match.replace(/<\/?name>/g, "")) || [],
          abstract: abstractMatch?.[1]?.replace(/\s+/g, " ").trim(),
          journal: "arXiv preprint",
          year: publishedMatch?.[1]
            ? new Date(publishedMatch[1]).getFullYear()
            : undefined,
          url: urlMatch?.[1],
          subjects: ["Preprint"],
        };
      });
    } catch (error) {
      console.error("arXiv search error:", error);
      return [];
    }
  }

  // Use AI to generate search strategies and filter results
  private async generateSearchStrategy(request: LiteratureRequest): Promise<{
    enhancedQuery: string;
    searchKeywords: string[];
    suggestions: string[];
  }> {
    try {
      const contextPrompt = `
You are a research librarian and academic search expert. Help generate an effective literature search strategy.

User Query: "${request.query}"
Additional Keywords: ${request.keywords?.join(", ") || "None"}
Subject Area: ${request.subject || "General"}
Document Context: ${request.documentContext ? "Available" : "Not available"}

Please provide:
1. An enhanced search query optimized for academic databases
2. Additional relevant keywords to improve search results
3. Specific search suggestions and strategies

Format your response as JSON:
{
  "enhancedQuery": "optimized search string",
  "searchKeywords": ["keyword1", "keyword2", "keyword3"],
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}`;

      const aiResponse = await aiService.analyzeText({
        text: contextPrompt,
        prompt: "Generate an effective academic literature search strategy",
        analysisType: "literature",
      });

      // Try to parse JSON response
      try {
        const parsed = JSON.parse(aiResponse.result);
        return {
          enhancedQuery: parsed.enhancedQuery || request.query,
          searchKeywords: parsed.searchKeywords || [],
          suggestions: parsed.suggestions || [],
        };
      } catch (parseError) {
        // Fallback if AI doesn't return valid JSON
        return {
          enhancedQuery: request.query,
          searchKeywords: request.keywords || [],
          suggestions: [
            "Try using more specific technical terms",
            "Include methodology keywords in your search",
            "Consider searching for recent review papers first",
          ],
        };
      }
    } catch (error) {
      console.error("AI search strategy generation error:", error);
      return {
        enhancedQuery: request.query,
        searchKeywords: request.keywords || [],
        suggestions: [],
      };
    }
  }

  // Main literature search function
  async searchLiterature(
    request: LiteratureRequest
  ): Promise<LiteratureResponse> {
    const maxResults = Math.min(request.maxResults || 15, 50);

    // Generate enhanced search strategy
    const strategy = await this.generateSearchStrategy(request);

    // Search multiple sources in parallel
    const [crossRefResults, arXivResults] = await Promise.all([
      this.searchCrossRef(strategy.enhancedQuery, Math.ceil(maxResults * 0.7)),
      this.searchArXiv(strategy.enhancedQuery, Math.ceil(maxResults * 0.3)),
    ]);

    // Combine and deduplicate results
    const allResults = [...crossRefResults, ...arXivResults];
    const uniqueResults = this.deduplicateResults(allResults);

    // Sort by relevance (combination of citation count, recency, and title similarity)
    const sortedResults = this.rankResults(uniqueResults, request.query);

    return {
      papers: sortedResults.slice(0, maxResults),
      suggestions: strategy.suggestions,
      searchStrategy: strategy.enhancedQuery,
      totalResults: sortedResults.length,
      query: request.query,
      timestamp: new Date().toISOString(),
    };
  }

  // Remove duplicate papers based on title similarity and DOI
  private deduplicateResults(results: PaperResult[]): PaperResult[] {
    const seen = new Set<string>();
    const unique: PaperResult[] = [];

    for (const result of results) {
      const key = result.doi || this.normalizeTitle(result.title);
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(result);
      }
    }

    return unique;
  }

  // Normalize title for comparison
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 50);
  }

  // Rank results by relevance
  private rankResults(results: PaperResult[], query: string): PaperResult[] {
    const queryWords = query.toLowerCase().split(/\s+/);

    return results
      .map((paper) => {
        let score = 0;

        // Title relevance
        const titleWords = paper.title.toLowerCase().split(/\s+/);
        const titleMatches = queryWords.filter((word) =>
          titleWords.some(
            (titleWord) => titleWord.includes(word) || word.includes(titleWord)
          )
        );
        score += titleMatches.length * 3;

        // Citation count (normalized)
        if (paper.citationCount) {
          score += Math.min(paper.citationCount / 100, 2);
        }

        // Recency bonus
        if (paper.year && paper.year > 2020) {
          score += (paper.year - 2020) * 0.1;
        }

        // Journal quality (simple heuristic)
        if (paper.journal && paper.journal.toLowerCase().includes("nature"))
          score += 2;
        if (paper.journal && paper.journal.toLowerCase().includes("science"))
          score += 2;
        if (paper.journal && paper.journal.toLowerCase().includes("cell"))
          score += 1;

        return { ...paper, relevanceScore: score };
      })
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  // Get literature suggestions based on document content
  async suggestFromDocument(
    documentContent: string,
    fileName: string,
    maxResults: number = 10
  ): Promise<LiteratureResponse> {
    try {
      // Extract key topics from document using AI
      const extractionPrompt = `
Analyze this document and extract the main research topics, methodologies, and key concepts that would be useful for finding related literature.

Document: "${fileName}"
Content: ${documentContent.substring(0, 3000)}

Provide:
1. Main research topics (3-5 topics)
2. Key methodologies mentioned
3. Important terminology and concepts
4. Suggested search queries for literature discovery

Format as a search query string that captures the essence of this research.`;

      const aiResponse = await aiService.analyzeText({
        text: extractionPrompt,
        prompt: "Extract research topics for literature search",
        analysisType: "literature",
      });

      const searchQuery =
        aiResponse.result.length > 200
          ? aiResponse.result.substring(0, 200)
          : aiResponse.result;

      return this.searchLiterature({
        query: searchQuery,
        documentContext: documentContent,
        maxResults,
      });
    } catch (error) {
      console.error("Document-based literature suggestion error:", error);
      throw new Error(
        "Failed to generate literature suggestions from document"
      );
    }
  }
}

export const literatureService = new LiteratureService();
