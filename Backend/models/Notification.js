const mongoose = require("mongoose");

const recipientRoles = ["customer", "shopOwner", "captain"];

const notificationTypes = [
  "ORDER_PLACED",
  "ORDER_ACCEPTED",
  "ORDER_PREPARING",
  "ORDER_READY",
  "CAPTAIN_ASSIGNED",
  "ORDER_PICKED_UP",
  "ORDER_OUT_FOR_DELIVERY",
  "ORDER_COMPLETED",
  "ORDER_CANCELLED",
  "NEW_ORDER",
  "CUSTOMER_CANCELLED_ORDER",
  "ORDER_READY_FOR_DELIVERY",
  "ORDER_READY_FOR_PICKUP",
  "DELIVERY_ASSIGNED",
  "DELIVERY_CANCELLED",
  "PAYMENT_CONFIRMATION_REQUIRED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
  "ACCOUNT_APPROVED",
  "ACCOUNT_REJECTED",
  "ACCOUNT_SUSPENDED",
];

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "recipientRole",
    },
    recipientRole: {
      type: String,
      required: true,
      enum: recipientRoles,
    },
    type: {
      type: String,
      required: true,
      enum: notificationTypes,
      uppercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedEntity: {
      entityType: {
        type: String,
        trim: true,
        default: null,
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, recipientRole: 1, type: 1, "relatedEntity.entityId": 1 });

module.exports = mongoose.model("Notification", notificationSchema);
