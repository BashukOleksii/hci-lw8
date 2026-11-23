const { ApiError, isMoney } = require("../utils/apiUtils");

function text(value, field, maxLength, minLength = 1) {
  if (typeof value !== "string") {
    throw new ApiError(400, `Поле ${field} має бути рядком`);
  }

  const normalized = value.trim();

  if (normalized.length < minLength || normalized.length > maxLength) {
    throw new ApiError(400, `Некоректна довжина поля ${field}`);
  }

  return normalized;
}

function boolean(value, field) {
  if (typeof value !== "boolean") {
    throw new ApiError(400, `Поле ${field} має бути true або false`);
  }

  return value;
}

function amount(value, field, { positive = false } = {}) {
  if (!isMoney(value) || (positive && value === 0)) {
    throw new ApiError(400, `Некоректне грошове значення ${field}`);
  }

  return value;
}

function date(value, field) {
  if (value === null) return null;

  if (typeof value !== "string") {
    throw new ApiError(400, `Некоректна дата ${field}`);
  }

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  const dateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

  if (!dateOnly.test(value) && !dateTime.test(value)) {
    throw new ApiError(400, `Некоректний формат дати ${field}`);
  }

  const result = new Date(value);

  if (
    Number.isNaN(result.getTime()) ||
    (dateOnly.test(value) && result.toISOString().slice(0, 10) !== value)
  ) {
    throw new ApiError(400, `Некоректна дата ${field}`);
  }

  return result;
}

module.exports = { text, boolean, amount, date };
