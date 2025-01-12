import sqlite3 from 'sqlite3';

export class Transaction {
  constructor(db) {
    this.db = db;
    this.isActive = false;
  }

  async begin() {
    if (this.isActive) {
      throw new Error('Transaction already active');
    }

    return new Promise((resolve, reject) => {
      this.db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          reject(err);
        } else {
          this.isActive = true;
          resolve();
        }
      });
    });
  }

  async commit() {
    if (!this.isActive) {
      throw new Error('No active transaction');
    }

    return new Promise((resolve, reject) => {
      this.db.run('COMMIT', (err) => {
        if (err) {
          reject(err);
        } else {
          this.isActive = false;
          resolve();
        }
      });
    });
  }

  async rollback() {
    if (!this.isActive) {
      throw new Error('No active transaction');
    }

    return new Promise((resolve, reject) => {
      this.db.run('ROLLBACK', (err) => {
        if (err) {
          reject(err);
        } else {
          this.isActive = false;
          resolve();
        }
      });
    });
  }
}