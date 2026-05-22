const express = require('express');
const auth = require('../middlewares/auth');
const controller = require('../controllers/backup-controller');

const router = express.Router();

router.use(auth);
router.post('/full', controller.fullBackup);
router.get('/full', controller.getFullBackup);

module.exports = router;