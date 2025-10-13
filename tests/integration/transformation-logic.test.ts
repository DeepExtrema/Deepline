import { describe, it, expect } from 'vitest';
import * as yaml from 'yaml';

/**
 * Integration tests for transformation logic
 * Tests data transformations, serialization, and conversions
 */

describe('Transformation Logic - Integration Tests', () => {
  describe('YAML to JSON Transformation', () => {
    it('should transform valid YAML DSL to JSON', () => {
      const yamlDsl = `
workflow:
  name: test_workflow
  priority: 5
tasks:
  - name: task1
    agent: eda
    action: load_dataset
    params:
      name: iris
    depends_on: []
`;
      
      const parsed = yaml.parse(yamlDsl);
      
      expect(parsed).toBeDefined();
      expect(parsed.workflow).toBeDefined();
      expect(parsed.workflow.name).toBe('test_workflow');
      expect(parsed.tasks).toHaveLength(1);
      expect(parsed.tasks[0].name).toBe('task1');
    });

    it('should handle YAML with special characters', () => {
      const yamlDsl = `
workflow:
  name: test_workflow
  description: "A workflow with 'quotes' and special: chars"
tasks:
  - name: task1
    agent: eda
    action: load_dataset
`;
      
      const parsed = yaml.parse(yamlDsl);
      
      expect(parsed.workflow.description).toContain('quotes');
    });

    it('should reject invalid YAML', () => {
      const invalidYaml = `
workflow:
  name: test
  invalid: [unclosed
`;
      
      expect(() => yaml.parse(invalidYaml)).toThrow();
    });

    it('should handle empty arrays and objects', () => {
      const yamlDsl = `
workflow:
  name: test_workflow
tasks:
  - name: task1
    agent: eda
    action: load_dataset
    params: {}
    depends_on: []
`;
      
      const parsed = yaml.parse(yamlDsl);
      
      expect(parsed.tasks[0].params).toEqual({});
      expect(parsed.tasks[0].depends_on).toEqual([]);
    });
  });

  describe('JSON to YAML Transformation', () => {
    it('should transform JSON DSL to YAML', () => {
      const jsonDsl = {
        workflow: {
          name: 'test_workflow',
          priority: 5,
        },
        tasks: [
          {
            name: 'task1',
            agent: 'eda',
            action: 'load_dataset',
            params: { name: 'iris' },
            depends_on: [],
          },
        ],
      };
      
      const yamlStr = yaml.stringify(jsonDsl);
      
      expect(yamlStr).toContain('test_workflow');
      expect(yamlStr).toContain('task1');
      expect(yamlStr).toContain('eda');
      
      // Round-trip test
      const parsed = yaml.parse(yamlStr);
      expect(parsed).toEqual(jsonDsl);
    });

    it('should preserve data types during transformation', () => {
      const jsonDsl = {
        workflow: {
          name: 'test_workflow',
          priority: 7,
          sla_minutes: 120,
        },
        tasks: [
          {
            name: 'task1',
            agent: 'eda',
            action: 'load_dataset',
            params: {
              enabled: true,
              count: 100,
              ratio: 0.5,
            },
          },
        ],
      };
      
      const yamlStr = yaml.stringify(jsonDsl);
      const parsed = yaml.parse(yamlStr);
      
      expect(typeof parsed.workflow.priority).toBe('number');
      expect(typeof parsed.tasks[0].params.enabled).toBe('boolean');
      expect(typeof parsed.tasks[0].params.ratio).toBe('number');
      expect(parsed.tasks[0].params.enabled).toBe(true);
    });
  });

  describe('Request Normalization', () => {
    interface TranslationRequest {
      natural_language: string;
      priority?: number;
      client_id?: string;
      metadata?: Record<string, any>;
    }

    const normalizeTranslationRequest = (req: TranslationRequest): TranslationRequest => {
      return {
        natural_language: req.natural_language.trim(),
        priority: req.priority ?? 5,
        client_id: req.client_id ?? 'default',
        metadata: req.metadata ?? {},
      };
    };

    it('should apply default values', () => {
      const request: TranslationRequest = {
        natural_language: 'Load the iris dataset',
      };
      
      const normalized = normalizeTranslationRequest(request);
      
      expect(normalized.priority).toBe(5);
      expect(normalized.client_id).toBe('default');
      expect(normalized.metadata).toEqual({});
    });

    it('should preserve provided values', () => {
      const request: TranslationRequest = {
        natural_language: 'Load the iris dataset',
        priority: 8,
        client_id: 'custom-client',
        metadata: { source: 'api' },
      };
      
      const normalized = normalizeTranslationRequest(request);
      
      expect(normalized.priority).toBe(8);
      expect(normalized.client_id).toBe('custom-client');
      expect(normalized.metadata).toEqual({ source: 'api' });
    });

    it('should trim natural language input', () => {
      const request: TranslationRequest = {
        natural_language: '  Load the iris dataset  ',
      };
      
      const normalized = normalizeTranslationRequest(request);
      
      expect(normalized.natural_language).toBe('Load the iris dataset');
    });
  });

  describe('Response Transformation', () => {
    interface TranslationResponse {
      token: string;
      status: string;
      message: string;
      estimated_completion_seconds?: number;
    }

    const createTranslationResponse = (
      token: string,
      priority: number
    ): TranslationResponse => {
      const estimatedTime = Math.max(30, (11 - priority) * 10);
      
      return {
        token,
        status: 'queued',
        message: `Translation request queued with priority ${priority}`,
        estimated_completion_seconds: estimatedTime,
      };
    };

    it('should create response with correct structure', () => {
      const response = createTranslationResponse('token123', 5);
      
      expect(response.token).toBe('token123');
      expect(response.status).toBe('queued');
      expect(response.message).toContain('priority 5');
      expect(response.estimated_completion_seconds).toBeDefined();
    });

    it('should calculate estimated time based on priority', () => {
      const highPriority = createTranslationResponse('token1', 10);
      const lowPriority = createTranslationResponse('token2', 1);
      
      expect(highPriority.estimated_completion_seconds).toBeLessThan(
        lowPriority.estimated_completion_seconds!
      );
    });

    it('should set minimum estimated time', () => {
      const response = createTranslationResponse('token123', 10);
      
      expect(response.estimated_completion_seconds).toBeGreaterThanOrEqual(30);
    });
  });

  describe('Status Transformation', () => {
    interface TranslationStatus {
      token: string;
      status: 'queued' | 'processing' | 'done' | 'error' | 'needs_human';
      created_at: string;
      updated_at: string;
      retries: number;
      dsl?: string;
      error_message?: string;
    }

    const transformStatusForClient = (status: TranslationStatus): TranslationStatus => {
      const transformed = { ...status };
      
      // Remove DSL if not done
      if (status.status !== 'done') {
        delete transformed.dsl;
      }
      
      // Remove error message if not error
      if (status.status !== 'error') {
        delete transformed.error_message;
      }
      
      return transformed;
    };

    it('should remove DSL from non-done statuses', () => {
      const status: TranslationStatus = {
        token: 'token123',
        status: 'processing',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:01:00Z',
        retries: 0,
        dsl: 'workflow: test',
      };
      
      const transformed = transformStatusForClient(status);
      
      expect(transformed.dsl).toBeUndefined();
    });

    it('should keep DSL for done status', () => {
      const status: TranslationStatus = {
        token: 'token123',
        status: 'done',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:01:00Z',
        retries: 0,
        dsl: 'workflow: test',
      };
      
      const transformed = transformStatusForClient(status);
      
      expect(transformed.dsl).toBe('workflow: test');
    });

    it('should remove error message from non-error statuses', () => {
      const status: TranslationStatus = {
        token: 'token123',
        status: 'processing',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:01:00Z',
        retries: 0,
        error_message: 'Some error',
      };
      
      const transformed = transformStatusForClient(status);
      
      expect(transformed.error_message).toBeUndefined();
    });

    it('should keep error message for error status', () => {
      const status: TranslationStatus = {
        token: 'token123',
        status: 'error',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:01:00Z',
        retries: 2,
        error_message: 'Translation failed',
      };
      
      const transformed = transformStatusForClient(status);
      
      expect(transformed.error_message).toBe('Translation failed');
    });
  });

  describe('Error Response Transformation', () => {
    interface ErrorResponse {
      error: string;
      detail: string;
      status_code: number;
    }

    const transformErrorForClient = (
      error: Error,
      statusCode: number = 500
    ): ErrorResponse => {
      return {
        error: error.name,
        detail: error.message,
        status_code: statusCode,
      };
    };

    it('should transform error to client format', () => {
      const error = new Error('Something went wrong');
      const response = transformErrorForClient(error, 400);
      
      expect(response.error).toBe('Error');
      expect(response.detail).toBe('Something went wrong');
      expect(response.status_code).toBe(400);
    });

    it('should use default status code', () => {
      const error = new Error('Internal error');
      const response = transformErrorForClient(error);
      
      expect(response.status_code).toBe(500);
    });

    it('should handle custom error types', () => {
      class ValidationError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'ValidationError';
        }
      }
      
      const error = new ValidationError('Invalid input');
      const response = transformErrorForClient(error, 422);
      
      expect(response.error).toBe('ValidationError');
      expect(response.detail).toBe('Invalid input');
      expect(response.status_code).toBe(422);
    });
  });
});
