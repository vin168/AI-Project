const apiConfig = require('../config/api');

const STORAGE_KEYS = {
  accessToken: 'cloudAccessToken',
  authInfo: 'cloudAuthInfo',
  deviceCode: 'cloudDeviceCode',
  lastBackupTime: 'cloudLastBackupTime',
  wechatProfile: 'cloudBackupWechatProfile'
};

function nowIso() {
  return new Date().toISOString();
}

function getDeviceCode() {
  try {
    const existing = wx.getStorageSync(STORAGE_KEYS.deviceCode);
    if (existing) {
      return existing;
    }
  } catch (e) {
    // ignore
  }

  const deviceCode = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  try {
    wx.setStorageSync(STORAGE_KEYS.deviceCode, deviceCode);
  } catch (e) {
    // ignore
  }
  return deviceCode;
}

function buildDevicePayload() {
  let systemInfo = null;
  try {
    systemInfo = wx.getSystemInfoSync();
  } catch (e) {
    systemInfo = null;
  }

  return {
    deviceCode: getDeviceCode(),
    deviceName: systemInfo ? `${systemInfo.brand || ''} ${systemInfo.model || ''}`.trim() : null,
    platform: systemInfo ? systemInfo.platform : null
  };
}

function getStoredAccessToken() {
  try {
    return wx.getStorageSync(STORAGE_KEYS.accessToken) || '';
  } catch (e) {
    return '';
  }
}

function setStoredAuth(authResult) {
  if (!authResult) {
    return;
  }

  try {
    if (authResult.accessToken) {
      wx.setStorageSync(STORAGE_KEYS.accessToken, authResult.accessToken);
    }
    wx.setStorageSync(STORAGE_KEYS.authInfo, authResult);
  } catch (e) {
    // ignore
  }
}

function clearStoredAuth() {
  try {
    wx.removeStorageSync(STORAGE_KEYS.accessToken);
    wx.removeStorageSync(STORAGE_KEYS.authInfo);
  } catch (e) {
    // ignore
  }
}

function request(options) {
  const baseUrl = apiConfig.baseUrl;
  const timeout = apiConfig.requestTimeout || 15000;

  // 添加默认header
  const defaultHeader = {
    'Content-Type': 'application/json'
  };
  const header = Object.assign({}, defaultHeader, options.header || {});

  return new Promise((resolve, reject) => {
    // 打印请求日志
    console.log('🔍 [API请求]', {
      url: `${baseUrl}${options.path}`,
      method: options.method || 'GET',
      data: options.data || {},
      header: header,
      timeout: timeout
    });

    wx.request({
      url: `${baseUrl}${options.path}`,
      method: options.method || 'GET',
      data: options.data || {},
      timeout: timeout,
      header: header,
      success: (res) => {
        // 打印响应日志
        console.log('✅ [API响应]', {
          url: `${baseUrl}${options.path}`,
          statusCode: res.statusCode,
          data: res.data,
          header: res.header
        });

        const statusCode = res.statusCode;
        const body = res.data || {};

        if (statusCode < 200 || statusCode >= 300) {
          reject({
            kind: 'http',
            statusCode,
            body
          });
          return;
        }

        if (!body || typeof body.code !== 'number') {
          reject({
            kind: 'protocol',
            statusCode,
            body
          });
          return;
        }

        if (body.code !== 0) {
          reject({
            kind: 'api',
            statusCode,
            body
          });
          return;
        }

        resolve(body.data);
      },
      fail: (err) => {
        // 打印失败日志
        console.log('❌ [API失败]', {
          url: `${baseUrl}${options.path}`,
          error: err,
          errMsg: err.errMsg || '未知错误'
        });

        reject({
          kind: 'network',
          error: err
        });
      }
    });
  });
}

function authedRequest(options) {
  const token = getStoredAccessToken();
  const header = Object.assign({}, options.header || {});

  if (token) {
    header.Authorization = `Bearer ${token}`;
  }

  return request(Object.assign({}, options, { header }));
}

