const express = require('express');
const {
    registerShopOwner,
    loginShopOwner,
    logoutShopOwner,
    getShopOwnerProfile,
} = require('../controllers/shopOwnerController');
const {
    getShopOwnerPayment,
    updateShopOwnerPayment,
} = require('../Controllers/paymentController');
const { authShopOwner } = require('../Middlewares/authMiddleware');

const router = express.Router();

router.post('/register', registerShopOwner);
router.post('/login', loginShopOwner);
router.post('/logout', authShopOwner, logoutShopOwner);
router.get('/me', authShopOwner, getShopOwnerProfile);
router.get('/payment', authShopOwner, getShopOwnerPayment);
router.patch('/payment', authShopOwner, updateShopOwnerPayment);

module.exports = router;