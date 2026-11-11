const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const elements={},saved=new Map();
const ctx=new Proxy({}, {get:(o,k)=>k==='measureText'?()=>({width:10}):k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}});
function el(s){return elements[s]??={style:{},dataset:{},hidden:true,value:s==='#difficulty'?'easy':'freeroam',textContent:'',children:[],focus(){},setAttribute(k,v){this[k]=v},getContext:()=>ctx,addEventListener(){},requestPointerLock(){},appendChild(v){this.children.push(v)},replaceChildren(){this.children=[]}}}
const sandbox={window:{},document:{body:{classList:{toggle(){}}},querySelector:el,createElement:()=>({...el('template'),style:{},children:[]}),addEventListener(){},exitPointerLock(){}},innerWidth:1280,innerHeight:720,addEventListener(){},localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},performance:{now:()=>0},requestAnimationFrame(){},console,assert};
vm.createContext(sandbox);
for(const file of ['game.js','activities.js','presentation.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),sandbox);
vm.runInContext(`
const ui=window.presentationAPI,event=code=>({code,preventDefault(){this.prevented=true}});
assert(ui.isLoading());
assert.equal($('#loading-count').textContent,'1 / 7');
for(const file of ['loading-keating.jpg','loading-hughes.jpg','loading-gym.jpg']){
 ui.handleKey(event('ArrowRight'));
 assert($('#loading-art').style.backgroundImage.includes(file),'campus cards use distinct images');
}
for(let i=0;i<4;i++)$('#loading-next').onclick();
assert.equal($('#loading-count').textContent,'1 / 7','next wraps to the first card');
$('#loading-prev').onclick();
assert.equal($('#loading-count').textContent,'7 / 7','previous wraps to the last card');
ui.handleKey(event('Enter'));assert(ui.isLoading(),'cannot enter before renderer is ready');
ui.ready();assert.equal($('#loading-progress').value,100);ui.handleKey(event('Enter'));assert(!ui.isLoading());
assert.equal(ui.appearance().id,'finance');ui.open();assert(ui.isOpen()&&!running,'creator opens before play');
$('#style-presets').children[1].onclick();assert.equal(ui.preview().id,'prep');assert.equal(ui.appearance().id,'finance','draft does not change walking/driver models before save');
$('#style-name').oninput({target:{value:'   Preston Jr   '}});ui.close(true);assert.equal(ui.appearance().nickname,'Preston Jr');assert.equal(ui.appearance().outfit,'blazer');assert.equal(JSON.parse(localStorage.getItem('roseHillStyle.v1')).id,'prep','profile saved for reload');
started=true;running=true;mode='freeroam';$('#overlay').style.display='none';acceptStory('project','usb','test');window.activityAPI.start('cart');const stageBefore=story('project').stage;const elapsedBefore=elapsed;
ui.open();assert(!running);update(5);assert.equal(elapsed,elapsedBefore,'wardrobe pauses job countdown');assert.equal(story('project').stage,stageBefore,'story state unchanged');
$('#style-presets').children[2].onclick();$('#style-hair').onchange({target:{value:'long'}});assert.equal(ui.preview().hair,'long','live preview reflects edits');
ui.handleKey(event('Escape'));assert(!ui.isOpen()&&running);assert.equal(ui.appearance().id,'prep','cancel discards draft');assert.equal(window.activityAPI.view().id,'cart','job still active');
ui.open();$('#style-presets').children[0].onclick();ui.close(true);assert(running&&ui.appearance().outfit==='vest','save resumes original game');
const normal=ui.normalize({id:'unknown',nickname:'\\n  Test \\t',skin:'not-a-color',outfit:'script',hair:'curls'});assert.equal(normal.nickname,'Test');assert.equal(normal.skin,'#d3a17e');assert.equal(normal.outfit,'vest');assert.equal(normal.hair,'curls');assert.equal(ui.normalize(null).id,'finance');
assert.equal(ui.normalize({id:'prep'}).gender,'male','old saved appearances migrate without losing their preset');
ui.open();$('#style-gender').onchange({target:{value:'female'}});assert.equal(ui.preview().gender,'female');assert.equal(ui.preview().nickname,'Chloe');
assert.equal($('#style-presets').children.length,6,'women have six presets');
$('#style-presets').children[5].onclick();
assert.equal(ui.preview().hair,'braids');assert.equal(ui.preview().outfit,'track');
$('#style-gender').onchange({target:{value:'male'}});
assert.equal(ui.preview().id,'finance','switching from a women-only preset selects its paired default');
assert.equal($('#style-presets').children.length,3);
$('#style-gender').onchange({target:{value:'female'}});
$('#style-presets').children[1].onclick();assert.equal(ui.preview().gender,'female','switching presets preserves character option');assert.equal(ui.preview().nickname,'Blair');assert.equal(ui.preview().outfit,'blazer');
$('#style-name').oninput({target:{value:'Custom Alias'}});$('#style-gender').onchange({target:{value:'male'}});assert.equal(ui.preview().nickname,'Custom Alias','changing character option preserves a custom name');
$('#style-gender').onchange({target:{value:'female'}});ui.close(true);assert.equal(JSON.parse(localStorage.getItem('roseHillStyle.v1')).gender,'female','female choice persists');
ui.open();$('#style-name').oninput({target:{value:'This name is longer than eighteen characters'}});ui.close(true);assert(ui.appearance().nickname.length<=18);
const tag=$('#player-tag').textContent;reset();assert.equal($('#player-tag').textContent,tag,'appearance survives new evening');
showChoices('test','test',[]);ui.open();assert(!ui.isOpen(),'wardrobe does not interrupt a conversation');leaveConversation();
`,sandbox);
// Recreate the presentation controller to exercise the same saved-profile path as a browser reload.
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','presentation.js'),'utf8'),sandbox);
assert.equal(sandbox.window.presentationAPI.appearance().nickname.length,18);
assert.equal(sandbox.window.presentationAPI.appearance().gender,'female');
console.log('PASS: readiness gate, preset previews, cosmetic save/reload, canceled edits, invalid profiles, paused job clocks, story continuity and conversation guard');
