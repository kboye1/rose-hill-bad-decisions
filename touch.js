'use strict';
(() => {
 const query=new URLSearchParams(location.search);
 const phone=matchMedia('(pointer: coarse)').matches;
 let enabled=window.iosGame||(query.has('touch')?query.get('touch')!=='0':phone);
 const deck=$('#touch-deck'), stick=$('#touch-stick'), thumb=$('#touch-thumb');
 const axes={forward:0,side:0};
 let movePointer=null,lookPointer=null,lastX=0,lastY=0,controlsVisible=false,vehicleMode=false;
 const held=new Map();
 const keyboardLabels={
  'journal-toggle':['CONTACTS','CONTACTS & JOURNAL [B]'],
  'activity-toggle':['JOBS','QUICK JOBS [J]'],
  'wardrobe-toggle':['STYLE','PLAYER STYLE [U]'],
  'social-toggle':['SOCIAL','INTERACTION WHEEL [TAB]'],
  'phone-toggle':['PHONE','RAMPULSE PHONE [P]']
 };

 function releaseMove(){
  movePointer=null;
  axes.forward=axes.side=0;
  thumb.style.transform='translate(-50%,-50%)';
 }
 function releaseButtons(){
  for(const [button,{code}] of held){
   keys[code]=false;
   button.classList.remove('touch-held');
  }
  held.clear();
 }
 function clearControls(){
  releaseMove();
  releaseButtons();
  lookPointer=null;
 }
 function press(code){
  handleGameKey({code,repeat:false,preventDefault(){}});
 }
 function setMode(value){
  enabled=value;
  clearControls();
  document.body.classList.toggle('touch-mode',enabled);
  for(const [id,[touch,keyboard]] of Object.entries(keyboardLabels))$('#'+id).textContent=enabled?touch:keyboard;
  $('#touch-switch').textContent=enabled?'USE KEYBOARD CONTROLS':'USE TOUCH CONTROLS';
  $('#touch-switch').setAttribute('aria-pressed',String(enabled));
  $('#touch-guide').hidden=!enabled;
  $('#keyboard-guide').hidden=enabled;
  if(enabled&&document.pointerLockElement===canvas)document.exitPointerLock?.();
 }

 function aimStick(event){
  const bounds=stick.getBoundingClientRect(),reach=bounds.width*.35;
  const x=event.clientX-bounds.left-bounds.width/2,y=event.clientY-bounds.top-bounds.height/2;
  const distance=Math.hypot(x,y),limit=Math.min(distance,reach);
  const strength=Math.max(0,(limit/reach-.13)/.87);
  axes.side=distance?x/distance*strength:0;
  axes.forward=distance?-y/distance*strength:0;
  const scale=distance?limit/distance:0;
  thumb.style.transform='translate(calc(-50% + '+x*scale+'px),calc(-50% + '+y*scale+'px))';
 }
 stick.addEventListener('pointerdown',event=>{
  if(!controlsVisible||movePointer!==null||event.button!==0)return;
  event.preventDefault();
  movePointer=event.pointerId;
  stick.setPointerCapture(event.pointerId);
  aimStick(event);
 });
 stick.addEventListener('pointermove',event=>{
  if(event.pointerId===movePointer)aimStick(event);
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture']){
  stick.addEventListener(type,event=>{
   if(event.pointerId===movePointer)releaseMove();
  });
  canvas.addEventListener(type,event=>{
   if(event.pointerId===lookPointer)lookPointer=null;
  });
 }

 canvas.addEventListener('pointerdown',event=>{
  if(!controlsVisible||lookPointer!==null||event.button!==0)return;
  event.preventDefault();
  lookPointer=event.pointerId;
  lastX=event.clientX;lastY=event.clientY;
  canvas.setPointerCapture(event.pointerId);
 });
 canvas.addEventListener('pointermove',event=>{
  if(!controlsVisible||event.pointerId!==lookPointer)return;
  const dx=event.clientX-lastX,dy=event.clientY-lastY;
  lastX=event.clientX;lastY=event.clientY;
  if(!driving)player.a+=dx*.0095;
  player.pitch=Math.max(-.92,Math.min(.96,(player.pitch||0)-dy*.006));
 });

 for(const button of deck.querySelectorAll('[data-touch-key]')){
  const release=event=>{
   const action=held.get(button);
   if(!action||event.pointerId!==action.id)return;
   keys[action.code]=false;
   button.classList.remove('touch-held');
   held.delete(button);
  };
  if(button.hasAttribute('data-hold')){
   button.addEventListener('pointerdown',event=>{
    if(!controlsVisible||held.has(button)||event.button!==0)return;
    event.preventDefault();
    const code=button.dataset.touchKey;
    held.set(button,{id:event.pointerId,code});
    button.setPointerCapture(event.pointerId);
    button.classList.add('touch-held');
    press(code);
   });
   for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,release);
  }
  button.addEventListener('click',event=>{
   if(!controlsVisible||button.hasAttribute('data-hold')&&event.detail!==0)return;
   press(button.dataset.touchKey);
   keys[button.dataset.touchKey]=false;
  });
 }
 addEventListener('blur',clearControls);
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden)clearControls();
 });
 addEventListener('resize',clearControls);
 $('#phone-radio').onclick=toggleRadio;
 $('#phone-effects').onclick=()=>window.activityAPI?.toggleSound();
 const switchInput=$('#touch-switch');
 if(window.iosGame)switchInput.hidden=true;
 else switchInput.onclick=()=>setMode(!enabled);
 $('#touch-pause').onclick=()=>{if(controlsVisible)pause();};
 setMode(enabled);

 window.touchControls={
  get enabled(){return enabled;},
  axes,
  clear:clearControls,
  render(running,driving){
   const show=enabled&&running;
   if(show!==controlsVisible){
    controlsVisible=show;
    deck.hidden=!show;
    document.body.classList.toggle('touch-playing',show);
    if(!show)clearControls();
   }
   if(driving!==vehicleMode){
    vehicleMode=driving;
    releaseMove();
    releaseButtons();
    deck.classList.toggle('touch-driving',driving);
    $('#touch-vehicle').textContent=driving?'EXIT':'VEHICLE';
    $('#touch-space').textContent=driving?'BRAKE':'JUMP';
    $('#touch-sprint').textContent=driving?'BOOST':'SPRINT';
    $('#touch-stick-label').textContent=driving?'STEER / GAS':'MOVE';
   }
  }
 };
})();
