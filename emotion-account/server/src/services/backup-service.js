const pool = require('../config/db');

function toRecordRow(userId, item) {
  return [
    userId,
    item.clientRecordId || null,
    Number(item.recordType),
    item.amount,
    Number(item.categoryId),
    item.emotionId ? Number(item.emotionId) : null,
    item.note || null,
    item.occurredAt,
    1,
    Number(item.syncVersion || 1),
    Number(item.isDeleted || 0),
    Number(item.isDeleted || 0) ? (item.updatedAt || item.occurredAt) : null,
    item.updatedAt || item.occurredAt
  ];
}

function toCategoryRow(userId, item) {
  return [
    Number(item.id),
    userId,
    Number(item.categoryType),
    item.name,
    item.icon || null,
    0,
    0,
    1,
    item.updatedAt || new Date()
  ];
}

function toEmotionRow(userId, item) {
  return [
    Number(item.id),
    userId,
    Number(item.emotionType),
    item.name,
    item.icon || null,
    item.color || null,
    item.description || null,
    0,
    0,
    1,
    item.updatedAt || new Date()
  ];
}

function toBudgetRow(userId, item) {
  return [
    userId,
    Number(item.year),
    Number(item.month),
    item.budgetAmount,
    item.updatedAt || new Date()
  ];
}

