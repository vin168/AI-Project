const express = require('express');
const controller = require('../controllers/auth-controller');

const router = express.Router();

router.post('/wx-login', controller.wxLogin);

module.exports = router;