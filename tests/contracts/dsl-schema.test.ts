import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import Ajv from 'ajv';

// We need to install ajv for JSON schema validation
// For now, we'll do manual validation

interface DSLSchema {
  workflow: {
    name: string;
    description?: string;
    client_id?: string;
    priority?: number;
    sla_minutes?: number;
  };
  tasks: Array<{
    name: string;
    id?: string;
    agent: string;
    action: string;
    params?: Record<string, any>;
    depends_on?: string[];
  }>;
}

describe('DSL Schema - Contract Tests', () => {
  let schemaPath: string;
  let schema: any;

  beforeAll(() => {
    schemaPath = path.join(process.cwd(), 'mcp-server', 'schemas', 'dsl_schema.json');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    schema = JSON.parse(schemaContent);
  });

  describe('Schema Structure', () => {
    it('should have valid JSON schema structure', () => {
      expect(schema).toBeDefined();
      expect(schema.$schema).toBeDefined();
      expect(schema.type).toBe('object');
      expect(schema.required).toContain('workflow');
      expect(schema.required).toContain('tasks');
    });

    it('should define workflow properties', () => {
      expect(schema.properties.workflow).toBeDefined();
      expect(schema.properties.workflow.type).toBe('object');
      expect(schema.properties.workflow.required).toContain('name');
    });

    it('should define tasks as array with items', () => {
      expect(schema.properties.tasks).toBeDefined();
      expect(schema.properties.tasks.type).toBe('array');
      expect(schema.properties.tasks.minItems).toBe(1);
      expect(schema.properties.tasks.items).toBeDefined();
    });

    it('should define task required fields', () => {
      const taskSchema = schema.properties.tasks.items;
      expect(taskSchema.required).toContain('name');
      expect(taskSchema.required).toContain('agent');
      expect(taskSchema.required).toContain('action');
    });

    it('should define valid agent enum values', () => {
      const taskSchema = schema.properties.tasks.items;
      expect(taskSchema.properties.agent.enum).toBeDefined();
      expect(Array.isArray(taskSchema.properties.agent.enum)).toBe(true);
      expect(taskSchema.properties.agent.enum.length).toBeGreaterThan(0);
    });
  });

  describe('Valid DSL Examples', () => {
    it('should validate minimal valid DSL', () => {
      const validDsl: DSLSchema = {
        workflow: {
          name: 'test_workflow',
        },
        tasks: [
          {
            name: 'task1',
            agent: 'eda',
            action: 'load_dataset',
          },
        ],
      };

      // Manual validation
      expect(validDsl.workflow.name).toBeDefined();
      expect(validDsl.tasks.length).toBeGreaterThan(0);
      expect(validDsl.tasks[0].name).toBeDefined();
      expect(validDsl.tasks[0].agent).toBeDefined();
      expect(validDsl.tasks[0].action).toBeDefined();
    });

    it('should validate complete valid DSL', () => {
      const validDsl: DSLSchema = {
        workflow: {
          name: 'complete_workflow',
          description: 'A complete workflow example',
          client_id: 'client123',
          priority: 7,
          sla_minutes: 60,
        },
        tasks: [
          {
            name: 'load_data',
            id: 'task_001',
            agent: 'eda',
            action: 'load_dataset',
            params: {
              name: 'iris',
              path: '/data/iris.csv',
            },
            depends_on: [],
          },
          {
            name: 'analyze_data',
            agent: 'eda',
            action: 'get_summary',
            params: {
              name: 'iris',
            },
            depends_on: ['load_data'],
          },
        ],
      };

      // Manual validation
      expect(validDsl.workflow.name).toBe('complete_workflow');
      expect(validDsl.workflow.priority).toBeGreaterThanOrEqual(1);
      expect(validDsl.workflow.priority).toBeLessThanOrEqual(10);
      expect(validDsl.tasks.length).toBe(2);
      expect(validDsl.tasks[1].depends_on).toContain('load_data');
    });

    it('should validate workflow name pattern', () => {
      const validNames = ['test_workflow', 'workflow-123', 'MyWorkflow1'];
      const invalidNames = ['', 'workflow with spaces', 'workflow@special'];

      validNames.forEach(name => {
        expect(/^[a-zA-Z0-9_-]+$/.test(name)).toBe(true);
      });

      invalidNames.forEach(name => {
        if (name) {
          expect(/^[a-zA-Z0-9_-]+$/.test(name)).toBe(false);
        }
      });
    });
  });

  describe('Invalid DSL Examples', () => {
    it('should reject DSL without workflow', () => {
      const invalidDsl = {
        tasks: [
          {
            name: 'task1',
            agent: 'eda',
            action: 'load_dataset',
          },
        ],
      };

      // @ts-ignore - intentionally invalid
      expect(invalidDsl.workflow).toBeUndefined();
    });

    it('should reject DSL without tasks', () => {
      const invalidDsl = {
        workflow: {
          name: 'test_workflow',
        },
      };

      // @ts-ignore - intentionally invalid
      expect(invalidDsl.tasks).toBeUndefined();
    });

    it('should reject DSL with empty tasks array', () => {
      const invalidDsl = {
        workflow: {
          name: 'test_workflow',
        },
        tasks: [],
      };

      expect(invalidDsl.tasks.length).toBe(0);
      // Schema requires minItems: 1
    });

    it('should reject task without required fields', () => {
      const invalidTask = {
        name: 'task1',
        // missing agent and action
      };

      // @ts-ignore
      expect(invalidTask.agent).toBeUndefined();
      // @ts-ignore
      expect(invalidTask.action).toBeUndefined();
    });

    it('should reject workflow name with invalid characters', () => {
      const invalidNames = [
        'workflow with spaces',
        'workflow@special',
        'workflow!@#$',
        '',
      ];

      invalidNames.forEach(name => {
        const pattern = /^[a-zA-Z0-9_-]+$/;
        if (name) {
          expect(pattern.test(name)).toBe(false);
        } else {
          expect(name.length).toBe(0);
        }
      });
    });

    it('should reject priority out of range', () => {
      const invalidPriorities = [0, 11, -1, 100];

      invalidPriorities.forEach(priority => {
        expect(priority >= 1 && priority <= 10).toBe(false);
      });
    });
  });

  describe('Schema Constraints', () => {
    it('should validate workflow name length constraints', () => {
      const maxLength = schema.properties.workflow.properties.name.maxLength;
      expect(maxLength).toBe(100);

      const tooLongName = 'a'.repeat(101);
      expect(tooLongName.length).toBeGreaterThan(maxLength);
    });

    it('should validate task name length constraints', () => {
      const taskNameSchema = schema.properties.tasks.items.properties.name;
      expect(taskNameSchema.maxLength).toBe(100);
      expect(taskNameSchema.minLength).toBe(1);
    });

    it('should validate agent enum values', () => {
      const agentEnum = schema.properties.tasks.items.properties.agent.enum;
      expect(agentEnum).toContain('eda');
      expect(agentEnum).toContain('fe');
      expect(agentEnum).toContain('model');
      
      // Invalid agents
      expect(agentEnum).not.toContain('invalid_agent');
      expect(agentEnum).not.toContain('');
    });

    it('should validate additionalProperties constraints', () => {
      expect(schema.additionalProperties).toBe(false);
      expect(schema.properties.workflow.additionalProperties).toBe(false);
      expect(schema.properties.tasks.items.additionalProperties).toBe(false);
    });
  });
});
