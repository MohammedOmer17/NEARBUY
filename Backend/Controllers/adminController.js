const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Admin = require("../models/AdminModel");
const Customer = require("../models/CustomerModel");
const ShopOwner = require("../models/ShopOwnerModel");
const Shop = require("../models/ShopModel");
const Captain = require("../models/CaptainModel");
const Order = require("../models/Order");
const blackListTokenModel = require("../models/blackListTokenModel");
const notificationService = require("../services/notificationService");
const adminService = require("../services/adminService");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createAdminToken = (admin) => {
  return jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

const safeAdminResponse = (admin) => {
  if (!admin) {
    return null;
  }

  const safeAdmin = admin.toJSON ? admin.toJSON() : { ...admin };
  delete safeAdmin.password;
  return safeAdmin;
};

const safeCustomerResponse = (customer) => {
  if (!customer) {
    return null;
  }

  const safeCustomer = customer.toJSON ? customer.toJSON() : { ...customer };
  delete safeCustomer.password;
  return safeCustomer;
};

const safeShopOwnerResponse = (owner) => {
  if (!owner) {
    return null;
  }

  const safeOwner = owner.toJSON ? owner.toJSON() : { ...owner };
  delete safeOwner.password;
  return safeOwner;
};

const safeCaptainResponse = (captain) => {
  if (!captain) {
    return null;
  }

  const safeCaptain = captain.toJSON ? captain.toJSON() : { ...captain };
  delete safeCaptain.password;
  return safeCaptain;
};

const getPagination = (page, limit) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 50);
  return { page: safePage, limit: safeLimit };
};

const parseDateRange = (query) => {
  const result = {};
  if (query.startDate) {
    result.startDate = new Date(query.startDate);
  }
  if (query.endDate) {
    result.endDate = new Date(query.endDate);
  }
  if (result.startDate && Number.isNaN(result.startDate.getTime())) {
    result.startDate = null;
  }
  if (result.endDate && Number.isNaN(result.endDate.getTime())) {
    result.endDate = null;
  }
  return result;
};

const registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ success: false, message: "Name is required" });
  }

  if (!email || typeof email !== "string" || !emailPattern.test(email.trim())) {
    return res.status(400).json({ success: false, message: "Please provide a valid email address" });
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
  }

  try {
    const existingAdmin = await Admin.findOne({ email: email.trim().toLowerCase() });
    if (existingAdmin) {
      return res.status(409).json({ success: false, message: "Admin with this email already exists" });
    }

    const admin = await Admin.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: safeAdminResponse(admin),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to register admin" });
  }
};

const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || typeof email !== "string" || !emailPattern.test(email.trim())) {
    return res.status(400).json({ success: false, message: "Please provide a valid email address" });
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
  }

  try {
    const admin = await Admin.findOne({ email: email.trim().toLowerCase() }).select("+password");

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: "Admin account is inactive" });
    }

    const token = createAdminToken(admin);
    admin.lastLoginAt = new Date();
    await admin.save();

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: safeAdminResponse(admin),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to log in as admin" });
  }
};

const logoutAdmin = async (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  try {
    if (token) {
      await blackListTokenModel.create({ token });
    }

    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to log out admin" });
  }
};

const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    return res.status(200).json({ success: true, data: safeAdminResponse(admin) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch admin profile" });
  }
};

