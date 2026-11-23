const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

function handleDatabaseError(error, res) {
  if (error.code === 11000) {
    return res.status(409).json({
      message: "Користувач із таким логіном уже існує",
    });
  }

  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((item) => item.message);

    return res.status(400).json({
      message: "Помилка валідації",
      errors,
    });
  }

  console.error("Помилка роботи з користувачем:", error);

  return res.status(500).json({
    message: "Внутрішня помилка сервера",
  });
}

async function register(req, res) {
  try {
    const { username, password, name, address, phone, contactPerson } =
      req.body || {};

    const fields = [username, password, name, address, phone, contactPerson];

    if (fields.some((value) => typeof value !== "string" || !value.trim())) {
      return res.status(400).json({
        message: "Усі поля реєстрації обов’язкові",
      });
    }

    const normalizedUsername = username.trim().toLowerCase();

    if (!/^[a-z0-9._-]{3,30}$/.test(normalizedUsername)) {
      return res.status(400).json({
        message: "Логін має містити 3–30 допустимих символів",
      });
    }

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        message:
          "Пароль має містити щонайменше 8 символів і не більше 72 байтів",
      });
    }

    const existingUser = await User.findOne({
      username: normalizedUsername,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Користувач із таким логіном уже існує",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      username: normalizedUsername,
      passwordHash,
      role: "customer",
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      contactPerson: contactPerson.trim(),
    });

    return res.status(201).json({
      message: "Реєстрація успішна",
      user: toPublicUser(user),
    });
  } catch (error) {
    return handleDatabaseError(error, res);
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body || {};

    if (
      typeof username !== "string" ||
      !username.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Логін і пароль обов’язкові",
      });
    }

    const user = await User.findOne({
      username: username.trim().toLowerCase(),
    }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        message: "Невірний логін або пароль",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Невірний логін або пароль",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Обліковий запис деактивовано",
      });
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
      },
      process.env.JWT_SECRET,
      {
        algorithm: "HS256",
        expiresIn: "2h",
      },
    );

    return res.status(200).json({
      message: "Авторизація успішна",
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    return handleDatabaseError(error, res);
  }
}

function getMe(req, res) {
  return res.status(200).json({
    user: toPublicUser(req.user),
  });
}

module.exports = {
  register,
  login,
  getMe,
};
