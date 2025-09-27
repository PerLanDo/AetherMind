// Data analysis helper service for basic statistics and coding assistance
import { aiService } from "./ai-service";

export interface DataAnalysisRequest {
  data?: string; // CSV data or structured text
  analysisType:
    | "descriptive_stats"
    | "correlation"
    | "regression"
    | "visualization"
    | "hypothesis_test"
    | "code_generation"
    | "data_cleaning"
    | "exploratory";
  variables?: string[];
  language?: "python" | "r" | "excel";
  question?: string;
  parameters?: {
    confidenceLevel?: number;
    testType?: string;
    chartType?: string;
    [key: string]: any;
  };
}

export interface DataAnalysisResponse {
  result: string;
  code?: string;
  explanation: string;
  recommendations: string[];
  visualizationSuggestions?: string[];
  nextSteps: string[];
  timestamp: string;
}

export interface BasicStats {
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

export class DataAnalysisService {
  // Main data analysis function
  async analyzeData(
    request: DataAnalysisRequest
  ): Promise<DataAnalysisResponse> {
    try {
      const analysisPrompt = this.buildAnalysisPrompt(request);

      const aiResponse = await aiService.analyzeText({
        text: analysisPrompt,
        prompt: "Perform data analysis and generate insights",
        analysisType: "technical_writing",
      });

      const result = aiResponse.result;
      const code = this.extractCode(result, request.language || "python");

      return {
        result: this.cleanAnalysisResult(result),
        code,
        explanation: this.generateExplanation(request.analysisType),
        recommendations: this.generateRecommendations(request.analysisType),
        visualizationSuggestions: this.generateVisualizationSuggestions(
          request.analysisType
        ),
        nextSteps: this.generateNextSteps(request.analysisType),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Data analysis error:", error);
      throw new Error("Failed to perform data analysis");
    }
  }

  // Generate code for specific analysis tasks
  async generateAnalysisCode(
    request: DataAnalysisRequest
  ): Promise<{ code: string; explanation: string }> {
    try {
      const codePrompt = this.buildCodeGenerationPrompt(request);

      const aiResponse = await aiService.analyzeText({
        text: codePrompt,
        prompt: "Generate data analysis code",
        analysisType: "technical_writing",
      });

      const code = this.extractCode(
        aiResponse.result,
        request.language || "python"
      );

      return {
        code: code || aiResponse.result,
        explanation: this.generateCodeExplanation(
          request.analysisType,
          request.language || "python"
        ),
      };
    } catch (error) {
      console.error("Code generation error:", error);
      throw new Error("Failed to generate analysis code");
    }
  }

  // Perform basic descriptive statistics on numeric data
  calculateBasicStats(data: number[]): BasicStats {
    if (data.length === 0) {
      throw new Error("Data array cannot be empty");
    }

    const sorted = [...data].sort((a, b) => a - b);
    const n = data.length;

    // Basic measures
    const sum = data.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;

    // Median
    const median =
      n % 2 === 0
        ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
        : sorted[Math.floor(n / 2)];

    // Mode (most frequent value)
    const frequency = new Map<number, number>();
    data.forEach((val) => frequency.set(val, (frequency.get(val) || 0) + 1));
    const maxFreq = Math.max(...Array.from(frequency.values()));
    const mode =
      maxFreq > 1
        ? Array.from(frequency.entries()).find(
            ([_, freq]) => freq === maxFreq
          )?.[0]
        : undefined;

    // Variance and standard deviation
    const variance =
      data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const standardDeviation = Math.sqrt(variance);

    // Range
    const minimum = sorted[0];
    const maximum = sorted[n - 1];
    const range = maximum - minimum;

    // Quartiles
    const q1 = this.calculatePercentile(sorted, 25);
    const q2 = median;
    const q3 = this.calculatePercentile(sorted, 75);
    const iqr = q3 - q1;

    return {
      count: n,
      mean: this.roundToDecimals(mean, 4),
      median: this.roundToDecimals(median, 4),
      mode,
      standardDeviation: this.roundToDecimals(standardDeviation, 4),
      variance: this.roundToDecimals(variance, 4),
      minimum,
      maximum,
      range,
      quartiles: {
        q1: this.roundToDecimals(q1, 4),
        q2: this.roundToDecimals(q2, 4),
        q3: this.roundToDecimals(q3, 4),
        iqr: this.roundToDecimals(iqr, 4),
      },
    };
  }

  // Calculate correlation between two variables
  calculateCorrelation(
    x: number[],
    y: number[]
  ): { correlation: number; strength: string; interpretation: string } {
    if (x.length !== y.length || x.length === 0) {
      throw new Error("Arrays must have the same non-zero length");
    }

    const n = x.length;
    const meanX = x.reduce((acc, val) => acc + val, 0) / n;
    const meanY = y.reduce((acc, val) => acc + val, 0) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const diffX = x[i] - meanX;
      const diffY = y[i] - meanY;

      numerator += diffX * diffY;
      denomX += diffX * diffX;
      denomY += diffY * diffY;
    }

    const correlation = numerator / Math.sqrt(denomX * denomY);

    // Interpret correlation strength
    const absCorr = Math.abs(correlation);
    let strength = "";

    if (absCorr >= 0.9) strength = "Very Strong";
    else if (absCorr >= 0.7) strength = "Strong";
    else if (absCorr >= 0.5) strength = "Moderate";
    else if (absCorr >= 0.3) strength = "Weak";
    else strength = "Very Weak";

    const direction = correlation > 0 ? "positive" : "negative";
    const interpretation = `${strength} ${direction} correlation (r = ${this.roundToDecimals(
      correlation,
      4
    )})`;

    return {
      correlation: this.roundToDecimals(correlation, 4),
      strength,
      interpretation,
    };
  }

