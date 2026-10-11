const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const connectToDb = require("../db/db");
const ShopOwner = require("../models/ShopOwnerModel");
const Shop = require("../models/ShopModel");
const ShopProduct = require("../models/ShopProduct");

const envFilePath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envFilePath)) {
  process.loadEnvFile(envFilePath);
}

const demoPassword = "NearBuyDemo!2026";
const demoOwners = [
  {
    name: "Asha Demo",
    email: "asha.owner@nearbuy.test",
    phone: "+919000000001",
    shopName: "Asha's Fresh Mart",
    address: "12-1-556/1A/2A, Syed Ali Guda, Muradnagar, Hyderabad, Telangana 500028",
    latitude: 17.3859857,
    longitude: 78.4460393,
    contact: "+919000000001",
    products: [
      { name: "Toor Dal", category: "Pulses", brand: "Daily Basket", price: 145, unit: "kg", quantity: 24 },
      { name: "Basmati Rice", category: "Grains", brand: "Golden Grain", price: 110, unit: "kg", quantity: 35 },
      { name: "Sunflower Oil", category: "Cooking Oil", brand: "SunDrop", price: 155, unit: "ltr", quantity: 18 },
      { name: "Toned Milk", category: "Dairy", brand: "Daily Fresh", price: 30, unit: "ltr", quantity: 40 },
    ],
  },
  {
    name: "Ravi Demo",
    email: "ravi.owner@nearbuy.test",
    phone: "+919000000002",
    shopName: "Ravi's Corner Store",
    address: "12-1-496/1, Near Murad Nagar Kaman, Syed Ali Guda, Hyderabad, Telangana 500028",
    latitude: 17.3848251,
    longitude: 78.445997,
    contact: "+919000000002",
    products: [
      { name: "Wheat Flour", category: "Grains", brand: "Harvest Mill", price: 52, unit: "kg", quantity: 30 },
      { name: "Brown Eggs", category: "Dairy", brand: "Farm Nest", price: 8, unit: "piece", quantity: 60 },
      { name: "Masala Noodles", category: "Snacks", brand: "Quick Bite", price: 18, unit: "packet", quantity: 45 },
      { name: "Green Tea", category: "Beverages", brand: "Leaf & Co", price: 95, unit: "packet", quantity: 12 },
    ],
  },
  {
    name: "Meera Demo",
    email: "meera.owner@nearbuy.test",
    phone: "+919000000003",
    shopName: "Meera's Daily Needs",
    address: "12-2, 338 A/3, Asif Nagar-Murad Nagar-Gudi Malkapur Road, Murad Nagar Kunta, Dattadari Colony, Murad Nagar, Hyderabad, Telangana 500006",
    latitude: 17.3870942,
    longitude: 78.4429097,
    contact: "+919000000003",
    products: [
      { name: "Sugar", category: "Essentials", brand: "Sweet Fields", price: 45, unit: "kg", quantity: 25 },
      { name: "Iodized Salt", category: "Essentials", brand: "White Crystal", price: 22, unit: "kg", quantity: 20 },
      { name: "Dishwash Bar", category: "Household", brand: "Sparkle", price: 25, unit: "piece", quantity: 32 },
      { name: "Bath Soap", category: "Personal Care", brand: "Fresh Day", price: 38, unit: "piece", quantity: 28 },
    ],
  },
];

async function seedDemoOwner(ownerData, passwordHash) {
  const owner = await ShopOwner.findOneAndUpdate(
    { email: ownerData.email },
    {
      $set: {
        name: ownerData.name,
        phone: ownerData.phone,
        password: passwordHash,
        isVerified: true,
        isActive: true,
        accountStatus: "approved",
      },
    },
    { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );

  const shop = await Shop.findOneAndUpdate(
    { owner: owner._id },
    {
      $set: {
        address: ownerData.address,
        location: {
          latitude: ownerData.latitude,
          longitude: ownerData.longitude,
        },
      },
      $setOnInsert: {
        shopName: ownerData.shopName,
        contact: ownerData.contact,
      },
    },
    { returnDocument: "after", upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );

  for (const product of ownerData.products) {
    await ShopProduct.findOneAndUpdate(
      { shop: shop._id, name: product.name },
      {
        $setOnInsert: {
          ...product,
          shop: shop._id,
          description: `Demo inventory item for ${ownerData.shopName}.`,
          isAvailable: true,
        },
      },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  }

  console.log(`Seeded ${ownerData.email} (${ownerData.products.length} products)`);
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed demo data when NODE_ENV is production.");
  }

  await connectToDb();

  try {
    const passwordHash = await bcrypt.hash(demoPassword, 12);
    for (const ownerData of demoOwners) {
      await seedDemoOwner(ownerData, passwordHash);
    }

    console.log(`Demo owner password: ${demoPassword}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Failed to seed demo data:", error);
  process.exitCode = 1;
});
