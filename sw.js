'use strict';
const prefix='grand-theft-tuition-';
const cacheName=prefix+'26.3';
const local=path=>new URL(path,self.registration.scope).href;
const files=[
 './index.html','./manifest.webmanifest','./style.css?v=26.3','./touch.css?v=26.3',
 './game.js?v=26.3','./presentation.js?v=26.3','./audio.js?v=26.3','./activities.js?v=26.3',
 './social.js?v=26.3','./brawl.js','./life.js?v=26.3','./touch.js?v=26.3','./install.js?v=26.3',
 './world3d.js?v=26.3','./campus-graphics.js?v=26.3','./duane3d.js?v=25','./supercar3d.js','./three.module.js',
 './assets/after-hours-loading.png','./assets/loading-gym.jpg','./assets/loading-hughes.jpg','./assets/loading-keating.jpg',
 './assets/icons/tuition-180.png','./assets/icons/tuition-192.png','./assets/icons/tuition-512.png',
 './assets/surfaces/sky.webp',
 ...['fieldstone','lawn','paving'].flatMap(surface=>
  ['color','normal','rough'].map(channel=>'./assets/surfaces/'+surface+'-'+channel+'.webp'))
].map(local);
const bundled=new Set(files);

self.addEventListener('install',event=>{
 event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(
  files.map(url=>new Request(url,{cache:'reload'}))
 )));
});
self.addEventListener('activate',event=>{
 event.waitUntil((async ()=>{
  for(const key of await caches.keys()){
   if(key.startsWith(prefix)&&key!==cacheName)await caches.delete(key);
  }
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||!request.url.startsWith(self.registration.scope))return;
 if(request.mode==='navigate'){
  event.respondWith((async ()=>{
   try{return await fetch(request);}
   catch{return (await caches.open(cacheName)).match(local('./index.html'));}
  })());
 }else if(bundled.has(request.url)){
  event.respondWith((async ()=>{
   const cached=await (await caches.open(cacheName)).match(request);
   return cached||fetch(request);
  })());
 }
});
