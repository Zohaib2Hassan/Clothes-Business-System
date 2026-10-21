import test, { afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { getPKDateKey, getSalesChart } from '../server/utils/dashboard.js';
import { getDashboardStats } from '../server/controllers/dashboardController.js';
import { getNotifications, clearAllNotifications } from '../server/controllers/notificationController.js';
import Sale from '../server/models/Sale.js';
import Product from '../server/models/Product.js';
import Notification from '../server/models/Notification.js';

afterEach(() => mock.restoreAll());

test('empty business has zero recorded sales for every selected day', () => {
  for (const period of [7, 15, 30]) {
    const result = getSalesChart([], period, new Date('2026-10-21T08:00:00Z'));
    assert.equal(result.chartData.length, period);
    assert.equal(result.periodRevenue, 0);
    assert.ok(result.chartData.every((day) => day.sales === 0));
  }
});

test('Pakistan midnight determines sale dates independently of the server timezone', () => {
  assert.equal(getPKDateKey(new Date('2026-10-20T19:00:00Z')), '2026-10-21');
  const result = getSalesChart([
    { date: '2026-10-20T18:59:59Z', totalAmount: 150 },
    { date: '2026-10-20T19:00:00Z', totalAmount: 250 },
    { date: '2026-10-21T02:00:00Z', totalAmount: 400 },
  ], 7, new Date('2026-10-21T08:00:00Z'));
  assert.equal(result.chartData.at(-2).sales, 150);
  assert.equal(result.chartData.at(-1).sales, 650);
  assert.equal(result.periodRevenue, 800);
});

test('15 and 30 day charts include each day exactly once, including today', () => {
  const now = new Date('2026-10-21T08:00:00Z');
  for (const period of [15, 30]) {
    const sales = Array.from({ length: period }, (_, day) => ({
      date: new Date(now.getTime() - day * 86400000), totalAmount: 100,
    }));
    const result = getSalesChart(sales, period, now);
    assert.equal(new Set(result.chartData.map((day) => day.date)).size, period);
    assert.ok(result.chartData.every((day) => day.sales === 100));
    assert.equal(result.chartData.at(-1).date, '2026-10-21');
    assert.equal(result.periodRevenue, period * 100);
  }
});

test('chart ignores invalid, future, and out-of-range sales and validates the period', () => {
  const result = getSalesChart([
    { date: 'bad date', totalAmount: 10 },
    { date: '2026-10-21T09:00:00Z', totalAmount: 20 },
    { date: '2026-10-14T18:59:59Z', totalAmount: 30 },
    { date: '2026-10-14T19:00:00Z', totalAmount: 40 },
    { createdAt: '2026-10-21T01:00:00Z', totalAmount: 50 },
  ], 'invalid', new Date('2026-10-21T08:00:00Z'));
  assert.equal(result.periodDays, 7);
  assert.equal(result.periodRevenue, 90);
});

test('dashboard API returns real empty totals, stock shortages, and no invented forecast', async () => {
  mock.method(Sale, 'find', (query) => {
    assert.deepEqual(query, { user: 'test-owner' });
    return { populate: async () => [] };
  });
  mock.method(Product, 'find', async () => [{ stock: 0 }, { stock: 2 }, { stock: 20 }]);
  let body;
  await getDashboardStats({ user: { _id: 'test-owner' }, query: { period: '30' } }, { json: (data) => { body = data; } });
  assert.equal(body.totalRevenue, 0);
  assert.equal(body.totalSalesCount, 0);
  assert.equal(body.periodRevenue, 0);
  assert.equal(body.chartData.length, 30);
  assert.equal(body.lowStockCount, 1);
  assert.equal(body.outOfStockCount, 1);
  assert.equal('predictedSales' in body, false);
});

test('cleared notification inbox stays empty on the next read', async () => {
  const query = { user: 'test-owner' };
  mock.method(Notification, 'deleteMany', async (filter) => assert.deepEqual(filter, query));
  mock.method(Notification, 'find', (filter) => {
    assert.deepEqual(filter, query);
    return { sort: async () => [] };
  });
  const insert = mock.method(Notification, 'insertMany', () => { throw new Error('GET must not create alerts'); });
  await clearAllNotifications({ user: { _id: 'test-owner' } }, { json: () => {} });
  let body;
  await getNotifications({ user: { _id: 'test-owner' } }, { json: (data) => { body = data; } });
  assert.deepEqual(body, { notifications: [], unreadCount: 0 });
  assert.equal(insert.mock.callCount(), 0);
});
