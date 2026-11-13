'use strict';
(() => {
 if(!('serviceWorker' in navigator))return;
 const install=document.querySelector('#install-app');
 if(!install)return;
 const instructions=document.querySelector('#install-instructions');
 const appleMobile=/iPhone|iPad|iPod/.test(navigator.userAgent)
  ||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const installed=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
 if(appleMobile&&!installed)install.hidden=false;
 let prompt;
 addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  prompt=event;
  install.hidden=false;
 });
 install.addEventListener('click',async ()=>{
  if(!prompt){
   instructions.hidden=!instructions.hidden;
   install.setAttribute('aria-expanded',String(!instructions.hidden));
   return;
  }
  const event=prompt;
  prompt=null;
  install.hidden=true;
  try{await event.prompt();}catch{ /* The browser can still offer installation from its menu. */ }
 });
 addEventListener('appinstalled',()=>{install.hidden=true;prompt=null;});
 addEventListener('load',()=>{
  navigator.serviceWorker.register('./sw.js').catch(error=>{
   console.warn('Offline installation is unavailable.',error);
  });
 });
})();
