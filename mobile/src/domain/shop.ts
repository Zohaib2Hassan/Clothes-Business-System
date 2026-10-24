export type Category = 'Kurtas' | 'Shirts' | 'Trousers' | 'Fabric' | 'Accessories' | 'Other';
export const CATEGORIES: Category[] = ['Kurtas', 'Shirts', 'Trousers', 'Fabric', 'Accessories', 'Other'];
export type Product = { id: string; name: string; category: Category; size: string; color: string; sku: string; price: number; cost: number; stock: number; lowAt: number; archived: boolean };
export type SaleItem = { productId: string; name: string; variant: string; quantity: number; price: number; cost: number };
export type Sale = { id: string; number: string; date: string; customer: string; method: 'Cash' | 'Card' | 'Bank transfer'; items: SaleItem[]; subtotal: number; discount: number; total: number; cost: number; voided: boolean };
export type Expense = { id: string; title: string; category: string; amount: number; date: string };
export type Shop = { version: 1; mode: 'live' | 'sample'; settings: { name: string; owner: string }; products: Product[]; sales: Sale[]; expenses: Expense[] };
export type CartLine = { productId: string; quantity: number };
const MAX_MONEY = 1_000_000_000;

export function emptyShop(): Shop {
  return { version: 1, mode: 'live', settings: { name: 'My clothing shop', owner: '' }, products: [], sales: [], expenses: [] };
}
export function newId(prefix: string) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`; }
export function money(cents: number) { return `Rs. ${(cents / 100).toLocaleString('en-PK', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`; }
export function parseMoney(value: string): number {
  const cleaned = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) throw new Error('Enter an amount with up to two decimal places.');
  const [whole, fraction = ''] = cleaned.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents > MAX_MONEY) throw new Error('This amount is too large.');
  return cents;
}
export function dayKey(date: string | Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(date));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
export function variant(product: Pick<Product, 'size' | 'color'>) { return [product.size, product.color].filter(Boolean).join(' · ') || 'Standard'; }
const integer = (value: unknown, max = MAX_MONEY): value is number => Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= max;
const text = (value: unknown, max = 120): value is string => typeof value === 'string' && value.length <= max;
const validDate = (value: unknown): value is string => text(value, 40) && Boolean(value.trim()) && !Number.isNaN(new Date(value).getTime());

export function validateProduct(product: Product) {
  if (!product || typeof product !== 'object') throw new Error('A product in this backup is invalid.');
  if (!text(product.id) || !product.id || !text(product.name, 80) || !product.name.trim()) throw new Error('Add a product name.');
  if (!CATEGORIES.includes(product.category)) throw new Error('Choose a valid category.');
  if (!text(product.size, 30) || !text(product.color, 40) || !text(product.sku, 50)) throw new Error('Product details are too long.');
  if (!integer(product.price) || product.price < 1 || !integer(product.cost)) throw new Error('Enter a positive selling price and a valid cost.');
  if (!integer(product.stock, 1_000_000) || !integer(product.lowAt, 1_000_000)) throw new Error('Stock quantities must be whole numbers between 0 and 1,000,000.');
  if (typeof product.archived !== 'boolean') throw new Error('Invalid product status.');
}

export function saveProduct(shop: Shop, product: Product): Shop {
  const cleaned = { ...product, name: product.name.trim(), sku: product.sku.trim(), size: product.size.trim(), color: product.color.trim() };
  validateProduct(cleaned);
  if (cleaned.sku && shop.products.some((item) => item.id !== cleaned.id && !item.archived && item.sku.toLowerCase() === cleaned.sku.toLowerCase())) throw new Error('This SKU already belongs to another product.');
  return { ...shop, products: shop.products.some((item) => item.id === cleaned.id) ? shop.products.map((item) => item.id === cleaned.id ? cleaned : item) : [cleaned, ...shop.products] };
}

export function checkout(shop: Shop, lines: CartLine[], options: { id: string; customer: string; method: Sale['method']; discount: number; date?: string }): { shop: Shop; sale: Sale } {
  if (!text(options.id) || !options.id.trim()) throw new Error('This sale needs a valid identifier.');
  if (shop.sales.some((sale) => sale.id === options.id)) throw new Error('This sale has already been saved.');
  if (!lines.length) throw new Error('Add at least one item to this sale.');
  if (!['Cash', 'Card', 'Bank transfer'].includes(options.method) || !text(options.customer, 80)) throw new Error('Check the customer and payment details.');
  const quantities = new Map<string, number>();
  for (const line of lines) {
    if (!integer(line.quantity, 1_000_000) || line.quantity < 1) throw new Error('Enter a valid quantity.');
    quantities.set(line.productId, (quantities.get(line.productId) || 0) + line.quantity);
  }
  const items = [...quantities].map(([id, quantity]): SaleItem => {
    const product = shop.products.find((item) => item.id === id && !item.archived);
    if (!product) throw new Error('An item in this sale is no longer available.');
    if (product.stock < quantity) throw new Error(`Only ${product.stock} of ${product.name} left in stock.`);
    return { productId: id, name: product.name, variant: variant(product), quantity, price: product.price, cost: product.cost };
  });
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cost = items.reduce((sum, item) => sum + item.cost * item.quantity, 0);
  if (!integer(subtotal) || !integer(cost)) throw new Error('This sale is too large. Split it into smaller sales.');
  if (!integer(options.discount) || options.discount > subtotal) throw new Error('Discount cannot be greater than the sale total.');
  const date = options.date || new Date().toISOString();
  if (!validDate(date)) throw new Error('Invalid sale date.');
  const sale: Sale = { id: options.id, number: `TP-${String(shop.sales.length + 1).padStart(4, '0')}`, date, customer: options.customer.trim() || 'Walk-in customer', method: options.method, items, subtotal, discount: options.discount, total: subtotal - options.discount, cost, voided: false };
  return { sale, shop: { ...shop, products: shop.products.map((product) => ({ ...product, stock: product.stock - (quantities.get(product.id) || 0) })), sales: [sale, ...shop.sales] } };
}

export function voidSale(shop: Shop, id: string): Shop {
  const sale = shop.sales.find((item) => item.id === id);
  if (!sale || sale.voided) throw new Error('This sale is already void or unavailable.');
  return { ...shop, products: shop.products.map((product) => {
    const restored = product.stock + sale.items.filter((item) => item.productId === product.id).reduce((sum, item) => sum + item.quantity, 0);
    if (!integer(restored, 1_000_000)) throw new Error('The restored stock would exceed the stock limit.');
    return { ...product, stock: restored };
  }), sales: shop.sales.map((item) => item.id === id ? { ...item, voided: true } : item) };
}

export function saveExpense(shop: Shop, expense: Expense): Shop {
  if (!expense || typeof expense !== 'object') throw new Error('An expense in this backup is invalid.');
  if (!text(expense.id) || !expense.id || !text(expense.title, 80) || !expense.title.trim() || !text(expense.category, 40)) throw new Error('Add a short expense description.');
  if (!integer(expense.amount) || expense.amount < 1 || !validDate(expense.date)) throw new Error('Enter a valid expense amount and date.');
  if (shop.expenses.some((item) => item.id === expense.id)) throw new Error('This expense has already been saved.');
  return { ...shop, expenses: [{ ...expense, title: expense.title.trim() }, ...shop.expenses] };
}

export function summary(shop: Shop, date?: string) {
  const sales = shop.sales.filter((sale) => !sale.voided && (!date || dayKey(sale.date) === date));
  const expenses = shop.expenses.filter((expense) => !date || dayKey(expense.date) === date).reduce((sum, expense) => sum + expense.amount, 0);
  const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  return { revenue, orders: sales.length, units: sales.reduce((sum, sale) => sum + sale.items.reduce((total, item) => total + item.quantity, 0), 0), expenses, earnings: revenue - sales.reduce((sum, sale) => sum + sale.cost, 0) - expenses };
}

export function weeklySales(shop: Shop, now = new Date()) {
  const today = new Date(`${dayKey(now)}T12:00:00+05:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getTime() - (6 - index) * 86400000);
    return { day: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Karachi' }), ...summary(shop, dayKey(date)) };
  });
}

