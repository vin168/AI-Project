const https = require('https');
const env = require('../config/env');
const AppError = require('../utils/app-error');

function requestJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw || '{}'));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on('error', reject);
  });
}

async function getSessionByCode(code) {
  if (!env.wechat.appId || !env.wechat.appSecret) {
    throw new AppError('微信登录配置缺失，请先设置 WX_APPID 和 WX_SECRET', 5000, 500);
  }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(env.wechat.appId)}&secret=${encodeURIComponent(env.wechat.appSecret)}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`;
  const result = await requestJson(url);

  if (!result.openid) {
    throw new AppError(result.errmsg || '微信登录失败', 4002, 400);
  }

  return result;
}

module.exports = {
  getSessionByCode
};