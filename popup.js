// Popup script - Main UI logic for n8n Workflow Manager
// This script runs in the extension popup context

//=============================================================================
// UI ELEMENT REFERENCES
//=============================================================================

const backupToGitHubButton = document.getElementById('backupToGitHubButton');
const backupToFileButton = document.getElementById('backupToFileButton');
const restoreFromGitHubButton = document.getElementById('restoreFromGitHubButton');
const restoreFromFileButton = document.getElementById('restoreFromFileButton');
const uploadFile = document.getElementById('uploadFile');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const infoSection = document.getElementById('infoSection');
const workflowIdElement = document.getElementById('workflowId');
const instanceUrlElement = document.getElementById('instanceUrl');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');
const actionsSection = document.querySelector('.actions');
const footerSection = document.querySelector('.footer');
const settingsButton = document.getElementById('settingsButton');
const githubSeparator = document.getElementById('githubSeparator');
const fileSeparator = document.getElementById('buttonSeparator');
const githubStatusElement = document.getElementById('githubStatus');

//=============================================================================
// STATE
//=============================================================================

let metadata = null;  // Workflow metadata from content script

//=============================================================================
// INITIALIZATION
//=============================================================================

/**
 * Initialize popup UI
 * - Get active tab
 * - Check if on n8n workflow page
 * - Extract metadata via content script
 * - Check configuration status (n8n API, GitHub)
 * - Render UI based on state
 */
async function initialize() {
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Quick check: Is URL likely an n8n workflow page?
    if (!tab.url || !tab.url.includes('/workflow/')) {
      updateStatus('error', 'Not on an n8n workflow page');
      actionsSection.style.display = 'none';
      footerSection.style.display = 'none';
      return;
    }

    // Request metadata from content script
    const metadataResponse = await chrome.tabs.sendMessage(tab.id, {
      action: 'getMetadata'
    });

    if (!metadataResponse?.success || !metadataResponse?.metadata) {
      updateStatus('error', 'Could not extract workflow metadata');
      actionsSection.style.display = 'none';
      footerSection.style.display = 'none';
      return;
    }

    // Store metadata
    metadata = metadataResponse.metadata;
    workflowIdElement.textContent = metadata.workflowId;
    instanceUrlElement.textContent = metadata.instanceUrl;

    // Check n8n API configuration
    const { n8nApiKey, n8nUrl } = await chrome.storage.session.get([
      'n8nApiKey',
      'n8nUrl'
    ]);

    if (!n8nApiKey || !n8nUrl) {
      updateStatus('error', 'n8n API key not configured');
      showNotification('Please configure API key in settings', 'error');
      // Still show UI but keep buttons disabled
      infoSection.style.display = 'block';
      actionsSection.style.display = 'flex';
      footerSection.style.display = 'block';
      return;
    }

    // Check GitHub configuration
    const { githubToken, githubRepo } = await chrome.storage.session.get([
      'githubToken',
      'githubRepo'
    ]);
    const githubConfigured = !!(githubToken && githubRepo);

    // Update GitHub status text
    githubStatusElement.textContent = githubConfigured
      ? `✓ ${githubRepo}`
      : 'Not configured';

    // Show/hide GitHub buttons based on configuration
    if (githubConfigured) {
      githubSeparator.style.display = 'flex';
      backupToGitHubButton.style.display = 'flex';
      restoreFromGitHubButton.style.display = 'flex';
      fileSeparator.style.display = 'flex';
      // Enable buttons (will be functional in later phases)
      backupToGitHubButton.disabled = false;
      restoreFromGitHubButton.disabled = false;
    } else {
      // Hide all GitHub-related UI
      githubSeparator.style.display = 'none';
      backupToGitHubButton.style.display = 'none';
      restoreFromGitHubButton.style.display = 'none';
      fileSeparator.style.display = 'none';
    }

    // Show UI sections
    infoSection.style.display = 'block';
    actionsSection.style.display = 'flex';
    footerSection.style.display = 'block';

    // Enable file buttons (will be functional in later phases)
    backupToFileButton.disabled = false;
    restoreFromFileButton.disabled = false;

    updateStatus('ready', 'Ready to backup/restore');

  } catch (error) {
    console.error('Initialization error:', error);
    updateStatus('error', 'Failed to initialize');
    showNotification('Extension error: ' + error.message, 'error');
  }
}

