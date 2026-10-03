const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Shop = require("../models/ShopModel");
const ShopProduct = require("../models/ShopProduct");
const notificationService = require("../services/notificationService");
const paymentService = require("../services/paymentService");

const validFulfillmentTypes = ["pickup", "delivery"];
const validOrderStatuses = ["placed", "accepted", "preparing", "ready", "picked_up", "out_for_delivery", "completed", "cancelled"];
const cancellableStatuses = ["placed"];

const getAuthenticatedShop = async (req, res) => {
  const ownerId = req.user?._id;

  if (!ownerId) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const shop = await Shop.findOne({ owner: ownerId });

  if (!shop) {
    return res.status(404).json({ success: false, message: "Shop not found for this owner" });
  }

  return shop;
};

const getAllowedStatusTransitions = (currentStatus, fulfillmentType) => {
  if (currentStatus === "placed") {
    return ["accepted"];
  }

  if (currentStatus === "accepted") {
    return ["preparing"];
  }

  if (currentStatus === "preparing") {
    return ["ready"];
  }

  if (currentStatus === "ready") {
    return fulfillmentType === "pickup" ? ["picked_up"] : [];
  }

  if (currentStatus === "picked_up") {
    return fulfillmentType === "pickup" ? ["completed"] : [];
  }

  return [];
};

const findOrderForShop = async (orderId, shopId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    return { order: null, notFound: true, forbidden: false };
  }

  if (String(order.shop) !== String(shopId)) {
    return { order, notFound: false, forbidden: true };
  }

  return { order, notFound: false, forbidden: false };
};

const createOrder = async (req, res) => {
  const { fulfillmentType, deliveryAddress, deliveryLocation, paymentMethod } = req.body;
  let session;

  try {
    if (!validFulfillmentTypes.includes(fulfillmentType)) {
      return res.status(400).json({ message: "Fulfillment type must be either pickup or delivery" });
    }

    const normalizedPaymentMethod = paymentService.normalizePaymentMethod(paymentMethod);

    if (fulfillmentType === "delivery") {
      if (typeof deliveryAddress !== "string" || deliveryAddress.trim() === "") {
        return res.status(400).json({ message: "Delivery address is required for delivery orders" });
      }

      if (deliveryLocation && typeof deliveryLocation === "object") {
        const lat = Number(deliveryLocation.latitude);
        const lng = Number(deliveryLocation.longitude);

        if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return res.status(400).json({ message: "Delivery location must contain valid latitude and longitude values" });
        }
      }
    }

    const customerId = req.user._id;
    session = await mongoose.startSession();
    session.startTransaction();

    const cart = await Cart.findOne({ customer: customerId }).session(session);

    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Cart is empty" });
    }

    const productIds = cart.items.map((item) => item.product);
    const products = await ShopProduct.find({ _id: { $in: productIds } }).session(session);
    const productMap = new Map(products.map((product) => [String(product._id), product]));

    let totalAmount = 0;
    const snapshotItems = [];

    for (const cartItem of cart.items) {
      const product = productMap.get(String(cartItem.product));

      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: `Product not found: ${String(cartItem.product)}` });
      }

      if (!product.isAvailable || product.quantity <= 0) {
        await session.abortTransaction();
        return res.status(400).json({ message: `${product.name} is currently unavailable` });
      }

      if (cartItem.quantity > product.quantity) {
        await session.abortTransaction();
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      const unitPrice = Number(product.price);
      const subtotal = unitPrice * cartItem.quantity;
      totalAmount += subtotal;

      snapshotItems.push({
        product: product._id,
        name: product.name,
        quantity: cartItem.quantity,
        unit: product.unit,
        price: unitPrice,
        subtotal,
      });
    }

    const order = await Order.create(
      [
        {
          customer: customerId,
          shop: cart.shop,
          items: snapshotItems,
          totalAmount,
          fulfillmentType,
          payment: {
            method: normalizedPaymentMethod,
            status: "pending",
            customerMarkedPaidAt: null,
            paidAt: null,
          },
          orderStatus: "placed",
          deliveryAddress: fulfillmentType === "delivery" ? deliveryAddress.trim() : null,
          deliveryLocation: fulfillmentType === "delivery" && deliveryLocation && typeof deliveryLocation === "object"
            ? {
                latitude: Number(deliveryLocation.latitude),
                longitude: Number(deliveryLocation.longitude),
              }
            : null,
        },
      ],
      { session }
    );

    for (const cartItem of cart.items) {
      const product = productMap.get(String(cartItem.product));
      const remainingQuantity = product.quantity - cartItem.quantity;

      await ShopProduct.updateOne(
        { _id: product._id },
        { $set: { quantity: remainingQuantity, isAvailable: remainingQuantity > 0 } },
        { session }
      );
    }

    await Cart.deleteOne({ _id: cart._id }).session(session);
    await session.commitTransaction();

    const createdOrder = order[0];

    try {
      await notificationService.notifyOrderPlaced(createdOrder);
    } catch (notificationError) {
      console.error("Order placement notification failed:", notificationError);
    }

    return res.status(201).json({ message: "Order placed successfully", order: createdOrder });
  } catch (error) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Create order failed:", error);
    const statusCode = error && error.statusCode ? error.statusCode : 500;
    return res.status(statusCode).json({
      message: error && error.message ? error.message : "Unable to place order",
    });
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Fetch my orders failed:", error);
    return res.status(500).json({ message: "Unable to retrieve orders" });
  }
};

