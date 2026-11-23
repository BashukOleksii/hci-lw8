const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const { ApiError } = require("../utils/apiUtils");

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    throw new ApiError(401, "Для доступу необхідно авторизуватися");
  }

  const match = header.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    throw new ApiError(401, "Очікується заголовок Authorization: Bearer <token>");
  }

  let decoded;

  try {
    decoded = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch (error) {
    if (["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error.name)) {
      throw new ApiError(401, "Токен недійсний або термін його дії завершився");
    }

    throw error;
  }

  if (typeof decoded !== "object" || !mongoose.isValidObjectId(decoded.sub)) {
    throw new ApiError(401, "Некоректний токен");
  }

  const user = await User.findById(decoded.sub);

  if (!user || !user.isActive) {
    throw new ApiError(401, "Користувач недоступний або деактивований");
  }

  req.user = user;
  next();
}

module.exports = authMiddleware;
