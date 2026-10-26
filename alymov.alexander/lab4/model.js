export class Product {
  constructor(id, name, categories = [], price = 0) {
    this.id = id;
    this.name = name;
    this.categories = [...categories];
    this.price = price;
  }

  addCategory(category) {
    const value = String(category).trim();
    if (value === '' || this.categories.includes(value)) {
      return false;
    }
    this.categories.push(value);
    return true;
  }

  removeCategory(category) {
    const index = this.categories.indexOf(String(category).trim());
    if (index === -1) {
      return false;
    }
    this.categories.splice(index, 1);
    return true;
  }

  get categoryCount() {
    return this.categories.length;
  }
}

export { Product as product };

export const DEFAULT_PRICE_RANGES = [
  { label: 'до 1 000', min: 0, max: 1000 },
  { label: '1 000 – 10 000', min: 1000, max: 10000 },
  { label: '10 000 – 50 000', min: 10000, max: 50000 },
  { label: 'от 50 000', min: 50000, max: Infinity },
];

export function groupProductsByCategory(products) {
  const groups = {};
  for (const item of products) {
    for (const category of item.categories) {
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    }
  }
  return groups;
}

export function getUniqueCategories(products) {
  return [...new Set(products.flatMap((item) => item.categories))];
}

export function groupByPriceRange(products, ranges = DEFAULT_PRICE_RANGES) {
  const groups = {};
  for (const range of ranges) {
    groups[range.label] = [];
  }
  for (const item of products) {
    const range = ranges.find((r) => item.price >= r.min && item.price < r.max);
    if (range) {
      groups[range.label].push(item);
    }
  }
  return groups;
}

export function getProductsByCategory(products, category) {
  return products.filter((item) => item.categories.includes(category));
}

export function getProductsPriceAbove(products, minPrice) {
  return products.filter((item) => item.price > minPrice);
}