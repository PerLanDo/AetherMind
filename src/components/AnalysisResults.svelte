<script>
  export let analysisResults;
  
  $: overview = analysisResults?.overview;
  $: columnAnalysis = analysisResults?.columnAnalysis;
  
  function formatNumber(num) {
    return typeof num === 'number' ? num.toLocaleString() : num;
  }
</script>

{#if analysisResults}
  <div class="analysis-results">
    <div class="overview-section">
      <h3>Dataset Overview</h3>
      <div class="overview-grid">
        <div class="overview-item">
          <span class="label">Total Rows</span>
          <span class="value">{formatNumber(overview.totalRows)}</span>
        </div>
        <div class="overview-item">
          <span class="label">Total Columns</span>
          <span class="value">{formatNumber(overview.totalColumns)}</span>
        </div>
      </div>
    </div>
    
    <div class="columns-section">
      <h3>Column Analysis</h3>
      <div class="columns-grid">
        {#each Object.entries(columnAnalysis) as [columnName, analysis]}
          <div class="column-card">
            <h4>{columnName}</h4>
            <div class="column-type">
              <span class="type-badge" class:numeric={analysis.type === 'numeric'}>
                {analysis.type}
              </span>
            </div>
            
            {#if analysis.type === 'numeric'}
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">Count</span>
                  <span class="stat-value">{formatNumber(analysis.stats.count)}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Mean</span>
                  <span class="stat-value">{formatNumber(analysis.stats.mean)}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Median</span>
                  <span class="stat-value">{formatNumber(analysis.stats.median)}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Std Dev</span>
                  <span class="stat-value">{formatNumber(analysis.stats.stdDev)}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Min</span>
                  <span class="stat-value">{formatNumber(analysis.stats.min)}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Max</span>
                  <span class="stat-value">{formatNumber(analysis.stats.max)}</span>
                </div>
              </div>
            {:else}
              <div class="categorical-info">
                <div class="stat-item">
                  <span class="stat-label">Unique Values</span>
                  <span class="stat-value">{analysis.uniqueValues}</span>
                </div>
                <div class="top-values">
                  <span class="stat-label">Top Values:</span>
                  {#each analysis.topValues.slice(0, 3) as {value, count}}
                    <div class="top-value">
                      <span class="value-name">{value}</span>
                      <span class="value-count">({count})</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
            
            {#if analysis.missingValues > 0}
              <div class="missing-values">
                <span class="missing-label">Missing:</span>
                <span class="missing-count">{analysis.missingValues}</span>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </div>
{:else}
  <div class="no-results">
    <p>No analysis results available. Run an analysis first.</p>
  </div>
{/if}

<style>
  .analysis-results {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .overview-section {
    margin-bottom: 30px;
  }
  
  .overview-section h3,
  .columns-section h3 {
    margin-bottom: 15px;
    color: var(--text-color);
  }
  
  .overview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }
  
  .overview-item {
    background: var(--surface-color);
    padding: 20px;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .label {
    color: var(--text-secondary);
    font-weight: 500;
  }
  
  .value {
    font-size: 1.5em;
    font-weight: bold;
    color: var(--accent-color);
  }
  
  .columns-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }
  
  .column-card {
    background: var(--surface-color);
    padding: 20px;
    border-radius: 12px;
    border: 1px solid var(--border-color);
  }
  
  .column-card h4 {
    margin-bottom: 10px;
    color: var(--text-color);
    font-size: 1.1em;
  }
  
  .column-type {
    margin-bottom: 15px;
  }
  
  .type-badge {
    background: var(--text-secondary);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8em;
    text-transform: uppercase;
  }
  
  .type-badge.numeric {
    background: var(--accent-color);
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--border-color);
  }
  
  .stat-label {
    color: var(--text-secondary);
    font-size: 0.9em;
  }
  
  .stat-value {
    font-weight: 500;
    color: var(--text-color);
  }
  
  .categorical-info {
    space-y: 10px;
  }
  
  .top-values {
    margin-top: 10px;
  }
  
  .top-value {
    display: flex;
    justify-content: space-between;
    margin: 5px 0;
    font-size: 0.9em;
  }
  
  .value-name {
    color: var(--text-color);
  }
  
  .value-count {
    color: var(--text-secondary);
  }
  
  .missing-values {
    margin-top: 15px;
    padding: 10px;
    background: rgba(220, 53, 69, 0.1);
    border-radius: 6px;
    display: flex;
    justify-content: space-between;
  }
  
  .missing-label {
    color: #dc3545;
    font-weight: 500;
  }
  
  .missing-count {
    color: #dc3545;
    font-weight: bold;
  }
  
  .no-results {
    text-align: center;
    padding: 40px;
    color: var(--text-secondary);
  }
</style>
