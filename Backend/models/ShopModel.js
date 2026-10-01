const mongoose = require("mongoose");

const requiredTrimmedString = (label) => ({
  type: String,
  required: [true, `${label} is required`],
  trim: true,
  validate: {
    validator: (value) => value.trim().length > 0,
    message: `${label} cannot be empty`,
  },
});

const shopSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShopOwner",
      required: [true, "Shop owner is required"],
    },
    shopName: requiredTrimmedString("Shop name"),
    address: requiredTrimmedString("Address"),
    location: {
      latitude: {
        type: Number,
        required: [true, "Latitude is required"],
      },
      longitude: {
        type: Number,
        required: [true, "Longitude is required"],
      },
    },
    contact: requiredTrimmedString("Contact"),
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
  },
  { timestamps: true },
);

shopSchema.index({ owner: 1 });

const ShopModel = mongoose.model("Shop", shopSchema);

module.exports = ShopModel;