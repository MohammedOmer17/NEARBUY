const express = require("express");
const {
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
} = require("../Controllers/captainController");
const { collectDeliveryPayment } = require("../Controllers/paymentController");
const { authCaptain } = require("../Middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerCaptain);
router.post("/login", loginCaptain);
router.post("/logout", authCaptain, logoutCaptain);

router.get("/profile", authCaptain, getCaptainProfile);
router.put("/profile", authCaptain, updateCaptainProfile);
router.put("/change-password", authCaptain, changeCaptainPassword);
router.patch("/availability", authCaptain, updateCaptainAvailability);
router.get("/location", authCaptain, getCaptainLocation);
router.patch("/location", authCaptain, updateCaptainLocation);

router.get("/deliveries/current", authCaptain, getCurrentDelivery);
router.patch("/deliveries/:orderId/arrived", authCaptain, confirmArrivalAtShop);
router.patch("/deliveries/:orderId/pickup", authCaptain, confirmPickup);
router.patch("/deliveries/:orderId/start", authCaptain, startDelivery);
router.patch("/deliveries/:orderId/payment/collect", authCaptain, collectDeliveryPayment);
router.patch("/deliveries/:orderId/complete", authCaptain, completeDelivery);
router.get("/deliveries/history", authCaptain, getDeliveryHistory);

module.exports = router;
