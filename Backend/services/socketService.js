const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Customer = require("../models/CustomerModel");
const ShopOwner = require("../models/ShopOwnerModel");
const Captain = require("../models/CaptainModel");
const Order = require("../models/Order");
const Shop = require("../models/ShopModel");
const { validateCoordinates } = require("./googleMapsService");
const { allowedOrigins } = require("../Middlewares/authSecurity");

const getRoomName = (orderId) => `order_${orderId}`;

const parseCookieHeader = (cookieHeader) => {
  if (!cookieHeader) return {};

  return cookieHeader
    .split(";")
    .reduce((cookies, entry) => {
      const [key, ...rest] = entry.trim().split("=");
      if (!key) return cookies;
      cookies[key] = decodeURIComponent(rest.join("="));
      return cookies;
    }, {});
};

const getSocketToken = (socket) => {
  const tokenFromAuth = socket.handshake?.auth?.token;
  if (tokenFromAuth) {
    return tokenFromAuth;
  }

  const cookies = parseCookieHeader(socket.handshake?.headers?.cookie || "");
  return cookies.token || null;
};

const findUserByToken = async (token) => {
  if (!token) {
    throw new Error("Authentication required");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }

  if (!decoded || !decoded._id) {
    throw new Error("Invalid authentication payload");
  }

  const customer = await Customer.findById(decoded._id);
  if (customer) {
    return { id: customer._id.toString(), role: "customer" };
  }

  const shopOwner = await ShopOwner.findById(decoded._id);
  if (shopOwner) {
    return { id: shopOwner._id.toString(), role: "shopOwner" };
  }

  const captain = await Captain.findById(decoded._id);
  if (captain) {
    return { id: captain._id.toString(), role: "captain" };
  }

  throw new Error("Unauthorized user");
};

