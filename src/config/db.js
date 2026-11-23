const mongoose = require("mongoose");

async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("Не задано MONGO_URI у файлі .env");
  }

  const dbName = process.env.MONGO_DB_NAME || "finished_goods_sales";

  await mongoose.connect(mongoUri, {
    dbName,
  });

  console.log(`Підключено до MongoDB Atlas: ${mongoose.connection.name}`);
}

module.exports = connectDB;
