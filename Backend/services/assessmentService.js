const mongoose = require("mongoose");
const Customer = require("../models/CustomerModel");
const Shop = require("../models/ShopModel");
const ShopProduct = require("../models/ShopProduct");
const { calculateRoute, validateCoordinates } = require("./googleMapsService");

const DEFAULT_MAX_DISTANCE_KM = 10;

const normalizeProductId = (productId) => {
  if (!productId) {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(productId)) {
    return productId.toString();
  }

  return String(productId);
};

const validateAssessmentRequest = (body) => {
  if (!body || typeof body !== "object") {
    const error = new Error("Assessment request body is required");
    error.statusCode = 400;
    throw error;
  }

  const { items, fulfillmentType } = body;

  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error("Items must be a non-empty array");
    error.statusCode = 400;
    throw error;
  }

  if (!["pickup", "delivery"].includes(fulfillmentType)) {
    const error = new Error("Fulfillment type must be either pickup or delivery");
    error.statusCode = 400;
    throw error;
  }

  const normalizedItems = [];
  const seen = new Set();

  for (const item of items) {
    if (!item || typeof item !== "object") {
      const error = new Error("Each item must be an object");
      error.statusCode = 400;
      throw error;
    }

    const productId = normalizeProductId(item.productId);
    const quantity = Number(item.quantity);

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      const error = new Error("Each item must include a valid productId");
      error.statusCode = 400;
      throw error;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      const error = new Error("Each item quantity must be a positive number");
      error.statusCode = 400;
      throw error;
    }

    if (seen.has(productId)) {
      const error = new Error("Duplicate product IDs are not allowed in the same assessment request");
      error.statusCode = 400;
      throw error;
    }

    seen.add(productId);
    normalizedItems.push({
      productId,
      quantity: Math.floor(quantity),
    });
  }

  return { items: normalizedItems, fulfillmentType };
};

const getCustomerAssessmentLocation = async (customerId) => {
  const customer = await Customer.findById(customerId);

  if (!customer) {
    const error = new Error("Customer not found");
    error.statusCode = 404;
    throw error;
  }

  return customer.location || null;
};

const getMaxDistanceKm = () => {
  const configuredDistance = Number(process.env.ASSESSMENT_MAX_DISTANCE_KM || DEFAULT_MAX_DISTANCE_KM);
  if (!Number.isFinite(configuredDistance) || configuredDistance <= 0) {
    return DEFAULT_MAX_DISTANCE_KM;
  }

  return configuredDistance;
};

const getCandidateShops = async () => {
  const shops = await Shop.find({ status: "active" }).lean();
  return shops.filter((shop) => shop && shop.location);
};

const getRelevantProducts = async (shopIds, productIds) => {
  const products = await ShopProduct.find({
    shop: { $in: shopIds },
    _id: { $in: productIds },
  }).lean();

  return products;
};

const buildProductsByShop = (products) => {
  const map = new Map();

  for (const product of products) {
    const shopId = product.shop.toString();
    if (!map.has(shopId)) {
      map.set(shopId, new Map());
    }

    map.get(shopId).set(product._id.toString(), product);
  }

  return map;
};

