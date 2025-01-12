import sqlite3 from 'sqlite3';
import { DB_CONFIG } from '../config/index.js';
import { Transaction } from './database/Transaction.js';

class DatabaseService {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async connect() {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_CONFIG.filename, (err) => {
        if (err) {
          console.error('Database connection error:', err);
          reject(err);
        } else {
          console.log('Connected to database');
          resolve();
        }
      });
    });
  }

  async init() {
    if (this.initialized) return;

    try {
      await this.connect();
      
      // Create stakes table
      await this.run(`
        CREATE TABLE IF NOT EXISTS stakes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          wallet_address TEXT NOT NULL,
          amount DECIMAL(20,9) NOT NULL,
          signature TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create votes table
      await this.run(`
        CREATE TABLE IF NOT EXISTS votes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          wallet_address TEXT NOT NULL,
          token_address TEXT NOT NULL,
          token_name TEXT,
          token_symbol TEXT,
          staked_amount DECIMAL(20,9) NOT NULL,
          analysis_data TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create system_logs table
      await this.run(`
        CREATE TABLE IF NOT EXISTS system_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          message TEXT NOT NULL,
          related_id INTEGER,
          data TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create pending_transactions table
      await this.run(`
        CREATE TABLE IF NOT EXISTS pending_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          wallet_address TEXT NOT NULL,
          amount DECIMAL(20,9) NOT NULL,
          type TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          signature TEXT,
          created_at DATETIME NOT NULL,
          completed_at DATETIME,
          error TEXT
        )
      `);
      
      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  async run(sql, params = [], transaction = null) {
    const db = transaction?.db || this.db;
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  async get(sql, params = [], transaction = null) {
    const db = transaction?.db || this.db;
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async all(sql, params = [], transaction = null) {
    const db = transaction?.db || this.db;
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async close() {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.initialized = false;
            console.log('Database connection closed');
            resolve();
          }
        });
      });
    }
  }
}

// Create and export a single instance
export const dbService = new DatabaseService();