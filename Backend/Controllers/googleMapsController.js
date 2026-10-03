const mongoose = require("mongoose");
const Shop = require("../models/ShopModel");
const Order = require("../models/Order");
const {
  getCaptainToShopRoute,
  getCaptainToCustomerRoute,
  getShopToCustomerRoute,
} = require("../services/googleMapsService");

const hasValidCoordinatePair = (location) => {
  return !!location &&
    Number.isFinite(Number(location.latitude)) &&
    Number.isFinite(Number(location.longitude)) &&
    Number(location.latitude) >= -90 &&
    Number(location.latitude) <= 90 &&
    Number(location.longitude) >= -180 &&
    Number(location.longitude) <= 180;
};

const getOrderForCaptain = async (captainId, orderId) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    const error = new Error("Invalid order ID");
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findById(orderId).populate("shop", "shopName address location");

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  if (String(order.captain) !== String(captainId)) {
    const error = new Error("You are not authorized to access this delivery route");
    error.statusCode = 403;
    throw error;
  }

  if (order.fulfillmentType !== "delivery") {
    const error = new Error("This order is not a delivery order");
    error.statusCode = 400;
    throw error;
  }

  return order;
};

const getCaptainToShop = async (req, res) => {
  const { shopId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(shopId)) {
    return res.status(400).json({ success: false, message: "Invalid shop ID" });
  }

  try {
    const shop = await Shop.findById(shopId);

    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    if (!req.user || !hasValidCoordinatePair(req.user.location)) {
      return res.status(400).json({ success: false, message: "Captain location is not available" });
    }

    if (!hasValidCoordinatePair(shop.location)) {
      return res.status(400).json({ success: false, message: "Shop location is not available" });
    }

    const data = await getCaptainToShopRoute(req.user.location, shop.location);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Unable to calculate captain to shop route",
    });
  }
};

const getCaptainToCustomer = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await getOrderForCaptain(req.user._id, orderId);

    if (!hasValidCoordinatePair(req.user.location)) {
      return res.status(400).json({ success: false, message: "Captain location is not available" });
    }

    if (!hasValidCoordinatePair(order.deliveryLocation)) {
      return res.status(400).json({ success: false, message: "Order delivery location is not available" });
    }

    const data = await getCaptainToCustomerRoute(req.user.location, order.deliveryLocation);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Unable to calculate captain to customer route",
    });
  }
};

const getShopToCustomer = async (req, res) => {
  const { orderId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  try {
    const order = await Order.findById(orderId).populate("shop", "owner location");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (String(order.shop.owner) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "You are not authorized to access this order route" });
    }

    if (!hasValidCoordinatePair(order.shop.location)) {
      return res.status(400).json({ success: false, message: "Shop location is not available" });
    }

    if (!hasValidCoordinatePair(order.deliveryLocation)) {
      return res.status(400).json({ success: false, message: "Order delivery location is not available" });
    }

    const data = await getShopToCustomerRoute(order.shop.location, order.deliveryLocation);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Unable to calculate shop to customer route",
    });
  }
};

module.exports = {
  getCaptainToShop,
  getCaptainToCustomer,
  getShopToCustomer,
};
