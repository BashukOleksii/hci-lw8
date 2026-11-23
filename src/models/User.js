const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9._-]+$/,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["manager", "customer"],
      default: "customer",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    address: {
      type: String,
      trim: true,
      maxlength: 250,
      required: function () {
        return this.role === "customer";
      },
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      required: function () {
        return this.role === "customer";
      },
    },

    contactPerson: {
      type: String,
      trim: true,
      maxlength: 150,
      required: function () {
        return this.role === "customer";
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", UserSchema);