  // Parse CSV-like data into arrays
  parseDataString(dataString: string): {
    headers: string[];
    data: (string | number)[][];
  } {
    const lines = dataString.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());

    const data = lines.slice(1).map((line) => {
      return line.split(",").map((cell) => {
        const trimmed = cell.trim();
        const num = parseFloat(trimmed);
        return isNaN(num) ? trimmed : num;
      });
    });

    return { headers, data };
  }

  // Extract numeric column from parsed data
  extractNumericColumn(
    data: (string | number)[][],
    columnIndex: number
  ): number[] {
    return data
      .map((row) => row[columnIndex])
      .filter((val) => typeof val === "number") as number[];
  }

  // Private helper methods

  private buildAnalysisPrompt(request: DataAnalysisRequest): string {
    const basePrompt = `
Perform ${request.analysisType.replace("_", " ")} analysis on the provided data.

Analysis Type: ${request.analysisType}
Language: ${request.language || "python"}
${request.question ? `Research Question: ${request.question}` : ""}
${
  request.variables
    ? `Variables of Interest: ${request.variables.join(", ")}`
    : ""
}
${request.data ? `Data:\n${request.data}` : ""}

Please provide:
1. Clear analysis results with interpretations
2. Code implementation in ${request.language || "python"}
3. Statistical insights and conclusions
4. Recommendations for further analysis

Focus on practical insights and actionable recommendations.`;

    return basePrompt;
  }

  private buildCodeGenerationPrompt(request: DataAnalysisRequest): string {
    const templates = {
      python: {
        descriptive_stats: `
Generate Python code using pandas and numpy to calculate descriptive statistics.
Include: mean, median, mode, standard deviation, quartiles, and basic plots.
`,
        correlation: `
Generate Python code to calculate and visualize correlations between variables.
Use pandas, numpy, and matplotlib/seaborn for correlation matrix and scatter plots.
`,
        regression: `
Generate Python code for linear/multiple regression analysis.
Use scikit-learn or statsmodels with proper model evaluation metrics.
`,
        visualization: `
Generate Python code for data visualization using matplotlib, seaborn, or plotly.
Include multiple chart types appropriate for the data.
`,
      },
      r: {
        descriptive_stats: `
Generate R code for descriptive statistics analysis.
Use base R and packages like dplyr, summary functions, and basic plots.
`,
        correlation: `
Generate R code for correlation analysis and visualization.
Use cor(), corrplot package, and ggplot2 for visualizations.
`,
        regression: `
Generate R code for regression analysis using lm() function.
Include model diagnostics and visualization of results.
`,
        visualization: `
Generate R code for data visualization using ggplot2.
Create appropriate charts based on data types and analysis goals.
`,
      },
    };

    const lang = request.language || "python";
    const templateLang = lang === "excel" ? "python" : lang; // Fallback to python for excel
    const template =
      templates[templateLang as keyof typeof templates]?.[
        request.analysisType as keyof typeof templates.python
      ] ||
      `Generate ${lang} code for ${request.analysisType.replace(
        "_",
        " "
      )} analysis.`;

    return `${template}

${request.data ? `Data:\n${request.data}` : ""}
${request.question ? `Analysis Goal: ${request.question}` : ""}

Provide clean, well-commented code with explanations.`;
  }

