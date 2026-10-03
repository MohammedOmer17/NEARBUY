const mongoose = require("mongoose");
const Shop = require("../models/ShopModel");
const Order = require("../models/Order");
const notificationService = require("./notificationService");

const PAYMENT_METHODS = ["shop_upi", "cod"];
const PAYMENT_STATUS_VALUES = ["pending", "customer_marked_paid", "paid"];

const normalizePaymentMethod = (method) => {
  const normalized = String(method || "").trim();

  if (!PAYMENT_METHODS.includes(normalized)) {
    const error = new Error("Payment method must be either shop_upi or cod");
    error.statusCode = 400;
    throw error;
  }

  return normalized;
};

const validateUpiId = (upiId) => {
  if (upiId === undefined || upiId === null || upiId === "") {
    return null;
  }

  const value = String(upiId).trim();
  if (!value) {
    return null;
  }

  if (value.length < 3 || value.length > 255) {
    const error = new Error("UPI ID must be between 3 and 255 characters");
    error.statusCode = 400;
    throw error;
  }

  if (!/^[A-Za-z0-9._-]+@[A-Za-z0-9._-]+$/.test(value)) {
    const error = new Error("UPI ID format is invalid");
    error.statusCode = 400;
    throw error;
  }

  return value;
};

const validateQrCode = (qrCode) => {
  if (qrCode === undefined || qrCode === null || qrCode === "") {
    return null;
  }

  const value = String(qrCode).trim();
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      const error = new Error("QR code must be a valid URL or reference string");
      error.statusCode = 400;
      throw error;
    }
    return value;
  } catch (error) {
    if (value.includes("http") || value.includes("https") || value.includes("/")) {
      return value;
    }

    return value;
  }
};

const getShopPaymentDetails = async (shopId) => {
  const shop = await Shop.findById(shopId).select("paymentDetails");
  if (!shop) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    upiId: shop.paymentDetails?.upiId || null,
    qrCode: shop.paymentDetails?.qrCode || null,
  };
};

const updateShopPaymentDetails = async (shopId, payload = {}) => {
  const shop = await Shop.findById(shopId);
  if (!shop) {
    const error = new Error("Shop not found");
    error.statusCode = 404;
    throw error;
  }

  const upiId = payload.upiId !== undefined ? validateUpiId(payload.upiId) : shop.paymentDetails?.upiId || null;
  const qrCode = payload.qrCode !== undefined ? validateQrCode(payload.qrCode) : shop.paymentDetails?.qrCode || null;

  if (upiId === null && qrCode === null && (payload.upiId === undefined && payload.qrCode === undefined)) {
    const error = new Error("At least one payment field must be provided");
    error.statusCode = 400;
    throw error;
  }

  shop.paymentDetails = {
    upiId,
    qrCode,
  };

  await shop.save();
  return shop.paymentDetails;
};

const safeOrderPayment = (order) => {
  return {
    method: order.payment?.method || null,
    status: order.payment?.status || "pending",
    customerMarkedPaidAt: order.payment?.customerMarkedPaidAt || null,
    paidAt: order.payment?.paidAt || null,
  };
};

const markCustomerPaid = async (orderId, customerId) => {
  const order = await Order.findOne({ _id: orderId, customer: customerId });

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  if (order.payment?.method !== "shop_upi") {
    const error = new Error("This payment method cannot be marked as paid by the customer");
    error.statusCode = 400;
    throw error;
  }

  if (order.payment?.status !== "pending") {
    const error = new Error("Order payment is not pending");
    error.statusCode = 400;
    throw error;
  }

  order.payment.status = "customer_marked_paid";
  order.payment.customerMarkedPaidAt = new Date();
  await order.save();

  try {
    await notificationService.createNotification({
      recipient: order.shop,
      recipientRole: "shopOwner",
      type: "PAYMENT_CONFIRMATION_REQUIRED",
      title: "Payment Confirmation Required",
      message: "The customer has marked the UPI payment as completed. Please verify the payment.",
      relatedEntity: { entityType: "Order", entityId: order._id },
    });
  } catch (notificationError) {
    console.error("Payment confirmation requirement notification failed:", notificationError);
  }

  return order;
};