export function receiptText(shop: Shop, sale: Sale) {
  return [shop.settings.name, sale.voided ? 'VOID SALE' : 'SALES RECEIPT', sale.number, new Date(sale.date).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }), sale.customer, '', ...sale.items.map((item) => `${item.quantity} × ${item.name} (${item.variant})  ${money(item.price * item.quantity)}`), '', `Subtotal: ${money(sale.subtotal)}`, `Discount: ${money(sale.discount)}`, `Total: ${money(sale.total)}`, `Recorded payment: ${sale.method}`, '', 'Thank you for shopping with us.'].join('\n');
}

export function validateBackup(input: unknown): Shop {
  if (!input || typeof input !== 'object') throw new Error('This is not a Threadly Pocket backup.');
  const shop = input as Shop;
  if (shop.version !== 1 || !['live', 'sample'].includes(shop.mode) || !shop.settings || !text(shop.settings.name, 80) || !shop.settings.name.trim() || !text(shop.settings.owner, 80)) throw new Error('This backup format is not supported.');
  for (const list of [shop.products, shop.sales, shop.expenses]) {
    if (!Array.isArray(list) || list.length > 50000) throw new Error('The backup contains an invalid or oversized list.');
    if (new Set(list.map((item) => item?.id)).size !== list.length) throw new Error('The backup contains duplicate records.');
  }
  shop.products.forEach(validateProduct);
  shop.expenses.forEach((expense) => saveExpense({ ...emptyShop(), expenses: [] }, expense));
  for (const sale of shop.sales) {
    if (!sale || typeof sale !== 'object' || !text(sale.id) || !sale.id || !text(sale.number) || !text(sale.customer, 80) || !validDate(sale.date) || typeof sale.voided !== 'boolean' || !['Cash', 'Card', 'Bank transfer'].includes(sale.method) || !Array.isArray(sale.items) || !sale.items.length || sale.items.length > 5000) throw new Error('A sale in this backup is invalid.');
    for (const item of sale.items) {
      if (!item || typeof item !== 'object' || !text(item.productId) || !shop.products.some((product) => product.id === item.productId) || !text(item.name, 80) || !text(item.variant, 120) || !integer(item.quantity, 1_000_000) || item.quantity < 1 || !integer(item.price) || !integer(item.cost)) throw new Error('A sale item in this backup is invalid.');
    }
    const subtotal = sale.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const cost = sale.items.reduce((sum, item) => sum + item.cost * item.quantity, 0);
    if (![sale.subtotal, sale.discount, sale.total, sale.cost].every((value) => integer(value)) || sale.subtotal !== subtotal || sale.cost !== cost || sale.discount > subtotal || sale.total !== subtotal - sale.discount) throw new Error('A sale total in this backup is invalid.');
  }
  // Copy only the supported data fields; never keep untrusted backup properties.
  return { version: 1, mode: shop.mode, settings: { name: shop.settings.name, owner: shop.settings.owner }, products: shop.products.map((p) => ({ id: p.id, name: p.name, category: p.category, size: p.size, color: p.color, sku: p.sku, price: p.price, cost: p.cost, stock: p.stock, lowAt: p.lowAt, archived: p.archived })), sales: shop.sales.map((s) => ({ id: s.id, number: s.number, date: s.date, customer: s.customer, method: s.method, items: s.items.map((i) => ({ productId: i.productId, name: i.name, variant: i.variant, quantity: i.quantity, price: i.price, cost: i.cost })), subtotal: s.subtotal, discount: s.discount, total: s.total, cost: s.cost, voided: s.voided })), expenses: shop.expenses.map((e) => ({ id: e.id, title: e.title, category: e.category, amount: e.amount, date: e.date })) };
}

