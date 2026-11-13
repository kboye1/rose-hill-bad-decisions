'use strict';
// Campus simulation and optional stories; procedural Three.js graphics live in world3d.js.
const canvas=document.querySelector('#game'),ctx=document.createElement('canvas').getContext('2d');
const mapCanvas=document.querySelector('#map'),mc=mapCanvas.getContext('2d');
const $=s=>document.querySelector(s),TAU=Math.PI*2,WORLD_SCALE=8;
// Coordinates traced approximately from Fordham's official campus map (see README).
// Map orientation follows that illustrated plan; distances are compressed for play.
const P=(x,y)=>({x:(x-450)/24,y:(y-150)/18});
const B=(name,x,y,w,h,height=6,color='#a97961')=>({...P(x,y),name,w:w/24,h:h/18,height,color});
// Edwards Parade stays central. The southwest boundary now reaches Duane Library.
const MAP_BOUNDS={minX:P(778,330).x,minY:P(778,330).y,maxX:P(1375,975).x,maxY:P(1375,975).y};
const buildings=[
 B('MCSHANE CAMPUS CENTER',1017,384,155,103,11.9,'#b2a995'),
 B('MCSHANE GLASS ARCADE',1090,354,24,30,7.2,'#809b9d'),
 B('ROSE HILL GYMNASIUM',1157,450,65,70,7,'#a28f78'),
 B('KEATING HALL',1239,667,110,110,8,'#b8977b'),
 B('KEATING TOWER',1279,692,30,35,15,'#c3a88a'),
 B('HUGHES HALL',954,612,82,36,9,'#b29c83'),
 B('CUNNIFFE HOUSE',872,631,30,116,5.4,'#ad9f8e'),
 B('DEALY HALL',924,742,85,62,14.4),
 B('STARBUCKS AT DEALY',1008,770,15,31,3),
 B('FREEMAN HALL',1075,829,119,31,9,'#a8a99b'),
 B('DUANE LIBRARY',815,863,68,68,10.8,'#918d80')
];
const fields=[{name:'EDWARDS PARADE',...P(1063,620),w:141/24,h:175/18,color:'#59794b'}];
const roads=[
 [1042,530,1042,865,2.1],[1042,560,1211,560,1.7],[1211,560,1211,646,1.5],[1095,487,1095,560,1.2],[1190,520,1190,560,1.2],[1042,605,1211,646,1.5],[1211,646,1211,806,1.5],
 [1042,806,1211,806,1.5],[1042,865,1211,865,1.3],[1211,806,1211,865,1.3],
 [905,727,1042,727,1.3],[905,658,1042,658,1.1],[915,658,915,733,1.1],
 [1211,722,1239,722,.7],[995,658,995,675,.8],[1135,806,1135,829,.8],
 [905,754,905,865,1.1],[905,865,1042,865,1.1],[905,754,1042,754,1.1],
 [905,865,917,896,1.1],[883,896,917,896,1.02],[917,896,1042,865,1.08],
 [917,896,955,952,1.05],[955,952,1042,952,1.08],[1042,865,1042,952,1.2],
 [905,865,823,838,.86],[823,838,798,883,.78],[798,883,798,942,.76],
 [798,942,862,950,.76],[862,950,955,952,.84]
].map(([ax,ay,bx,by,w])=>({a:P(ax,ay),b:P(bx,by),w:w*.5}));
const landmarks=[{id:'ram',...P(1018,692),name:'THE FORDHAM RAM'},{id:'fountain',...P(978,705),name:'CUNNIFFE FOUNTAIN'},{id:'terrace',...P(1220,722),name:'TERRACE OF THE PRESIDENTS'},{id:'mcshane',...P(1118,512),name:'MCSHANE CAMPUS CENTER'},{id:'gym',...P(1190,540),name:'ROSE HILL GYMNASIUM'},
 {id:'duane',...P(899,896),name:'DUANE LIBRARY',
  description:'Duane Library opened in 1926. The renovation brought its Gothic entrance down to ground level and added glass-and-zinc stair towers. The group chat, meanwhile, remains inaccessible to anyone with good judgment.'}
];
function segmentDistance(x,y,a,b){let dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a.x-t*dx,y-a.y-t*dy)}
// Only the fallback renderer needs this grid. The WebGL path never constructs it.
let terrain;
function fallbackTerrain(){
 if(terrain)return terrain;
 terrain=new Uint8Array(600*550);
 for(const [index,field] of fields.entries()){
  for(let y=Math.floor(field.y*10)+1;y<field.y*10+field.h*10;y++){
   for(let x=Math.floor(field.x*10)+1;x<field.x*10+field.w*10;x++)terrain[y*600+x]=index+2;
  }
 }
 for(const road of roads){
  const radius=road.w/2;
  const minX=Math.max(0,Math.floor((Math.min(road.a.x,road.b.x)-radius)*10));
  const maxX=Math.min(599,Math.ceil((Math.max(road.a.x,road.b.x)+radius)*10));
  const minY=Math.max(0,Math.floor((Math.min(road.a.y,road.b.y)-radius)*10));
  const maxY=Math.min(549,Math.ceil((Math.max(road.a.y,road.b.y)+radius)*10));
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
   if(segmentDistance(x/10,y/10,road.a,road.b)<radius)terrain[y*600+x]=1;
  }
 }
 return terrain;
}
const groundColors=['#52684b','#af9d83',...fields.map(f=>f.color)];
const trees=[[1062,640],[1062,680],[1062,778],[1100,807],[1155,807],[1204,775],[1204,680],[1204,640],[941,688],[933,732],[1018,732],[1083,820],[1186,820],[920,606],[1320,602],[1355,815],[872,841],[889,850],[903,932],[814,944],[962,934],[976,882],[853,965]].map(([x,y])=>({...P(x,y),type:'tree'}));
for(let x=850;x<=1360;x+=38)for(const y of [335,964])trees.push({...P(x,y),type:'tree'});
let mapRouteKey='',mapRoute=[];
let W,H,depth=[],keys={},running=false,started=false,finished=false;
let player={x:24,y:22,a:-Math.PI/2},score=0,heat=0,time=180,combo=0,lastHit=-99,elapsed=0,toastUntil=0,throwFlash=0,cooldown=0,invulnerable=0;
let cupShots=[];
let props=[],guards=[],particles=[],students=[],cart={x:0,y:0},supercar,supercarAlert=false,vehicleId='cart',driving=false,velocity=0,mode="challenge",jump=0,jumpV=0,unseen=0,previousWanted=0,mission=0,missionHits=0,escapeCount=0,hornCooldown=0;
let cameraDistance=4.8,thirdPerson=true;function toggleView(){thirdPerson=!thirdPerson;toast(thirdPerson?'THIRD PERSON · V TO SWITCH':'FIRST PERSON · V TO SWITCH');}
let difficulty='easy',checkpoint=null,helpVisible=false;
const easy=()=>difficulty==='easy';
const interactionRange=()=>easy()?1.9:1.15;
const hasTouchControls=()=>window.touchControls?.enabled??false;
function controlHint(text){
 return hasTouchControls()?text.replace(/\s*\[([EF])\]\s*/g,(_,key)=>' · '+(key==='E'?'Use':'Vehicle')+' ' ).trim():text;
}
function gameFeedback(kind){
 window.webkit?.messageHandlers?.gameFeedback?.postMessage(kind);
}
function toggleRadio(){
 if(window.campusAudio)toast('CAMPUS RADIO '+(window.campusAudio.toggleRadio()?'ON':'OFF')+(hasTouchControls()?'':' · N'));
}
function captureMouse(){
 if(!hasTouchControls()&&document.pointerLockElement!==canvas){
  canvas.requestPointerLock?.()?.catch?.(()=>{});
 }
}
function toggleHelp(){helpVisible=!helpVisible;$('#help-panel').hidden=!helpVisible;$('#help-toggle').textContent=helpVisible?'HIDE CONTROLS [C]':'CONTROLS [C]';document.body.classList.toggle('controls-open',helpVisible);}
let missionStage=0,missionActive=false,missionFailed=false,missionRemaining=0,missionTouched=new Set(),missionMessageUntil=0;
const at=(x,y,label,extra={})=>({...P(x,y),label,...extra});
const replyAllSites={
 pickup:at(900,903,'BEA · DUANE LIBRARY WALK'),
 stage:at(1107,722,'OPEN MIC · EDWARDS PARADE')
};
const storyDefinitions=[
 {id:'walk',title:'THE WALK OF SHAME',name:'JULES',meet:at(1208,809,'JULES · FREEMAN WALK'),intro:'I made it as far as Freeman in somebody else’s rugby shirt, holding one shoe. Last night’s “private due-diligence meeting” ran over. My Hughes group thinks I’m “reviewing the slides.” Can you get me home without turning this into campus news?'},
 {id:'project',title:'THE PRESENTATION AFTER THE PARTY',name:'MAYA',meet:at(947,671,'MAYA · HUGHES'),intro:'MAYA: Our AI and Data-Driven Marketplaces presentation for Professor Apostolos Filippas is a shitshow. The real slides are on a USB by Starbucks. Nico uploaded his dating-app screenshots instead.\n\nNICO: It is called primary research.\n\nMAYA: One slide just says “u up?” There are no axes. No analysis. Just audacity.'},
 {id:'takeover',title:'THE HOSTILE TAKEOVER',name:'ELLIOT',meet:at(1040,685,'ELLIOT · HUGHES MIXER'),intro:'A startup, a stolen pitch deck and an alumni mixer with spectacularly bad incentives.'},
 {id:'van',title:'THE RAM VAN MEETUP',name:'DEV',meet:at(1042,818,'DEV · DEALY MEETUP'),intro:'The group wants a downtown afterparty that Preston insists is an alumni networking event. His blazer is doing PR for a catastrophic hangover. Sam is still by Hughes. Get the crew together, or convince these horny little consultants to stay on Eddie’s.'}
];
const rivalSpot=at(1128,545,'BLAINE · MCSHANE PRE-GAME');
const supercarSpawn={...P(1092,553),a:.09,type:'supercar',reported:false};
const professorSpot=at(1000,671,'PROFESSOR FILIPPAS · HUGHES TERRACE');
const professorContact={id:'professor',name:'PROFESSOR FILIPPAS',p:professorSpot};
const destinations=[...landmarks,{...professorSpot,id:'professor',name:professorContact.name,range:1.15,text:'Talk to Professor Filippas [E]'}];
const shoeSpot=at(1028,719,'MISSING SHOE · RAM STATUE WALK'),usbSpot=at(1030,782,'AI & MARKETPLACES SLIDES · STARBUCKS'),samSpot=at(1050,647,'SAM · HUGHES CORNER'),homeSpot=at(958,733,'DISCREET DROP-OFF · CUNNIFFE COURT'),eddiesSpot=at(1130,722,'MEET THE GROUP · EDWARDS PARADE');
let stories=[],tracked=null,trackedLandmark=null,trust=0,buzz=0,storyLog=[],dialogueOpen=false,dialogueChoices=[],dialogueSpeaker=null;
function resetStories(){stories=storyDefinitions.map(d=>({id:d.id,stage:'offer',status:'available',outcome:null,shoe:false,passenger:false,rehearsed:false,coached:false}));tracked=null;trackedLandmark=null;trust=0;buzz=0;storyLog=[];dialogueOpen=false;dialogueChoices=[];dialogueSpeaker=null;document.body.classList.toggle('professor-scene',false);$('#dialogue').hidden=true;$('#journal').hidden=true;}
const story=(id)=>stories.find(s=>s.id===id),definition=id=>storyDefinitions.find(s=>s.id===id);
function showDispatch(who,message){$('#dispatch').textContent=who+' / '+message;missionMessageUntil=elapsed+12;$('#dispatch').style.display='block';}
function showChoices(title,text,choices,speaker=null){dialogueOpen=true;dialogueSpeaker=speaker;document.body.classList.toggle('professor-scene',speaker==='professor');$('#dialogue').className=speaker==='professor'?'story-panel professor-dialogue':'story-panel';dialogueChoices=choices;running=false;keys={};document.exitPointerLock?.();$('#dialogue-title').textContent=title;$('#dialogue-text').textContent=text;$('#dialogue-choices').replaceChildren();choices.forEach((choice,i)=>{const button=document.createElement('button');button.textContent=(i+1)+' · '+choice.label;button.onclick=()=>chooseDialogue(i);$('#dialogue-choices').appendChild(button);});$('#dialogue').hidden=false;}
function chooseDialogue(i){const choice=dialogueChoices[i];if(!dialogueOpen||!choice)return;dialogueOpen=false;dialogueSpeaker=null;document.body.classList.toggle('professor-scene',false);$('#dialogue').hidden=true;running=true;keys={};choice.action();if(!dialogueOpen)captureMouse();}
function leaveConversation(){dialogueOpen=false;dialogueSpeaker=null;document.body.classList.toggle('professor-scene',false);$('#dialogue').hidden=true;running=true;keys={};captureMouse();}
function rememberCheckpoint(){} // Optional encounters have no fail/restart loop.
function missionConesActive(){return false;}
function objectiveFor(id){const s=story(id),d=definition(id);if(!s||s.status==='resolved')return null;
 if(s.stage==='offer')return {...d.meet,text:'Talk to '+d.name+' [E]'};
 if(s.stage==='rival')return {...(students.find(n=>n.id==='blaine')||rivalSpot),label:rivalSpot.label,text:'Talk to Blaine [E], or scuffle [X / Z]'};
 if(s.stage==='return')return {...d.meet,text:'Return the deck to Elliot at Hughes [E]'};
 if(s.stage==='shoe')return {...shoeSpot,kind:'pickup',text:'Find the shoe on the ram statue walk [E]'};
 if(s.stage==='ride')return !inCart()?{...cart,label:'CAMPUS CART',text:'Borrow the cart [F], then collect Jules at Freeman'}:{...d.meet,text:'Collect Jules with the cart [E]'};
 if(s.stage==='home')return {...homeSpot,text:'Bring Jules to the quiet courtyard, stop, and talk [E]'};
 if(s.stage==='usb')return {...usbSpot,kind:'pickup',text:'Collect the AI and Data-Driven Marketplaces slides by Starbucks [E]'};
 if(s.stage==='present')return {...d.meet,text:'Return to Maya at Hughes for Professor Filippas’ presentation [E]'};
 if(s.stage==='sam')return {...samSpot,text:'Talk to Sam by Hughes [E]'};
 if(s.stage==='stop')return {...d.meet,text:'Regroup with Dev at the Ram Van pickup [E]'};
 if(s.stage==='eddies')return {...eddiesSpot,text:'Meet the group on Edwards Parade [E]'};
 return null;}