const getOrderById = async (req, res) => {
  const { orderId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  try {
    const order = await Order.findOne({ _id: orderId, customer: req.user._id }).populate("shop", "shopName address contact status");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error("Fetch order by ID failed:", error);
    return res.status(500).json({ message: "Unable to retrieve order" });
  }
};

const cancelOrder = async (req, res) => {
  const { orderId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await Order.findOne({ _id: orderId, customer: req.user._id }).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Order not found" });
    }

    if (!cancellableStatuses.includes(order.orderStatus)) {
      await session.abortTransaction();
      return res.status(400).json({ message: "This order cannot be cancelled" });
    }

    for (const item of order.items) {
      const product = await ShopProduct.findById(item.product).session(session);

      if (product) {
        const updatedQuantity = product.quantity + item.quantity;
        await ShopProduct.updateOne(
          { _id: product._id },
          { $set: { quantity: updatedQuantity, isAvailable: updatedQuantity > 0 } },
          { session }
        );
      }
    }

    order.orderStatus = "cancelled";
    await order.save({ session });
    await session.commitTransaction();

    try {
      await notificationService.notifyOrderStatusUpdate(order, "cancelled");
    } catch (notificationError) {
      console.error("Order cancellation notification failed:", notificationError);
    }

    return res.status(200).json({ message: "Order cancelled successfully", order });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Cancel order failed:", error);
    return res.status(500).json({ message: "Unable to cancel the order" });
  } finally {
    session.endSession();
  }
};

const getShopOrders = async (req, res) => {
  try {
    const shop = await getAuthenticatedShop(req, res);
    if (!shop) {
      return;
    }

    const { status, fulfillmentType } = req.query;

    if (status && !validOrderStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid order status filter" });
    }

    if (fulfillmentType && !validFulfillmentTypes.includes(fulfillmentType)) {
      return res.status(400).json({ success: false, message: "Invalid fulfillment type filter" });
    }

    const query = { shop: shop._id };

    if (status) {
      query.orderStatus = status;
    }

    if (fulfillmentType) {
      query.fulfillmentType = fulfillmentType;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate("customer", "name phone");

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Fetch shop orders failed:", error);
    return res.status(500).json({ success: false, message: "Unable to retrieve shop orders" });
  }
};

const getShopOrderById = async (req, res) => {
  const { orderId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  try {
    const shop = await getAuthenticatedShop(req, res);
    if (!shop) {
      return;
    }

    const { order, notFound, forbidden } = await findOrderForShop(orderId, shop._id);

    if (notFound) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (forbidden) {
      return res.status(403).json({ success: false, message: "You are not authorized to manage this order" });
    }

    await order.populate("customer", "name phone");

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Fetch shop order by ID failed:", error);
    return res.status(500).json({ success: false, message: "Unable to retrieve order" });
  }
};

const acceptOrder = async (req, res) => {
  const { orderId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  try {
    const shop = await getAuthenticatedShop(req, res);
    if (!shop) {
      return;
    }

    const { order, notFound, forbidden } = await findOrderForShop(orderId, shop._id);

    if (notFound) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (forbidden) {
      return res.status(403).json({ success: false, message: "You are not authorized to manage this order" });
    }

    if (order.orderStatus !== "placed") {
      return res.status(400).json({
        success: false,
        message: "Order can only be accepted from placed status",
      });
    }

    order.orderStatus = "accepted";
    await order.save();

    try {
      await notificationService.notifyOrderAccepted(order);
    } catch (notificationError) {
      console.error("Order accepted notification failed:", notificationError);
    }

    return res.status(200).json({ success: true, message: "Order accepted successfully", order });
  } catch (error) {
    console.error("Accept order failed:", error);
    return res.status(500).json({ success: false, message: "Unable to accept order" });
  }
};

const updateShopOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  if (!status || typeof status !== "string") {
    return res.status(400).json({ success: false, message: "Status is required" });
  }

  if (!validOrderStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid order status" });
  }

  try {
    const shop = await getAuthenticatedShop(req, res);
    if (!shop) {
      return;
    }

    const { order, notFound, forbidden } = await findOrderForShop(orderId, shop._id);

    if (notFound) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (forbidden) {
      return res.status(403).json({ success: false, message: "You are not authorized to manage this order" });
    }

    const allowedTransitions = getAllowedStatusTransitions(order.orderStatus, order.fulfillmentType);

    if (!allowedTransitions.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status transition",
      });
    }

    if (status === "completed") {
      try {
        paymentService.validatePaymentForCompletion(order);
      } catch (paymentError) {
        return res.status(paymentError.statusCode || 400).json({
          success: false,
          message: paymentError.message,
        });
      }
    }

    order.orderStatus = status;
    await order.save();

    try {
      await notificationService.notifyOrderStatusUpdate(order, status);
    } catch (notificationError) {
      console.error("Order status notification failed:", notificationError);
    }

    return res.status(200).json({ success: true, message: "Order status updated successfully", order });
  } catch (error) {
    console.error("Update shop order status failed:", error);
    return res.status(500).json({ success: false, message: "Unable to update order status" });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getShopOrders,
  getShopOrderById,
  acceptOrder,
  updateShopOrderStatus,
};
