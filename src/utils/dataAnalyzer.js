export class DataAnalyzer {
  static parseCSV(csvText) {
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
      const row = {};
      headers.forEach((header, index) => {
        const value = values[index];
        row[header] = isNaN(value) ? value : parseFloat(value);
      });
      data.push(row);
    }

    return { headers, data };
  }

  static calculateBasicStats(data, column) {
    const values = data.map((row) => row[column]).filter((v) => !isNaN(v));

    if (values.length === 0) return null;

    const sorted = values.sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;

    const variance =
      values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);

    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      mean: Math.round(mean * 100) / 100,
      median: sorted[Math.floor(sorted.length / 2)],
      stdDev: Math.round(stdDev * 100) / 100,
      sum: sum,
    };
  }

  static analyzeDataset(dataset) {
    const { headers, data } = dataset;
    const analysis = {
      overview: {
        totalRows: data.length,
        totalColumns: headers.length,
        columns: headers,
      },
      columnAnalysis: {},
    };

    headers.forEach((column) => {
      const values = data.map((row) => row[column]);
      const numericValues = values.filter((v) => !isNaN(v) && v !== "");
      const isNumeric = numericValues.length > values.length * 0.7;

      if (isNumeric) {
        analysis.columnAnalysis[column] = {
          type: "numeric",
          stats: this.calculateBasicStats(data, column),
          missingValues: values.filter(
            (v) => v === "" || v === null || v === undefined
          ).length,
        };
      } else {
        const uniqueValues = [
          ...new Set(values.filter((v) => v !== "" && v !== null)),
        ];
        analysis.columnAnalysis[column] = {
          type: "categorical",
          uniqueValues: uniqueValues.length,
          topValues: this.getTopValues(values),
          missingValues: values.filter(
            (v) => v === "" || v === null || v === undefined
          ).length,
        };
      }
    });

    return analysis;
  }

  static getTopValues(values) {
    const counts = {};
    values.forEach((val) => {
      if (val !== "" && val !== null && val !== undefined) {
        counts[val] = (counts[val] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([value, count]) => ({ value, count }));
  }

  static generateCorrelationMatrix(data, numericColumns) {
    const matrix = {};

    numericColumns.forEach((col1) => {
      matrix[col1] = {};
      numericColumns.forEach((col2) => {
        matrix[col1][col2] = this.calculateCorrelation(data, col1, col2);
      });
    });

    return matrix;
  }

  static calculateCorrelation(data, col1, col2) {
    const pairs = data
      .map((row) => [row[col1], row[col2]])
      .filter(([a, b]) => !isNaN(a) && !isNaN(b));

    if (pairs.length < 2) return 0;

    const n = pairs.length;
    const sum1 = pairs.reduce((acc, [a]) => acc + a, 0);
    const sum2 = pairs.reduce((acc, [, b]) => acc + b, 0);
    const sum1Sq = pairs.reduce((acc, [a]) => acc + a * a, 0);
    const sum2Sq = pairs.reduce((acc, [, b]) => acc + b * b, 0);
    const pSum = pairs.reduce((acc, [a, b]) => acc + a * b, 0);

    const num = pSum - (sum1 * sum2) / n;
    const den = Math.sqrt(
      (sum1Sq - (sum1 * sum1) / n) * (sum2Sq - (sum2 * sum2) / n)
    );

    return den === 0 ? 0 : Math.round((num / den) * 100) / 100;
  }
}
