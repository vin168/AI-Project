const asyncHandler = require('../utils/async-handler');
const { success } = require('../utils/response');
const backupService = require('../services/backup-service');

exports.pushChanges = asyncHandler(async (req, res) => {
  const { lastSyncTime, changes } = req.body || {};
  const data = await backupService.upsertIncrementalChanges(req.auth.userId, changes || {}, lastSyncTime || null);
  return success(res, data);
});

exports.pullChanges = asyncHandler(async (req, res) => {
  const data = await backupService.getIncrementalChanges(req.auth.userId, req.query.since || null);
  return success(res, data);
});