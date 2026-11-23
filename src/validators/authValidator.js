const { ApiError, validateBody } = require("../utils/apiUtils");
const { text } = require("./common");

const REGISTER_FIELDS = [
  "username",
  "password",
  "name",
  "address",
  "phone",
  "contactPerson",
];

function username(value) {
  const normalized = text(value, "username", 30, 3).toLowerCase();

  if (!/^[a-z0-9._-]{3,30}$/.test(normalized)) {
    throw new ApiError(400, "Логін містить недопустимі символи");
  }

  return normalized;
}

function password(value) {
  if (
    typeof value !== "string" ||
    value.length < 8 ||
    Buffer.byteLength(value, "utf8") > 72
  ) {
    throw new ApiError(400, "Пароль має містити щонайменше 8 символів і не більше 72 байтів");
  }

  return value;
}

function parseRegistration(body) {
  validateBody(body, REGISTER_FIELDS, REGISTER_FIELDS);

  return {
    username: username(body.username),
    password: password(body.password),
    name: text(body.name, "name", 150),
    address: text(body.address, "address", 250),
    phone: text(body.phone, "phone", 30),
    contactPerson: text(body.contactPerson, "contactPerson", 150),
  };
}

function parseLogin(body) {
  validateBody(body, ["username", "password"], ["username", "password"]);

  if (typeof body.password !== "string" || body.password.length === 0) {
    throw new ApiError(400, "Логін і пароль обов’язкові");
  }

  return {
    username: username(body.username),
    password: body.password,
  };
}

module.exports = { parseRegistration, parseLogin };
