const express = require('express');
const { body } = require('express-validator');
const customerController = require('../Controllers/CustomerController');
const authMiddleware = require('../Middlewares/authMiddleware');

const router = express.Router();

router.post('/register', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
], customerController.registerCustomer);

router.post('/login', [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
], customerController.loginCustomer);

router.get('/profile', authMiddleware.authCustomer, customerController.getCustomerProfile);
router.post('/logout', authMiddleware.authCustomer, customerController.logoutCustomer);

module.exports = router;