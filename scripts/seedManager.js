require("dotenv").config();

const dns = require("node:dns");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("../src/config/db");
const User = require("../src/models/User");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

async function seedManager() {
  const username = process.env.MANAGER_USERNAME?.trim().toLowerCase();

  const password = process.env.MANAGER_PASSWORD;
  const name = process.env.MANAGER_NAME || "Менеджер";

  if (!username || !password) {
    throw new Error("Не задано MANAGER_USERNAME або MANAGER_PASSWORD");
  }

  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    throw new Error("Некоректний логін менеджера");
  }

  await connectDB();

  const existingUser = await User.findOne({ username });

  if (existingUser) {
    if (existingUser.role !== "manager") {
      throw new Error("Логін зайнятий користувачем без ролі manager");
    }

    console.log("Менеджер уже існує");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({
    username,
    passwordHash,
    role: "manager",
    name,
    isActive: true,
  });

  console.log("Менеджера успішно створено");
}

seedManager()
  .catch((error) => {
    console.error("Помилка створення менеджера:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
