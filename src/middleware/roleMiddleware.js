const { ApiError } = require("../utils/apiUtils");

function roleMiddleware(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      throw new ApiError(401, "Користувач не авторизований");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, "Недостатньо прав для виконання операції");
    }

    next();
  };
}

module.exports = roleMiddleware;
