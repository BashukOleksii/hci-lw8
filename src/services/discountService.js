const Discount = require("../models/Discount");
const { ApiError, assertObjectId } = require("../utils/apiUtils");
const {
  parseDiscount,
  validateDiscountRules,
  parseDiscountList,
  isCurrentlyActive,
} = require("../validators/discountValidator");

async function list(query, role) {
  const { filter, paging } = parseDiscountList(query, role);
  const { page, limit, skip, sortBy, direction } = paging;

  const [total, data] = await Promise.all([
    Discount.countDocuments(filter),
    Discount.find(filter)
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
  const discount = await Discount.findById(id);

  if (!discount || (role === "customer" && !isCurrentlyActive(discount))) {
    throw new ApiError(404, "Знижку не знайдено");
  }

  return discount;
}

async function create(body) {
  const data = parseDiscount(body, "POST");
  const discount = new Discount(data);
  validateDiscountRules(discount);
  await discount.save();
  return discount;
}

async function update(id, body, method) {
  const data = parseDiscount(body, method);
  const discount = await getById(id, "manager");

  if (method === "PUT") {
    discount.set({
      ...data,
      validFrom: data.validFrom ?? null,
      validTo: data.validTo ?? null,
    });
  } else {
    discount.set(data);
  }

  validateDiscountRules(discount);
  await discount.save();
  return discount;
}

async function deactivate(id) {
  const discount = await getById(id, "manager");
  discount.isActive = false;
  await discount.save();
}

module.exports = { list, getById, create, update, deactivate };
