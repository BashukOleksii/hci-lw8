const Product = require("../models/Product");
const { ApiError, assertObjectId } = require("../utils/apiUtils");
const { parseProduct, parseProductList } = require("../validators/productValidator");

async function list(query, role) {
  const { filter, paging } = parseProductList(query, role);
  const { page, limit, skip, sortBy, direction } = paging;

  const [total, data] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .sort({ [sortBy]: direction, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getById(id, role) {
  assertObjectId(id);
  const product = await Product.findById(id);

  if (!product || (role === "customer" && !product.isActive)) {
    throw new ApiError(404, "Товар не знайдено");
  }

  return product;
}

async function create(body) {
  const data = parseProduct(body, "POST");
  return Product.create(data);
}

async function update(id, body, method) {
  const data = parseProduct(body, method);
  const product = await getById(id, "manager");
  product.set(data);
  await product.save();
  return product;
}

async function deactivate(id) {
  const product = await getById(id, "manager");
  product.isActive = false;
  await product.save();
}

module.exports = { list, getById, create, update, deactivate };
