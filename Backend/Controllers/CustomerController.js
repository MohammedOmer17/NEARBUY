const CustomerModel = require('../models/CustomerModel');
const CustomerService = require('../services/CustomerService');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const blackListTokenModel = require('../models/blackListTokenModel');

const validateLocationPayload = (latitude, longitude) => {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return { valid: false, message: 'Latitude and longitude must be valid numbers' };
    }

    if (lat < -90 || lat > 90) {
        return { valid: false, message: 'Latitude must be between -90 and 90' };
    }

    if (lng < -180 || lng > 180) {
        return { valid: false, message: 'Longitude must be between -180 and 180' };
    }

    return {
        valid: true,
        location: {
            latitude: lat,
            longitude: lng,
        },
    };
};

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

module.exports.getCustomerLocation = async (req, res) => {
    try {
        const customer = await CustomerModel.findById(req.user._id);

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        return res.status(200).json({
            success: true,
            location: customer.location || null,
            locationUpdatedAt: customer.locationUpdatedAt || null,
        });
    } catch (error) {
        console.error('Fetch customer location failed:', error);
        return res.status(500).json({ success: false, message: 'Unable to retrieve customer location' });
    }
};

module.exports.updateCustomerLocation = async (req, res) => {
    const { latitude, longitude } = req.body;
    const validation = validateLocationPayload(latitude, longitude);

    if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.message });
    }

    try {
        const customer = await CustomerModel.findById(req.user._id);

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        customer.location = validation.location;
        customer.locationUpdatedAt = new Date();
        await customer.save();

        return res.status(200).json({
            success: true,
            message: 'Customer location updated successfully',
            location: customer.location,
            locationUpdatedAt: customer.locationUpdatedAt,
        });
    } catch (error) {
        console.error('Update customer location failed:', error);
        return res.status(500).json({ success: false, message: 'Unable to update customer location' });
    }
};