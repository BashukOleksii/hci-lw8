const mongoose = require("mongoose");
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function assertObjectId(id) {
  if (typeof id !== "string" || !mongoose.isObjectIdOrHexString(id)) {
    throw new ApiError(400, "Некоректний ідентифікатор");
  }
}

function validateBody(body, allowedFields, requiredFields = []) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(400, "Очікується JSON-об’єкт");
  }

  const keys = Object.keys(body);
  if (keys.length === 0) throw new ApiError(400, "Тіло запиту порожнє");

  const unknown = keys.filter((key) => !allowedFields.includes(key));
  if (unknown.length)
    throw new ApiError(400, `Невідомі поля: ${unknown.join(", ")}`);

  for (const field of requiredFields) {
    if (!Object.hasOwn(body, field)) {
      throw new ApiError(400, `Обов’язкове поле відсутнє: ${field}`);
    }
  }
}

function parsePagination(query, allowedSortFields) {
  const pageRaw = query.page ?? "1";
  const limitRaw = query.limit ?? "10";

  if (
    typeof pageRaw !== "string" ||
    !/^[1-9]\d*$/.test(pageRaw) ||
    !Number.isSafeInteger(Number(pageRaw)) ||
    Number(pageRaw) > 10000
  ) {
    throw new ApiError(400, "Некоректний параметр page");
  }

  if (
    typeof limitRaw !== "string" ||
    !/^[1-9]\d*$/.test(limitRaw) ||
    Number(limitRaw) > 100
  ) {
    throw new ApiError(400, "limit має бути від 1 до 100");
  }

  const sortBy = query.sortBy ?? "createdAt";
  const order = query.order ?? "desc";
  const search = query.search ?? "";

  if (typeof sortBy !== "string" || !allowedSortFields.includes(sortBy)) {
    throw new ApiError(400, "Некоректне поле сортування");
  }

  if (order !== "asc" && order !== "desc") {
    throw new ApiError(400, "order має бути asc або desc");
  }

  if (typeof search !== "string" || search.length > 100) {
    throw new ApiError(400, "Некоректний пошуковий рядок");
  }

  const page = Number(pageRaw);
  const limit = Number(limitRaw);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sortBy,
    direction: order === "asc" ? 1 : -1,
    search: search.trim(),
  };
}

function parseBoolean(value, field) {
  if (value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new ApiError(400, `${field} має бути true або false`);
}

function isMoney(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1_000_000_000 &&
    Math.abs(value * 100 - Math.round(value * 100)) < 1e-7
  );
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  ApiError,
  assertObjectId,
  validateBody,
  parsePagination,
  parseBoolean,
  isMoney,
  escapeRegex,
};