  private extractCode(text: string, language: string): string {
    // Try to extract code blocks first
    const codeBlockRegex = new RegExp(
      `\`\`\`${language}?([\\s\\S]*?)\`\`\``,
      "gi"
    );
    const match = codeBlockRegex.exec(text);

    if (match) {
      return match[1].trim();
    }

    // Try to extract inline code
    const inlineCodeRegex = /`([^`]+)`/g;
    const inlineMatches = text.match(inlineCodeRegex);

    if (inlineMatches && inlineMatches.length > 3) {
      return inlineMatches.map((m) => m.replace(/`/g, "")).join("\n");
    }

    // If no code blocks found, look for typical code patterns
    const lines = text.split("\n");
    const codeLines = lines.filter((line) => {
      const trimmed = line.trim();
      return (
        trimmed.includes("import ") ||
        trimmed.includes("library(") ||
        trimmed.includes("def ") ||
        trimmed.includes(" <- ") ||
        trimmed.includes("print(") ||
        trimmed.includes("plt.") ||
        trimmed.includes("ggplot")
      );
    });

    return codeLines.length > 0 ? codeLines.join("\n") : "";
  }

  private cleanAnalysisResult(text: string): string {
    // Remove code blocks from the main result
    return text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]+`/g, "")
      .trim();
  }

  private generateExplanation(analysisType: string): string {
    const explanations = {
      descriptive_stats:
        "Descriptive statistics provide a summary of the central tendency, variability, and distribution of your data.",
      correlation:
        "Correlation analysis measures the strength and direction of relationships between variables.",
      regression:
        "Regression analysis helps predict one variable based on others and quantify relationships.",
      visualization:
        "Data visualization reveals patterns, trends, and outliers that may not be apparent in raw data.",
      hypothesis_test:
        "Hypothesis testing determines if observed differences are statistically significant.",
      data_cleaning:
        "Data cleaning prepares your dataset by handling missing values, outliers, and inconsistencies.",
      exploratory:
        "Exploratory data analysis provides initial insights and guides further analysis directions.",
    };

    return (
      explanations[analysisType as keyof typeof explanations] ||
      "This analysis provides insights into your data patterns and relationships."
    );
  }

  private generateRecommendations(analysisType: string): string[] {
    const recommendations = {
      descriptive_stats: [
        "Check for outliers that might affect your analysis",
        "Consider the distribution shape when choosing further tests",
        "Look at the relationship between mean and median to assess skewness",
      ],
      correlation: [
        "Remember that correlation does not imply causation",
        "Consider non-linear relationships that correlation might miss",
        "Check for confounding variables that might affect relationships",
      ],
      regression: [
        "Validate model assumptions before interpreting results",
        "Check for multicollinearity between predictor variables",
        "Use cross-validation to assess model generalizability",
      ],
      visualization: [
        "Choose chart types appropriate for your data types",
        "Use consistent scales and colors for comparison",
        "Include clear labels and legends for interpretation",
      ],
    };

    return (
      recommendations[analysisType as keyof typeof recommendations] || [
        "Verify data quality before drawing conclusions",
        "Consider the context and limitations of your analysis",
        "Seek peer review for important findings",
      ]
    );
  }

  private generateVisualizationSuggestions(analysisType: string): string[] {
    const suggestions = {
      descriptive_stats: ["Histogram", "Box Plot", "Summary Table"],
      correlation: ["Scatter Plot", "Correlation Matrix", "Heatmap"],
      regression: [
        "Scatter Plot with Regression Line",
        "Residual Plots",
        "Prediction vs Actual",
      ],
      visualization: ["Bar Chart", "Line Chart", "Scatter Plot", "Histogram"],
      hypothesis_test: [
        "Box Plot",
        "Distribution Comparison",
        "Confidence Intervals",
      ],
      exploratory: ["Pair Plot", "Distribution Grid", "Correlation Heatmap"],
    };

    return (
      suggestions[analysisType as keyof typeof suggestions] || [
        "Appropriate charts for your data type",
      ]
    );
  }

  private generateNextSteps(analysisType: string): string[] {
    return [
      "Review and validate the results",
      "Consider additional variables or data sources",
      "Perform sensitivity analysis if appropriate",
      "Document your methodology and findings",
    ];
  }

  private generateCodeExplanation(
    analysisType: string,
    language: string
  ): string {
    return (
      `This ${language} code performs ${analysisType.replace(
        "_",
        " "
      )} analysis. ` +
      "Review the code, modify parameters as needed, and ensure your data format matches the expected input."
    );
  }

  private calculatePercentile(
    sortedData: number[],
    percentile: number
  ): number {
    const index = (percentile / 100) * (sortedData.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return sortedData[lower];
    }

    const weight = index - lower;
    return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
  }

  private roundToDecimals(num: number, decimals: number): number {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}

export const dataAnalysisService = new DataAnalysisService();
