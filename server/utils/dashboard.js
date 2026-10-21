const DAY_MS = 24 * 60 * 60 * 1000;
const TIME_ZONE = 'Asia/Karachi';
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
});

export function getPKDateKey(date) {
  const parts = Object.fromEntries(dateFormatter.formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

// Keep every day, including zero-sales days, in the selected Pakistan date range.
export function getSalesChart(sales, requestedPeriod, now = new Date()) {
  const periodDays = [7, 15, 30].includes(Number(requestedPeriod)) ? Number(requestedPeriod) : 7;
  const todayStart = new Date(`${getPKDateKey(now)}T00:00:00+05:00`);
  const chartData = Array.from({ length: periodDays }, (_, index) => {
    const date = new Date(todayStart.getTime() - (periodDays - 1 - index) * DAY_MS);
    return {
      date: getPKDateKey(date),
      name: date.toLocaleDateString('en-US', {
        timeZone: TIME_ZONE,
        ...(periodDays === 7 ? { weekday: 'short' } : { month: 'short', day: 'numeric' }),
      }),
      sales: 0,
    };
  });
  const days = new Map(chartData.map((day) => [day.date, day]));
  for (const sale of sales) {
    const date = new Date(sale.date || sale.createdAt);
    if (Number.isNaN(date.getTime()) || date > now) continue;
    const day = days.get(getPKDateKey(date));
    if (day) day.sales += sale.totalAmount || 0;
  }
  return {
    periodDays,
    chartData,
    periodRevenue: chartData.reduce((total, day) => total + day.sales, 0),
  };
}
