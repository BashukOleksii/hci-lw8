const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { ApiError } = require("../utils/apiUtils");

function toPublicUser(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    role: user.role,
    name: user.name,
    address: user.address,
    phone: user.phone,
    contactPerson: user.contactPerson,
    isActive: user.isActive,
  };
}

async function register(data) {
  const existing = await User.exists({ username: data.username });

  if (existing) {
    throw new ApiError(409, "Користувач із таким логіном уже існує");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await User.create({
    username: data.username,
    passwordHash,
    role: "customer",
    name: data.name,
    address: data.address,
    phone: data.phone,
    contactPerson: data.contactPerson,
  });

  return toPublicUser(user);
}

async function login(credentials) {
  const user = await User.findOne({ username: credentials.username })
    .select("+passwordHash");

  if (!user || !await bcrypt.compare(credentials.password, user.passwordHash)) {
    throw new ApiError(401, "Невірний логін або пароль");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Обліковий запис деактивовано");
  }

  const token = jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: "2h" }
  );

  return { token, user: toPublicUser(user) };
}

module.exports = { register, login, toPublicUser };
