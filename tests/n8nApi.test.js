/**
 * Unit tests for n8nApi.js
 * Tests critical data cleaning functions that ensure security
 */

// Mock the global fetch function
global.fetch = jest.fn();

// Load the functions we're testing
const fs = require('fs');
const path = require('path');
const n8nApiCode = fs.readFileSync(path.join(__dirname, '../n8nApi.js'), 'utf8');
eval(n8nApiCode);

describe('cleanWorkflowNodes', () => {
  test('should remove credentials from nodes', () => {
    const nodes = [
      {
        id: 'node1',
        name: 'HTTP Request',
        credentials: { httpBasicAuth: 'credential-id-123' },
        parameters: { url: 'https://api.example.com' }
      }
    ];

    const cleaned = cleanWorkflowNodes(nodes);

    expect(cleaned[0].credentials).toBeUndefined();
    expect(cleaned[0].id).toBe('node1');
    expect(cleaned[0].parameters).toEqual({ url: 'https://api.example.com' });
  });

  test('should remove webhookId from nodes', () => {
    const nodes = [
      {
        id: 'webhook1',
        name: 'Webhook',
        webhookId: 'abc-123-def',
        parameters: { path: '/webhook' }
      }
    ];

    const cleaned = cleanWorkflowNodes(nodes);

    expect(cleaned[0].webhookId).toBeUndefined();
    expect(cleaned[0].id).toBe('webhook1');
    expect(cleaned[0].parameters).toEqual({ path: '/webhook' });
  });

  test('should remove createdAt and updatedAt timestamps', () => {
    const nodes = [
      {
        id: 'node1',
        name: 'Start',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-15T10:30:00Z',
        parameters: {}
      }
    ];

    const cleaned = cleanWorkflowNodes(nodes);

    expect(cleaned[0].createdAt).toBeUndefined();
    expect(cleaned[0].updatedAt).toBeUndefined();
    expect(cleaned[0].id).toBe('node1');
  });

  test('should keep all other node properties', () => {
    const nodes = [
      {
        id: 'node1',
        name: 'HTTP Request',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 1,
        position: [250, 300],
        parameters: { url: 'https://example.com' },
        credentials: { api: 'cred-1' },
        webhookId: 'webhook-1',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-02'
      }
    ];

    const cleaned = cleanWorkflowNodes(nodes);

    expect(cleaned[0]).toEqual({
      id: 'node1',
      name: 'HTTP Request',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 1,
      position: [250, 300],
      parameters: { url: 'https://example.com' }
    });
  });

  test('should handle empty array', () => {
    const nodes = [];
    const cleaned = cleanWorkflowNodes(nodes);
    expect(cleaned).toEqual([]);
  });

  test('should handle non-array input gracefully', () => {
    const cleaned = cleanWorkflowNodes(null);
    expect(cleaned).toBeNull();
  });

  test('should handle multiple nodes with mixed sensitive data', () => {
    const nodes = [
      {
        id: 'node1',
        credentials: { api: 'cred-1' },
        parameters: { foo: 'bar' }
      },
      {
        id: 'node2',
        webhookId: 'webhook-1',
        parameters: { baz: 'qux' }
      },
      {
        id: 'node3',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-02',
        parameters: {}
      }
    ];

    const cleaned = cleanWorkflowNodes(nodes);

    expect(cleaned).toHaveLength(3);
    expect(cleaned[0].credentials).toBeUndefined();
    expect(cleaned[1].webhookId).toBeUndefined();
    expect(cleaned[2].createdAt).toBeUndefined();
    expect(cleaned[2].updatedAt).toBeUndefined();
  });
});

