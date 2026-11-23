const Product = require("../models/Product");
const Discount = require("../models/Discount");
const Sale = require("../models/Sale");

const { calculateSale } = require("../services/salePricingService");
const { ApiError, assertObjectId, validateBody } = require("../utils/apiUtils");

function parseItems(body) {
  validateBody(body, ["items"], ["items"]);

  if (
    !Array.isArray(body.items) ||
    body.items.length === 0 ||
    body.items.length > 50
  ) {
    throw new ApiError(400, "Вкажіть від 1 до 50 позицій товарів");
  }

  const seen = new Set();
  let totalQuantity = 0;

  return body.items.map((item) => {
    validateBody(item, ["product", "quantity"], ["product", "quantity"]);
    assertObjectId(item.product);

    if (
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 1000
    ) {
      throw new ApiError(400, "Кількість має бути цілим числом від 1 до 1000");
    }

    totalQuantity += item.quantity;
    if (totalQuantity > 1000) {
      throw new ApiError(400, "Загальна кількість не може перевищувати 1000");
    }

    const productId = item.product.toLowerCase();
    if (seen.has(productId)) {
      throw new ApiError(400, "Один товар не можна додавати двічі");
    }

    seen.add(productId);
    return { product: productId, quantity: item.quantity };
  });
}

async function createSale(req, res) {
  const items = parseItems(req.body);
  const now = new Date();

  const productIds = items.map((item) => item.product);

  const [products, discounts] = await Promise.all([
    Product.find({
      _id: { $in: productIds },
      isActive: true,
    }).lean(),

    Discount.find({ isActive: true }).lean(),
  ]);

  if (products.length !== productIds.length) {
    throw new ApiError(422, "Деякі товари не знайдено або вони неактивні");
  }

  const calculation = calculateSale(items, products, discounts, now);

  const sale = await Sale.create({
    buyer: req.user._id,
    saleDate: now,
    ...calculation,
  });

  return res.status(201).json(sale);
}

async function getMySales(req, res) {
  const sales = await Sale.find({ buyer: req.user._id })
    .sort({ saleDate: -1, _id: -1 })
    .lean();

  return res.status(200).json(sales);
}

async function getAllSales(req, res) {
  const sales = await Sale.find()
    .populate("buyer", "username name")
    .sort({ saleDate: -1, _id: -1 })
    .lean();

  return res.status(200).json(sales);
}

async function getSaleById(req, res) {
  assertObjectId(req.params.id);

  const filter = { _id: req.params.id };

  if (req.user.role !== "manager") {
    filter.buyer = req.user._id;
  }

  const sale = await Sale.findOne(filter)
    .populate("buyer", "username name")
    .lean();

  if (!sale) {
    throw new ApiError(404, "Продаж не знайдено");
  }

  return res.status(200).json(sale);
}

module.exports = {
  createSale,
  getMySales,
  getAllSales,
  getSaleById,
};
