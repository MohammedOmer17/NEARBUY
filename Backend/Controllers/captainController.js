const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Captain = require("../models/CaptainModel");
const Order = require("../models/Order");
const blackListTokenModel = require("../models/blackListTokenModel");
const notificationService = require("../services/notificationService");
const paymentService = require("../services/paymentService");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[\d\s().-]+$/;
const validVehicleTypes = ["bike", "scooter", "car", "other"];
const validAvailabilityStatuses = ["offline", "available", "busy"];

const validateLocationPayload = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { valid: false, message: "Latitude and longitude must be valid numbers" };
  }

  if (lat < -90 || lat > 90) {
    return { valid: false, message: "Latitude must be between -90 and 90" };
  }

  if (lng < -180 || lng > 180) {
    return { valid: false, message: "Longitude must be between -180 and 180" };
  }

  return {
    valid: true,
    location: {
      latitude: lat,
      longitude: lng,
    },
  };
};

const safeCaptainResponse = (captain) => {
  if (!captain) {
    return null;
  }

  return captain.toJSON ? captain.toJSON() : { ...captain };
};

const normalizeVehicle = (vehicle) => {
  const safeVehicle = {
    type: "other",
    model: "",
    number: "",
  };

  if (!vehicle || typeof vehicle !== "object") {
    return safeVehicle;
  }

  if (typeof vehicle.type === "string" && validVehicleTypes.includes(vehicle.type)) {
    safeVehicle.type = vehicle.type;
  }

  if (typeof vehicle.model === "string") {
    safeVehicle.model = vehicle.model.trim();
  }

  if (typeof vehicle.number === "string") {
    safeVehicle.number = vehicle.number.trim();
  }

  return safeVehicle;
};

const registerCaptain = async (req, res) => {
  const { name, email, phone, password, vehicle } = req.body;

  if (typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ success: false, message: "Name is required" });
  }

  if (typeof email !== "string" || email.trim() === "" || !emailPattern.test(email.trim())) {
    return res.status(400).json({ success: false, message: "Please provide a valid email address" });
  }

  if (typeof phone !== "string" || phone.trim() === "" || !phonePattern.test(phone.trim()) || !/\d/.test(phone.trim())) {
    return res.status(400).json({ success: false, message: "Please provide a valid phone number" });
  }

  if (typeof password !== "string" || password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
  }

  try {
    const existingCaptain = await Captain.findOne({
      $or: [{ email: email.trim().toLowerCase() }, { phone: phone.trim() }],
    });

    if (existingCaptain) {
      const duplicateField = existingCaptain.email.toLowerCase() === email.trim().toLowerCase() ? "email" : "phone";
      return res.status(409).json({
        success: false,
        message: duplicateField === "email"
          ? "Captain with this email already exists"
          : "Captain with this phone already exists",
      });
    }

    const normalizedVehicle = normalizeVehicle(vehicle);

    const captain = await Captain.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      vehicle: normalizedVehicle,
    });

    return res.status(201).json({
      success: true,
      message: "Captain registered successfully",
      captain: safeCaptainResponse(captain),
    });
  } catch (error) {
    console.error("Captain registration failed:", error);
    return res.status(500).json({ success: false, message: "Unable to register Captain" });
  }
};

const loginCaptain = async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== "string" || email.trim() === "") {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  if (typeof password !== "string" || password.trim() === "") {
    return res.status(400).json({ success: false, message: "Password is required" });
  }

  if (!emailPattern.test(email.trim())) {
    return res.status(400).json({ success: false, message: "Please provide a valid email address" });
  }

  try {
    const captain = await Captain.findOne({ email: email.trim().toLowerCase() }).select("+password");

    if (!captain) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isPasswordValid = await captain.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!captain.isActive) {
      return res.status(403).json({ success: false, message: "Captain account is inactive" });
    }

    const token = jwt.sign({ _id: captain._id, role: "captain" }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      success: true,
      message: "Captain logged in successfully",
      captain: safeCaptainResponse(captain),
    });
  } catch (error) {
    console.error("Captain login failed:", error);
    return res.status(500).json({ success: false, message: "Unable to log in" });
  }
};

