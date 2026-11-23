const authService = require("../services/authService");
const { parseRegistration, parseLogin } = require("../validators/authValidator");

async function register(req, res) {
  const user = await authService.register(parseRegistration(req.body));
  return res.status(201).json({ message: "Реєстрація успішна", user });
}

async function login(req, res) {
  const result = await authService.login(parseLogin(req.body));
  return res.status(200).json({ message: "Авторизація успішна", ...result });
}

function getMe(req, res) {
  return res.status(200).json({ user: authService.toPublicUser(req.user) });
}

module.exports = { register, login, getMe };
