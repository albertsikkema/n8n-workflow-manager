# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**n8n Workflow Manager** is a Chrome Manifest V3 extension for backing up and restoring n8n workflows with GitHub integration and hash-based sync detection. The project is currently in the **planning and documentation phase** - no n8n-specific extension code exists yet.

**Critical Context**: The repository contains a **complete, working reference implementation** - the Logic App Manager for Azure (in `example/logic-app-manager-main/`). This serves as the architectural template to adapt for n8n. Most development will involve adapting this proven implementation to work with the n8n API instead of Azure Management API.

## Core Architecture

### Three-Component Chrome Extension Pattern

The extension architecture is split into three isolated contexts that cannot share variables or functions:

1. **Background Service Worker** (`background.js`)
   - Monitors tab URLs to detect n8n instances
   - Updates extension icon dynamically (blue on n8n pages, gray elsewhere)
   - Listens to: `tabs.onUpdated`, `tabs.onActivated`, `runtime.onInstalled`, `runtime.onStartup`
   - No access to page DOM or popup UI

2. **Content Script** (`content.js`)
   - Injected into n8n instance pages (any domain running n8n)
   - Extracts workflow metadata from URL structure
   - **Key Difference from Logic App Manager**: n8n authentication
     - Logic App Manager: Scans `sessionStorage` for MSAL JWT tokens
     - n8n version: Will use API key from user configuration (stored in `chrome.storage.session`)
   - Responds to popup messages via `chrome.runtime.onMessage`
   - Cannot interact with popup directly

3. **Popup** (`popup.html`, `popup.js`, `styles.css`)
   - Main user interface (360px width, GitHub Primer styling)
   - Communicates with content script via `chrome.tabs.sendMessage`
   - Makes direct API calls to n8n and GitHub
   - No access to page context

**Communication Flow**:
```javascript
// Popup → Content Script
const response = await chrome.tabs.sendMessage(tabId, { action: 'getMetadata' });

// Content Script → Responds
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getMetadata') {
    sendResponse({ success: true, metadata: extractMetadata() });
  }
  return true; // Required for async response
});
```

### n8n Integration Specifics

**URL Structure Extraction**:
n8n workflow URLs follow the pattern: `https://{instance}/workflow/{workflowId}`
- Extract workflow ID from URL path
- Store n8n instance base URL for API calls
- Unlike Azure Portal's complex nested URL structure, n8n is simpler

**Authentication Approach**:
- Users configure n8n API key once in options page
- API key stored in `chrome.storage.session` (cleared on browser close)
- All API calls use header: `X-N8N-API-KEY: {apiKey}`
- No automatic token extraction like Azure MSAL tokens

**API Integration** (documented in `example/n8n_methods.md`):
- **List workflows**: `GET /api/v1/workflows`
- **Get workflow**: `GET /api/v1/workflows/{id}` (full content for backup)
- **Update workflow**: `PUT /api/v1/workflows/{id}` (for restore)
- Must clean instance-specific data before restore:
  - Remove: `credentials`, `webhookId`, `createdAt`, `updatedAt`
  - Keep: `nodes`, `connections`, `settings`, `staticData`, `pinData`

**Hash-Based Sync Detection**:
1. Extract core workflow content (exclude metadata like `id`, `name`, `active`, timestamps)
2. Normalize JSON with sorted keys (see `sortJSONKeys()` in n8n_methods.md)
3. Generate SHA-256 hash of normalized JSON
4. Compare n8n hash vs GitHub hash to determine sync status
5. Status values: `in_sync`, `out_of_sync`, `not_in_github`, `error`

