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

router.use(roleMiddleware("manager"));

router.post("/", createDiscount);

router.put("/:id", updateDiscount);

router.patch("/:id", updateDiscount);

router.delete("/:id", deleteDiscount);

module.exports = router;
