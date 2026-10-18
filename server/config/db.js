import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

let mongoServerInstance = null;

// Clean up any stale/orphaned mongod process from previous crashes or ungraceful terminal exits
const cleanupOrphanedMongo = () => {
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /F /IM mongod* /T', { stdio: 'ignore' });
    } else {
      execSync('pkill -9 -f mongod || true', { stdio: 'ignore' });
    }
  } catch {
    // Normal if no leftover mongod process exists
  }
};

const removeLockFiles = (dataDir) => {
  const lockFiles = ['mongod.lock', 'WiredTiger.lock'];
  for (const file of lockFiles) {
    const fullLock = path.join(dataDir, file);
    if (fs.existsSync(fullLock)) {
      try {
        fs.unlinkSync(fullLock);
      } catch {
        // file could not be unlinked immediately
      }
    }
  }
};

const connectDB = async () => {
  try {
    // 1. If a custom MONGO_URI is set in environment (e.g. MongoDB Atlas or local service)
    if (process.env.MONGO_URI) {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    }

    // 2. Otherwise, use persistent local disk storage in 'data/db' so user accounts and data never get erased
    const dataDir = path.resolve('data/db');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    } else {
      // Clear stale locks & orphaned processes if any were left behind
      cleanupOrphanedMongo();
      removeLockFiles(dataDir);
    }

    console.log('Initializing local database engine (this may take a few seconds)...');
    mongoServerInstance = await MongoMemoryServer.create({
      instance: {
        dbPath: dataDir,
        storageEngine: 'wiredTiger',
        launchTimeout: 90000,
      },
    });

    const mongoUri = mongoServerInstance.getUri('clothing_assistant_db');
    const conn = await mongoose.connect(mongoUri);

    process.env.MONGO_URI = mongoUri;
    const mlDir = path.resolve('ml');
    if (!fs.existsSync(mlDir)) {
      fs.mkdirSync(mlDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(mlDir, 'db_config.json'),
      JSON.stringify({ MONGO_URI: mongoUri, DB_NAME: 'clothing_assistant_db' }, null, 2)
    );

    console.log(`MongoDB Connected (Persistent Storage): ${conn.connection.host}`);
    console.log(`Data permanently saved to: ${dataDir}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown: do NOT clean up database files on disk
const handleShutdown = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServerInstance) {
      await mongoServerInstance.stop({ doCleanup: false });
      mongoServerInstance = null;
    }
  } catch {
    // ignore shutdown errors
  }
};

process.on('SIGINT', async () => {
  await handleShutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await handleShutdown();
  process.exit(0);
});

// Nodemon restart signal
process.once('SIGUSR2', async () => {
  await handleShutdown();
  process.kill(process.pid, 'SIGUSR2');
});

export default connectDB;
