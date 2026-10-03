const mongoose = require("mongoose");
const Notification = require("../models/Notification");

const VALID_TYPES_BY_ROLE = {
  customer: [
    "ORDER_PLACED",
    "ORDER_ACCEPTED",
    "ORDER_PREPARING",
    "ORDER_READY",
    "CAPTAIN_ASSIGNED",
    "ORDER_PICKED_UP",
    "ORDER_OUT_FOR_DELIVERY",
    "ORDER_COMPLETED",
    "ORDER_CANCELLED",
    "PAYMENT_CONFIRMED",
    "PAYMENT_RECEIVED",
  ],
  shopOwner: [
    "NEW_ORDER",
    "CUSTOMER_CANCELLED_ORDER",
    "ORDER_READY_FOR_DELIVERY",
    "CAPTAIN_ASSIGNED",
    "PAYMENT_CONFIRMATION_REQUIRED",
    "ACCOUNT_APPROVED",
    "ACCOUNT_REJECTED",
    "ACCOUNT_SUSPENDED",
  ],
  captain: [
    "DELIVERY_ASSIGNED",
    "DELIVERY_CANCELLED",
    "ORDER_READY_FOR_PICKUP",
    "ACCOUNT_APPROVED",
    "ACCOUNT_REJECTED",
    "ACCOUNT_SUSPENDED",
  ],
};

const normalizeUserRole = (role) => {
  if (!role) {
    return null;
  }

  const normalizedRole = String(role).trim();
  return Object.prototype.hasOwnProperty.call(VALID_TYPES_BY_ROLE, normalizedRole)
    ? normalizedRole
    : null;
};

const normalizeType = (type, role) => {
  const normalizedType = String(type || "").trim().toUpperCase();
  const validTypes = VALID_TYPES_BY_ROLE[role] || [];

  if (!normalizedType || !validTypes.includes(normalizedType)) {
    const error = new Error(`Invalid notification type for role: ${role}`);
    error.statusCode = 400;
    throw error;
  }

  return normalizedType;
};

const parseRelatedEntity = (relatedEntity) => {
  if (!relatedEntity || typeof relatedEntity !== "object") {
    return {
      entityType: null,
      entityId: null,
    };
  }

  const entityType = relatedEntity.entityType ? String(relatedEntity.entityType).trim() : null;
  const entityId = relatedEntity.entityId ? String(relatedEntity.entityId) : null;

  if (!entityType && !entityId) {
    return {
      entityType: null,
      entityId: null,
    };
  }

  if (!entityType) {
    const error = new Error("relatedEntity.entityType is required when relatedEntity is provided");
    error.statusCode = 400;
    throw error;
  }

  if (!entityId || !mongoose.Types.ObjectId.isValid(entityId)) {
    const error = new Error("relatedEntity.entityId must be a valid Mongo ObjectId");
    error.statusCode = 400;
    throw error;
  }

  return {
    entityType,
    entityId: new mongoose.Types.ObjectId(entityId),
  };
};

const createNotification = async ({
  recipient,
  recipientRole,
  type,
  title,
  message,
  relatedEntity,
}) => {
  if (!recipient) {
    const error = new Error("Notification recipient is required");
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(String(recipient))) {
    const error = new Error("Notification recipient must be a valid ObjectId");
    error.statusCode = 400;
    throw error;
  }

  const normalizedRole = normalizeUserRole(recipientRole);
  if (!normalizedRole) {
    const error = new Error("Notification recipientRole is invalid");
    error.statusCode = 400;
    throw error;
  }

  if (!title || !String(title).trim()) {
    const error = new Error("Notification title is required");
    error.statusCode = 400;
    throw error;
  }

  if (!message || !String(message).trim()) {
    const error = new Error("Notification message is required");
    error.statusCode = 400;
    throw error;
  }

  const normalizedType = normalizeType(type, normalizedRole);

  const notification = await Notification.create({
    recipient: new mongoose.Types.ObjectId(String(recipient)),
    recipientRole: normalizedRole,
    type: normalizedType,
    title: String(title).trim(),
    message: String(message).trim(),
    relatedEntity: parseRelatedEntity(relatedEntity),
  });

  return notification;
};

const getUserNotifications = async (userId, role, options = {}) => {
  const normalizedRole = normalizeUserRole(role);
  if (!userId || !normalizedRole) {
    const error = new Error("Valid user id and role are required");
    error.statusCode = 400;
    throw error;
  }

  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.max(1, Math.min(Number(options.limit || 20), 50));
  const skip = (page - 1) * limit;

  const query = {
    recipient: new mongoose.Types.ObjectId(String(userId)),
    recipientRole: normalizedRole,
  };

  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(query),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
};

