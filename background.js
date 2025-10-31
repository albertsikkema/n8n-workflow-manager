// Background service worker - Icon management for n8n Workflow Manager
// This script runs as a Chrome extension service worker

/**
 * Check if URL is an n8n workflow page
 * @param {string} url - The URL to check
 * @returns {boolean} True if URL matches n8n workflow pattern
 */
function isN8nPage(url) {
  if (!url) return false;
  // Check for /workflow/ path pattern
  return url.includes('/workflow/');
}

/**
 * Update extension icon based on tab URL
 * Blue icon on n8n workflow pages, gray elsewhere
 * @param {number} tabId - Chrome tab ID
 * @param {string} url - Current tab URL
 */
async function updateIcon(tabId, url) {
  try {
    const isN8n = isN8nPage(url);
    const iconSuffix = isN8n ? '' : '-inactive';

    await chrome.action.setIcon({
      tabId: tabId,
      path: {
        '16': `icons/icon16${iconSuffix}.png`,
        '48': `icons/icon48${iconSuffix}.png`,
        '128': `icons/icon128${iconSuffix}.png`
      }
    });
  } catch (error) {
    console.error('Failed to update icon:', error);
  }
}

//=============================================================================
// EVENT LISTENERS
//=============================================================================

/**
 * Handle tab updates (page loads, URL changes)
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only update when URL changes or page completes loading
  if (changeInfo.url || changeInfo.status === 'complete') {
    updateIcon(tabId, tab.url);
  }
});

/**
 * Handle tab activation (user switches tabs)
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  updateIcon(activeInfo.tabId, tab.url);
});

/**
 * Handle extension installation/update
 */
chrome.runtime.onInstalled.addListener(() => {
  // Update icon for all existing tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id) {
        updateIcon(tab.id, tab.url);
      }
    });
  });
});

/**
 * Handle browser startup
 */
chrome.runtime.onStartup.addListener(() => {
  // Update icon for all tabs on browser startup
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id) {
        updateIcon(tab.id, tab.url);
      }
    });
  });
});
