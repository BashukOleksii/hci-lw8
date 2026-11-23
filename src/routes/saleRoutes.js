const router = require("express").Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  createSale,
  getMySales,
  getAllSales,
  getSaleById,
} = require("../controllers/saleController");

router.use(authMiddleware);

router.post("/", roleMiddleware("customer"), createSale);
router.get("/my", roleMiddleware("customer"), getMySales);
router.get("/", roleMiddleware("manager"), getAllSales);
router.get("/:id", getSaleById);

module.exports = router;
