<script>
  import { dataAnalysisStore } from '../stores/dataAnalysisStore.js';
  import { DataAnalyzer } from '../utils/dataAnalyzer.js';
  
  let fileInput;
  let dragOver = false;
  let uploading = false;
  
  $: datasets = $dataAnalysisStore.datasets;
  
  async function handleFileSelect(event) {
    const files = event.target.files || event.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  }
  
  async function processFile(file) {
    uploading = true;
    
    try {
      const text = await file.text();
      const { headers, data } = DataAnalyzer.parseCSV(text);
      
      const dataset = {
        name: file.name,
        headers,
        data,
        size: file.size,
        type: 'csv'
      };
      
      dataAnalysisStore.addDataset(dataset);
    } catch (error) {
      console.error('File processing failed:', error);
      alert('Failed to process file. Please ensure it\'s a valid CSV file.');
    } finally {
      uploading = false;
      if (fileInput) fileInput.value = '';
    }
  }
  
  function selectDataset(id) {
    dataAnalysisStore.selectDataset(id);
  }
  
  function removeDataset(id, event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to remove this dataset?')) {
      dataAnalysisStore.removeDataset(id);
    }
  }
  
  function handleDragOver(event) {
    event.preventDefault();
    dragOver = true;
  }
  
  function handleDragLeave() {
    dragOver = false;
  }
  
  function handleDrop(event) {
    event.preventDefault();
    dragOver = false;
    handleFileSelect(event);
  }
</script>

<div class="data-uploader">
  <div class="upload-section">
    <div 
      class="upload-area"
      class:drag-over={dragOver}
      on:dragover={handleDragOver}
      on:dragleave={handleDragLeave}
      on:drop={handleDrop}
      role="button"
      tabindex="0"
      on:click={() => fileInput.click()}
      on:keydown={(e) => e.key === 'Enter' && fileInput.click()}
    >
      {#if uploading}
        <div class="upload-status">
          <div class="spinner"></div>
          <p>Processing file...</p>
        </div>
      {:else}
        <div class="upload-prompt">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <polyline points="9,15 12,12 15,15"></polyline>
          </svg>
          <h3>Upload CSV File</h3>
          <p>Drag and drop a CSV file here or click to browse</p>
          <small>Supported formats: .csv</small>
        </div>
      {/if}
    </div>
    
    <input 
      type="file" 
      accept=".csv"
      bind:this={fileInput}
      on:change={handleFileSelect}
      style="display: none"
    />
  </div>
  
  {#if datasets.length > 0}
    <div class="datasets-section">
      <h3>Your Datasets</h3>
      <div class="datasets-list">
        {#each datasets as dataset (dataset.id)}
          <div 
            class="dataset-item"
            class:selected={$dataAnalysisStore.currentDataset?.id === dataset.id}
            on:click={() => selectDataset(dataset.id)}
            role="button"
            tabindex="0"
            on:keydown={(e) => e.key === 'Enter' && selectDataset(dataset.id)}
          >
            <div class="dataset-info">
              <h4>{dataset.name}</h4>
              <div class="dataset-meta">
                <span>{dataset.data.length} rows</span>
                <span>{dataset.headers.length} columns</span>
                <span>{(dataset.size / 1024).toFixed(1)} KB</span>
              </div>
              <div class="dataset-date">
                {new Date(dataset.createdAt).toLocaleDateString()}
              </div>
            </div>
            <button 
              class="remove-btn"
              on:click={(e) => removeDataset(dataset.id, e)}
              title="Remove dataset"
            >
              ×
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .data-uploader {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .upload-area {
    border: 2px dashed var(--border-color);
    border-radius: 12px;
    padding: 40px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: var(--surface-color);
  }
  
  .upload-area:hover,
  .upload-area.drag-over {
    border-color: var(--accent-color);
    background: var(--accent-color-light);
  }
  
  .upload-prompt svg {
    margin-bottom: 15px;
    color: var(--text-secondary);
  }
  
  .upload-prompt h3 {
    margin-bottom: 10px;
    color: var(--text-color);
  }
  
  .upload-prompt p {
    margin-bottom: 5px;
    color: var(--text-secondary);
  }
  
  .upload-prompt small {
    color: var(--text-tertiary);
  }
  
  .upload-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }
  
  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border-color);
    border-top-color: var(--accent-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .datasets-section {
    margin-top: 30px;
  }
  
  .datasets-section h3 {
    margin-bottom: 15px;
    color: var(--text-color);
  }
  
  .datasets-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .dataset-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background: var(--surface-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid transparent;
  }
  
  .dataset-item:hover {
    background: var(--hover-color);
  }
  
  .dataset-item.selected {
    border-color: var(--accent-color);
    background: var(--accent-color-light);
  }
  
  .dataset-info h4 {
    margin-bottom: 5px;
    color: var(--text-color);
  }
  
  .dataset-meta {
    display: flex;
    gap: 15px;
    margin-bottom: 5px;
  }
  
  .dataset-meta span {
    font-size: 0.8em;
    color: var(--text-secondary);
    background: var(--bg-color);
    padding: 2px 6px;
    border-radius: 4px;
  }
  
  .dataset-date {
    font-size: 0.8em;
    color: var(--text-tertiary);
  }
  
  .remove-btn {
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
  }
  
  .remove-btn:hover {
    background: #c82333;
  }
</style>
