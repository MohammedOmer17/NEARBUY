import bcrypt from "bcrypt";
import mongoose from "mongoose";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const bcryptHashPattern = /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/;

const customerSchema = new mongoose.Schema(
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
      validate: {
        validator: (value) => value.trim().length > 0,
        message: "Phone cannot be empty",
      },
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
  },
  { timestamps: true },
);

customerSchema.pre("save", async function () {
  if (!this.isModified("password") || bcryptHashPattern.test(this.password)) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

customerSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

customerSchema.methods.toJSON = function () {
  const customer = this.toObject();
  delete customer.password;
  return customer;
};

export default mongoose.model("Customer", customerSchema);