function missionWaypoint(){
 const destination=destinations.find(p=>p.id===trackedLandmark);
 return window.activityAPI?.waypoint()
  ||(destination?{...destination,label:destination.label||destination.name,range:destination.range??.8,text:destination.text||'Read the landmark plaque [E]'}:tracked?objectiveFor(tracked):null)
  ||window.lifeAPI?.waypoint()||null;
}
function findProfessor(){
 tracked=null;trackedLandmark='professor';renderJournal();
 showDispatch('HUGHES TERRACE','Professor Filippas is marked on the map. His office hours are outside tonight.');
}
function completeStory(id,outcome,message,t=0,b=0){const s=story(id);if(s.status==='resolved')return;s.status='resolved';s.stage='done';s.outcome=outcome;s.passenger=false;trust+=t;buzz+=b;storyLog.push(definition(id).title+': '+message);if(tracked===id)tracked=null;window.lifeAPI?.onStoryResolved(id,outcome);showDispatch(definition(id).name,message);toast('STORY RESOLVED · '+(t?'TRUST '+(t>0?'+':'')+t+' · ':'')+(b?'BUZZ '+(b>0?'+':'')+b:''));renderJournal();}
function acceptStory(id,stage,message){const s=story(id);s.status='active';s.stage=stage;tracked=id;trackedLandmark=null;showDispatch(definition(id).name,message);renderJournal();}
// The project crew can banter without starting or resolving the optional story.
const nicoSpot=at(977,680,'NICO · SELF-APPOINTED CREATIVE DIRECTOR');
// Fictional office-hours dialogue for the professor cameo.
function professorChoices(topic,text,choices){
 showChoices('PROFESSOR FILIPPAS / '+topic,text,choices,'professor');
}
function professorPractice(){
 const project=story('project');
 professorChoices('OFFICE HOURS','Say the app earns money each time people come back. What might it optimize for if a great match means two people delete it? And no, putting “AI” on the slide does not make this a different question.',[
  {label:'Repeat visits, even when a lasting match would be better for users',action:()=>{
   project.rehearsed=true;project.coached=true;
   professorChoices('THAT’S AN ARGUMENT','Exactly. One metric for the company, one outcome for the users. Put those next to each other and you have a presentation. Also, you’re allowed to look at your notes. This is a classroom, not a hostage negotiation.',[
    {label:'Thanks. I’ll tell Maya',action:()=>{}}
   ]);
  }},
  {label:'Better matches, because the company says it cares',action:()=>professorChoices('GIVE IT ANOTHER SHOT','It might. But the slide is about what gets rewarded. Imagine you’re paid for every return visit. What would you measure? Take a breath. You have time.',[
   {label:'Try again',action:professorPractice},{label:'I’ll think about it on the walk',action:()=>{}}
  ])},
  {label:'I’ll come back later',action:()=>{}}
 ]);
}
function talkProfessor(){
 const project=story('project');
 if(trackedLandmark==='professor')trackedLandmark=null;
 if(project.status==='resolved'){
  const feedback=project.outcome==='fixed'?'You made the incentive conflict clear and gave everyone a part. That’s good work. Send Maya the deck before Nico renames it FINAL-FINAL-FINAL again.'
   :project.outcome==='covered'?'Jules got the group through. Check in with them afterward. A teammate doing you a favor still deserves a thank-you.'
   :project.outcome==='coached'?'You owned the missing slides and made a good argument anyway. That is exactly what I hoped you’d do. Next time, put the backup somewhere other than a coffee table.'
   :'Some of the analysis worked. Next time, use an anonymized example and say what it can actually show. Nico is one data point with exceptionally strong opinions.';
  professorChoices('AFTER THE PRESENTATION',feedback,[{label:'Thanks for the feedback',action:()=>{}}]);
  return;
 }
 const choices=[{label:'Talk through a practice question',action:professorPractice}];
 if(project.stage==='present'&&!project.usb&&project.coached){
  choices.push({label:'Own the missing slides and present the argument anyway',action:()=>professorChoices('NO SLIDES REQUIRED',
   'Tell me what the platform measures and what the users actually want. Keep the personal screenshots out of it. Maya can handle the example, and Nico can take questions. We can still do this.',[
    {label:'Present the honest backup plan',action:()=>completeStory('project','coached','With Professor Filippas’s coaching, you and Maya present a short, honest argument about incentives. Nico finally takes a useful question.',2,1)},
    {label:'Give me a minute to check with the group',action:()=>{}}
   ])});
 }
 choices.push({label:'I’m a little overwhelmed',action:()=>professorChoices('ONE THING AT A TIME',
  'That happens. Find your team, pick one claim you can defend, and build from there. You can ask for help before everything catches fire. And please put a name on the file that isn’t “final, seriously this time.”',[
   {label:'I can do that. Thanks, Professor',action:()=>{}}
  ])},{label:'See you around Hughes',action:()=>{}});
 professorChoices('OFFICE HOURS',
  'Hey. You look like a group chat that hasn’t slept. How can I help? If this is about the presentation, take a breath. I’m interested in what you learned, and we can work with where you are.',choices);
}
function projectRehearsal(){const s=story('project');showChoices('MAYA + NICO / THE PRACTICE RUN','MAYA: One practice question. Why might a dating app care about repeat use, not just good matches?\n\nNICO: Because commitment issues are a recurring revenue model.\n\nMAYA: Annoyingly, there is a real incentives point buried in that bullshit.',[
 {label:'The platform’s engagement goals can conflict with users finding a match',action:()=>{s.rehearsed=true;showChoices('MAYA + NICO / HOLY SHIT, A POINT','MAYA: Yes. Then we explain matching and how reputation signals can be misleading. An actual argument.\n\nNICO: Put me down as “vibes and strategic eyebrow contact.”\n\nMAYA: You are changing the slides. Quietly.',[{label:'Back to the plan',action:()=>talkProject()}]);}},
 {label:'Say “AI” until somebody stops asking questions',action:()=>showChoices('MAYA + NICO / ABSOLUTELY NOT','NICO: Finally. A scalable solution.\n\nMAYA: That is three buzzwords in a trench coat. Try the incentives answer.',[{label:'Try the practice question again',action:projectRehearsal},{label:'Back to the plan',action:()=>talkProject()}])},
 {label:'Skip rehearsal. I need fresh air',action:()=>{}}
]);}
function projectBanter(){showChoices('MAYA + NICO / THE GROUP CHAT','NICO: Last night I said I would bring the deck. I brought a deck of cards. Technically, I delivered.\n\nMAYA: You named the file FINAL_final_USE_THIS_one_FOR_REAL. It is a photo of your ceiling.\n\nNICO: Minimalist data visualization.',[
 {label:'Nico, your contribution is an academic jump scare',action:()=>showChoices('NICO / CREATIVE DIRECTOR, ALLEGEDLY','NICO: Harsh. Fair. Devastating for my personal brand.\n\nMAYA: His other contribution was adding “Sent from my iPhone” to the bibliography.',[{label:'Okay, let’s save this damn presentation',action:()=>talkProject()},{label:'I’m going for a walk',action:()=>{}}])},
 {label:'Give the group a very questionable pep talk',action:()=>showChoices('THE HUGHES HUDDLE','YOU: We are three adults, one working USB and approximately half a functioning brain. We have survived worse.\n\nMAYA: That is somehow the most useful thing anyone has said.\n\nNICO: Hands in. Please ignore the syrup.',[{label:'Back to the plan',action:()=>talkProject()},{label:'Break huddle. Back to campus',action:()=>{}}])},
 {label:'Rehearse one actual course question',action:projectRehearsal},
 {label:'Leave the group chat on read',action:()=>{}}
]);}
function talkProject(){const s=story('project'),d=definition('project');
 if(s.status==='resolved'){const text=s.outcome==='fixed'?'MAYA: Real slides. Actual analysis. Nobody said “synergy.” A damn miracle.\n\nNICO: I advanced every slide flawlessly.\n\nMAYA: You clicked backwards twice.':s.outcome==='coached'?'MAYA: We admitted the slides were missing and made the argument anyway. I’m proud of us.\n\nNICO: I answered a question without once saying “scale.”\n\nMAYA: Personal growth. Put that on the résumé.':s.outcome==='covered'?'JULES, IN THE GROUP CHAT: I covered AI and Data-Driven Marketplaces for Professor Filippas. We are even. Nobody asks about the shoe.\n\nNICO: What shoe?\n\nMAYA: For once in your life, keep it that way.':'NICO: We turned my dating-app screenshots into an AI and Data-Driven Marketplaces case study for Professor Filippas. I am basically a dataset.\n\nMAYA: An unrepresentative sample with spectacularly bad incentives.';showChoices('MAYA + NICO / POST-PRESENTATION DEBRIEF',text,[{label:'Ask about last night',action:projectBanter},{label:'Catch you chaotic bastards later',action:()=>{}}]);return;}
 const extras=[{label:'What the hell happened last night?',action:projectBanter},{label:'Practice with the group first',action:projectRehearsal},{label:'Find Professor Filippas for office hours',action:findProfessor}];
 if(s.stage==='offer'){const choices=[
 {label:'Rescue the real slides from Starbucks',action:()=>acceptStory('project','usb','Maya: Starbucks first. Nico is banned from touching the shared drive. Nico: Censorship is alive at Hughes.')},
 {label:'Turn Nico’s screenshots into a marketplace case study',action:()=>acceptStory('project','present','Maya: Fine. Hughes. Bring an argument about matching and incentives. Nico: And my good side. Maya: You are a spreadsheet now.')}
 ];if(story('walk').status==='resolved'&&trust>=2)choices.push({label:'Ask Jules to cover—the favor you earned',action:()=>completeStory('project','covered','Jules covers the AI and Data-Driven Marketplaces presentation for Professor Filippas. Nico calls it outsourcing. Maya calls it finally shutting the hell up.',2,1)});choices.push(...extras,{label:'Leave the group to sort it out',action:()=>{}});showChoices('MAYA + NICO / '+d.title,d.intro,choices);return;}
 if(s.stage==='usb'){showChoices('MAYA + NICO / USB RESCUE','MAYA: The USB is still by Starbucks. I am holding this group together with a coffee sleeve.\n\nNICO: I made a backup.\n\nMAYA: On what?\n\nNICO: Emotionally, I remember most of it.',[...extras,{label:'On my way to Starbucks',action:()=>{}}]);return;}
 const text=s.usb?'MAYA: Matching, incentives, reputation. The real slides for Professor Apostolos Filippas are here.\n\nNICO: I deleted the screenshot where I called myself a high-value market participant.\n\nMAYA: Keep deleting.': 'MAYA: AI and Data-Driven Marketplaces. Professor Apostolos Filippas. And a deck of Nico’s dating-app screenshots. We need a real argument.\n\nNICO: Slide four is called “The Invisible Hand Left Me on Read.”\n\nMAYA: I hate that it almost works.';
 const choices=s.usb?[
 {label:'Present the real matching, incentives and reputation analysis',action:()=>completeStory('project','fixed',s.rehearsed?'The practice run paid off: you explain the platform’s incentives, Maya handles the analysis, and Nico sticks to clicking slides. Maya: Holy shit. A functioning group.':'You present the recovered marketplace analysis. Maya keeps it coherent. Nico only says “disruption” once. Maya trusts you more.',3,1)},
 {label:'Blame missing charts on a software glitch',action:()=>completeStory('project','improvised','Nico announces “the cloud ate our homework.” Maya delivers the actual course concepts through gritted teeth. The excuse becomes campus gossip.',-1,3)}
 ]:[
 {label:'Use the screenshots to explain matching and bad incentives',action:()=>completeStory('project','improvised','You explain matching and bad incentives using Nico’s messages. Nico calls himself a case study. Maya calls this a group-project hostage situation. Campus buzz rises; trust falls.',-1,3)},
 {label:'Get the real marketplace analysis from Starbucks instead',action:()=>acceptStory('project','usb','Maya: Thank you. Starbucks first. Nico: Should I add transitions? Maya: Touch that deck and I will transition you into the fountain.')}
 ];choices.push(...extras,{label:'I need a minute. I’ll roam and come back',action:()=>{}});showChoices('MAYA + NICO / AI AND DATA-DRIVEN MARKETPLACES',text+(s.rehearsed?'\n\nMAYA: We rehearsed the incentives point. Stick to that.':''),choices);
}
function talkStory(id){if(id==='takeover'){window.lifeAPI?.talk();return;}if(id==='project'){talkProject();return;}const s=story(id),d=definition(id);if(s.status==='resolved'){showChoices(d.name,s.outcome==='private'?'You kept that quiet. I owe you one.':s.outcome==='gossip'?'So the whole quad knows about my missing shoe. Fantastic.':s.outcome==='fixed'?'Actual matching and reputation slides for AI and Data-Driven Marketplaces. We finally had something to present to Professor Filippas.':s.outcome==='improvised'?'I cannot believe we called those dating-app screenshots a marketplace case study for Professor Filippas.':s.outcome==='covered'?'Jules covered our AI and Data-Driven Marketplaces presentation for Professor Filippas. That favor paid off.':s.outcome==='shuttle'?'We found Sam and got our trip organized. You’re free to keep roaming.':'Staying on Rose Hill was a better call. See you on Eddie’s.',[{label:'Catch you later',action:()=>{}}]);return;}
 if(s.stage==='offer'){
 if(id==='walk')showChoices(d.name+' / '+d.title,d.intro,[{label:'Give Jules a discreet cart ride',action:()=>acceptStory(id,'ride','Thank you. Bring the cart here. Nobody needs a documentary of this bullshit.')},{label:'Find the missing shoe first',action:()=>acceptStory(id,'shoe','Last sighting: the ram statue walk. It is one very recognizable shoe.')},{label:'Not now. I’m just exploring',action:()=>{}}]);
 if(id==='van')showChoices(d.name+' / '+d.title,(story('walk').status==='resolved'?'Jules is sorted, but Sam is still missing. ':'')+d.intro,[{label:'Find Sam by Hughes and keep the trip',action:()=>acceptStory(id,'sam','Tell Sam everyone is waiting. We can still make our own plan.')},{label:'Convince everyone to stay at Rose Hill',action:()=>acceptStory(id,'eddies','New plan: meet on Eddie’s. No one has to sprint across campus.')},{label:'I’ll keep roaming. Decide without me',action:()=>{}}]);return;}
 if(id==='walk'&&s.stage==='ride'){
 if(!inCart()){showDispatch('JULES','Bring the cart. I am not marching across campus with one shoe.');return;}
 s.stage='home';s.passenger=true;tracked=id;showDispatch('JULES',s.shoe?'You found the shoe AND the ride. A damn hero. Cunniffe court, please.':'One shoe, zero dignity. Cunniffe court, please.');return;}
 showDispatch(d.name,objectiveFor(id)?.text||'Do your thing. No rush.');}
