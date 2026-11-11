const fs=require('fs'),vm=require('vm');
const elements={};const ctx=new Proxy({}, {get:(o,k)=>k==='measureText'?()=>({width:10}):k==='createLinearGradient'?()=>({addColorStop(){}}):()=>{}});
function el(s){return elements[s]??={style:{},hidden:true,value:s==='#difficulty'?'easy':'freeroam',textContent:'',children:[],getContext:()=>ctx,addEventListener(){},requestPointerLock(){},appendChild(v){this.children.push(v)},replaceChildren(){this.children=[]}}}
const sandbox={window:{},document:{body:{classList:{toggle(){}}},querySelector:el,createElement:()=>({...el('template'),children:[]}),addEventListener(){},exitPointerLock(){}},innerWidth:1000,innerHeight:700,addEventListener(){},localStorage:{getItem:()=>0,setItem(){}},performance:{now:()=>0},requestAnimationFrame(){},console};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'..','game.js'),'utf8'),sandbox);
vm.runInContext(`
function check(ok,msg){if(!ok)throw Error(msg)}function visit(p){player.x=p.x;player.y=p.y}function interactAt(p){visit(p);interact()}
check(definition('project').intro.includes('AI and Data-Driven Marketplaces')&&definition('project').intro.includes('Professor Apostolos Filippas'),'course and professor in mission');
check(stories.length===4&&tracked===null&&missionWaypoint()===null,'no compulsory objective');
for(const p of [...props,cart,...guards,...students,...storyDefinitions.map(d=>d.meet),shoeSpot,usbSpot,samSpot,homeSpot,eddiesSpot])check(!blocked(p.x,p.y),'clear object '+JSON.stringify(p));
for(const d of storyDefinitions)check(route(player,d.meet).length>0,'reachable contact '+d.id);
const coffee=buildings.find(b=>b.name==='STARBUCKS AT DEALY');
check(blocked(coffee.x+coffee.w/2,coffee.y+coffee.h/2),'cafe extension has solid walls');
const patioEntry={x:coffee.x+coffee.w/2,y:coffee.y+coffee.h+1};
check(!blocked(patioEntry.x,patioEntry.y)&&route(player,patioEntry).length>0,'cafe patio stays reachable');
check(!blocked((1042-450)/24,(820-150)/18),'Dealy perimeter path remains open');
check(buildings.every(b=>['KEATING HALL','KEATING TOWER','HUGHES HALL','CUNNIFFE HOUSE','DEALY HALL','STARBUCKS AT DEALY','FREEMAN HALL','MCSHANE CAMPUS CENTER','MCSHANE GLASS ARCADE','ROSE HILL GYMNASIUM','DUANE LIBRARY'].includes(b.name)),'central landmarks and restored McShane/gym remain');
check(!blocked(P(958,733).x,P(958,733).y),'quiet courtyard dropoff is open');
started=true;running=true;mode='freeroam';$('#overlay').style.display='none';
// Start the van encounter first, leave it, then resolve the stay-on-campus branch.
interactAt(definition('van').meet);check(dialogueOpen&&!running,'conversation pauses game');chooseDialogue(2);check(story('van').status==='available','can decline without failure');
interactAt(definition('van').meet);chooseDialogue(1);check(story('van').stage==='eddies','alternate plan');interactAt(eddiesSpot);check(story('van').outcome==='campus'&&buzz===3,'van campus resolution');
// Optional shoe search, ride, privacy choice, and the favor it unlocks.
interactAt(definition('walk').meet);chooseDialogue(1);interactAt(shoeSpot);check(story('walk').shoe&&story('walk').stage==='ride','optional shoe search');
visit(cart);useCart();interactAt(definition('walk').meet);check(story('walk').passenger,'passenger boards');
interactAt(homeSpot);check(dialogueOpen,'privacy choice');chooseDialogue(0);check(story('walk').outcome==='private'&&trust>=4&&!story('walk').passenger,'discreet ride resolution');
interactAt(definition('project').meet);check(dialogueChoices.some(c=>c.label.includes('Jules')),'earned favor unlocked');chooseDialogue(2);check(story('project').outcome==='covered','linked favor resolution');
let earnedTrust=trust;completeStory('project','covered','duplicate',20,20);check(trust===earnedTrust,'cannot farm resolution rewards');
// Independent branches: slides retrieved and presented honestly.
reset();started=true;running=true;mode='freeroam';interactAt(definition('project').meet);chooseDialogue(0);interactAt(usbSpot);check(story('project').usb,'USB collected');interactAt(definition('project').meet);chooseDialogue(0);check(story('project').outcome==='fixed'&&trust===3,'honest presentation');
// New project crew: nearest contact, optional banter/rehearsal and a callback without reward farming.
reset();started=true;running=true;mode='freeroam';
check(!blocked(nicoSpot.x,nicoSpot.y)&&route(player,nicoSpot).length>0,'Nico is reachable beside Hughes');
check(window.campusState().contacts.some(c=>c.id==='nico'),'Nico has a rendered contact');
interactAt(nicoSpot);check(dialogueOpen&&$('#dialogue-title').textContent.includes('GROUP CHAT'),'Nico opens banter rather than Maya offer');
chooseDialogue(0);check($('#dialogue-text').textContent.includes('personal brand'),'roast reply');chooseDialogue(0);
check(story('project').status==='available'&&trust===0&&buzz===0,'banter neither starts story nor farms rewards');
chooseDialogue(dialogueChoices.findIndex(c=>c.label.includes('Practice with')));chooseDialogue(1);
check(!story('project').rehearsed&&dialogueOpen,'bad practice answer permits retry');chooseDialogue(0);chooseDialogue(0);
check(story('project').rehearsed&&story('project').status==='available'&&trust===0,'rehearsal is optional and no free trust');
chooseDialogue(0);chooseDialogue(0);interactAt(usbSpot);interactAt(definition('project').meet);chooseDialogue(0);
check(story('project').outcome==='fixed'&&trust===3&&storyLog.some(t=>t.includes('practice run paid off')),'rehearsal ending callback with original rewards');
interactAt(nicoSpot);leaveConversation();check(trust===3,'resolved banter cannot duplicate rewards');
reset();started=true;running=true;mode='freeroam';check(!story('project').rehearsed,'fresh evening resets rehearsal');
check(!blocked(professorSpot.x,professorSpot.y)&&route(player,professorSpot).length,'professor is reachable at Hughes');
findProfessor();check(missionWaypoint().id==='professor','office hours are trackable without starting the project');
interactAt(professorSpot);check(window.campusState().dialogueSpeaker==='professor'&&!running,'office hours pause with the right speaker');
chooseDialogue(1);check($('#dialogue-title').textContent.includes('ONE THING AT A TIME'),'professor has a supportive optional response');
chooseDialogue(0);check(story('project').status==='available'&&trust===0,'support does not advance or farm the story');
interactAt(professorSpot);chooseDialogue(0);chooseDialogue(1);
check(!story('project').coached&&dialogueOpen,'incorrect rehearsal answer allows a retry');
chooseDialogue(0);chooseDialogue(0);chooseDialogue(0);
check(story('project').coached&&story('project').rehearsed&&trust===0,'coaching is optional and unpaid');
interactAt(definition('project').meet);chooseDialogue(1);
interactAt(professorSpot);chooseDialogue(1);chooseDialogue(0);
check(story('project').outcome==='coached'&&trust===2&&buzz===1,'the mentored presentation is a distinct ending');
interactAt(professorSpot);check($('#dialogue-title').textContent.includes('AFTER THE PRESENTATION'),'professor follows up after the ending');
leaveConversation();check(window.campusState().dialogueSpeaker===null&&trust===2,'leaving restores free roam without duplicate rewards');
reset();started=true;running=true;mode='freeroam';
// Find Sam and retain the shuttle plan, with no real schedule or countdown.
interactAt(definition('van').meet);chooseDialogue(0);interactAt(samSpot);chooseDialogue(0);interactAt(definition('van').meet);check(story('van').outcome==='shuttle','original shuttle meetup resolution');
// Gossip and improvised presentation give different consequences.
reset();running=true;started=true;mode='freeroam';acceptStory('walk','ride','test');visit(cart);useCart();interactAt(definition('walk').meet);interactAt(homeSpot);chooseDialogue(1);check(trust===-2&&buzz===3,'gossip tradeoff');
interactAt(definition('project').meet);chooseDialogue(1);interactAt(definition('project').meet);chooseDialogue(0);check(story('project').outcome==='improvised','improvised presentation');
// Read-only navigation never advances stories; security does not fail them.
reset();running=true;started=true;mode='freeroam';acceptStory('project','usb','test');const stage=story('project').stage;visit(usbSpot);missionWaypoint();window.campusState();check(story('project').stage===stage,'render and waypoint reads have no side effects');failMission('security');check(story('project').stage===stage,'security keeps optional story alive');
tracked=null;update(1);check(time===180&&missionWaypoint()===null,'untimed roaming without tracking');
$('#overlay').style.display='none';toggleJournal();check(!$('#journal').hidden&&!running,'journal pauses');toggleJournal();check($('#journal').hidden&&running,'journal resumes');
visit(cart);useCart();velocity=4;keys={};update(.5);check(Math.abs(velocity)<.5,'easy braking kept');
check(window.campusState().thirdPerson===true,'third-person default');toggleView();check(window.campusState().thirdPerson===false,'first-person toggle');toggleView();check(window.campusState().thirdPerson===true,'third-person restore');const solid=buildings.find(b=>b.name==='HUGHES HALL');check(window.campusState().cameraSolid(solid.x+solid.w/2,solid.y+solid.h/2),'camera knows Hughes walls');
render();reset();check(stories.every(s=>s.status==='available')&&trust===0&&buzz===0,'fresh evening resets stories');
`,sandbox);console.log('PASS: Nico interaction, project banter/rehearsal/callback, optional/no-order encounters, decline, both Ram Van endings, shoe/ride/privacy/gossip, earned favor, honest/improvised presentation, no duplicate rewards, pure waypoint reads, security continuity, free roam, journal, easy driving, view toggle, camera collision contract, reset');
