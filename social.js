'use strict';
// Optional free-roam gestures. Menus pause the same simulation clock as jobs.
(() => {
 let menu=false,emote=null,replyIndex=0,nextRoast=0,district='',bannerUntil=0;
 const distance=n=>Math.hypot(n.x-player.x,n.y-player.y);
 const nearest=()=>students.filter(n=>distance(n)<2.6&&lineClear(player,n)).sort((a,b)=>distance(a)-distance(b))[0];
 const replies={wave:['What’s up! You coming to the gym?','If this is about the group project, I’m unavailable.','Nice fit. Suspiciously employable.','See you at McShane. Bring your own bad decisions.'],roast:['Bro dressed for a hostile takeover of Starbucks.','Your LinkedIn has more personality than that insult.','Talk shit after you finish your discussion post.','You look like your dad owns the group project.']};
 function react(text){window.activityAPI?.react(text);toast(text);}
 function crowd(action,seconds=7){for(const n of students)if(distance(n)<2.6&&lineClear(player,n)){n.mood=action;n.moodUntil=elapsed+seconds;n.faceX=player.x;n.faceY=player.y;}}
 function perform(action){if(!started||(!running&&!menu))return false;if(driving){toast('Park and step out first. The cart is not a dance floor.');return false;}
  if(action==='dance'&&emote?.action==='dance'){emote=null;toast('Back to roaming.');return true;}
  if(!['wave','roast','dance','pose'].includes(action))return false;
  const target=nearest();if(['wave','roast'].includes(action)&&!target){toast('Get closer to a student first.');return false;}
  if(action==='roast'&&elapsed<nextRoast){toast('Let that insult breathe for a second.');return false;}
  emote={action,until:elapsed+(action==='dance'?12:action==='pose'?6:3),x:player.x,y:player.y};
  if(target&&action!=='dance'){player.a=Math.atan2(target.y-player.y,target.x-player.x);target.mood=action==='roast'?'shrug':'wave';target.moodUntil=elapsed+4;target.faceX=player.x;target.faceY=player.y;}
  if(action==='wave'||action==='roast'){const roast={finance:['Everyone’s a founder until their dad stops replying.','Your rizz has an unpaid internship.'],prep:['Your outfit says country club. Your behavior says guest pass.','Legacy admission is not a fucking personality.'],party:['You look like you say “circle back” during sex.','Please stop networking at the afterparty. It is a public service.'],athlete:['You warmed up for that insult and still pulled something.','Your personal brand needs a concussion protocol.']};const localGreetings={
   'DUANE LIBRARY WALK':['Keep it down. Some of us are trying to get rejected from internships in peace.','I came for office hours. My ex came with a case study. Neither of us is getting credit.'],
   'HUGHES / GABELLI':['If one more guy calls a situationship a strategic partnership, I’m transferring.','The vest says finance. The bank account says Venmo me for the Uber.'],
   'EDWARDS PARADE':['This lawn is the only thing on campus that can actually touch grass.','I’m here to tan and ignore a Google Doc. Please respect my process.']
  };
  const lines=action==='roast'?(roast[target?.faction]||replies.roast):(localGreetings[district]||replies.wave);react(lines[replyIndex++%lines.length]);if(action==='roast'){heat=Math.min(100,heat+8);nextRoast=elapsed+6;}}
  else if(action==='dance'){crowd('dance');react('A dance floor is a state of mind. G or move to stop.');}
  else react('Updating the personal brand. No one asked.');return true;
 }
 function toggle(){if(!started||dialogueOpen||window.activityAPI?.menuOpen()||!$('#journal').hidden||window.presentationAPI?.isOpen?.()||window.lifeAPI?.menuOpen())return;if(!menu&&!running)return;menu=!menu;$('#social-panel').hidden=!menu;keys={};running=!menu;if(menu)document.exitPointerLock?.();else canvas.requestPointerLock?.()?.catch?.(()=>{});}
 function pick(action){if(!menu)return;toggle();perform(action);}
 function handleKey(e){if(menu){if(e.code==='Tab'||e.code==='Escape'){e.preventDefault();toggle();}else if(/^Digit[1-4]$/.test(e.code)){e.preventDefault();pick(['wave','roast','dance','pose'][Number(e.code.slice(-1))-1]);}return true;}if(e.code==='Tab'&&started&&running){e.preventDefault();if(!e.repeat)toggle();return true;}if(e.code==='KeyG'&&running&&!e.repeat){perform('dance');return true;}if(e.code==='KeyT'&&running&&!e.repeat){perform('wave');return true;}return false;}
 const zones=[['ROSE HILL GYM',1190,546,3.1],['MCSHANE CAMPUS CENTER',1080,525,4],['HUGHES / GABELLI',995,672,2.5],['DEALY / STARBUCKS',1030,778,2.2],['CUNNIFFE COURT',965,701,2.8],['DUANE LIBRARY WALK',903,904,3.3],['FREEMAN WALK',1135,810,2.7],['KEATING TERRACE',1220,722,2.7]];
 function update(){if(emote&&(elapsed>=emote.until||driving||Math.hypot(player.x-emote.x,player.y-emote.y)>.035||jump>.05))emote=null;const zone=zones.filter(([,x,y,r])=>distance(P(x,y))<r).sort((a,b)=>distance(P(a[1],a[2]))-distance(P(b[1],b[2])))?.[0]?.[0]||'EDWARDS PARADE';if(zone!==district){district=zone;bannerUntil=elapsed+3.8;$('#district-name').textContent=zone;}$('#district-banner').hidden=elapsed>bannerUntil;}
 function reset(){menu=false;emote=null;nextRoast=0;replyIndex=0;district='';bannerUntil=0;$('#social-panel').hidden=true;$('#district-banner').hidden=true;}
 window.socialAPI={perform,toggle,handleKey,update,reset,view:()=>emote,menuOpen:()=>menu,cancel:()=>{emote=null;},crowd,celebrate:()=>{emote={action:'dance',until:elapsed+4,x:player.x,y:player.y};crowd('dance',6);}};
 $('#social-toggle').onclick=toggle;$('#social-close').onclick=toggle;
 for(const action of ['wave','roast','dance','pose'])document.querySelector('[data-action="'+action+'"]').onclick=()=>pick(action);
 reset();
})();