function storyLocationInteraction(id){if(id==='takeover'){if(story(id).stage==='return')window.lifeAPI?.talk();else window.lifeAPI?.interact();return;}const s=story(id);if(id==='walk'&&s.stage==='shoe'){s.shoe=true;s.stage='ride';showDispatch('JULES','You found it! Bring a cart to Freeman and rescue the rest of me.');}
 else if(id==='walk'&&s.stage==='home'){if(!inCart()||Math.abs(velocity)>1.3){showDispatch('JULES','Stop the cart at the drop-off, please.');return;}showChoices('JULES / KEEP IT QUIET?','Out of sight, finally. Your project partner would love this story. What do you do?',[{label:'Keep it private. Friends look out for friends',action:()=>completeStory(id,'private','You got Jules to the quiet courtyard and kept the story private. Jules will cover a favor at Hughes.',s.shoe?4:3,0)},{label:'Tell Eddie’s the one-shoe story',action:()=>completeStory(id,'gossip','The one-shoe story gets laughs on Eddie’s. Jules trusts you less.',-2,3)}]);}
 else if(id==='project'&&s.stage==='usb'){s.usb=true;s.stage='present';showDispatch('MAYA + NICO','Maya: Slides secured. Back to Hughes. Nico: I found the missing chart! Maya: That is a pizza receipt.');}
 else if(id==='van'&&s.stage==='sam')showChoices('SAM / WRONG SIDE OF CAMPUS','I thought we were meeting at Starbucks. Dev said “the usual spot,” which is a bullshit location.',[{label:'Clear up the mix-up and regroup at the van',action:()=>{s.stage='stop';trust++;showDispatch('SAM','Got it. I’ll head over. Meet Dev at the pickup.');}},{label:'Forget the trip. Let’s stay at Rose Hill',action:()=>{s.stage='eddies';showDispatch('SAM','Honestly? Better plan. Meet everyone on Eddie’s.');}},{label:'I’ll come back in a minute',action:()=>{}}]);
 else if(id==='van'&&s.stage==='stop')completeStory(id,'shuttle','You found Sam and got the group organized for their shuttle trip. You stay free to roam Rose Hill.',2,1);
 else if(id==='van'&&s.stage==='eddies')completeStory(id,'campus','You changed the plan and brought everyone together on Eddie’s instead.',1,3);renderJournal();}
