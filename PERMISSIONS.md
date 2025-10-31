# Permission Justification

This document explains why n8n Workflow Manager requires each permission.

## Standard Permissions

### `activeTab`
**Why needed:** Access the currently active browser tab to detect if you're on an n8n workflow page.

**What it does:**
- Reads the URL of the current tab
- Enables communication with the content script
- Required for the extension icon to activate

**Privacy:** Only accesses the tab when you click the extension icon.

---

### `downloads`
**Why needed:** Save workflow backups to your computer.

**What it does:**
- Downloads JSON files containing your workflows
- Allows "Download to File" backup feature
- Saves files to your default downloads folder

**Privacy:** Only downloads files when you explicitly click "Download to File".

---

### `tabs`
**Why needed:** Detect when you navigate to n8n workflow pages and update the extension icon.

**What it does:**
- Monitors tab URL changes
- Updates extension icon (purple when on n8n workflow page, gray otherwise)
- Sends messages between popup and content script

**Privacy:** Only reads URLs to detect `/workflow/` pattern. Does not access page content.

---

### `storage`
**Why needed:** Remember your configuration (n8n URL, API key, GitHub token).

**What it does:**
- Stores n8n instance URL and API key
- Stores GitHub personal access token and repository
- Uses `chrome.storage.session` (cleared when browser closes)

**Privacy:** All data stored locally in your browser. API keys never leave your device except when you make API calls.

---

## Host Permissions

### `https://*/*`
**Why needed:** n8n can be self-hosted on ANY domain, and we cannot predict where your n8n instance runs.

**Examples of valid n8n URLs:**
- `https://n8n.yourcompany.com`
- `https://automation.example.org`
- `https://workflows.internal.company.net`
- `https://app.n8n.cloud`
- `https://localhost:5678` (local development)

**What it does:**
- Injects content script to detect workflow pages
- Content script ONLY activates on pages with `/workflow/` in URL
- Reads workflow ID from URL structure
- Does NOT access page content, forms, or user data

**Why we can't narrow it:**
- Users self-host n8n on custom domains
- No central registry of n8n instances
- Must work with any HTTPS domain

**Privacy protections:**
- Content script checks URL pattern before activating
- Extension icon stays gray on non-n8n pages
- No data collection from non-workflow pages
- No analytics or tracking

---

### `https://api.github.com/*`
**Why needed:** GitHub backup and version history features.

**What it does:**
- Lists workflows in your GitHub repository
- Pushes workflow backups to GitHub
- Retrieves commit history
- Restores workflows from specific versions

**Privacy:**
- Only accesses YOUR repositories (requires your personal access token)
- Your token is stored locally and sent only to GitHub API
- No third-party servers involved

---

## What This Extension Does NOT Do

❌ Does not track your browsing history
❌ Does not collect analytics
❌ Does not send data to third-party servers
❌ Does not access passwords or credentials
❌ Does not read cookies
❌ Does not inject ads
❌ Does not modify page content

## Data Flow

1. **You configure:** Enter n8n URL, API key, GitHub token in options
2. **Storage:** Credentials stored locally in `chrome.storage.session`
3. **API calls:** Extension makes direct calls to YOUR n8n instance and GitHub API
4. **No middleman:** All communication is direct (browser ↔ n8n / GitHub)

## Open Source

This extension is open source. You can review the code at:
https://github.com/albertsikkema/n8n-workflow-manager

The code shows exactly what permissions are used and how.

## Questions?

If you have concerns about permissions, please:
1. Review the source code (it's fully open)
2. Run the included unit tests
3. Open an issue on GitHub
4. Check browser DevTools Network tab to see all API calls

---

**Last updated:** 2025-10-31
**Extension version:** 1.0.0
