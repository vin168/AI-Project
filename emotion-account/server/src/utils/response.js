function success(res, data, message) {
  return res.json({
    code: 0,
    message: message || 'ok',
    data: data || {}
  });
}

module.exports = {
  success
};