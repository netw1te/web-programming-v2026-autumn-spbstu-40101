import {
  Product,
  groupByCategory,
  getUniqueCategories,
  groupByPriceRange,
} from './model.js';

const STORAGE_KEY = 'products';
const OPERATION_DELAY = 500;

const form = document.querySelector('[data-testid="entity-form"]');
const list = document.querySelector('[data-testid="entity-list"]');
const statusEl = document.querySelector('[data-testid="status"]');

function createDefaultProducts() {
  return [
    new Product(1, 'Ноутбук', ['Электроника', 'Компьютеры'], 65000),
    new Product(2, 'Смартфон', ['Электроника', 'Телефоны'], 30000),
    new Product(3, 'Книга по JavaScript', ['Книги', 'Образование'], 900),
    new Product(4, 'Кофе в зёрнах', ['Продукты', 'Напитки'], 650),
    new Product(5, 'Наушники', ['Электроника', 'Аксессуары'], 4500),
  ];
}

function loadProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return createDefaultProducts();
    }
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      return createDefaultProducts();
    }
    return data.map((d) => new Product(d.id, d.name, d.categories, d.price));
  } catch {
    return createDefaultProducts();
  }
}

function saveProducts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (error) {
    console.error('Не удалось сохранить в localStorage:', error);
  }
}

const products = loadProducts();

function runOperation(action) {
  setStatus('Выполняется операция…', false);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(action());
      } catch (error) {
        reject(error);
      }
    }, OPERATION_DELAY);
  })
    .then(() => {
      saveProducts();
      render();
      setStatus('Готово', false);
      return true;
    })
    .catch((error) => {
      setStatus(error.message, true);
      return false;
    });
}

function findProduct(id) {
  const found = products.find((p) => p.id === id);
  if (!found) {
    throw new Error('Товар не найден');
  }
  return found;
}

function addProduct({ idText, name, priceText }) {
  return runOperation(() => {
    const id = Number(idText);
    const price = Number(priceText);
    const cleanName = name.trim();
    if (idText.trim() === '' || !Number.isInteger(id)) {
      throw new Error('ID должен быть целым числом');
    }
    if (products.some((p) => p.id === id)) {
      throw new Error(`Товар с ID ${id} уже существует`);
    }
    if (cleanName === '') {
      throw new Error('Введите название товара');
    }
    if (priceText.trim() === '' || !Number.isFinite(price) || price < 0) {
      throw new Error('Цена должна быть неотрицательным числом');
    }
    products.push(new Product(id, cleanName, [], price));
  });
}

function removeProduct(id) {
  return runOperation(() => {
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error('Товар не найден');
    }
    products.splice(index, 1);
  });
}

function addCategory(id, category) {
  return runOperation(() => {
    const target = findProduct(id);
    const value = category.trim();
    if (value === '') {
      throw new Error('Введите название категории');
    }
    if (!target.addCategory(value)) {
      throw new Error(`Категория «${value}» уже есть у товара`);
    }
  });
}

function removeCategory(id, category) {
  return runOperation(() => {
    const target = findProduct(id);
    const value = category.trim();
    if (value === '') {
      throw new Error('Введите название категории');
    }
    if (!target.removeCategory(value)) {
      throw new Error(`У товара нет категории «${value}»`);
    }
  });
}

function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function setStatus(message, isError) {
  statusEl.textContent = message;
  statusEl.classList.toggle('status-error', isError);
}

function formatPrice(price) {
  return `${price.toLocaleString('ru-RU')} ₽`;
}

function createCard(product) {
  const card = el('article', 'card');
  card.setAttribute('data-testid', 'entity-card');
  card.append(
    el('h3', 'card-title', product.name),
    el('p', 'card-meta', `ID: ${product.id}`),
    el('p', 'card-price', formatPrice(product.price)),
    el('p', 'card-meta', `Категорий: ${product.categoryCount}`),
  );

  const categoriesList = el('ul', 'card-categories');
  if (product.categoryCount === 0) {
    categoriesList.append(el('li', 'card-empty', 'Нет категорий'));
  } else {
    for (const category of product.categories) {
      categoriesList.append(el('li', undefined, category));
    }
  }
  card.append(categoriesList);

  const input = el('input');
  input.type = 'text';
  input.placeholder = 'Название категории';
  input.setAttribute('aria-label', `Категория для товара ${product.name}`);

  const addButton = el('button', undefined, 'Добавить категорию');
  addButton.type = 'button';
  addButton.addEventListener('click', () => addCategory(product.id, input.value));

  const removeCategoryButton = el('button', undefined, 'Удалить категорию');
  removeCategoryButton.type = 'button';
  removeCategoryButton.addEventListener('click', () =>
    removeCategory(product.id, input.value),
  );

  const removeProductButton = el('button', 'danger', 'Удалить товар');
  removeProductButton.type = 'button';
  removeProductButton.setAttribute('data-testid', 'delete-entity');
  removeProductButton.addEventListener('click', () => removeProduct(product.id));

  const actions = el('div', 'card-actions');
  actions.append(input, addButton, removeCategoryButton, removeProductButton);
  card.append(actions);

  return card;
}

function render() {
  list.replaceChildren();
  if (products.length === 0) {
    list.append(el('p', 'empty', 'Товаров нет'));
    return;
  }
  for (const product of products) {
    list.append(createCard(product));
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  addProduct({
    idText: String(data.get('id') ?? ''),
    name: String(data.get('name') ?? ''),
    priceText: String(data.get('price') ?? ''),
  }).then((ok) => {
    if (ok) {
      form.reset();
    }
  });
});

render();

console.warn('Группы по категориям:', groupByCategory(products));
console.warn('Уникальные категории:', getUniqueCategories(products));
console.warn('Группы по ценам:', groupByPriceRange(products));