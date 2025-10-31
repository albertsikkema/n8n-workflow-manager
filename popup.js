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
 * Update status indicator
 * @param {string} type - 'ready' or 'error'
 * @param {string} message - Status message to display
 */
function updateStatus(type, message) {
  statusIndicator.className = 'status-indicator ' + type;
  statusText.textContent = message;
}

/**
 * Show notification toast
 * @param {string} message - Notification message
 * @param {string} type - 'success' or 'error'
 */
function showNotification(message, type = 'success') {
  notificationText.textContent = message;
  notification.className = 'notification ' + type;
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000);
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

// Backup to File button (stub - will implement in later phase)
backupToFileButton?.addEventListener('click', () => {
  showNotification('File backup not yet implemented', 'error');
});

// Restore from File button (stub - will implement in later phase)
restoreFromFileButton?.addEventListener('click', () => {
  showNotification('File restore not yet implemented', 'error');
});

//=============================================================================
// STARTUP
//=============================================================================

// Initialize on load
initialize();
