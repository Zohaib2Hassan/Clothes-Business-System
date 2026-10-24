import test, { afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { websiteAddress, request, ApiError } from '../src/remote/client.ts';
import { websiteReport } from '../src/remote/report.ts';
afterEach(() => mock.restoreAll());
test('native connections require HTTPS and strip only the API suffix', () => {
  assert.equal(websiteAddress(' https://shop.example/api/ '), 'https://shop.example');
  assert.equal(websiteAddress('https://shop.example/store/'), 'https://shop.example/store');
  for (const url of ['http://localhost:5005','http://shop.example','https://user:pass@shop.example','https://shop.example?token=x','https://shop.example#x']) assert.throws(() => websiteAddress(url));
  assert.equal(websiteAddress('http://127.0.0.1:5005', true),'http://127.0.0.1:5005');
  assert.throws(() => websiteAddress('http://192.168.1.2',true));
});
test('API sends bearer session and JSON body without retrying failed writes', async () => {
  const call = mock.method(globalThis,'fetch',async (url, options) => {
    assert.equal(url,'https://shop.example/api/pos/checkout'); assert.equal(options.headers.Authorization,'Bearer session');
    assert.deepEqual(JSON.parse(options.body),{items:[]}); throw new TypeError('Network failed');
  });
  await assert.rejects(request('https://shop.example','/pos/checkout',{token:'session',method:'POST',body:{items:[]}}), e => e instanceof ApiError && e.status===0 && /check Sales/.test(e.message));
  assert.equal(call.mock.callCount(),1);
});
test('API distinguishes expired login, bad address and explicit cancellation', async () => {
  mock.method(globalThis,'fetch',async()=>new Response('{"message":"Expired"}',{status:401}));
  await assert.rejects(request('https://x','/products'),e=>e.status===401 && e.message==='Expired');
  mock.restoreAll(); mock.method(globalThis,'fetch',async()=>new Response('<html>Wrong site</html>'));
  await assert.rejects(request('https://x','/products'),/did not return the Threadly API/);
  mock.restoreAll(); mock.method(globalThis,'fetch',async()=>{throw new DOMException('Aborted','AbortError');});
  const controller=new AbortController();controller.abort();
  await assert.rejects(request('https://x','/products',{signal:controller.signal}),e=>e.status===-1);
});
test('request timeout aborts once and never retries',async()=>{
  const call=mock.method(globalThis,'fetch',(_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')))));
  await assert.rejects(request('https://x','/pos/checkout',{method:'POST',timeout:15}),e=>e.status===0);
  assert.equal(call.mock.callCount(),1);
});
test('shared reports use Karachi boundaries, exclude future records and subtract refunds',()=>{
  const sale=(date,totalAmount,refundAmount=0)=>({date,totalAmount,refundAmount,items:[{productName:'Kurta',qty:2,returnedQty:1}]});
  const report=websiteReport([sale('2026-10-22T18:59:59Z',100),sale('2026-10-22T19:00:00Z',900,150),sale('2026-10-23T10:01:00Z',300)], [{date:'2026-10-23T08:00:00Z',amount:50,category:'Transport'}],1,new Date('2026-10-23T10:00:00Z'));
  assert.equal(report.orders.length,1);assert.equal(report.netSales,750);assert.equal(report.beforeProductCosts,700);assert.equal(report.topProducts[0].units,1);
});
