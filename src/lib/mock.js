async function mockGetOrder(orderNumber) {
  await new Promise((r) => setTimeout(r, 600));
  return {
    orderNumber,
    status: ["pending", "processing", "shipped", "delivered"][Math.floor(Math.random()*4)],
    customer: { name: "Demo User" },
    lastUpdated: new Date().toISOString(),
  };
}
async function mockApplyStatus(orderNumber, status) {
  await new Promise((r) => setTimeout(r, 500));
  return { ok: true, orderNumber, status, lastUpdated: new Date().toISOString() };
}
export { mockGetOrder, mockApplyStatus };
