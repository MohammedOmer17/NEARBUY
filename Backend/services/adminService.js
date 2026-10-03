const Customer = require("../models/CustomerModel");
const ShopOwner = require("../models/ShopOwnerModel");
const Shop = require("../models/ShopModel");
const Captain = require("../models/CaptainModel");
const Order = require("../models/Order");

const buildPagination = (page, limit) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 50);
  return { page: safePage, limit: safeLimit };
};

const buildSearchQuery = (search, fields) => {
  if (!search || !fields || fields.length === 0) {
    return {};
  }

  const keyword = String(search).trim();
  if (!keyword) {
    return {};
  }

  return {
    $or: fields.map((field) => ({
      [field]: { $regex: keyword, $options: "i" },
    })),
  };
};

const getDashboardStats = async () => {
  const [
    totalCustomers,
    activeCustomers,
    inactiveCustomers,
    totalShopOwners,
    pendingShopOwners,
    approvedShopOwners,
    suspendedShopOwners,
    totalShops,
    activeShops,
    inactiveShops,
    suspendedShops,
    totalCaptains,
    pendingCaptains,
    approvedCaptains,
    suspendedCaptains,
    availableCaptains,
    busyCaptains,
    totalOrders,
    placedOrders,
    completedOrders,
    cancelledOrders,
    activeOrders,
    pendingPayments,
    customerMarkedPayments,
    paidPayments,
    totalCompletedSales,
  ] = await Promise.all([
    Customer.countDocuments(),
    Customer.countDocuments({ isActive: true }),
    Customer.countDocuments({ isActive: false }),
    ShopOwner.countDocuments(),
    ShopOwner.countDocuments({ accountStatus: "pending" }),
    ShopOwner.countDocuments({ accountStatus: "approved" }),
    ShopOwner.countDocuments({ accountStatus: "suspended" }),
    Shop.countDocuments(),
    Shop.countDocuments({ status: "active" }),
    Shop.countDocuments({ status: "inactive" }),
    Shop.countDocuments({ status: "suspended" }),
    Captain.countDocuments(),
    Captain.countDocuments({ accountStatus: "pending" }),
    Captain.countDocuments({ accountStatus: "approved" }),
    Captain.countDocuments({ accountStatus: "suspended" }),
    Captain.countDocuments({ availabilityStatus: "available" }),
    Captain.countDocuments({ availabilityStatus: "busy" }),
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: "placed" }),
    Order.countDocuments({ orderStatus: "completed" }),
    Order.countDocuments({ orderStatus: "cancelled" }),
    Order.countDocuments({ orderStatus: { $in: ["placed", "accepted", "preparing", "ready", "picked_up", "out_for_delivery"] } }),
    Order.countDocuments({ "payment.status": "pending" }),
    Order.countDocuments({ "payment.status": "customer_marked_paid" }),
    Order.countDocuments({ "payment.status": "paid" }),
    Order.aggregate([
      { $match: { orderStatus: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
  ]);

  return {
    customers: {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
    },
    shopOwners: {
      totalShopOwners,
      pendingShopOwners,
      approvedShopOwners,
      suspendedShopOwners,
    },
    shops: {
      totalShops,
      activeShops,
      inactiveShops,
      suspendedShops,
    },
    captains: {
      totalCaptains,
      pendingCaptains,
      approvedCaptains,
      suspendedCaptains,
      availableCaptains,
      busyCaptains,
    },
    orders: {
      totalOrders,
      placedOrders,
      completedOrders,
      cancelledOrders,
      activeOrders,
    },
    payments: {
      pendingPayments,
      customerMarkedPayments: customerMarkedPayments,
      paidPayments,
    },
    sales: {
      totalCompletedSales: Number((totalCompletedSales[0]?.total || 0).toFixed(2)),
    },
  };
};

const getOrderStats = async ({ startDate, endDate } = {}) => {
  const query = {};

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const [
    totalOrders,
    completedOrders,
    cancelledOrders,
    activeOrders,
    pickupOrders,
    deliveryOrders,
  ] = await Promise.all([
    Order.countDocuments(query),
    Order.countDocuments({ ...query, orderStatus: "completed" }),
    Order.countDocuments({ ...query, orderStatus: "cancelled" }),
    Order.countDocuments({
      ...query,
      orderStatus: { $in: ["placed", "accepted", "preparing", "ready", "picked_up", "out_for_delivery"] },
    }),
    Order.countDocuments({ ...query, fulfillmentType: "pickup" }),
    Order.countDocuments({ ...query, fulfillmentType: "delivery" }),
  ]);

  return {
    totalOrders,
    completedOrders,
    cancelledOrders,
    activeOrders,
    pickupOrders,
    deliveryOrders,
  };
};

const getSalesStats = async ({ startDate, endDate } = {}) => {
  const query = { orderStatus: "completed" };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const result = await Order.aggregate([
    { $match: query },
    { $group: { _id: null, totalSales: { $sum: "$totalAmount" }, totalCompletedOrders: { $sum: 1 } } },
  ]);

  const totalSales = result[0]?.totalSales || 0;
  const totalCompletedOrders = result[0]?.totalCompletedOrders || 0;

  return {
    totalSales: Number(totalSales.toFixed(2)),
    totalCompletedOrders,
    averageOrderValue: totalCompletedOrders > 0 ? Number((totalSales / totalCompletedOrders).toFixed(2)) : 0,
  };
};

const getPaymentStats = async () => {
  const [totalPayments, pendingPayments, customerMarkedPayments, paidPayments, shopUpiPayments, codPayments] = await Promise.all([
    Order.countDocuments({ "payment.method": { $exists: true } }),
    Order.countDocuments({ "payment.method": "shop_upi", "payment.status": "pending" }),
    Order.countDocuments({ "payment.method": "shop_upi", "payment.status": "customer_marked_paid" }),
    Order.countDocuments({ "payment.status": "paid" }),
    Order.countDocuments({ "payment.method": "shop_upi" }),
    Order.countDocuments({ "payment.method": "cod" }),
  ]);

  return {
    totalPayments,
    pendingPayments,
    customerMarkedPayments,
    paidPayments,
    byMethod: {
      shop_upi: shopUpiPayments,
      cod: codPayments,
    },
  };
};

module.exports = {
  buildPagination,
  buildSearchQuery,
  getDashboardStats,
  getOrderStats,
  getSalesStats,
  getPaymentStats,
};
