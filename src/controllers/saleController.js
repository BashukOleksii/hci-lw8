const saleService = require("../services/saleService");

async function createSale(req, res) {
  const sale = await saleService.create(req.body, req.user._id);
  return res.status(201).json(sale);
}

async function getMySales(req, res) {
  return res.status(200).json(await saleService.listMine(req.user._id));
}

async function getAllSales(req, res) {
  return res.status(200).json(await saleService.listAll());
}

async function getSaleById(req, res) {
  return res.status(200).json(await saleService.getById(req.params.id, req.user));
}

module.exports = { createSale, getMySales, getAllSales, getSaleById };
