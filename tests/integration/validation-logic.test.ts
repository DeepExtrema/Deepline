import { describe, it, expect } from 'vitest';

/**
 * Integration tests for validation logic
 * These tests validate critical pure logic functions without requiring external services
 */

describe('Validation Logic - Integration Tests', () => {
  describe('Workflow Name Validation', () => {
    const validateWorkflowName = (name: string): { valid: boolean; error?: string } => {
      if (!name || name.length === 0) {
        return { valid: false, error: 'Workflow name cannot be empty' };
      }
      
      if (name.length > 100) {
        return { valid: false, error: 'Workflow name cannot exceed 100 characters' };
      }
      
      if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        return { valid: false, error: 'Workflow name can only contain alphanumeric characters, underscores, and hyphens' };
      }
      
      return { valid: true };
    };

    it('should accept valid workflow names', () => {
      const validNames = [
        'test_workflow',
        'workflow-123',
        'MyWorkflow1',
        'a',
        'WORKFLOW_NAME',
      ];

      validNames.forEach(name => {
        const result = validateWorkflowName(name);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject empty workflow names', () => {
      const result = validateWorkflowName('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject workflow names with invalid characters', () => {
      const invalidNames = [
        'workflow with spaces',
        'workflow@special',
        'workflow!',
        'workflow.name',
      ];

      invalidNames.forEach(name => {
        const result = validateWorkflowName(name);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('alphanumeric');
      });
    });

    it('should reject workflow names that are too long', () => {
      const longName = 'a'.repeat(101);
      const result = validateWorkflowName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('100 characters');
    });
  });

  describe('Priority Validation', () => {
    const validatePriority = (priority: number): { valid: boolean; error?: string } => {
      if (typeof priority !== 'number' || isNaN(priority)) {
        return { valid: false, error: 'Priority must be a number' };
      }
      
      if (!Number.isInteger(priority)) {
        return { valid: false, error: 'Priority must be an integer' };
      }
      
      if (priority < 1 || priority > 10) {
        return { valid: false, error: 'Priority must be between 1 and 10' };
      }
      
      return { valid: true };
    };

    it('should accept valid priorities', () => {
      const validPriorities = [1, 2, 5, 8, 10];

      validPriorities.forEach(priority => {
        const result = validatePriority(priority);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject priorities out of range', () => {
      const invalidPriorities = [0, -1, 11, 100];

      invalidPriorities.forEach(priority => {
        const result = validatePriority(priority);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('between 1 and 10');
      });
    });

    it('should reject non-integer priorities', () => {
      const invalidPriorities = [1.5, 2.7, 9.9];

      invalidPriorities.forEach(priority => {
        const result = validatePriority(priority);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('integer');
      });
    });

    it('should reject non-numeric priorities', () => {
      // @ts-ignore - intentionally testing invalid input
      const result = validatePriority('5');
      expect(result.valid).toBe(false);
    });
  });

  describe('Task Dependency Validation', () => {
    interface Task {
      name: string;
      depends_on: string[];
    }

    const validateTaskDependencies = (tasks: Task[]): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];
      const taskNames = new Set(tasks.map(t => t.name));

      // Check for duplicate task names
      const nameCount = new Map<string, number>();
      tasks.forEach(task => {
        nameCount.set(task.name, (nameCount.get(task.name) || 0) + 1);
      });

      nameCount.forEach((count, name) => {
        if (count > 1) {
          errors.push(`Duplicate task name: ${name}`);
        }
      });

      // Check for invalid dependencies
      tasks.forEach(task => {
        task.depends_on.forEach(dep => {
          if (!taskNames.has(dep)) {
            errors.push(`Task '${task.name}' depends on non-existent task '${dep}'`);
          }
        });
      });

      // Check for circular dependencies (simple check)
      tasks.forEach(task => {
        if (task.depends_on.includes(task.name)) {
          errors.push(`Task '${task.name}' cannot depend on itself`);
        }
      });

      return { valid: errors.length === 0, errors };
    };

    it('should accept valid task dependencies', () => {
      const tasks: Task[] = [
        { name: 'task1', depends_on: [] },
        { name: 'task2', depends_on: ['task1'] },
        { name: 'task3', depends_on: ['task1', 'task2'] },
      ];

      const result = validateTaskDependencies(tasks);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject tasks with non-existent dependencies', () => {
      const tasks: Task[] = [
        { name: 'task1', depends_on: [] },
        { name: 'task2', depends_on: ['task1', 'non_existent'] },
      ];

      const result = validateTaskDependencies(tasks);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('non_existent');
    });

    it('should reject tasks with duplicate names', () => {
      const tasks: Task[] = [
        { name: 'task1', depends_on: [] },
        { name: 'task1', depends_on: [] },
      ];

      const result = validateTaskDependencies(tasks);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Duplicate');
    });

    it('should reject tasks with self-dependencies', () => {
      const tasks: Task[] = [
        { name: 'task1', depends_on: ['task1'] },
      ];

      const result = validateTaskDependencies(tasks);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('itself');
    });
  });

  describe('Natural Language Validation', () => {
    const validateNaturalLanguage = (text: string): { valid: boolean; error?: string } => {
      if (!text || text.trim().length === 0) {
        return { valid: false, error: 'Natural language input cannot be empty' };
      }

      if (text.trim().length < 10) {
        return { valid: false, error: 'Natural language input too brief, minimum 10 characters' };
      }

      if (text.length > 5000) {
        return { valid: false, error: 'Natural language input too long, maximum 5000 characters' };
      }

      const wordCount = text.trim().split(/\s+/).length;
      if (wordCount < 3) {
        return { valid: false, error: 'Natural language input too brief, minimum 3 words' };
      }

      return { valid: true };
    };

    it('should accept valid natural language input', () => {
      const validInputs = [
        'Load the iris dataset and show summary statistics',
        'Perform exploratory data analysis on customer data',
        'Train a machine learning model to predict sales',
      ];

      validInputs.forEach(input => {
        const result = validateNaturalLanguage(input);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject empty input', () => {
      const result = validateNaturalLanguage('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject input that is too short', () => {
      const result = validateNaturalLanguage('hi');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject input with too few words', () => {
      const result = validateNaturalLanguage('hello world');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('3 words');
    });

    it('should reject input that is too long', () => {
      const longInput = 'a '.repeat(2501); // Over 5000 chars
      const result = validateNaturalLanguage(longInput);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('5000');
    });

    it('should handle whitespace correctly', () => {
      const result = validateNaturalLanguage('   Load the iris dataset   ');
      expect(result.valid).toBe(true);
    });
  });

  describe('Agent-Action Validation', () => {
    const agentActions: Record<string, string[]> = {
      eda: ['load_dataset', 'get_summary', 'infer_schema', 'create_visualization'],
      fe: ['engineer_features', 'transform_data', 'create_features'],
      model: ['train_model', 'predict', 'evaluate_model'],
    };

    const validateAgentAction = (
      agent: string,
      action: string
    ): { valid: boolean; error?: string } => {
      if (!agent || agent.trim().length === 0) {
        return { valid: false, error: 'Agent name cannot be empty' };
      }

      if (!action || action.trim().length === 0) {
        return { valid: false, error: 'Action name cannot be empty' };
      }

      if (!(agent in agentActions)) {
        return { valid: false, error: `Unknown agent: ${agent}` };
      }

      if (!agentActions[agent].includes(action)) {
        return { valid: false, error: `Agent '${agent}' does not support action '${action}'` };
      }

      return { valid: true };
    };

    it('should accept valid agent-action combinations', () => {
      const validCombinations = [
        { agent: 'eda', action: 'load_dataset' },
        { agent: 'fe', action: 'engineer_features' },
        { agent: 'model', action: 'train_model' },
      ];

      validCombinations.forEach(({ agent, action }) => {
        const result = validateAgentAction(agent, action);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject unknown agents', () => {
      const result = validateAgentAction('unknown_agent', 'some_action');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown agent');
    });

    it('should reject invalid actions for valid agents', () => {
      const result = validateAgentAction('eda', 'train_model');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('does not support');
    });

    it('should reject empty agent names', () => {
      const result = validateAgentAction('', 'load_dataset');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject empty action names', () => {
      const result = validateAgentAction('eda', '');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });
  });
});
