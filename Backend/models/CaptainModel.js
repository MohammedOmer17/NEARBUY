const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[\d\s().-]+$/;
const bcryptHashPattern = /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/;

const captainSchema = new mongoose.Schema(
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
    vehicle: {
      type: {
        type: String,
        enum: ["bike", "scooter", "car", "other"],
        default: "other",
      },
      model: {
        type: String,
        trim: true,
        default: "",
      },
      number: {
        type: String,
        trim: true,
        default: "",
      },
    },
    location: {
      latitude: {
        type: Number,
        default: null,
      },
      longitude: {
        type: Number,
        default: null,
      },
    },
    locationUpdatedAt: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    availabilityStatus: {
      type: String,
      enum: ["offline", "available", "busy"],
      default: "offline",
    },
    accountStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
  },
  { timestamps: true }
);

captainSchema.pre("save", async function () {
  if (!this.isModified("password") || bcryptHashPattern.test(this.password)) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

captainSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

captainSchema.methods.toJSON = function () {
  const captain = this.toObject();
  delete captain.password;
  return captain;
};

const CaptainModel = mongoose.model("Captain", captainSchema);

module.exports = CaptainModel;
