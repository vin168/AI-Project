const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const env = require('../config/env');

async function upsertUserByWechatSession(session, userProfile, device) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      'SELECT id FROM users WHERE openid = ? LIMIT 1',
      [session.openid]
    );

    const profile = userProfile || {};
    let userId;

    if (rows.length > 0) {
      userId = rows[0].id;
      await connection.execute(
        `UPDATE users
         SET unionid = ?, nickname = ?, avatar_url = ?, gender = ?, country = ?, province = ?, city = ?, auth_status = ?, last_login_at = NOW()
         WHERE id = ?`,
        [
          session.unionid || null,
          profile.nickname || null,
          profile.avatarUrl || null,
          Number(profile.gender || 0),
          profile.country || null,
          profile.province || null,
          profile.city || null,
          profile.nickname || profile.avatarUrl ? 1 : 0,
          userId
        ]
      );
    } else {
      const [result] = await connection.execute(
        `INSERT INTO users (openid, unionid, nickname, avatar_url, gender, country, province, city, auth_status, last_login_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          session.openid,
          session.unionid || null,
          profile.nickname || null,
          profile.avatarUrl || null,
          Number(profile.gender || 0),
          profile.country || null,
          profile.province || null,
          profile.city || null,
          profile.nickname || profile.avatarUrl ? 1 : 0
        ]
      );
      userId = result.insertId;
    }

    if (device && device.deviceCode) {
      await connection.execute(
        `INSERT INTO user_devices (user_id, device_code, device_name, platform, last_active_at)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE device_name = VALUES(device_name), platform = VALUES(platform), last_active_at = NOW()`,
        [userId, device.deviceCode, device.deviceName || null, device.platform || null]
      );
    }

    await connection.commit();

    const token = jwt.sign(
      { userId, openid: session.openid },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    return {
      userId,
      openid: session.openid,
      accessToken: token,
      expiresIn: env.jwtExpiresIn,
      profile: {
        nickname: profile.nickname || '',
        avatarUrl: profile.avatarUrl || '',
        authStatus: profile.nickname || profile.avatarUrl ? 1 : 0
      }
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  upsertUserByWechatSession
};