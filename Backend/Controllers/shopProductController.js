const mongoose = require("mongoose");
const Shop = require("../models/ShopModel");
const ShopProduct = require("../models/ShopProduct");

const requiredProductFields = ["name", "category", "price", "unit", "quantity"];

const getOwnerShop = async (ownerId) => {
  return Shop.findOne({ owner: ownerId });
};

const parsePositiveNumber = (value, fieldName) => {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new Error(`${fieldName} must be a valid non-negative number`);
  }

  return parsedValue;
};

const validateProductPayload = (body) => {
  const missingFields = requiredProductFields.filter((field) => {
    if (field === "price") {
      return body[field] === undefined || body[field] === null || body[field] === "";
    }

    if (field === "quantity") {
      return body[field] === undefined || body[field] === null || body[field] === "";
    }

    return typeof body[field] !== "string" || body[field].trim() === "";
  });

  if (missingFields.length > 0) {
    return `Missing or invalid required fields: ${missingFields.join(", ")}`;
  }

  try {
    parsePositiveNumber(body.price, "Price");
    parsePositiveNumber(body.quantity, "Quantity");
  } catch (error) {
    return error.message;
  }

  return null;
};

const createProduct = async (req, res) => {
  const validationError = validateProductPayload(req.body);

  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const ownerShop = await getOwnerShop(req.user._id);

    if (!ownerShop) {
      return res.status(404).json({ message: "Shop not found for this owner" });
    }

    const product = await ShopProduct.create({
      shop: ownerShop._id,
      name: req.body.name.trim(),
      description: typeof req.body.description === "string" ? req.body.description.trim() : "",
      category: req.body.category.trim(),
      brand: typeof req.body.brand === "string" ? req.body.brand.trim() : "",
      image: req.body.image || "",
      price: Number(req.body.price),
      unit: req.body.unit.trim(),
      quantity: Number(req.body.quantity),
      lowStockThreshold: req.body.lowStockThreshold === undefined ? 5 : Number(req.body.lowStockThreshold),
      isAvailable: Number(req.body.quantity) > 0,
    });

    return res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    console.error("Create product failed:", error);
    return res.status(500).json({ message: "Unable to create product" });
  }
};

const getShopProducts = async (req, res) => {
  const { shopId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(shopId)) {
    return res.status(400).json({ message: "Invalid shop ID" });
  }

  const filter = { shop: shopId };
  const { category, search, availability } = req.query;

  if (category) {
    filter.category = new RegExp(String(category).trim(), "i");
  }

  if (search) {
    filter.name = new RegExp(String(search).trim(), "i");
  }

  if (availability !== undefined) {
    filter.isAvailable = String(availability).toLowerCase() === "true";
  }

  try {
    const products = await ShopProduct.find(filter).sort({ createdAt: -1 }).populate("shop", "shopName address contact status");
    return res.status(200).json({ products });
  } catch (error) {
    console.error("Fetch shop products failed:", error);
    return res.status(500).json({ message: "Unable to retrieve products" });
  }
};

const getProductById = async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const product = await ShopProduct.findById(productId).populate("shop", "shopName address contact status location");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({ product });
  } catch (error) {
    console.error("Fetch product by ID failed:", error);
    return res.status(500).json({ message: "Unable to retrieve product" });
  }
};

const updateProduct = async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const ownerShop = await getOwnerShop(req.user._id);

    if (!ownerShop) {
      return res.status(404).json({ message: "Shop not found for this owner" });
    }

    const product = await ShopProduct.findOne({ _id: productId, shop: ownerShop._id });

    if (!product) {
      return res.status(404).json({ message: "Product not found for this shop" });
    }

    const allowedUpdates = [
      "name",
      "description",
      "category",
      "brand",
      "image",
      "price",
      "unit",
      "quantity",
      "lowStockThreshold",
      "isAvailable",
    ];

    const updates = {};

    for (const field of allowedUpdates) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        if (field === "name" || field === "category" || field === "unit") {
          if (typeof req.body[field] !== "string" || req.body[field].trim() === "") {
            return res.status(400).json({ message: `${field} must be a non-empty string` });
          }
          updates[field] = req.body[field].trim();
        } else if (field === "price" || field === "quantity" || field === "lowStockThreshold") {
          const value = Number(req.body[field]);
          if (!Number.isFinite(value) || value < 0) {
            return res.status(400).json({ message: `${field} must be a valid non-negative number` });
          }
          updates[field] = value;
        } else if (field === "isAvailable") {
          if (typeof req.body[field] !== "boolean") {
            return res.status(400).json({ message: "isAvailable must be a boolean" });
          }
          updates[field] = req.body[field];
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Provide at least one field to update" });
    }

    if (updates.quantity !== undefined) {
      updates.isAvailable = updates.quantity > 0;
    }

    if (updates.price !== undefined && updates.price < 0) {
      return res.status(400).json({ message: "Price cannot be negative" });
    }

    Object.assign(product, updates);
    await product.save();

    return res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    console.error("Product update failed:", error);
    return res.status(500).json({ message: "Unable to update product" });
  }
};

const deleteProduct = async (req, res) => {
  const { productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  try {
    const ownerShop = await getOwnerShop(req.user._id);

    if (!ownerShop) {
      return res.status(404).json({ message: "Shop not found for this owner" });
    }

    const product = await ShopProduct.findOneAndDelete({ _id: productId, shop: ownerShop._id });

    if (!product) {
      return res.status(404).json({ message: "Product not found for this shop" });
    }

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product failed:", error);
    return res.status(500).json({ message: "Unable to delete product" });
  }
};

const updateProductStock = async (req, res) => {
  const { productId } = req.params;
  const quantity = req.body.quantity ?? req.body.stock ?? req.body.availableQuantity;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  if (quantity === undefined || quantity === null || quantity === "") {
    return res.status(400).json({ message: "Quantity is required" });
  }

  const parsedQuantity = Number(quantity);

  if (!Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
    return res.status(400).json({ message: "Quantity must be a valid non-negative number" });
  }

  try {
    const ownerShop = await getOwnerShop(req.user._id);

    if (!ownerShop) {
      return res.status(404).json({ message: "Shop not found for this owner" });
    }

    const product = await ShopProduct.findOne({ _id: productId, shop: ownerShop._id });

    if (!product) {
      return res.status(404).json({ message: "Product not found for this shop" });
    }

    product.quantity = parsedQuantity;
    product.isAvailable = parsedQuantity > 0;
    await product.save();

    return res.status(200).json({
      message: "Product stock updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product stock failed:", error);
    return res.status(500).json({ message: "Unable to update product stock" });
  }
};

module.exports = {
  createProduct,
  getShopProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateProductStock,
};
