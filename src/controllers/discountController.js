const discountService = require("../services/discountService");

async function getDiscounts(req, res) {
  return res.status(200).json(await discountService.list(req.query, req.user.role));
}

async function getDiscountById(req, res) {
  return res.status(200).json(await discountService.getById(req.params.id, req.user.role));
}

async function createDiscount(req, res) {
  return res.status(201).json(await discountService.create(req.body));
}

async function updateDiscount(req, res) {
  const discount = await discountService.update(req.params.id, req.body, req.method);
  return res.status(200).json(discount);
}

async function deleteDiscount(req, res) {
  await discountService.deactivate(req.params.id);
  return res.status(204).end();
}

module.exports = {
  getDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
};
