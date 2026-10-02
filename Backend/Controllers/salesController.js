const Shop = require("../models/ShopModel");
const Order = require("../models/Order");

const allowedPeriods = ["daily", "weekly", "monthly"];

const getOwnerShop = async (req, res) => {
  const ownerId = req.user?._id;

  if (!ownerId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const shop = await Shop.findOne({ owner: ownerId });

  if (!shop) {
    return res.status(404).json({ message: "Shop not found for this owner" });
  }

  return shop;
};

const parseDateValue = (value, label) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid ${label}`);
  }

  return parsedDate;
};

const normalizeDateRange = (startDate, endDate, defaultRange = null) => {
  let start = startDate ? parseDateValue(startDate, "startDate") : defaultRange?.start || null;
  let end = endDate ? parseDateValue(endDate, "endDate") : defaultRange?.end || null;

  if (start && end && end < start) {
    throw new Error("End date must be greater than or equal to start date");
  }

  if (start && !end) {
    end = new Date();
  }

  if (!start && end) {
    start = new Date(0);
  }

  return {
    start,
    end,
  };
};

const buildDateFilter = (startDate, endDate, defaultRange = null) => {
  const dates = normalizeDateRange(startDate, endDate, defaultRange);

  const filter = {};

  if (dates.start) {
    filter.$gte = dates.start;
  }

  if (dates.end) {
    filter.$lte = dates.end;
  }

  return Object.keys(filter).length > 0 ? { createdAt: filter } : {};
};

const getSalesSummary = async (req, res) => {
  try {
    const shop = await getOwnerShop(req, res);

    if (!shop) {
      return;
    }

    const dateFilter = buildDateFilter(req.query.startDate, req.query.endDate);

    const [summary] = await Order.aggregate([
      {
        $match: {
          shop: shop._id,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "completed"] }, 1, 0],
            },
          },
          cancelledOrders: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0],
            },
          },
          totalSales: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "completed"] }, "$totalAmount", 0],
            },
          },
        },
      },
    ]);

    const totalOrders = summary?.totalOrders || 0;
    const completedOrders = summary?.completedOrders || 0;
    const cancelledOrders = summary?.cancelledOrders || 0;
    const totalSales = Number(summary?.totalSales || 0);
    const averageOrderValue = completedOrders > 0 ? Number((totalSales / completedOrders).toFixed(2)) : 0;

    return res.status(200).json({
      success: true,
      summary: {
        totalSales,
        totalOrders,
        completedOrders,
        cancelledOrders,
        averageOrderValue,
      },
    });
  } catch (error) {
    console.error("Get sales summary failed:", error);

    if (error.message.includes("Invalid")) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Unable to fetch sales summary" });
  }
};

const getSalesStatistics = async (req, res) => {
  try {
    const shop = await getOwnerShop(req, res);

    if (!shop) {
      return;
    }

    const dateFilter = buildDateFilter(req.query.startDate, req.query.endDate);

    const [stats] = await Order.aggregate([
      {
        $match: {
          shop: shop._id,
          ...dateFilter,
        },
      },
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                completedOrders: {
                  $sum: {
                    $cond: [{ $eq: ["$orderStatus", "completed"] }, 1, 0],
                  },
                },
                cancelledOrders: {
                  $sum: {
                    $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0],
                  },
                },
                totalSales: {
                  $sum: {
                    $cond: [{ $eq: ["$orderStatus", "completed"] }, "$totalAmount", 0],
                  },
                },
                pickupOrders: {
                  $sum: {
                    $cond: [{ $eq: ["$fulfillmentType", "pickup"] }, 1, 0],
                  },
                },
                deliveryOrders: {
                  $sum: {
                    $cond: [{ $eq: ["$fulfillmentType", "delivery"] }, 1, 0],
                  },
                },
              },
            },
          ],
          itemSummary: [
            { $match: { orderStatus: "completed" } },
            { $unwind: "$items" },
            {
              $group: {
                _id: null,
                totalItemsSold: { $sum: "$items.quantity" },
              },
            },
          ],
        },
      },
    ]);

    const overview = stats?.overview?.[0] || {
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalSales: 0,
      pickupOrders: 0,
      deliveryOrders: 0,
    };

    const itemSummary = stats?.itemSummary?.[0] || { totalItemsSold: 0 };
    const totalSales = Number(overview.totalSales || 0);
    const completedOrders = overview.completedOrders || 0;

    return res.status(200).json({
      success: true,
      statistics: {
        totalOrders: overview.totalOrders || 0,
        completedOrders,
        cancelledOrders: overview.cancelledOrders || 0,
        totalSales,
        averageOrderValue: completedOrders > 0 ? Number((totalSales / completedOrders).toFixed(2)) : 0,
        totalItemsSold: itemSummary.totalItemsSold || 0,
        pickupOrders: overview.pickupOrders || 0,
        deliveryOrders: overview.deliveryOrders || 0,
      },
    });
  } catch (error) {
    console.error("Get sales statistics failed:", error);

    if (error.message.includes("Invalid")) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Unable to fetch sales statistics" });
  }
};

const getSalesTrends = async (req, res) => {
  try {
    const shop = await getOwnerShop(req, res);

    if (!shop) {
      return;
    }

    const period = (req.query.period || "daily").toLowerCase();

    if (!allowedPeriods.includes(period)) {
      return res.status(400).json({ message: "Invalid period. Use daily, weekly, or monthly." });
    }

    let startDate = req.query.startDate ? parseDateValue(req.query.startDate, "startDate") : null;
    let endDate = req.query.endDate ? parseDateValue(req.query.endDate, "endDate") : null;

    if (startDate && endDate && endDate < startDate) {
      return res.status(400).json({ message: "End date must be greater than or equal to start date" });
    }

    if (!startDate && !endDate) {
      const now = new Date();

      if (period === "daily") {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      if (period === "weekly") {
        startDate = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
      }

      if (period === "monthly") {
        startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
      }

      endDate = now;
    }

    if (startDate && !endDate) {
      endDate = new Date();
    }

    if (!startDate && endDate) {
      startDate = new Date(0);
    }

    const groupExpression =
      period === "daily"
        ? { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
        : period === "weekly"
          ? { $dateToString: { format: "%Y-%m-%d", date: { $dateTrunc: { date: "$createdAt", unit: "week", timezone: "UTC" } } } }
          : { $dateToString: { format: "%Y-%m", date: "$createdAt" } };

    const data = await Order.aggregate([
      {
        $match: {
          shop: shop._id,
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
          orderStatus: "completed",
        },
      },
      {
        $group: {
          _id: groupExpression,
          sales: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          sales: 1,
          orders: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      period,
      data,
    });
  } catch (error) {
    console.error("Get sales trends failed:", error);

    if (error.message.includes("Invalid")) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Unable to fetch sales trends" });
  }
};

const getTopSellingProducts = async (req, res) => {
  try {
    const shop = await getOwnerShop(req, res);

    if (!shop) {
      return;
    }

    const dateFilter = buildDateFilter(req.query.startDate, req.query.endDate);
    const rawLimit = Number(req.query.limit ?? 5);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 5;

    const products = await Order.aggregate([
      {
        $match: {
          shop: shop._id,
          orderStatus: "completed",
          ...dateFilter,
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          unit: { $first: "$items.unit" },
          quantitySold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      { $sort: { quantitySold: -1, revenue: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          product: "$_id",
          name: 1,
          unit: 1,
          quantitySold: 1,
          revenue: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Get top selling products failed:", error);

    if (error.message.includes("Invalid")) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Unable to fetch top selling products" });
  }
};

module.exports = {
  getSalesSummary,
  getSalesStatistics,
  getSalesTrends,
  getTopSellingProducts,
};
