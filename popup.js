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

    // Get n8n configuration from storage
    const { n8nInstanceUrl, n8nApiKey } = await chrome.storage.session.get([
      'n8nInstanceUrl',
      'n8nApiKey'
    ]);

    if (!n8nInstanceUrl || !n8nApiKey) {
      updateStatus('error', 'n8n not configured');
      showNotification('Please configure n8n instance URL and API key in settings', 'error');
      // Still show UI but keep buttons disabled
      infoSection.style.display = 'block';
      actionsSection.style.display = 'flex';
      footerSection.style.display = 'block';
      return;
    }

    // Store configuration in metadata (override instance URL from tab)
    metadata.instanceUrl = n8nInstanceUrl;
    metadata.apiKey = n8nApiKey;

    // Display configured instance URL
    instanceUrlElement.textContent = n8nInstanceUrl;
    console.log('[Debug] Using configured n8n:', n8nInstanceUrl);

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
 * Show commit message modal
 * Returns a promise that resolves with the commit message or null if cancelled
 *
 * @param {string} defaultMessage - Default commit message
 * @returns {Promise<string|null>} - Commit message or null if cancelled
 */
function showCommitMessageModal(defaultMessage) {
  return new Promise((resolve) => {
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'commitMessageModal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Commit Message</h3>
            <button id="closeCommitModal" class="close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <label for="commitMessageInput">Enter commit message:</label>
            <textarea id="commitMessageInput" placeholder="Backup workflow: ...">${escapeHtml(defaultMessage)}</textarea>
            <small>Describe the changes you're backing up to GitHub</small>
          </div>
          <div class="modal-footer">
            <button id="cancelCommit" class="btn btn-secondary">Cancel</button>
            <button id="confirmCommit" class="btn btn-primary">Commit</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const textarea = document.getElementById('commitMessageInput');
    const confirmBtn = document.getElementById('confirmCommit');
    const cancelBtn = document.getElementById('cancelCommit');
    const closeBtn = document.getElementById('closeCommitModal');

    // Focus and select text
    textarea.focus();
    textarea.select();

    // Handle confirm
    const handleConfirm = () => {
      const message = textarea.value.trim();
      document.body.removeChild(modal);
      resolve(message || defaultMessage);
    };

    // Handle cancel
    const handleCancel = () => {
      document.body.removeChild(modal);
      resolve(null);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    closeBtn.addEventListener('click', handleCancel);

    // Allow Enter to submit (Shift+Enter for new line)
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleConfirm();
      }
    });

    // Allow Escape to cancel
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    });
  });
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
// GITHUB RESTORE - COMMIT SELECTOR
//=============================================================================

/**
 * Show modal to select commit for restore
 * Reference: example/logic-app-manager-main/popup.js:393-463
 */
