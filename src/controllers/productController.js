const productService = require("../services/productService");

async function getProducts(req, res) {
  return res.status(200).json(await productService.list(req.query, req.user.role));
}

async function getProductById(req, res) {
  return res.status(200).json(await productService.getById(req.params.id, req.user.role));
}

async function createProduct(req, res) {
  return res.status(201).json(await productService.create(req.body));
}

async function updateProduct(req, res) {
  const product = await productService.update(req.params.id, req.body, req.method);
  return res.status(200).json(product);
}

async function deleteProduct(req, res) {
  await productService.deactivate(req.params.id);
  return res.status(204).end();
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
