// GitHub API client - REST API wrapper for workflow backup/restore
// Reference: example/logic-app-manager-main/popup.js:122-384

//=============================================================================
// HELPER FUNCTIONS
//=============================================================================

/**
 * Base64 encode a string
 * Reference: example/logic-app-manager-main/popup.js:124-126
 *
 * @param {string} str - String to encode
 * @returns {string} Base64 encoded string
 */
function base64Encode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

/**
 * Escape HTML for safe display in UI
 * Reference: example/logic-app-manager-main/popup.js:386-391
 *
 * @param {string} text - Text to escape
 * @returns {string} HTML-escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

//=============================================================================
// FILE OPERATIONS
//=============================================================================

/**
 * Get SHA of existing file in GitHub repository
 * Required for updating files (GitHub's optimistic concurrency control)
 * Reference: example/logic-app-manager-main/popup.js:128-158
 *
 * @param {string} token - GitHub personal access token
 * @param {string} repo - Repository in owner/repo format
 * @param {string} path - File path within repository
 * @param {string} branch - Branch name (default: 'main')
 * @returns {Promise<string|null>} File SHA or null if file doesn't exist
 * @throws {Error} If API call fails (other than 404)
 */
async function getFileSHA(token, repo, path, branch = 'main') {
  const [owner, repoName] = repo.split('/');
  const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}?ref=${branch}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (response.status === 404) {
      return null; // File doesn't exist yet (not an error)
    }

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    return data.sha;
  } catch (error) {
    // Treat 404 as "file doesn't exist" (return null)
    if (error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

/**
 * Push workflow to GitHub repository
 * Creates new file or updates existing file
 * Reference: example/logic-app-manager-main/popup.js:160-203
 * Adapted for n8n: Flat file structure (workflows/{id}.json)
 *
 * @param {string} token - GitHub personal access token
 * @param {string} repo - Repository in owner/repo format
 * @param {string} workflowId - Workflow UUID
 * @param {Object} workflowData - Complete workflow data (not cleaned)
 * @param {string} commitMessage - Optional commit message
 * @returns {Promise<Object>} GitHub API response with file URL
 * @throws {Error} If push fails
 */
async function pushWorkflowToGitHub(token, repo, workflowId, workflowData, commitMessage) {
  const [owner, repoName] = repo.split('/');

  // Create path: workflows/{workflowId}.json (flat structure)
  const path = `workflows/${workflowId}.json`;

  // Get existing SHA (required for updates)
  const sha = await getFileSHA(token, repo, path);

  // Prepare request
  const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}`;
  const contentEncoded = base64Encode(JSON.stringify(workflowData, null, 2));

  const body = {
    message: commitMessage || `Backup workflow: ${workflowData.name} (${new Date().toISOString()})`,
    content: contentEncoded,
    branch: 'main'
  };

  // Include SHA if updating existing file
  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to push to GitHub');
  }

  return await response.json();
}

//=============================================================================
// COMMIT HISTORY
//=============================================================================

/**
 * List commits for specific workflow file
 * Reference: example/logic-app-manager-main/popup.js:309-333
 * Adapted for n8n: Flat file path (workflows/{id}.json)
 *
 * @param {string} token - GitHub personal access token
 * @param {string} repo - Repository in owner/repo format
 * @param {string} workflowId - Workflow UUID
 * @param {number} perPage - Number of commits to retrieve (default: 20)
 * @returns {Promise<Array>} Array of commit objects
 * @throws {Error} If API call fails
 */
async function listCommits(token, repo, workflowId, perPage = 20) {
  const [owner, repoName] = repo.split('/');
  const path = `workflows/${workflowId}.json`;
  const params = new URLSearchParams({
    path: path,
    per_page: perPage
  });

  const url = `https://api.github.com/repos/${owner}/${repoName}/commits?${params}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch commits: ${response.status}`);
  }

  return await response.json();
}

/**
 * Get workflow content from specific commit
 * Reference: example/logic-app-manager-main/popup.js:335-384
 * Simplified for n8n: Direct file access (no tree inspection needed)
 *
 * @param {string} token - GitHub personal access token
 * @param {string} repo - Repository in owner/repo format
 * @param {string} workflowId - Workflow UUID
 * @param {string} commitSha - Git commit SHA to retrieve
 * @returns {Promise<Object>} Workflow data from commit
 * @throws {Error} If file not found or API call fails
 */
async function getWorkflowFromCommit(token, repo, workflowId, commitSha) {
  const [owner, repoName] = repo.split('/');
  const path = `workflows/${workflowId}.json`;

  // Get file content from specific commit
  const fileUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}?ref=${commitSha}`;

  const response = await fetch(fileUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Workflow file not found in this commit');
    }
    throw new Error(`Failed to fetch file: ${response.status}`);
  }

  const fileData = await response.json();

  // Decode base64 content
  const content = atob(fileData.content.replace(/\s/g, ''));
  return JSON.parse(content);
}