const getCustomers = async (req, res) => {
  try {
    const { page, limit } = getPagination(req.query.page, req.query.limit);
    const search = String(req.query.search || "").trim();
    const isActiveFilter = req.query.isActive;

    const query = {};
    const searchQuery = adminService.buildSearchQuery(search, ["name", "email", "phone"]);

    Object.assign(query, searchQuery);

    if (isActiveFilter !== undefined) {
      query.isActive = isActiveFilter === "true";
    }

    const [customers, total] = await Promise.all([
      Customer.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Customer.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: customers.map((customer) => safeCustomerResponse(customer)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch customers" });
  }
};

const getCustomerById = async (req, res) => {
  const { customerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return res.status(400).json({ success: false, message: "Invalid customer ID" });
  }

  try {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    return res.status(200).json({ success: true, data: safeCustomerResponse(customer) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch customer" });
  }
};

const activateCustomer = async (req, res) => {
  const { customerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return res.status(400).json({ success: false, message: "Invalid customer ID" });
  }

  try {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    customer.isActive = true;
    await customer.save();

    return res.status(200).json({ success: true, message: "Customer activated successfully", data: safeCustomerResponse(customer) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to activate customer" });
  }
};

const deactivateCustomer = async (req, res) => {
  const { customerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return res.status(400).json({ success: false, message: "Invalid customer ID" });
  }

  try {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    customer.isActive = false;
    await customer.save();

    return res.status(200).json({ success: true, message: "Customer deactivated successfully", data: safeCustomerResponse(customer) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to deactivate customer" });
  }
};

const getShopOwners = async (req, res) => {
  try {
    const { page, limit } = getPagination(req.query.page, req.query.limit);
    const search = String(req.query.search || "").trim();
    const accountStatus = req.query.accountStatus;

    const query = {};
    const searchQuery = adminService.buildSearchQuery(search, ["name", "email", "phone"]);
    Object.assign(query, searchQuery);

    if (accountStatus) {
      query.accountStatus = accountStatus;
    }

    const [owners, total] = await Promise.all([
      ShopOwner.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      ShopOwner.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: owners.map((owner) => safeShopOwnerResponse(owner)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch shop owners" });
  }
};

const getShopOwnerById = async (req, res) => {
  const { ownerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(ownerId)) {
    return res.status(400).json({ success: false, message: "Invalid shop owner ID" });
  }

  try {
    const shopOwner = await ShopOwner.findById(ownerId);
    if (!shopOwner) {
      return res.status(404).json({ success: false, message: "Shop owner not found" });
    }

    const shop = await Shop.findOne({ owner: shopOwner._id });

    return res.status(200).json({
      success: true,
      data: {
        owner: safeShopOwnerResponse(shopOwner),
        shop,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch shop owner" });
  }
};

const updateShopOwnerStatus = async (req, res, nextStatus, notificationType, messageText) => {
  const { ownerId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(ownerId)) {
    return res.status(400).json({ success: false, message: "Invalid shop owner ID" });
  }

  try {
    const owner = await ShopOwner.findById(ownerId);
    if (!owner) {
      return res.status(404).json({ success: false, message: "Shop owner not found" });
    }

    owner.accountStatus = nextStatus;
    await owner.save();

    try {
      await notificationService.createNotification({
        recipient: owner._id,
        recipientRole: "shopOwner",
        type: notificationType,
        title: messageText.title,
        message: messageText.message,
        relatedEntity: null,
      });
    } catch (notificationError) {
      console.error("Shop owner account notification failed:", notificationError);
    }

    return res.status(200).json({
      success: true,
      message: `Shop owner account ${nextStatus} successfully`,
      data: safeShopOwnerResponse(owner),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to update shop owner status" });
  }
};

const approveShopOwner = async (req, res) => {
  return updateShopOwnerStatus(req, res, "approved", "ACCOUNT_APPROVED", {
    title: "Shop Owner Account Approved",
    message: "Your shop owner account has been approved.",
  });
};

const rejectShopOwner = async (req, res) => {
  return updateShopOwnerStatus(req, res, "rejected", "ACCOUNT_REJECTED", {
    title: "Shop Owner Account Rejected",
    message: "Your shop owner account has been rejected.",
  });
};

const suspendShopOwner = async (req, res) => {
  return updateShopOwnerStatus(req, res, "suspended", "ACCOUNT_SUSPENDED", {
    title: "Shop Owner Account Suspended",
    message: "Your shop owner account has been suspended.",
  });
};

const getShops = async (req, res) => {
  try {
    const { page, limit } = getPagination(req.query.page, req.query.limit);
    const search = String(req.query.search || "").trim();
    const status = req.query.status;

    const query = {};
    const searchQuery = adminService.buildSearchQuery(search, ["shopName", "address", "contact"]);
    Object.assign(query, searchQuery);

    if (status) {
      query.status = status;
    }

    const [shops, total] = await Promise.all([
      Shop.find(query).populate("owner", "name email phone").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Shop.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: shops,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch shops" });
  }
};

const getShopById = async (req, res) => {
  const { shopId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(shopId)) {
    return res.status(400).json({ success: false, message: "Invalid shop ID" });
  }

  try {
    const shop = await Shop.findById(shopId).populate("owner", "name email phone");
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    return res.status(200).json({ success: true, data: shop });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch shop" });
  }
};

const updateShopStatus = async (req, res, nextStatus) => {
  const { shopId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(shopId)) {
    return res.status(400).json({ success: false, message: "Invalid shop ID" });
  }

  try {
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    shop.status = nextStatus;
    await shop.save();

    return res.status(200).json({ success: true, message: `Shop ${nextStatus} successfully`, data: shop });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to update shop status" });
  }
};

const activateShop = async (req, res) => updateShopStatus(req, res, "active");
const deactivateShop = async (req, res) => updateShopStatus(req, res, "inactive");
const suspendShop = async (req, res) => updateShopStatus(req, res, "suspended");

const getCaptains = async (req, res) => {
  try {
    const { page, limit } = getPagination(req.query.page, req.query.limit);
    const search = String(req.query.search || "").trim();
    const accountStatus = req.query.accountStatus;
    const availabilityStatus = req.query.availabilityStatus;

    const query = {};
    const searchQuery = adminService.buildSearchQuery(search, ["name", "email", "phone"]);
    Object.assign(query, searchQuery);

    if (accountStatus) {
      query.accountStatus = accountStatus;
    }

    if (availabilityStatus) {
      query.availabilityStatus = availabilityStatus;
    }

    const [captains, total] = await Promise.all([
      Captain.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Captain.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: captains.map((captain) => safeCaptainResponse(captain)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch captains" });
  }
};

const getCaptainById = async (req, res) => {
  const { captainId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(captainId)) {
    return res.status(400).json({ success: false, message: "Invalid captain ID" });
  }

  try {
    const captain = await Captain.findById(captainId);
    if (!captain) {
      return res.status(404).json({ success: false, message: "Captain not found" });
    }

    return res.status(200).json({ success: true, data: safeCaptainResponse(captain) });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch captain" });
  }
};

const updateCaptainStatus = async (req, res, nextStatus, notificationType, messageText) => {
  const { captainId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(captainId)) {
    return res.status(400).json({ success: false, message: "Invalid captain ID" });
  }

  try {
    const captain = await Captain.findById(captainId);
    if (!captain) {
      return res.status(404).json({ success: false, message: "Captain not found" });
    }

    captain.accountStatus = nextStatus;
    await captain.save();

    try {
      await notificationService.createNotification({
        recipient: captain._id,
        recipientRole: "captain",
        type: notificationType,
        title: messageText.title,
        message: messageText.message,
        relatedEntity: null,
      });
    } catch (notificationError) {
      console.error("Captain account notification failed:", notificationError);
    }

    return res.status(200).json({
      success: true,
      message: `Captain account ${nextStatus} successfully`,
      data: safeCaptainResponse(captain),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to update captain status" });
  }
};

const approveCaptain = async (req, res) => {
  return updateCaptainStatus(req, res, "approved", "ACCOUNT_APPROVED", {
    title: "Captain Account Approved",
    message: "Your captain account has been approved.",
  });
};

const rejectCaptain = async (req, res) => {
  return updateCaptainStatus(req, res, "rejected", "ACCOUNT_REJECTED", {
    title: "Captain Account Rejected",
    message: "Your captain account has been rejected.",
  });
};

const suspendCaptain = async (req, res) => {
  return updateCaptainStatus(req, res, "suspended", "ACCOUNT_SUSPENDED", {
    title: "Captain Account Suspended",
    message: "Your captain account has been suspended.",
  });
};

const getOrders = async (req, res) => {
  try {
    const { page, limit } = getPagination(req.query.page, req.query.limit);
    const { status, fulfillmentType, paymentStatus, paymentMethod, startDate, endDate } = req.query;
    const dateRange = parseDateRange({ startDate, endDate });

    const query = {};
    if (status) query.orderStatus = status;
    if (fulfillmentType) query.fulfillmentType = fulfillmentType;
    if (paymentMethod) query["payment.method"] = paymentMethod;
    if (paymentStatus) query["payment.status"] = paymentStatus;
    if (dateRange.startDate || dateRange.endDate) {
      query.createdAt = {};
      if (dateRange.startDate) query.createdAt.$gte = dateRange.startDate;
      if (dateRange.endDate) query.createdAt.$lte = dateRange.endDate;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("customer", "name email phone")
        .populate("shop", "shopName address contact")
        .populate("captain", "name email phone")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch orders" });
  }
};

const getOrderById = async (req, res) => {
  const { orderId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ success: false, message: "Invalid order ID" });
  }

  try {
    const order = await Order.findById(orderId)
      .populate("customer", "name email phone")
      .populate("shop", "shopName address contact")
      .populate("captain", "name email phone");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch order" });
  }
};

const getAdminDashboard = async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch dashboard statistics" });
  }
};

const getOrderStatistics = async (req, res) => {
  try {
    const stats = await adminService.getOrderStats(parseDateRange(req.query));
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch order statistics" });
  }
};

const getSalesStatistics = async (req, res) => {
  try {
    const stats = await adminService.getSalesStats(parseDateRange(req.query));
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch sales statistics" });
  }
};

const getPaymentStatistics = async (req, res) => {
  try {
    const stats = await adminService.getPaymentStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to fetch payment statistics" });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  logoutAdmin,
  getAdminProfile,
  getCustomers,
  getCustomerById,
  activateCustomer,
  deactivateCustomer,
  getShopOwners,
  getShopOwnerById,
  approveShopOwner,
  rejectShopOwner,
  suspendShopOwner,
  getShops,
  getShopById,
  activateShop,
  deactivateShop,
  suspendShop,
  getCaptains,
  getCaptainById,
  approveCaptain,
  rejectCaptain,
  suspendCaptain,
  getOrders,
  getOrderById,
  getAdminDashboard,
  getOrderStatistics,
  getSalesStatistics,
  getPaymentStatistics,
};