//=============================================================================
// UI HELPER FUNCTIONS
//=============================================================================

/**
 * Update status indicator in popup
 * Reference: example/logic-app-manager-main/popup.js:107-119
 *
 * @param {string} type - Status type: '', 'ready', 'error'
 * @param {string} message - Status message to display
 */
function updateStatus(type, message) {
  // Remove all status classes
  statusIndicator.className = 'status-indicator';

  // Add new status class if specified
  if (type) {
    statusIndicator.className += ' ' + type;
  }

  // Update message
  statusText.textContent = message;
}

/**
 * Show notification toast
 * Reference: example/logic-app-manager-main/popup.js:121-137
 *
 * @param {string} message - Notification message
 * @param {string} type - Notification type: 'success', 'error', 'info'
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    notification.classList.add('notification-fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Download workflow as JSON file
 * Reference: example/logic-app-manager-main/popup.js:205-217
 *
 * @param {Object} data - Workflow data to download
 * @param {string} workflowName - Workflow name for filename
 */
async function downloadToFile(data, workflowName) {
  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const hhmm = now.toTimeString().slice(0, 5).replace(':', '');

  // Sanitize workflow name for filename
  const sanitizedName = workflowName.replace(/[<>:"/\\|?*]/g, '-');
  const filename = `${yyyymmdd}-${hhmm}-${sanitizedName}.json`;

  // Create blob with proper MIME type
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });

  // Create temporary object URL
  const url = URL.createObjectURL(blob);

  try {
    // Trigger download
    await chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    });

    console.log(`[Download] File saved: ${filename}`);
  } finally {
    // Clean up immediately (download continues independently)
    URL.revokeObjectURL(url);
  }
}

//=============================================================================
// BACKUP WORKFLOW
//=============================================================================

/**
 * Complete backup workflow operation
 * Combines: API fetch, hash generation, data cleaning, file download
 * Reference: Research doc section 4
 *
 * @param {string} workflowId - Workflow UUID to backup
 */
async function backupWorkflowToFile(workflowId) {
  try {
    // 1. Update UI to working state
    updateStatus('', 'Backing up workflow...');
    backupToFileButton.disabled = true;

    // 2. Fetch complete workflow from n8n
    const workflow = await getWorkflowContent(workflowId);
    console.log(`[Backup] Fetched workflow: ${workflow.name}`);

    // 3. Generate hash for metadata (for future sync tracking)
    const hash = await generateWorkflowHash(workflow);
    console.log(`[Backup] Workflow hash: ${hash}`);

    // 4. Clean instance-specific data
    const cleanedData = cleanWorkflowData(workflow);
    console.log(`[Backup] Data cleaned - removed credentials and instance-specific fields`);

    // 5. Download to file
    await downloadToFile(cleanedData, workflow.name);

    // 6. Show success
    updateStatus('ready', 'Backup completed!');
    showNotification(`Workflow "${workflow.name}" backed up successfully!`, 'success');

    return { success: true, hash: hash, filename: `${workflow.name}.json` };

  } catch (error) {
    // 7. Handle errors with categorization
    console.error('[Backup] Error:', error);

    const errorInfo = handleN8nError(null, error);
    updateStatus('error', 'Backup failed');
    showNotification(`Backup failed: ${errorInfo.message}`, 'error');

    return { success: false, error: errorInfo.message };

  } finally {
    // 8. Always re-enable button
    backupToFileButton.disabled = false;
  }
}

//=============================================================================
// EVENT LISTENERS
//=============================================================================

// Settings button - open options page
settingsButton?.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Backup to GitHub button (stub - will implement in later phase)
backupToGitHubButton?.addEventListener('click', () => {
  showNotification('GitHub backup not yet implemented', 'error');
});

// Restore from GitHub button (stub - will implement in later phase)
restoreFromGitHubButton?.addEventListener('click', () => {
  showNotification('GitHub restore not yet implemented', 'error');
});

// Backup to File button
backupToFileButton?.addEventListener('click', async () => {
  if (metadata && metadata.workflowId) {
    await backupWorkflowToFile(metadata.workflowId);
  }
});

// Restore from File button (stub - will implement in later phase)
restoreFromFileButton?.addEventListener('click', () => {
  showNotification('File restore not yet implemented', 'error');
});

//=============================================================================
// STARTUP
//=============================================================================

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initialize);
