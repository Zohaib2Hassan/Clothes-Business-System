// Validate the complete request before writing any stock or sale changes.
export function planReturn(sale, requested) {
  if (!Array.isArray(requested) || !requested.length) throw new Error('Choose items to return.');
  const selected = new Map();
  for (const row of requested) {
    const qty = Number(row.qty);
    if (!Number.isSafeInteger(qty) || qty <= 0) throw new Error('Return quantities must be positive whole numbers.');
    // An explicit line ID is authoritative: variants can share a product ID.
    const matches = sale.items.filter((item) => row.itemId
      ? String(item._id) === String(row.itemId)
      : (row.productId && (item.productId === row.productId || String(item.product) === row.productId)));
    if (matches.length !== 1) throw new Error('Select an unambiguous item from the original receipt.');
    const item = matches[0]; const id = String(item._id);
    const combined = (selected.get(id)?.qty || 0) + qty;
    if (combined > item.qty - (item.returnedQty || 0)) throw new Error(`Return exceeds remaining quantity for ${item.productName}.`);
    selected.set(id, { item, qty: combined });
  }
  const cents = (value) => Math.round(Number(value || 0) * 100);
  const total = cents(sale.totalAmount);
  const subtotal = sale.items.reduce((sum, item) => sum + cents(item.price) * item.qty, 0);
  if (total < 0 || subtotal <= 0) throw new Error('This receipt cannot be refunded automatically.');
  // Allocate the paid amount (discount and tax included), with deterministic
  // cent rounding per line. A full return exactly equals the original payment.
  let weight = 0;
  const allocations = new Map();
  for (const item of sale.items) {
    const before = Math.round(total * weight / subtotal);
    weight += cents(item.price) * item.qty;
    allocations.set(String(item._id), Math.round(total * weight / subtotal) - before);
  }
  let refund = 0;
  const lines = [...selected.values()].map(({ item, qty }) => {
    const allocation = allocations.get(String(item._id));
    const old = item.returnedQty || 0;
    const amount = Math.round(allocation * (old + qty) / item.qty) - Math.round(allocation * old / item.qty);
    refund += amount;
    return { item, qty, refund: amount / 100 };
  });
  if (refund > total - cents(sale.refundAmount)) throw new Error('Refund exceeds the remaining paid amount. Please review this receipt.');
  return { lines, refund: refund / 100 };
}
