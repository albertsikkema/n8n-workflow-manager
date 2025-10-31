// Options page script - Configuration UI for n8n Workflow Manager
// Reference: example/logic-app-manager-main/options.js

//=============================================================================
// UI ELEMENT REFERENCES
//=============================================================================

const n8nInstanceUrlInput = document.getElementById('n8nInstanceUrl');
const n8nApiKeyInput = document.getElementById('n8nApiKey');
const githubTokenInput = document.getElementById('githubToken');
const githubRepoInput = document.getElementById('githubRepo');
const testN8nButton = document.getElementById('testN8nConnection');
const testGitHubButton = document.getElementById('testGitHubConnection');
const saveButton = document.getElementById('saveSettings');
const statusMessage = document.getElementById('statusMessage');

//=============================================================================
// UI HELPER FUNCTIONS
//=============================================================================

/**
 * Show status message with type-based styling
 * Reference: example/logic-app-manager-main/options.js:17-30
 *
 * @param {string} message - Status message to display
 * @param {string} type - Message type: 'success', 'error', 'info'
 */
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.style.display = 'block';

  // Auto-hide success messages after 5 seconds
  if (type === 'success') {
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 5000);
  }
}

/**
 * Validate repository format (owner/repo)
 * Reference: example/logic-app-manager-main/options.js:32-34
 *
 * @param {string} repo - Repository string to validate
 * @returns {boolean} True if format is valid
 */
function validateRepoFormat(repo) {
  return /^[\w-]+\/[\w-]+$/.test(repo);
}

//=============================================================================
// CONNECTION TESTING
//=============================================================================

/**
 * Test n8n API connection
 * Uses the n8n API key to test /api/v1/workflows endpoint
 *
 * @param {string} instanceUrl - n8n instance URL
 * @param {string} apiKey - n8n API key
 * @returns {Promise<Object>} API response with workflows list
 * @throws {Error} If connection fails with specific error message
 */
async function testN8nConnection(instanceUrl, apiKey) {
  const response = await fetch(`${instanceUrl}/api/v1/workflows`, {
    headers: {
      'Accept': 'application/json',
      'X-N8N-API-KEY': apiKey
    }
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid API key. Please check your n8n API key.');
    } else if (response.status === 404) {
      throw new Error('n8n instance not found. Check the URL.');
    } else {
      throw new Error(`n8n API error: ${response.status}`);
    }
  }

  return await response.json();
}

/**
 * Test GitHub API connection
 * Reference: example/logic-app-manager-main/options.js:63-86
 *
 * @param {string} token - GitHub personal access token
 * @param {string} repo - Repository in owner/repo format
 * @returns {Promise<Object>} Repository metadata
 * @throws {Error} If connection fails with specific error message
 */
async function testGitHubConnection(token, repo) {
  const [owner, repoName] = repo.split('/');
  const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Repository not found. Check the repository name or create it first.');
    } else if (response.status === 401) {
      throw new Error('Invalid token. Please check your Personal Access Token.');
    } else {
      throw new Error(`GitHub API error: ${response.status}`);
    }
  }

  return await response.json();
}

//=============================================================================
// EVENT HANDLERS
//=============================================================================

/**
 * Test n8n connection button handler
 */
testN8nButton.addEventListener('click', async () => {
  const instanceUrl = n8nInstanceUrlInput.value.trim();
  const apiKey = n8nApiKeyInput.value.trim();

  if (!instanceUrl || !apiKey) {
    showStatus('Please fill in both n8n instance URL and API key', 'error');
    return;
  }

  // Validate URL format
  try {
    new URL(instanceUrl);
  } catch (error) {
    showStatus('Invalid instance URL format. Use: https://n8n.example.com', 'error');
    return;
  }

  try {
    testN8nButton.disabled = true;
    showStatus('Testing n8n connection...', 'info');

    const result = await testN8nConnection(instanceUrl, apiKey);

    showStatus(
      `✓ n8n connection successful! Found ${result.data?.length || 0} workflows.`,
      'success'
    );
  } catch (error) {
    showStatus(`✗ ${error.message}`, 'error');
  } finally {
    testN8nButton.disabled = false;
  }
});