**GitHub Storage Structure**:
```
workflows/
├── {workflowId-1}.json
├── {workflowId-2}.json
└── {workflowId-3}.json
```
- One file per workflow (flatter than Logic App Manager's nested structure)
- Filename = workflow ID + `.json` extension
- Pretty-printed JSON with 2-space indentation

## Development Workflow

### Initial Setup

```bash
# The project has no build process - work directly with files
cd /Users/albert/Documents/Dev_Prive/n8n-flow-manager

# When ready to start implementing:
# 1. Create extension files at project root or in src/
# 2. Adapt files from example/logic-app-manager-main/
# 3. Replace Azure API calls with n8n API calls
```

### Loading Extension for Development

```bash
# Open Chrome extension management
# chrome://extensions/

# Steps:
# 1. Enable "Developer mode" (toggle top-right)
# 2. Click "Load unpacked"
# 3. Select the directory containing manifest.json
# 4. Extension loads with appropriate icon
```

### Making Changes During Development

**Popup/Options Changes** (`popup.js`, `popup.html`, `options.js`, `options.html`):
- Close and reopen the popup to see changes
- No page refresh needed

**Content Script Changes** (`content.js`):
- Refresh the n8n page
- May need to reload extension if issues persist

**Background/Manifest Changes** (`background.js`, `manifest.json`):
- Go to `chrome://extensions/`
- Click reload button (circular arrow) on extension card
- Refresh any open n8n tabs

### Creating Release Package

```bash
# Adapt package.sh from Logic App Manager
./package.sh

# Output: n8n-workflow-manager-v{version}.zip
# Version read from manifest.json
# Excludes: .git/, thoughts/, claude/, package.sh
```

## Key Implementation Patterns

### Conditional UI Rendering

Show/hide GitHub features based on configuration:

```javascript
// From Logic App Manager popup.js (adapt for n8n)
const githubConfig = await chrome.storage.session.get(['githubRepo', 'githubToken']);
const githubConfigured = githubConfig.githubRepo && githubConfig.githubToken;

if (githubConfigured) {
  // Show GitHub backup/restore buttons
  githubSeparator.style.display = 'flex';
  backupToGitHubButton.style.display = 'flex';
  restoreFromGitHubButton.style.display = 'flex';
} else {
  // Hide GitHub UI, show only file-based operations
  githubSeparator.style.display = 'none';
  backupToGitHubButton.style.display = 'none';
  restoreFromGitHubButton.style.display = 'none';
}
```

### API Call Pattern (n8n Specific)

```javascript
// Backup workflow (GET operation)
async function backupWorkflow(workflowId) {
  const config = await chrome.storage.session.get(['n8nUrl', 'n8nApiKey']);
  const endpoint = `${config.n8nUrl}/api/v1/workflows/${workflowId}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'X-N8N-API-KEY': config.n8nApiKey
    }
  });

  if (!response.ok) {
    throw new Error(`n8n API error: ${response.status}`);
  }

  return await response.json();
}

// Restore workflow (PUT operation)
async function restoreWorkflow(workflowId, workflowData) {
  // Clean data first (remove credentials, webhookId, timestamps)
  const cleanedData = cleanWorkflowData(workflowData);

  const config = await chrome.storage.session.get(['n8nUrl', 'n8nApiKey']);
  const endpoint = `${config.n8nUrl}/api/v1/workflows/${workflowId}`;

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': config.n8nApiKey
    },
    body: JSON.stringify(cleanedData)
  });

  if (!response.ok) {
    throw new Error(`Failed to restore: ${response.status}`);
  }

  return await response.json();
}
```

### Data Cleaning Pattern

**Critical for n8n**: Remove instance-specific data before restore:

```javascript
function cleanWorkflowData(workflow) {
  // Create clean copy with only writable fields
  const cleaned = {
    name: workflow.name,
    nodes: cleanWorkflowNodes(workflow.nodes),
    connections: workflow.connections,
    settings: workflow.settings
  };

  // Add optional fields if present
  if (workflow.staticData) cleaned.staticData = workflow.staticData;
  if (workflow.pinData) cleaned.pinData = workflow.pinData;

  return cleaned;
}

function cleanWorkflowNodes(nodes) {
  return nodes.map(node => {
    const { credentials, webhookId, createdAt, updatedAt, ...cleanNode } = node;
    return cleanNode;
  });
}
```

### GitHub Integration Pattern

Uses GitHub Contents API with SHA tracking:

```javascript
// Get file SHA before update (required by GitHub)
async function getFileSHA(repo, path) {
  const response = await fetch(
    `https://api.github.com/repos/${repo}/contents/${path}`,
    {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }
  );

  if (response.status === 404) return null; // File doesn't exist
  const data = await response.json();
  return data.sha;
}

