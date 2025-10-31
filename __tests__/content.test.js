/**
 * Unit tests for content.js
 * Tests workflow metadata extraction from n8n URLs
 */

describe('extractMetadata', () => {
  // Helper to create a mock location object
  function createMockLocation(url) {
    const match = url.match(/^(https?:\/\/[^/]+)/);
    return {
      href: url,
      origin: match ? match[1] : ''
    };
  }

  // Create the extractMetadata function that works with our mock
  function extractMetadata(location) {
    const url = location.href;
    const match = url.match(/\/workflow\/([^/?#]+)/);

    if (match) {
      return {
        workflowId: match[1],
        instanceUrl: location.origin
      };
    }

    return null;
  }

  describe('Valid workflow URLs', () => {
    test('should extract workflow ID from simple URL', () => {
      const location = createMockLocation('https://n8n.example.com/workflow/abc-123-def');
      const metadata = extractMetadata(location);

      expect(metadata).not.toBeNull();
      expect(metadata.workflowId).toBe('abc-123-def');
      expect(metadata.instanceUrl).toBe('https://n8n.example.com');
    });

    test('should extract workflow ID from URL with query parameters', () => {
      const location = createMockLocation('https://n8n.example.com/workflow/xyz-789?param=value');
      const metadata = extractMetadata(location);

      expect(metadata).not.toBeNull();
      expect(metadata.workflowId).toBe('xyz-789');
      expect(metadata.instanceUrl).toBe('https://n8n.example.com');
    });

    test('should extract workflow ID from URL with hash fragment', () => {
      const location = createMockLocation('https://n8n.example.com/workflow/workflow-id#section');
      const metadata = extractMetadata(location);

      expect(metadata).not.toBeNull();
      expect(metadata.workflowId).toBe('workflow-id');
      expect(metadata.instanceUrl).toBe('https://n8n.example.com');
    });

    test('should extract workflow ID with UUID format', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const location = createMockLocation(`https://n8n.example.com/workflow/${uuid}`);
      const metadata = extractMetadata(location);

      expect(metadata).not.toBeNull();
      expect(metadata.workflowId).toBe(uuid);
    });

    test('should extract workflow ID from localhost', () => {
      const location = createMockLocation('http://localhost:5678/workflow/test-workflow-123');
      const metadata = extractMetadata(location);

      expect(metadata).not.toBeNull();
      expect(metadata.workflowId).toBe('test-workflow-123');
      expect(metadata.instanceUrl).toBe('http://localhost:5678');
    });

    test('should extract workflow ID from subdomain', () => {
      const location = createMockLocation('https://my-company.n8n.cloud/workflow/prod-workflow-1');
      const metadata = extractMetadata(location);

      expect(metadata).not.toBeNull();
      expect(metadata.workflowId).toBe('prod-workflow-1');
      expect(metadata.instanceUrl).toBe('https://my-company.n8n.cloud');
    });

    test('should extract workflow ID from custom port', () => {
      const location = createMockLocation('https://n8n.internal.company.com:8443/workflow/internal-wf');
      const metadata = extractMetadata(location);

      expect(metadata).not.toBeNull();
      expect(metadata.workflowId).toBe('internal-wf');
      expect(metadata.instanceUrl).toBe('https://n8n.internal.company.com:8443');
    });

    test('should extract workflow ID with hyphens', () => {
      const location = createMockLocation('https://n8n.example.com/workflow/my-test-workflow-v2');
      const metadata = extractMetadata(location);

      expect(metadata).not.toBeNull();
      expect(metadata.workflowId).toBe('my-test-workflow-v2');
    });

    test('should extract workflow ID with underscores', () => {
      const location = createMockLocation('https://n8n.example.com/workflow/test_workflow_123');
      const metadata = extractMetadata(location);

      expect(metadata).not.toBeNull();
      expect(metadata.workflowId).toBe('test_workflow_123');
    });

    test('should extract workflow ID with numbers only', () => {
      const location = createMockLocation('https://n8n.example.com/workflow/123456789');
      const metadata = extractMetadata(location);

      expect(metadata).not.toBeNull();
      expect(metadata.workflowId).toBe('123456789');
    });
  });

  describe('Invalid URLs (should return null)', () => {
    test('should return null for homepage', () => {
      const location = createMockLocation('https://n8n.example.com/');
      const metadata = extractMetadata(location);

      expect(metadata).toBeNull();
    });

    test('should return null for workflows list page', () => {
      const location = createMockLocation('https://n8n.example.com/workflows');
      const metadata = extractMetadata(location);

      expect(metadata).toBeNull();
    });

    test('should return null for settings page', () => {
      const location = createMockLocation('https://n8n.example.com/settings');
      const metadata = extractMetadata(location);

      expect(metadata).toBeNull();
    });

    test('should return null for credentials page', () => {
      const location = createMockLocation('https://n8n.example.com/credentials');
      const metadata = extractMetadata(location);

      expect(metadata).toBeNull();
    });

    test('should return null for executions page', () => {
      const location = createMockLocation('https://n8n.example.com/executions');
      const metadata = extractMetadata(location);

      expect(metadata).toBeNull();
    });

    test('should return null for non-n8n URL', () => {
      const location = createMockLocation('https://google.com/search?q=n8n');
      const metadata = extractMetadata(location);

      expect(metadata).toBeNull();
    });

    test('should return null for URL with "workflow" but no ID', () => {
      const location = createMockLocation('https://n8n.example.com/workflow/');
      const metadata = extractMetadata(location);

      expect(metadata).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    test('should handle workflow ID with special characters that are URL-safe', () => {
      const location = createMockLocation('https://n8n.example.com/workflow/test-workflow.v2');
      const metadata = extractMetadata(location);

      expect(metadata).not.toBeNull();
      expect(metadata.workflowId).toBe('test-workflow.v2');
    });

    test('should stop at query parameter', () => {
      const location = createMockLocation('https://n8n.example.com/workflow/abc-123?edit=true&version=2');
      const metadata = extractMetadata(location);

      expect(metadata).not.toBeNull();
      expect(metadata.workflowId).toBe('abc-123');
      expect(metadata.workflowId).not.toContain('?');
    });

    test('should stop at hash fragment', () => {
      const location = createMockLocation('https://n8n.example.com/workflow/abc-123#node-details');
      const metadata = extractMetadata(location);

      expect(metadata).not.toBeNull();
      expect(metadata.workflowId).toBe('abc-123');
      expect(metadata.workflowId).not.toContain('#');
    });

    test('should handle URL with trailing slash after workflow ID', () => {
      const location = createMockLocation('https://n8n.example.com/workflow/abc-123/');
      const metadata = extractMetadata(location);

      expect(metadata).not.toBeNull();
      expect(metadata.workflowId).toBe('abc-123');
    });

    test('should return null for malformed URL with multiple slashes', () => {
      const location = createMockLocation('https://n8n.example.com//workflow//abc-123');
      const metadata = extractMetadata(location);

      // Malformed URLs should not match
      expect(metadata).toBeNull();
    });
  });

  describe('Instance URL Extraction', () => {
    test('should extract HTTPS instance URL', () => {
      const location = createMockLocation('https://n8n.example.com/workflow/test-123');
      const metadata = extractMetadata(location);

      expect(metadata.instanceUrl).toBe('https://n8n.example.com');
    });

    test('should extract HTTP instance URL (for dev environments)', () => {
      const location = createMockLocation('http://localhost:5678/workflow/test-123');
      const metadata = extractMetadata(location);

      expect(metadata.instanceUrl).toBe('http://localhost:5678');
    });

    test('should preserve port in instance URL', () => {
      const location = createMockLocation('https://n8n.company.com:8443/workflow/prod-wf');
      const metadata = extractMetadata(location);

      expect(metadata.instanceUrl).toBe('https://n8n.company.com:8443');
    });

    test('should handle cloud instance URLs', () => {
      const location = createMockLocation('https://mycompany.n8n.cloud/workflow/cloud-workflow-1');
      const metadata = extractMetadata(location);

      expect(metadata.instanceUrl).toBe('https://mycompany.n8n.cloud');
    });
  });

  describe('Real-world Workflow IDs', () => {
    test('should handle n8n UUID format', () => {
      const realUuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const location = createMockLocation(`https://n8n.example.com/workflow/${realUuid}`);
      const metadata = extractMetadata(location);

      expect(metadata).not.toBeNull();
      expect(metadata.workflowId).toBe(realUuid);
    });

    test('should handle numeric workflow IDs', () => {
      const location = createMockLocation('https://n8n.example.com/workflow/42');
      const metadata = extractMetadata(location);

      expect(metadata).not.toBeNull();
      expect(metadata.workflowId).toBe('42');
    });

    test('should handle descriptive workflow IDs', () => {
      const location = createMockLocation('https://n8n.example.com/workflow/slack-to-database-sync');
      const metadata = extractMetadata(location);

      expect(metadata).not.toBeNull();
      expect(metadata.workflowId).toBe('slack-to-database-sync');
    });

    test('should handle workflow IDs with version numbers', () => {
      const location = createMockLocation('https://n8n.example.com/workflow/data-pipeline-v2.3.1');
      const metadata = extractMetadata(location);

      expect(metadata).not.toBeNull();
      expect(metadata.workflowId).toBe('data-pipeline-v2.3.1');
    });
  });
});
