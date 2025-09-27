<script>
  export let dataset;
  
  let selectedColumn = '';
  let chartType = 'histogram';
  
  $: numericColumns = dataset?.headers?.filter(header => {
    const values = dataset.data.map(row => row[header]).filter(v => !isNaN(v));
    return values.length > dataset.data.length * 0.7;
  }) || [];
  
  $: categoricalColumns = dataset?.headers?.filter(header => {
    const values = dataset.data.map(row => row[header]).filter(v => !isNaN(v));
    return values.length <= dataset.data.length * 0.7;
  }) || [];
  
  $: availableColumns = chartType === 'histogram' ? numericColumns : categoricalColumns;
  
  $: if (availableColumns.length > 0 && !selectedColumn) {
    selectedColumn = availableColumns[0];
  }
  
  $: chartData = generateChartData(dataset, selectedColumn, chartType);
  
  function generateChartData(dataset, column, type) {
    if (!dataset || !column) return null;
    
    const values = dataset.data.map(row => row[column]).filter(v => v !== null && v !== undefined && v !== '');
    
    if (type === 'histogram') {
      return generateHistogramData(values);
    } else {
      return generateBarChartData(values);
    }
  }
  
  function generateHistogramData(values) {
    const numericValues = values.filter(v => !isNaN(v)).map(v => parseFloat(v));
    if (numericValues.length === 0) return null;
    
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    const bins = 10;
    const binSize = (max - min) / bins;
    
    const histogram = Array(bins).fill(0);
    
    numericValues.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
      histogram[binIndex]++;
    });
    
    return histogram.map((count, i) => ({
      label: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
      value: count
    }));
  }
  
  function generateBarChartData(values) {
    const counts = {};
    values.forEach(val => {
      counts[val] = (counts[val] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([label, value]) => ({ label, value }));
  }
</script>

<div class="data-visualization">
  <div class="viz-controls">
    <div class="control-group">
      <label for="chart-type">Chart Type:</label>
      <select id="chart-type" bind:value={chartType}>
        <option value="histogram">Histogram (Numeric)</option>
        <option value="bar">Bar Chart (Categorical)</option>
      </select>
    </div>
    
    <div class="control-group">
      <label for="column-select">Column:</label>
      <select id="column-select" bind:value={selectedColumn}>
        {#each availableColumns as column}
          <option value={column}>{column}</option>
        {/each}
      </select>
    </div>
  </div>
  
  {#if chartData}
    <div class="chart-container">
      <h3>{chartType === 'histogram' ? 'Distribution' : 'Frequency'} of {selectedColumn}</h3>
      <div class="simple-chart">
        {#each chartData as item}
          <div class="chart-bar">
            <div 
              class="bar" 
              style="height: {(item.value / Math.max(...chartData.map(d => d.value))) * 100}%"
              title="{item.label}: {item.value}"
            ></div>
            <div class="bar-label">{item.label}</div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="no-data">
      <p>No data available for visualization</p>
    </div>
  {/if}
</div>

<style>
  .data-visualization {
    max-width: 1000px;
    margin: 0 auto;
  }
  
  .viz-controls {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;
    padding: 20px;
    background: var(--surface-color);
    border-radius: 8px;
  }
  
  .control-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  
  .control-group label {
    font-weight: 500;
    color: var(--text-color);
  }
  
  .control-group select {
    padding: 8px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    background: var(--bg-color);
  }
  
  .chart-container {
    background: var(--surface-color);
    padding: 20px;
    border-radius: 8px;
  }
  
  .chart-container h3 {
    margin-bottom: 20px;
    text-align: center;
    color: var(--text-color);
  }
  
  .simple-chart {
    display: flex;
    align-items: flex-end;
    height: 300px;
    gap: 5px;
    padding: 20px 0;
  }
  
  .chart-bar {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 0;
  }
  
  .bar {
    width: 100%;
    background: var(--accent-color);
    min-height: 2px;
    border-radius: 2px 2px 0 0;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .bar:hover {
    background: var(--accent-color-dark);
  }
  
  .bar-label {
    margin-top: 10px;
    font-size: 0.7em;
    color: var(--text-secondary);
    text-align: center;
    word-break: break-all;
    transform: rotate(-45deg);
    transform-origin: center;
    max-width: 60px;
  }
  
  .no-data {
    text-align: center;
    padding: 40px;
    color: var(--text-secondary);
    background: var(--surface-color);
    border-radius: 8px;
  }
</style>
