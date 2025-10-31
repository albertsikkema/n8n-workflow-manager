# Chrome Web Store Submission Guide

**Extension:** n8n Workflow Manager v1.0.0
**Status:** Ready for submission

---

## ✅ Pre-Submission Checklist

### Assets Ready
- ✅ Extension package: `n8n-workflow-manager-v1.0.0.zip` (42 KB)
- ✅ Promotional tile: `images/promotional-tile.png` (440×280, 46 KB)
- ✅ Extension icons: All sizes generated (16, 48, 128)
- ⏳ Screenshots: User has screenshots ready

### Documentation Ready
- ✅ Store listing content: `STORE_LISTING.md`
- ✅ Privacy policy: `PRIVACY_POLICY.md`
- ✅ README: `README.md`
- ✅ License: `LICENSE` (MIT)

### Code Quality
- ✅ Security audit: PASSED
- ✅ Tests: 96/96 passing
- ✅ Permissions: Minimized
- ✅ Manifest: Valid

---

## 📸 Screenshot Requirements

### Chrome Web Store Requirements
- **Format:** PNG or JPEG
- **Dimensions:** 1280×800 or 640×400 pixels (16:10 aspect ratio)
- **Minimum:** 1 screenshot
- **Maximum:** 5 screenshots
- **File size:** Each under 2 MB

### Recommended Screenshots (from STORE_LISTING.md)

**1. Main Popup Interface** (1280×800)
- Title: "Simple Backup & Restore Interface"
- Show: Extension popup with backup/restore buttons on active n8n workflow page
- Highlight: Purple active icon, workflow detected, action buttons

**2. GitHub Version History** (1280×800)
- Title: "Browse Version History"
- Show: Commit history modal with multiple versions
- Highlight: Timestamps, commit messages, restore button

**3. Configuration Options** (1280×800)
- Title: "Easy Configuration"
- Show: Options page with settings fields
- Highlight: n8n URL, API key (masked), GitHub settings

**4. In Action on n8n** (1280×800)
- Title: "Works with Any n8n Instance"
- Show: Extension working on actual n8n workflow editor
- Highlight: Workflow canvas, purple icon, success notification

**5. File Download** (Optional, 1280×800)
- Title: "Download Workflows Locally"
- Show: Download in progress or completed
- Highlight: JSON file download

### Screenshot Preparation Tips

1. **Clean Environment**
   - Use demo/test n8n instance
   - Clear browsing data
   - Hide personal information
   - Use generic workflow names

2. **Consistency**
   - Same browser zoom level (100%)
   - Consistent UI theme
   - Clear, readable text
   - High contrast

3. **Annotations** (Optional)
   - Add arrows or highlights
   - Use consistent color scheme
   - Don't clutter the image
   - Keep text minimal

4. **File Naming**
   ```
   screenshot-1-popup-interface.png
   screenshot-2-commit-history.png
   screenshot-3-options-page.png
   screenshot-4-in-action.png
   screenshot-5-file-download.png
   ```

---

## 📋 Chrome Web Store Submission Steps

### Step 1: Developer Account Setup

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Sign in with Google account
3. Pay $5 one-time developer registration fee
4. Accept developer agreement
5. Fill out developer profile

### Step 2: Create New Item

1. Click **"New Item"** button
2. Upload `n8n-workflow-manager-v1.0.0.zip`
3. Wait for upload and automatic checks to complete

### Step 3: Fill Store Listing

#### Product Details

**Extension name:**
```
n8n Workflow Manager
```

**Summary (132 characters max):**
```
Backup and restore n8n workflows with GitHub integration. Version control your automation workflows safely and efficiently.
```

**Category:**
```
Productivity
```

**Language:**
```
English
```

#### Detailed Description

Copy from `STORE_LISTING.md` (starts with "**Backup and restore your n8n workflows with confidence!**")

#### Privacy Practices

**Single Purpose Description:**
```
This extension helps n8n users backup and restore their automation workflows. It connects to user-configured n8n instances and GitHub repositories to provide version control for workflows.
```

**Permissions Justification:**

For each permission, use content from `PERMISSIONS.md`:

- **activeTab**: Access the currently active tab to detect n8n workflow pages
- **downloads**: Save workflow backups to the user's computer
- **tabs**: Monitor navigation to update extension icon and detect n8n pages
- **storage**: Store user configuration (n8n URL, API key, GitHub token) locally
- **https://*/***: n8n can be self-hosted on any domain; cannot predict user's n8n instance URL
- **https://api.github.com/***: GitHub API integration for backup and version history features

**Remote Code Hosting:**
```
No
```

