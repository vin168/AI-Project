const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/app-error');

module.exports = function auth(req, res, next) {
  const authorization = req.headers.authorization || '';
  const parts = authorization.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return next(new AppError('未登录或 token 缺失', 4003, 401));
  }

  try {
    const payload = jwt.verify(parts[1], env.jwtSecret);
    req.auth = payload;
    return next();
  } catch (error) {
    return next(new AppError('token 无效或已过期', 4003, 401));
  }
};