const express = require("express");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");
const { authCustomer } = require("../Middlewares/authMiddleware");

const router = express.Router();

router.get("/cart", authCustomer, getCart);
router.post("/cart", authCustomer, addToCart);
router.put("/cart/:productId", authCustomer, updateCartItem);
router.delete("/cart/clear", authCustomer, clearCart);
router.delete("/cart/:productId", authCustomer, removeFromCart);

module.exports = router;
