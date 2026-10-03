const express = require("express");
const adminController = require("../Controllers/adminController");
const { adminAuth } = require("../Middlewares/adminMiddleware");

const router = express.Router();

router.post("/register", adminController.registerAdmin);
router.post("/login", adminController.loginAdmin);
router.post("/logout", adminAuth, adminController.logoutAdmin);
router.get("/me", adminAuth, adminController.getAdminProfile);

router.get("/customers", adminAuth, adminController.getCustomers);
router.get("/customers/:customerId", adminAuth, adminController.getCustomerById);
router.patch("/customers/:customerId/activate", adminAuth, adminController.activateCustomer);
router.patch("/customers/:customerId/deactivate", adminAuth, adminController.deactivateCustomer);

router.get("/shop-owners", adminAuth, adminController.getShopOwners);
router.get("/shop-owners/:ownerId", adminAuth, adminController.getShopOwnerById);
router.patch("/shop-owners/:ownerId/approve", adminAuth, adminController.approveShopOwner);
router.patch("/shop-owners/:ownerId/reject", adminAuth, adminController.rejectShopOwner);
router.patch("/shop-owners/:ownerId/suspend", adminAuth, adminController.suspendShopOwner);

router.get("/shops", adminAuth, adminController.getShops);
router.get("/shops/:shopId", adminAuth, adminController.getShopById);
router.patch("/shops/:shopId/activate", adminAuth, adminController.activateShop);
router.patch("/shops/:shopId/deactivate", adminAuth, adminController.deactivateShop);
router.patch("/shops/:shopId/suspend", adminAuth, adminController.suspendShop);

router.get("/captains", adminAuth, adminController.getCaptains);
router.get("/captains/:captainId", adminAuth, adminController.getCaptainById);
router.patch("/captains/:captainId/approve", adminAuth, adminController.approveCaptain);
router.patch("/captains/:captainId/reject", adminAuth, adminController.rejectCaptain);
router.patch("/captains/:captainId/suspend", adminAuth, adminController.suspendCaptain);

router.get("/orders", adminAuth, adminController.getOrders);
router.get("/orders/:orderId", adminAuth, adminController.getOrderById);

router.get("/dashboard", adminAuth, adminController.getAdminDashboard);
router.get("/stats/orders", adminAuth, adminController.getOrderStatistics);
router.get("/stats/sales", adminAuth, adminController.getSalesStatistics);
router.get("/stats/payments", adminAuth, adminController.getPaymentStatistics);

module.exports = router;
