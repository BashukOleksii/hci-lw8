const {
  ApiError,
  validateBody,
  parsePagination,
  parseBoolean,
  escapeRegex,
  isMoney,
} = require("../utils/apiUtils");
const { text, boolean, amount } = require("./common");

const FIELDS = ["name", "description", "wholesalePrice", "retailPrice", "isActive"];
const SORT_FIELDS = ["createdAt", "name", "wholesalePrice", "retailPrice"];

function parseProduct(body, method = "PATCH") {
  const required = method === "POST"
    ? ["name", "wholesalePrice", "retailPrice"]
    : method === "PUT" ? FIELDS : [];

  validateBody(body, FIELDS, required);

  const data = {};

  for (const [field, value] of Object.entries(body)) {
    if (field === "name") data.name = text(value, field, 150);
    if (field === "description") data.description = text(value, field, 2000, 0);
    if (field === "wholesalePrice" || field === "retailPrice") {
      data[field] = amount(value, field);
    }
    if (field === "isActive") data.isActive = boolean(value, field);
  }

  return data;
}

function parseProductList(query, role) {
  const paging = parsePagination(query, SORT_FIELDS);
  const filter = {};

  if (paging.search) {
    filter.name = { $regex: escapeRegex(paging.search), $options: "i" };
  }

  if (role === "customer") {
    filter.isActive = true;
  } else {
    const active = parseBoolean(query.isActive, "isActive");
    if (active !== undefined) filter.isActive = active;
  }

  function parsePrice(value, field) {
    if (value === undefined) return undefined;

    if (typeof value !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(value)) {
      throw new ApiError(400, `Некоректний параметр ${field}`);
    }

    const converted = Number(value);
    if (!isMoney(converted)) {
      throw new ApiError(400, `Некоректний параметр ${field}`);
    }

    return converted;
  }

  const min = parsePrice(query.minPrice, "minPrice");
  const max = parsePrice(query.maxPrice, "maxPrice");

  if (min !== undefined && max !== undefined && min > max) {
    throw new ApiError(400, "minPrice не може перевищувати maxPrice");
  }

  if (min !== undefined || max !== undefined) {
    filter.retailPrice = {};
    if (min !== undefined) filter.retailPrice.$gte = min;
    if (max !== undefined) filter.retailPrice.$lte = max;
  }

  return { filter, paging };
}

module.exports = { parseProduct, parseProductList };
