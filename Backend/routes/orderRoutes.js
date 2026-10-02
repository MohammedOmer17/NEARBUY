const express = require("express");
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
} = require("../controllers/orderController");
const { authCustomer } = require("../Middlewares/authMiddleware");

const router = express.Router();

router.post("/orders", authCustomer, createOrder);
router.get("/orders", authCustomer, getMyOrders);
router.get("/orders/:orderId", authCustomer, getOrderById);
router.put("/orders/:orderId/cancel", authCustomer, cancelOrder);

module.exports = router;