describe('cleanWorkflowData', () => {
  test('should create workflow with only required fields', () => {
    const workflow = {
      id: 'workflow-123',
      name: 'My Workflow',
      active: true,
      nodes: [
        {
          id: 'node1',
          name: 'Start',
          credentials: { api: 'cred-1' }
        }
      ],
      connections: {
        Start: {
          main: [[{ node: 'HTTP Request', type: 'main', index: 0 }]]
        }
      },
      settings: {
        executionOrder: 'v1'
      },
      createdAt: '2025-01-01',
      updatedAt: '2025-01-15'
    };

    const cleaned = cleanWorkflowData(workflow);

    expect(cleaned.id).toBeUndefined();
    expect(cleaned.active).toBeUndefined();
    expect(cleaned.createdAt).toBeUndefined();
    expect(cleaned.updatedAt).toBeUndefined();
    expect(cleaned.name).toBe('My Workflow');
    expect(cleaned.connections).toEqual(workflow.connections);
    expect(cleaned.settings).toEqual(workflow.settings);
  });

  test('should clean credentials from nodes', () => {
    const workflow = {
      name: 'Test Workflow',
      nodes: [
        {
          id: 'node1',
          credentials: { httpBasicAuth: 'cred-123' },
          parameters: { url: 'https://example.com' }
        }
      ],
      connections: {},
      settings: {}
    };

    const cleaned = cleanWorkflowData(workflow);

    expect(cleaned.nodes[0].credentials).toBeUndefined();
    expect(cleaned.nodes[0].parameters).toEqual({ url: 'https://example.com' });
  });

  test('should include pinData if present and non-empty', () => {
    const workflow = {
      name: 'Test Workflow',
      nodes: [],
      connections: {},
      settings: {},
      pinData: {
        'HTTP Request': [
          {
            json: { data: 'test' }
          }
        ]
      }
    };

    const cleaned = cleanWorkflowData(workflow);

    expect(cleaned.pinData).toEqual(workflow.pinData);
  });

  test('should NOT include pinData if empty', () => {
    const workflow = {
      name: 'Test Workflow',
      nodes: [],
      connections: {},
      settings: {},
      pinData: {}
    };

    const cleaned = cleanWorkflowData(workflow);

    expect(cleaned.pinData).toBeUndefined();
  });

  test('should include staticData if present and non-empty', () => {
    const workflow = {
      name: 'Test Workflow',
      nodes: [],
      connections: {},
      settings: {},
      staticData: {
        global: { counter: 5 }
      }
    };

    const cleaned = cleanWorkflowData(workflow);

    expect(cleaned.staticData).toEqual(workflow.staticData);
  });

  test('should NOT include staticData if empty', () => {
    const workflow = {
      name: 'Test Workflow',
      nodes: [],
      connections: {},
      settings: {},
      staticData: {}
    };

    const cleaned = cleanWorkflowData(workflow);

    expect(cleaned.staticData).toBeUndefined();
  });

  test('should handle workflow with all optional fields', () => {
    const workflow = {
      name: 'Complete Workflow',
      nodes: [{ id: 'node1', parameters: {} }],
      connections: {},
      settings: {},
      pinData: { node1: [{ json: { test: 'data' } }] },
      staticData: { global: { value: 123 } }
    };

    const cleaned = cleanWorkflowData(workflow);

    expect(cleaned).toHaveProperty('name');
    expect(cleaned).toHaveProperty('nodes');
    expect(cleaned).toHaveProperty('connections');
    expect(cleaned).toHaveProperty('settings');
    expect(cleaned).toHaveProperty('pinData');
    expect(cleaned).toHaveProperty('staticData');
    expect(Object.keys(cleaned)).toHaveLength(6);
  });

  test('should handle workflow with minimum fields', () => {
    const workflow = {
      name: 'Minimal Workflow',
      nodes: [],
      connections: {},
      settings: {}
    };

    const cleaned = cleanWorkflowData(workflow);

    expect(cleaned).toHaveProperty('name');
    expect(cleaned).toHaveProperty('nodes');
    expect(cleaned).toHaveProperty('connections');
    expect(cleaned).toHaveProperty('settings');
    expect(cleaned).not.toHaveProperty('pinData');
    expect(cleaned).not.toHaveProperty('staticData');
    expect(Object.keys(cleaned)).toHaveLength(4);
  });
});

describe('Security: Data Cleaning', () => {
  test('CRITICAL: must remove ALL credential references', () => {
    const workflow = {
      name: 'Secure Workflow',
      nodes: [
        {
          id: 'http1',
          credentials: { httpBasicAuth: 'secret-123' },
          parameters: {}
        },
        {
          id: 'db1',
          credentials: { postgres: 'db-cred-456' },
          parameters: {}
        },
        {
          id: 'api1',
          credentials: { oAuth2Api: 'oauth-789' },
          parameters: {}
        }
      ],
      connections: {},
      settings: {}
    };

    const cleaned = cleanWorkflowData(workflow);

    // Verify NO credentials in ANY node
    cleaned.nodes.forEach(node => {
      expect(node.credentials).toBeUndefined();
    });
  });

  test('CRITICAL: must remove ALL webhookId references', () => {
    const workflow = {
      name: 'Webhook Workflow',
      nodes: [
        {
          id: 'webhook1',
          webhookId: 'webhook-abc-123',
          parameters: {}
        },
        {
          id: 'webhook2',
          webhookId: 'webhook-def-456',
          parameters: {}
        }
      ],
      connections: {},
      settings: {}
    };

    const cleaned = cleanWorkflowData(workflow);

    // Verify NO webhookId in ANY node
    cleaned.nodes.forEach(node => {
      expect(node.webhookId).toBeUndefined();
    });
  });

  test('CRITICAL: must remove ALL timestamp fields', () => {
    const workflow = {
      name: 'Timestamp Test',
      nodes: [
        {
          id: 'node1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-15T10:30:00Z',
          parameters: {}
        }
      ],
      connections: {},
      settings: {}
    };

    const cleaned = cleanWorkflowData(workflow);

    // Verify NO timestamps in ANY node
    cleaned.nodes.forEach(node => {
      expect(node.createdAt).toBeUndefined();
      expect(node.updatedAt).toBeUndefined();
    });
  });
});

//=============================================================================
// API CALL TESTS WITH MOCKING
//=============================================================================

