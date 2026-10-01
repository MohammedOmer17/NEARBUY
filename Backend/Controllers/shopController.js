const mongoose = require('mongoose');
const Shop = require('../models/ShopModel');

const allowedStatuses = ['active', 'inactive', 'suspended'];
const editableFields = ['shopName', 'address', 'latitude', 'longitude', 'contact'];

const getAuthenticatedOwnerId = (req, res) => {
    const ownerId = req.user?._id;
    if (!ownerId) {
        res.status(401).json({ message: 'Authentication required' });
        return null;
    }
    return ownerId;
};

const getMyShop = async (req, res) => {
    const ownerId = getAuthenticatedOwnerId(req, res);
    if (!ownerId) return;

    try {
        const shop = await Shop.findOne({ owner: ownerId });
        if (!shop) {
            return res.status(404).json({ message: 'Shop not found for this owner' });
        }
        return res.status(200).json({ shop });
    } catch (error) {
        console.error('Failed to retrieve owner shop:', error);
        return res.status(500).json({ message: 'Unable to retrieve shop' });
    }
};

const updateMyShop = async (req, res) => {
    const ownerId = getAuthenticatedOwnerId(req, res);
    if (!ownerId) return;

    const updates = {};
    for (const field of ['shopName', 'address', 'contact']) {
        if (Object.hasOwn(req.body, field)) {
            if (typeof req.body[field] !== 'string' || !req.body[field].trim()) {
                return res.status(400).json({ message: `${field} must be a non-empty string` });
            }
            updates[field] = req.body[field].trim();
        }
    }

    for (const field of ['latitude', 'longitude']) {
        if (Object.hasOwn(req.body, field)) {
            if (req.body[field] === null || req.body[field] === undefined ||
                req.body[field] === '' || !Number.isFinite(Number(req.body[field]))) {
                return res.status(400).json({ message: `${field} must be a valid number` });
            }
            updates[`location.${field}`] = Number(req.body[field]);
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            message: `Provide at least one field to update: ${editableFields.join(', ')}`,
        });
    }

    try {
        const shop = await Shop.findOneAndUpdate(
            { owner: ownerId },
            { $set: updates },
            { new: true, runValidators: true },
        );

        if (!shop) {
            return res.status(404).json({ message: 'Shop not found for this owner' });
        }
        return res.status(200).json({ message: 'Shop updated successfully', shop });
    } catch (error) {
        console.error('Failed to update owner shop:', error);
        return res.status(500).json({ message: 'Unable to update shop' });
    }
};

const getShopById = async (req, res) => {
    const { shopId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(shopId)) {
        return res.status(400).json({ message: 'Invalid shop ID' });
    }

    try {
        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }
        return res.status(200).json({ shop });
    } catch (error) {
        console.error('Failed to retrieve shop:', error);
        return res.status(500).json({ message: 'Unable to retrieve shop' });
    }
};

const updateShopStatus = async (req, res) => {
    const ownerId = getAuthenticatedOwnerId(req, res);
    if (!ownerId) return;

    const { status } = req.body;
    if (typeof status !== 'string' || !allowedStatuses.includes(status)) {
        return res.status(400).json({
            message: `Status must be one of: ${allowedStatuses.join(', ')}`,
        });
    }

    try {
        const shop = await Shop.findOneAndUpdate(
            { owner: ownerId },
            { $set: { status } },
            { new: true, runValidators: true },
        );

        if (!shop) {
            return res.status(404).json({ message: 'Shop not found for this owner' });
        }
        return res.status(200).json({ message: 'Shop status updated successfully', shop });
    } catch (error) {
        console.error('Failed to update shop status:', error);
        return res.status(500).json({ message: 'Unable to update shop status' });
    }
};

module.exports = {
    getMyShop,
    updateMyShop,
    getShopById,
    updateShopStatus,
};