const logoutCaptain = async (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  try {
    if (token) {
      await blackListTokenModel.create({ token }).catch(() => {});
    }

    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({ success: true, message: "Captain logged out successfully" });
  } catch (error) {
    console.error("Captain logout failed:", error);
    return res.status(500).json({ success: false, message: "Unable to log out" });
  }
};

const getCaptainProfile = async (req, res) => {
  try {
    const captain = await Captain.findById(req.user._id);

    if (!captain) {
      return res.status(404).json({ success: false, message: "Captain not found" });
    }

    return res.status(200).json({ success: true, captain: safeCaptainResponse(captain) });
  } catch (error) {
    console.error("Fetch captain profile failed:", error);
    return res.status(500).json({ success: false, message: "Unable to retrieve captain profile" });
  }
};

const updateCaptainProfile = async (req, res) => {
  const { name, phone, vehicle } = req.body;
  const updates = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ success: false, message: "Name cannot be empty" });
    }
    updates.name = name.trim();
  }

  if (phone !== undefined) {
    if (typeof phone !== "string" || phone.trim() === "" || !phonePattern.test(phone.trim()) || !/\d/.test(phone.trim())) {
      return res.status(400).json({ success: false, message: "Please provide a valid phone number" });
    }
    updates.phone = phone.trim();
  }

  if (vehicle !== undefined) {
    const normalizedVehicle = normalizeVehicle(vehicle);
    updates.vehicle = normalizedVehicle;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: "No profile fields to update" });
  }

  try {
    const captain = await Captain.findById(req.user._id);

    if (!captain) {
      return res.status(404).json({ success: false, message: "Captain not found" });
    }

    if (updates.phone) {
      const existingCaptain = await Captain.findOne({ phone: updates.phone, _id: { $ne: captain._id } });
      if (existingCaptain) {
        return res.status(409).json({ success: false, message: "Captain with this phone already exists" });
      }
    }

    Object.assign(captain, updates);
    await captain.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      captain: safeCaptainResponse(captain),
    });
  } catch (error) {
    console.error("Captain profile update failed:", error);
    return res.status(500).json({ success: false, message: "Unable to update captain profile" });
  }
};

const changeCaptainPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (typeof currentPassword !== "string" || currentPassword.trim() === "") {
    return res.status(400).json({ success: false, message: "Current password is required" });
  }

  if (typeof newPassword !== "string" || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "New password must be at least 6 characters long" });
  }

  try {
    const captain = await Captain.findById(req.user._id).select("+password");

    if (!captain) {
      return res.status(404).json({ success: false, message: "Captain not found" });
    }

    const isCurrentPasswordValid = await captain.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: "New password must be different from the current password" });
    }

    captain.password = newPassword;
    await captain.save();

    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (token) {
      await blackListTokenModel.create({ token }).catch(() => {});
      res.clearCookie("token", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Captain password change failed:", error);
    return res.status(500).json({ success: false, message: "Unable to change password" });
  }
};

const updateCaptainAvailability = async (req, res) => {
  const { availabilityStatus } = req.body;

  if (!availabilityStatus || !validAvailabilityStatuses.includes(availabilityStatus)) {
    return res.status(400).json({
      success: false,
      message: "Availability status must be one of: offline, available, busy",
    });
  }

  try {
    const captain = await Captain.findById(req.user._id);

    if (!captain) {
      return res.status(404).json({ success: false, message: "Captain not found" });
    }

    captain.availabilityStatus = availabilityStatus;
    await captain.save();

    return res.status(200).json({
      success: true,
      message: "Availability status updated successfully",
      availabilityStatus: captain.availabilityStatus,
    });
  } catch (error) {
    console.error("Captain availability update failed:", error);
    return res.status(500).json({ success: false, message: "Unable to update availability status" });
  }
};

