/**
 * n8n API Client Module
 * Provides wrapper functions for n8n REST API v1 operations
 *
 * Reference: example/n8n_methods.md:18-169
 */

/**
 * Fetch with timeout wrapper
 * Implements 30-second timeout for all API requests
 *
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds (default: 30000)
 * @returns {Promise<Response>} - Fetch response
 */
async function fetchWithTimeout(url, options = {}, timeout = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout after 30 seconds');
    }
    throw error;
  }
}

/**
 * Build standard n8n API request headers
 * Uses X-N8N-API-KEY header for authentication
 *
 * @param {string} apiKey - n8n API key
 * @param {boolean} includeContentType - Whether to include Content-Type header
 * @returns {Object} - Headers object
 */
function buildN8nHeaders(apiKey, includeContentType = false) {
  const headers = {
    'Accept': 'application/json',
    'X-N8N-API-KEY': apiKey
  };

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

/**
 * Centralized error handler for n8n API responses
 * Reference: example/n8n_methods.md:643-660
 *
 * @param {Response} response - HTTP response object (null for network errors)
 * @param {Error} error - Error object (null for HTTP errors)
 * @returns {Object} - { category, message, shouldRetry }
 */
function handleN8nError(response = null, error = null) {
  // Network errors (no response received)
  if (error && !response) {
    const errorMsg = error.message.toLowerCase();

    if (errorMsg.includes('timeout')) {
      return {
        category: 'network',
        message: 'Connection timeout - check n8n instance availability',
        shouldRetry: true
      };
    }

    if (errorMsg.includes('refused') || errorMsg.includes('no such host')) {
      return {
        category: 'network',
        message: 'Cannot connect to n8n instance - verify URL and network',
        shouldRetry: false
      };
    }

    return {
      category: 'network',
      message: `Network error: ${error.message}`,
      shouldRetry: true
    };
  }

  // HTTP status code errors
  if (response) {
    // Authentication errors
    if (response.status === 401) {
      return {
        category: 'auth',
        message: 'Invalid API key - update credentials in options',
        shouldRetry: false
      };
    }

    if (response.status === 403) {
      return {
        category: 'auth',
        message: 'Insufficient permissions - API key lacks required access',
        shouldRetry: false
      };
    }

    // Not found
    if (response.status === 404) {
      return {
        category: 'not_found',
        message: 'Resource not found',
        shouldRetry: false
      };
    }

    // Server errors
    if (response.status >= 500) {
      return {
        category: 'server',
        message: `n8n server error (${response.status}) - check instance health`,
        shouldRetry: true
      };
    }
  }

  return {
    category: 'unknown',
    message: 'Unknown error occurred',
    shouldRetry: false
  };
}

/**
 * Clean workflow nodes before backup/restore
 * Removes instance-specific fields per n8n_methods.md:371-408
 *
 * @param {Array} nodes - Workflow nodes array
 * @returns {Array} - Cleaned nodes array
 */
function cleanWorkflowNodes(nodes) {
  if (!Array.isArray(nodes)) {
    return nodes;
  }

  return nodes.map(node => {
    if (typeof node !== 'object' || node === null) {
      return node;
    }

    const cleanedNode = {};

    for (const [key, value] of Object.entries(node)) {
      switch (key) {
        case 'credentials':
          // REMOVE - instance-specific
          continue;
        case 'webhookId':
          // REMOVE - instance-specific
          continue;
        case 'createdAt':
        case 'updatedAt':
          // REMOVE - read-only fields
          continue;
        default:
          // Keep all other fields
          cleanedNode[key] = value;
      }
    }

    return cleanedNode;
  });
}

/**
 * Prepare workflow data for backup/restore
 * Creates payload with ONLY writable fields
 * Reference: example/n8n_methods.md:371-408
 *
 * @param {Object} workflow - Complete workflow object
 * @returns {Object} - Cleaned workflow data
 */
function cleanWorkflowData(workflow) {
  const cleanedNodes = cleanWorkflowNodes(workflow.nodes);

  const workflowData = {
    name: workflow.name,
    nodes: cleanedNodes,
    connections: workflow.connections,
    settings: workflow.settings
  };

  // Add optional fields only if they exist and are non-empty
  if (workflow.pinData && Object.keys(workflow.pinData).length > 0) {
    workflowData.pinData = workflow.pinData;
  }

  if (workflow.staticData && Object.keys(workflow.staticData).length > 0) {
    workflowData.staticData = workflow.staticData;
  }

  return workflowData;
}

/**
 * Fetch complete workflow definition from n8n
 * Uses X-N8N-API-KEY header for authentication
 *
 * @param {string} instanceUrl - n8n instance base URL (e.g., "https://n8n.example.com")
 * @param {string} workflowId - Workflow UUID
 * @param {string} apiKey - n8n API key
 * @returns {Promise<Object>} - Complete workflow content
 * @throws {Error} - On API errors
 */
async function getWorkflowContent(instanceUrl, workflowId, apiKey) {
  const endpoint = `${instanceUrl}/api/v1/workflows/${workflowId}`;

  try {
    const response = await fetchWithTimeout(endpoint, {
      method: 'GET',
      headers: buildN8nHeaders(apiKey)
    });

    // Specific error handling per n8n_methods.md:165-168
    if (response.status === 404) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication failed - please log in to n8n');
    }

    if (response.status >= 500) {
      throw new Error(`n8n server error: ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const workflow = await response.json();
    return workflow;
  } catch (error) {
    console.error(`[n8nApi] Failed to fetch workflow ${workflowId}:`, error);
    throw error;
  }
}
