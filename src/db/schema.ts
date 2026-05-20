// SQLite schema for collections and movie drafts. Holds only references
// to PHAsset localIdentifiers — never copies pixel data. See SPEC.md §5.

export const SCHEMA_VERSION = 1;

export const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS schema_meta (
     key TEXT PRIMARY KEY,
     value TEXT NOT NULL
   );`,

  `CREATE TABLE IF NOT EXISTS collections (
     id          TEXT PRIMARY KEY,
     name        TEXT NOT NULL,
     cover_asset TEXT,
     created_at  INTEGER NOT NULL,
     updated_at  INTEGER NOT NULL
   );`,

  `CREATE TABLE IF NOT EXISTS collection_items (
     collection_id TEXT NOT NULL,
     asset_id      TEXT NOT NULL,
     position      INTEGER NOT NULL,
     PRIMARY KEY (collection_id, asset_id),
     FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
   );`,

  `CREATE INDEX IF NOT EXISTS idx_collection_items_pos
     ON collection_items(collection_id, position);`,

  `CREATE TABLE IF NOT EXISTS movie_drafts (
     id          TEXT PRIMARY KEY,
     template_id TEXT NOT NULL,
     music_id    TEXT,
     asset_ids   TEXT NOT NULL,
     created_at  INTEGER NOT NULL
   );`,
];

export const DB_NAME = 'photo-app.db';
