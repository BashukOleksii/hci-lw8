const router = require("express").Router();

const {
  getDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} = require("../controllers/discountController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

router.get("/", getDiscounts);
router.get("/:id", getDiscountById);

router.post("/", roleMiddleware("manager"), createDiscount);

router.put("/:id", roleMiddleware("manager"), updateDiscount);

router.patch("/:id", roleMiddleware("manager"), updateDiscount);

router.delete("/:id", roleMiddleware("manager"), deleteDiscount);

module.exports = router;
