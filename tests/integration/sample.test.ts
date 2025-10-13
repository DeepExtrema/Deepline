/**
 * Sample integration test demonstrating testcontainers usage
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoClient } from 'mongodb';
import {
  startTestContainers,
  stopTestContainers,
  getConnectionUrls,
  TestContainersSetup,
} from '../testcontainers.config';

describe('Integration Test Sample', () => {
  let containers: TestContainersSetup;
  let mongoClient: MongoClient;

  beforeAll(async () => {
    // Start test containers
    containers = await startTestContainers();
    const urls = getConnectionUrls(containers);

    // Connect to MongoDB
    mongoClient = new MongoClient(urls.mongodb);
    await mongoClient.connect();
  }, 60000); // Increase timeout for container startup

  afterAll(async () => {
    // Cleanup
    if (mongoClient) {
      await mongoClient.close();
    }
    if (containers) {
      await stopTestContainers(containers);
    }
  });

  it('should connect to MongoDB and insert a document', async () => {
    const db = mongoClient.db('sherlock_test');
    const collection = db.collection('test');

    const doc = { name: 'test', value: 123 };
    const result = await collection.insertOne(doc);

    expect(result.insertedId).toBeDefined();

    const found = await collection.findOne({ name: 'test' });
    expect(found).toMatchObject(doc);
  });

  it('should verify test environment is isolated', async () => {
    const db = mongoClient.db('sherlock_test');
    const collection = db.collection('isolation_test');

    // Each test should have a clean environment
    const count = await collection.countDocuments();
    expect(count).toBe(0);
  });
});