async function logSync(connection, userId, syncType, recordCount, status, errorMessage, clientTime) {
  await connection.execute(
    `INSERT INTO sync_logs (user_id, sync_type, client_time, record_count, status, error_message)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, syncType, clientTime || null, recordCount || 0, status, errorMessage || null]
  );
}

async function overwriteFullBackup(userId, payload, clientBackupTime) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute('DELETE FROM account_records WHERE user_id = ?', [userId]);
    await connection.execute('DELETE FROM monthly_budgets WHERE user_id = ?', [userId]);
    await connection.execute('DELETE FROM categories WHERE user_id = ? AND is_system = 0', [userId]);
    await connection.execute('DELETE FROM emotions WHERE user_id = ? AND is_system = 0', [userId]);

    const records = Array.isArray(payload.records) ? payload.records : [];
    const customCategories = Array.isArray(payload.customCategories) ? payload.customCategories : [];
    const customEmotions = Array.isArray(payload.customEmotions) ? payload.customEmotions : [];
    const budgets = Array.isArray(payload.budgets) ? payload.budgets : [];

    for (const item of customCategories) {
      await connection.execute(
        `INSERT INTO categories (id, user_id, category_type, name, icon, is_system, sort_no, status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        toCategoryRow(userId, item)
      );
    }

    for (const item of customEmotions) {
      await connection.execute(
        `INSERT INTO emotions (id, user_id, emotion_type, name, icon, color, description, is_system, sort_no, status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        toEmotionRow(userId, item)
      );
    }

    for (const item of budgets) {
      await connection.execute(
        `INSERT INTO monthly_budgets (user_id, budget_year, budget_month, budget_amount, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        toBudgetRow(userId, item)
      );
    }

    for (const item of records) {
      await connection.execute(
        `INSERT INTO account_records
         (user_id, client_record_id, record_type, amount, category_id, emotion_id, note, occurred_at, source, sync_version, is_deleted, deleted_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        toRecordRow(userId, item)
      );
    }

    await logSync(connection, userId, 1, records.length, 1, null, clientBackupTime);
    await connection.commit();

    return {
      serverTime: new Date().toISOString(),
      recordCount: records.length,
      categoryCount: customCategories.length,
      emotionCount: customEmotions.length,
      budgetCount: budgets.length
    };
  } catch (error) {
    await connection.rollback();
    try {
      await logSync(connection, userId, 1, 0, 2, error.message, clientBackupTime);
    } catch (logError) {
      console.error(logError);
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function getFullBackup(userId) {
  const [records] = await pool.execute(
    `SELECT client_record_id, record_type, amount, category_id, emotion_id, note, occurred_at, sync_version, is_deleted, updated_at
     FROM account_records WHERE user_id = ? ORDER BY occurred_at DESC`,
    [userId]
  );
  const [customCategories] = await pool.execute(
    `SELECT id, category_type, name, icon, updated_at
     FROM categories WHERE user_id = ? AND is_system = 0 ORDER BY id ASC`,
    [userId]
  );
  const [customEmotions] = await pool.execute(
    `SELECT id, emotion_type, name, icon, color, description, updated_at
     FROM emotions WHERE user_id = ? AND is_system = 0 ORDER BY id ASC`,
    [userId]
  );
  const [budgets] = await pool.execute(
    `SELECT budget_year, budget_month, budget_amount, updated_at
     FROM monthly_budgets WHERE user_id = ? ORDER BY budget_year DESC, budget_month DESC`,
    [userId]
  );

  return {
    serverTime: new Date().toISOString(),
    payload: {
      records: records.map((item) => ({
        clientRecordId: item.client_record_id,
        recordType: item.record_type,
        amount: item.amount,
        categoryId: item.category_id,
        emotionId: item.emotion_id,
        note: item.note,
        occurredAt: item.occurred_at,
        syncVersion: item.sync_version,
        isDeleted: item.is_deleted,
        updatedAt: item.updated_at
      })),
      customCategories: customCategories.map((item) => ({
        id: item.id,
        categoryType: item.category_type,
        name: item.name,
        icon: item.icon,
        updatedAt: item.updated_at
      })),
      customEmotions: customEmotions.map((item) => ({
        id: item.id,
        emotionType: item.emotion_type,
        name: item.name,
        icon: item.icon,
        color: item.color,
        description: item.description,
        updatedAt: item.updated_at
      })),
      budgets: budgets.map((item) => ({
        year: item.budget_year,
        month: item.budget_month,
        budgetAmount: item.budget_amount,
        updatedAt: item.updated_at
      }))
    }
  };
}

async function upsertIncrementalChanges(userId, changes, lastSyncTime) {
  const connection = await pool.getConnection();
  const records = Array.isArray(changes.records) ? changes.records : [];
  const customCategories = Array.isArray(changes.customCategories) ? changes.customCategories : [];
  const customEmotions = Array.isArray(changes.customEmotions) ? changes.customEmotions : [];
  const budgets = Array.isArray(changes.budgets) ? changes.budgets : [];

  try {
    await connection.beginTransaction();

    for (const item of customCategories) {
      await connection.execute(
        `INSERT INTO categories (id, user_id, category_type, name, icon, is_system, sort_no, status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), icon = VALUES(icon), updated_at = VALUES(updated_at), status = VALUES(status)`,
        toCategoryRow(userId, item)
      );
    }

    for (const item of customEmotions) {
      await connection.execute(
        `INSERT INTO emotions (id, user_id, emotion_type, name, icon, color, description, is_system, sort_no, status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), icon = VALUES(icon), color = VALUES(color), description = VALUES(description), updated_at = VALUES(updated_at), status = VALUES(status)`,
        toEmotionRow(userId, item)
      );
    }

    for (const item of budgets) {
      await connection.execute(
        `INSERT INTO monthly_budgets (user_id, budget_year, budget_month, budget_amount, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE budget_amount = VALUES(budget_amount), updated_at = VALUES(updated_at)`,
        toBudgetRow(userId, item)
      );
    }

    for (const item of records) {
      await connection.execute(
        `INSERT INTO account_records
         (user_id, client_record_id, record_type, amount, category_id, emotion_id, note, occurred_at, source, sync_version, is_deleted, deleted_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           record_type = VALUES(record_type),
           amount = VALUES(amount),
           category_id = VALUES(category_id),
           emotion_id = VALUES(emotion_id),
           note = VALUES(note),
           occurred_at = VALUES(occurred_at),
           sync_version = GREATEST(sync_version, VALUES(sync_version)),
           is_deleted = VALUES(is_deleted),
           deleted_at = VALUES(deleted_at),
           updated_at = VALUES(updated_at)`,
        toRecordRow(userId, item)
      );
    }

    await logSync(connection, userId, 2, records.length, 1, null, lastSyncTime);
    await connection.commit();

    return {
      serverTime: new Date().toISOString(),
      accepted: {
        records: records.length,
        customCategories: customCategories.length,
        customEmotions: customEmotions.length,
        budgets: budgets.length
      }
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getIncrementalChanges(userId, since) {
  const sinceValue = since || '1970-01-01 00:00:00';
  const [records] = await pool.execute(
    `SELECT client_record_id, record_type, amount, category_id, emotion_id, note, occurred_at, sync_version, is_deleted, updated_at
     FROM account_records WHERE user_id = ? AND updated_at > ? ORDER BY updated_at ASC`,
    [userId, sinceValue]
  );
  const [customCategories] = await pool.execute(
    `SELECT id, category_type, name, icon, updated_at
     FROM categories WHERE user_id = ? AND is_system = 0 AND updated_at > ? ORDER BY updated_at ASC`,
    [userId, sinceValue]
  );
  const [customEmotions] = await pool.execute(
    `SELECT id, emotion_type, name, icon, color, description, updated_at
     FROM emotions WHERE user_id = ? AND is_system = 0 AND updated_at > ? ORDER BY updated_at ASC`,
    [userId, sinceValue]
  );
  const [budgets] = await pool.execute(
    `SELECT budget_year, budget_month, budget_amount, updated_at
     FROM monthly_budgets WHERE user_id = ? AND updated_at > ? ORDER BY updated_at ASC`,
    [userId, sinceValue]
  );

  return {
    serverTime: new Date().toISOString(),
    changes: {
      records: records.map((item) => ({
        clientRecordId: item.client_record_id,
        recordType: item.record_type,
        amount: item.amount,
        categoryId: item.category_id,
        emotionId: item.emotion_id,
        note: item.note,
        occurredAt: item.occurred_at,
        syncVersion: item.sync_version,
        isDeleted: item.is_deleted,
        updatedAt: item.updated_at
      })),
      customCategories: customCategories.map((item) => ({
        id: item.id,
        categoryType: item.category_type,
        name: item.name,
        icon: item.icon,
        updatedAt: item.updated_at
      })),
      customEmotions: customEmotions.map((item) => ({
        id: item.id,
        emotionType: item.emotion_type,
        name: item.name,
        icon: item.icon,
        color: item.color,
        description: item.description,
        updatedAt: item.updated_at
      })),
      budgets: budgets.map((item) => ({
        year: item.budget_year,
        month: item.budget_month,
        budgetAmount: item.budget_amount,
        updatedAt: item.updated_at
      }))
    }
  };
}

module.exports = {
  overwriteFullBackup,
  getFullBackup,
  upsertIncrementalChanges,
  getIncrementalChanges
};