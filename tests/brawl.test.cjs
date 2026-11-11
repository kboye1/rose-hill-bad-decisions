const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const elements={};const ctx=new Proxy({}, {get:(o,k)=>k==='measureText'?()=>({width:10}):k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}});
function el(s){return elements[s]??={style:{},hidden:true,value:s==='#difficulty'?'easy':'freeroam',textContent:'',children:[],getContext:()=>ctx,addEventListener(){},requestPointerLock(){},appendChild(v){this.children.push(v)},replaceChildren(){this.children=[]}}}
const sandbox={window:{},document:{body:{classList:{toggle(){}}},querySelector:el,createElement:()=>({...el('template'),children:[]}),addEventListener(){},exitPointerLock(){}},innerWidth:1000,innerHeight:700,addEventListener(){},localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>0},requestAnimationFrame(){},console,assert};vm.createContext(sandbox);
for(const file of ['game.js','activities.js','social.js','brawl.js','life.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),sandbox);
vm.runInContext(`
const api=window.combatAPI;started=true;running=true;mode='freeroam';$('#overlay').style.display='none';guards=[];player.a=0;students=[{x:player.x+.25,y:player.y,name:'TEST RIVAL',brave:true,a:Math.PI}];const rival=students[0];
const tick=s=>{for(let t=0;t<s;t+=.02)update(.02);};
assert(api.punch());assert(!api.punch(),'punch cooldown prevents double attacks');tick(.18);assert.equal(rival.hp,60,'short-range punch lands after windup');assert(rival.fighting,'provoked brave student retaliates');assert(heat>=20&&trust===-1,'punch raises security heat and costs trust');tick(1.3);assert(api.view().health<100,'opponent can land a return hit');
rival.fighting=false;api.heal();elapsed+=1;keys={KeyZ:true};api.update(.01);api.damage(20);assert.equal(api.view().health,96,'guard absorbs most damage');assert(api.view().stamina<100);keys={};elapsed+=1;
assert(api.punch());tick(.2);tick(.5);assert(api.punch());tick(.2);assert(rival.downUntil>elapsed&&rival.hp===0,'three punches cause a temporary knockdown');const oldTrust=trust;tick(9.2);assert.equal(rival.hp,100,'downed student recovers');assert.equal(trust,oldTrust,'no repeated trust penalty while recovering');
acceptStory('project','usb','test');rival.fighting=false;elapsed+=1;api.damage(500);assert(api.disabled());tick(2.8);assert.equal(api.view().health,100);assert(!api.disabled());assert.equal(story('project').stage,'usb','defeat preserves story progress');
driving=true;assert(!api.punch(),'cannot punch while driving');driving=false;running=false;assert(!api.punch(),'cannot punch through menus');running=true;
reset();started=true;running=true;mode='freeroam';guards=[];player.a=0;students=[{x:player.x+1,y:player.y,name:'OUT OF REACH',brave:false}];assert(api.punch());tick(.2);assert.equal(students[0].hp,undefined,'punch does not hit a distant person');
`,sandbox);
console.log('PASS: punch timing/range/cooldown, retaliation, guard/stamina, heat/trust, knockdown recovery, defeat continuity and menu/vehicle guards');