function missionInteract(){// Every interaction is optional; objectives advance only on deliberate input.
 const close=p=>p&&Math.hypot(p.x-player.x,p.y-player.y)<interactionRange()&&lineClear(player,p);
 for(const d of storyDefinitions){const s=story(d.id),w=objectiveFor(d.id);if(s.status==='active'&&w&&close(w)&&!['offer','ride','present'].includes(s.stage)){tracked=d.id;storyLocationInteraction(d.id);return true;}}
 const nearest=conversationContacts().filter(c=>close(c.p)).sort((a,b)=>Math.hypot(a.p.x-player.x,a.p.y-player.y)-Math.hypot(b.p.x-player.x,b.p.y-player.y))[0];if(nearest){if(nearest.id==='nico')projectBanter();else if(nearest.id==='professor')talkProfessor();else talkStory(nearest.id);return true;}return false;}
function conversationContacts(){return [...storyDefinitions.filter(d=>!(d.id==='walk'&&story('walk').passenger)).map(d=>({id:d.id,name:d.name,p:contactPosition(d.id)})),{id:'nico',name:'NICO',p:nicoSpot},professorContact];}
function contactPosition(id){const s=story(id);if(id==='walk'&&s.passenger)return {x:cart.x-Math.sin(player.a)*.3,y:cart.y+Math.cos(player.a)*.3,seated:true};if(id==='walk'&&s.status==='resolved')return homeSpot;if(id==='van'&&(s.stage==='eddies'||s.outcome==='campus'))return eddiesSpot;return definition(id).meet;}
function supportPosition(){const s=story('van');if(s.stage==='sam')return samSpot;if(s.stage==='stop'||s.outcome==='shuttle'){const p=definition('van').meet;return {x:p.x+.6,y:p.y+.5};}if(s.stage==='eddies'||s.outcome==='campus')return {x:eddiesSpot.x+.6,y:eddiesSpot.y+.5};return {...samSpot,hidden:true};}
function updateMission(){const active=stories.filter(s=>s.status==='active'),job=window.activityAPI?.view();$('#mission').textContent=job?.id?'JOB · '+job.title+' · '+(missionWaypoint()?.text||''):trackedLandmark?'EXPLORE · '+destinations.find(p=>p.id===trackedLandmark).name:tracked?(definition(tracked).title+' · '+(objectiveFor(tracked)?.text||'Story resolved')):'FREE ROAM · '+active.length+' ongoing stories · [B] CONTACTS';}
function renderJournal(){const panel=$('#journal-list');panel.replaceChildren();for(const d of storyDefinitions){const s=story(d.id),row=document.createElement('div'),title=document.createElement('b');title.textContent=d.title+' · '+s.status.toUpperCase();row.appendChild(title);const text=document.createElement('p');text.textContent=s.status==='resolved'?storyLog.find(t=>t.startsWith(d.title))||'Resolved':objectiveFor(d.id).text+' · '+objectiveFor(d.id).label;row.appendChild(text);if(s.status!=='resolved'){const btn=document.createElement('button');btn.textContent=tracked===d.id?'STOP TRACKING':'TRACK ON MAP';btn.onclick=()=>{tracked=tracked===d.id?null:d.id;trackedLandmark=null;renderJournal();};row.appendChild(btn);}if(d.id==='project'){const mentor=document.createElement('button');mentor.textContent='FIND PROFESSOR FILIPPAS';mentor.onclick=findProfessor;row.appendChild(mentor);}panel.appendChild(row);}for(const landmark of landmarks){const row=document.createElement('div'),title=document.createElement('b'),button=document.createElement('button');title.textContent=landmark.name+' · LANDMARK';button.textContent=trackedLandmark===landmark.id?'STOP TRACKING':'FIND ON MAP';button.onclick=()=>{trackedLandmark=trackedLandmark===landmark.id?null:landmark.id;tracked=null;renderJournal();};row.appendChild(title);row.appendChild(button);panel.appendChild(row);}$('#journal-stats').textContent='TRUST '+trust+' · CAMPUS BUZZ '+buzz;}
function toggleJournal(){if(window.socialAPI?.menuOpen()||window.activityAPI?.menuOpen()||window.presentationAPI?.isOpen()||window.lifeAPI?.menuOpen())return;if(!started||($('#overlay').style.display!=='none'&&$('#journal').hidden))return;const opening=$('#journal').hidden;if(opening){renderJournal();running=false;keys={};document.exitPointerLock?.();}else{running=true;captureMouse();}$('#journal').hidden=!opening;}
function startMission(){talkStory('walk');}function failMission(){showDispatch('CAMPUS SECURITY','A warning and a small fine. Your stories are still there when you want them.');}function retryMission(){toggleJournal();}function progress(){}
let best=0;try{best=Number(localStorage.getItem('roseHillBest'))||0}catch{}$('#best').textContent=buzz;
function resize(){W=Math.min(innerWidth,1100);H=Math.round(W*innerHeight/innerWidth)}addEventListener('resize',resize);resize();
const sceneryBlocks=Array.from({length:8},(_,i)=>({x:i%2?30.1:25.3,y:27+Math.floor(i/2)*2.6,r:.18}));sceneryBlocks.push({...P(1047,704),r:.25},{...P(1157,719),r:.27},{...P(890,886),r:.2},{...P(890,906),r:.2});
function blocked(x,y,r=.08){return x<MAP_BOUNDS.minX+r||y<MAP_BOUNDS.minY+r||x>MAP_BOUNDS.maxX-r||y>MAP_BOUNDS.maxY-r||buildings.some(b=>x>b.x-r&&x<b.x+b.w+r&&y>b.y-r&&y<b.y+b.h+r)||sceneryBlocks.some(p=>Math.hypot(x-p.x,y-p.y)<p.r+r)||landmarks.some(p=>['ram','fountain'].includes(p.id)&&Math.hypot(x-p.x,y-p.y)<(p.id==='ram'?.2:.34)+r)}
function move(o,dx,dy){if(!blocked(o.x+dx,o.y))o.x+=dx;if(!blocked(o.x,o.y+dy))o.y+=dy}
function lineClear(a,b){let d=Math.hypot(a.x-b.x,a.y-b.y);for(let i=.3;i<d;i+=.3){let t=i/d;if(blocked(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,.03))return false}return true}
function reset(){window.activityAPI?.reset();window.socialAPI?.reset();window.combatAPI?.reset();window.lifeAPI?.reset();cupShots=[];player={...P(1118,741),a:-.18,pitch:.34};score=0;heat=0;time=180;elapsed=0;combo=0;lastHit=-99;invulnerable=0;cooldown=0;particles=[];props=[];finished=false;driving=false;velocity=0;jump=0;jumpV=0;unseen=0;previousWanted=0;mission=0;missionHits=0;escapeCount=0;hornCooldown=0;missionStage=0;missionActive=false;missionFailed=false;missionRemaining=0;missionTouched.clear();missionMessageUntil=0;checkpoint=null;resetStories();$('#dispatch').style.display='none';cart={...P(1158,775),a:-Math.PI/2,type:'cart'};supercar={...supercarSpawn};supercarAlert=false;vehicleId='cart';
 for(const [px,py,type] of [[1100,675,'cups'],[1184,700,'cone'],[1187,767,'speaker'],[1080,782,'cups'],[1117,807,'cone'],[1018,713,'speaker'],[919,776,'cups'],[1220,795,'cone'],[1040,837,'cups']])props.push({...P(px,py),type,ready:0});
 for(const [i,[px,py]] of [[1090,670],[1175,695],[1080,775]].entries())props.push({...P(px,py),type:'speaker',ready:0,partyStation:i});
 for(const [px,py] of [[1100,710],[1130,710],[1165,735]])props.push({...P(px,py),type:'cone',ready:0,missionCone:true});
 guards=[[1042,680],[1207,656],[1195,805],[1045,826],[919,710]].map(([x,y],i)=>({...P(x,y),a:i,search:0,path:[],repath:0}));
 students=Array.from({length:28},(_,i)=>{let x=0,y=0;do{x=MAP_BOUNDS.minX+.5+Math.random()*(MAP_BOUNDS.maxX-MAP_BOUNDS.minX-1);y=MAP_BOUNDS.minY+.5+Math.random()*(MAP_BOUNDS.maxY-MAP_BOUNDS.minY-1)}while(blocked(x,y)||y<P(0,530).y);return {x,y,a:Math.random()*TAU,type:'student',name:['TRIP','BLAIR','CHAD','SLOANE','BLAKE','RILEY','WYATT','HARPER'][i%8]+' / '+['FINANCE BRO','PREP ROYALTY','AFTERPARTY','VARSITY'][i%4],faction:['finance','prep','party','athlete'][i%4],brave:i%4===0||i%4===3,color:['#711d3b','#25394e','#665c79','#e0d8c4'][i%4]}});
 for(const [i,[x,y]] of [[1080,518],[1128,531],[1182,558],[1208,557],[1060,563],[1143,570],[915,917],[904,889]].entries()){const p=P(x,y);Object.assign(students[i],p,{anchor:{...p},idle:i%3===0?'dance':i%3===1?'phone':'chat'});}
 Object.assign(students[0],rivalSpot,{id:'blaine',name:'BLAINE / STARTUP RIVAL',brave:true,faction:'finance',anchor:{...rivalSpot},idle:'chat'});const trip=P(1131,742);Object.assign(students[1],trip,{name:'TRIP / LEGACY KID',brave:true,faction:'prep',anchor:{...trip},idle:'phone'});
}
function wanted(){return heat<15?0:Math.min(5,Math.ceil((heat-14)/18))}

