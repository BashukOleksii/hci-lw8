const mongoose = require("mongoose");

const DiscountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    conditionType: {
      type: String,
      required: true,
      enum: ["quantity", "amount"],
    },

    threshold: {
      type: Number,
      required: true,
      min: 0.01,
      validate: {
        validator: function (value) {
          return this.conditionType !== "quantity" || Number.isInteger(value);
        },
        message: "Поріг кількості має бути цілим числом",
      },
    },

    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    validFrom: {
      type: Date,
      default: null,
    },

    validTo: {
      type: Date,
      default: null,
      validate: {
        validator: function (value) {
          return !value || !this.validFrom || value >= this.validFrom;
        },
        message: "Дата завершення має бути не раніше дати початку",
      },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Discount", DiscountSchema);
