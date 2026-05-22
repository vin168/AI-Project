const express = require('express');
const auth = require('../middlewares/auth');
const controller = require('../controllers/sync-controller');

const router = express.Router();

router.use(auth);
router.post('/push', controller.pushChanges);
router.get('/pull', controller.pullChanges);

module.exports = router;