// Breadth-first routing around buildings, cached per guard rather than per frame.
function route(from,to){let sx=Math.floor(from.x),sy=Math.floor(from.y),tx=Math.floor(to.x),ty=Math.floor(to.y);const index=(x,y)=>y*60+x,start=index(sx,sy),end=index(tx,ty),prev=new Int32Array(3300).fill(-1),q=[start];prev[start]=start;
 for(let n=0;n<q.length;n++){let v=q[n];if(v===end)break;let x=v%60,y=Math.floor(v/60);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){let nx=x+dx,ny=y+dy,k=index(nx,ny);if(nx<1||nx>58||ny<1||ny>53||prev[k]!==-1||blocked(nx+.5,ny+.5,.32))continue;prev[k]=v;q.push(k);}}
 if(prev[end]===-1)return [];let out=[],v=end;while(v!==start){out.push({x:v%60+.5,y:Math.floor(v/60)+.5});v=prev[v]}return out.reverse();
}
function inCart(){return driving&&vehicleId==='cart';}
function inSupercar(){return driving&&vehicleId==='supercar';}
function nearbyVehicle(){
 const distance=v=>Math.hypot(v.x-player.x,v.y-player.y);
 return [cart,supercar].filter(v=>distance(v)<(easy()?2.25:1.5)&&lineClear(player,v))
  .sort((a,b)=>distance(a)-distance(b))[0];
}
function useCart(){
 if(!running||window.combatAPI?.disabled())return;
 if(driving){
  const sports=inSupercar(),vehicle=sports?supercar:cart;
  if(Math.abs(velocity)>1.3&&!easy()){toast('Stop before getting out.');return;}
  const exits=sports?[-Math.PI/2,Math.PI/2,0,Math.PI]:[0,Math.PI,Math.PI/2,-Math.PI/2];
  const exit=exits.map(a=>{
   const direction=sports?player.a+a:a,distance=sports?.52:1;
   return {x:player.x+Math.cos(direction)*distance,y:player.y+Math.sin(direction)*distance};
  }).find(p=>!blocked(p.x,p.y));
  if(!exit){toast('No room to get out here.');return;}
  Object.assign(vehicle,{x:player.x,y:player.y,a:player.a});
  Object.assign(player,exit);driving=false;vehicleId='cart';velocity=0;
  toast('Back on foot.');return;
 }
 const vehicle=nearbyVehicle();
 if(!vehicle){toast('Find a vehicle marker and get closer. F to get in.');return;}
 vehicleId=vehicle.type;
 driving=true;invulnerable=easy()?10:3;
 Object.assign(player,{x:vehicle.x,y:vehicle.y,a:vehicle.a??-Math.PI/2});
 if(inSupercar()){
  player.pitch=.08;
  const firstTake=!vehicle.reported;vehicle.reported=true;
  if(firstTake){supercarAlert=true;heat=Math.max(heat,41);unseen=0;}
  window.activityAPI?.onSupercarEntered?.(firstTake);
  toast(firstTake?'SUPERCAR TAKEN · SECURITY ALERTED':'BACK IN THE SUPERCAR');
 }else{
  if(!easy())heat=Math.max(heat,20);
  toast('CAMPUS CART ACQUIRED. Probably not yours.');
 }
}
function supercarBlocked(x,y,a){
 for(const end of [-.225,0,.225]){
  if(blocked(x+Math.cos(a)*end,y+Math.sin(a)*end,.134))return true;
 }
 return Math.hypot(x-cart.x,y-cart.y)<.31;
}
function driveSupercar(dt,throttle,steer){
 const paved=roads.some(road=>segmentDistance(player.x,player.y,road.a,road.b)<road.w*.61);
 const boost=window.activityAPI?.boosting(),braking=keys.Space;
 if(!braking)velocity+=throttle*dt*(boost?14:8.5);
 const drag=braking?12:throttle?(paved?1.18:2.5):easy()?4.3:2.15;
 velocity*=Math.exp(-dt*drag);
 const limit=paved?(boost?4.9:easy()?3.65:4.4):boost?3.25:2.6;
 velocity=Math.max(-1.35,Math.min(limit,velocity));
 const turn=(velocity<0?-1:1)*steer*dt*(paved?1.72:1.45)
  *Math.max(easy()?.38:0,Math.min(1,Math.abs(velocity)/1.2));
 if(!supercarBlocked(player.x,player.y,player.a+turn))player.a+=turn;
 const dx=Math.cos(player.a)*velocity*dt,dy=Math.sin(player.a)*velocity*dt;
 if(!supercarBlocked(player.x+dx,player.y+dy,player.a)){
  player.x+=dx;player.y+=dy;
 }else if(Math.abs(velocity)>.3){
  if(Math.abs(velocity)>1.2){
   window.activityAPI?.spill(28);window.activityAPI?.effect('block');
   toast('THAT’S COMING OUT OF HIS ALLOWANCE.');
  }
  velocity*=.12;
 }
 Object.assign(supercar,{x:player.x,y:player.y,a:player.a,paved});
}


