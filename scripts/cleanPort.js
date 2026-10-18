import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('[CLEANUP] Checking for lingering processes and locks before starting...');

// 1. Kill any orphaned mongod processes
try {
  if (process.platform === 'win32') {
    execSync('taskkill /F /IM mongod* /T', { stdio: 'ignore' });
  } else {
    execSync('pkill -9 -f mongod || true', { stdio: 'ignore' });
  }
} catch {
  // No mongod process was running
}

// 2. Free port 5000 if occupied by an orphaned process
try {
  if (process.platform === 'win32') {
    const netstatOutput = execSync('netstat -ano | findstr :5000', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const lines = netstatOutput.trim().split('\n');
    const pids = new Set();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const state = parts[3];
      const pid = parts[parts.length - 1];
      if (state === 'LISTENING' && pid && pid !== '0' && pid !== String(process.pid)) {
        pids.add(pid);
      }
    }
    for (const pid of pids) {
      try {
        console.log(`[CLEANUP] Releasing occupied port 5000 (PID: ${pid})...`);
        execSync(`taskkill /F /PID ${pid} /T`, { stdio: 'ignore' });
      } catch {
        // ignore
      }
    }
  }
} catch {
  // Port 5000 is not in use or error checking
}

// 3. Clean up lock files in data/db
const dataDir = path.resolve('data/db');
if (fs.existsSync(dataDir)) {
  const lockFiles = ['mongod.lock', 'WiredTiger.lock'];
  for (const file of lockFiles) {
    const fullPath = path.join(dataDir, file);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch {
        // file might be locked, but process should already be killed above
      }
    }
  }
}

console.log('[CLEANUP] Environment is ready.');
