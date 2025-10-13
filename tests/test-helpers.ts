import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface TestConfig {
  baseUrl: string;
  timeout: number;
}

export const getTestConfig = (): TestConfig => {
  return {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:8001',
    timeout: 30000,
  };
};

export const createApiClient = (config?: Partial<TestConfig>): AxiosInstance => {
  const testConfig = { ...getTestConfig(), ...config };
  return axios.create({
    baseURL: testConfig.baseUrl,
    timeout: testConfig.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
    validateStatus: () => true, // Don't throw on any status code
  });
};

export const validateResponseStructure = (
  response: AxiosResponse,
  expectedFields: string[]
): { valid: boolean; missing: string[]; extra: string[] } => {
  const actualFields = Object.keys(response.data);
  const missing = expectedFields.filter(field => !actualFields.includes(field));
  const extra = actualFields.filter(field => !expectedFields.includes(field));
  
  return {
    valid: missing.length === 0,
    missing,
    extra,
  };
};

export const validateStatusCode = (
  response: AxiosResponse,
  expected: number
): boolean => {
  return response.status === expected;
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