reset();
function toast(t){$('#toast').textContent=t;toastUntil=elapsed+2.7}
function award(p){gameFeedback('impact');combo=elapsed-lastHit<6?Math.min(combo+1,5):1;lastHit=elapsed;let points=(p.type==='speaker'?120:75)*combo;score+=points;heat=Math.min(100,heat+(p.type==='speaker'?30:19));p.ready=elapsed+18;progress(p.type==='speaker'?'speakers':'targets',p);toast(`+${points}  ${combo>1?'×'+combo+' BAD DECISION COMBO':'BAD DECISION'}`);for(let i=0;i<10;i++)particles.push({x:p.x,y:p.y,z:Math.random(),life:1,vx:(Math.random()-.5)*3,vy:(Math.random()-.5)*3});window.activityAPI?.onAward(p);}
function angleDiff(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b))}
function throwCup(){if(!running||cooldown>0)return;cooldown=.35;throwFlash=.25;let target=props.filter(p=>p.type!=='speaker'&&(!p.missionCone||missionConesActive())&&p.ready<=elapsed&&Math.hypot(p.x-player.x,p.y-player.y)<(easy()?8:6)&&Math.abs(angleDiff(Math.atan2(p.y-player.y,p.x-player.x),player.a))<(easy()?.4:.14)&&lineClear(player,p)).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];cupShots.push({x:player.x,y:player.y,tx:target?.x??player.x+Math.cos(player.a)*3,ty:target?.y??player.y+Math.sin(player.a)*3,age:0,duration:.65});if(target)award(target);else toast('Aim at a glowing cup stack or cone.');}
function interact(){if(!running||window.combatAPI?.disabled())return;if(window.activityAPI?.interact())return;if(window.lifeAPI?.interact())return;
 const landmark=landmarks.find(p=>Math.hypot(p.x-player.x,p.y-player.y)<.8);if(landmark){const text=landmark.description??(landmark.id==='mcshane'?'McShane Campus Center links contemporary glazing with the older gym complex. Its student-life spaces are inspiration for our fictional pre-game rally. J opens the quick jobs.':landmark.id==='gym'?'Rose Hill Gymnasium: fieldstone walls, Tudor entrance, traceried windows and the broad two-flight approach. The steps are walkable. Make an entrance, preferably with both shoes.':landmark.id==='ram'?'Fordham’s bronze mascot stands beside Hughes Hall, overlooking the courtyard. If the group chat says “meet by the ram,” this is your guy. He has heard enough bad business pitches for one lifetime.':landmark.id==='fountain'?'Carolyn Dursi Cunniffe Fountain stands between Hughes, Dealy and Cunniffe House. Tiered bronze bowls rise from a circular planted bed. A fine place to sit down and pretend your group project is under control.':'The Terrace of the Presidents carries engraved names of heads of state awarded honorary degrees by Fordham. The tradition began under University President Robert Gannon. You can climb the steps from Eddie’s.');showChoices(landmark.name,text,[{label:'Back to exploring',action:()=>{trackedLandmark=null;}}]);return;}
if(missionInteract())return;if(window.lifeAPI?.vendorInteract())return;const p=props.find(p=>p.type==='speaker'&&p.ready<=elapsed&&Math.hypot(p.x-player.x,p.y-player.y)<(easy()?2.25:1.6)&&lineClear(player,p));if(p){award(p);toast('TURN THAT SHIT UP! +'+120*combo)}else if(!driving&&nearbyVehicle()?.type==="cart")useCart();else toast('Explore, talk to contacts, or press B to track an optional story.');}
function handleGameKey(e){if(window.presentationAPI?.handleKey(e))return;if(window.lifeAPI?.handleKey(e))return;if(window.socialAPI?.handleKey(e))return;if(dialogueOpen){if(/^Digit[1-9]$/.test(e.code))chooseDialogue(Number(e.code.slice(-1))-1);if(e.code==='Escape')leaveConversation();return;}if(window.activityAPI?.menuOpen()){if(e.code==='Escape'||e.code==='KeyJ')window.activityAPI.toggle();return;}if(e.code==='KeyB'){toggleJournal();return;}if(!$('#journal').hidden){if(e.code==='Escape')toggleJournal();return;}if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.code==='KeyV'&&!e.repeat)toggleView();if(e.code==='KeyC'&&!e.repeat)toggleHelp();if(e.code==='KeyX'&&!e.repeat)window.combatAPI?.punch();if(e.code==='KeyQ'&&!e.repeat)throwCup();if(e.code==='KeyE'&&!e.repeat)interact();if(e.code==='KeyR'&&!e.repeat)retryMission();if(e.code==='KeyF'&&!e.repeat)useCart();if(e.code==='Space'&&running&&!driving&&!window.combatAPI?.disabled()&&jump===0&&jumpV===0){jumpV=4;window.activityAPI?.spill(25);}if(e.code==='KeyH'&&running&&driving&&hornCooldown<=0){hornCooldown=2;heat=Math.min(100,heat+8);toast('BEEP BEEP, BITCHES.');window.activityAPI?.onHorn();}if(e.code==='KeyJ'&&!e.repeat){window.activityAPI?.toggle();return;}if(e.code==='KeyM'&&!e.repeat)window.activityAPI?.toggleSound();if(e.code==='KeyN'&&!e.repeat)toggleRadio();if(e.code==='Escape')pause();}
addEventListener('keydown',handleGameKey);
addEventListener('keyup',e=>keys[e.code]=false);addEventListener('blur',()=>{keys={};if(running)pause()});
canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('mousedown',e=>{if(!running||hasTouchControls())return;if(e.button===2){keys.MouseRight=true;return;}if(document.pointerLockElement!==canvas){captureMouse();return;}window.combatAPI?.punch();});addEventListener('mouseup',()=>keys.MouseRight=false);
canvas.addEventListener('wheel',e=>{if(running&&thirdPerson){e.preventDefault();cameraDistance=Math.max(3.2,Math.min(9,cameraDistance+e.deltaY*.008));}},{passive:false});
addEventListener('mousemove',e=>{if(running&&document.pointerLockElement===canvas){if(!driving||!easy())player.a+=e.movementX*(easy()?.0015:.0025);player.pitch=Math.max(-1.1,Math.min(1.1,(player.pitch||0)-e.movementY*.002));}});
document.addEventListener('pointerlockchange',()=>{if(!hasTouchControls()&&!document.pointerLockElement&&running)pause()});
function saveBest(){if(score>best){best=score;try{localStorage.setItem('roseHillBest',best)}catch{}}$('#best').textContent=buzz;}
function pause(){if(!running)return;saveBest();running=false;keys={};document.exitPointerLock?.();$('#overlay').style.display='flex';$('#intro').textContent='Paused. Your next bad decision can wait.';$('#start').textContent='RESUME THE CHAOS ↗';}
window.pauseForNative=()=>{window.touchControls?.clear();pause();};
$('#start').onclick=()=>{if(finished||!started){reset();started=true}mode=$('#mode').value;difficulty=$('#difficulty').value;running=true;window.campusAudio?.unlock();$('#overlay').style.display='none';captureMouse();};
function finish(){running=false;finished=true;document.exitPointerLock?.();if(score>best){best=score;try{localStorage.setItem('roseHillBest',best)}catch{}}$('#best').textContent=buzz;$('#overlay').style.display='flex';$('#intro').textContent=`${score>=1000?'CAMPUS MENACE':'ROOKIE MENACE'} · ${score} points · Best: ${best}`;$('#start').textContent='ONE MORE BAD DECISION ↗';}
function update(dt){if(!running)return;elapsed+=dt;if(mode==='challenge')time=Math.max(0,time-dt);hornCooldown=Math.max(0,hornCooldown-dt);jumpV-=dt*10;jump=Math.max(0,jump+jumpV*dt);if(jump===0)jumpV=0;cooldown=Math.max(0,cooldown-dt);throwFlash=Math.max(0,throwFlash-dt);invulnerable=Math.max(0,invulnerable-dt);window.combatAPI?.update(dt);
 player.pitch=Math.max(-1.1,Math.min(1.1,(player.pitch||0)+((keys.KeyI?1:0)-(keys.KeyK?1:0))*dt));
 const touch=window.touchControls?.axes;
 let forward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);
 let side=(keys.KeyD?1:0)-(keys.KeyA?1:0);
 if(touch){
  forward=Math.max(-1,Math.min(1,forward+touch.forward));
  side=Math.max(-1,Math.min(1,side+touch.side));
 }
 if(window.combatAPI?.disabled()){forward=0;side=0;}
 if(inSupercar()){
  const steer=side+((keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0));
  driveSupercar(dt,forward,Math.max(-1,Math.min(1,steer)));
 }else if(driving){if(!keys.Space)velocity+=forward*dt*(window.activityAPI?.boosting()?8:easy()?4.5:4);velocity*=Math.exp(-dt*(keys.Space?10:easy()?(forward?1.8:5):1.1));velocity=Math.max(easy()?-1.2:-1.7,Math.min(window.activityAPI?.boosting()?2.6:easy()?1.8:4.5,velocity));player.a+=(side+((keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0)))*dt*1.6*(velocity<0?-1:1)*Math.max(easy()?.5:0,Math.min(1,Math.abs(velocity)/2));let ox=player.x,oy=player.y;move(player,Math.cos(player.a)*velocity*dt,Math.sin(player.a)*velocity*dt);if(Math.hypot(player.x-ox,player.y-oy)<Math.abs(velocity)*dt*.4&&Math.abs(velocity)>.95){velocity=easy()?0:-velocity*.2;toast('Watch the damn paintwork.');window.activityAPI?.spill(28);}cart.x=player.x;cart.y=player.y;cart.a=player.a;
 for(const p of props)if(p.type!=='speaker'&&(!p.missionCone||missionConesActive())&&p.ready<=elapsed&&Math.hypot(p.x-player.x,p.y-player.y)<1&&Math.abs(velocity)>.6)award(p);
 }else{player.a+=((keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0))*dt*2;let norm=Math.max(1,Math.hypot(forward,side)),speed=(keys.ShiftLeft||keys.ShiftRight?1.2:.65)*dt;move(player,(Math.cos(player.a)*forward-Math.sin(player.a)*side)/norm*speed,(Math.sin(player.a)*forward+Math.cos(player.a)*side)/norm*speed);}
 let pursuing=false,stars=wanted();
 for(const [i,g] of guards.entries()){if(window.combatAPI?.disabled())continue;if(window.combatAPI?.controls(g))continue;let d=Math.hypot(player.x-g.x,player.y-g.y),chase=stars>0&&i<(supercarAlert?2:stars+1)&&d<(easy()?(inSupercar()?3.7+stars*.25:4+stars):7+stars*1.5)&&lineClear(g,player);
 if(chase){pursuing=true;g.last={x:player.x,y:player.y};g.search=7;}else g.search=Math.max(0,g.search-dt);
 let target=chase?player:g.search>0?g.last:null;
 if(target){g.repath-=dt;if(g.repath<=0){g.path=route(g,target);g.repath=.8;}let dest=lineClear(g,target)?target:g.path[0];if(dest){let a=Math.atan2(dest.y-g.y,dest.x-g.x);move(g,Math.cos(a)*dt*(easy()?.35+stars*.05:.7+stars*.12),Math.sin(a)*dt*(easy()?.35+stars*.05:.7+stars*.12));if(Math.hypot(dest.x-g.x,dest.y-g.y)<.4)g.path.shift();}
 if(chase&&d<.45&&invulnerable<=0&&(!driving||Math.abs(velocity)<2)){let fine=Math.min(score,easy()?50:150);score-=fine;failMission('Busted by security');window.activityAPI?.busted();window.combatAPI?.onBusted();heat=0;combo=0;invulnerable=5;driving=false;velocity=0;cart={...P(1158,775),a:-Math.PI/2,type:'cart'};supercar={...supercarSpawn};supercarAlert=false;vehicleId='cart';player={...P(1118,741),a:-.18,pitch:.34};toast('BUSTED. “Go home, dumbass.” −'+fine);for(const guard of guards){guard.search=0;guard.last=null;}break;}
 }else{g.a+=dt*.3;move(g,Math.cos(g.a)*dt*.6,Math.sin(g.a)*dt*.6);}}
 for(const n of students){if(window.combatAPI?.controls(n))continue;const flee=(heat>20||hornCooldown>1||n.panicUntil>elapsed)&&Math.hypot(n.x-player.x,n.y-player.y)<8;n.flee=flee;if(!flee&&(n.moodUntil>elapsed||(n.anchor&&Math.hypot(n.x-n.anchor.x,n.y-n.anchor.y)<.8)))continue;if(n.anchor&&!flee)n.a=Math.atan2(n.anchor.y-n.y,n.anchor.x-n.x);if(flee)n.a=Math.atan2(n.y-player.y,n.x-player.x);else if(Math.random()<dt*.4)n.a+=(Math.random()-.5)*2;let ox=n.x,oy=n.y;move(n,Math.cos(n.a)*dt*(flee?1:.25),Math.sin(n.a)*dt*(flee?1:.25));if(n.x===ox&&n.y===oy)n.a+=1.5;}
 unseen=pursuing?0:unseen+dt;const escapingInCar=easy()&&inSupercar()&&Math.abs(velocity)>1.1;
 if(!pursuing&&unseen>(escapingInCar?.55:easy()?2:5)){
  heat=Math.max(0,heat-dt*(escapingInCar?32:easy()?16:7));
 }
 let current=wanted();if(current===0)supercarAlert=false;if(previousWanted>0&&current===0&&invulnerable<=0){score+=200;escapeCount++;progress('escape');toast('WANTED LEVEL LOST · +200');}previousWanted=current;
 $('#wanted').textContent='★'.repeat(current)+'☆'.repeat(5-current);$('#wanted').className=pursuing?'chasing':current?'searching':'';
 $('#status').textContent=pursuing?'SPOTTED · BREAK LINE OF SIGHT':current?'SEARCHING · STAY OUT OF SIGHT':invulnerable>0&&!driving?'LET OFF WITH A WARNING':'OFF THE RADAR';
 window.socialAPI?.update(dt);window.lifeAPI?.update(dt);window.activityAPI?.update(dt,{pursuing,wanted:current});
 updateMission(dt);if(elapsed>missionMessageUntil)$('#dispatch').style.display='none';
 $('#vehicle').textContent=driving?(inSupercar()?'VELOCE SUPERCAR · ':'CAMPUS CART · ')+Math.round(Math.abs(velocity)*WORLD_SCALE*2.237)+' MPH'+(hasTouchControls()?'':' · SPACE BRAKE'):hasTouchControls()?'':'ON FOOT · F VEHICLE · V '+(thirdPerson?'FIRST-PERSON VIEW':'THIRD-PERSON VIEW');
 $('#heat i').style.width=heat+'%';$('#score').textContent=score;$('#timer').textContent=trust;$('#best').textContent=buzz;
 if(elapsed>toastUntil)$('#toast').textContent='';const vehicle=driving?null:nearbyVehicle();let near=props.find(p=>p.type==='speaker'&&p.ready<=elapsed&&Math.hypot(p.x-player.x,p.y-player.y)<(easy()?2.25:1.6));$('#prompt').textContent=driving?'W GAS · S REVERSE · A/D STEER · SPACE BRAKE · F EXIT':vehicle?.type==='supercar'?'[ F ] '+(vehicle.reported?'GET IN THE SUPERCAR':'TAKE THE SUPERCAR · SECURITY WILL NOTICE'):vehicle?'[ F ] BORROW CAMPUS CART':near?'[ E ] BLAST THE SPEAKER · +120':'';
 const nearby=conversationContacts().filter(c=>Math.hypot(c.p.x-player.x,c.p.y-player.y)<interactionRange()&&lineClear(player,c.p)).sort((a,b)=>Math.hypot(a.p.x-player.x,a.p.y-player.y)-Math.hypot(b.p.x-player.x,b.p.y-player.y))[0];if(nearby)$('#prompt').textContent='[ E ] TALK TO '+nearby.name+' · optional';
 const closeLandmark=landmarks.find(p=>Math.hypot(p.x-player.x,p.y-player.y)<.8);if(closeLandmark)$('#prompt').textContent='[ E ] READ · '+closeLandmark.name;
 if(window.activityAPI?.nearCoffeeStand())$('#prompt').textContent='[ E ] LAST CALL · PICK UP A COFFEE RUN';
 const wp=missionWaypoint();if(wp){const distance=Math.hypot(wp.x-player.x,wp.y-player.y);$('#waypoint').textContent=wp.label+(wp.kind==='hide'?'':' · '+Math.round(distance*WORLD_SCALE)+' m');if(wp.kind!=='hide'&&distance<(wp.range??interactionRange())&&lineClear(player,wp))$('#prompt').textContent=(wp.kind==='gate'?'':wp.text.includes('[F]')?'[ F ] ':'[ E ] ')+wp.text.replace(/\s*\[[EF]\]/g,'');}else $('#waypoint').textContent='';
 if(hasTouchControls()){
  const prompt=$('#prompt');
  prompt.textContent=driving?(wp?.kind!=='gate'&&wp?.text.includes('[E]')&&Math.hypot(wp.x-player.x,wp.y-player.y)<(wp.range??interactionRange())&&lineClear(player,wp)
   ?wp.text.replace(/\s*\[E\]/,''):''):prompt.textContent.replace(/^\[\s*[EF]\s*\]\s*/,'');
 }
 if(wp){const turn=angleDiff(Math.atan2(wp.y-player.y,wp.x-player.x),player.a);$('#direction').textContent=wp.kind==='hide'?'BREAK LINE OF SIGHT':Math.abs(turn)<.3?'↑ STRAIGHT AHEAD':Math.abs(turn)>2.4?'↶ TURN AROUND':turn>0?'→ HEAD RIGHT':'← HEAD LEFT';}else $('#direction').textContent='';
 for(const shot of cupShots)shot.age+=dt;cupShots=cupShots.filter(s=>s.age<s.duration);for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=dt;}particles=particles.filter(p=>p.life>0);if(time<=0&&mode==='challenge')finish();}
