const {
  ApiError,
  validateBody,
  parsePagination,
  parseBoolean,
  escapeRegex,
  isMoney,
} = require("../utils/apiUtils");
const { text, boolean, amount, date } = require("./common");

const FIELDS = [
  "name",
  "conditionType",
  "threshold",
  "percentage",
  "isActive",
  "validFrom",
  "validTo",
];

const PUT_FIELDS = ["name", "conditionType", "threshold", "percentage", "isActive"];
const SORT_FIELDS = ["createdAt", "name", "percentage", "threshold", "validFrom"];

function parseDiscount(body, method = "PATCH") {
  const required = method === "POST"
    ? ["name", "conditionType", "threshold", "percentage"]
    : method === "PUT" ? PUT_FIELDS : [];

  validateBody(body, FIELDS, required);

  const data = {};

  for (const [field, value] of Object.entries(body)) {
    if (field === "name") data.name = text(value, field, 150);

    if (field === "conditionType") {
      if (value !== "amount" && value !== "quantity") {
        throw new ApiError(400, "conditionType має бути amount або quantity");
      }
      data.conditionType = value;
    }

    if (field === "threshold") {
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value <= 0 ||
        value > 1_000_000_000
      ) {
        throw new ApiError(400, "Некоректний поріг знижки");
      }
      data.threshold = value;
    }

    if (field === "percentage") {
      data.percentage = amount(value, field);
      if (data.percentage > 100) {
        throw new ApiError(400, "Відсоток знижки не може перевищувати 100");
      }
    }

    if (field === "isActive") data.isActive = boolean(value, field);
    if (field === "validFrom" || field === "validTo") data[field] = date(value, field);
  }

  return data;
}

function validateDiscountRules(discount) {
  if (
    discount.conditionType === "quantity" &&
    (!Number.isSafeInteger(discount.threshold) || discount.threshold < 1)
  ) {
    throw new ApiError(400, "Для quantity потрібен цілий додатний поріг");
  }

  if (
    discount.conditionType === "amount" &&
    (!isMoney(discount.threshold) || discount.threshold <= 0)
  ) {
    throw new ApiError(400, "Для amount потрібна додатна грошова сума");
  }

  if (
    discount.validFrom &&
    discount.validTo &&
    discount.validFrom > discount.validTo
  ) {
    throw new ApiError(400, "validFrom не може бути пізніше validTo");
  }
}

function parseDiscountList(query, role, now = new Date()) {
  const paging = parsePagination(query, SORT_FIELDS);
  const filter = {};

  if (paging.search) {
    filter.name = { $regex: escapeRegex(paging.search), $options: "i" };
  }

  if (query.conditionType !== undefined) {
    if (query.conditionType !== "amount" && query.conditionType !== "quantity") {
      throw new ApiError(400, "Некоректний conditionType");
    }
    filter.conditionType = query.conditionType;
  }

  if (role === "customer") {
    filter.isActive = true;
    filter.$and = [
      { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
      { $or: [{ validTo: null }, { validTo: { $gte: now } }] },
    ];
  } else {
    const active = parseBoolean(query.isActive, "isActive");
    if (active !== undefined) filter.isActive = active;
  }

  return { filter, paging };
}

function isCurrentlyActive(discount, now = new Date()) {
  return Boolean(
    discount.isActive &&
    (!discount.validFrom || discount.validFrom <= now) &&
    (!discount.validTo || discount.validTo >= now)
  );
}

module.exports = {
  parseDiscount,
  validateDiscountRules,
  parseDiscountList,
  isCurrentlyActive,
};
