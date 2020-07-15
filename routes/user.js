const express = require('express');
const router = express.Router();
const { read, update } = require('../controllers/user');
const { requireSignin, adminMiddlware } = require('../controllers/auth');

router.get('/user/:id', requireSignin, read);
router.put('/user/update', requireSignin, update); // we don't need id for update as we get it from requireSignin middleware
router.put('/admin/update', requireSignin, adminMiddlware, update); // we don't need id for update as we get it from requireSignin middleware
module.exports = router;
