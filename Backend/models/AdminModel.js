const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const bcryptHashPattern = /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/;

const adminSchema = new mongoose.Schema(
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
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
      validate: {
        validator: (value) => value.trim().length > 0,
        message: "Password cannot be empty",
      },
    },
    role: {
      type: String,
      default: "admin",
      enum: ["admin"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

adminSchema.pre("save", async function () {
  if (!this.isModified("password") || bcryptHashPattern.test(this.password)) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

adminSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

adminSchema.methods.toJSON = function () {
  const admin = this.toObject();
  delete admin.password;
  return admin;
};

module.exports = mongoose.model("Admin", adminSchema);
