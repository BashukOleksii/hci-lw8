const { ApiError, validateBody, assertObjectId } = require("../utils/apiUtils");

function parseSaleItems(body) {
  validateBody(body, ["items"], ["items"]);

  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) {
    throw new ApiError(400, "Вкажіть від 1 до 50 позицій товарів");
  }

  const seen = new Set();
  let count = 0;

  return body.items.map((item) => {
    validateBody(item, ["product", "quantity"], ["product", "quantity"]);
    assertObjectId(item.product);

    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 1000) {
      throw new ApiError(400, "Кількість має бути цілим числом від 1 до 1000");
    }

    count += item.quantity;
    if (count > 1000) {
      throw new ApiError(400, "Загальна кількість не може перевищувати 1000");
    }

    const product = item.product.toLowerCase();
    if (seen.has(product)) {
      throw new ApiError(400, "Один товар не можна додавати двічі");
    }

    seen.add(product);
    return { product, quantity: item.quantity };
  });
}

module.exports = { parseSaleItems };
