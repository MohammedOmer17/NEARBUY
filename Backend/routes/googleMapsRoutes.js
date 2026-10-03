const express = require("express");
const { authCaptain, authShopOwner } = require("../Middlewares/authMiddleware");
const {
  getCaptainToShop,
  getCaptainToCustomer,
  getShopToCustomer,
} = require("../Controllers/googleMapsController");

const router = express.Router();

router.get("/captain-to-shop/:shopId", authCaptain, getCaptainToShop);
router.get("/captain-to-customer/:orderId", authCaptain, getCaptainToCustomer);
router.get("/shop-to-customer/:orderId", authShopOwner, getShopToCustomer);

module.exports = router;
