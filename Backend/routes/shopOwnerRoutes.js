const express = require('express');
const {
    registerShopOwner,
    loginShopOwner,
    logoutShopOwner,
    getShopOwnerProfile,
} = require('../controllers/shopOwnerController');
const { authShopOwner } = require('../Middlewares/authMiddleware');

const router = express.Router();

router.post('/register', registerShopOwner);
router.post('/login', loginShopOwner);
router.post('/logout', authShopOwner, logoutShopOwner);
router.get('/me', authShopOwner, getShopOwnerProfile);

module.exports = router;