# n8n Workflow Manager

A Chrome extension to backup and restore n8n workflows directly from your n8n instance using the n8n REST API.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

> **⚠️ IMPORTANT DISCLAIMER:** This is an independent, community-created extension. It is NOT affiliated with, endorsed by, sponsored by, or supported by n8n GmbH. n8n® and all related trademarks are the exclusive property of n8n GmbH. This is an unofficial third-party tool.

## Features

### Core Functionality
- ✅ **Backup to File** - Save workflows to JSON files with timestamped filenames
- ✅ **Restore from File** - Restore workflows from JSON files
- ✅ **Backup to GitHub** - Push workflow definitions directly to GitHub repositories
- ✅ **Restore from GitHub** - Browse commit history and restore from specific versions
- ✅ **Cross-Workflow Restore** - Restore from any workflow in your repository
- ✅ **Direct API Integration** - Uses n8n REST API and GitHub REST API
- ✅ **API Key Authentication** - Uses your configured n8n API key
- ✅ **Dynamic Icon** - Purple icon on n8n workflow pages, gray icon elsewhere
- ✅ **Localhost Support** - Works with local n8n instances (http://localhost:5678)
- ✅ **Simple UI** - Clean, GitHub-inspired interface
- ✅ **No Data Collection** - All operations are local

### GitHub Integration
- 📁 **Organized Storage** - Files saved as `workflows/{workflowId}.json`
- 📜 **Version History** - Browse and restore from commit history
- 🔒 **Secure Tokens** - API keys and GitHub tokens stored in `chrome.storage.session`
- 🔄 **Dual-Mode Operation** - GitHub and file-based options work independently
- 🔀 **Workflow Selector** - Choose which workflow to restore from when browsing GitHub commits

## Screenshot

![Extension Screenshot](screenshot.png)

## Installation

We are awaiting Chrome webstore admission, so until then install using one of these methods:

### Option 1: Install from Release (Recommended)

1. Go to the [Releases page](https://github.com/albertsikkema/n8n-workflow-manager/releases)
2. Download the latest `n8n-workflow-manager-v*.*.*.zip` file
3. Extract the ZIP file to a folder on your computer
4. Open Chrome and navigate to `chrome://extensions/`
5. Enable **Developer mode** (toggle in top-right corner)
6. Click **"Load unpacked"**
7. Select the extracted extension folder
8. The extension icon should appear in your toolbar

### Option 2: Install from Source

Clone this repository:
```bash
git clone https://github.com/albertsikkema/n8n-workflow-manager.git
cd n8n-workflow-manager
```

Then follow steps 4-8 from Option 1 above.

## Setup

### n8n Configuration (Required)

1. Click the extension icon (⚙️) and select **"Options"**
2. Enter your n8n instance URL (e.g., `https://n8n.example.com`)
3. Generate an n8n API key:
   - Go to your n8n instance Settings → API
   - Click **"Create API Key"**
   - Give it a descriptive name (e.g., "Chrome Extension")
   - Copy the key (it will only be shown once)
4. Paste the API key in the extension options
5. Click **"Test n8n Connection"** to verify
6. Click **"Save All Settings"**

**Note:** Credentials are stored in `chrome.storage.session` and cleared when you close your browser.

### GitHub Setup (Optional)

To enable GitHub integration for centralized backup and version control:

1. Click the extension icon and select **"Options"**
2. Enter your GitHub repository in the format: `owner/repo` (e.g., `myusername/n8n-backups`)
3. Generate a GitHub Personal Access Token:
   - Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
   - Click **"Generate new token (classic)"**
   - Give it a name (e.g., "n8n Workflow Manager")
   - Select the **`repo`** scope (required for private repositories)
   - Click **"Generate token"** and copy it
4. Paste the token in the extension options
5. Click **"Test GitHub Connection"** to verify
6. Click **"Save All Settings"**

Once configured, you'll see **"Backup to GitHub"** and **"Restore from GitHub"** buttons in the popup.

## Usage

> **📍 Important:** The extension only activates when you're viewing a workflow in n8n. The icon will turn **purple** when on a workflow page (URL contains `/workflow/`), and stay **gray** on other pages (like the settings or dashboard).

### Backup a Workflow

#### Option A: Backup to GitHub (Requires setup)
1. Navigate to a workflow in your n8n instance
2. Make sure you're on the workflow editor page (URL contains `/workflow/{workflowId}`)
3. Click the extension icon in your Chrome toolbar
4. Click **"Backup to GitHub"**
5. Enter a commit message (optional)
6. The workflow will be saved to: `workflows/{workflowId}.json`

#### Option B: Backup to File
1. Navigate to a workflow in your n8n instance
2. Make sure you're on the workflow editor page
3. Click the extension icon in your Chrome toolbar
4. Click **"Backup to File"**
5. Choose where to save the file
6. File will be saved as: `YYYYMMDD-HHmm-workflowname.json`

### Restore a Workflow

#### Option A: Restore from GitHub (Requires setup)
1. Navigate to the workflow you want to restore
2. Click the extension icon
3. Click **"Restore from GitHub"**
4. Select a workflow from the dropdown (defaults to current workflow)
5. Browse the commit history and select a version
6. Confirm the restore operation
7. The workflow will be updated immediately
8. Refresh the n8n page to see the changes

**Note:** You can restore from any workflow in your repository, not just the current one!

#### Option B: Restore from File
1. Navigate to the workflow you want to restore
2. Click the extension icon
3. Click **"Restore from File"**
4. Select your backup JSON file
5. Confirm the restore operation
6. The workflow will be updated immediately
7. Refresh the n8n page to see the changes

## How It Works

### n8n Integration
1. **Metadata Extraction**: Reads workflow ID from the n8n URL
2. **Authentication**: Uses your configured n8n API key
3. **Backup**: Makes a GET request to `{n8n-url}/api/v1/workflows/{id}`
4. **Restore**: Makes a PUT request to update the workflow definition
5. **Data Cleaning**: Removes instance-specific fields (credentials, webhookId, timestamps)

### GitHub Integration (Optional)
1. **Configuration**: Stores GitHub PAT and repository in `chrome.storage.session`
2. **Backup**: Creates/updates files at `workflows/{workflowId}.json` with commit messages
3. **Restore**: Fetches commit history, allows workflow and version selection, retrieves workflow JSON from specific commit
4. **Security**: All API calls made directly from browser, tokens never logged or transmitted elsewhere

## Requirements

- Chrome 88+ (Manifest V3 support)
- Active n8n instance (self-hosted or cloud)
- n8n API key with workflow read/write permissions
- (Optional) GitHub account with Personal Access Token for GitHub integration

## API Endpoints Used

### n8n REST API (v1)
- **GET** (Backup): `/api/v1/workflows/{id}` - Retrieve workflow definition
- **PUT** (Restore): `/api/v1/workflows/{id}` - Update workflow definition

### GitHub REST API
- **GET** `/repos/{owner}/{repo}` - Validate repository access
- **GET** `/repos/{owner}/{repo}/contents/workflows` - List all workflows
- **GET** `/repos/{owner}/{repo}/contents/{path}` - Get file SHA for updates
- **PUT** `/repos/{owner}/{repo}/contents/{path}` - Create/update workflow files
- **GET** `/repos/{owner}/{repo}/commits?path={path}` - List commit history

## Troubleshooting

### "Not on a workflow page"
- Make sure you're on the workflow editor page
- The URL should contain `/workflow/YOUR-WORKFLOW-ID`
- Try refreshing the page

### "No n8n API key configured"
- Go to Options and configure your n8n instance URL and API key
- Click "Test n8n Connection" to verify
- Make sure the API key has workflow permissions

### Backup/Restore fails with 401 Unauthorized
- Your API key is invalid or has expired
- Check the API key in the Options page
- Create a new API key in n8n if needed

### Backup/Restore fails with 403 Forbidden
- Your API key doesn't have permission to access this workflow
- Make sure the API key has appropriate permissions in n8n

### GitHub options not showing
- Make sure you've configured GitHub in the Options page
- Check that your token has the `repo` scope
- Verify the repository format is `owner/repo`

### GitHub backup/restore fails
- Verify your GitHub token hasn't expired
- Check that you have write access to the repository
- Ensure the repository exists and is accessible
- Check your internet connection
- Look at browser console (F12) for detailed error messages

### "Credentials must be reconfigured" warning after restore
- This is normal - n8n credentials are instance-specific
- You must manually reconfigure credentials in n8n after restore
- Credential IDs and webhook IDs are removed during restore

## Project Structure

```
n8n-workflow-manager/
├── manifest.json              # Extension configuration
├── background.js              # Service worker for icon state management
├── popup.html                 # Extension popup UI
├── popup.js                   # UI logic, n8n & GitHub API calls
├── options.html               # Configuration page
├── options.js                 # Settings management
├── content.js                 # Workflow metadata extraction
├── n8nApi.js                  # n8n REST API wrapper
├── githubApi.js               # GitHub REST API wrapper
├── styles.css                 # GitHub-inspired styling
├── icons/                     # Extension icons
│   ├── icon16.png             # 16x16 active icon
│   ├── icon48.png             # 48x48 active icon
│   ├── icon128.png            # 128x128 active icon
│   ├── icon16-inactive.png    # 16x16 inactive icon
│   ├── icon48-inactive.png    # 48x48 inactive icon
│   └── icon128-inactive.png   # 128x128 inactive icon
├── LICENSE                    # MIT License
├── PRIVACY_POLICY.md          # Privacy policy
├── README.md                  # This file
└── screenshot.png             # Extension screenshot
```

## Security & Privacy

- ✅ All operations are performed locally in your browser
- ✅ Uses your configured n8n API key (stored in session storage only)
- ✅ GitHub tokens stored securely in `chrome.storage.session` (cleared on browser close)
- ✅ No data sent to external servers (except n8n/GitHub APIs when you use those features)
- ✅ Tokens are only used for authorized API calls
- ✅ No analytics or tracking
- ✅ Open source - audit the code yourself
- ✅ Credentials automatically cleaned before restore

📄 Read our full [Privacy Policy](PRIVACY_POLICY.md)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Ideas for Contributions

- [ ] Batch backup multiple workflows
- [ ] Branch selection for GitHub operations (currently uses default branch)
- [ ] Dark mode
- [ ] Search/filter commit history
- [ ] Backup tagging and notes
- [ ] Keyboard shortcuts
- [ ] Workflow validation before restore
- [ ] Support for n8n credentials backup (separate from workflows)
- [ ] Diff view between current and backup version

## Development

```bash
# Clone the repository
git clone https://github.com/albertsikkema/n8n-workflow-manager.git
cd n8n-workflow-manager

# Install dependencies (for testing)
npm install

# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Load in Chrome for development
# 1. Go to chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select this folder

# Make your changes and reload the extension
```

### Testing

The extension includes comprehensive unit tests for security-critical functions:

- **Data Cleaning Tests**: Ensures credentials and sensitive data are removed before restore
- **XSS Prevention Tests**: Validates HTML escaping prevents script injection
- **URL Parsing Tests**: Verifies workflow metadata extraction from various URL formats

Run tests:
```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

See `__tests__/README.md` for detailed testing documentation.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Author

Created by [Albert Sikkema](https://albertsikkema.com)

## Acknowledgments

- Uses n8n REST API
- Inspired by the need for quick workflow version control
- Built with vanilla JavaScript (no frameworks)

## Support

If you find this extension helpful, please ⭐ star this repository!

**Using it personally?** Have fun! 🎉

**Getting paid to use it professionally?** Please consider supporting me:

<a href="https://www.buymeacoffee.com/albertsikkema" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Search [existing issues](https://github.com/albertsikkema/n8n-workflow-manager/issues)
3. Create a [new issue](https://github.com/albertsikkema/n8n-workflow-manager/issues/new) with details

---

## Legal Notice

**Not Affiliated with n8n:** This extension is an independent, community-created tool and is NOT officially affiliated with, endorsed by, sponsored by, or supported by n8n GmbH. This is an unofficial third-party extension.

**Trademarks:** n8n® and all n8n-related trademarks, service marks, logos, and trade names are the exclusive property of n8n GmbH. All rights reserved by n8n GmbH. This extension is not endorsed by or associated with n8n GmbH.

**GitHub Trademarks:** GitHub® and related trademarks are property of GitHub, Inc.

**Limitation of Liability:** THE AUTHOR AND CONTRIBUTORS ARE NOT RESPONSIBLE FOR ANY DAMAGE, DATA LOSS, PRODUCTION OUTAGES, OR THE END OF THE WORLD CAUSED BY USING THIS EXTENSION. YOU USE THIS SOFTWARE ENTIRELY AT YOUR OWN RISK. By installing and using this extension, you accept full responsibility for all consequences.

**No Warranty:** This software is provided "AS IS" without warranty of any kind, express or implied. Use at your own risk.
