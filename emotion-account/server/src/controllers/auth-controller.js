const asyncHandler = require('../utils/async-handler');
const { success } = require('../utils/response');
const AppError = require('../utils/app-error');
const { getSessionByCode } = require('../services/wechat-service');
const { upsertUserByWechatSession } = require('../services/user-service');

exports.wxLogin = asyncHandler(async (req, res) => {
  const { code, userProfile, device } = req.body || {};

  if (!code) {
    throw new AppError('code 不能为空', 4001, 400);
  }

  const session = await getSessionByCode(code);
  const result = await upsertUserByWechatSession(session, userProfile, device);
  return success(res, result);
});