function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      timeout: 8000,
      success: (res) => {
        if (res && res.code) {
          resolve(res.code);
          return;
        }
        reject(new Error('wx.login 未返回 code'));
      },
      fail: (err) => reject(err)
    });
  });
}

function normalizeUserProfile(userInfo) {
  const info = userInfo || {};
  return {
    nickname: info.nickName || '',
    avatarUrl: info.avatarUrl || '',
    gender: Number(info.gender || 0),
    country: info.country || '',
    province: info.province || '',
    city: info.city || ''
  };
}

function cloudWxLogin(userInfo) {
  return wxLogin().then((code) => {
    return request({
      method: 'POST',
      path: '/auth/wx-login',
      data: {
        code,
        userProfile: userInfo ? normalizeUserProfile(userInfo) : null,
        device: buildDevicePayload()
      }
    });
  }).then((authResult) => {
    setStoredAuth(authResult);
    return authResult;
  });
}

function buildFullBackupPayload() {
  const recordsRaw = wx.getStorageSync('accountRecords');
  const records = Array.isArray(recordsRaw) ? recordsRaw : [];

  const customExpenseRaw = wx.getStorageSync('customExpenseCategories');
  const customIncomeRaw = wx.getStorageSync('customIncomeCategories');
  const customExpense = Array.isArray(customExpenseRaw) ? customExpenseRaw : [];
  const customIncome = Array.isArray(customIncomeRaw) ? customIncomeRaw : [];

  const customEmotionsRaw = wx.getStorageSync('customEmotions');
  const customEmotions = Array.isArray(customEmotionsRaw) ? customEmotionsRaw : [];

  const now = nowIso();

  const mappedRecords = records.map((item) => ({
    clientRecordId: item.id || null,
    recordType: item.type === 'income' ? 2 : 1,
    amount: Number(item.amount || 0),
    categoryId: Number(item.categoryId),
    emotionId: item.emotionId ? Number(item.emotionId) : null,
    note: item.note || null,
    occurredAt: item.createdAt || item.updatedAt || now,
    syncVersion: 1,
    isDeleted: 0,
    updatedAt: item.updatedAt || item.createdAt || now
  }));

  const mappedCategories = customExpense.map((item) => ({
    id: item.id,
    categoryType: 1,
    name: item.name,
    icon: item.icon || null,
    updatedAt: item.updatedAt || now
  })).concat(customIncome.map((item) => ({
    id: item.id,
    categoryType: 2,
    name: item.name,
    icon: item.icon || null,
    updatedAt: item.updatedAt || now
  })));

  const mappedEmotions = customEmotions.map((item) => ({
    id: item.id,
    emotionType: item.type === 'income' ? 2 : 1,
    name: item.name,
    icon: item.icon || null,
    color: item.color || null,
    description: item.desc || item.description || null,
    updatedAt: item.updatedAt || now
  }));

  const monthlyBudgetValue = Number(wx.getStorageSync('monthlyBudget') || 0);
  const budgets = [];
  if (monthlyBudgetValue > 0) {
    const date = new Date();
    budgets.push({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      budgetAmount: monthlyBudgetValue,
      updatedAt: now
    });
  }

  return {
    records: mappedRecords,
    customCategories: mappedCategories,
    customEmotions: mappedEmotions,
    budgets
  };
}

function cloudFullBackup() {
  const clientBackupTime = nowIso();
  const payload = buildFullBackupPayload();

  return authedRequest({
    method: 'POST',
    path: '/backup/full',
    data: {
      overwrite: true,
      payload,
      clientBackupTime
    }
  }).then((result) => {
    try {
      wx.setStorageSync(STORAGE_KEYS.lastBackupTime, clientBackupTime);
    } catch (e) {
      // ignore
    }
    return result;
  });
}

