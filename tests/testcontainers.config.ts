/**
 * Testcontainers configuration for integration tests
 * Provides containerized dependencies for testing
 */

import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';

export interface TestContainersSetup {
  mongodb: StartedTestContainer;
  redis: StartedTestContainer;
  postgres: StartedTestContainer;
}

/**
 * Start all test containers
 */
export async function startTestContainers(): Promise<TestContainersSetup> {
  console.log('🚀 Starting test containers...');

  // Start MongoDB
  const mongodb = await new GenericContainer('mongo:6.0')
    .withEnvironment({
      MONGO_INITDB_ROOT_USERNAME: 'testuser',
      MONGO_INITDB_ROOT_PASSWORD: 'testpass',
    })
    .withExposedPorts(27017)
    .withWaitStrategy(Wait.forLogMessage(/Waiting for connections/))
    .start();
  console.log('✓ MongoDB started on port', mongodb.getMappedPort(27017));

  // Start Redis
  const redis = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .withWaitStrategy(Wait.forLogMessage(/Ready to accept connections/))
    .start();
  console.log('✓ Redis started on port', redis.getMappedPort(6379));

  // Start PostgreSQL
  const postgres = await new GenericContainer('postgres:15-alpine')
    .withEnvironment({
      POSTGRES_USER: 'testuser',
      POSTGRES_PASSWORD: 'testpass',
      POSTGRES_DB: 'sherlock_test',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/))
    .start();
  console.log('✓ PostgreSQL started on port', postgres.getMappedPort(5432));

  return { mongodb, redis, postgres };
}

/**
 * Stop all test containers
 */
export async function stopTestContainers(
  containers: TestContainersSetup
): Promise<void> {
  console.log('🛑 Stopping test containers...');

  await containers.mongodb.stop();
  console.log('✓ MongoDB stopped');

  await containers.redis.stop();
  console.log('✓ Redis stopped');

  await containers.postgres.stop();
  console.log('✓ PostgreSQL stopped');
}

/**
 * Get connection URLs for test containers
 */
export function getConnectionUrls(containers: TestContainersSetup): {
  mongodb: string;
  redis: string;
  postgres: string;
} {
  return {
    mongodb: `mongodb://testuser:testpass@${containers.mongodb.getHost()}:${containers.mongodb.getMappedPort(27017)}`,
    redis: `redis://${containers.redis.getHost()}:${containers.redis.getMappedPort(6379)}`,
    postgres: `postgresql://testuser:testpass@${containers.postgres.getHost()}:${containers.postgres.getMappedPort(5432)}/sherlock_test`,
  };
}
