const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const ShopProduct = require("../models/ShopProduct");

const validFulfillmentTypes = ["pickup", "delivery"];
const cancellableStatuses = ["placed"];

const createOrder = async (req, res) => {
  const { fulfillmentType, deliveryAddress } = req.body;

  if (!validFulfillmentTypes.includes(fulfillmentType)) {
    return res.status(400).json({ message: "Fulfillment type must be either pickup or delivery" });
  }

  if (fulfillmentType === "delivery") {
    if (typeof deliveryAddress !== "string" || deliveryAddress.trim() === "") {
      return res.status(400).json({ message: "Delivery address is required for delivery orders" });
    }
  }

  const customerId = req.user._id;
  const session = await mongoose.startSession();

  try {
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
          orderStatus: "placed",
          deliveryAddress: fulfillmentType === "delivery" ? deliveryAddress.trim() : null,
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

    return res.status(201).json({ message: "Order placed successfully", order: order[0] });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Create order failed:", error);
    return res.status(500).json({ message: "Unable to place order" });
  } finally {
    session.endSession();
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

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
};
