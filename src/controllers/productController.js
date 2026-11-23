const Product = require("../models/Product");

const {
  ApiError,
  assertObjectId,
  validateBody,
  parsePagination,
  parseBoolean,
  isMoney,
  escapeRegex,
} = require("../utils/apiUtils");

const FIELDS = [
  "name",
  "description",
  "wholesalePrice",
  "retailPrice",
  "isActive",
];

const SORT_FIELDS = ["createdAt", "name", "wholesalePrice", "retailPrice"];

function parseProduct(body, requiredFields = []) {
  validateBody(body, FIELDS, requiredFields);

  const result = {};

  for (const [key, value] of Object.entries(body)) {
    if (key === "name") {
      if (
        typeof value !== "string" ||
        !value.trim() ||
        value.trim().length > 150
      ) {
        throw new ApiError(400, "Некоректна назва товару");
      }

      result.name = value.trim();
    }

    if (key === "description") {
      if (typeof value !== "string" || value.trim().length > 2000) {
        throw new ApiError(400, "Некоректний опис товару");
      }

      result.description = value.trim();
    }

    if (key === "wholesalePrice" || key === "retailPrice") {
      if (!isMoney(value)) {
        throw new ApiError(
          400,
          `${key} має бути невід’ємним числом із максимум двома знаками після коми`,
        );
      }

      result[key] = value;
    }

    if (key === "isActive") {
      if (typeof value !== "boolean") {
        throw new ApiError(400, "isActive має бути логічним значенням");
      }

      result.isActive = value;
    }
  }

  return result;
}

async function getProducts(req, res) {
  const { page, limit, skip, sortBy, direction, search } = parsePagination(
    req.query,
    SORT_FIELDS,
  );

  const filter = {};

  if (search) {
    filter.name = {
      $regex: escapeRegex(search),
      $options: "i",
    };
  }

  if (req.user.role === "customer") {
    filter.isActive = true;
  } else {
    const isActive = parseBoolean(req.query.isActive, "isActive");

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }
  }

  const minRaw = req.query.minPrice;
  const maxRaw = req.query.maxPrice;

  const parsePrice = (raw, name) => {
    if (raw === undefined) return undefined;

    if (typeof raw !== "string" || !/^\d+(\.\d{1,2})?$/.test(raw)) {
      throw new ApiError(400, `Некоректний параметр ${name}`);
    }

    const value = Number(raw);

    if (!isMoney(value)) {
      throw new ApiError(400, `Некоректний параметр ${name}`);
    }

    return value;
  };

  const minPrice = parsePrice(minRaw, "minPrice");
  const maxPrice = parsePrice(maxRaw, "maxPrice");

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new ApiError(400, "minPrice не може перевищувати maxPrice");
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.retailPrice = {};

    if (minPrice !== undefined) {
      filter.retailPrice.$gte = minPrice;
    }

    if (maxPrice !== undefined) {
      filter.retailPrice.$lte = maxPrice;
    }
  }

  const [total, products] = await Promise.all([
    Product.countDocuments(filter),

    Product.find(filter)
      .sort({
        [sortBy]: direction,
        _id: 1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return res.status(200).json({
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

async function getProductById(req, res) {
  assertObjectId(req.params.id);

  const product = await Product.findById(req.params.id);

  if (!product || (req.user.role === "customer" && !product.isActive)) {
    throw new ApiError(404, "Товар не знайдено");
  }

  return res.status(200).json(product);
}

async function createProduct(req, res) {
  const data = parseProduct(req.body, [
    "name",
    "wholesalePrice",
    "retailPrice",
  ]);

  const product = await Product.create(data);

  return res.status(201).json(product);
}

async function updateProduct(req, res) {
  assertObjectId(req.params.id);

  const requiredFields = req.method === "PUT" ? FIELDS : [];

  const data = parseProduct(req.body, requiredFields);

  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, "Товар не знайдено");
  }

  product.set(data);

  await product.save();

  return res.status(200).json(product);
}

async function deleteProduct(req, res) {
  assertObjectId(req.params.id);

  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, "Товар не знайдено");
  }

  product.isActive = false;

  await product.save();

  return res.status(204).end();
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
