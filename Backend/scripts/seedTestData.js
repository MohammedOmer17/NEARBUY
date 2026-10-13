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

// All shops sell the same catalogue.
// Prices and inventory quantities vary by shop.
// Index 0 = Asha's Fresh Mart
// Index 1 = Ravi's Corner Store
// Index 2 = Meera's Daily Needs
const sharedProducts = [
  {
    name: "Toor Dal",
    category: "Pulses",
    brand: "Daily Basket",
    unit: "kg",
    prices: [145, 149, 142],
    quantities: [24, 20, 27],
  },
  {
    name: "Basmati Rice",
    category: "Grains",
    brand: "Golden Grain",
    unit: "kg",
    prices: [110, 115, 108],
    quantities: [35, 28, 32],
  },
  {
    name: "Sunflower Oil",
    category: "Cooking Oil",
    brand: "SunDrop",
    unit: "ltr",
    prices: [155, 159, 152],
    quantities: [18, 16, 21],
  },
  {
    name: "Toned Milk",
    category: "Dairy",
    brand: "Daily Fresh",
    unit: "ltr",
    prices: [30, 32, 29],
    quantities: [40, 36, 42],
  },
  {
    name: "Wheat Flour",
    category: "Grains",
    brand: "Harvest Mill",
    unit: "kg",
    prices: [52, 50, 54],
    quantities: [30, 34, 26],
  },
  {
    name: "Brown Eggs",
    category: "Dairy",
    brand: "Farm Nest",
    unit: "piece",
    prices: [8, 9, 8],
    quantities: [60, 48, 72],
  },
  {
    name: "Masala Noodles",
    category: "Snacks",
    brand: "Quick Bite",
    unit: "packet",
    prices: [18, 20, 17],
    quantities: [45, 39, 50],
  },
  {
    name: "Green Tea",
    category: "Beverages",
    brand: "Leaf & Co",
    unit: "packet",
    prices: [95, 99, 92],
    quantities: [12, 15, 10],
  },
  {
    name: "Sugar",
    category: "Essentials",
    brand: "Sweet Fields",
    unit: "kg",
    prices: [45, 47, 44],
    quantities: [25, 28, 30],
  },
  {
    name: "Iodized Salt",
    category: "Essentials",
    brand: "White Crystal",
    unit: "kg",
    prices: [22, 20, 21],
    quantities: [20, 24, 18],
  },
  {
    name: "Dishwash Bar",
    category: "Household",
    brand: "Sparkle",
    unit: "piece",
    prices: [25, 27, 24],
    quantities: [32, 28, 35],
  },
  {
    name: "Bath Soap",
    category: "Personal Care",
    brand: "Fresh Day",
    unit: "piece",
    prices: [35, 40, 38],
    quantities: [22, 18, 28],
  },
];

const demoOwners = [
  {
    priceIndex: 0,
    name: "Asha Demo",
    email: "asha.owner@nearbuy.test",
    phone: "+919000000001",
    shopName: "Asha's Fresh Mart",
    address:
      "12-1-556/1A/2A, Syed Ali Guda, Muradnagar, Hyderabad, Telangana 500028",
    latitude: 17.3859857,
    longitude: 78.4460393,
    contact: "+919000000001",
  },
  {
    priceIndex: 1,
    name: "Ravi Demo",
    email: "ravi.owner@nearbuy.test",
    phone: "+919000000002",
    shopName: "Ravi's Corner Store",
    address:
      "12-1-496/1, Near Murad Nagar Kaman, Syed Ali Guda, Hyderabad, Telangana 500028",
    latitude: 17.3848251,
    longitude: 78.445997,
    contact: "+919000000002",
  },
  {
    priceIndex: 2,
    name: "Meera Demo",
    email: "meera.owner@nearbuy.test",
    phone: "+919000000003",
    shopName: "Meera's Daily Needs",
    address:
      "12-2, 338 A/3, Asif Nagar-Murad Nagar-Gudi Malkapur Road, Murad Nagar Kunta, Dattadari Colony, Murad Nagar, Hyderabad, Telangana 500006",
    latitude: 17.3870942,
    longitude: 78.4429097,
    contact: "+919000000003",
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
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  const shop = await Shop.findOneAndUpdate(
    { owner: owner._id },
    {
      $set: {
        shopName: ownerData.shopName,
        address: ownerData.address,
        contact: ownerData.contact,
        location: {
          latitude: ownerData.latitude,
          longitude: ownerData.longitude,
        },
        status: "active",
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  for (const item of sharedProducts) {
    const {
      prices,
      quantities,
      ...productFields
    } = item;

    const productData = {
      ...productFields,
      shop: shop._id,
      price: prices[ownerData.priceIndex],
      quantity: quantities[ownerData.priceIndex],
      description: `Demo inventory item for ${ownerData.shopName}.`,
      isAvailable: true,
    };

    // Update existing demo listings and insert missing listings.
    // This makes repeated seed runs update prices without creating
    // duplicate records for the same product name in the same shop.
    await ShopProduct.findOneAndUpdate(
      {
        shop: shop._id,
        name: productData.name,
      },
      {
        $set: productData,
      },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );
  }

  console.log(
    `Seeded ${ownerData.shopName}: ${sharedProducts.length} products`
  );
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to seed demo data when NODE_ENV is production."
    );
  }

  const testDatabaseUri = process.env.SEED_TEST_DATA_MONGODB_URI;

  if (!testDatabaseUri || !testDatabaseUri.trim()) {
    throw new Error(
      "SEED_TEST_DATA_MONGODB_URI must point to a dedicated test database."
    );
  }

  if (testDatabaseUri === process.env.MONGODB_URI) {
    throw new Error(
      "Refusing to seed because the test database URI matches MONGODB_URI."
    );
  }

  let databaseName;

  try {
    databaseName = new URL(testDatabaseUri).pathname
      .split("/")
      .filter(Boolean)[0];
  } catch {
    throw new Error(
      "SEED_TEST_DATA_MONGODB_URI must be a valid MongoDB connection string."
    );
  }

  if (!databaseName || !/(?:^|[-_])test(?:$|[-_])/i.test(databaseName)) {
    throw new Error(
      "Refusing to seed unless the database name includes a test segment."
    );
  }

  await connectToDb(testDatabaseUri);

  try {
    const passwordHash = await bcrypt.hash(demoPassword, 12);

    for (const ownerData of demoOwners) {
      await seedDemoOwner(ownerData, passwordHash);
    }

    console.log("Demo catalogue seeded successfully.");
    console.log(`Unique products: ${sharedProducts.length}`);
    console.log(`Shops: ${demoOwners.length}`);
    console.log(
      `Shop-specific listings: ${sharedProducts.length * demoOwners.length}`
    );
    console.log(`Demo owner password: ${demoPassword}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Failed to seed demo data:", error);
  process.exitCode = 1;
});