const getUnreadNotificationCount = async (userId, role) => {
  const normalizedRole = normalizeUserRole(role);
  if (!userId || !normalizedRole) {
    const error = new Error("Valid user id and role are required");
    error.statusCode = 400;
    throw error;
  }

  const count = await Notification.countDocuments({
    recipient: new mongoose.Types.ObjectId(String(userId)),
    recipientRole: normalizedRole,
    isRead: false,
  });

  return count;
};

const markNotificationAsRead = async (notificationId, userId, role) => {
  const normalizedRole = normalizeUserRole(role);
  if (!notificationId || !userId || !normalizedRole) {
    const error = new Error("Notification id, user id, and role are required");
    error.statusCode = 400;
    throw error;
  }

  const notification = await Notification.findOne({
    _id: notificationId,
    recipient: new mongoose.Types.ObjectId(String(userId)),
    recipientRole: normalizedRole,
  });

  if (!notification) {
    return null;
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  return notification;
};

const markAllNotificationsAsRead = async (userId, role) => {
  const normalizedRole = normalizeUserRole(role);
  if (!userId || !normalizedRole) {
    const error = new Error("Valid user id and role are required");
    error.statusCode = 400;
    throw error;
  }

  return Notification.updateMany(
    {
      recipient: new mongoose.Types.ObjectId(String(userId)),
      recipientRole: normalizedRole,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );
};

const deleteNotification = async (notificationId, userId, role) => {
  const normalizedRole = normalizeUserRole(role);
  if (!notificationId || !userId || !normalizedRole) {
    const error = new Error("Notification id, user id, and role are required");
    error.statusCode = 400;
    throw error;
  }

  const result = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: new mongoose.Types.ObjectId(String(userId)),
    recipientRole: normalizedRole,
  });

  return result;
};

const deleteAllUserNotifications = async (userId, role) => {
  const normalizedRole = normalizeUserRole(role);
  if (!userId || !normalizedRole) {
    const error = new Error("Valid user id and role are required");
    error.statusCode = 400;
    throw error;
  }

  return Notification.deleteMany({
    recipient: new mongoose.Types.ObjectId(String(userId)),
    recipientRole: normalizedRole,
  });
};

const customerOrderStatusMessage = (order, status) => {
  const base = {
    placed: {
      title: "Order Placed",
      message: "Your order has been placed successfully.",
    },
    accepted: {
      title: "Order Accepted",
      message: "Your order has been accepted by the shop.",
    },
    preparing: {
      title: "Order Preparing",
      message: "Your order is being prepared by the shop.",
    },
    ready: {
      title: "Order Ready",
      message: order && order.fulfillmentType === "pickup"
        ? "Your order is ready for pickup."
        : "Your order is ready and will be handed over for delivery.",
    },
    picked_up: {
      title: "Order Picked Up",
      message: "Your order has been picked up and is on its way.",
    },
    out_for_delivery: {
      title: "Order Out for Delivery",
      message: "Your order is out for delivery.",
    },
    completed: {
      title: "Order Completed",
      message: "Your order has been delivered successfully.",
    },
    cancelled: {
      title: "Order Cancelled",
      message: "Your order has been cancelled.",
    },
  };

  return base[status] || null;
};

const notifyCustomerOrderStatusUpdate = async (order, status) => {
  if (!order || !order.customer) {
    return null;
  }

  const payload = customerOrderStatusMessage(order, status);
  if (!payload) {
    return null;
  }

  return createNotification({
    recipient: order.customer,
    recipientRole: "customer",
    type: status === "placed"
      ? "ORDER_PLACED"
      : status === "accepted"
        ? "ORDER_ACCEPTED"
        : status === "preparing"
          ? "ORDER_PREPARING"
          : status === "ready"
            ? "ORDER_READY"
            : status === "picked_up"
              ? "ORDER_PICKED_UP"
              : status === "out_for_delivery"
                ? "ORDER_OUT_FOR_DELIVERY"
                : status === "completed"
                  ? "ORDER_COMPLETED"
                  : "ORDER_CANCELLED",
    title: payload.title,
    message: payload.message,
    relatedEntity: {
      entityType: "Order",
      entityId: order._id,
    },
  });
};

const notifyShopOwnerNewOrder = async (order) => {
  if (!order || !order.shop) {
    return null;
  }

  return createNotification({
    recipient: order.shop,
    recipientRole: "shopOwner",
    type: "NEW_ORDER",
    title: "New Order",
    message: "A new order has been placed at your shop.",
    relatedEntity: {
      entityType: "Order",
      entityId: order._id,
    },
  });
};

const notifyCustomerOrderPlaced = async (order) => {
  return notifyCustomerOrderStatusUpdate(order, "placed");
};

const notifyCustomerOrderAccepted = async (order) => {
  return notifyCustomerOrderStatusUpdate(order, "accepted");
};