const assessShop = async (shop, customerLocation, normalizedItems, fulfillmentType) => {
  const productIds = normalizedItems.map((item) => item.productId);
  const products = await ShopProduct.find({
    shop: shop._id,
    _id: { $in: productIds },
  }).lean();

  if (products.length !== productIds.length) {
    return null;
  }

  const productMap = new Map(products.map((product) => [product._id.toString(), product]));
  const evaluatedItems = [];
  let totalAmount = 0;

  for (const item of normalizedItems) {
    const product = productMap.get(item.productId);
    if (!product || !product.isAvailable || product.quantity < item.quantity) {
      return null;
    }

    const subtotal = Number(product.price) * item.quantity;
    totalAmount += subtotal;
    evaluatedItems.push({
      productId: product._id,
      name: product.name,
      unit: product.unit,
      price: Number(product.price),
      requestedQuantity: item.quantity,
      subtotal,
    });
  }

  if (fulfillmentType === "delivery") {
    if (!customerLocation || !customerLocation.latitude || !customerLocation.longitude) {
      const error = new Error("Customer location is required for delivery assessment");
      error.statusCode = 400;
      throw error;
    }

    const validatedCustomerLocation = validateCoordinates(customerLocation, "Customer location");
    const validatedShopLocation = validateCoordinates(shop.location, "Shop location");
    const routeData = await calculateRoute(validatedCustomerLocation, validatedShopLocation);

    if (routeData.distance.kilometers > getMaxDistanceKm()) {
      return null;
    }

    return {
      shop: {
        _id: shop._id,
        shopName: shop.shopName,
        address: shop.address,
        location: shop.location,
      },
      distance: routeData.distance,
      duration: routeData.duration,
      totalAmount,
      items: evaluatedItems,
    };
  }

  const fakeDistance = { meters: 0, kilometers: 0 };
  const fakeDuration = { seconds: 0, minutes: 0 };

  return {
    shop: {
      _id: shop._id,
      shopName: shop.shopName,
      address: shop.address,
      location: shop.location,
    },
    distance: fakeDistance,
    duration: fakeDuration,
    totalAmount,
    items: evaluatedItems,
  };
};

const sortAssessmentResults = (results) => {
  return [...results].sort((a, b) => {
    const distanceDiff = (a.distance?.meters || 0) - (b.distance?.meters || 0);
    if (distanceDiff !== 0) {
      return distanceDiff;
    }

    return (a.totalAmount || 0) - (b.totalAmount || 0);
  });
};

const assessShops = async (customerId, body) => {
  const { items, fulfillmentType } = validateAssessmentRequest(body);
  const customerLocation = await getCustomerAssessmentLocation(customerId);

  if (fulfillmentType === "delivery") {
    if (!customerLocation || !customerLocation.latitude || !customerLocation.longitude) {
      const error = new Error("Customer location is required for delivery assessment");
      error.statusCode = 400;
      throw error;
    }

    validateCoordinates(customerLocation, "Customer location");
  }

  const candidateShops = await getCandidateShops();
  if (candidateShops.length === 0) {
    return {
      success: true,
      data: {
        fulfillmentType,
        customerLocation,
        results: [],
      },
      message: "No nearby shop can fulfill the requested products",
    };
  }

  const productIds = items.map((item) => item.productId);
  const shopIds = candidateShops.map((shop) => shop._id);
  const products = await getRelevantProducts(shopIds, productIds);
  const productsByShop = buildProductsByShop(products);

  const results = [];

  for (const shop of candidateShops) {
    const shopProducts = productsByShop.get(shop._id.toString());
    if (!shopProducts || shopProducts.size < items.length) {
      continue;
    }

    const shopItems = [];
    let hasInvalidItem = false;

    for (const item of items) {
      const product = shopProducts.get(item.productId);
      if (!product || !product.isAvailable || product.quantity < item.quantity) {
        hasInvalidItem = true;
        break;
      }

      shopItems.push({
        productId: item.productId,
        quantity: item.quantity,
      });
    }

    if (hasInvalidItem) {
      continue;
    }

    const shopResult = await assessShop(shop, customerLocation, shopItems, fulfillmentType).catch((error) => {
      if (error && error.statusCode === 400) {
        throw error;
      }
      return null;
    });

    if (shopResult) {
      results.push(shopResult);
    }
  }

  const sortedResults = sortAssessmentResults(results);

  return {
    success: true,
    data: {
      fulfillmentType,
      customerLocation,
      results: sortedResults,
    },
    message: sortedResults.length > 0 ? "Assessment completed successfully" : "No nearby shop can fulfill the requested products",
  };
};

module.exports = {
  assessShops,
  validateAssessmentRequest,
  getCustomerAssessmentLocation,
  getMaxDistanceKm,
};
