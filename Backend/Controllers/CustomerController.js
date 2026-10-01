const CustomerModel = require('../models/CustomerModel').default;
const CustomerService = require('../services/CustomerService');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const blackListTokenModel = require('../models/blackListTokenModel');

const createCustomerToken = (customer) => jwt.sign(
    { _id: customer._id },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
);

module.exports.registerCustomer = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, email, phone, password } = req.body;
        const existingCustomer = await CustomerModel.findOne({
            $or: [{ email }, { phone }],
        });

        if (existingCustomer) {
            return res.status(409).json({
                message: 'A customer with this email or phone already exists',
            });
        }

        const customer = await CustomerService.createCustomer({
            name,
            email,
            phone,
            password,
        });

        const token = createCustomerToken(customer);
        return res.status(201).json({ token, customer });
    } catch (error) {
        return next(error);
    }
};

module.exports.loginCustomer = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;
        const customer = await CustomerModel.findOne({ email }).select('+password');

        if (!customer || !(await customer.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!customer.isActive) {
            return res.status(403).json({ message: 'Customer account is inactive' });
        }

        const token = createCustomerToken(customer);
        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
        });

        return res.status(200).json({ token, customer });
    } catch (error) {
        return next(error);
    }
};

module.exports.getCustomerProfile = (req, res) => {
    return res.status(200).json(req.customer);
};

module.exports.logoutCustomer = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
        res.clearCookie('token');

        if (token) {
            await blackListTokenModel.create({ token });
        }

        return res.status(200).json({ message: 'Logged out' });
    } catch (error) {
        return next(error);
    }
};