**Data Usage:**
```
This extension does NOT collect, transmit, or sell user data.
All data stays local in the browser.
API calls go directly to user's n8n instance and GitHub.
```

#### Privacy Policy

**Privacy Policy URL:**
```
https://github.com/albertsikkema/n8n-workflow-manager/blob/main/PRIVACY_POLICY.md
```

#### Store Listing Assets

1. **Small promotional tile (440×280)**
   - Upload: `images/promotional-tile.png`

2. **Screenshots** (1-5 images)
   - Upload your screenshots in order
   - Add captions from STORE_LISTING.md

3. **Extension icon** (128×128)
   - Already included in ZIP, will be extracted automatically

#### Additional Information

**Official URL:**
```
https://github.com/albertsikkema/n8n-workflow-manager
```

**Homepage URL:**
```
https://github.com/albertsikkema/n8n-workflow-manager
```

**Support URL:**
```
https://github.com/albertsikkema/n8n-workflow-manager/issues
```

### Step 4: Distribution

**Visibility:**
```
☑ Public
```

**Regions:**
```
☑ All regions
```

**Pricing:**
```
☐ This is a paid extension (leave unchecked - it's free)
```

### Step 5: Submit for Review

1. Review all information
2. Click **"Submit for review"**
3. Wait for automated checks (5-10 minutes)
4. Manual review (typically 1-3 business days)

---

## 📧 What to Expect After Submission

### Automated Checks (Immediate)
- Manifest validation
- Malware scan
- Permission review
- Code analysis

### Manual Review (1-3 business days)
- Privacy policy review
- Permission justification check
- Description accuracy
- Functionality verification

### Possible Outcomes

**✅ Approved**
- Extension goes live immediately
- Users can install from Chrome Web Store

**⚠️ Requested Changes**
- You'll receive email with specific issues
- Make requested changes
- Resubmit for review

**❌ Rejected**
- Rare for well-prepared extensions
- Review rejection reason
- Fix issues and resubmit

---

## 🔧 Common Rejection Reasons (And How We're Prepared)

### 1. Broad Host Permissions
**Issue:** Extensions requesting `https://*/*` are scrutinized

**Our Response:** Documented in permissions justification:
- n8n can be self-hosted on ANY domain
- Cannot predict user's n8n instance URL
- Content script only activates on workflow pages
- Fully justified and necessary

### 2. Privacy Policy
**Status:** ✅ Comprehensive policy included
- Clear data handling explanation
- No data collection statement
- GitHub-hosted (permanent URL)

### 3. Permissions Justification
**Status:** ✅ All permissions documented
- Each permission explained
- Use cases provided
- Privacy protections described

### 4. Misleading Description
**Status:** ✅ Accurate descriptions
- States "unofficial" clearly
- No false claims
- Describes actual functionality

### 5. Code Quality
**Status:** ✅ High quality code
- 96 passing tests
- Security audit passed
- No obfuscation
- Well-documented

---

## 📞 Post-Approval Actions

### Once Approved

1. **Announce Release**
   - Post on GitHub
   - Update README with Chrome Web Store badge
   - Share on social media (if desired)

2. **Monitor Reviews**
   - Respond to user feedback
   - Address issues promptly
   - Update extension as needed

3. **Version Updates**
   - Use same process for updates
   - Update version in manifest.json
   - Describe changes in update notes

4. **GitHub Release**
   - Create matching GitHub release
   - Tag as v1.0.0
   - Include changelog

---

## 🎯 Final Checklist Before Submitting

- [ ] Developer account set up ($5 paid)
- [ ] Extension package uploaded (`n8n-workflow-manager-v1.0.0.zip`)
- [ ] Promotional tile uploaded (`images/promotional-tile.png`)
- [ ] All screenshots uploaded (1-5 images)
- [ ] Store listing filled out (name, description, category)
- [ ] Privacy policy URL added
- [ ] Permissions justified
- [ ] Support URLs added
- [ ] Distribution settings configured
- [ ] All information reviewed
- [ ] Submit button clicked

---

## 📚 Helpful Resources

**Chrome Web Store Documentation:**
- [Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
- [Publishing Guide](https://developer.chrome.com/docs/webstore/publish/)
- [Program Policies](https://developer.chrome.com/docs/webstore/program-policies/)
- [Review Guidelines](https://developer.chrome.com/docs/webstore/review-process/)

**Extension Details:**
- Package: `n8n-workflow-manager-v1.0.0.zip`
- Promotional tile: `images/promotional-tile.png`
- Listing content: `STORE_LISTING.md`
- Privacy policy: `PRIVACY_POLICY.md`
- Permissions doc: `PERMISSIONS.md`

---

**Good luck with your submission! 🚀**

The extension is well-prepared and should pass review smoothly.
