function errorMiddleware(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Некоректний формат JSON" });
  }

  if (error.type === "entity.too.large") {
    return res.status(413).json({ message: "Завеликий розмір запиту" });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "Документ із таким унікальним значенням уже існує" });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Помилка валідації",
      errors: Object.values(error.errors).map((item) => item.message),
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ message: "Некоректний тип даних" });
  }

  if (Number.isInteger(error.status) && error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ message: error.message });
  }

  console.error("Помилка API:", error);
  return res.status(500).json({ message: "Внутрішня помилка сервера" });
}

module.exports = errorMiddleware;
