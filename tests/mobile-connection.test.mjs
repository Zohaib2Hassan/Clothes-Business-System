import test, { afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { protect } from '../server/middleware/authMiddleware.js';
import { planReturn } from '../server/utils/returnPlan.js';
import { processPOSReturn } from '../server/controllers/posController.js';
import Sale from '../server/models/Sale.js';
import Product from '../server/models/Product.js';
import User from '../server/models/User.js';
import Business from '../server/models/Business.js';
import Customer from '../server/models/Customer.js';
import Expense from '../server/models/Expense.js';
import HeldSale from '../server/models/HeldSale.js';
import Return from '../server/models/Return.js';
import Notification from '../server/models/Notification.js';
import { deleteUserProfile } from '../server/controllers/authController.js';
afterEach(()=>mock.restoreAll());
const response=()=>({statusCode:200,status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;}});
const sale=()=>({_id:'s',__v:0,totalAmount:180.01,refundAmount:0,items:[{_id:'a',productName:'Kurta M',productId:'p',price:100,qty:1,returnedQty:0},{_id:'b',productName:'Kurta L',productId:'p',price:100,qty:1,returnedQty:0}]});
test('two-factor challenge tokens cannot act as signed-in sessions',async()=>{
  const token=jwt.sign({id:'user',purpose:'2fa_login'},process.env.JWT_SECRET||'secret');const res=response();
  await protect({headers:{authorization:`Bearer ${token}`}},res,()=>assert.fail('must not authorize'));
  assert.equal(res.statusCode,401);
});
test('returns validate every line and never confuse variants sharing a product ID',()=>{
  const s=sale();for(const rows of [[{itemId:'a',qty:1},{itemId:'b',qty:2}],[{itemId:'a',qty:1},{itemId:'a',qty:1}],[{productId:'p',qty:1}],[{itemId:'a',qty:0}],[{itemId:'a',qty:1.2}]])assert.throws(()=>planReturn(s,rows));
  assert.equal(s.items[0].returnedQty,0);
});
test('discounted and taxed returns allocate exact paid cents across partial returns',()=>{
  const s=sale();const first=planReturn(s,[{itemId:'a',qty:1}]);assert.equal(first.refund,90.01);s.items[0].returnedQty=1;s.refundAmount=first.refund;
  const second=planReturn(s,[{itemId:'b',qty:1}]);assert.equal(second.refund,90);assert.equal(Math.round((first.refund+second.refund)*100),18001);
});
test('invalid multi-line request writes no inventory or receipt',async()=>{
  mock.method(Sale,'findOne',async()=>sale());const write=mock.method(Product,'findOneAndUpdate',async()=>assert.fail('must not restock'));
  const res=response();await processPOSReturn({user:{_id:'u'},body:{saleId:'s',itemsToReturn:[{itemId:'a',qty:1},{itemId:'b',qty:2}]}},res);
  assert.equal(res.statusCode,400);assert.equal(write.mock.callCount(),0);
});
test('a concurrent receipt change rejects the return before restocking',async()=>{
  mock.method(Sale,'findOne',async()=>sale());mock.method(Sale,'findOneAndUpdate',async()=>null);
  const write=mock.method(Product,'findOneAndUpdate',async()=>assert.fail('must not restock'));
  const res=response();await processPOSReturn({user:{_id:'u'},body:{saleId:'s',itemsToReturn:[{itemId:'a',qty:1}]}},res);
  assert.equal(res.statusCode,409);assert.equal(write.mock.callCount(),0);
});
test('account deletion removes every related collection for only the signed-in owner',async()=>{
  const owner='synthetic-owner';mock.method(User,'findById',async()=>({_id:owner}));
  const remove=mock.method(User,'findByIdAndDelete',async id=>assert.equal(id,owner));
  const calls=[Business,Product,Sale,Customer,Expense,HeldSale,Return,Notification].map(model=>mock.method(model,'deleteMany',async query=>assert.deepEqual(query,{user:owner})));
  const res=response();await deleteUserProfile({user:{_id:owner}},res);
  assert.equal(res.statusCode,200);assert.equal(remove.mock.callCount(),1);for(const call of calls)assert.equal(call.mock.callCount(),1);
});
