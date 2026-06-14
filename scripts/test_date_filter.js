// Let's test the date filtering logic in ReportsClient

const startDate = "2026-06-07";
const endDate = "2026-06-14";
const itemTimestamp = "2026-06-14T21:07:13.99+00:00"; // UTC timestamp of the sale item

// Simulate filterItem
function testFilter() {
  console.log('startDate:', startDate);
  console.log('endDate:', endDate);
  console.log('itemTimestamp:', itemTimestamp);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  console.log('Parsed start:', start.toISOString(), 'Value:', start.getTime());

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  console.log('Parsed end:', end.toISOString(), 'Value:', end.getTime());

  const itemDate = new Date(itemTimestamp);
  console.log('Parsed itemDate:', itemDate.toISOString(), 'Value:', itemDate.getTime());

  const isAfterStart = itemDate >= start;
  const isBeforeEnd = itemDate <= end;
  
  console.log('itemDate >= start:', isAfterStart);
  console.log('itemDate <= end:', isBeforeEnd);
  console.log('Final filter match:', isAfterStart && isBeforeEnd);
}

testFilter();
