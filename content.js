// Content script - Extracts workflow metadata from n8n pages
// This script runs in the context of n8n web pages
// Note: Cookie extraction is done by popup using chrome.cookies API

(function() {
  'use strict';

  /**
   * Extract workflow metadata from n8n URL
   * n8n workflow URLs follow pattern: https://{instance}/workflow/{workflowId}
   *
   * @returns {Object|null} Metadata object or null if not on workflow page
   */
  function extractMetadata() {
    const url = window.location.href;

    // Match workflow URL pattern
    // Pattern: /workflow/{workflowId}
    // Captures everything after /workflow/ until query params or hash
    const match = url.match(/\/workflow\/([^/?#]+)/);

    if (match) {
      return {
        workflowId: match[1],
        instanceUrl: new URL(url).origin  // e.g., "https://n8n.example.com"
      };
    }

    return null;
  }

  /**
   * Message handler - responds to popup requests for metadata
   * Popup communicates via chrome.tabs.sendMessage()
   */
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getMetadata') {
      const metadata = extractMetadata();
      sendResponse({
        success: !!metadata,
        metadata: metadata
      });
      return true;  // CRITICAL: Keep message channel open for async response
    }

    return false;
  });

})();
