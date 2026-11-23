const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Для доступу необхідно авторизуватися",
    });
  }

  const match = authHeader.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return res.status(401).json({
      message: "Очікується заголовок Authorization: Bearer <token>",
    });
  }

  const token = match[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (typeof decoded !== "object" || !mongoose.isValidObjectId(decoded.sub)) {
      return res.status(401).json({
        message: "Некоректний токен",
      });
    }

    const user = await User.findById(decoded.sub);

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Користувач недоступний або деактивований",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        message: "Токен недійсний або термін його дії завершився",
      });
    }

    console.error("Помилка перевірки авторизації:", error);

    return res.status(500).json({
      message: "Помилка сервера під час перевірки авторизації",
    });
  }
}

module.exports = authMiddleware;
