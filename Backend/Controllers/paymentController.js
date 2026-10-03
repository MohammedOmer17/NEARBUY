const Shop = require("../models/ShopModel");
const ShopOwner = require("../models/ShopOwnerModel");
const Order = require("../models/Order");
const paymentService = require("../services/paymentService");

const getShopOwnerPayment = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    const payment = await paymentService.getShopPaymentDetails(shop._id);
    return res.status(200).json({ success: true, data: payment });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to fetch shop payment details",
    });
  }
};

const updateShopOwnerPayment = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    const paymentDetails = await paymentService.updateShopPaymentDetails(shop._id, req.body || {});

    return res.status(200).json({
      success: true,
      data: paymentDetails,
      message: "Shop payment details updated successfully",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to update shop payment details",
    });
  }
};

const getCustomerShopPayment = async (req, res) => {
  try {
    const { shopId } = req.params;
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    const payment = await paymentService.getShopPaymentDetails(shop._id);

    return res.status(200).json({
      success: true,
      data: {
        shopName: shop.shopName,
        upiId: payment.upiId,
        qrCode: payment.qrCode,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to fetch shop payment information",
    });
  }
};

const markOrderAsPaid = async (req, res) => {
  try {
    const order = await paymentService.markCustomerPaid(req.params.orderId, req.user._id);

    return res.status(200).json({
      success: true,
      message: "Order payment marked as paid by customer",
      data: {
        payment: {
          method: order.payment.method,
          status: order.payment.status,
          customerMarkedPaidAt: order.payment.customerMarkedPaidAt,
          paidAt: order.payment.paidAt,
        },
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to update payment status",
    });
  }
};

const confirmOrderPayment = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    const order = await paymentService.confirmShopPayment(req.params.orderId, shop._id);

    return res.status(200).json({
      success: true,
      message: "Shop payment confirmed successfully",
      data: {
        payment: {
          method: order.payment.method,
          status: order.payment.status,
          paidAt: order.payment.paidAt,
        },
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to confirm payment",
    });
  }
};

const confirmCodPayment = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    const order = await paymentService.confirmCodPaymentForShop(req.params.orderId, shop._id);

    return res.status(200).json({
      success: true,
      message: "COD payment confirmed successfully",
      data: {
        payment: {
          method: order.payment.method,
          status: order.payment.status,
          paidAt: order.payment.paidAt,
        },
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to confirm COD payment",
    });
  }
};

const collectDeliveryPayment = async (req, res) => {
  try {
    const order = await paymentService.collectCodPayment(req.params.orderId, req.user._id);

    return res.status(200).json({
      success: true,
      message: "COD payment collected successfully",
      data: {
        payment: {
          method: order.payment.method,
          status: order.payment.status,
          paidAt: order.payment.paidAt,
        },
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to collect COD payment",
    });
  }
};

module.exports = {
  getShopOwnerPayment,
  updateShopOwnerPayment,
  getCustomerShopPayment,
  markOrderAsPaid,
  confirmOrderPayment,
  confirmCodPayment,
  collectDeliveryPayment,
};