const ensureDeliveryOrderAccess = async (req, res, orderId) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return { error: res.status(400).json({ success: false, message: "Invalid order ID" }) };
  }

  const order = await Order.findById(orderId)
    .populate("customer", "name phone")
    .populate("shop", "shopName address contact");

  if (!order) {
    return { error: res.status(404).json({ success: false, message: "Order not found" }) };
  }

  if (String(order.captain) !== String(req.user._id)) {
    return { error: res.status(403).json({ success: false, message: "You are not authorized to manage this delivery" }) };
  }

  if (order.fulfillmentType !== "delivery") {
    return { error: res.status(400).json({ success: false, message: "This order is not a delivery order" }) };
  }

  return { order };
};

const getCurrentDelivery = async (req, res) => {
  try {
    const order = await Order.findOne({
      captain: req.user._id,
      fulfillmentType: "delivery",
      orderStatus: { $in: ["ready", "picked_up", "out_for_delivery"] },
    })
      .populate("customer", "name phone")
      .populate("shop", "shopName address contact");

    return res.status(200).json({
      success: true,
      delivery: order || null,
    });
  } catch (error) {
    console.error("Fetch current delivery failed:", error);
    return res.status(500).json({ success: false, message: "Unable to retrieve current delivery" });
  }
};

const confirmArrivalAtShop = async (req, res) => {
  const { orderId } = req.params;

  try {
    const result = await ensureDeliveryOrderAccess(req, res, orderId);
    if (result && result.error) {
      return result.error;
    }

    const { order } = result;

    if (order.orderStatus !== "ready") {
      return res.status(400).json({
        success: false,
        message: "This order is not ready for arrival confirmation",
      });
    }

    if (!order.delivery) {
      order.delivery = {};
    }

    order.delivery.arrivedAt = new Date();
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Captain confirmed arrival at shop",
      order,
    });
  } catch (error) {
    console.error("Confirm arrival failed:", error);
    return res.status(500).json({ success: false, message: "Unable to confirm arrival at shop" });
  }
};

const confirmPickup = async (req, res) => {
  const { orderId } = req.params;

  try {
    const result = await ensureDeliveryOrderAccess(req, res, orderId);
    if (result && result.error) {
      return result.error;
    }

    const { order } = result;

    if (order.orderStatus !== "ready") {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery status transition",
      });
    }

    const captain = await Captain.findById(req.user._id);
    if (!captain) {
      return res.status(404).json({ success: false, message: "Captain not found" });
    }

    order.orderStatus = "picked_up";
    if (!order.delivery) {
      order.delivery = {};
    }
    order.delivery.pickedUpAt = new Date();

    captain.availabilityStatus = "busy";

    await Promise.all([order.save(), captain.save()]);

    try {
      await notificationService.notifyOrderStatusUpdate(order, "picked_up");
    } catch (notificationError) {
      console.error("Pickup notification failed:", notificationError);
    }

    return res.status(200).json({
      success: true,
      message: "Order picked up successfully",
      order,
    });
  } catch (error) {
    console.error("Confirm pickup failed:", error);
    return res.status(500).json({ success: false, message: "Unable to confirm pickup" });
  }
};

const startDelivery = async (req, res) => {
  const { orderId } = req.params;

  try {
    const result = await ensureDeliveryOrderAccess(req, res, orderId);
    if (result && result.error) {
      return result.error;
    }

    const { order } = result;

    if (order.orderStatus !== "picked_up") {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery status transition",
      });
    }

    order.orderStatus = "out_for_delivery";
    if (!order.delivery) {
      order.delivery = {};
    }
    order.delivery.startedAt = new Date();
    await order.save();

    try {
      await notificationService.notifyOrderStatusUpdate(order, "out_for_delivery");
    } catch (notificationError) {
      console.error("Out for delivery notification failed:", notificationError);
    }

    return res.status(200).json({
      success: true,
      message: "Delivery started successfully",
      order,
    });
  } catch (error) {
    console.error("Start delivery failed:", error);
    return res.status(500).json({ success: false, message: "Unable to start delivery" });
  }
};