const notifyCustomerOrderPreparing = async (order) => {
  return notifyCustomerOrderStatusUpdate(order, "preparing");
};

const notifyCustomerOrderReady = async (order) => {
  return notifyCustomerOrderStatusUpdate(order, "ready");
};

const notifyCustomerOrderPickedUp = async (order) => {
  return notifyCustomerOrderStatusUpdate(order, "picked_up");
};

const notifyCustomerOrderOutForDelivery = async (order) => {
  return notifyCustomerOrderStatusUpdate(order, "out_for_delivery");
};

const notifyCustomerOrderCompleted = async (order) => {
  return notifyCustomerOrderStatusUpdate(order, "completed");
};

const notifyCustomerOrderCancelled = async (order) => {
  return notifyCustomerOrderStatusUpdate(order, "cancelled");
};

const notifyShopOwnerOrderCancelled = async (order) => {
  if (!order || !order.shop) {
    return null;
  }

  return createNotification({
    recipient: order.shop,
    recipientRole: "shopOwner",
    type: "CUSTOMER_CANCELLED_ORDER",
    title: "Customer Cancelled Order",
    message: "An order from your shop has been cancelled by the customer.",
    relatedEntity: {
      entityType: "Order",
      entityId: order._id,
    },
  });
};

const notifyCaptainAssigned = async (order) => {
  if (!order || !order.captain) {
    return null;
  }

  return createNotification({
    recipient: order.captain,
    recipientRole: "captain",
    type: "DELIVERY_ASSIGNED",
    title: "New Delivery",
    message: "You have been assigned a new delivery.",
    relatedEntity: {
      entityType: "Order",
      entityId: order._id,
    },
  });
};

const notifyCaptainReadyForPickup = async (order) => {
  if (!order || !order.captain) {
    return null;
  }

  return createNotification({
    recipient: order.captain,
    recipientRole: "captain",
    type: "ORDER_READY_FOR_PICKUP",
    title: "Order Ready for Pickup",
    message: "The assigned order is ready for pickup.",
    relatedEntity: {
      entityType: "Order",
      entityId: order._id,
    },
  });
};

const notifyCaptainDeliveryCancelled = async (order) => {
  if (!order || !order.captain) {
    return null;
  }

  return createNotification({
    recipient: order.captain,
    recipientRole: "captain",
    type: "DELIVERY_CANCELLED",
    title: "Delivery Cancelled",
    message: "The assigned delivery has been cancelled.",
    relatedEntity: {
      entityType: "Order",
      entityId: order._id,
    },
  });
};

const notifyOrderPlaced = async (order) => {
  const notifications = await Promise.all([
    notifyCustomerOrderPlaced(order),
    notifyShopOwnerNewOrder(order),
  ]);

  return notifications.filter(Boolean);
};

const notifyOrderAccepted = async (order) => {
  return notifyCustomerOrderAccepted(order);
};

const notifyOrderStatusUpdate = async (order, status) => {
  if (!order || !status) {
    return [];
  }

  const notifications = [];

  if (status === "accepted") {
    notifications.push(await notifyCustomerOrderAccepted(order));
  }

  if (status === "preparing") {
    notifications.push(await notifyCustomerOrderPreparing(order));
  }

  if (status === "ready") {
    notifications.push(await notifyCustomerOrderReady(order));
    notifications.push(await notifyCaptainReadyForPickup(order));
  }

  if (status === "picked_up") {
    notifications.push(await notifyCustomerOrderPickedUp(order));
  }

  if (status === "out_for_delivery") {
    notifications.push(await notifyCustomerOrderOutForDelivery(order));
  }

  if (status === "completed") {
    notifications.push(await notifyCustomerOrderCompleted(order));
  }

  if (status === "cancelled") {
    notifications.push(await notifyCustomerOrderCancelled(order));
    notifications.push(await notifyShopOwnerOrderCancelled(order));
    notifications.push(await notifyCaptainDeliveryCancelled(order));
  }

  return notifications.filter(Boolean);
};

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllUserNotifications,
  notifyOrderPlaced,
  notifyOrderAccepted,
  notifyOrderStatusUpdate,
  notifyShopOwnerNewOrder,
  notifyShopOwnerOrderCancelled,
  notifyCustomerOrderPlaced,
  notifyCustomerOrderAccepted,
  notifyCustomerOrderPreparing,
  notifyCustomerOrderReady,
  notifyCustomerOrderPickedUp,
  notifyCustomerOrderOutForDelivery,
  notifyCustomerOrderCompleted,
  notifyCustomerOrderCancelled,
  notifyCaptainAssigned,
  notifyCaptainReadyForPickup,
  notifyCaptainDeliveryCancelled,
};
