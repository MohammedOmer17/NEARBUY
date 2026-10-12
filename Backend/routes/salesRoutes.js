const express = require("express");
const {
  getSalesSummary,
  getSalesStatistics,
  getSalesTrends,
  getTopSellingProducts,
} = require("../Controllers/salesController");
const { authShopOwner } = require("../Middlewares/authMiddleware");

const router = express.Router();

router.get("/summary", authShopOwner, getSalesSummary);
router.get("/statistics", authShopOwner, getSalesStatistics);
router.get("/trends", authShopOwner, getSalesTrends);
router.get("/top-products", authShopOwner, getTopSellingProducts);

module.exports = router;
