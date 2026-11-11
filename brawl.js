'use strict';
// Non-graphic sandbox scuffles. Everyone gets up again; stories survive a defeat.
(() => {
 let health=100,stamina=100,swing=null,nextSwing=0,lastHurt=-99,hurtFlash=0,target=null,targetUntil=0,defeatedUntil=0,blocking=false,hand=0;
 const distance=n=>Math.hypot(n.x-player.x,n.y-player.y),down=n=>n.downUntil>elapsed;
 function available(){return running&&!driving&&!defeatedUntil&&!dialogueOpen&&!window.lifeAPI?.menuOpen();}
 function enemyList(){return [...students,...guards];}
 function findTarget(){return enemyList().filter(n=>!down(n)&&distance(n)<(easy()?.42:.34)&&Math.abs(angleDiff(Math.atan2(n.y-player.y,n.x-player.x),player.a))<.95&&lineClear(player,n)).sort((a,b)=>distance(a)-distance(b))[0];}
 function punch(){if(!available()||elapsed<nextSwing||stamina<12)return false;window.socialAPI?.cancel();blocking=false;stamina-=12;nextSwing=elapsed+.48;swing={started:elapsed,hit:false,hand:hand++%2};window.activityAPI?.effect('swing');return true;}
 function challenge(n){if(!n||down(n))return;n.attackAt=n.fighting?n.attackAt:elapsed+(easy()?.9:.65);n.fighting=true;n.angryUntil=elapsed+18;n.hp??=100;target=n;targetUntil=elapsed+6;}
 function hit(n){const guard=guards.includes(n);n.hp=(n.hp??(guard?160:100))-(easy()?40:32);n.stunUntil=elapsed+.3;if(!n.assaulted){trust--;n.assaulted=true;}target=n;targetUntil=elapsed+5;invulnerable=Math.max(invulnerable,.8);heat=Math.min(100,heat+(guard?42:20));
  const a=Math.atan2(n.y-player.y,n.x-player.x);move(n,Math.cos(a)*.12,Math.sin(a)*.12);n.faceX=player.x;n.faceY=player.y;n.hitAt=elapsed;
  window.activityAPI?.effect('hit');window.lifeAPI?.onTrouble(n);toast(guard?'VERY BAD CAREER MOVE':n.hp<=0?'EGO LIQUIDATED':'HOSTILE TAKEOVER · CONNECTED');
  for(const bystander of students)if(bystander!==n&&Math.hypot(bystander.x-n.x,bystander.y-n.y)<2.8){if(bystander.brave){bystander.mood='phone';bystander.moodUntil=elapsed+5;bystander.faceX=player.x;bystander.faceY=player.y;}else bystander.panicUntil=elapsed+6;}
  if(n.hp<=0){n.downUntil=elapsed+9;n.fighting=false;n.hp=0;window.lifeAPI?.onKnockdown(n);window.activityAPI?.react(guard?'Someone has made a catastrophically bad decision.':'He’s fine. His personal brand needs a minute.');}
  else if(!guard&&n.brave)challenge(n);else if(!guard){n.panicUntil=elapsed+9;n.fighting=false;}
 }
 function damage(amount){if(defeatedUntil||elapsed-lastHurt<.65)return;const guarded=blocking&&stamina>=8;health=Math.max(0,health-(guarded?amount*.2:amount));if(guarded)stamina=Math.max(0,stamina-8);lastHurt=elapsed;window.activityAPI?.spill(guarded?5:20);hurtFlash=guarded?.18:.55;window.activityAPI?.effect(guarded?'block':'hit');toast(guarded?'BLOCKED · Z / RIGHT MOUSE':'WATCH THE BLAZER · Z TO BLOCK');
  if(health<=0){defeatedUntil=elapsed+2.5;player.downUntil=defeatedUntil;swing=null;blocking=false;keys={};window.activityAPI?.busted();window.lifeAPI?.fine(20,'Student Health called it “an avoidable fucking incident.”');}
 }
 function update(dt){hurtFlash=Math.max(0,hurtFlash-dt*1.7);blocking=available()&&!!(keys.KeyZ||keys.MouseRight)&&stamina>3&&!swing;
  if(swing&&elapsed-swing.started>.13&&!swing.hit){swing.hit=true;const victim=findTarget();if(victim)hit(victim);}if(swing&&elapsed-swing.started>.36)swing=null;
  stamina=Math.min(100,stamina+dt*(blocking?2:22));if(!defeatedUntil&&elapsed-lastHurt>6&&heat<15)health=Math.min(100,health+dt*5);
  for(const n of enemyList()){
   if(n.downUntil&&elapsed>=n.downUntil){n.downUntil=0;n.hp=100;n.stunUntil=elapsed+.8;n.fighting=false;n.panicUntil=elapsed+3;}
   if(!n.fighting||down(n)||n.stunUntil>elapsed)continue;if(driving||defeatedUntil||elapsed>n.angryUntil||distance(n)>6){n.fighting=false;continue;}
   n.a=Math.atan2(player.y-n.y,player.x-n.x);n.faceX=player.x;n.faceY=player.y;n.moodUntil=elapsed+.5;
   if(distance(n)>.27)move(n,Math.cos(n.a)*dt*(easy()?.48:.62),Math.sin(n.a)*dt*(easy()?.48:.62));
   if(distance(n)<.37&&elapsed>=(n.attackAt||0)&&lineClear(player,n)){n.attackAt=elapsed+(easy()?1.35:.95);n.punchAt=elapsed;damage(easy()?9:14);}
  }
  if(defeatedUntil&&elapsed>=defeatedUntil){defeatedUntil=0;player={...P(1118,741),a:-.18,pitch:.15};health=100;stamina=100;heat=0;invulnerable=5;for(const n of students)n.fighting=false;toast('BACK ON CAMPUS · SAME BAD JUDGMENT');}
  const nearby=findTarget();$('#combat-vitals').hidden=!started;$('#health-fill').style.width=health+'%';$('#stamina-fill').style.width=stamina+'%';$('#health-value').textContent=Math.ceil(health);$('#combat-hint').textContent=defeatedUntil?'TAKING A MINUTE':blocking?'GUARD UP':nearby?'X / CLICK · PUNCH · Z HOLD BLOCK':'X / CLICK PUNCH · Z BLOCK';
  $('#damage-flash').style.opacity=String(hurtFlash);$('#combat-stamp').hidden=!defeatedUntil;
  const shown=target&&elapsed<targetUntil&&distance(target)<5?target:nearby;$('#target-card').hidden=!shown;if(shown){$('#target-name').textContent=shown.name||(guards.includes(shown)?'CAMPUS SECURITY':'FELLOW BAD DECISION');$('#target-state').textContent=down(shown)?'EGO RECOVERY · GETS UP SHORTLY':shown.fighting?'WANTS A WORD WITH YOUR FACE':shown.faction?.toUpperCase()||'KEEP IT CIVIL';$('#target-fill').style.width=Math.max(0,shown.hp??100)+'%';}
 }
 function onBusted(){health=Math.max(health,65);defeatedUntil=0;blocking=false;swing=null;for(const n of students)n.fighting=false;window.lifeAPI?.fine(15,'Security: “This is a university, not your fucking bachelor party.”');}
 function reset(){health=100;stamina=100;swing=null;nextSwing=0;lastHurt=-99;hurtFlash=0;target=null;targetUntil=0;defeatedUntil=0;blocking=false;$('#combat-stamp').hidden=true;$('#damage-flash').style.opacity='0';}
 window.combatAPI={punch,damage,challenge,update,reset,onBusted,heal:()=>{health=100;stamina=100;},controls:n=>down(n)||n.stunUntil>elapsed||n.fighting,disabled:()=>!!defeatedUntil,view:()=>({health,stamina,blocking,swing:swing?{phase:(elapsed-swing.started)/.36,hand:swing.hand}:null,hurt:hurtFlash,down:!!defeatedUntil})};reset();
})();