async function showCommitSelector() {
  const { githubToken, githubRepo } = await chrome.storage.session.get(['githubToken', 'githubRepo']);

  if (!githubToken || !githubRepo) {
    showNotification('Please configure GitHub settings first', 'error');
    chrome.runtime.openOptionsPage();
    return;
  }

  try {
    updateStatus('', 'Loading commits...');

    if (!metadata || !metadata.workflowId) {
      throw new Error('Cannot determine workflow ID');
    }

    // Fetch commits for this workflow
    const commits = await listCommits(githubToken, githubRepo, metadata.workflowId, 20);

    if (commits.length === 0) {
      showNotification('No commits found for this workflow', 'error');
      updateStatus('ready', 'No commits found');
      return;
    }

    console.log(`[GitHub Restore] Found ${commits.length} commits`);

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'commitModal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Select a commit to restore</h3>
            <button id="closeModal" class="close-btn">&times;</button>
          </div>
          <div class="commit-list">
            ${commits.map(commit => `
              <div class="commit-item" data-sha="${commit.sha}">
                <div class="commit-message">${escapeHtml(commit.commit.message)}</div>
                <div class="commit-meta">
                  ${escapeHtml(commit.commit.author.name)} ·
                  ${new Date(commit.commit.author.date).toLocaleString()}
                </div>
                <div class="commit-sha">${commit.sha.substring(0, 7)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle commit selection
    modal.querySelectorAll('.commit-item').forEach(item => {
      item.addEventListener('click', async () => {
        const sha = item.dataset.sha;
        document.body.removeChild(modal);
        await restoreFromCommit(githubToken, githubRepo, metadata.workflowId, sha);
      });
    });

    // Handle close button
    document.getElementById('closeModal').addEventListener('click', () => {
      document.body.removeChild(modal);
      updateStatus('ready', 'Restore cancelled');
    });

    updateStatus('ready', 'Select a commit');

  } catch (error) {
    console.error('[GitHub Restore] Error loading commits:', error);
    updateStatus('error', 'Failed to load commits');
    showNotification('Error: ' + error.message, 'error');
  }
}

/**
 * Restore workflow from specific GitHub commit
 * Reference: example/logic-app-manager-main/popup.js:465-498
 *
 * @param {string} token - GitHub personal access token
 * @param {string} repo - Repository in owner/repo format
 * @param {string} workflowId - Workflow UUID
 * @param {string} commitSha - Git commit SHA to restore from
 */
async function restoreFromCommit(token, repo, workflowId, commitSha) {
  try {
    updateStatus('', 'Restoring from commit...');

    // Step 1: Get workflow from commit
    const workflowData = await getWorkflowFromCommit(token, repo, workflowId, commitSha);
    console.log(`[GitHub Restore] Fetched workflow from commit: ${commitSha.substring(0, 7)}`);

    // Step 2: Clean data before restore (REQUIRED FOR N8N)
    const cleanedData = cleanWorkflowData(workflowData);
    console.log('[GitHub Restore] Data cleaned - removed credentials and instance-specific fields');

    // Step 3: Call n8n API to restore workflow
    const endpoint = `${metadata.instanceUrl}/api/v1/workflows/${workflowId}`;

    // Step 4: Restore to n8n (using API key)
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': metadata.apiKey
      },
      body: JSON.stringify(cleanedData)
    });

    if (!response.ok) {
      throw new Error(`n8n API error: ${response.status}`);
    }

    console.log('[GitHub Restore] Workflow updated successfully');

    // Step 5: Show success with warnings
    updateStatus('ready', 'Restored from commit!');
    showNotification(
      `Workflow restored from Git (${commitSha.substring(0, 7)})!\nRefresh the page to see changes.\n\nIMPORTANT: Credentials must be reconfigured.`,
      'success'
    );

  } catch (error) {
    console.error('[GitHub Restore] Error:', error);
    updateStatus('error', 'Restore failed');
    showNotification('Restore failed: ' + error.message, 'error');
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

    // 2. Fetch complete workflow from n8n (using API key)
    const workflow = await getWorkflowContent(
      metadata.instanceUrl,
      workflowId,
      metadata.apiKey
    );
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

// Backup to GitHub button
// Reference: example/logic-app-manager-main/popup.js:219-273
backupToGitHubButton?.addEventListener('click', async () => {
  try {
    updateStatus('', 'Backing up to GitHub...');
    backupToGitHubButton.disabled = true;

    // Step 1: Get workflow from n8n API (using API key)
    if (!metadata || !metadata.workflowId) {
      throw new Error('Cannot determine workflow ID');
    }

    const workflowData = await getWorkflowContent(
      metadata.instanceUrl,
      metadata.workflowId,
      metadata.apiKey
    );
    console.log(`[GitHub Backup] Fetched workflow: ${workflowData.name}`);

    // Step 2: Get GitHub config
    const { githubToken, githubRepo } = await chrome.storage.session.get(['githubToken', 'githubRepo']);

    if (!githubToken || !githubRepo) {
      throw new Error('GitHub not configured');
    }

    // Step 3: Show commit message modal
    const defaultMessage = `Backup workflow: ${workflowData.name}`;
    updateStatus('ready', 'Enter commit message');

    const commitMessage = await showCommitMessageModal(defaultMessage);

    if (commitMessage !== null) { // User didn't cancel
      // Step 4: Push to GitHub
      updateStatus('', 'Pushing to GitHub...');

      const result = await pushWorkflowToGitHub(
        githubToken,
        githubRepo,
        metadata.workflowId,
        workflowData,
        commitMessage
      );

      console.log('[GitHub Backup] Successfully pushed to GitHub:', result.content.html_url);

      // Step 5: Show success with link
      updateStatus('ready', 'Backed up to GitHub!');
      showNotification(
        `Workflow pushed to GitHub!\nView: ${result.content.html_url}`,
        'success'
      );
    } else {
      // User cancelled
      updateStatus('ready', 'Backup cancelled');
    }

  } catch (error) {
    console.error('[GitHub Backup] Error:', error);
    updateStatus('error', 'Backup failed');
    showNotification('GitHub backup failed: ' + error.message, 'error');
  } finally {
    backupToGitHubButton.disabled = false;
  }
});

// Restore from GitHub button - show commit selector
restoreFromGitHubButton?.addEventListener('click', async () => {
  await showCommitSelector();
});

// Backup to File button
backupToFileButton?.addEventListener('click', async () => {
  if (metadata && metadata.workflowId) {
    await backupWorkflowToFile(metadata.workflowId);
  }
});

// Restore from File button - trigger hidden file input
restoreFromFileButton?.addEventListener('click', () => {
  uploadFile.click(); // Trigger native file picker
});

// File upload handler - parse and restore workflow
// Reference: example/logic-app-manager-main/popup.js:505-546
uploadFile?.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return; // User cancelled

  try {
    updateStatus('', 'Restoring from file...');
    restoreFromFileButton.disabled = true;

    // Step 1: Read and parse file
    const content = await file.text(); // Modern async file reading
    const data = JSON.parse(content);  // Throws if invalid JSON

    console.log(`[Restore] Parsed workflow from file: ${data.name || 'Unknown'}`);

    // Step 2: Clean data (REQUIRED FOR N8N - not in Logic App Manager)
    const cleanedData = cleanWorkflowData(data);
    console.log('[Restore] Data cleaned - removed credentials and instance-specific fields');

    // Step 3: Get workflow metadata
    if (!metadata || !metadata.workflowId) {
      throw new Error('Cannot determine workflow ID. Are you on a workflow page?');
    }

    // Step 4: Call n8n API to restore workflow (using API key)
    const endpoint = `${metadata.instanceUrl}/api/v1/workflows/${metadata.workflowId}`;

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': metadata.apiKey
      },
      body: JSON.stringify(cleanedData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`n8n API error ${response.status}: ${errorData}`);
    }

    const result = await response.json();
    console.log('[Restore] Workflow updated successfully:', result);

    // Step 6: Show success with credentials warning
    updateStatus('ready', 'Restore completed!');
    showNotification(
      'Workflow restored! Refresh the page to see changes.\n\nIMPORTANT: Credentials must be reconfigured in n8n.',
      'success'
    );

  } catch (error) {
    console.error('[Restore] Error:', error);

    // Handle specific error types
    let errorMessage = error.message;
    if (error instanceof SyntaxError) {
      errorMessage = 'Invalid JSON file. Please upload a valid workflow backup.';
    }

    updateStatus('error', 'Restore failed');
    showNotification('Restore failed: ' + errorMessage, 'error');

  } finally {
    restoreFromFileButton.disabled = false;
    uploadFile.value = ''; // Clear input for re-use
  }
});

//=============================================================================
// STARTUP
//=============================================================================

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initialize);