/**
 * Test GitHub connection button handler
 * Reference: example/logic-app-manager-main/options.js:106-127
 */
testGitHubButton.addEventListener('click', async () => {
  const token = githubTokenInput.value.trim();
  const repo = githubRepoInput.value.trim();

  if (!token || !repo) {
    showStatus('Please fill in GitHub token and repository', 'error');
    return;
  }

  if (!validateRepoFormat(repo)) {
    showStatus('Invalid repository format. Use: owner/repo', 'error');
    return;
  }

  try {
    testGitHubButton.disabled = true;
    showStatus('Testing GitHub connection...', 'info');

    const repoData = await testGitHubConnection(token, repo);

    showStatus(
      `✓ GitHub connection successful! Repository: ${repoData.full_name} (${repoData.private ? 'Private' : 'Public'})`,
      'success'
    );
  } catch (error) {
    showStatus(`✗ ${error.message}`, 'error');
  } finally {
    testGitHubButton.disabled = false;
  }
});

/**
 * Save settings button handler
 * Reference: example/logic-app-manager-main/options.js:129-134
 */
saveButton.addEventListener('click', async () => {
  const n8nInstanceUrl = n8nInstanceUrlInput.value.trim();
  const n8nApiKey = n8nApiKeyInput.value.trim();
  const githubToken = githubTokenInput.value.trim();
  const githubRepo = githubRepoInput.value.trim();

  // Validate required fields (n8n instance URL and API key)
  if (!n8nInstanceUrl || !n8nApiKey) {
    showStatus('Please fill in both n8n instance URL and API key (required)', 'error');
    return;
  }

  // Validate URL format
  try {
    new URL(n8nInstanceUrl);
  } catch (error) {
    showStatus('Invalid instance URL format. Use: https://n8n.example.com', 'error');
    return;
  }

  // Validate GitHub config if provided
  if ((githubToken && !githubRepo) || (!githubToken && githubRepo)) {
    showStatus('Please provide both GitHub token and repository, or leave both empty', 'error');
    return;
  }

  if (githubRepo && !validateRepoFormat(githubRepo)) {
    showStatus('Invalid repository format. Use: owner/repo', 'error');
    return;
  }

  try {
    saveButton.disabled = true;
    showStatus('Testing connections...', 'info');

    // Test n8n connection first
    await testN8nConnection(n8nInstanceUrl, n8nApiKey);

    // Test GitHub if configured
    if (githubToken && githubRepo) {
      await testGitHubConnection(githubToken, githubRepo);
    }

    // Save to chrome.storage.session
    const settings = {
      n8nInstanceUrl: n8nInstanceUrl,
      n8nApiKey: n8nApiKey
    };

    if (githubToken && githubRepo) {
      settings.githubToken = githubToken;
      settings.githubRepo = githubRepo;
    }

    await chrome.storage.session.set(settings);

    showStatus('✓ Settings saved successfully!', 'success');

  } catch (error) {
    showStatus(`✗ Error: ${error.message}`, 'error');
  } finally {
    saveButton.disabled = false;
  }
});

//=============================================================================
// INITIALIZATION
//=============================================================================

/**
 * Load saved settings on page load
 * Reference: example/logic-app-manager-main/options.js:1-15
 */
async function loadSettings() {
  const settings = await chrome.storage.session.get([
    'n8nInstanceUrl',
    'n8nApiKey',
    'githubToken',
    'githubRepo'
  ]);

  if (settings.n8nInstanceUrl) n8nInstanceUrlInput.value = settings.n8nInstanceUrl;
  if (settings.n8nApiKey) n8nApiKeyInput.value = settings.n8nApiKey;
  if (settings.githubToken) githubTokenInput.value = settings.githubToken;
  if (settings.githubRepo) githubRepoInput.value = settings.githubRepo;
}

// Load settings when page loads
loadSettings();
