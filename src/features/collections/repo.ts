import { getDB } from '@/db/client';

export type Collection = {
  id: string;
  name: string;
  coverAsset: string | null;
  createdAt: number;
  updatedAt: number;
  itemCount: number;
};

export type CollectionItem = {
  collectionId: string;
  assetId: string;
  position: number;
};

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function listCollections(): Promise<Collection[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    cover_asset: string | null;
    created_at: number;
    updated_at: number;
    item_count: number;
  }>(
    `SELECT c.id, c.name, c.cover_asset, c.created_at, c.updated_at,
            (SELECT COUNT(*) FROM collection_items WHERE collection_id = c.id) AS item_count
     FROM collections c
     ORDER BY c.updated_at DESC;`,
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    coverAsset: r.cover_asset,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    itemCount: r.item_count,
  }));
}

export async function getCollection(id: string): Promise<Collection | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    cover_asset: string | null;
    created_at: number;
    updated_at: number;
    item_count: number;
  }>(
    `SELECT c.id, c.name, c.cover_asset, c.created_at, c.updated_at,
            (SELECT COUNT(*) FROM collection_items WHERE collection_id = c.id) AS item_count
     FROM collections c
     WHERE c.id = ?;`,
    [id],
  );
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    coverAsset: row.cover_asset,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    itemCount: row.item_count,
  };
}

export async function createCollection(name: string): Promise<Collection> {
  const db = await getDB();
  const id = uid();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO collections(id, name, cover_asset, created_at, updated_at) VALUES (?, ?, NULL, ?, ?);`,
    [id, name, now, now],
  );
  return { id, name, coverAsset: null, createdAt: now, updatedAt: now, itemCount: 0 };
}

export async function renameCollection(id: string, name: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(`UPDATE collections SET name = ?, updated_at = ? WHERE id = ?;`, [
    name,
    Date.now(),
    id,
  ]);
}

export async function deleteCollection(id: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(`DELETE FROM collections WHERE id = ?;`, [id]);
}

export async function addAssetsToCollection(
  collectionId: string,
  assetIds: string[],
): Promise<number> {
  if (assetIds.length === 0) return 0;
  const db = await getDB();
  const currentMax = await db.getFirstAsync<{ max_pos: number | null }>(
    `SELECT MAX(position) AS max_pos FROM collection_items WHERE collection_id = ?;`,
    [collectionId],
  );
  let position = (currentMax?.max_pos ?? -1) + 1;
  let added = 0;
  for (const assetId of assetIds) {
    const result = await db.runAsync(
      `INSERT OR IGNORE INTO collection_items(collection_id, asset_id, position) VALUES (?, ?, ?);`,
      [collectionId, assetId, position],
    );
    if (result.changes > 0) {
      added += 1;
      position += 1;
    }
  }
  await db.runAsync(
    `UPDATE collections
       SET updated_at = ?,
           cover_asset = COALESCE(cover_asset, ?)
     WHERE id = ?;`,
    [Date.now(), assetIds[0] ?? null, collectionId],
  );
  return added;
}

export async function removeAssetFromCollection(
  collectionId: string,
  assetId: string,
): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `DELETE FROM collection_items WHERE collection_id = ? AND asset_id = ?;`,
    [collectionId, assetId],
  );
  await db.runAsync(`UPDATE collections SET updated_at = ? WHERE id = ?;`, [
    Date.now(),
    collectionId,
  ]);
}

export async function listCollectionItems(collectionId: string): Promise<string[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{ asset_id: string }>(
    `SELECT asset_id FROM collection_items WHERE collection_id = ? ORDER BY position ASC;`,
    [collectionId],
  );
  return rows.map((r) => r.asset_id);
}
