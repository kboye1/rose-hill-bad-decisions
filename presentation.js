'use strict';
// Loading art, cosmetic player presets and a wardrobe that pauses the live simulation.
(() => {
 const key='roseHillStyle.v1';
 const presets=[
  {id:'finance',gender:'male',femaleName:'Chloe',femaleHair:'long',femaleTitle:'GABELLI FINANCE QUEEN',femaleBio:'Calls the party a networking event. Her vest has never seen an office. Already endorsed herself for leadership.',title:'GABELLI FINANCE BRO',bio:'Calls the party a networking event. His vest has never seen an office. “My dad knows a guy” is apparently a business model.',nickname:'Chad',outfit:'vest',build:'regular',skin:'#d3a17e',hair:'swept',hairColor:'#30251e',accessory:'shades',top:'#711d3b',pants:'#26394d',shoes:'#eee7d8'},
  {id:'prep',gender:'male',femaleName:'Blair',femaleHair:'long',femaleTitle:'PREP-SCHOOL ROYALTY',femaleBio:'A fictional adult prep-school socialite who treats Eddie’s like a private country club. Her family name is apparently a campus credential.',title:'PREP-SCHOOL ROYALTY',bio:'A fictional adult Prep alumnus who treats Eddie’s like a private country club. Has a blazer, an opinion and absolutely no inside voice.',nickname:'Preston',outfit:'blazer',build:'slim',skin:'#e2b698',hair:'swept',hairColor:'#a17a44',accessory:'glasses',top:'#25394e',pants:'#c5b28b',shoes:'#74563e'},
  {id:'afterparty',gender:'male',femaleName:'Riley',femaleHair:'curls',femaleTitle:'AFTERPARTY REGULAR',femaleBio:'Knows every gathering, owes three people a charger and has described 2 p.m. as “early.” Somehow still makes the presentation.',title:'AFTERPARTY REGULAR',bio:'Knows every gathering, owes three people a charger and has described 2 p.m. as “early.” Somehow still makes the presentation.',nickname:'Remy',outfit:'hoodie',build:'regular',skin:'#80513b',hair:'curls',hairColor:'#191b1e',accessory:'beanie',top:'#665c79',pants:'#45444a',shoes:'#eee7d8'},
  {id:'legacy',femaleOnly:true,fallback:'prep',femaleName:'Sloane',femaleHair:'bob',
   femaleTitle:'LEGACY WITH RECEIPTS',femaleBio:'Her mother calls it generational stewardship. Sloane calls it a free ride to Arthur Avenue. Keeps screenshots of everything.',
   outfit:'cardigan',build:'slim',skin:'#ae7654',hairColor:'#30251e',accessory:'pearls',top:'#224d42',pants:'#e0d8c4',shoes:'#74563e'},
  {id:'pr',femaleOnly:true,fallback:'afterparty',femaleName:'Jade',femaleHair:'halfup',
   femaleTitle:'AFTERPARTY PUBLICIST',femaleBio:'Can get you into the afterparty and out of the group chat. If anyone asks, last night was a soft launch.',
   outfit:'moto',build:'regular',skin:'#d3a17e',hairColor:'#723329',accessory:'hoops',top:'#303237',pants:'#45444a',shoes:'#292a2c'},
  {id:'varsity',femaleOnly:true,fallback:'finance',femaleName:'Tess',femaleHair:'braids',
   femaleTitle:'VARSITY MENACE',femaleBio:'Makes the 6 a.m. lift and the 2 a.m. pizza run. Still has better time management than your entire capstone team.',
   outfit:'track',build:'broad',skin:'#603f30',hairColor:'#191b1e',accessory:'headband',top:'#711d3b',pants:'#26394d',shoes:'#eee7d8'}
 ];
 const allowed={gender:['male','female'],outfit:['vest','blazer','hoodie','rugby','cardigan','moto','track'],build:['slim','regular','broad'],skin:['#e2b698','#d3a17e','#ae7654','#80513b','#603f30'],hair:['swept','short','curls','long','shaved','bob','ponytail','braids','halfup'],hairColor:['#191b1e','#30251e','#61452e','#a17a44','#723329','#cfab73'],accessory:['none','shades','glasses','cap','beanie','hoops','pearls','headband'],top:['#711d3b','#25394e','#536c60','#d0ba8e','#665c79','#303237','#224d42','#946473'],pants:['#26394d','#c5b28b','#45444a','#e0d8c4'],shoes:['#eee7d8','#292a2c','#74563e']};
 function presetLook(p,gender='male'){
  if(gender==='male'&&p.femaleOnly)p=presets.find(candidate=>candidate.id===p.fallback);
  return {...p,gender,nickname:gender==='female'?p.femaleName:p.nickname,hair:gender==='female'?p.femaleHair:p.hair};
 }
 function persona(value){const p=presets.find(p=>p.id===value.id)||presets[0];return {title:value.gender==='female'?p.femaleTitle:p.title,bio:value.gender==='female'?p.femaleBio:p.bio};}
 function normalize(value){const v=value&&typeof value==='object'?value:{},base=presetLook(presets.find(p=>p.id===v.id)||presets[0],v.gender==='female'?'female':'male'),out={id:base.id,nickname:typeof v.nickname==='string'?v.nickname.replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,18):base.nickname};if(!out.nickname)out.nickname=base.nickname;for(const name of Object.keys(allowed))out[name]=allowed[name].includes(v[name])?v[name]:base[name];return out;}

 let look=normalize(presets[0]),draft=null,open=false,resume=false,rotation=.25,portrait=false,loading=true,ready=false,failed=false;
 try{look=normalize(JSON.parse(localStorage.getItem(key)||'null'));}catch{}
 const cards=[
  {kicker:'ROSE HILL / ARRIVAL',title:'HIGHER EDUCATION.\nLOWER STANDARDS.',tip:'No class. All connections. P opens your phone. X punches, Z blocks. Bad decisions have consequences.'},
  {kicker:'EDWARDS PARADE / KEATING HALL',title:'THE WALK UP.',tip:'Climb the Terrace of the Presidents or look for the After Hours flyer. J opens quick jobs.',art:'loading-keating.jpg',focus:70},
  {kicker:'HUGHES HALL / CUNNIFFE COURTYARD',title:'MEET BY THE RAM.',tip:'Look for the bronze ram outside Hughes. E reads the plaque. Elliot is nearby if you want the mixer job.',art:'loading-hughes.jpg',focus:78},
  {kicker:'ROSE HILL GYM / GAME NIGHT',title:'MAKE AN ENTRANCE.',tip:'Follow the north walk to the gym steps. Ram Rally starts at McShane and stops here before Eddie’s.',art:'loading-gym.jpg',focus:64},
  {kicker:'GABELLI / VERY IMPORTANT BUSINESS',title:'HE’S NOT LATE.\nHE’S NETWORKING.',tip:'Chad calls borrowing a campus cart an “asset acquisition.” F gets you in. Shift boosts it.',focus:65},
  {kicker:'PREP-SCHOOL ROYALTY / ALUMNI ENERGY',title:'OLD MONEY.\nNEW PROBLEMS.',tip:'Preston thinks Eddie’s has a dress code. U opens your wardrobe. There is no dress code.',focus:90},
  {kicker:'HUGHES / GROUP PROJECT SURVIVORS',title:'THREE TEAMMATES.\nONE WORKING BRAIN.',tip:'Maya has the plan. Nico has screenshots. Find them near Hughes for The Presentation After the Party.',focus:35}
 ];
 let card=0;try{const storedCard=Number(localStorage.getItem('roseHillLoadingCard'));card=Number.isFinite(storedCard)?Math.abs(Math.floor(storedCard))%cards.length:0;localStorage.setItem('roseHillLoadingCard',String((card+1)%cards.length));}catch{}
 function renderCard(){
  const current=cards[card],art=$('#loading-art');
  art.style.backgroundImage=current.art?`url('./assets/${current.art}'), url('./assets/after-hours-loading.png')`:'';
  art.style.backgroundPosition=`${current.focus??50}% center`;
  $('#loading-screen').dataset.card=String(card);
  $('#loading-count').textContent=`${card+1} / ${cards.length}`;
  $('#loading-kicker').textContent=current.kicker;
  $('#loading-title').textContent=current.title;
  $('#loading-tip').textContent=current.tip;
 }
 function stepCard(direction){card=(card+direction+cards.length)%cards.length;renderCard();}
 function modalFocus(id){for(const child of Array.from(document.body.children||[]))if(child.tagName!=='SCRIPT')child.inert=!!id&&child.id!==id;}
 function updateTag(){$('#player-tag').textContent=look.nickname.toUpperCase()+' / '+persona(look).title;}
 function fill(){for(const name of Object.keys(allowed))$('#style-'+name).value=draft[name];$('#style-name').value=draft.nickname;const preset=presets.find(p=>p.id===draft.id);$('#style-persona').textContent=persona(draft).title;$('#style-description').textContent=persona(draft).bio;$('#style-number').textContent=String(presets.indexOf(preset)+1).padStart(2,'0');renderPresets();}
 function renderPresets(){const list=$('#style-presets');list.replaceChildren();presets.filter(p=>draft.gender==='female'||!p.femaleOnly).forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.textContent='0'+(i+1)+' / '+persona({id:p.id,gender:draft.gender}).title;b.setAttribute('aria-pressed',String(draft.id===p.id));b.onclick=()=>{draft=normalize(presetLook(p,draft.gender));rotation=.25;fill();};list.appendChild(b);});}
 function openStyle(){if(loading||dialogueOpen||window.lifeAPI?.menuOpen()||window.socialAPI?.menuOpen()||window.activityAPI?.menuOpen()||!$('#journal').hidden)return;resume=running;running=false;keys={};open=true;draft={...look};rotation=.25;portrait=false;$('#style-zoom').textContent='FACE VIEW';$('#style-screen').hidden=false;modalFocus('style-screen');$('#style-status').textContent='Saved on this computer. Change your look any time with U.';fill();document.exitPointerLock?.();$('#style-name').focus();}
 function closeStyle(save=false){if(!open)return;if(save){look=normalize(draft);try{localStorage.setItem(key,JSON.stringify(look));}catch{}updateTag();}open=false;draft=null;$('#style-screen').hidden=true;modalFocus(null);keys={};running=resume;if(running)captureMouse();}
 function readyCampus(){ready=true;$('#loading-stage').textContent='CAMPUS READY · ALL ASSETS LOCAL';$('#loading-progress').value=100;$('#loading-continue').disabled=false;$('#loading-continue').textContent='LET’S GO →';$('#loading-continue').focus();}
 function closeLoading(){if(!ready&&!failed)return;loading=false;$('#loading-screen').hidden=true;modalFocus(null);$('#start').focus();}
 function gallery(){if(open||loading)return;loading=true;$('#loading-screen').hidden=false;modalFocus('loading-screen');$('#loading-continue').focus();}
 function fail(message){failed=true;$('#loading-stage').textContent=message;$('#loading-continue').disabled=false;$('#loading-continue').textContent='BACK TO MENU';}
 function handleKey(e){if(open){if(e.code==='Escape'){e.preventDefault();closeStyle(false);}return true;}if(loading){if(e.code==='ArrowLeft'||e.code==='ArrowRight'){e.preventDefault();stepCard(e.code==='ArrowLeft'?-1:1);}else if(e.code==='Escape'||(e.code==='Enter'&&!['loading-prev','loading-next'].includes(e.target?.id))){e.preventDefault();closeLoading();}return true;}if(e.code==='KeyU'&&!e.repeat&&!e.ctrlKey&&!e.metaKey){e.preventDefault();openStyle();return true;}return false;}
 $('#style-form').onsubmit=e=>{e.preventDefault();closeStyle(true);};$('#style-cancel').onclick=()=>closeStyle(false);$('#customize-start').onclick=openStyle;$('#wardrobe-toggle').onclick=openStyle;$('#style-left').onclick=()=>rotation-=Math.PI/4;$('#style-right').onclick=()=>rotation+=Math.PI/4;
 $('#style-zoom').onclick=()=>{portrait=!portrait;$('#style-zoom').textContent=portrait?'FULL OUTFIT':'FACE VIEW';};
 for(const name of Object.keys(allowed))$('#style-'+name).onchange=e=>{if(!draft)return;if(name==='gender'){const p=presets.find(p=>p.id===draft.id),old=presetLook(p,draft.gender),next=presetLook(p,e.target.value);if(draft.nickname===old.nickname)draft.nickname=next.nickname;if(draft.hair===old.hair)draft.hair=next.hair;
  if(draft.id!==next.id){
   for(const option of Object.keys(allowed)){
    if(draft[option]===old[option])draft[option]=next[option];
   }
   draft.id=next.id;
  }
  draft.gender=e.target.value;fill();}else draft[name]=e.target.value;};$('#style-name').oninput=e=>{if(draft)draft.nickname=e.target.value;};
 $('#loading-continue').onclick=closeLoading;$('#loading-next').onclick=()=>stepCard(1);$('#loading-prev').onclick=()=>stepCard(-1);$('#art-gallery').onclick=gallery;
 $('#loading-progress').value=45;$('#loading-stage').textContent='PROFILE LOADED · BUILDING 3D CAMPUS…';renderCard();updateTag();modalFocus('loading-screen');
 window.presentationAPI={appearance:()=>({...look}),preview:()=>open?{...draft}:null,isOpen:()=>open,isLoading:()=>loading,rotation:()=>rotation,portraitView:()=>portrait,open:openStyle,close:closeStyle,ready:readyCampus,fail,handleKey,normalize};
})();
