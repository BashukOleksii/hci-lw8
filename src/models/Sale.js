const mongoose = require("mongoose");

const SaleItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productName: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Кількість повинна бути цілим числом",
      },
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const SaleSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    saleType: {
      type: String,
      enum: ["retail", "wholesale"],
      required: true,
    },

    items: {
      type: [SaleItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items.length > 0;
        },
        message: "Продаж повинен містити хоча б один товар",
      },
    },

    saleDate: {
      type: Date,
      default: Date.now,
    },

    totalQuantity: {
      type: Number,
      required: true,
      min: 1,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      discountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Discount",
        default: null,
      },

      name: {
        type: String,
        default: null,
      },

      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Sale", SaleSchema);