const completeDelivery = async (req, res) => {
  const { orderId } = req.params;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (String(order.captain) !== String(req.user._id)) {
      await session.abortTransaction();
      return res.status(403).json({ success: false, message: "You are not authorized to manage this delivery" });
    }

    if (order.fulfillmentType !== "delivery") {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "This order is not a delivery order" });
    }

    if (order.orderStatus !== "out_for_delivery") {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid delivery status transition" });
    }

    try {
      paymentService.validatePaymentForCompletion(order);
    } catch (paymentError) {
      await session.abortTransaction();
      return res.status(paymentError.statusCode || 400).json({
        success: false,
        message: paymentError.message,
      });
    }

    const captain = await Captain.findById(req.user._id).session(session);
    if (!captain) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Captain not found" });
    }

    order.orderStatus = "completed";
    order.delivery = order.delivery || {};
    order.delivery.completedAt = new Date();
    captain.availabilityStatus = "available";

    await order.save({ session });
    await captain.save({ session });

    await session.commitTransaction();

    try {
      await notificationService.notifyOrderStatusUpdate(order, "completed");
    } catch (notificationError) {
      console.error("Delivery completion notification failed:", notificationError);
    }

    return res.status(200).json({
      success: true,
      message: "Delivery completed successfully",
      order,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("Complete delivery failed:", error);
    return res.status(500).json({ success: false, message: "Unable to complete delivery" });
  } finally {
    session.endSession();
  }
};

const getDeliveryHistory = async (req, res) => {
  try {
    const orders = await Order.find({
      captain: req.user._id,
      fulfillmentType: "delivery",
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .populate("customer", "name phone")
      .populate("shop", "shopName address contact");

    return res.status(200).json({
      success: true,
      deliveries: orders,
    });
  } catch (error) {
    console.error("Fetch delivery history failed:", error);
    return res.status(500).json({ success: false, message: "Unable to retrieve delivery history" });
  }
};

const getCaptainLocation = async (req, res) => {
  try {
    const captain = await Captain.findById(req.user._id);

    if (!captain) {
      return res.status(404).json({ success: false, message: "Captain not found" });
    }

    return res.status(200).json({
      success: true,
      location: captain.location || null,
      locationUpdatedAt: captain.locationUpdatedAt || null,
    });
  } catch (error) {
    console.error("Fetch captain location failed:", error);
    return res.status(500).json({ success: false, message: "Unable to retrieve captain location" });
  }
};

const updateCaptainLocation = async (req, res) => {
  const { latitude, longitude } = req.body;
  const validation = validateLocationPayload(latitude, longitude);

  if (!validation.valid) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  try {
    const captain = await Captain.findById(req.user._id);

    if (!captain) {
      return res.status(404).json({ success: false, message: "Captain not found" });
    }

    captain.location = validation.location;
    captain.locationUpdatedAt = new Date();
    await captain.save();

    return res.status(200).json({
      success: true,
      message: "Captain location updated successfully",
      location: captain.location,
      locationUpdatedAt: captain.locationUpdatedAt,
    });
  } catch (error) {
    console.error("Update captain location failed:", error);
    return res.status(500).json({ success: false, message: "Unable to update captain location" });
  }
};

module.exports = {
  registerCaptain,
  loginCaptain,
  logoutCaptain,
  getCaptainProfile,
  updateCaptainProfile,
  changeCaptainPassword,
  updateCaptainAvailability,
  getCaptainLocation,
  updateCaptainLocation,
  getCurrentDelivery,
  confirmArrivalAtShop,
  confirmPickup,
  startDelivery,
  completeDelivery,
  getDeliveryHistory,
};
