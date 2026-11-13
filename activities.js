'use strict';
// Replayable jobs share the existing world, controls, score and story outcomes.
(() => {
 const jobs=[
  {id:'supercar',title:'DAD’S LAMBO',from:'DEV · RAM VAN CREW',seconds:150,reward:1100,cash:110,
   description:'Take the lime supercar near McShane with F, shake campus security, then stop at Freeman Walk and press E. $110 on delivery.'},
  {id:'receipts',title:'REPLY ALL',from:'BEA · STUDENT DJ',seconds:125,reward:750,cash:60,
   description:'Meet Bea at Duane Library. Turn a leaked donor email into an afterparty bit at Eddie’s. You pick who takes the joke.'},
  {id:'coffee',title:'LAST CALL',from:'BEA · STUDENT DJ',reward:550,description:'Pick up coffee outside Dealy, then help the group project or take the Hughes mixer rush order. Keep the tray level. Walk or take the cart.'},
  {id:'rally',title:'RAM RALLY',from:'BEA · PRE-GAME CREW',seconds:150,reward:950,description:'Start the hype at McShane, take it to the gym steps, then bring the crowd’s energy to Eddie’s. E at each gold marker, on foot. No chase required.'},
  {id:'party',title:'EDDIE’S AFTERPARTY',from:'BEA · STUDENT DJ',seconds:80,reward:650,description:'Turn on all three marked speakers before the party fizzles. Security will hear it too. E at each speaker.'},
  {id:'cart',title:'RAM RUN',from:'DEV · RAM VAN CREW',seconds:85,reward:800,description:'Borrow the cart and drive through four checkpoints around Eddie’s. Hold Shift for a short rechargeable boost.'},
  {id:'escape',title:'AFTER HOURS',from:'JULES · ONE LAST FAVOR',seconds:100,reward:900,description:'Get the afterparty flyer from the Keating steps, bring it to Eddie’s, then shake the security patrol. Walk or use the cart.'}
 ];
 let active=null,result=null,boost=100,boostLocked=false,sound=true,menu=false,lastPursuing=false,reaction=null,records={};
 try {const saved=JSON.parse(localStorage.getItem('roseHillJobs')||'{}');if(saved&&typeof saved==='object')records=saved;}catch{}
 const distance=p=>Math.hypot(p.x-player.x,p.y-player.y),job=id=>jobs.find(j=>j.id===id);
 const supercarDrop=at(1133,802,'SUPERCAR DROP-OFF · FREEMAN WALK');
 const gates=[at(1042,665,'WEST WALK'),at(1199,650,'KEATING TURN'),at(1207,785,'SOUTH CORNER'),at(1043,795,'FINISH AT DEALY')];
 const rallyStops=[at(1118,512,'PRE-GAME · MCSHANE ENTRY'),at(1190,540,'HYPE THE STEPS · ROSE HILL GYM'),at(1130,722,'BRING IT HOME · EDDIE’S')];
 const {pickup:receiptsPickup,stage:receiptsStage}=replyAllSites;
 const receiptsCuts={
  anonymous:{label:'Redact the names. Roast the bullshit.',trust:2,buzz:1,
   ending:'You read the pitch without the names. The line about “leveraging intimacy” still kills. The work-study kid keeps their job.'},
  uncut:{label:'Read it uncut. Put the donor’s kid on blast.',trust:0,buzz:3,
   ending:'The crowd loses it when you read the dating spreadsheet. Preston leaves early. His reply-all arrives before the applause ends.'}
 };
 const coffeeStand=at(1128,744,'LAST CALL · EDDIE’S');
 const coffeePickup=at(1036,784,'COFFEE PICKUP · DEALY');
 const deliveries={
  crew:{stop:at(1097,686,'MAYA · EDDIE’S'),seconds:44,chill:56,cash:35,trust:2,buzz:0,
   dispatch:'You’re saving this presentation. Avoid jumps, hard hits and long boosts with the tray.',
   ending:'Maya has coffee. Nico has been asked to stop saying “synergy.”'},
  rush:{stop:at(1047,713,'ALUMNI MIXER · HUGHES'),seconds:19,chill:28,cash:85,trust:0,buzz:2,
   dispatch:'The alumni are crashing. Take the coffee to the mixer. Preferably inside the cups.',
   ending:'The mixer lives. Elliot just described a latte as seed capital.'}
 };
 const flyer=at(1220,714,'AFTERPARTY FLYER · KEATING STEPS'),drop=at(1130,722,'DROP THE FLYER · EDDIE’S');
 function cue(notes=[440,660],duration=.1){if(sound)window.campusAudio?.cue(notes,duration);}

 function say(text){const n=students.filter(n=>distance(n)<10).sort((a,b)=>distance(a)-distance(b))[0];reaction={text,until:elapsed+3.5,x:n?.x??player.x,y:n?.y??player.y};$('#crowd-reaction').textContent='CAMPUS / '+text;}
 function bonus(id){return id==='cart'&&story('van').status==='resolved'?12:id==='party'&&story('project').outcome==='fixed'?15:id==='escape'&&story('walk').outcome==='private'?15:0;}
 function renderMenu(){const list=$('#activity-list');list.replaceChildren();for(const j of jobs){const row=document.createElement('div'),title=document.createElement('b'),text=document.createElement('p'),button=document.createElement('button');title.textContent=j.title+' · '+j.from;text.textContent=j.description+' Reward: '+j.reward+' chaos. '+(bonus(j.id)?'Your story favor adds '+bonus(j.id)+' seconds. ':'')+(j.id==='coffee'?Object.keys(deliveries).filter(key=>records['coffee-'+key]>0).map(key=>(key==='crew'?'Crew':'Rush')+' best: '+records['coffee-'+key].toFixed(1)+'s.').join(' '):j.id==='receipts'?Object.keys(receiptsCuts).filter(cut=>records['receipts-'+cut]>0).map(cut=>(cut==='anonymous'?'Redacted':'Uncut')+' best: '+records['receipts-'+cut].toFixed(1)+'s.').join(' '):records[j.id]?'Best: '+records[j.id].toFixed(1)+'s.':'');button.textContent=active?'FINISH OR CANCEL YOUR CURRENT JOB':['coffee','receipts'].includes(j.id)?'TAKE THE CALL':'START · '+(j.seconds+bonus(j.id))+' SECONDS';button.disabled=!!active;button.onclick=()=>start(j.id);row.appendChild(title);row.appendChild(text);row.appendChild(button);list.appendChild(row);}if(active){const cancel=document.createElement('button');cancel.textContent='CANCEL CURRENT JOB · KEEP ROAMING';cancel.onclick=()=>{finish(false,'Job canceled. No penalty.');toggle();};list.appendChild(cancel);}}
 function toggle(){if(!started||dialogueOpen||window.lifeAPI?.menuOpen()||(!menu&&!running))return;menu=!menu;$('#activity-panel').hidden=!menu;keys={};if(menu){running=false;renderMenu();document.exitPointerLock?.();}else{running=true;captureMouse();}}
 function start(id){if(active||!job(id))return false;const def=job(id);active={id,started:elapsed,deadline:id==='coffee'||id==='receipts'?Infinity:elapsed+def.seconds+bonus(id),index:0,hit:new Set(),stage:['coffee','supercar','receipts'].includes(id)?'pickup':id==='escape'?'flyer':id==='rally'?'hype':'run',hadPursuit:false};result=null;menu=false;$('#activity-panel').hidden=true;running=true;keys={};if(id==='party')for(const p of props.filter(p=>p.partyStation!==undefined))p.ready=0;toast(def.title+' · JOB STARTED');showDispatch(def.from,id==='supercar'?'Preston keeps calling it “dad’s spare.” Take the lime supercar, lose the patrol, and bring it to Freeman Walk.':id==='receipts'?'A donor’s kid attached his dating spreadsheet to the mixer invite. Meet me outside Duane. We can make something out of this.':id==='coffee'?'Coffee is waiting outside Dealy. Bring it to Maya or take the rush money at Hughes. Clock starts when you pick a customer.':id==='rally'?'McShane, gym steps, Eddie’s. Three stops. E to hype the crowd. This is not a LinkedIn networking event.':id==='party'?'Three speakers. One quad. Let’s make some damn noise.':id==='cart'?'The cart is yours. Four gates, one lap. Try not to embarrass us.':'Grab the flyer on the Keating steps. Bring it to Eddie’s. If security follows, lose them.');cue();if(id==='supercar'&&inSupercar())onSupercarEntered(false);renderCard();captureMouse();return true;}
 function finish(success,message){if(!active)return;const a=active,def=job(a.id),duration=elapsed-a.started,delivery=deliveries[a.customer],cut=receiptsCuts[a.cut],recordKey=delivery?'coffee-'+a.customer:cut?'receipts-'+a.cut:a.id;active=null;let record=false;if(success){gameFeedback('success');score+=def.reward;buzz+=delivery?.buzz??cut?.buzz??2;trust+=delivery?.trust??cut?.trust??0;const cash=delivery?Math.round(delivery.cash*(.5+.5*a.tray/100)):(def.cash??Math.round(def.reward/20));window.lifeAPI?.earn(cash,def.title+' / JOB PAID');if(!records[recordKey]||duration<records[recordKey]){records[recordKey]=duration;record=true;try{localStorage.setItem('roseHillJobs',JSON.stringify(records));}catch{}}cue([523,659,784],.12);}else cue([330,220],.12);result={success,title:success?'JOB COMPLETE · +'+def.reward:'TRY AGAIN WHEN YOU WANT',text:message+(success?' · '+duration.toFixed(1)+'s'+(record?' · NEW PERSONAL BEST':''):''),until:elapsed+8};toast(result.title);showDispatch(def.from,message);renderCard();}
 function waypoint(){if(!active)return null;
 if(active.id==='supercar'){
  if(active.stage==='pickup')return {...supercar,label:'LIME SUPERCAR · MCSHANE',kind:'activity',text:'Take the supercar [F]'};
  if(active.stage==='shake')return {...supercar,label:'LOSE CAMPUS SECURITY',kind:'hide',text:'Break line of sight until the stars clear'};
  return {...supercarDrop,kind:'activity',range:1.15,text:'Stop in the supercar and hand it off [E]'};
 }
 if(active.id==='receipts'){
  return active.stage==='pickup'
   ?{...receiptsPickup,kind:'activity',text:'Talk to Bea outside Duane [E]'}
   :{...receiptsStage,kind:'activity',text:'Read your cut on the Eddie’s open mic [E]'};
 }
 if(active.id==='coffee'){
  if(active.stage==='pickup')return {...coffeePickup,kind:'activity',text:'Collect the coffee order [E]'};
  return {...deliveries[active.customer].stop,kind:'activity',text:'Hand off the coffee [E]'};
 }if(active.id==='party'){const p=props.filter(p=>p.partyStation!==undefined&&!active.hit.has(p.partyStation)).sort((a,b)=>distance(a)-distance(b))[0];return p?{...p,label:'AFTERPARTY · SPEAKER '+(active.hit.size+1)+'/3',kind:'activity',text:'Turn on this speaker [E]'}:null;}if(active.id==='cart'){if(!inCart())return {...cart,label:'RAM RUN · CAMPUS CART',kind:'activity',text:'Borrow the cart [F]'};return {...gates[active.index],label:'RAM RUN · CHECKPOINT '+(active.index+1)+'/4',kind:'gate',text:'Drive through the gold ring'};}if(active.id==='rally')return {...rallyStops[active.index],kind:'activity',text:'Hype the crowd on foot [E]'};if(active.stage==='flyer')return {...flyer,kind:'activity',label:flyer.label,text:'Collect the afterparty flyer [E]'};if(active.stage==='drop')return {...drop,kind:'activity',text:'Bring the flyer to Eddie’s'};return {...drop,label:'LOSE THE PATROL',kind:'hide',text:'Break line of sight, then keep moving until the stars clear'};}
 function renderCard(){$('#job-stamp').hidden=!(result?.success&&elapsed<result.until-4);const card=$('#activity-card');if(active){const def=job(active.id),left=Math.max(0,Math.ceil(active.deadline-elapsed)),progress=active.id==='supercar'?({pickup:'GET THE SUPERCAR',shake:'LOSE THE PATROL',park:'DROP OFF AT FREEMAN'}[active.stage]):active.id==='coffee'?(active.customer?'TRAY · '+Math.ceil(active.tray)+'%':'COFFEE PICKUP · CLOCK STARTS THERE'):active.id==='receipts'?(active.cut?'TAKE YOUR CUT TO EDDIE’S':'MEET BEA · CLOCK STARTS AT DUANE'):active.id==='rally'?active.index+'/3 HYPE STOPS':active.id==='party'?active.hit.size+'/3 SPEAKERS':active.id==='cart'?active.index+'/4 CHECKPOINTS':active.stage==='flyer'?'GET THE FLYER':active.stage==='drop'?'BRING IT TO EDDIE’S':'LOSE THE PATROL';card.hidden=false;$('#activity-title').textContent=def.title;$('#activity-time').textContent=Number.isFinite(left)?left+'s':'';$('#activity-progress').textContent=progress;$('#activity-detail').textContent=controlHint(waypoint()?.text||'');card.className=left<=15?'urgent':'';}else if(result&&elapsed<result.until){card.hidden=false;$('#activity-title').textContent=result.title;$('#activity-time').textContent='';$('#activity-progress').textContent=result.text;$('#activity-detail').textContent=hasTouchControls()?'Open Jobs to play again':'J · another job, or keep roaming';card.className='complete';}else card.hidden=true;$('#boost-meter').hidden=!driving;$('#boost-fill').style.width=boost+'%';$('#boost-label').textContent=boosting()?'BOOSTING':hasTouchControls()?'BOOST':'SHIFT · BOOST';}
 function onAward(p){if(!active||active.id!=='party'||p.partyStation===undefined||active.hit.has(p.partyStation))return;active.hit.add(p.partyStation);say(['That’s loud as hell. Keep it going!','Someone’s definitely calling security.','Now THAT is a party.'][active.hit.size-1]);cue([523,784]);if(active.hit.size===3)finish(true,'The speakers are up. Eddie’s has a pulse again.');renderCard();}
 function launchPatrol(level=52){let guardIndex=0;for(let i=0;i<12&&guardIndex<Math.min(2,guards.length);i++){const a=i*Math.PI/6,p={x:player.x+Math.cos(a)*3.6,y:player.y+Math.sin(a)*3.6};if(blocked(p.x,p.y,.2)||!lineClear(p,player))continue;const g=guards[guardIndex++];Object.assign(g,p,{last:{x:player.x,y:player.y},search:7,repath:0,path:[]});}heat=Math.max(heat,level);unseen=0;invulnerable=Math.max(invulnerable,4);}
 function onSupercarEntered(firstTake){
  const pickup=active?.id==='supercar'&&active.stage==='pickup';
  if(!firstTake&&!pickup)return;
  supercarAlert=true;gameFeedback('warning');launchPatrol(41);
  cue([740,440,740],.09);
  if(pickup){
   active.stage='shake';
   showDispatch('DEV','Security saw the car. Break line of sight until the stars clear. Then head to Freeman Walk.');
   renderCard();
  }else say('PRESTON: That is not what my dad meant by campus parking.');
 }
 function nearCoffeeStand(){
  return !active&&!tracked&&!trackedLandmark&&!driving&&distance(coffeeStand)<.85&&lineClear(player,coffeeStand);
 }
 function spill(amount){
  if(active?.id!=='coffee'||active.stage!=='delivery')return;
  active.tray=Math.max(0,active.tray-amount);
  if(active.tray===0)finish(false,'That coffee is now part of the landscaping. Try another run with J.');
  else if(amount>=20)toast('COFFEE SPILLED · TRAY '+Math.ceil(active.tray)+'%');
 }
 function chooseCustomer(customer){
  if(active?.id!=='coffee'||active.stage!=='pickup')return;
  const delivery=deliveries[customer];
  Object.assign(active,{customer,stage:'delivery',tray:100,started:elapsed,deadline:elapsed+(easy()?delivery.chill:delivery.seconds)});
  showDispatch(definition(customer==='crew'?'project':'takeover').name,delivery.dispatch);
  cue([440,554,659]);
  renderCard();
 }
 function coffeeInteraction(){
  const stop=waypoint();
  if(distance(stop)>=interactionRange()||!lineClear(player,stop))return false;
  if(driving&&Math.abs(velocity)>.45){toast('Slow the cart before handling the coffee.');return true;}
  if(active.stage==='delivery'){
   if(elapsed>=active.deadline){finish(false,'The coffee went cold. Take another run with J.');return true;}
   finish(true,deliveries[active.customer].ending);return true;
  }
  showChoices('LAST CALL / TWO ORDERS','BARISTA: The project crew needs caffeine. The alumni mixer just offered a rush tip. One tray left.\n\nWalk or drive. Jumps, crashes and sustained cart boost spill coffee. The clock starts when you choose.',[
   {label:'Help Maya’s project crew · $35 and trust',action:()=>chooseCustomer('crew')},
   {label:'Take the Hughes mixer rush order · $85 and buzz',action:()=>chooseCustomer('rush')},
   {label:'Pick a customer later',action:()=>{}}
  ]);
  return true;
 }
 function receiptsInteraction(){
  const stop=waypoint();
  if(distance(stop)>=interactionRange()||!lineClear(player,stop))return false;
  if(driving){toast('Park and step out to use the mic or talk to Bea.');return true;}
  if(active.stage==='perform'){
   if(elapsed>=active.deadline){finish(false,'The mic is closed. Try again with J.');return true;}
   const cut=receiptsCuts[active.cut];
   window.socialAPI?.celebrate();
   finish(true,cut.ending);
   return true;
  }
  const choices=Object.entries(receiptsCuts).map(([id,cut])=>({
   label:cut.label,
   action:()=>{
    Object.assign(active,{cut:id,stage:'perform',started:elapsed,deadline:elapsed+job('receipts').seconds});
    showDispatch('BEA',id==='anonymous'?'Roast the language. Spare the work-study kid who forwarded it.':'The crowd wants names? Fine. Meet me at the Eddie’s mic before I lose my nerve.');
    cue([440,554,659]);
    renderCard();
   }
  }));
  choices.push({label:'Come back later',action:()=>{}});
  showChoices('REPLY ALL','BEA: Preston sent his “private networking” spreadsheet to the entire mixer. It has a tab called GIRLS Q4. There’s a fucking pivot table.\n\nWe have an open mic on Eddie’s. Do I black out the names or let him eat his own press release?',choices);
  return true;
 }
 function interact(){
  if(active?.id==='supercar'&&active.stage==='park'&&distance(supercarDrop)<1.15&&lineClear(player,supercarDrop)){
   if(elapsed>=active.deadline){finish(false,'The drop-off window closed. Try again with J.');return true;}
   if(!inSupercar()||Math.abs(velocity)>.45){toast('Bring the supercar to a stop at the marker.');return true;}
   if(wanted()>0){toast('Lose the new patrol before handing off the car.');return true;}
   finish(true,'Preston is calling it an “unauthorized test drive.” Dev is calling it $110.');
   return true;
  }
  if(nearCoffeeStand())return start('coffee');
  if(active?.id==='coffee')return coffeeInteraction();
  if(active?.id==='receipts')return receiptsInteraction();
  if(active?.id==='rally'&&distance(rallyStops[active.index])<interactionRange()&&lineClear(player,rallyStops[active.index])){if(driving){toast('Hop out of the cart first. E to hype the crowd.');return true;}window.socialAPI?.celebrate();active.index++;say(['McShane has entered the chat. Next stop: the gym steps.','Gym crew is in. Bring this ridiculous energy to Eddie’s.','You have successfully majored in making an entrance.'][active.index-1]);cue([440,554,659]);if(active.index===rallyStops.length)finish(true,'Three stops. One deeply unnecessary campus tour. The rally is on.');else toast('HYPE STOP '+active.index+'/3');renderCard();return true;}if(!active||active.id!=='escape'||active.stage!=='flyer'||distance(flyer)>interactionRange()||!lineClear(player,flyer))return false;active.stage='drop';launchPatrol();showDispatch('JULES','Flyer secured. Get back to Eddie’s. Security wants a word—probably a boring one.');cue([330,440]);return true;}
 function update(dt,status){if(boosting())spill(dt*16);if(status.pursuing&&!lastPursuing)say('SECURITY: Hey! Stop right there!');if(active){if(status.pursuing)active.hadPursuit=true;if(active.id==='cart'&&inCart()&&Math.abs(velocity)>.15&&distance(gates[active.index])<(easy()?.65:.55)){active.index++;cue([440,660,880],.07);if(active.index===gates.length)finish(true,'Dev’s crew finally has a driver worth calling.');else toast('CHECKPOINT '+active.index+'/4');}if(active?.id==='supercar'&&active.stage==='shake'&&status.wanted===0){active.stage='park';showDispatch('DEV','All clear. Bring the car to Freeman Walk, stop at the marker, and press E.');cue([440,660]);}if(active?.id==='escape'){if(active.stage==='drop'&&distance(drop)<1.4){active.stage='hide';showDispatch('JULES','Delivered. Now shake the patrol. Duck behind a building and keep your distance.');}if(active.stage!=='flyer'&&!active.hadPursuit)heat=Math.max(heat,35);if(active.stage==='hide'&&active.hadPursuit&&status.wanted===0)finish(true,'The flyer made it. You didn’t stick around for the lecture.');}if(active&&elapsed>=active.deadline)finish(false,'Time ran out. Your stories are fine. Try again whenever you want.');}if(!(keys.ShiftLeft||keys.ShiftRight))boostLocked=false;if(boosting()){boost=Math.max(0,boost-dt*20);if(boost<=5)boostLocked=true;}else boost=Math.min(100,boost+dt*9);if(reaction&&elapsed>reaction.until){reaction=null;$('#crowd-reaction').textContent='';}lastPursuing=status.pursuing;renderCard();}
 function boosting(){return driving&&running&&!!(keys.ShiftLeft||keys.ShiftRight)&&!boostLocked&&boost>5;}
 function reset(){active=null;result=null;boost=100;boostLocked=false;menu=false;reaction=null;lastPursuing=false;$('#activity-panel').hidden=true;$('#activity-card').hidden=true;$('#job-stamp').hidden=true;$('#boost-meter').hidden=true;$('#crowd-reaction').textContent='';}
 function view(){return {coffeeStand:!active?coffeeStand:null,carryingCoffee:active?.stage==='delivery',id:active?.id||null,title:active?job(active.id).title:null,stage:active?.stage||null,gate:active?.id==='cart'&&inCart()?gates[active.index]:null,boosting:boosting(),boost,reaction};}
 function onHorn(){cue([180,220],.12);say(inSupercar()?'Congratulations, everybody heard your trust fund.':'Dude, that’s a damn golf cart!');}
 function toggleSound(){sound=!sound;window.campusAudio?.setEffects(sound);toast('SOUND EFFECTS '+(sound?'ON':'OFF')+(hasTouchControls()?'':' · M'));}
 window.activityAPI={start,toggle,onSupercarEntered,nearCoffeeStand,spill,menuOpen:()=>menu,waypoint,update,onAward,interact,boosting,view,reset,onHorn,toggleSound,react:say,effect:kind=>cue(kind==='hit'?[90,60]:kind==='block'?[140,180]:[220],.045),busted:()=>{if(active)finish(false,'Security broke up the run. Try again—your story progress is safe.');}};
 $('#activity-toggle').onclick=toggle;$('#activity-close').onclick=toggle;reset();
})();
