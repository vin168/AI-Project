class AppError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'AppError';
    this.code = code || 5000;
    this.status = status || 500;
  }
}

module.exports = AppError;