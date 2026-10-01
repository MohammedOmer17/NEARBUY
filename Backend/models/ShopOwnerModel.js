const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[\d\s().-]+$/;
const bcryptHashPattern = /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/;

const shopOwnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      validate: {
        validator: (value) => value.trim().length > 0,
        message: "Name cannot be empty",
      },
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailPattern, "Please provide a valid email address"],
      validate: {
        validator: (value) => value.trim().length > 0,
        message: "Email cannot be empty",
      },
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      unique: true,
      trim: true,
      validate: [
        {
          validator: (value) => value.trim().length > 0,
          message: "Phone cannot be empty",
        },
        {
          validator: (value) => phonePattern.test(value) && /\d/.test(value),
          message: "Please provide a valid phone number",
        },
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
      validate: {
        validator: (value) => value.trim().length > 0,
        message: "Password cannot be empty",
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    accountStatus: {
      type: String,
      enum: ["pending", "approved", "suspended", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

shopOwnerSchema.pre("save", async function () {
  if (!this.isModified("password") || bcryptHashPattern.test(this.password)) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

shopOwnerSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

shopOwnerSchema.methods.toJSON = function () {
  const shopOwner = this.toObject();
  delete shopOwner.password;
  return shopOwner;
};

const ShopOwnerModel = mongoose.model("ShopOwner", shopOwnerSchema);

module.exports = ShopOwnerModel;