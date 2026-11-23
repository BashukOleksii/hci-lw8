const { ApiError, isMoney } = require("../utils/apiUtils");

const WHOLESALE_MIN_QUANTITY = 10;

function roundMoney(value) {
  return Number(value.toFixed(2));
}

function calculateSale(items, products, discounts, now = new Date()) {
  let totalQuantity = 0;
  let subtotal = 0;

  const saleItems = items.map((item) => {
    const product = products.find(
      (p) => p._id.toString().toLowerCase() === item.product.toLowerCase(),
    );

    if (!product || !product.isActive) {
      throw new ApiError(422, `Товар ${item.product} недоступний для продажу`);
    }

    const priceType =
      item.quantity >= WHOLESALE_MIN_QUANTITY ? "wholesale" : "retail";

    const unitPrice =
      priceType === "wholesale" ? product.wholesalePrice : product.retailPrice;

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
    throw new ApiError(422, "Некоректна загальна сума");
  }

  const priceTypes = new Set(saleItems.map((item) => item.priceType));

  const saleType = priceTypes.size > 1 ? "mixed" : saleItems[0].priceType;

  const applicableDiscounts = discounts.filter((discount) => {
    if (!discount.isActive) {
      return false;
    }

    if (discount.validFrom && new Date(discount.validFrom) > now) {
      return false;
    }

    if (discount.validTo && new Date(discount.validTo) < now) {
      return false;
    }

    if (!isMoney(discount.percentage) || discount.percentage > 100) {
      return false;
    }

    if (discount.conditionType === "quantity") {
      return (
        Number.isInteger(discount.threshold) &&
        totalQuantity >= discount.threshold
      );
    }

    if (discount.conditionType === "amount") {
      return isMoney(discount.threshold) && subtotal >= discount.threshold;
    }

    return false;
  });

  applicableDiscounts.sort((a, b) => b.percentage - a.percentage);

  const bestDiscount = applicableDiscounts[0] || null;

  const percentage = bestDiscount ? bestDiscount.percentage : 0;

  const discountAmount = roundMoney((subtotal * percentage) / 100);

  const totalAmount = roundMoney(subtotal - discountAmount);

  return {
    saleType,
    items: saleItems,
    totalQuantity,
    subtotal,

    discount: {
      discountId: bestDiscount?._id ?? null,
      name: bestDiscount?.name ?? null,
      percentage,
      amount: discountAmount,
    },

    totalAmount,
  };
}

module.exports = {
  calculateSale,
  WHOLESALE_MIN_QUANTITY,
};
