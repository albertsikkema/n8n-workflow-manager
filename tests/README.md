# Unit Tests for n8n Workflow Manager

This directory contains unit tests for the most critical functions in the extension.

## Test Coverage

### n8nApi.test.js
Tests for data cleaning functions (security-critical):
- ✅ `cleanWorkflowNodes()` - Removes credentials, webhookId, timestamps from nodes
- ✅ `cleanWorkflowData()` - Creates clean workflow payload for restore operations
- ✅ Security tests ensuring ALL sensitive data is removed

### githubApi.test.js
Tests for encoding and XSS prevention (security-critical):
- ✅ `escapeHtml()` - Prevents XSS attacks in UI
- ✅ `base64Encode()` - Encodes workflow data for GitHub
- ✅ Security tests for various XSS attack vectors

### content.test.js
Tests for URL parsing and metadata extraction:
- ✅ `extractMetadata()` - Parses workflow ID from n8n URLs
- ✅ Instance URL extraction
- ✅ Edge cases and malformed URLs

## Running Tests

### Prerequisites

Install dependencies:
```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

This will generate a coverage report in `coverage/` directory.

## Test Statistics

- **Total Test Suites**: 3
- **Total Tests**: ~60+ test cases
- **Coverage Focus**: Security-critical functions (data cleaning, XSS prevention)

## Why These Functions?

### Data Cleaning (n8nApi.js)
**Critical for security**: Ensures credentials and instance-specific data are removed before:
- Restoring workflows (prevents credential conflicts)
- Backing up to GitHub (prevents credential leaks)

**What gets removed**:
- `credentials` - API keys, passwords, OAuth tokens
- `webhookId` - Instance-specific webhook identifiers
- `createdAt`, `updatedAt` - Read-only timestamp fields

### XSS Prevention (githubApi.js)
**Critical for security**: Prevents Cross-Site Scripting attacks when displaying:
- Workflow names in UI
- Commit messages in history modal
- Author names in commit list

**Attack vectors prevented**:
- Script tag injection: `<script>alert(1)</script>`
- Event handler injection: `<img src=x onerror=alert(1)>`
- HTML breaking: `"></div><script>...`

### URL Parsing (content.js)
**Critical for functionality**: Correctly identifies when user is on a workflow page:
- Extracts workflow ID from URL
- Extracts instance URL for API calls
- Handles various URL formats (localhost, cloud, custom domains)

## Test Philosophy

1. **Security First**: Most tests focus on security-critical functions
2. **Edge Cases**: Tests cover malformed inputs, empty values, null checks
3. **Real-World Scenarios**: Tests use realistic workflow data and URLs
4. **XSS Prevention**: Multiple tests ensure user-generated content is safely escaped

## Adding New Tests

When adding new critical functions, create tests that cover:

1. **Happy Path**: Normal, expected inputs
2. **Edge Cases**: Empty strings, null, undefined, malformed data
3. **Security**: XSS, injection, credential leakage
4. **Integration**: How functions work together

Example:
```javascript
describe('newFunction', () => {
  test('should handle normal input', () => {
    // Happy path
  });

  test('should handle empty input', () => {
    // Edge case
  });

  test('SECURITY: should prevent XSS', () => {
    // Security test
  });
});
```

## Continuous Testing

For development, run tests in watch mode:
```bash
npm run test:watch
```

This will re-run tests automatically when you modify code.

## Coverage Goals

Target coverage for security-critical functions:
- **Data Cleaning**: 100% (all branches)
- **XSS Prevention**: 100% (all attack vectors)
- **URL Parsing**: 95%+ (most edge cases)

Check coverage report:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```
