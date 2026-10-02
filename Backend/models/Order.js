const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShopProduct",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, "Subtotal cannot be negative"],
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: [true, "Shop is required"],
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    fulfillmentType: {
      type: String,
      enum: ["pickup", "delivery"],
      required: [true, "Fulfillment type is required"],
    },
    orderStatus: {
      type: String,
      enum: ["placed", "accepted", "preparing", "ready", "picked_up", "out_for_delivery", "completed", "cancelled"],
      default: "placed",
    },
    deliveryAddress: {
      type: String,
      trim: true,
      default: null,
      required: function () {
        return this.fulfillmentType === "delivery";
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