function pickBudgetForApp(budgets) {
  const list = Array.isArray(budgets) ? budgets : [];
  if (list.length === 0) {
    return 0;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const current = list.find((b) => Number(b.year) === currentYear && Number(b.month) === currentMonth);
  if (current) {
    return Number(current.budgetAmount || 0);
  }

  // fallback: choose the newest by (year, month)
  const sorted = list.slice().sort((a, b) => {
    const ay = Number(a.year) || 0;
    const am = Number(a.month) || 0;
    const by = Number(b.year) || 0;
    const bm = Number(b.month) || 0;

    if (ay !== by) {
      return by - ay;
    }
    return bm - am;
  });

  return Number(sorted[0].budgetAmount || 0);
}

function applyFullBackupToLocalStorage(payload) {
  const safePayload = payload || {};
  const records = Array.isArray(safePayload.records) ? safePayload.records : [];
  const customCategories = Array.isArray(safePayload.customCategories) ? safePayload.customCategories : [];
  const customEmotions = Array.isArray(safePayload.customEmotions) ? safePayload.customEmotions : [];
  const budgets = Array.isArray(safePayload.budgets) ? safePayload.budgets : [];

  const mappedRecords = records.map((item) => ({
    id: item.clientRecordId || `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    amount: Number(item.amount || 0),
    type: Number(item.recordType) === 2 ? 'income' : 'expense',
    createdAt: item.occurredAt,
    categoryId: Number(item.categoryId),
    emotionId: item.emotionId ? Number(item.emotionId) : null,
    note: item.note || null,
    updatedAt: item.updatedAt || item.occurredAt
  }));

  const expenseCategories = [];
  const incomeCategories = [];
  for (const item of customCategories) {
    const mapped = {
      id: item.id,
      name: item.name,
      icon: item.icon || '',
      type: Number(item.categoryType) === 2 ? 'income' : 'expense',
      updatedAt: item.updatedAt
    };

    if (Number(item.categoryType) === 2) {
      incomeCategories.push(mapped);
    } else {
      expenseCategories.push(mapped);
    }
  }

  const mappedEmotions = customEmotions.map((item) => ({
    id: item.id,
    name: item.name,
    type: Number(item.emotionType) === 2 ? 'income' : 'expense',
    icon: item.icon || '🎯',
    color: item.color || '#F7A6B2',
    desc: item.description || '',
    updatedAt: item.updatedAt
  }));

  wx.setStorageSync('accountRecords', mappedRecords);
  wx.setStorageSync('customExpenseCategories', expenseCategories);
  wx.setStorageSync('customIncomeCategories', incomeCategories);
  wx.setStorageSync('customEmotions', mappedEmotions);

  const budgetValue = pickBudgetForApp(budgets);
  wx.setStorageSync('monthlyBudget', budgetValue);
}

function cloudFullRestore() {
  return authedRequest({
    method: 'GET',
    path: '/backup/full'
  }).then((data) => {
    const payload = data && data.payload ? data.payload : {};
    applyFullBackupToLocalStorage(payload);
    return data;
  });
}

function getCloudStatus() {
  const token = getStoredAccessToken();

  let lastBackupTime = '';
  try {
    lastBackupTime = wx.getStorageSync(STORAGE_KEYS.lastBackupTime) || '';
  } catch (e) {
    lastBackupTime = '';
  }

  let profile = null;
  try {
    profile = wx.getStorageSync(STORAGE_KEYS.wechatProfile) || null;
  } catch (e) {
    profile = null;
  }

  return {
    isLoggedIn: !!token,
    accessToken: token,
    lastBackupTime,
    wechatProfile: profile
  };
}

function saveWechatProfileForDisplay(userInfo) {
  try {
    wx.setStorageSync(STORAGE_KEYS.wechatProfile, userInfo);
  } catch (e) {
    // ignore
  }
}

module.exports = {
  STORAGE_KEYS,
  getCloudStatus,
  cloudWxLogin,
  cloudFullBackup,
  cloudFullRestore,
  clearStoredAuth,
  saveWechatProfileForDisplay
};
