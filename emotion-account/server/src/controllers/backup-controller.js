const asyncHandler = require('../utils/async-handler');
const { success } = require('../utils/response');
const AppError = require('../utils/app-error');
const backupService = require('../services/backup-service');

exports.fullBackup = asyncHandler(async (req, res) => {
  const { overwrite, payload, clientBackupTime } = req.body || {};

  if (!overwrite) {
    throw new AppError('当前版本仅支持覆盖式全量备份', 4001, 400);
  }

  const data = await backupService.overwriteFullBackup(req.auth.userId, payload || {}, clientBackupTime || null);
  return success(res, data);
});

exports.getFullBackup = asyncHandler(async (req, res) => {
  const data = await backupService.getFullBackup(req.auth.userId);
  return success(res, data);
});