function ray(dx,dy){let closest=80,hit=null,side=0,hits=[];for(const b of buildings){let tx1=(b.x-player.x)/dx,tx2=(b.x+b.w-player.x)/dx,ty1=(b.y-player.y)/dy,ty2=(b.y+b.h-player.y)/dy;let nx=Math.min(tx1,tx2),ny=Math.min(ty1,ty2),entry=Math.max(nx,ny),exit=Math.min(Math.max(tx1,tx2),Math.max(ty1,ty2));if(entry>0&&entry<exit){hits.push({d:entry,b,side:nx>ny?0:1});if(entry<closest){closest=entry;hit=b;side=nx>ny?0:1}}}return {d:closest,b:hit,side,hits:hits.sort((a,b)=>b.d-a.d)};}
function project(x,y,z=0){let dx=x-player.x,dy=y-player.y,d=dx*Math.cos(player.a)+dy*Math.sin(player.a),l=-dx*Math.sin(player.a)+dy*Math.cos(player.a);if(d<.2)return null;return {x:W/2+l/d*W*.75,y:H*.5+(1.6+jump-z)*W*.1/d,s:W*.15/d,d};}
function render(){if(window.presentationAPI?.isLoading?.())return;if(window.renderCampus3D){window.renderCampus3D();minimap();return;}let sky=ctx.createLinearGradient(0,0,0,H*.52);sky.addColorStop(0,'#574064');sky.addColorStop(.6,'#d18879');sky.addColorStop(1,'#f5bf8b');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H*.52);ctx.fillStyle='#efbe85';ctx.beginPath();ctx.arc(W*.76,H*.28,H*.07,0,TAU);ctx.fill();let ground=ctx.createLinearGradient(0,H*.5,0,H);ground.addColorStop(0,'#69705a');ground.addColorStop(1,'#293e37');ctx.fillStyle=ground;ctx.fillRect(0,H*.5,W,H*.5);
 // Walkways in perspective, sampled as strips on the ground.
 const tiles=fallbackTerrain();
 for(let y=Math.floor(H*.5)+1;y<H;y+=3){let d=(1.6+jump)*W*.1/(y-H*.5);if(d>65)continue;for(let x=0;x<W;x+=5){let l=(x-W/2)*d/(W*.75),wx=player.x+Math.cos(player.a)*d-Math.sin(player.a)*l,wy=player.y+Math.sin(player.a)*d+Math.cos(player.a)*l;if(wx>0&&wx<60&&wy>0&&wy<55){let tile=tiles[Math.floor(wy*10)*600+Math.floor(wx*10)];ctx.fillStyle=groundColors[tile];ctx.fillRect(x,y,5,3);}}}

 for(let x=0;x<W;x+=2){let cameraX=(x/W-.5)/.75,dx=Math.cos(player.a)-Math.sin(player.a)*cameraX,dy=Math.sin(player.a)+Math.cos(player.a)*cameraX,cast=ray(dx,dy);depth[x]=depth[x+1]=cast.d;for(const r of cast.hits){let height=W*.1*r.b.height/r.d,bottom=H*.5+W*(.16+jump*.1)/r.d,top=bottom-height;ctx.fillStyle=r.side?r.b.color:shade(r.b.color,.76);ctx.fillRect(x,top,2,height);ctx.fillStyle='#574c50';ctx.fillRect(x,top,2,Math.max(3,height*.055));let hitpos=r.side?player.x+dx*r.d:player.y+dy*r.d;for(let row=0;row<3;row++){if(hitpos%1.4<.63){ctx.fillStyle=(Math.floor(hitpos)+row)%3===0?'#f3c77e':'#493f4a';ctx.fillRect(x,top+height*(.2+row*.22),2,height*.11);}}}
 }
 // Projected nameplates and objects are depth sorted.
 let sprites=[...buildings.filter(b=>!b.name.includes('TOWER')&&!b.name.includes('SPIRE')).map(b=>({x:b.x+b.w/2,y:b.y+b.h/2,type:'label',name:b.name,building:b})),...props,...students,...trees,...(!inCart()?[cart]:[]),...(!inSupercar()?[supercar]:[]),...fields.map(f=>({x:f.x+f.w/2,y:f.y+f.h/2,type:'fieldlabel',name:f.name})),...guards.map(g=>({...g,type:'guard'})),...particles.map(p=>({...p,type:'particle'}))].map(o=>({o,p:project(o.x,o.y,o.type==='label'?7:o.type==='fieldlabel'?.2:o.z||0)})).filter(s=>s.p).sort((a,b)=>b.p.d-a.p.d);
 for(const {o,p} of sprites){let sx=Math.round(p.x);if(sx<0||sx>=W)continue;if(o.type==='label'||o.type==='fieldlabel'){if(p.d>32)continue;if(o.type==='label'&&ray(Math.cos(player.a)-Math.sin(player.a)*(p.x/W-.5)/.75,Math.sin(player.a)+Math.cos(player.a)*(p.x/W-.5)/.75).b!==o.building)continue;if(o.type==='fieldlabel'&&p.d>(depth[sx]||80))continue;ctx.font=`bold ${Math.max(9,Math.min(14,p.s*.42))}px Arial`;ctx.textAlign='center';let tw=ctx.measureText(o.name).width;ctx.fillStyle='#2c2436d9';ctx.fillRect(p.x-tw/2-7,p.y-18,tw+14,23);ctx.fillStyle='#f6dfb7';ctx.fillText(o.name,p.x,p.y-3);continue;}
 if(p.d>(depth[sx]||80)+.4)continue;let s=p.s;if(o.type==='guard'||o.type==='student'){ctx.fillStyle=o.type==='student'?o.color:'#242e4b';ctx.fillRect(p.x-s*.3,p.y-s*1.5,s*.6,s*1.1);ctx.fillStyle='#d6a37e';ctx.fillRect(p.x-s*.23,p.y-s*1.95,s*.46,s*.45);ctx.fillStyle='#172038';ctx.fillRect(p.x-s*.32,p.y-s*2,s*.64,s*.18);ctx.fillStyle='#edce76';ctx.fillRect(p.x+s*.08,p.y-s*1.3,s*.1,s*.14);ctx.fillStyle='#202035';ctx.fillRect(p.x-s*.26,p.y-s*.4,s*.19,s*.5);ctx.fillRect(p.x+s*.07,p.y-s*.4,s*.19,s*.5);}
 else if(o.type==='tree'){ctx.fillStyle='#69503c';ctx.fillRect(p.x-s*.09,p.y-s*1.5,s*.18,s*1.5);ctx.fillStyle='#324f40';ctx.beginPath();ctx.arc(p.x,p.y-s*2,s*.9,0,TAU);ctx.fill();ctx.fillStyle='#4c6950';ctx.beginPath();ctx.arc(p.x-s*.2,p.y-s*2.2,s*.65,0,TAU);ctx.fill();}
 else if(o.type==='supercar'){ctx.fillStyle='#98b541';ctx.fillRect(p.x-s,p.y-s*.65,s*2,s*.45);ctx.fillStyle='#303b45';ctx.fillRect(p.x-s*.57,p.y-s*.92,s*1.05,s*.33);}
 else if(o.type==='cart'){ctx.fillStyle='#252a32';ctx.fillRect(p.x-s*.9,p.y-s*.25,s*.45,s*.4);ctx.fillRect(p.x+s*.45,p.y-s*.25,s*.45,s*.4);ctx.fillStyle='#77d0c4';ctx.fillRect(p.x-s,p.y-s*.75,s*2,s*.65);ctx.fillStyle='#fff2cf';ctx.fillRect(p.x-s*1.05,p.y-s*1.65,s*2.1,s*.12);ctx.fillStyle='#52483e';ctx.fillRect(p.x-s*.85,p.y-s*1.55,s*.08,s*.8);ctx.fillRect(p.x+s*.77,p.y-s*1.55,s*.08,s*.8);}
 else if(o.type==='particle'){ctx.fillStyle='#f2c774';ctx.fillRect(p.x,p.y,s*.15,s*.15)}else{let ready=o.ready<=elapsed;ctx.globalAlpha=ready?1:.28;if(ready){ctx.strokeStyle='#f8d484';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,s*.65,s*.18,0,0,TAU);ctx.stroke();}if(o.type==='speaker'){ctx.fillStyle='#25222e';ctx.fillRect(p.x-s*.42,p.y-s*1.3,s*.84,s*1.3);ctx.strokeStyle='#c47ce7';for(let i=0;i<2;i++){ctx.beginPath();ctx.arc(p.x,p.y-s*(.36+i*.58),s*.23,0,TAU);ctx.stroke();}}else if(o.type==='cone'){ctx.fillStyle='#ff8154';ctx.beginPath();ctx.moveTo(p.x,p.y-s*1.1);ctx.lineTo(p.x-s*.4,p.y);ctx.lineTo(p.x+s*.4,p.y);ctx.fill();ctx.fillStyle='#f7e2bd';ctx.fillRect(p.x-s*.2,p.y-s*.5,s*.4,s*.12);}else{ctx.fillStyle='#845b48';ctx.fillRect(p.x-s*.6,p.y-s*.6,s*1.2,s*.12);for(let i=-1;i<2;i++){ctx.fillStyle='#d94e5a';ctx.fillRect(p.x+i*s*.31-s*.11,p.y-s*.95,s*.23,s*.32);ctx.fillStyle='#fff1d7';ctx.fillRect(p.x+i*s*.31-s*.13,p.y-s*.96,s*.27,s*.05);}}ctx.globalAlpha=1;}}
 // Vehicle dashboard replaces the held cup while driving.
 if(driving){ctx.fillStyle='#222633';ctx.fillRect(0,H*.83,W,H*.17);ctx.strokeStyle='#8f9198';ctx.lineWidth=13;ctx.beginPath();ctx.arc(W*.5,H*.96,W*.12,Math.PI,TAU);ctx.stroke();ctx.fillStyle='#7ce2ca';ctx.font='bold 15px monospace';ctx.textAlign='center';ctx.fillText(Math.round(Math.abs(velocity)*WORLD_SCALE*2.237)+' MPH',W*.5,H*.92);minimap();return;}
 // Held cup.
 ctx.save();ctx.translate(W*.69,H+Math.sin(elapsed*8)*3);ctx.rotate(throwFlash>0?-.7:-.12);ctx.fillStyle='#bf8469';ctx.fillRect(-24,-100,65,160);ctx.fillStyle='#bd354c';ctx.beginPath();ctx.moveTo(-55,-185);ctx.lineTo(38,-185);ctx.lineTo(24,-75);ctx.lineTo(-39,-75);ctx.fill();ctx.fillStyle='#f7e6cb';ctx.fillRect(-59,-192,101,12);ctx.restore();minimap();}
