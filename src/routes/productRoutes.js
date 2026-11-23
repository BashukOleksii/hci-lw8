const router = require("express").Router();

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

router.get("/", getProducts);
router.get("/:id", getProductById);

router.post("/", roleMiddleware("manager"), createProduct);

router.put("/:id", roleMiddleware("manager"), updateProduct);

router.patch("/:id", roleMiddleware("manager"), updateProduct);

router.delete("/:id", roleMiddleware("manager"), deleteProduct);

module.exports = router;