describe('n8n API: buildN8nHeaders', () => {
  test('should build headers without content-type by default', () => {
    const headers = buildN8nHeaders('test-api-key');

    expect(headers).toEqual({
      'Accept': 'application/json',
      'X-N8N-API-KEY': 'test-api-key'
    });
  });

  test('should build headers with content-type when requested', () => {
    const headers = buildN8nHeaders('test-api-key', true);

    expect(headers).toEqual({
      'Accept': 'application/json',
      'X-N8N-API-KEY': 'test-api-key',
      'Content-Type': 'application/json'
    });
  });
});

describe('n8n API: handleN8nError', () => {
  test('should handle timeout errors', () => {
    const error = new Error('Request timeout after 30 seconds');
    const result = handleN8nError(null, error);

    expect(result.category).toBe('network');
    expect(result.message).toContain('timeout');
    expect(result.shouldRetry).toBe(true);
  });

  test('should handle connection refused errors', () => {
    const error = new Error('Connection refused');
    const result = handleN8nError(null, error);

    expect(result.category).toBe('network');
    expect(result.message).toContain('Cannot connect');
    expect(result.shouldRetry).toBe(false);
  });

  test('should handle 401 authentication errors', () => {
    const response = { status: 401 };
    const result = handleN8nError(response, null);

    expect(result.category).toBe('auth');
    expect(result.message).toContain('Invalid API key');
    expect(result.shouldRetry).toBe(false);
  });

  test('should handle 403 permission errors', () => {
    const response = { status: 403 };
    const result = handleN8nError(response, null);

    expect(result.category).toBe('auth');
    expect(result.message).toContain('Insufficient permissions');
    expect(result.shouldRetry).toBe(false);
  });

  test('should handle 404 not found errors', () => {
    const response = { status: 404 };
    const result = handleN8nError(response, null);

    expect(result.category).toBe('not_found');
  });
});

describe('n8n API: fetchWithTimeout', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully fetch within timeout', async () => {
    const mockResponse = { ok: true, json: async () => ({ data: 'test' }) };
    global.fetch.mockResolvedValueOnce(mockResponse);

    const response = await fetchWithTimeout('https://test.com/api', {}, 5000);

    expect(response).toBe(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://test.com/api',
      expect.objectContaining({
        signal: expect.any(AbortSignal)
      })
    );
  });

  test('should handle abort signal properly', async () => {
    const mockResponse = { ok: true, json: async () => ({ data: 'test' }) };
    global.fetch.mockResolvedValueOnce(mockResponse);

    const response = await fetchWithTimeout('https://test.com/api', {}, 30000);

    expect(response).toBe(mockResponse);

    // Verify abort signal was passed
    const callArgs = global.fetch.mock.calls[0];
    expect(callArgs[1]).toHaveProperty('signal');
    expect(callArgs[1].signal).toBeInstanceOf(AbortSignal);
  });

  test('should pass through network errors', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchWithTimeout('https://test.com/api', {}, 5000)).rejects.toThrow('Network error');
  });

  test('should handle abort errors as timeout', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    global.fetch.mockRejectedValueOnce(abortError);

    await expect(fetchWithTimeout('https://test.com/api', {}, 5000)).rejects.toThrow('Request timeout after 30 seconds');
  });
});

describe('n8n API: getWorkflowContent', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.error.mockRestore();
  });

  test('should successfully fetch workflow content', async () => {
    const mockWorkflow = {
      id: 'workflow-123',
      name: 'Test Workflow',
      nodes: [],
      connections: {},
      settings: {}
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockWorkflow
    });

    const result = await getWorkflowContent('https://n8n.example.com', 'workflow-123', 'test-api-key');

    expect(result).toEqual(mockWorkflow);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://n8n.example.com/api/v1/workflows/workflow-123',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'X-N8N-API-KEY': 'test-api-key'
        })
      })
    );
  });

  test('should throw error for 404 not found', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    await expect(
      getWorkflowContent('https://n8n.example.com', 'nonexistent', 'test-api-key')
    ).rejects.toThrow('Workflow not found: nonexistent');
  });

  test('should throw error for 401 authentication failure', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    });

    await expect(
      getWorkflowContent('https://n8n.example.com', 'workflow-123', 'bad-key')
    ).rejects.toThrow('Authentication failed');
  });

  test('should throw error for 403 permission denied', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden'
    });

    await expect(
      getWorkflowContent('https://n8n.example.com', 'workflow-123', 'test-api-key')
    ).rejects.toThrow('Authentication failed');
  });

  test('should throw error for 500 server error', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    await expect(
      getWorkflowContent('https://n8n.example.com', 'workflow-123', 'test-api-key')
    ).rejects.toThrow('n8n server error: 500');
  });

  test('should throw generic error for other status codes', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests'
    });

    await expect(
      getWorkflowContent('https://n8n.example.com', 'workflow-123', 'test-api-key')
    ).rejects.toThrow('API error: 429 Too Many Requests');
  });

  test('should log errors to console', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    try {
      await getWorkflowContent('https://n8n.example.com', 'workflow-123', 'test-api-key');
    } catch (error) {
      // Expected
    }

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[n8nApi]'),
      expect.any(Error)
    );
  });
});
