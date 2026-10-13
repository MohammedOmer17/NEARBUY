const assert = require("node:assert/strict");
const test = require("node:test");
const Shop = require("../models/ShopModel");
const ShopProduct = require("../models/ShopProduct");
const { getProductOffers } = require("../Controllers/shopProductController");
const { buildProductIdentityFilter } = require("../services/productIdentity");

test("product identity matches same branded product and unit, but not other brands", () => {
  const source = { name: "Bath Soap", brand: "Fresh Day", category: "Personal Care", unit: "piece" };
  const filter = buildProductIdentityFilter(source);

  assert.ok(filter.name.test("bath soap"));
  assert.ok(filter.brand.test("FRESH DAY"));
  assert.ok(filter.unit.test("Piece"));
  assert.equal(filter.category, undefined);
  assert.equal(filter.brand.test("Other Brand"), false);
});

test("unbranded records need a category and name-only records remain ungrouped", () => {
  const filter = buildProductIdentityFilter({ name: "Bath Soap", brand: "", category: "Personal Care", unit: "piece" });
  assert.ok(filter.name.test("Bath Soap"));
  assert.ok(filter.category.test("personal care"));
  assert.deepEqual(filter.brand, { $in: ["", null] });
  assert.equal(buildProductIdentityFilter({ name: "Bath Soap", unit: "piece" }), null);
});

test("offers endpoint returns available exact-identity listings from all active shops", async (t) => {
  const source = {
    _id: "64b000000000000000000001",
    name: "Bath Soap",
    brand: "Fresh Day",
    category: "Personal Care",
    unit: "piece",
    price: 38,
    shop: { _id: "meera-shop", shopName: "Meera's Daily Needs" },
  };
  const offers = [
    { _id: "64b000000000000000000002", name: "Bath Soap", brand: "Fresh Day", unit: "piece", price: 35, shop: { _id: "asha-shop", shopName: "Asha's Fresh Mart" } },
    { _id: source._id, name: "Bath Soap", brand: "Fresh Day", unit: "piece", price: 38, shop: source.shop },
    { _id: "64b000000000000000000003", name: "Bath Soap", brand: "Fresh Day", unit: "piece", price: 40, shop: { _id: "ravi-shop", shopName: "Ravi's Corner Store" } },
  ];
  const originals = {
    productFindById: ShopProduct.findById,
    shopFind: Shop.find,
    productFind: ShopProduct.find,
  };
  let capturedFilter;

  t.after(() => {
    ShopProduct.findById = originals.productFindById;
    Shop.find = originals.shopFind;
    ShopProduct.find = originals.productFind;
  });

  ShopProduct.findById = () => ({ populate: async () => source });
  Shop.find = () => ({ distinct: async () => ["asha-shop", "meera-shop", "ravi-shop"] });
  ShopProduct.find = (filter) => {
    capturedFilter = filter;
    return {
      sort() { return this; },
      populate: async () => offers,
    };
  };

  let responseStatus;
  let responseBody;
  await getProductOffers(
    { params: { productId: source._id } },
    {
      status(code) { responseStatus = code; return this; },
      json(body) { responseBody = body; return this; },
    },
  );

  assert.equal(responseStatus, 200);
  assert.deepEqual(responseBody.offers.map((offer) => [offer._id, offer.price, offer.shop.shopName]), [
    ["64b000000000000000000002", 35, "Asha's Fresh Mart"],
    [source._id, 38, "Meera's Daily Needs"],
    ["64b000000000000000000003", 40, "Ravi's Corner Store"],
  ]);
  assert.deepEqual(capturedFilter.shop.$in, ["asha-shop", "meera-shop", "ravi-shop"]);
  assert.equal(capturedFilter.isAvailable, true);
  assert.deepEqual(capturedFilter.quantity, { $gt: 0 });
  assert.ok(capturedFilter.brand.test("Fresh Day"));
});
