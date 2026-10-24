import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base='http://127.0.0.1:5005'; // Explicit isolated QA server, never a public shop.
const email=`services-${Date.now()}@example.invalid`;
const auth=await fetch(`${base}/api/auth/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Synthetic Services QA',email,password:`QA-${Date.now()}`})});
assert.ok(auth.ok);const user=await auth.json();
const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:320,height:740}});page.setDefaultTimeout(20000);
const errors=[];const checks=[];page.on('pageerror',error=>errors.push(error.message));
await page.addInitScript(session=>{sessionStorage.setItem('threadly.website.session.v1',JSON.stringify(session));},{url:base,token:user.token,user:{_id:user._id,name:user.name,email:user.email}});
const check=name=>{checks.push(name);console.log('PASS',name);};
try{
  await page.goto('http://localhost:8082/workspace/predictions');await page.getByRole('button',{name:'Request website model update',exact:true}).waitFor();
  await page.getByText('SERVER-ESTIMATED REVENUE',{exact:true}).waitFor();await page.screenshot({path:'artifacts/connected-forecast-empty.png'});check('Forecast screen consumes real QA backend response and shows its data-quality notice');
  await page.goto('http://localhost:8082/workspace/subscription');await page.getByText('Free',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:/buy|purchase|upgrade/i}).count(),0);check('Subscription screen reads the existing plan without offering unimplemented purchases');
  let requestBody;await page.route('**/api/ai/chat',async route=>{requestBody=route.request().postDataJSON();await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({reply:'Synthetic QA assistant response'})});});
  await page.goto('http://localhost:8082/workspace/assistant');await page.getByLabel('Ask your website assistant',{exact:true}).fill('Which products are low on stock?');await page.getByRole('button',{name:'Send question',exact:true}).click();await page.getByText('Synthetic QA assistant response',{exact:true}).waitFor();assert.equal(requestBody.message,'Which products are low on stock?');assert.deepEqual(requestBody.history,[]);check('Assistant sends the expected message/history contract and displays a labelled test reply');
  await page.unroute('**/api/ai/chat');await page.route('**/api/ai/chat',route=>route.abort('failed'));await page.getByLabel('Ask your website assistant',{exact:true}).fill('Another question');await page.getByRole('button',{name:'Send question',exact:true}).click();await page.getByText(/Could not reach the website/).waitFor();assert.equal(await page.getByText('Synthetic QA assistant response',{exact:true}).count(),1);check('Assistant network failure preserves conversation and shows an error without inventing a reply');
  assert.deepEqual(errors,[]);fs.writeFileSync('artifacts/connected-services-results.json',JSON.stringify({checks,errors,aiProvider:'Mocked for UI contract only; no external provider called'},null,2));
}finally{await fetch(`${base}/api/auth/profile`,{method:'DELETE',headers:{Authorization:`Bearer ${user.token}`}});await browser.close();}
