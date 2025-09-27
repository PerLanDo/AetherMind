<script>
  import { dataAnalysisStore } from '../stores/dataAnalysisStore.js';
  import { DataAnalyzer } from '../utils/dataAnalyzer.js';
  import DataUploader from './DataUploader.svelte';
  import AnalysisResults from './AnalysisResults.svelte';
  import DataVisualization from './DataVisualization.svelte';
  
  let activeTab = 'upload';
  let analysisResults = null;
  
  $: currentDataset = $dataAnalysisStore.currentDataset;
  
  async function analyzeCurrentDataset() {
    if (!currentDataset) return;
    
    dataAnalysisStore.setAnalyzing(true);
    
    try {
      const results = DataAnalyzer.analyzeDataset(currentDataset);
      analysisResults = results;
      
      dataAnalysisStore.addAnalysis({
        datasetId: currentDataset.id,
        results,
        type: 'basic_analysis'
      });
      
      activeTab = 'results';
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      dataAnalysisStore.setAnalyzing(false);
    }
  }
</script>

<div class="data-analysis-helper">
  <div class="analysis-header">
    <h2>Data Analysis Helper</h2>
    <div class="dataset-info">
      {#if currentDataset}
        <span class="dataset-name">{currentDataset.name}</span>
        <span class="dataset-size">{currentDataset.data?.length || 0} rows</span>
      {:else}
        <span class="no-dataset">No dataset selected</span>
      {/if}
    </div>
  </div>
  
  <div class="analysis-tabs">
    <button 
      class:active={activeTab === 'upload'}
      on:click={() => activeTab = 'upload'}
    >
      Upload Data
    </button>
    <button 
      class:active={activeTab === 'analyze'}
      on:click={() => activeTab = 'analyze'}
      disabled={!currentDataset}
    >
      Analyze
    </button>
    <button 
      class:active={activeTab === 'results'}
      on:click={() => activeTab = 'results'}
      disabled={!analysisResults}
    >
      Results
    </button>
    <button 
      class:active={activeTab === 'visualize'}
      on:click={() => activeTab = 'visualize'}
      disabled={!currentDataset}
    >
      Visualize
    </button>
  </div>
  
  <div class="analysis-content">
    {#if activeTab === 'upload'}
      <DataUploader />
    {:else if activeTab === 'analyze'}
      <div class="analyze-panel">
        <h3>Analysis Options</h3>
        <div class="analysis-options">
          <button 
            class="analyze-btn"
            on:click={analyzeCurrentDataset}
            disabled={$dataAnalysisStore.isAnalyzing || !currentDataset}
          >
            {#if $dataAnalysisStore.isAnalyzing}
              Analyzing...
            {:else}
              Run Basic Analysis
            {/if}
          </button>
          
          <div class="analysis-description">
            <h4>Basic Analysis includes:</h4>
            <ul>
              <li>Descriptive statistics for numeric columns</li>
              <li>Frequency analysis for categorical columns</li>
              <li>Missing value detection</li>
              <li>Data type identification</li>
            </ul>
          </div>
        </div>
      </div>
    {:else if activeTab === 'results'}
      <AnalysisResults {analysisResults} />
    {:else if activeTab === 'visualize'}
      <DataVisualization dataset={currentDataset} />
    {/if}
  </div>
</div>

<style>
  .data-analysis-helper {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--bg-color);
  }
  
  .analysis-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
  }
  
  .dataset-info {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  
  .dataset-name {
    font-weight: 500;
    color: var(--accent-color);
  }
  
  .dataset-size {
    background: var(--surface-color);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8em;
  }
  
  .no-dataset {
    color: var(--text-secondary);
    font-style: italic;
  }
  
  .analysis-tabs {
    display: flex;
    background: var(--surface-color);
    border-bottom: 1px solid var(--border-color);
  }
  
  .analysis-tabs button {
    flex: 1;
    padding: 12px;
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .analysis-tabs button:hover:not(:disabled) {
    background: var(--hover-color);
  }
  
  .analysis-tabs button.active {
    background: var(--accent-color);
    color: white;
  }
  
  .analysis-tabs button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .analysis-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }
  
  .analyze-panel {
    max-width: 600px;
    margin: 0 auto;
  }
  
  .analysis-options {
    margin-top: 20px;
  }
  
  .analyze-btn {
    width: 100%;
    padding: 15px;
    background: var(--accent-color);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.2s;
    margin-bottom: 20px;
  }
  
  .analyze-btn:hover:not(:disabled) {
    background: var(--accent-color-dark);
  }
  
  .analyze-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .analysis-description {
    background: var(--surface-color);
    padding: 20px;
    border-radius: 8px;
  }
  
  .analysis-description h4 {
    margin-bottom: 10px;
    color: var(--text-color);
  }
  
  .analysis-description ul {
    list-style-type: disc;
    padding-left: 20px;
  }
  
  .analysis-description li {
    margin-bottom: 5px;
    color: var(--text-secondary);
  }
</style>
