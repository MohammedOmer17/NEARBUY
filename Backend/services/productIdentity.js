const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizeIdentityPart = (value) => String(value || "").normalize("NFKC").trim().replace(/\s+/g, " ");

const exactText = (value) => new RegExp(`^${escapeRegex(normalizeIdentityPart(value))}$`, "i");

function buildProductIdentityFilter(product) {
  const name = normalizeIdentityPart(product?.name);
  const brand = normalizeIdentityPart(product?.brand);
  const category = normalizeIdentityPart(product?.category);
  const unit = normalizeIdentityPart(product?.unit);

  if (!name || !unit || (!brand && !category)) {
    return null;
  }

  const filter = {
    name: exactText(name),
    unit: exactText(unit),
  };

  if (brand) {
    filter.brand = exactText(brand);
  } else {
    filter.brand = { $in: ["", null] };
    filter.category = exactText(category);
  }

  return filter;
}

module.exports = { buildProductIdentityFilter };
