<script>
  import { settings } from '../stores/settingsStore.js';
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let activeTab = 'general';
  let currentSettings = {};
  
  settings.subscribe(value => {
    currentSettings = value;
  });
  
  function updateSetting(category, key, value) {
    settings.updateSetting(category, key, value);
  }
  
  function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      settings.reset();
    }
  }
</script>

<div class="settings-modal">
  <div class="settings-header">
    <h2>Settings</h2>
    <button class="close-btn" on:click={() => dispatch('close')}>×</button>
  </div>
  
  <div class="settings-content">
    <nav class="settings-nav">
      <button class:active={activeTab === 'general'} on:click={() => activeTab = 'general'}>
        General
      </button>
      <button class:active={activeTab === 'appearance'} on:click={() => activeTab = 'appearance'}>
        Appearance
      </button>
      <button class:active={activeTab === 'notifications'} on:click={() => activeTab = 'notifications'}>
        Notifications
      </button>
      <button class:active={activeTab === 'accessibility'} on:click={() => activeTab = 'accessibility'}>
        Accessibility
      </button>
      <button class:active={activeTab === 'privacy'} on:click={() => activeTab = 'privacy'}>
        Privacy
      </button>
    </nav>
    
    <div class="settings-panel">
      {#if activeTab === 'general'}
        <div class="setting-group">
          <h3>General Preferences</h3>
          <div class="setting-item">
            <label>
              <input 
                type="checkbox" 
                checked={currentSettings.general?.autoSave}
                on:change={(e) => updateSetting('general', 'autoSave', e.target.checked)}
              />
              Auto-save changes
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input 
                type="checkbox" 
                checked={currentSettings.general?.confirmDelete}
                on:change={(e) => updateSetting('general', 'confirmDelete', e.target.checked)}
              />
              Confirm before deleting items
            </label>
          </div>
        </div>
      {/if}
      
      {#if activeTab === 'appearance'}
        <div class="setting-group">
          <h3>Theme</h3>
          <div class="setting-item">
            <label for="theme-select">Color Theme</label>
            <select 
              id="theme-select"
              value={currentSettings.theme}
              on:change={(e) => updateSetting('general', 'theme', e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">System Default</option>
            </select>
          </div>
        </div>
      {/if}
      
      {#if activeTab === 'notifications'}
        <div class="setting-group">
          <h3>Notification Preferences</h3>
          <div class="setting-item">
            <label>
              <input 
                type="checkbox" 
                checked={currentSettings.notifications?.enabled}
                on:change={(e) => updateSetting('notifications', 'enabled', e.target.checked)}
              />
              Enable notifications
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input 
                type="checkbox" 
                checked={currentSettings.notifications?.sound}
                on:change={(e) => updateSetting('notifications', 'sound', e.target.checked)}
              />
              Notification sounds
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input 
                type="checkbox" 
                checked={currentSettings.notifications?.desktop}
                on:change={(e) => updateSetting('notifications', 'desktop', e.target.checked)}
              />
              Desktop notifications
            </label>
          </div>
        </div>
      {/if}
      
      {#if activeTab === 'accessibility'}
        <div class="setting-group">
          <h3>Accessibility Options</h3>
          <div class="setting-item">
            <label for="font-size">Font Size</label>
            <select 
              id="font-size"
              value={currentSettings.accessibility?.fontSize}
              on:change={(e) => updateSetting('accessibility', 'fontSize', e.target.value)}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          <div class="setting-item">
            <label>
              <input 
                type="checkbox" 
                checked={currentSettings.accessibility?.highContrast}
                on:change={(e) => updateSetting('accessibility', 'highContrast', e.target.checked)}
              />
              High contrast mode
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input 
                type="checkbox" 
                checked={currentSettings.accessibility?.reduceMotion}
                on:change={(e) => updateSetting('accessibility', 'reduceMotion', e.target.checked)}
              />
              Reduce motion
            </label>
          </div>
        </div>
      {/if}
      
      {#if activeTab === 'privacy'}
        <div class="setting-group">
          <h3>Privacy & Data</h3>
          <div class="setting-item">
            <label>
              <input 
                type="checkbox" 
                checked={currentSettings.privacy?.analytics}
                on:change={(e) => updateSetting('privacy', 'analytics', e.target.checked)}
              />
              Allow analytics data collection
            </label>
          </div>
          <div class="setting-item">
            <label>
              <input 
                type="checkbox" 
                checked={currentSettings.privacy?.crashReports}
                on:change={(e) => updateSetting('privacy', 'crashReports', e.target.checked)}
              />
              Send crash reports
            </label>
          </div>
          <div class="setting-item">
            <button class="danger-btn" on:click={resetSettings}>
              Reset All Settings
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .settings-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80vw;
    max-width: 800px;
    height: 80vh;
    background: var(--bg-color);
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    overflow: hidden;
  }
  
  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    padding: 5px;
  }
  
  .settings-content {
    display: flex;
    height: calc(100% - 80px);
  }
  
  .settings-nav {
    width: 200px;
    background: var(--surface-color);
    padding: 20px 0;
    border-right: 1px solid var(--border-color);
  }
  
  .settings-nav button {
    width: 100%;
    padding: 12px 20px;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .settings-nav button:hover {
    background: var(--hover-color);
  }
  
  .settings-nav button.active {
    background: var(--accent-color);
    color: white;
  }
  
  .settings-panel {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }
  
  .setting-group {
    margin-bottom: 30px;
  }
  
  .setting-group h3 {
    margin-bottom: 15px;
    color: var(--text-color);
  }
  
  .setting-item {
    margin-bottom: 15px;
  }
  
  .setting-item label {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }
  
  .setting-item select {
    padding: 8px;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background: var(--bg-color);
  }
  
  .danger-btn {
    background: #dc3545;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
  }
  
  .danger-btn:hover {
    background: #c82333;
  }
</style>