// Push workflow to GitHub
async function pushToGitHub(workflowId, workflow, commitMessage) {
  const path = `workflows/${workflowId}.json`;
  const sha = await getFileSHA(repo, path);

  const payload = {
    message: commitMessage || `Backup workflow: ${workflow.name}`,
    content: btoa(JSON.stringify(workflow, null, 2)), // Base64 encode
    branch: 'main'
  };

  if (sha) payload.sha = sha; // Required for updates

  await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
}
```

### Commit History Browser Pattern

```javascript
async function showCommitHistory(workflowId) {
  const path = `workflows/${workflowId}.json`;

  // Fetch commits for this specific file
  const response = await fetch(
    `https://api.github.com/repos/${repo}/commits?path=${path}`,
    { headers: { /* GitHub auth headers */ } }
  );

  const commits = await response.json();

  // Build modal UI
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <h3>Restore from Version</h3>
        <div class="commit-list">
          ${commits.map(commit => `
            <div class="commit-item" data-sha="${commit.sha}">
              <strong>${escapeHtml(commit.commit.message)}</strong>
              <span>${commit.commit.author.name}</span>
              <span>${new Date(commit.commit.author.date).toLocaleString()}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Event delegation for click handling
  modal.querySelectorAll('.commit-item').forEach(item => {
    item.addEventListener('click', async () => {
      const sha = item.dataset.sha;
      await restoreFromCommit(workflowId, sha);
      document.body.removeChild(modal);
    });
  });
}
```

### Hash Generation Pattern

For sync detection (see full algorithm in `example/n8n_methods.md`):

```javascript
function generateWorkflowHash(workflow) {
  // Extract only core content (exclude metadata)
  const coreContent = {
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings,
    staticData: workflow.staticData,
    pinData: workflow.pinData
  };

  // Normalize JSON (sort keys alphabetically)
  const normalized = sortJSONKeys(coreContent);
  const jsonString = JSON.stringify(normalized);

  // Generate SHA-256 hash
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(jsonString))
    .then(buffer => {
      return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    });
}

function sortJSONKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sortJSONKeys);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((sorted, key) => {
      sorted[key] = sortJSONKeys(obj[key]);
      return sorted;
    }, {});
  }
  return obj;
}
```

## File Structure

```
n8n-flow-manager/
├── CLAUDE.md                          # This file
├── .gitignore                         # Excludes claude/, thoughts/, build artifacts
├── example/
│   ├── logic-app-manager-main/        # COMPLETE REFERENCE IMPLEMENTATION
│   │   ├── manifest.json              # Manifest V3 config (adapt for n8n)
│   │   ├── popup.html                 # Main UI (reuse structure)
│   │   ├── popup.js                   # Core logic (550 lines - adapt API calls)
│   │   ├── options.html               # GitHub settings (reuse)
│   │   ├── options.js                 # Settings management (adapt)
│   │   ├── content.js                 # Token extraction (REWRITE for n8n)
│   │   ├── background.js              # Icon management (reuse)
│   │   ├── styles.css                 # GitHub Primer styling (reuse)
│   │   ├── icons/                     # Extension icons (reuse or rebrand)
│   │   ├── CLAUDE.md                  # Detailed implementation guide
│   │   └── README.md                  # User documentation template
│   └── n8n_methods.md                 # CRITICAL: n8n API integration guide
├── thoughts/                          # Planning documentation
│   ├── templates/                     # Project templates
│   └── shared/project/
│       ├── project.md                 # Vision, architecture, constraints
│       ├── todo.md                    # 65+ prioritized work items
│       └── done.md                    # Completion tracker
└── [Future: extension source files]   # Will be created at root or in src/
```

## Adapting Logic App Manager to n8n

### Files That Need Minimal Changes

**Reuse Almost As-Is**:
- `background.js` - Only change: URL pattern matching (n8n instances vs Azure Portal)
- `options.html` / `options.js` - Add n8n URL and API key fields, keep GitHub configuration
- `popup.html` - Keep structure, update branding text
- `styles.css` - Reuse entirely (maybe update color scheme)
- `icons/` - Reuse or rebrand

### Files That Need Major Rewrites

**Adapt API Calls**:
- `popup.js` (550 lines):
  - Lines 1-100: Initialization - adapt for n8n URL/API key instead of Azure token
  - Lines 122-203: GitHub functions - reuse entirely
  - Lines 219-307: Backup functions - replace Azure API calls with n8n API
  - Lines 309-463: Restore functions - replace Azure API, implement data cleaning
  - Lines 505-546: File restore - adapt for n8n API

**Complete Rewrite**:
- `content.js`:
  - Azure version: Extracts MSAL token from `sessionStorage`
  - n8n version: Extract workflow ID from URL, retrieve API key from storage
  - Simpler implementation (n8n URLs are cleaner than Azure Portal)

**New Implementation**:
- `manifest.json`:
  - Host permissions: Match any n8n instance (not just specific domains)
  - Pattern: `https://*/*` with content script filtering in code
  - Or require users to configure n8n URL in options

## Common Development Tasks

### Adding a New API Endpoint

```javascript
// In popup.js or separate api.js module
async function callN8nAPI(endpoint, method = 'GET', body = null) {
  const config = await chrome.storage.session.get(['n8nUrl', 'n8nApiKey']);

  const options = {
    method,
    headers: {
      'Accept': 'application/json',
      'X-N8N-API-KEY': config.n8nApiKey
    }
  };

  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${config.n8nUrl}${endpoint}`, options);

  if (!response.ok) {
    throw new Error(`n8n API error: ${response.status}`);
  }

  return await response.json();
}
```

### Detecting n8n Instances

```javascript
// In background.js
function isN8nPage(url) {
  // Option 1: Check for workflow path pattern
  if (url.includes('/workflow/')) return true;

  // Option 2: Check against configured n8n URL
  // (requires reading from storage - async)

  // Option 3: Generic pattern matching
  // Look for n8n-specific UI elements (would require content script)

  return false;
}
```

### Testing Workflows

Manual testing checklist (no automated tests exist):
1. Extension loads without console errors (check DevTools)
2. Icon appears blue on n8n pages, gray elsewhere
3. Popup displays correct workflow metadata
4. Backup downloads JSON file with correct format
5. Restore updates workflow in n8n (refresh page to verify)
6. GitHub settings validates token/repo before saving
7. Commit history modal displays and allows version selection
8. Both GitHub and file modes work independently
9. Sync status correctly shows in_sync/out_of_sync
10. Data cleaning removes credentials and webhookId

## Critical Implementation Notes

### Chrome Extension Limitations

- **Popup dimensions**: Max 800px width × 600px height
- **No inline scripts**: CSP restrictions require separate .js files
- **Storage types**:
  - `chrome.storage.session` - Cleared on browser close (use for tokens)
  - `chrome.storage.local` - Persistent (use for configuration)
  - `chrome.storage.sync` - Synced across devices (optional for settings)
- **Cross-context isolation**: Popup, content script, and background cannot share variables

### Security Considerations

- Never log API keys or tokens in console
- Store credentials only in `chrome.storage.session`
- Use HTTPS for all API calls
- Validate SSL certificates (don't skip)
- Escape HTML when displaying user content (commit messages, workflow names)
- Clean sensitive data before restore (credentials, webhook IDs)

### n8n-Specific Gotchas

1. **Workflow Credentials**: Cannot be exported/imported automatically
   - Users must reconfigure credentials after restore
   - Display warning in UI

2. **Webhook IDs**: Instance-specific, must be removed
   - n8n assigns new webhook IDs on restore

3. **Read-Only Fields**: n8n API rejects these in PUT requests
   - Remove: `createdAt`, `updatedAt`, `id` (in body)

4. **Hash Generation**: Must exclude metadata for accurate sync detection
   - Only hash: `nodes`, `connections`, `settings`, `staticData`, `pinData`
   - Exclude: `id`, `name`, `active`, `updatedAt`, `createdAt`, `isArchived`

### GitHub API Gotchas

1. **SHA Required**: Must get existing file SHA before update/delete
   - If missing: 409 Conflict error

2. **Content Encoding**: Files must be base64 encoded
   - Use `btoa()` for encoding, `atob()` for decoding

3. **Rate Limiting**: 5,000 requests/hour for authenticated users
   - Implement exponential backoff for 429 responses

4. **Commit Messages**: Should include workflow name and timestamp
   - Format: `Backup workflow: {name} ({timestamp})`

## Documentation Structure

- **User Documentation**: Create README.md (use Logic App Manager's as template)
- **Privacy Policy**: Create PRIVACY_POLICY.md (adapt from Logic App Manager)
- **Technical Docs**: Reference `example/n8n_methods.md` for API details
- **Planning Docs**: Use `thoughts/shared/project/` for ADRs, research, plans

## Project Status

**Current Phase**: Planning & Documentation (MVP not started)

**Reference Implementation**: Complete and working (Logic App Manager)

**Next Steps** (from `thoughts/shared/project/todo.md`):
1. Create manifest.json for n8n
2. Implement content script (extract workflow ID from URL)
3. Create popup interface (adapt from Logic App Manager)
4. Implement n8n API client wrapper
5. Add backup to file functionality
6. Implement workflow hash generation
7. Add restore from file functionality
8. Implement data cleaning for n8n workflows
9. Create options page (n8n URL + API key + GitHub config)
10. Implement GitHub API client
11. Add backup to GitHub
12. Add restore from GitHub
13. Add commit history browser

**Progress**: 0/13 MVP features complete

## Getting Help

- **n8n API Reference**: See `example/n8n_methods.md` (770+ lines of detailed documentation)
- **Implementation Reference**: See `example/logic-app-manager-main/CLAUDE.md`
- **Chrome Extension Docs**: Standard Manifest V3 patterns (no special libraries used)
- **GitHub API Docs**: REST API v2022-11-28
