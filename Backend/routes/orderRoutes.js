const express = require("express");
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getShopOrders,
  getShopOrderById,
  acceptOrder,
  updateShopOrderStatus,
} = require("../controllers/orderController");
const {
  getCustomerShopPayment,
  markOrderAsPaid,
  confirmOrderPayment,
  confirmCodPayment,
} = require("../Controllers/paymentController");
const { authCustomer, authShopOwner } = require("../Middlewares/authMiddleware");

const router = express.Router();

router.post("/orders", authCustomer, createOrder);
router.get("/orders", authCustomer, getMyOrders);
router.get("/orders/:orderId", authCustomer, getOrderById);
router.put("/orders/:orderId/cancel", authCustomer, cancelOrder);
router.patch("/orders/:orderId/payment/mark-paid", authCustomer, markOrderAsPaid);
router.get("/shop/:shopId/payment", authCustomer, getCustomerShopPayment);

router.get("/shop/orders", authShopOwner, getShopOrders);
router.get("/shop/orders/:orderId", authShopOwner, getShopOrderById);
router.put("/shop/orders/:orderId/accept", authShopOwner, acceptOrder);
router.put("/shop/orders/:orderId/status", authShopOwner, updateShopOrderStatus);
router.patch("/shop/orders/:orderId/payment/confirm", authShopOwner, confirmOrderPayment);
router.patch("/shop/orders/:orderId/payment/confirm-cod", authShopOwner, confirmCodPayment);

module.exports = router;
