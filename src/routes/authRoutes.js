const router = require("express").Router();

const { register, login, getMe } = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/register", register);
router.post("/login", login);

router.get("/me", authMiddleware, getMe);

router.get(
  "/manager-check",
  authMiddleware,
  roleMiddleware("manager"),
  (req, res) => {
    return res.status(200).json({
      message: "Доступ менеджера підтверджено",
      username: req.user.username,
      role: req.user.role,
    });
  },
);

module.exports = router;
