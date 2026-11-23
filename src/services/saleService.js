const Product = require("../models/Product");
const Discount = require("../models/Discount");
const Sale = require("../models/Sale");
const { ApiError, assertObjectId } = require("../utils/apiUtils");
const { parseSaleItems } = require("../validators/saleValidator");
const { calculateSale } = require("./salePricingService");

async function create(body, buyerId) {
  const items = parseSaleItems(body);
  const now = new Date();
  const productIds = items.map((item) => item.product);

  const [products, discounts] = await Promise.all([
    Product.find({ _id: { $in: productIds }, isActive: true }).lean(),
    Discount.find({ isActive: true }).lean(),
  ]);

  if (products.length !== productIds.length) {
    throw new ApiError(422, "Деякі товари не знайдено або вони неактивні");
  }

  const calculation = calculateSale(items, products, discounts, now);

  return Sale.create({ buyer: buyerId, saleDate: now, ...calculation });
}

async function listMine(buyerId) {
  return Sale.find({ buyer: buyerId })
    .sort({ saleDate: -1, _id: -1 })
    .lean();
}

async function listAll() {
  return Sale.find()
    .populate("buyer", "username name")
    .sort({ saleDate: -1, _id: -1 })
    .lean();
}

async function getById(id, user) {
  assertObjectId(id);
  const filter = { _id: id };

  if (user.role !== "manager") filter.buyer = user._id;

  const sale = await Sale.findOne(filter)
    .populate("buyer", "username name")
    .lean();

  if (!sale) throw new ApiError(404, "Продаж не знайдено");

  return sale;
}

module.exports = { create, listMine, listAll, getById };
