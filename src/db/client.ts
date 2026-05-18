import * as SQLite from 'expo-sqlite';
import { DB_NAME, MIGRATIONS, SCHEMA_VERSION } from './schema';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function init(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync('PRAGMA journal_mode = WAL;');

  for (const stmt of MIGRATIONS) {
    await db.execAsync(stmt);
  }
  await db.runAsync(
    `INSERT OR REPLACE INTO schema_meta(key, value) VALUES (?, ?);`,
    ['version', String(SCHEMA_VERSION)],
  );
  return db;
}

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  if (!initPromise) {
    initPromise = init().then((db) => {
      dbInstance = db;
      return db;
    });
  }
  return initPromise;
}
