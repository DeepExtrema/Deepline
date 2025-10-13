import { describe, it, expect, beforeAll } from 'vitest';
import { createApiClient, validateResponseStructure, validateStatusCode } from '../test-helpers';
import { AxiosInstance } from 'axios';

describe('Agent Endpoints - Contract Tests', () => {
  let client: AxiosInstance;

  beforeAll(() => {
    client = createApiClient();
  });

  describe('GET /agents', () => {
    it('should return agent matrix with correct schema', async () => {
      const response = await client.get('/agents');
      
      // Validate status code
      expect(validateStatusCode(response, 200)).toBe(true);
      
      // Validate response structure
      const validation = validateResponseStructure(response, [
        'agents',
        'total_agents',
        'routing_mode',
      ]);
      
      expect(validation.valid).toBe(true);
      expect(validation.missing).toEqual([]);
      
      // Validate agents object structure
      expect(response.data.agents).toBeDefined();
      expect(typeof response.data.agents).toBe('object');
      expect(response.data.total_agents).toBeGreaterThan(0);
      expect(typeof response.data.routing_mode).toBe('string');
      
      // Validate individual agent structure
      const agentKeys = Object.keys(response.data.agents);
      expect(agentKeys.length).toBeGreaterThan(0);
      
      const firstAgent = response.data.agents[agentKeys[0]];
      expect(firstAgent).toHaveProperty('name');
      expect(firstAgent).toHaveProperty('actions');
      expect(firstAgent).toHaveProperty('action_count');
      expect(firstAgent).toHaveProperty('status');
      expect(Array.isArray(firstAgent.actions)).toBe(true);
    });

    it('should have valid agent names in the response', async () => {
      const response = await client.get('/agents');
      expect(response.status).toBe(200);
      
      const agents = response.data.agents;
      const agentNames = Object.keys(agents);
      
      // Validate agent names match expected patterns
      agentNames.forEach(name => {
        expect(agents[name].name).toBe(name);
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
      });
    });
  });

  describe('GET /agents/{agent_name}', () => {
    it('should return specific agent info with correct schema', async () => {
      // First get list of agents
      const listResponse = await client.get('/agents');
      const agentNames = Object.keys(listResponse.data.agents);
      expect(agentNames.length).toBeGreaterThan(0);
      
      // Test first agent
      const agentName = agentNames[0];
      const response = await client.get(`/agents/${agentName}`);
      
      expect(response.status).toBe(200);
      
      // Validate response structure
      const validation = validateResponseStructure(response, [
        'name',
        'actions',
        'action_count',
        'status',
      ]);
      
      expect(validation.valid).toBe(true);
      expect(validation.missing).toEqual([]);
      
      // Validate field types
      expect(response.data.name).toBe(agentName);
      expect(Array.isArray(response.data.actions)).toBe(true);
      expect(typeof response.data.action_count).toBe('number');
      expect(response.data.action_count).toBe(response.data.actions.length);
      expect(typeof response.data.status).toBe('string');
    });

    it('should return 404 for non-existent agent', async () => {
      const response = await client.get('/agents/non_existent_agent_xyz');
      expect(response.status).toBe(404);
      expect(response.data).toHaveProperty('detail');
    });
  });

  describe('GET /agents/{agent_name}/actions', () => {
    it('should return list of actions with correct schema', async () => {
      // Get valid agent name
      const listResponse = await client.get('/agents');
      const agentNames = Object.keys(listResponse.data.agents);
      const agentName = agentNames[0];
      
      const response = await client.get(`/agents/${agentName}/actions`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // Validate each action is a string
      response.data.forEach((action: any) => {
        expect(typeof action).toBe('string');
        expect(action.length).toBeGreaterThan(0);
      });
    });

    it('should return 404 for non-existent agent actions', async () => {
      const response = await client.get('/agents/non_existent_agent_xyz/actions');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /agents/validate', () => {
    it('should validate agent-action combination with correct schema', async () => {
      // Get valid agent and action
      const listResponse = await client.get('/agents');
      const agentNames = Object.keys(listResponse.data.agents);
      const agentName = agentNames[0];
      const actions = listResponse.data.agents[agentName].actions;
      const action = actions[0];
      
      const response = await client.post('/agents/validate', {
        agent: agentName,
        action: action,
      });
      
      expect(response.status).toBe(200);
      
      // Validate response structure
      const validation = validateResponseStructure(response, [
        'valid',
        'agent_valid',
        'action_valid',
        'valid_actions',
      ]);
      
      expect(validation.valid).toBe(true);
      expect(response.data.valid).toBe(true);
      expect(response.data.agent_valid).toBe(true);
      expect(response.data.action_valid).toBe(true);
      expect(Array.isArray(response.data.valid_actions)).toBe(true);
    });

    it('should return invalid for non-existent agent', async () => {
      const response = await client.post('/agents/validate', {
        agent: 'non_existent_agent',
        action: 'some_action',
      });
      
      expect(response.status).toBe(200);
      expect(response.data.valid).toBe(false);
      expect(response.data.agent_valid).toBe(false);
    });

    it('should return invalid for non-existent action', async () => {
      // Get valid agent
      const listResponse = await client.get('/agents');
      const agentNames = Object.keys(listResponse.data.agents);
      const agentName = agentNames[0];
      
      const response = await client.post('/agents/validate', {
        agent: agentName,
        action: 'non_existent_action_xyz',
      });
      
      expect(response.status).toBe(200);
      expect(response.data.valid).toBe(false);
      expect(response.data.agent_valid).toBe(true);
      expect(response.data.action_valid).toBe(false);
    });
  });

  describe('GET /agents/names', () => {
    it('should return list of agent names', async () => {
      const response = await client.get('/agents/names');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      
      // Validate each name is a string
      response.data.forEach((name: any) => {
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
      });
    });
  });
});
