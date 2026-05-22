module.exports = function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const code = err.code || 5000;

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    code,
    message: err.message || '服务器异常',
    data: {}
  });
};