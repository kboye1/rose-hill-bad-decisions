const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const elements={};const ctx=new Proxy({}, {get:(o,k)=>k==='measureText'?()=>({width:10}):k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}});
function el(s){return elements[s]??={style:{},hidden:true,value:s==='#difficulty'?'easy':'freeroam',textContent:'',children:[],getContext:()=>ctx,addEventListener(){},requestPointerLock(){},appendChild(v){this.children.push(v)},replaceChildren(){this.children=[]}}}
const sandbox={window:{},document:{body:{classList:{toggle(){}}},querySelector:el,createElement:()=>({...el('template'),children:[]}),addEventListener(){},exitPointerLock(){}},innerWidth:1000,innerHeight:700,addEventListener(){},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},requestAnimationFrame(){},console,assert};vm.createContext(sandbox);
for(const file of ['game.js','activities.js','social.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),sandbox);
vm.runInContext(`
const api=window.socialAPI;started=true;running=true;mode='freeroam';$('#overlay').style.display='none';
const near={x:player.x+.8,y:player.y,a:0,color:'#665544'};students=[near];
api.toggle();assert(api.menuOpen()&&!running);const frozen=elapsed;update(.5);assert.equal(elapsed,frozen,'wheel pauses simulation and job clock');api.handleKey({code:'Digit1',preventDefault(){}});assert(!api.menuOpen()&&running);assert.equal(api.view().action,'wave');assert.equal(near.mood,'wave');
assert(api.perform('roast'));assert.equal(heat,8);assert.equal(near.mood,'shrug');assert(!api.perform('roast'),'rapid roasts cannot spam heat');
assert(api.perform('dance'));assert.equal(near.mood,'dance');api.perform('dance');assert.equal(api.view(),null,'dance toggles off');api.perform('pose');player.x+=.1;api.update();assert.equal(api.view(),null,'movement cancels a pose');
driving=true;assert(!api.perform('dance'));driving=false;students=[];assert(!api.perform('wave'),'must be near a visible student');
api.celebrate();assert.equal(api.view().action,'dance');elapsed+=5;api.update();assert.equal(api.view(),null,'rally dance ends');
window.activityAPI.start('party');api.toggle();assert(!running&&api.menuOpen());const savedJobClock=$('#activity-time').textContent;update(1);assert.equal($('#activity-time').textContent,savedJobClock,'wheel pauses active job');api.toggle();assert(running);api.reset();assert.equal(api.view(),null);assert(!api.menuOpen());
`,sandbox);
console.log('PASS: interaction wheel pause/resume, greetings, roast cooldown, dance reactions, pose cancellation, vehicle guard and job-clock pause');
