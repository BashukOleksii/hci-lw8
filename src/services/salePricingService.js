const { ApiError, isMoney } = require("../utils/apiUtils");

const WHOLESALE_MIN_QUANTITY = 10;

function roundMoney(value) {
  if (!Number.isFinite(value)) {
    throw new ApiError(422, "Некоректне грошове значення");
  }

  return Number(value.toFixed(2));
}

function isApplicable(discount, totalQuantity, subtotal, now) {
  if (!discount.isActive) return false;
  if (discount.validFrom && new Date(discount.validFrom) > now) return false;
  if (discount.validTo && new Date(discount.validTo) < now) return false;
  if (!isMoney(discount.percentage) || discount.percentage > 100) return false;

  if (discount.conditionType === "quantity") {
    return Number.isSafeInteger(discount.threshold) &&
      discount.threshold > 0 && totalQuantity >= discount.threshold;
  }

  if (discount.conditionType === "amount") {
    return isMoney(discount.threshold) &&
      discount.threshold > 0 && subtotal >= discount.threshold;
  }

  return false;
}

function calculateSale(items, products, discounts, now = new Date()) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Продаж має містити товари");
  }

  const productsById = new Map(
    products.map((product) => [product._id.toString().toLowerCase(), product])
  );

  let subtotal = 0;
  let totalQuantity = 0;

  const saleItems = items.map((item) => {
    const product = productsById.get(item.product.toLowerCase());

    if (!product || !product.isActive) {
      throw new ApiError(422, `Товар ${item.product} недоступний для продажу`);
    }

    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      throw new ApiError(400, "Некоректна кількість товару");
    }

    const priceType = item.quantity >= WHOLESALE_MIN_QUANTITY
      ? "wholesale"
      : "retail";

    const unitPrice = priceType === "wholesale"
      ? product.wholesalePrice
      : product.retailPrice;

    if (!isMoney(unitPrice)) {
      throw new ApiError(422, "Некоректна ціна товару");
    }

    const lineTotal = roundMoney(unitPrice * item.quantity);
    totalQuantity += item.quantity;
    subtotal += lineTotal;

    return {
      product: product._id,
      productName: product.name,
      quantity: item.quantity,
      priceType,
      unitPrice,
      lineTotal,
    };
  });

  subtotal = roundMoney(subtotal);
  if (!isMoney(subtotal)) {
    throw new ApiError(422, "Сума продажу перевищує допустимий ліміт");
  }

  const types = new Set(saleItems.map((item) => item.priceType));
  const saleType = types.size === 1 ? saleItems[0].priceType : "mixed";

  const best = discounts
    .filter((discount) => isApplicable(discount, totalQuantity, subtotal, now))
    .sort((a, b) => b.percentage - a.percentage ||
      a._id.toString().localeCompare(b._id.toString()))[0] ?? null;

  const percentage = best?.percentage ?? 0;
  const discountAmount = roundMoney(subtotal * percentage / 100);
  const totalAmount = roundMoney(subtotal - discountAmount);

  return {
    saleType,
    items: saleItems,
    totalQuantity,
    subtotal,
    discount: {
      discountId: best?._id ?? null,
      name: best?.name ?? null,
      percentage,
      amount: discountAmount,
    },
    totalAmount,
  };
}

module.exports = { calculateSale, WHOLESALE_MIN_QUANTITY };