const confirmShopPayment = async (orderId, shopId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  if (String(order.shop) !== String(shopId)) {
    const error = new Error("You are not authorized to confirm this payment");
    error.statusCode = 403;
    throw error;
  }

  if (order.payment?.method !== "shop_upi") {
    const error = new Error("This order is not using shop UPI payment");
    error.statusCode = 400;
    throw error;
  }

  if (order.payment?.status !== "customer_marked_paid") {
    const error = new Error("Payment must be marked as paid by the customer before shop confirmation");
    error.statusCode = 400;
    throw error;
  }

  order.payment.status = "paid";
  order.payment.paidAt = new Date();
  await order.save();

  try {
    await notificationService.createNotification({
      recipient: order.customer,
      recipientRole: "customer",
      type: "PAYMENT_CONFIRMED",
      title: "Payment Confirmed",
      message: `Your payment for order ${String(order._id)} has been confirmed by the shop.`,
      relatedEntity: { entityType: "Order", entityId: order._id },
    });
  } catch (notificationError) {
    console.error("Order payment confirmed notification failed:", notificationError);
  }

  return order;
};

const confirmCodPaymentForShop = async (orderId, shopId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  if (String(order.shop) !== String(shopId)) {
    const error = new Error("You are not authorized to confirm this payment");
    error.statusCode = 403;
    throw error;
  }

  if (order.payment?.method !== "cod") {
    const error = new Error("This order is not a cash on delivery order");
    error.statusCode = 400;
    throw error;
  }

  if (order.payment?.status !== "pending") {
    const error = new Error("This COD payment is already confirmed");
    error.statusCode = 400;
    throw error;
  }

  order.payment.status = "paid";
  order.payment.paidAt = new Date();
  await order.save();

  try {
    await notificationService.createNotification({
      recipient: order.customer,
      recipientRole: "customer",
      type: "PAYMENT_RECEIVED",
      title: "Payment Received",
      message: "Your cash payment has been received.",
      relatedEntity: { entityType: "Order", entityId: order._id },
    });
  } catch (notificationError) {
    console.error("COD payment receipt notification failed:", notificationError);
  }

  return order;
};

const collectCodPayment = async (orderId, captainId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  if (String(order.captain) !== String(captainId)) {
    const error = new Error("You are not authorized to collect payment for this order");
    error.statusCode = 403;
    throw error;
  }

  if (order.fulfillmentType !== "delivery") {
    const error = new Error("This order is not a delivery order");
    error.statusCode = 400;
    throw error;
  }

  if (order.payment?.method !== "cod") {
    const error = new Error("This order is not a cash on delivery order");
    error.statusCode = 400;
    throw error;
  }

  if (order.payment?.status !== "pending") {
    const error = new Error("COD payment is not pending");
    error.statusCode = 400;
    throw error;
  }

  if (!['ready', 'picked_up', 'out_for_delivery'].includes(order.orderStatus)) {
    const error = new Error("Cash can only be collected while the delivery is in progress");
    error.statusCode = 400;
    throw error;
  }

  order.payment.status = "paid";
  order.payment.paidAt = new Date();
  await order.save();

  try {
    await notificationService.createNotification({
      recipient: order.customer,
      recipientRole: "customer",
      type: "PAYMENT_RECEIVED",
      title: "Payment Received",
      message: "Your cash payment has been received.",
      relatedEntity: { entityType: "Order", entityId: order._id },
    });
  } catch (notificationError) {
    console.error("COD collection notification failed:", notificationError);
  }

  return order;
};

const validatePaymentForCompletion = (order) => {
  if (!order || !order.payment) {
    const error = new Error("Payment details are required");
    error.statusCode = 400;
    throw error;
  }

  if (order.payment.method === "shop_upi" && order.payment.status !== "paid") {
    const error = new Error("This order cannot be completed until the shop confirms the UPI payment");
    error.statusCode = 400;
    throw error;
  }

  if (order.payment.method === "cod" && order.payment.status !== "paid") {
    const error = new Error("This COD order cannot be completed until cash has been collected");
    error.statusCode = 400;
    throw error;
  }

  return true;
};

module.exports = {
  PAYMENT_METHODS,
  PAYMENT_STATUS_VALUES,
  normalizePaymentMethod,
  validateUpiId,
  validateQrCode,
  getShopPaymentDetails,
  updateShopPaymentDetails,
  markCustomerPaid,
  confirmShopPayment,
  confirmCodPaymentForShop,
  collectCodPayment,
  validatePaymentForCompletion,
  safeOrderPayment,
};
