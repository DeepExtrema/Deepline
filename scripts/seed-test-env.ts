/**
 * Seed test environment with test accounts and data
 * 
 * This script creates:
 * - User A (admin role) with test data sources
 * - User B (viewer role) with limited permissions
 * - Test data sources owned by User A
 */

import { APIRequestContext } from '@playwright/test';

export interface TestUser {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role: string;
  token?: string;
}

export interface TestDataSource {
  id?: string;
  name: string;
  type: string;
  url?: string;
  owner: string;
}

export const TEST_USERS: Record<string, TestUser> = {
  userA: {
    username: 'test_user_a',
    email: 'usera@test.com',
    fullName: 'Test User A',
    password: 'TestPassword123!',
    role: 'admin'
  },
  userB: {
    username: 'test_user_b',
    email: 'userb@test.com',
    fullName: 'Test User B',
    password: 'TestPassword456!',
    role: 'viewer'
  },
  engineer: {
    username: 'test_engineer',
    email: 'engineer@test.com',
    fullName: 'Test Engineer',
    password: 'EngineerPass789!',
    role: 'data_engineer'
  }
};

export const TEST_DATA_SOURCES: TestDataSource[] = [
  {
    name: 'Test API Source',
    type: 'api',
    url: 'https://api.example.com/data',
    owner: 'test_user_a'
  },
  {
    name: 'Test Database',
    type: 'database',
    url: 'postgresql://localhost:5432/testdb',
    owner: 'test_user_a'
  }
];

/**
 * Create a user account via API
 */
export async function createUser(
  request: APIRequestContext,
  baseURL: string,
  user: TestUser
): Promise<TestUser> {
  try {
    const response = await request.post(`${baseURL}/auth/signup`, {
      data: {
        username: user.username,
        email: user.email,
        full_name: user.fullName,
        password: user.password,
        role: user.role
      }
    });

    if (!response.ok()) {
      const error = await response.text();
      // User might already exist, try to login instead
      if (error.includes('already exists') || response.status() === 409) {
        console.log(`User ${user.username} already exists, will login instead`);
        return user;
      }
      throw new Error(`Failed to create user: ${response.status()} - ${error}`);
    }

    return user;
  } catch (error) {
    console.warn(`Error creating user ${user.username}:`, error);
    return user;
  }
}

/**
 * Login a user and get auth token
 */
export async function loginUser(
  request: APIRequestContext,
  baseURL: string,
  user: TestUser
): Promise<string> {
  const response = await request.post(`${baseURL}/auth/login`, {
    data: {
      username: user.username,
      password: user.password
    }
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()} - ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create a data source owned by a user
 */
export async function createDataSource(
  request: APIRequestContext,
  baseURL: string,
  token: string,
  dataSource: TestDataSource
): Promise<TestDataSource> {
  const response = await request.post(`${baseURL}/data/sources`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    data: {
      name: dataSource.name,
      type: dataSource.type,
      config: {
        url: dataSource.url
      }
    }
  });

  if (!response.ok()) {
    throw new Error(`Failed to create data source: ${response.status()}`);
  }

  const data = await response.json();
  return { ...dataSource, id: data.source_id };
}

/**
 * Clean up all test data
 */
export async function cleanupTestData(
  request: APIRequestContext,
  baseURL: string,
  adminToken: string
): Promise<void> {
  try {
    // Delete all test data sources
    const sourcesResponse = await request.get(`${baseURL}/data/sources`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (sourcesResponse.ok()) {
      const sources = await sourcesResponse.json();
      for (const source of sources.sources || []) {
        if (source.name?.startsWith('Test')) {
          await request.delete(`${baseURL}/data/sources/${source.id}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
          });
        }
      }
    }
  } catch (error) {
    console.warn('Error during cleanup:', error);
  }
}

/**
 * Seed the entire test environment
 */
export async function seedTestEnvironment(
  request: APIRequestContext,
  baseURL: string
): Promise<Record<string, TestUser>> {
  const seededUsers: Record<string, TestUser> = {};

  // Create all test users
  for (const [key, user] of Object.entries(TEST_USERS)) {
    await createUser(request, baseURL, user);
    const token = await loginUser(request, baseURL, user);
    seededUsers[key] = { ...user, token };
    console.log(`Seeded user: ${user.username}`);
  }

  // Create test data sources for user A
  if (seededUsers.userA?.token) {
    for (const dataSource of TEST_DATA_SOURCES) {
      try {
        await createDataSource(request, baseURL, seededUsers.userA.token, dataSource);
        console.log(`Created data source: ${dataSource.name}`);
      } catch (error) {
        console.warn(`Error creating data source ${dataSource.name}:`, error);
      }
    }
  }

  return seededUsers;
}
