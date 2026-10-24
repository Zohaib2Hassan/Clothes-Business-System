import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const adb='C:/Users/zohai/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const pkg='com.zohaibhassan.threadlypocket';
const call=(...args)=>execFileSync(adb,['-s','emulator-5554',...args],{encoding:'utf8',timeout:40000});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const checks=[];const check=name=>{checks.push(name);console.log('PASS',name);};
function nodes(){call('shell','uiautomator','dump','/sdcard/threadly-window.xml');const xml=call('shell','cat','/sdcard/threadly-window.xml');return [...xml.matchAll(/<node\s+([^>]+)>/g)].map(match=>Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]])));}
function locate(label,list=nodes()){return list.find(node=>node['content-desc']===label)||list.find(node=>(node.text||'').toLowerCase()===label.toLowerCase());}
async function tap(label){let node=locate(label);for(let i=0;!node&&i<4;i++){call('shell','input','swipe','540','2000','540','850','350');await pause(500);node=locate(label);}assert.ok(node,`Native control ${label} exists`);const[a,b,c,d]=node.bounds.match(/\d+/g).map(Number);call('shell','input','tap',String((a+c)/2),String((b+d)/2));}
async function fill(label,value){await tap(label);call('shell','input','keycombination','113','29');call('shell','input','text',value);call('shell','input','keyevent','4');if(label!=='Password')assert.equal(locate(label)?.text,value,`${label} entered`);}
const qaUrl=fs.readFileSync('artifacts/qa-public-url.txt','utf8').trim();assert.ok(/^https:\/\/[a-z-]+\.trycloudflare\.com$/.test(qaUrl));
const email=`android-${Date.now()}@example.invalid`;const password=`Qa-${Date.now()}-test`;
const response=await fetch('http://127.0.0.1:5005/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Synthetic Android QA',email,password})});assert.ok(response.ok);const user=await response.json();
try{
  call('shell','am','start','-n',`${pkg}/.MainActivity`);await pause(1500);
  await fill('Website address',qaUrl);await fill('Email address',email);await fill('Password',password);await tap('Sign in');
  let signedIn=false;for(let i=0;i<8;i++){await pause(1200);if(locate('Your shop, together.')){signedIn=true;break;}}assert.ok(signedIn,'Native HTTPS login reaches shared dashboard');check('Signed APK launches and signs into isolated website account over HTTPS');
  call('shell','screencap','-p','/sdcard/threadly-native-home.png');call('pull','/sdcard/threadly-native-home.png','artifacts/native-home.png');
  call('shell','am','force-stop',pkg);call('shell','am','start','-n',`${pkg}/.MainActivity`);await pause(2500);assert.ok(locate('Your shop, together.'));check('Native SecureStore restores the session after a full app restart');
  call('shell','am','start','-a','android.intent.action.VIEW','-d','threadlypocket:///live/more',pkg);await pause(1000);await tap('Sign out of website');await pause(600);if(!locate('Continue')){await tap('Sign out of website');await pause(500);}await tap('Continue');await pause(800);assert.ok(locate('Sign in'));check('Native sign-out returns to the website sign-in screen');
}catch(error){try{call('shell','screencap','-p','/sdcard/threadly-native-failure.png');call('pull','/sdcard/threadly-native-failure.png','artifacts/native-failure.png');fs.writeFileSync('artifacts/native-failure-nodes.json',JSON.stringify(nodes(),null,2));}catch{}throw error;}
finally{await fetch('http://127.0.0.1:5005/api/auth/profile',{method:'DELETE',headers:{Authorization:`Bearer ${user.token}`}});fs.writeFileSync('artifacts/android-smoke-results.json',JSON.stringify({checks,device:'Android API 37 x86_64 emulator; not a physical phone'},null,2));}
