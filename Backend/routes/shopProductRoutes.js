const express = require("express");
const {
  createProduct,
  getShopProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateProductStock,
} = require("../controllers/shopProductController");
const { authShopOwner, authCustomer } = require("../Middlewares/authMiddleware");

const router = express.Router();

router.post("/shop-products", authShopOwner, createProduct);
router.get("/shop-products/shop/:shopId", getShopProducts);
router.get("/shop-products/:productId", getProductById);
router.put("/shop-products/:productId", authShopOwner, updateProduct);
router.delete("/shop-products/:productId", authShopOwner, deleteProduct);
router.patch("/shop-products/:productId/stock", authShopOwner, updateProductStock);

module.exports = router;
