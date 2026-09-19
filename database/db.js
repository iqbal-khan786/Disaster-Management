import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'disaster_management.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Initialize SQLite Database instance
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('[DB] Connection Error:', err.message);
  } else {
    console.log(`[DB] ✅ SQLite Database connected at: ${DB_PATH}`);
    initSchema();
  }
});

// Run Schema SQL on startup
function initSchema() {
  if (fs.existsSync(SCHEMA_PATH)) {
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schemaSql, (err) => {
      if (err) {
        console.error('[DB] Error executing schema:', err.message);
      } else {
        console.log('[DB] ✅ Database Schema & Rayagada Seed Data Initialized.');
      }
    });
  }
}

// Promise-based query helpers
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const getOne = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export default db;
