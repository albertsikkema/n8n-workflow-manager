/**
 * Hash Utilities for Workflow Sync Detection
 * Reference: example/n8n_methods.md:192-253
 */

/**
 * Extract core workflow content for hash calculation
 * Includes only fields that represent workflow logic
 *
 * @param {Object} workflow - Complete workflow object
 * @returns {Object} - Core content only
 */
function extractCoreContent(workflow) {
  const core = {
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: workflow.settings
  };

  // Include optional fields only if present
  if (workflow.staticData !== undefined) {
    core.staticData = workflow.staticData;
  }
  if (workflow.pinData !== undefined) {
    core.pinData = workflow.pinData;
  }

  return core;
}

/**
 * Recursively sort object keys alphabetically for JSON normalization
 * Reference: example/n8n_methods.md:207-229
 *
 * @param {any} obj - Object/array/primitive to normalize
 * @returns {any} - Normalized copy with sorted keys
 */
function sortJSONKeys(obj) {
  // Arrays: maintain order, recursively sort elements
  if (Array.isArray(obj)) {
    return obj.map(item => sortJSONKeys(item));
  }

  // Objects: sort keys alphabetically, recurse on values
  if (obj !== null && typeof obj === 'object') {
    const sortedKeys = Object.keys(obj).sort();
    const result = {};

    for (const key of sortedKeys) {
      result[key] = sortJSONKeys(obj[key]);
    }

    return result;
  }

  // Primitives: return unchanged
  return obj;
}

/**
 * Generate SHA-256 hash of workflow core content
 * Reference: example/n8n_methods.md:234-249
 *
 * @param {Object} workflow - Complete n8n workflow object
 * @returns {Promise<string>} - 64-character hex hash
 */
async function generateWorkflowHash(workflow) {
  try {
    // Step 1: Extract only hashable fields
    const coreContent = extractCoreContent(workflow);

    // Step 2: Normalize JSON (sort all keys alphabetically)
    const normalized = sortJSONKeys(coreContent);

    // Step 3: Serialize to compact JSON string
    const jsonString = JSON.stringify(normalized);

    // Step 4: Convert to byte array
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonString);

    // Step 5: Generate SHA-256 hash (Web Crypto API)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Step 6: Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');

    return hashHex;
  } catch (error) {
    console.error('[hashUtils] Failed to generate workflow hash:', error);
    throw new Error(`Failed to generate workflow hash: ${error.message}`);
  }
}
