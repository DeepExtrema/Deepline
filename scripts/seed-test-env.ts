#!/usr/bin/env node
/**
 * Idempotent test environment seeder
 * Seeds the test database with:
 * - Admin user
 * - Test user
 * - Sample data object
 */

import { MongoClient } from 'mongodb';
import * as crypto from 'crypto';

interface User {
  _id?: string;
  username: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SampleData {
  _id?: string;
  name: string;
  description: string;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const MONGO_URL = process.env.MONGO_URL || 'mongodb://testuser:testpass@localhost:27017';
const DB_NAME = process.env.MONGO_DB_NAME || 'sherlock_test';

// Simple password hashing (use bcrypt in production)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seedUsers(db: any): Promise<void> {
  const usersCollection = db.collection('users');
  
  const adminUser: User = {
    username: 'admin',
    email: 'admin@test.com',
    passwordHash: hashPassword('admin123'),
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const testUser: User = {
    username: 'testuser',
    email: 'test@test.com',
    passwordHash: hashPassword('test123'),
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Idempotent upsert
  await usersCollection.updateOne(
    { username: 'admin' },
    { $set: adminUser },
    { upsert: true }
  );
  console.log('✓ Admin user seeded');

  await usersCollection.updateOne(
    { username: 'testuser' },
    { $set: testUser },
    { upsert: true }
  );
  console.log('✓ Test user seeded');
}

async function seedSampleData(db: any): Promise<void> {
  const dataCollection = db.collection('sample_data');

  const sampleData: SampleData = {
    name: 'test-dataset',
    description: 'Sample test dataset for integration tests',
    data: {
      columns: ['id', 'name', 'value', 'category'],
      rows: [
        { id: 1, name: 'Item A', value: 100, category: 'alpha' },
        { id: 2, name: 'Item B', value: 200, category: 'beta' },
        { id: 3, name: 'Item C', value: 150, category: 'alpha' },
        { id: 4, name: 'Item D', value: 300, category: 'gamma' },
        { id: 5, name: 'Item E', value: 250, category: 'beta' },
      ],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Idempotent upsert
  await dataCollection.updateOne(
    { name: 'test-dataset' },
    { $set: sampleData },
    { upsert: true }
  );
  console.log('✓ Sample data seeded');
}

async function seedWorkflows(db: any): Promise<void> {
  const workflowsCollection = db.collection('workflows');

  const sampleWorkflow = {
    name: 'test-workflow',
    description: 'Sample workflow for testing',
    steps: [
      { id: 'load', type: 'load_data', params: { source: 'test-dataset' } },
      { id: 'analyze', type: 'eda', params: { include_viz: true } },
    ],
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await workflowsCollection.updateOne(
    { name: 'test-workflow' },
    { $set: sampleWorkflow },
    { upsert: true }
  );
  console.log('✓ Sample workflow seeded');
}

async function main(): Promise<void> {
  console.log('🌱 Starting test environment seeding...');
  console.log(`📍 MongoDB URL: ${MONGO_URL}`);
  console.log(`📍 Database: ${DB_NAME}`);

  let client: MongoClient | null = null;

  try {
    // Connect to MongoDB
    client = new MongoClient(MONGO_URL);
    await client.connect();
    console.log('✓ Connected to MongoDB');

    const db = client.db(DB_NAME);

    // Seed data (idempotent operations)
    await seedUsers(db);
    await seedSampleData(db);
    await seedWorkflows(db);

    console.log('\n✅ Test environment seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test environment:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('✓ MongoDB connection closed');
    }
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { seedUsers, seedSampleData, seedWorkflows };
