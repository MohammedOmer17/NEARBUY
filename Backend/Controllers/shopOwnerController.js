const ShopOwner = require('../models/ShopOwnerModel');
const Shop = require('../models/ShopModel');
const BlacklistToken = require('../models/blackListTokenModel');
const jwt = require('jsonwebtoken');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getSafeShopOwner = (shopOwner) => {
    const safeShopOwner = shopOwner.toObject();
    delete safeShopOwner.password;
    return safeShopOwner;
};

const validateRegistration = (body) => {
    const requiredStrings = [
        'name', 'email', 'phone', 'password', 'shopName', 'address', 'contact',
    ];
    const missingFields = requiredStrings.filter(
        (field) => typeof body[field] !== 'string' || body[field].trim() === ''
    );

    if (body.latitude === undefined || body.latitude === null || body.latitude === '' ||
        body.longitude === undefined || body.longitude === null || body.longitude === '') {
        missingFields.push('latitude and longitude');
    }

    if (missingFields.length) {
        return `Required fields are missing or empty: ${missingFields.join(', ')}`;
    }

    if (!emailPattern.test(body.email.trim())) {
        return 'Please provide a valid email address';
    }

    if (!Number.isFinite(Number(body.latitude)) || !Number.isFinite(Number(body.longitude))) {
        return 'Latitude and longitude must be valid numbers';
    }

    return null;
};

const registerShopOwner = async (req, res) => {
    const validationError = validateRegistration(req.body);
    if (validationError) {
        return res.status(400).json({ message: validationError });
    }

    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();
    const phone = req.body.phone.trim();

    try {
        if (await ShopOwner.exists({ email })) {
            return res.status(409).json({ message: 'Email is already registered' });
        }

        if (await ShopOwner.exists({ phone })) {
            return res.status(409).json({ message: 'Phone number is already registered' });
        }

        const shopOwner = await ShopOwner.create({
            name,
            email,
            phone,
            password: req.body.password,
        });

        let shop;
        try {
            shop = await Shop.create({
                owner: shopOwner._id,
                shopName: req.body.shopName.trim(),
                address: req.body.address.trim(),
                location: {
                    latitude: Number(req.body.latitude),
                    longitude: Number(req.body.longitude),
                },
                contact: req.body.contact.trim(),
            });
        } catch (shopError) {
            try {
                await ShopOwner.deleteOne({ _id: shopOwner._id });
            } catch (rollbackError) {
                console.error('Failed to roll back ShopOwner registration:', rollbackError);
            }
            throw shopError;
        }

        return res.status(201).json({
            message: 'Shop Owner registered successfully',
            shopOwner: getSafeShopOwner(shopOwner),
            shop,
        });
    } catch (error) {
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern || {})[0];
            const message = duplicateField === 'phone'
                ? 'Phone number is already registered'
                : 'Email is already registered';
            return res.status(409).json({ message });
        }

        console.error('Shop Owner registration failed:', error);
        return res.status(500).json({ message: 'Unable to register Shop Owner' });
    }
};

const loginShopOwner = async (req, res) => {
    const { email, password } = req.body;
    if (typeof email !== 'string' || !email.trim() ||
        typeof password !== 'string' || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!emailPattern.test(email.trim())) {
        return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'Authentication is not configured' });
    }

    try {
        const shopOwner = await ShopOwner.findOne({ email: email.trim().toLowerCase() })
            .select('+password');

        if (!shopOwner || !(await shopOwner.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!shopOwner.isActive) {
            return res.status(403).json({ message: 'Shop Owner account is inactive' });
        }

        if (['suspended', 'rejected'].includes(shopOwner.accountStatus)) {
            return res.status(403).json({
                message: `Shop Owner account is ${shopOwner.accountStatus}`,
            });
        }

        const token = jwt.sign({ _id: shopOwner._id }, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });

        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
        });

        return res.status(200).json({
            message: 'Login successful',
            shopOwner: getSafeShopOwner(shopOwner),
        });
    } catch (error) {
        console.error('Shop Owner login failed:', error);
        return res.status(500).json({ message: 'Unable to log in' });
    }
};

const logoutShopOwner = async (req, res) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    try {
        if (token) {
            await BlacklistToken.create({ token });
        }

        res.clearCookie('token', {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
        });
        return res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Shop Owner logout failed:', error);
        return res.status(500).json({ message: 'Unable to log out' });
    }
};

const getShopOwnerProfile = async (req, res) => {
    const shopOwnerId = req.user?._id;
    if (!shopOwnerId) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const shopOwner = await ShopOwner.findById(shopOwnerId);
        if (!shopOwner) {
            return res.status(404).json({ message: 'Shop Owner not found' });
        }

        const shop = await Shop.findOne({ owner: req.user._id });
        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }

        return res.status(200).json({
            shopOwner: getSafeShopOwner(shopOwner),
            shop,
        });
    } catch (error) {
        console.error('Shop Owner profile lookup failed:', error);
        return res.status(500).json({ message: 'Unable to retrieve Shop Owner profile' });
    }
};

module.exports = {
    registerShopOwner,
    loginShopOwner,
    logoutShopOwner,
    getShopOwnerProfile,
};