export function sampleShop(): Shop {
  let shop = emptyShop();
  shop.mode = 'sample';
  shop.settings = { name: 'The Everyday Edit', owner: 'Sample shop' };
  const items: [string, Category, string, string, number, number, number][] = [
    ['Linen everyday kurta', 'Kurtas', 'M', 'Sage', 325000, 190000, 18],
    ['Classic Oxford shirt', 'Shirts', 'L', 'Cloud blue', 245000, 140000, 12],
    ['Relaxed cotton trousers', 'Trousers', '32', 'Sand', 280000, 165000, 4],
    ['Summer lawn fabric', 'Fabric', '3-piece', 'Ivory', 420000, 270000, 9],
    ['Everyday tote', 'Accessories', 'One size', 'Olive', 125000, 60000, 3],
  ];
  shop.products = items.map(([name, category, size, color, price, cost, stock], index) => ({ id: `sample-product-${index}`, name, category, size, color, price, cost, stock: stock + 12, lowAt: 5, sku: `TP-${100 + index}`, archived: false }));
  const now = new Date();
  for (let day = 6; day >= 0; day--) {
    const result = checkout(shop, [{ productId: shop.products[day % items.length].id, quantity: day % 2 + 1 }], { id: `sample-sale-${day}`, customer: ['Ayesha', 'Walk-in customer', 'Hassan'][day % 3], method: day % 2 ? 'Card' : 'Cash', discount: day === 0 ? 10000 : 0, date: new Date(now.getTime() - day * 86400000).toISOString() });
    shop = result.shop;
  }
  shop.products = shop.products.map((product, index) => ({ ...product, stock: items[index][6] }));
  return saveExpense(shop, { id: 'sample-expense-1', title: 'Packaging and paper bags', category: 'Supplies', amount: 85000, date: now.toISOString() });
}
