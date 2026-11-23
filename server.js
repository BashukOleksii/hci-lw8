const dns = require("node:dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

require("dotenv").config();

const connectDB = require("./src/config/db");
const app = require("./src/app");

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  if (!process.env.JWT_SECRET) {
    throw new Error("Не задано JWT_SECRET у файлі .env");
  }

  await connectDB();

  app.listen(PORT, () => {
    console.log(`Сервер запущено: http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Помилка запуску застосунку:", error);
  process.exit(1);
});