const validateOrderForUser = async (orderId, user) => {
  if (!orderId) {
    const error = new Error("Order ID is required");
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findById(orderId).populate("shop", "owner location");

  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  if (order.fulfillmentType !== "delivery") {
    const error = new Error("This order is not a delivery order");
    error.statusCode = 400;
    throw error;
  }

  if (user.role === "captain") {
    if (String(order.captain) !== String(user.id)) {
      const error = new Error("You are not authorized to track this order");
      error.statusCode = 403;
      throw error;
    }
  }

  if (user.role === "customer") {
    if (String(order.customer) !== String(user.id)) {
      const error = new Error("You are not authorized to track this order");
      error.statusCode = 403;
      throw error;
    }
  }

  if (user.role === "shopOwner") {
    const shop = await Shop.findById(order.shop._id || order.shop);
    if (!shop || String(shop.owner) !== String(user.id)) {
      const error = new Error("You are not authorized to track this order");
      error.statusCode = 403;
      throw error;
    }
  }

  if (!["picked_up", "out_for_delivery"].includes(order.orderStatus)) {
    const error = new Error("Order is not in a trackable state");
    error.statusCode = 400;
    throw error;
  }

  return order;
};

const validatePickupOrderForUser = async (orderId, user, { allowFinished = false } = {}) => {
  if (!orderId) {
    const error = new Error("Order ID is required");
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    const error = new Error("Invalid order ID");
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findById(orderId).populate("shop", "owner");
  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  if (order.fulfillmentType !== "pickup") {
    const error = new Error("This is not a pickup order");
    error.statusCode = 400;
    throw error;
  }

  if (user.role === "customer" && String(order.customer) !== String(user.id)) {
    const error = new Error("You are not authorized to track this order");
    error.statusCode = 403;
    throw error;
  }

  if (user.role === "shopOwner" &&
      (!order.shop || String(order.shop.owner) !== String(user.id))) {
    const error = new Error("You are not authorized to track this order");
    error.statusCode = 403;
    throw error;
  }

  if (!["customer", "shopOwner"].includes(user.role)) {
    const error = new Error("Only the customer and shop owner can track this pickup");
    error.statusCode = 403;
    throw error;
  }

  if (!allowFinished && ["picked_up", "completed", "cancelled"].includes(order.orderStatus)) {
    const error = new Error("Pickup tracking has ended for this order");
    error.statusCode = 400;
    throw error;
  }

  return order;
};

const emitTrackingError = (socket, message, statusCode = 400) => {
  socket.emit("tracking_error", {
    success: false,
    message,
    statusCode,
  });
};

const initializeSocketService = (server) => {
  const socketIo = require("socket.io")(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    allowRequest: (request, callback) => {
      const origin = request.headers.origin;
      callback(null, Boolean(origin && allowedOrigins.includes(origin)));
    },
  });

  socketIo.use(async (socket, next) => {
    try {
      const token = getSocketToken(socket);
      const user = await findUserByToken(token);
      socket.user = user;
      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error(error.message || "Authentication required"));
    }
  });

  socketIo.on("connection", (socket) => {
    socket.on("join_order_tracking", async ({ orderId }) => {
      try {
        const order = await validateOrderForUser(orderId, socket.user);
        const roomName = getRoomName(orderId);

        socket.join(roomName);

        const captain = order.captain ? await Captain.findById(order.captain) : null;
        const payload = {
          orderId,
          captain: captain && captain.location ? {
            latitude: captain.location.latitude,
            longitude: captain.location.longitude,
          } : null,
          updatedAt: captain ? captain.locationUpdatedAt : null,
        };

        socket.emit("captain_location_initial", payload);
      } catch (error) {
        emitTrackingError(socket, error.message || "Unable to join tracking room", error.statusCode || 400);
      }
    });

    socket.on("join_pickup_tracking", async ({ orderId }) => {
      try {
        const order = await validatePickupOrderForUser(orderId, socket.user);
        socket.join(getRoomName(orderId));
        const shared = Boolean(order.pickupTracking?.shared);
        socket.emit("pickup_location_initial", {
          orderId,
          shared,
          customerLocation: shared ? order.pickupTracking.location : null,
          updatedAt: shared ? order.pickupTracking.updatedAt : null,
        });
      } catch (error) {
        emitTrackingError(socket, error.message || "Unable to join pickup tracking", error.statusCode || 400);
      }
    });

    socket.on("pickup_location_update", async ({ orderId, latitude, longitude }) => {
      try {
        if (socket.user.role !== "customer") {
          const error = new Error("Only the customer can share pickup location");
          error.statusCode = 403;
          throw error;
        }

        const order = await validatePickupOrderForUser(orderId, socket.user);
        const location = validateCoordinates({ latitude, longitude }, "Customer location");
        const updatedAt = new Date();
        order.pickupTracking = {
          shared: true,
          location,
          updatedAt,
        };
        await order.save();
        if (!socket.data.pickupSharingOrderIds) {
          socket.data.pickupSharingOrderIds = new Set();
        }
        socket.data.pickupSharingOrderIds.add(String(orderId));

        socketIo.to(getRoomName(orderId)).emit("pickup_customer_location_updated", {
          orderId,
          shared: true,
          customerLocation: location,
          updatedAt,
        });
      } catch (error) {
        emitTrackingError(socket, error.message || "Unable to update pickup location", error.statusCode || 400);
      }
    });

    socket.on("pickup_location_stop", async ({ orderId }) => {
      try {
        if (socket.user.role !== "customer") {
          const error = new Error("Only the customer can stop location sharing");
          error.statusCode = 403;
          throw error;
        }

        const order = await validatePickupOrderForUser(orderId, socket.user, { allowFinished: true });
        order.pickupTracking = {
          shared: false,
          location: { latitude: null, longitude: null },
          updatedAt: null,
        };
        await order.save();
        socket.data.pickupSharingOrderIds?.delete(String(orderId));

        socketIo.to(getRoomName(orderId)).emit("pickup_customer_location_updated", {
          orderId,
          shared: false,
          customerLocation: null,
          updatedAt: null,
        });
      } catch (error) {
        emitTrackingError(socket, error.message || "Unable to stop pickup location sharing", error.statusCode || 400);
      }
    });

    socket.on("leave_order_tracking", ({ orderId }) => {
      try {
        if (!orderId) {
          emitTrackingError(socket, "Order ID is required");
          return;
        }

        socket.leave(getRoomName(orderId));
        socket.emit("tracking_left", {
          success: true,
          orderId,
          message: "Left tracking room",
        });
      } catch (error) {
        emitTrackingError(socket, error.message || "Unable to leave tracking room");
      }
    });

    socket.on("captain_location_update", async ({ orderId, latitude, longitude }) => {
      try {
        if (socket.user.role !== "captain") {
          const error = new Error("Only captains can update location");
          error.statusCode = 403;
          throw error;
        }

        const order = await validateOrderForUser(orderId, socket.user);
        const validatedCoordinates = validateCoordinates({ latitude, longitude }, "Location");

        const captain = await Captain.findById(socket.user.id);
        if (!captain) {
          const error = new Error("Captain not found");
          error.statusCode = 404;
          throw error;
        }

        captain.location = {
          latitude: validatedCoordinates.latitude,
          longitude: validatedCoordinates.longitude,
        };
        captain.locationUpdatedAt = new Date();
        await captain.save();

        const payload = {
          orderId,
          captain: {
            latitude: validatedCoordinates.latitude,
            longitude: validatedCoordinates.longitude,
          },
          updatedAt: captain.locationUpdatedAt,
        };

        socketIo.to(getRoomName(orderId)).emit("captain_location_updated", payload);
      } catch (error) {
        emitTrackingError(socket, error.message || "Unable to update captain location", error.statusCode || 400);
      }
    });

    socket.on("disconnect", () => {
      const sharedOrderIds = socket.data.pickupSharingOrderIds;
      if (socket.user.role !== "customer" || !sharedOrderIds?.size) return;

      for (const orderId of sharedOrderIds) {
        const roomName = getRoomName(orderId);
        socketIo.in(roomName).fetchSockets().then(async (roomSockets) => {
          const anotherCustomerIsSharing = roomSockets.some((roomSocket) =>
            roomSocket.id !== socket.id &&
            roomSocket.data.user?.role === "customer" &&
            roomSocket.data.user.id === socket.user.id &&
            roomSocket.data.pickupSharingOrderIds?.has(orderId),
          );
          if (anotherCustomerIsSharing) return;

          const order = await Order.findOne({
            _id: orderId,
            customer: socket.user.id,
            fulfillmentType: "pickup",
            orderStatus: { $nin: ["picked_up", "completed", "cancelled"] },
            "pickupTracking.shared": true,
          });
          if (!order) return;

          order.pickupTracking = {
            shared: false,
            location: { latitude: null, longitude: null },
            updatedAt: null,
          };
          await order.save();
          socketIo.to(roomName).emit("pickup_customer_location_updated", {
            orderId,
            shared: false,
            customerLocation: null,
            updatedAt: null,
          });
        }).catch((error) => {
          console.error("Failed to clear disconnected pickup location:", error);
        });
      }
    });
  });

  return socketIo;
};

module.exports = {
  initializeSocketService,
  getRoomName,
  validateOrderForUser,
};