function shade(hex,k){let n=parseInt(hex.slice(1),16);return `rgb(${(n>>16)*k},${((n>>8)&255)*k},${(n&255)*k})`}
function minimap(){mc.clearRect(0,0,230,230);const k=Math.min(8.3,200/(MAP_BOUNDS.maxX-MAP_BOUNDS.minX)),viewHeight=184/k,top=Math.max(MAP_BOUNDS.minY,Math.min(MAP_BOUNDS.maxY-viewHeight,player.y-viewHeight/2)),ox=10+(210-(MAP_BOUNDS.maxX-MAP_BOUNDS.minX)*k)/2-MAP_BOUNDS.minX*k,oy=30-top*k;mc.fillStyle='#eee0c2';mc.font='bold 9px Arial';mc.fillText('ROSE HILL / CENTRAL CAMPUS',10,14);mc.fillStyle='#4b6248';mc.fillRect(10,23,210,193);mc.save();mc.beginPath();mc.rect(10,23,210,193);mc.clip();
 for(const f of fields){mc.fillStyle=f.color;mc.fillRect(ox+f.x*k,oy+f.y*k,f.w*k,f.h*k)}
 for(const r of roads){mc.strokeStyle='#b4a58d';mc.lineWidth=r.w*k;mc.beginPath();mc.moveTo(ox+r.a.x*k,oy+r.a.y*k);mc.lineTo(ox+r.b.x*k,oy+r.b.y*k);mc.stroke();}
 for(const b of buildings){mc.fillStyle='#d5b292';mc.fillRect(ox+b.x*k,oy+b.y*k,b.w*k,b.h*k)}
 for(const p of props){if(p.ready>elapsed||(p.missionCone&&!missionConesActive()))continue;mc.fillStyle=p.type==='speaker'?'#ca8ef5':'#ffd573';mc.fillRect(ox+p.x*k-2,oy+p.y*k-2,4,4)}
 for(const g of guards){mc.fillStyle='#ff736b';mc.beginPath();mc.arc(ox+g.x*k,oy+g.y*k,2.5,0,TAU);mc.fill();if(g.search>0&&g.last){mc.strokeStyle='#ff736b88';mc.lineWidth=1;mc.beginPath();mc.arc(ox+g.last.x*k,oy+g.last.y*k,12,0,TAU);mc.stroke();}}
 for(const [i,d] of storyDefinitions.entries()){const pos=contactPosition(d.id);mc.fillStyle=story(d.id).status==='resolved'?'#a7b9ad':'#eda7d1';mc.beginPath();mc.arc(ox+pos.x*k,oy+pos.y*k,3,0,TAU);mc.fill();mc.font='bold 7px Arial';mc.fillText(['W','P','H','V'][i],ox+pos.x*k+4,oy+pos.y*k);}
 const stand=window.activityAPI?.view().coffeeStand;if(stand){mc.fillStyle='#ffd27d';mc.font='bold 10px Arial';mc.fillText('$',ox+stand.x*k-2,oy+stand.y*k+3);}
 const wp=missionWaypoint();if(wp&&wp.kind!=='hide'){mc.strokeStyle='#ff7cbd';mc.lineWidth=2;mc.beginPath();mc.arc(ox+wp.x*k,oy+wp.y*k,4+Math.sin(elapsed*4),0,TAU);mc.stroke();const routeKey=Math.floor(player.x)+','+Math.floor(player.y)+','+wp.x+','+wp.y;if(routeKey!==mapRouteKey){mapRouteKey=routeKey;mapRoute=route(player,wp);}const path=mapRoute;if(path.length){mc.strokeStyle='#e9a2cfaa';mc.lineWidth=1.5;mc.beginPath();mc.moveTo(ox+player.x*k,oy+player.y*k);for(const n of path)mc.lineTo(ox+n.x*k,oy+n.y*k);mc.stroke();}}
 mc.fillStyle='#f2ce8e';mc.font='bold 8px Arial';mc.fillText('F',ox+professorSpot.x*k-2,oy+professorSpot.y*k+3);
 const duane=landmarks.find(p=>p.id==='duane');mc.fillStyle='#fff1d6';mc.fillText('D',ox+duane.x*k-2,oy+duane.y*k+3);
 mc.fillStyle='#77f5e2';mc.fillRect(ox+cart.x*k-3,oy+cart.y*k-3,6,6);
 mc.fillStyle='#d6ee86';mc.beginPath();mc.arc(ox+supercar.x*k,oy+supercar.y*k,3,0,TAU);mc.fill();
 mc.font='7px Arial';mc.fillStyle='#fff5df';for(const [text,x,y] of [['EDDIE’S',1120,717],['KEATING',1260,733],['HUGHES',962,632],['DEALY',941,772],['FREEMAN',1095,851],['CUNNIFFE',859,690],['McSHANE',1024,432],['GYM',1163,485]]){const p=P(x,y);mc.fillText(text,ox+p.x*k,oy+p.y*k);}
 for(const p of landmarks){mc.fillStyle=p.id==='ram'?'#f7d28c':'#a8d4d0';mc.beginPath();mc.arc(ox+p.x*k,oy+p.y*k,2.5,0,TAU);mc.fill();if(p.id==='ram'){mc.font='6px Arial';mc.fillText('RAM',ox+p.x*k+3,oy+p.y*k);}}
 mc.save();mc.translate(ox+player.x*k,oy+player.y*k);mc.rotate(player.a);mc.fillStyle='#fff';mc.beginPath();mc.moveTo(6,0);mc.lineTo(-4,-3);mc.lineTo(-4,3);mc.fill();mc.restore();mc.restore();}
let previous=performance.now();function frame(now){let dt=Math.min((now-previous)/1000,.05);previous=now;update(dt);window.campusAudio?.update(running,inSupercar(),Math.abs(velocity),!!(keys.KeyW||keys.KeyS||keys.ArrowUp||keys.ArrowDown||window.touchControls?.axes.forward),!!keys.Space);render();window.touchControls?.render(running,driving);requestAnimationFrame(frame)}requestAnimationFrame(frame);

// Rendering reads the live simulation, keeping mechanics independent of the 3D engine.
window.campusState=()=>{
 const activity=window.activityAPI?.view()||null;
 return {touch:hasTouchControls(),scale:WORLD_SCALE,bounds:MAP_BOUNDS,landmarks,buildings,fields,roads,trees,replyAllSites,props,guards,students,cart,supercar,vehicleId,player,driving,velocity,cartSteer:Math.max(-1,Math.min(1,Number(!!(keys.KeyD||keys.ArrowRight))-Number(!!(keys.KeyA||keys.ArrowLeft))+(window.touchControls?.axes.side||0))),cartBraking:!!keys.Space,jump,elapsed,heat,running,thirdPerson,cameraDistance,cameraSolid:blocked,throwFlash,particles,cupShots,combat:window.combatAPI?.view()||null,life:window.lifeAPI?.view()||null,social:window.socialAPI?.view()||null,waypoint:missionWaypoint(),activity,pickupKind:tracked==='walk'?'shoe':'usb',contacts:[...storyDefinitions.map(d=>({...contactPosition(d.id),id:d.id})),{...supportPosition(),id:'sam'},{...nicoSpot,id:'nico'},{...professorSpot,id:'professor'},{...replyAllSites.pickup,id:'bea',hidden:activity?.id!=='receipts'||activity.stage!=='pickup'}],dialogueSpeaker,missionConeActive:missionConesActive()};
};

$('#help-toggle').onclick=toggleHelp;$('#help-panel').hidden=!helpVisible;$('#help-toggle').textContent=helpVisible?'HIDE CONTROLS [C]':'CONTROLS [C]';document.body.classList.toggle('controls-open',helpVisible);

$('#journal-toggle').onclick=toggleJournal;$('#journal-close').onclick=toggleJournal;$('#dialogue-close').onclick=leaveConversation;
