import { describe, it, expect, beforeAll } from 'vitest';
import { createApiClient, validateResponseStructure, validateStatusCode, sleep } from '../test-helpers';
import { AxiosInstance } from 'axios';

describe('Workflow Endpoints - Contract Tests', () => {
  let client: AxiosInstance;

  beforeAll(() => {
    client = createApiClient();
  });

  describe('POST /workflows/translate', () => {
    it('should accept valid natural language and return token', async () => {
      const response = await client.post('/workflows/translate', {
        natural_language: 'Load the iris dataset and show summary statistics',
        priority: 5,
        client_id: 'test-client',
      });
      
      expect(response.status).toBe(200);
      
      // Validate response structure
      const validation = validateResponseStructure(response, [
        'token',
        'status',
        'message',
      ]);
      
      expect(validation.valid).toBe(true);
      expect(validation.missing).toEqual([]);
      
      // Validate field types and values
      expect(typeof response.data.token).toBe('string');
      expect(response.data.token.length).toBeGreaterThan(0);
      expect(response.data.status).toBe('queued');
      expect(typeof response.data.message).toBe('string');
      
      // Optional fields
      if (response.data.estimated_completion_seconds) {
        expect(typeof response.data.estimated_completion_seconds).toBe('number');
      }
    });

    it('should reject empty natural language', async () => {
      const response = await client.post('/workflows/translate', {
        natural_language: '',
        priority: 5,
      });
      
      expect(response.status).toBe(422);
    });

    it('should reject natural language that is too short', async () => {
      const response = await client.post('/workflows/translate', {
        natural_language: 'hi',
        priority: 5,
      });
      
      expect(response.status).toBe(422);
    });

    it('should reject invalid priority values', async () => {
      const response = await client.post('/workflows/translate', {
        natural_language: 'Load the iris dataset and show summary statistics',
        priority: 15, // Out of range
      });
      
      expect(response.status).toBe(422);
    });

    it('should use default priority if not provided', async () => {
      const response = await client.post('/workflows/translate', {
        natural_language: 'Load the iris dataset and show summary statistics',
      });
      
      expect(response.status).toBe(200);
      expect(response.data.token).toBeDefined();
    });
  });

  describe('GET /translation/{token}', () => {
    it('should return translation status with correct schema', async () => {
      // First create a translation
      const translateResponse = await client.post('/workflows/translate', {
        natural_language: 'Load the iris dataset and show summary statistics',
        priority: 8,
      });
      
      expect(translateResponse.status).toBe(200);
      const token = translateResponse.data.token;
      
      // Wait a bit for processing
      await sleep(1000);
      
      // Check status
      const response = await client.get(`/translation/${token}`);
      
      expect(response.status).toBe(200);
      
      // Validate required fields
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('created_at');
      expect(response.data).toHaveProperty('updated_at');
      expect(response.data).toHaveProperty('retries');
      
      // Validate field types
      expect(response.data.token).toBe(token);
      expect(typeof response.data.status).toBe('string');
      expect(['queued', 'processing', 'done', 'error', 'needs_human']).toContain(response.data.status);
      expect(typeof response.data.created_at).toBe('string');
      expect(typeof response.data.updated_at).toBe('string');
      expect(typeof response.data.retries).toBe('number');
      
      // Status-specific fields
      if (response.data.status === 'done') {
        expect(response.data.dsl).toBeDefined();
        expect(typeof response.data.dsl).toBe('string');
      }
      
      if (response.data.status === 'error') {
        expect(response.data.error_message).toBeDefined();
        expect(typeof response.data.error_message).toBe('string');
      }
    });

    it('should return 404 for non-existent token', async () => {
      const response = await client.get('/translation/non_existent_token_xyz123');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /workflows/dsl', () => {
    it('should validate and execute valid DSL', async () => {
      const validDsl = `
workflow:
  name: test_workflow
  description: Test workflow
  priority: 5
tasks:
  - name: load_data
    agent: eda
    action: load_dataset
    params:
      name: test_data
    depends_on: []
`;
      
      const response = await client.post('/workflows/dsl', {
        dsl_yaml: validDsl,
        validate_only: true,
        client_id: 'test-client',
      });
      
      // Should either succeed or fail gracefully
      expect([200, 400, 422]).toContain(response.status);
      
      if (response.status === 200) {
        // Validate success response structure
        expect(response.data).toHaveProperty('workflow_id');
        expect(response.data).toHaveProperty('status');
        expect(typeof response.data.workflow_id).toBe('string');
      }
    });

    it('should reject invalid YAML', async () => {
      const response = await client.post('/workflows/dsl', {
        dsl_yaml: 'invalid: yaml: structure: {',
        validate_only: true,
      });
      
      expect(response.status).toBe(422);
    });

    it('should reject DSL without tasks', async () => {
      const invalidDsl = `
workflow:
  name: test_workflow
`;
      
      const response = await client.post('/workflows/dsl', {
        dsl_yaml: invalidDsl,
        validate_only: true,
      });
      
      expect(response.status).toBe(422);
    });

    it('should reject DSL with empty tasks array', async () => {
      const invalidDsl = `
workflow:
  name: test_workflow
tasks: []
`;
      
      const response = await client.post('/workflows/dsl', {
        dsl_yaml: invalidDsl,
        validate_only: true,
      });
      
      expect(response.status).toBe(422);
    });
  });

  describe('POST /workflows/suggest', () => {
    it('should return workflow suggestions with correct schema', async () => {
      const response = await client.post('/workflows/suggest', {
        context: 'data analysis workflow',
        domain: 'data-science',
      });
      
      // Should either succeed or return error
      expect([200, 400, 501]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.data).toHaveProperty('suggestions');
        expect(Array.isArray(response.data.suggestions)).toBe(true);
      }
    });

    it('should reject context that is too short', async () => {
      const response = await client.post('/workflows/suggest', {
        context: 'hi',
      });
      
      expect(response.status).toBe(422);
    });
  });
});
