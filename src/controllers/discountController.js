const Discount = require("../models/Discount");

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
  "conditionType",
  "threshold",
  "percentage",
  "isActive",
  "validFrom",
  "validTo",
];

const SORT_FIELDS = [
  "createdAt",
  "name",
  "percentage",
  "threshold",
  "validFrom",
];

function parseDiscount(body, requiredFields = []) {
  validateBody(body, FIELDS, requiredFields);

  const result = {};

  for (const [key, value] of Object.entries(body)) {
    if (key === "name") {
      if (
        typeof value !== "string" ||
        !value.trim() ||
        value.trim().length > 150
      ) {
        throw new ApiError(400, "Некоректна назва знижки");
      }

      result.name = value.trim();
    }

    if (key === "conditionType") {
      if (!["quantity", "amount"].includes(value)) {
        throw new ApiError(400, "conditionType має бути quantity або amount");
      }

      result.conditionType = value;
    }

    if (key === "threshold") {
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value <= 0 ||
        value > 1_000_000_000
      ) {
        throw new ApiError(400, "threshold має бути додатним числом");
      }

      result.threshold = value;
    }

    if (key === "percentage") {
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 100 ||
        !isMoney(value)
      ) {
        throw new ApiError(
          400,
          "percentage має бути від 0 до 100 із максимум двома десятковими знаками",
        );
      }

      result.percentage = value;
    }

    if (key === "isActive") {
      if (typeof value !== "boolean") {
        throw new ApiError(400, "isActive має бути true або false");
      }

      result.isActive = value;
    }

    if (key === "validFrom" || key === "validTo") {
      if (value === null) {
        result[key] = null;
        continue;
      }

      if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value)
      ) {
        throw new ApiError(400, `${key} має бути датою у форматі ISO`);
      }

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        throw new ApiError(400, `Некоректна дата в полі ${key}`);
      }

      result[key] = date;
    }
  }

  return result;
}

function validateDiscountRules(discount) {
  if (
    discount.conditionType === "quantity" &&
    !Number.isInteger(discount.threshold)
  ) {
    throw new ApiError(400, "Для quantity поріг має бути цілим числом");
  }

  if (
    discount.conditionType === "amount" &&
    (!isMoney(discount.threshold) || discount.threshold <= 0)
  ) {
    throw new ApiError(
      400,
      "Для amount поріг має бути додатною грошовою сумою",
    );
  }

  if (
    discount.validFrom &&
    discount.validTo &&
    discount.validFrom > discount.validTo
  ) {
    throw new ApiError(400, "validFrom не може бути пізніше validTo");
  }
}

function isCurrentlyActive(discount) {
  const now = new Date();

  return (
    discount.isActive &&
    (!discount.validFrom || discount.validFrom <= now) &&
    (!discount.validTo || discount.validTo >= now)
  );
}

async function getDiscounts(req, res) {
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

  const conditionType = req.query.conditionType;

  if (conditionType !== undefined) {
    if (
      typeof conditionType !== "string" ||
      !["quantity", "amount"].includes(conditionType)
    ) {
      throw new ApiError(400, "Некоректний conditionType");
    }

    filter.conditionType = conditionType;
  }

  if (req.user.role === "customer") {
    const now = new Date();

    filter.isActive = true;

    filter.$and = [
      {
        $or: [{ validFrom: null }, { validFrom: { $lte: now } }],
      },
      {
        $or: [{ validTo: null }, { validTo: { $gte: now } }],
      },
    ];
  } else {
    const isActive = parseBoolean(req.query.isActive, "isActive");

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }
  }

  const [total, discounts] = await Promise.all([
    Discount.countDocuments(filter),

    Discount.find(filter)
      .sort({
        [sortBy]: direction,
        _id: 1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  return res.status(200).json({
    data: discounts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

async function getDiscountById(req, res) {
  assertObjectId(req.params.id);

  const discount = await Discount.findById(req.params.id);

  if (
    !discount ||
    (req.user.role === "customer" && !isCurrentlyActive(discount))
  ) {
    throw new ApiError(404, "Знижку не знайдено");
  }

  return res.status(200).json(discount);
}

async function createDiscount(req, res) {
  const data = parseDiscount(req.body, [
    "name",
    "conditionType",
    "threshold",
    "percentage",
  ]);

  const discount = new Discount(data);

  validateDiscountRules(discount);

  await discount.save();

  return res.status(201).json(discount);
}

async function updateDiscount(req, res) {
  assertObjectId(req.params.id);

  const isPut = req.method === "PUT";

  const requiredFields = isPut
    ? ["name", "conditionType", "threshold", "percentage", "isActive"]
    : [];

  const data = parseDiscount(req.body, requiredFields);

  const discount = await Discount.findById(req.params.id);

  if (!discount) {
    throw new ApiError(404, "Знижку не знайдено");
  }

  if (isPut) {
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

  return res.status(200).json(discount);
}

async function deleteDiscount(req, res) {
  assertObjectId(req.params.id);

  const discount = await Discount.findById(req.params.id);

  if (!discount) {
    throw new ApiError(404, "Знижку не знайдено");
  }

  discount.isActive = false;

  await discount.save();

  return res.status(204).end();
}

module.exports = {
  getDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
};
