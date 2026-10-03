const CustomerModel = require('../models/CustomerModel');
const jwt = require('jsonwebtoken');
const blackListTokenModel = require('../models/blackListTokenModel');
const ShopOwner = require('../models/ShopOwnerModel');
const Captain = require('../models/CaptainModel');

module.exports.authCustomer = async (req, res, next) => {

    const token =
        req.cookies?.token ||
        req.headers.authorization?.split(' ')[1];

    // Check if token exists
    if (!token) {
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }

    // Check if token is blacklisted
    const isBlacklisted = await blackListTokenModel.findOne({
        token: token
    });

    if (isBlacklisted) {
        return res.status(401).json({
            message: 'Unauthorized'
        });
    }

    try {

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const customer = await CustomerModel.findById(decoded._id);

        if (!customer) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.customer = customer;
        req.user = customer;

        // Continue to the next middleware/controller
        next();

    } catch (err) {

        return res.status(401).json({
            message: 'Unauthorized'
        });
    }
};

module.exports.authShopOwner = async (req, res, next) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }

    try {
        const isBlacklisted = await blackListTokenModel.exists({ token });
        if (isBlacklisted) {
            return res.status(401).json({ message: 'Token has been revoked' });
        }

        const shopOwner = await ShopOwner.findById(decoded._id);
        if (!shopOwner) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = shopOwner;
        return next();
    } catch (error) {
        return next(error);
    }
};

module.exports.authCaptain = async (req, res, next) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    if (decoded.role && decoded.role !== 'captain') {
        return res.status(401).json({ success: false, message: 'Unauthorized captain access' });
    }

    try {
        const isBlacklisted = await blackListTokenModel.exists({ token });
        if (isBlacklisted) {
            return res.status(401).json({ success: false, message: 'Token has been revoked' });
        }

        const captain = await Captain.findById(decoded._id || decoded.id);
        if (!captain) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!captain.isActive) {
            return res.status(403).json({ success: false, message: 'Captain account is inactive' });
        }

        req.user = captain;
        req.captain = captain;
        return next();
    } catch (error) {
        return next(error);
    }
};

module.exports.authAnyUser = async (req, res, next) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    try {
        const isBlacklisted = await blackListTokenModel.exists({ token });
        if (isBlacklisted) {
            return res.status(401).json({ success: false, message: 'Token has been revoked' });
        }

        const customer = await CustomerModel.findById(decoded._id || decoded.id);
        if (customer) {
            req.user = customer;
            req.userRole = 'customer';
            return next();
        }

        const shopOwner = await ShopOwner.findById(decoded._id || decoded.id);
        if (shopOwner) {
            req.user = shopOwner;
            req.userRole = 'shopOwner';
            return next();
        }

        const captain = await Captain.findById(decoded._id || decoded.id);
        if (captain) {
            req.user = captain;
            req.userRole = 'captain';
            return next();
        }

        return res.status(401).json({ success: false, message: 'Unauthorized' });
    } catch (error) {
        return next(error);
    }
};