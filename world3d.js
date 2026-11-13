import * as THREE from './three.module.js';
import {buildSupercar,buildCockpit} from './supercar3d.js';
import {buildDuane} from './duane3d.js?v=25';
import {loadCampusSurfaces,createLawnBlades,aimCampusShadow} from './campus-graphics.js?v=26.3';
// Original stylized models: no photographs are used as game textures.
const canvas=document.querySelector('#game'),S=window.campusState().scale,scene=new THREE.Scene();
const phoneGraphics=matchMedia('(pointer: coarse)').matches||window.campusState().touch;
const maxRenderRatio=Math.min(devicePixelRatio,phoneGraphics?1.15:1.5);
const minRenderRatio=Math.min(maxRenderRatio,phoneGraphics?.68:.85);
scene.background=new THREE.Color('#a7bfce');scene.fog=new THREE.Fog('#c5cbbb',160,330);
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:!phoneGraphics,powerPreference:'high-performance'});}catch(error){window.presentationAPI?.fail('WebGL could not start. Enable graphics acceleration and reload.');document.querySelector('#intro').textContent='This browser could not start WebGL. Try Chrome, Edge, or Safari with graphics acceleration enabled.';throw error;}
renderer.setPixelRatio(maxRenderRatio);renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const camera=new THREE.PerspectiveCamera(67,innerWidth/innerHeight,.12,700);
const campusSurfaces=await loadCampusSurfaces(renderer);
scene.add(new THREE.HemisphereLight('#f4f4eb','#5c6651',1.7));const sun=new THREE.DirectionalLight('#ffe1b2',2.6);sun.position.set(105,230,85);sun.target.position.set(230,0,230);sun.castShadow=true;sun.shadow.mapSize.setScalar(phoneGraphics?1024:2048);Object.assign(sun.shadow.camera,{left:-84,right:84,top:84,bottom:-84,near:1,far:295});sun.shadow.bias=-.00018;sun.shadow.normalBias=.048;scene.add(sun,sun.target);
const material=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.86,...extra});
function surfaceMaterial(kind,fallback,tint,strength){
 const maps=campusSurfaces[kind];
 return maps?material(tint,{...maps,normalScale:new THREE.Vector2(strength,strength),roughness:.94})
  :material('#ffffff',{map:fallback,bumpMap:fallback,bumpScale:.075});
}
const stone=material('#919487'),trim=material('#c1bda7'),slate=material('#3b424b'),dark=material('#25333c'),wood=material('#6c4b36'),maroon=material('#711d3b'),metal=material('#303e42'),cream=material('#e3d5b1'),gold=material('#f4c766',{emissive:'#a95a13',emissiveIntensity:.2});
function box(w,h,d,mat,x=0,y=h/2,z=0,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function plane(w,h,mat,x,y,z,parent=scene){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.rotation.x=-Math.PI/2;m.receiveShadow=true;m.position.set(x,y,z);parent.add(m);return m;}
function canvasTexture(draw,w=512,h=512){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t;}
function arch(c,x,y,w,h){c.beginPath();c.moveTo(x,y+h);c.lineTo(x,y+h*.36);c.quadraticCurveTo(x,y+h*.14,x+w/2,y);c.quadraticCurveTo(x+w,y+h*.14,x+w,y+h*.36);c.lineTo(x+w,y+h);c.closePath();}
function roundedWindow(c,x,y,w,h){c.beginPath();c.moveTo(x,y+h);c.lineTo(x,y+w/2);c.arc(x+w/2,y+w/2,w/2,Math.PI,Math.PI*2);c.lineTo(x+w,y+h);c.closePath();}
function facade(width,height,style){const cols=Math.max(2,Math.round(width/(style==='keating'?4:3))),rows=style==='duane'?1:style==='hughes'?4:style==='keating'?3:style==='church'?1:Math.max(2,Math.round(height/3.4));return canvasTexture((c,w,h)=>{let seed=17;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};c.fillStyle=style==='modern'?'#a6a69c':style==='brick'?'#81664f':style==='keating'?'#80766b':style==='hughes'?'#6d6e65':'#777c73';c.fillRect(0,0,w,h);
 for(let y=0;y<h;y+=14)for(let x=-20;x<w;x+=40){let offset=(Math.floor(y/14)%2)*20,v=Math.floor(rnd()*35);c.fillStyle=style==='brick'?`rgb(${112+v},${85+v},${65+v})`:style==='keating'?`rgb(${107+v},${100+v},${88+v})`:`rgb(${113+v},${116+v},${106+v})`;c.fillRect(x+offset,y,39,13);c.fillStyle='rgba(28,35,30,.12)';c.fillRect(x+offset,y+11,39,2);}
 const cw=w/cols,rh=(h-32)/rows;
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){let x=col*cw+cw*.24,y=23+row*rh,ww=cw*.5,hh=rh*.65;c.fillStyle='#b5b5a2';if(style==='hughes'&&row<3){roundedWindow(c,x-4,y-5,ww+8,hh+8);c.fill();roundedWindow(c,x,y,ww,hh);c.fillStyle='#40535b';c.fill();}else if(style==='gothic'||style==='church'||style==='duane'||(style==='keating'&&row===2)){arch(c,x-4,y-5,ww+8,hh+8);c.fill();arch(c,x,y,ww,hh);c.fillStyle='#304651';c.fill();}else{c.fillRect(x-3,y-4,ww+6,hh+8);c.fillStyle='#34505b';c.fillRect(x,y,ww,hh);}
 c.fillStyle='#aaa990';c.fillRect(x+ww*.47,y+hh*.15,Math.max(2,ww*.045),hh*.85);c.fillRect(x,y+hh*.55,ww,3);if(style==='keating'||style==='hughes'){for(let pane=1;pane<4;pane++){c.fillRect(x+pane*ww/4,y+hh*.1,2,hh*.9);c.fillRect(x,y+pane*hh/4,ww,2);}}c.fillStyle='#d5c9ae';c.fillRect(x-5,y+hh+4,ww+10,4);if((row+col)%4===1){c.fillStyle='#d2af6d70';c.fillRect(x+3,y+hh*.6,ww*.38,hh*.33);}}
 for(let i=0;i<2000;i++){let x=rnd()*w,y=rnd()*h;c.fillStyle=rnd()>.5?'#ffffff0a':'#101c180c';c.fillRect(x,y,1,2);}c.fillStyle='#c3baa4';c.fillRect(0,0,w,12);c.fillRect(0,h-20,w,8);
 });}
const roofTexture=canvasTexture((c,w,h)=>{c.fillStyle='#38434b';c.fillRect(0,0,w,h);for(let y=0;y<h;y+=24)for(let x=-24;x<w;x+=48){const xx=x+(y/24%2)*24;c.fillStyle=(x+y)%3?'#48525a':'#3e4851';c.fillRect(xx,y,47,23);c.fillStyle='#202d3655';c.fillRect(xx,y+20,47,3);}});roofTexture.wrapS=roofTexture.wrapT=THREE.RepeatWrapping;roofTexture.repeat.set(3,3);slate.map=roofTexture;
function roof(w,d,h,x,y,z,parent){const v=[-w/2,0,-d/2,w/2,0,-d/2,0,h,-d/2,-w/2,0,d/2,w/2,0,d/2,0,h,d/2],idx=[0,2,1,3,4,5,0,3,5,0,5,2,1,2,5,1,5,4];const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(idx);g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,.5,1,0,0,1,0,.5,1],2));g.computeVertexNormals();const m=new THREE.Mesh(g,slate);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function archPanel(w,h,mat,x,y,z,rotation,parent){const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(-w/2,h*.64);shape.quadraticCurveTo(-w/2,h*.86,0,h);shape.quadraticCurveTo(w/2,h*.86,w/2,h*.64);shape.lineTo(w/2,0);shape.closePath();const geometry=new THREE.ShapeGeometry(shape),positions=geometry.attributes.position,uvs=geometry.attributes.uv;for(let i=0;i<positions.count;i++)uvs.setXY(i,(positions.getX(i)+w/2)/w,positions.getY(i)/h);const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.rotation.y=rotation;parent.add(m);return m;}
function pinnacle(x,y,z,parent){box(.28,1.7,.28,trim,x,y+.85,z,parent);const m=new THREE.Mesh(new THREE.ConeGeometry(.35,1.1,4),trim);m.position.set(x,y+2.25,z);m.rotation.y=Math.PI/4;parent.add(m);}
function clockTexture(){return canvasTexture((c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='#e4d7b2';c.beginPath();c.arc(w/2,h/2,w*.46,0,Math.PI*2);c.fill();c.strokeStyle='#3a4140';c.lineWidth=8;c.stroke();for(let i=0;i<12;i++){let a=i*Math.PI/6;c.beginPath();c.moveTo(w/2+Math.sin(a)*w*.35,h/2-Math.cos(a)*h*.35);c.lineTo(w/2+Math.sin(a)*w*.4,h/2-Math.cos(a)*h*.4);c.stroke()}c.lineWidth=12;c.beginPath();c.moveTo(w/2,h/2-h*.25);c.lineTo(w/2,h/2);c.lineTo(w*.68,h*.58);c.stroke();},256,256);}
const stainedGlass=canvasTexture((c,w,h)=>{c.fillStyle='#1a3045';c.fillRect(0,0,w,h);const colors=['#8c3655','#37647b','#af905b','#496e75'];for(let y=0;y<h;y+=32)for(let x=0;x<w;x+=32){c.fillStyle=colors[(x/32+y/32)%4];c.beginPath();c.moveTo(x+16,y+2);c.lineTo(x+30,y+16);c.lineTo(x+16,y+30);c.lineTo(x+2,y+16);c.fill();}c.strokeStyle='#b1ad95';c.lineWidth=7;for(let x=w/4;x<w;x+=w/4){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}});const stainedMat=material('#c9d6e0',{map:stainedGlass,emissive:'#24303c',emissiveIntensity:.2});
const clockMat=new THREE.MeshStandardMaterial({map:clockTexture(),transparent:true,roughness:.8});
function sign(text,x,z){const tex=canvasTexture((c,w,h)=>{c.fillStyle='#342b32';c.fillRect(0,0,w,h);c.strokeStyle='#ba9f73';c.lineWidth=10;c.strokeRect(8,8,w-16,h-16);c.fillStyle='#efe2bc';c.font='bold 34px Georgia';c.textAlign='center';c.textBaseline='middle';const words=text.split(' ');const mid=Math.ceil(words.length/2);c.fillText(words.slice(0,mid).join(' '),w/2,h*.38,w-36);c.fillText(words.slice(mid).join(' '),w/2,h*.67,w-36);},512,256);box(2.7,1.2,.14,metal,x,1.8,z);for(const dx of [-1,1])box(.1,1.8,.1,metal,x+dx,.9,z);const m=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.1),new THREE.MeshStandardMaterial({map:tex}));m.position.set(x,1.8,z+.08);scene.add(m);}
const state=window.campusState();
// Repeated in world units so the paving joints keep a consistent scale.
function tiledGround(width,length,mat,x,y,z,tileSize){
 const surface=plane(width,length,mat,x,y,z);
 const uv=surface.geometry.attributes.uv;
 for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*width/tileSize,uv.getY(i)*length/tileSize);
 return surface;
}
function surfaceTexture(draw){
 const texture=canvasTexture(draw,512,512);
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 return texture;
}
function seededRandom(seed){
 return ()=>{seed=seed*16807%2147483647;return seed/2147483647;};
}
const turf=surfaceTexture((c,w,h)=>{
 c.fillStyle='#65764a';c.fillRect(0,0,w,h);
 const random=seededRandom(78);
 for(let i=0;i<21000;i++){
  const shade=Math.floor(72+random()*73);
  c.fillStyle='rgba('+shade+','+(shade+21)+','+(shade-32)+',.36)';
  c.fillRect(random()*w,random()*h,1+random()*3,2+random()*6);
 }
});
const lawnMaterial=surfaceMaterial('lawn',turf,'#cfe8b5',.86);
tiledGround((state.bounds.maxX-state.bounds.minX)*S+115,(state.bounds.maxY-state.bounds.minY)*S+115,lawnMaterial,
 (state.bounds.minX+state.bounds.maxX)*S/2,-.04,(state.bounds.minY+state.bounds.maxY)*S/2,7);
const mowStripe=lawnMaterial.clone();
mowStripe.color.set('#c6e5a4');
mowStripe.onBeforeCompile=shader=>{
 shader.vertexShader='varying vec2 lawnPosition;\n'+shader.vertexShader.replace(
  '#include <begin_vertex>','#include <begin_vertex>\nlawnPosition=position.xy;');
 shader.fragmentShader='varying vec2 lawnPosition;\n'+shader.fragmentShader.replace(
  '#include <color_fragment>',`
   #include <color_fragment>
   float mown=smoothstep(-.32,.32,sin(lawnPosition.x*1.06+lawnPosition.y*.045));
   float wear=sin(lawnPosition.x*.22)*sin(lawnPosition.y*.25);
   diffuseColor.rgb*=.93+.12*mown+.08*wear;
  `);
};
for(const f of state.fields){
 const width=f.w*S,length=f.h*S,shape=new THREE.Shape();
 const radius=6.2, north=4.8;
 shape.moveTo(radius,0);
 shape.quadraticCurveTo(0,0,0,radius);
 shape.lineTo(0,length-radius);
 shape.quadraticCurveTo(0,length,radius,length);
 shape.lineTo(width-radius,length);
 shape.quadraticCurveTo(width,length,width,length-radius);
 shape.lineTo(width,north+radius);
 shape.quadraticCurveTo(width,north,width-radius,north-1.6);
 shape.lineTo(radius+4,0);
 shape.closePath();
 const geometry=new THREE.ShapeGeometry(shape,12),{position,uv}=geometry.attributes;
 for(let i=0;i<position.count;i++)uv.setXY(i,position.getX(i)/7,position.getY(i)/7);
 const lawn=new THREE.Mesh(geometry,mowStripe);
 lawn.rotation.x=Math.PI/2;lawn.material.side=THREE.DoubleSide;lawn.receiveShadow=true;
 lawn.position.set(f.x*S,.005,f.y*S);
 scene.add(lawn);
}
const limestoneGrain=surfaceTexture((c,w,h)=>{
 const random=seededRandom(605);
 c.fillStyle='#b8b4aa';c.fillRect(0,0,w,h);
 for(let i=0;i<17000;i++){
  const x=random()*w,y=random()*h;
  c.fillStyle=i%3?'#f0e8db42':'#555e5743';
  c.fillRect(x,y,.4+random()*2.6,.4+random()*2.2);
 }
 for(let i=0;i<720;i++){
  const x=random()*w,y=random()*h;
  c.fillStyle=i%2?'#d8cbbb20':'#64645718';
  c.beginPath();c.ellipse(x,y,1+random()*13,.5+random()*4,random()*Math.PI,0,Math.PI*2);c.fill();
 }
});
const stepStone=material('#bbb5a5',{map:limestoneGrain,bumpMap:limestoneGrain,bumpScale:.04});
function stoneUV(mesh,x,y,z,repeat=2.8){
 const {normal,position,uv}=mesh.geometry.attributes;
 for(let i=0;i<uv.count;i++){
  const side=Math.abs(normal.getX(i))>.5, flat=Math.abs(normal.getY(i))>.5;
  uv.setXY(i,(side?position.getZ(i)+z:position.getX(i)+x)/repeat,
   (flat?position.getZ(i)+z:position.getY(i)+y)/repeat);
 }
 return mesh;
}
const pavers=surfaceTexture((c,w,h)=>{
 c.fillStyle='#777267';c.fillRect(0,0,w,h);
 const random=seededRandom(23);
 for(let y=0;y<h;y+=64)for(let x=-64;x<w;x+=128){
  const shade=Math.floor(138+random()*31),left=x+((y/64)%2)*64;
  c.fillStyle='rgb('+(shade+13)+','+(shade+7)+','+shade+')';
  c.fillRect(left+1,y+1,126,62);
  c.fillStyle='#e9dbc83b';c.fillRect(left+3,y+2,122,3);
  c.fillStyle='#514c412d';c.fillRect(left+2,y+58,125,4);
 }
 for(let i=0;i<14000;i++){
  c.fillStyle=i%2?'#fff2da26':'#2b2a251c';
  c.fillRect(random()*w,random()*h,1+random()*2,1+random()*3);
 }
});
const walkMaterial=surfaceMaterial('paving',pavers,'#e0e3e3',.95);
for(const [i,r] of state.roads.entries()){
 const ax=r.a.x*S,az=r.a.y*S,bx=r.b.x*S,bz=r.b.y*S,length=Math.hypot(ax-bx,az-bz);
 const walk=tiledGround(r.w*S,length+.65,walkMaterial,(ax+bx)/2,.022+i*.00055,(az+bz)/2,3);
 walk.rotation.z=-Math.atan2(bx-ax,bz-az);
}
const updateGrass=createLawnBlades(scene,state.fields[0],S,state.roads,seededRandom(482),phoneGraphics);

// Keating uses its own massing and facade instead of the shared building template.
const keatingSite=state.buildings.find(b=>b.name==='KEATING HALL');
function keatingGround(x,z){
 const front=keatingSite.x*S,center=(keatingSite.y+keatingSite.h/2)*S;
 const out=front-x;
 if(Math.abs(z-center)>15||out<0||out>15)return 0;
 if(out<=3)return 2.4;
 return Math.min(2.4,Math.max(0,Math.ceil((15-out-1e-7)/(12/19))*(2.4/19)));
}
let keatingNightGlass,keatingCoolGlass;
function buildKeating(b){
 const width=b.h*S,depth=b.w*S,front=b.x*S,center=(b.y+b.h/2)*S;
 const root=new THREE.Group();root.position.set(front,0,center);root.rotation.y=-Math.PI/2;scene.add(root);
 const masonryTexture=surfaceTexture((c,w,h)=>{
  const random=seededRandom(622);
  c.fillStyle='#796e65';c.fillRect(0,0,w,h);
  for(let row=0;row<17;row++){
   const y=row*h/17;
   for(let x=-65;x<w;){
    const span=28+random()*53,v=Math.floor(102+random()*43);
    c.fillStyle='rgb('+v+','+(v-7)+','+(v-13)+')';
    c.beginPath();c.moveTo(x+2,y+2);c.lineTo(x+span-4,y+2+random()*2);
    c.lineTo(x+span-2,y+h/17-4);c.lineTo(x+4,y+h/17-3);c.closePath();c.fill();
    c.fillStyle='#e3cfc145';c.fillRect(x+4,y+3,span-10,1.5);
    c.fillStyle='#3f353043';c.fillRect(x+5,y+h/17-6,span-10,2);
    x+=span;
   }
  }
  for(let i=0;i<15000;i++){
   c.fillStyle=i%3?'#e3cfba24':'#30272131';c.fillRect(random()*w,random()*h,2,2);
  }
 });
 const masonry=surfaceMaterial('fieldstone',masonryTexture,'#e2d9ca',.92);
 const pale=material('#b4ad9c'),glass=material('#41545d',{roughness:.29,metalness:.18});
 const warmGlass=material('#687377',{roughness:.34,metalness:.09,
  emissive:'#edb36d',emissiveIntensity:.04});
 const paneVeil=material('#303843',{roughness:.79});
 keatingNightGlass=warmGlass;keatingCoolGlass=glass;
 const reveal=material('#9b8f81');
 function ashlar(w,h,d,x,y,z,parent){
  const mesh=box(w,h,d,masonry,x,y,z,parent),a=mesh.geometry.attributes;
  for(let i=0;i<a.uv.count;i++){
   const side=Math.abs(a.normal.getX(i))>.5,flat=Math.abs(a.normal.getY(i))>.5;
   a.uv.setXY(i,(side?a.position.getZ(i)+z:a.position.getX(i)+x)/3.1,
    (flat?a.position.getZ(i)+z:a.position.getY(i)+y)/3.1);
  }
  return mesh;
 }
 function gothic(path,w,h,y=0){
  path.moveTo(-w/2,y);path.lineTo(-w/2,y+h*.61);
  path.quadraticCurveTo(-w*.5,y+h*.81,0,y+h);
  path.quadraticCurveTo(w*.5,y+h*.81,w/2,y+h*.61);
  path.lineTo(w/2,y);path.closePath();return path;
 }
 function stoneArch(w,h,width,depth,x,y,z,parent,mat=pale){
  const outside=gothic(new THREE.Shape(),w,h);
  outside.holes.push(gothic(new THREE.Path(),w-width*2,h-width,width*.16));
  const moulding=new THREE.Mesh(new THREE.ExtrudeGeometry(outside,{
   depth,bevelEnabled:true,bevelThickness:.028,bevelSize:.028,bevelSegments:1,curveSegments:12
  }),mat);
  moulding.position.set(x,y,z);moulding.castShadow=moulding.receiveShadow=true;parent.add(moulding);
 }
 function drum(radius,height,x,y,z,parent,mat=masonry){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,12),mat);
  mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);
  const uv=mesh.geometry.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i),uv.getY(i)*Math.max(.12,height/6.7));
 }
 function turretCrown(x,y,z,parent,radius){
  drum(radius+.09,.18,x,y-.28,z,parent,pale);
  drum(radius,.61,x,y,z,parent);
  for(let i=0;i<8;i++){
   const angle=i*Math.PI/4;
   const merlon=box(.21,.37,.27,masonry,x+Math.cos(angle)*(radius-.1),y+.44,z+Math.sin(angle)*(radius-.1),parent);
   merlon.rotation.y=-angle;
  }
 }
 const height=18;
 ashlar(width,height,depth,0,height/2,-depth/2,root);
 for(const y of [2.4,7.1,12.2,17.8])box(width+.2,.18,.3,pale,0,y,.05,root);
 // Recessed panes, stone surrounds, sill depth and Gothic tracery by floor.
 function windowBay(x,y,w,h,pointed,parent=root,z=.12){
  const pane=Math.round(Math.abs(x)*1.9+y)%3===1?warmGlass:glass;
  if(pointed){
   archPanel(w+.24,h+.25,pale,x,y-.1,z,0,parent);
   archPanel(w+.05,h+.06,reveal,x,y-.015,z+.012,0,parent);
   archPanel(w,h,pane,x,y,z+.028,0,parent);
  }else{
   box(w+.25,h+.25,.16,pale,x,y+h/2,z,parent);
   box(w,h,.17,pane,x,y+h/2,z+.1,parent);
   if(pane===glass&&Math.round(x+y)%3===0){
    box(w*.83,h*.27,.012,paneVeil,x,y+h*.79,z+.187,parent);
   }
  }
  for(const dx of [-w/4,0,w/4])box(.065,h*.83,.07,pale,x+dx,y+h*.415,z+.21,parent);
  for(const t of [.32,.64])box(w,.065,.07,pale,x,y+h*t,z+.21,parent);
  box(w+.4,.13,.36,pale,x,y-.12,z+.12,parent);
  if(pointed)for(const dx of [-w*.25,w*.25]){const ring=new THREE.Mesh(new THREE.TorusGeometry(w*.16,.04,4,12),pale);ring.position.set(x+dx,y+h*.79,z+.22);parent.add(ring);}
 }
 for(const side of [-1,1])for(let i=0;i<5;i++){
  const x=side*(7+i*3.6);windowBay(x,.45,1.7,1.25,false);
  windowBay(x,3.1,2.1,3.2,true);windowBay(x,8,2.1,3.4,false);windowBay(x,13.2,2.1,3.3,false);
 }
 // The low wings sit under an almost level parapet with raised gables and chimneys.
 ashlar(width,.68,.6,0,18.3,0,root);box(width+.3,.14,.73,pale,0,18.72,0,root);
 for(const x of [-width*.4,-width*.25,width*.25,width*.4]){
  ashlar(2.6,.72,.82,x,18.95,-.02,root);roof(2.8,.9,.58,x,19.31,-.02,root).material=pale;
 }
 for(const x of [-width*.34,width*.34]){
  drum(.74,2.04,x,19.06,-2.3,root);turretCrown(x,20.13,-2.3,root,.77);
 }
 for(const x of [-width/2+.3,-17.8,-10.6,10.6,17.8,width/2-.3]){
  ashlar(.42,18.4,.5,x,9.2,.2,root);box(.7,.22,.7,pale,x,18.5,.2,root);
 }
 const tower=new THREE.Group();tower.position.set(0,0,-5.6);root.add(tower);
 const tw=9.4,th=41,faceZ=tw/2;
 ashlar(tw,th,tw,0,th/2,0,tower);
 for(const y of [20,23.2,24,35.8,38.6,40.3])box(tw+.33,.16,tw+.33,pale,0,y,0,tower);
 for(let side=0;side<4;side++){
  const wall=new THREE.Group();wall.rotation.y=side*Math.PI/2;tower.add(wall);
  archPanel(3.68,9.65,dark,0,25.15,faceZ+.025,0,wall);
  stoneArch(4.55,10.55,.41,.44,0,24.95,faceZ+.03,wall,reveal);
  stoneArch(4.69,10.68,.16,.19,0,24.9,faceZ+.38,wall);
  for(const x of [-1.28,-.65,0,.65,1.28])box(.105,7.45,.16,pale,x,28.86,faceZ+.31,wall);
  for(const y of [26.5,27.1,31.55])box(3.65,.12,.21,pale,0,y,faceZ+.34,wall);
  for(const x of [-1.14,0,1.14])stoneArch(1.08,2.3,.092,.085,x,31.5,faceZ+.31,wall);
  ashlar(tw,.56,.35,0,41.05,faceZ,wall);
  for(const x of [-2.75,2.75])ashlar(1.45,.76,.45,x,41.64,faceZ,wall);
  ashlar(2.12,.96,.47,0,41.72,faceZ,wall);
  roof(2.33,.62,.47,0,42.19,faceZ,wall).material=pale;
  if(side===0){
   box(.14,.87,.12,pale,0,41.72,faceZ+.32,wall);
   box(.58,.14,.12,pale,0,41.81,faceZ+.32,wall);
  }
 }
 for(const x of [-tw/2,tw/2])for(const z of [-tw/2,tw/2]){
  drum(1.04,23.4,x,30.85,z,tower);
  for(const y of [20,23.2,24,35.8,38.6,40.3])drum(1.14,.17,x,y,z,tower,pale);
  turretCrown(x,42.93,z,tower,1.11);
  for(const dx of [-.28,.28])archPanel(.17,1.75,reveal,x+dx,40.65,z+.98,0,tower);
 }
 // A projecting bay with a layered stone reveal over the doorway.
 ashlar(8.4,21.4,2.2,0,10.7,.8,root);
 archPanel(4.56,6.28,dark,0,2.4,1.923,0,root);
 stoneArch(5.63,7.05,.51,.61,0,2.4,1.94,root,reveal);
 stoneArch(5.82,7.2,.19,.2,0,2.4,2.52,root);
 box(3.6,3.5,.12,wood,0,4.15,1.99,root);
 for(const x of [-1.1,0,1.1])box(.07,3.5,.08,metal,x,4.15,2.08,root);
 windowBay(0,15.1,5.1,5.4,true,root,1.94);
 stoneArch(5.58,5.76,.14,.2,0,14.96,2.05,root);
 box(5.61,.16,.38,pale,0,14.94,2.08,root);
 for(const x of [-4.2,4.2]){
  drum(.78,21.8,x,10.9,1.4,root);
  for(const y of [2.4,7.1,15,20.8])drum(.89,.16,x,y,1.4,root,pale);
  turretCrown(x,21.9,1.4,root,.85);
  for(const dx of [-.26,.26])archPanel(.16,1.7,reveal,x+dx,19.92,2.18,0,root);
 }
 // Large maroon banner, based on Fordham's current shield-banner photograph.
 const banner=canvasTexture((c,w,h)=>{
  c.scale(w/600,h/900);c.fillStyle='#7b1738';c.fillRect(0,0,600,900);
  const fabric=c.createLinearGradient(0,0,600,0);fabric.addColorStop(0,'#00000015');fabric.addColorStop(.45,'#ffffff06');fabric.addColorStop(1,'#00000018');c.fillStyle=fabric;c.fillRect(0,0,600,900);
  // Angular Gothic F drawn as paths: avoids the platform-dependent Fraktur glyph.
  c.fillStyle='#fffaf2';c.beginPath();c.moveTo(105,95);c.lineTo(495,95);c.lineTo(495,418);c.bezierCurveTo(495,510,410,582,300,640);c.bezierCurveTo(190,582,105,510,105,418);c.closePath();c.fill();
  c.save();c.translate(285,340);c.fillStyle='#7b1738';c.beginPath();c.moveTo(-28,-165);c.lineTo(-114,-107);c.lineTo(-82,-85);c.lineTo(-82,131);c.lineTo(-128,164);c.lineTo(-48,204);c.lineTo(39,136);c.lineTo(39,8);c.lineTo(108,8);c.lineTo(137,-48);c.lineTo(39,-48);c.lineTo(39,-112);c.lineTo(126,-84);c.lineTo(171,-140);c.lineTo(64,-178);c.lineTo(10,-140);c.lineTo(10,117);c.lineTo(-9,132);c.lineTo(-9,-130);c.closePath();c.fill();c.restore();
  c.fillStyle='#fffaf2';c.textAlign='center';c.font='bold 66px Arial';c.fillText('FORDHAM',300,748,490);c.font='29px Arial';c.fillText('U N I V E R S I T Y',300,795,470);
  c.fillStyle='#c9bba2';for(const x of [23,300,577]){c.beginPath();c.arc(x,12,4,0,Math.PI*2);c.fill();}
 },1024,1536);
 const cloth=new THREE.Mesh(new THREE.PlaneGeometry(4.35,6.2,16,16),material('#ffffff',{map:banner,side:THREE.DoubleSide}));const pos=cloth.geometry.attributes.position;for(let i=0;i<pos.count;i++)pos.setZ(i,.035*Math.sin(pos.getX(i)*5)*(1-(pos.getY(i)+3.1)/6.2));cloth.geometry.computeVertexNormals();cloth.position.set(0,12.13,2.29);cloth.castShadow=true;root.add(cloth);
 box(4.55,.09,.1,metal,0,15.27,2.31,root);
 // Full-width terrace and nineteen broad stone treads descending toward Eddie's.
 stoneUV(box(30,2.4,3,stepStone,0,1.2,1.5,root),0,1.2,1.5);
 const treadEdge=material('#aaa497');
 for(let i=0;i<19;i++){
  const top=(19-i)*2.4/19,z=3+(i+.5)*12/19;
  stoneUV(box(30,top,12/19,stepStone,0,top/2,z,root),0,top/2,z);
  box(30,.024,.069,treadEdge,0,top+.006,z+6/19-.024,root);
  for(let x=-13.5+(i%2)*.76;x<14.9;x+=2.25){
   box(.012,.007,.56,treadEdge,x,top+.007,z-.018,root);
  }
 }
 for(const [index,text] of [[3,'FRANKLIN D. ROOSEVELT · 1940'],[8,'HARRY S. TRUMAN · 1946'],[13,'MARY McALEESE · 2010']]){const engraving=canvasTexture((c,w,h)=>{c.fillStyle='#c5bcaa';c.fillRect(0,0,w,h);c.fillStyle='#666960';c.textAlign='center';c.font='30px Georgia';c.fillText(text,w/2,h*.76);},1024,64);const m=new THREE.Mesh(new THREE.PlaneGeometry(8,.11),material('#ffffff',{map:engraving}));m.position.set(0,(19-index)*2.4/19-.06,3+(index+1)*12/19+.01);root.add(m);}
 for(const side of [-1,1]){box(5.5,2.2,11,masonry,side*17.9,1.1,7,root);box(5.8,.2,11.3,pale,side*17.9,2.3,7,root);for(let j=0;j<7;j++){const shrub=new THREE.Mesh(new THREE.IcosahedronGeometry(1.35,2),material('#3f5b30'));shrub.scale.set(1.5,.8,1);shrub.position.set(side*17.9,3,2.7+j*1.45);shrub.castShadow=true;root.add(shrub);}}
}

// Dealy's five window tiers and the attached ground-floor cafe are modeled separately.
function buildDealy(b){
 const w=b.w*S,d=b.h*S,h=b.height*1.5,root=new THREE.Group();
 root.position.set((b.x+b.w/2)*S,0,(b.y+b.h/2)*S);scene.add(root);
 const wallMap=canvasTexture((c,ww,hh)=>{let seed=37;c.fillStyle='#737269';c.fillRect(0,0,ww,hh);for(let y=0;y<hh;y+=19)for(let x=-60;x<ww;x+=58){seed=seed*16807%2147483647;const v=seed%31;const xx=x+(y/19%2)*29;c.fillStyle=`rgb(${95+v},${98+v},${88+v})`;c.fillRect(xx,y,56,17);c.fillStyle='#4a514a55';c.fillRect(xx,y+16,56,1);}},1024,1024);
 wallMap.wrapS=wallMap.wrapT=THREE.RepeatWrapping;wallMap.repeat.set(1.5,1.3);
 const masonry=material('#ffffff',{map:wallMap,bumpMap:wallMap,bumpScale:.09}),ivory=material('#dad7c6'),windowGlass=material('#647c83',{metalness:.18,roughness:.3}),topStone=material('#c8c9bc'),roofMat=material('#636c6c');
 box(w,h-3.6,d,masonry,0,(h-3.6)/2,0,root);box(w,3.6,d,topStone,0,h-1.8,0,root);
 box(w+.25,.48,d+.25,ivory,0,.3,0,root);
 for(const y of [3.5,7.75,12.1,17.75,h+.1])box(w+.3,.18,d+.3,ivory,0,y,0,root);
 box(w+.5,.22,d+.5,ivory,0,h+.35,0,root);box(w-.2,.15,d-.2,roofMat,0,h+.12,0,root);
 function roundShape(width,height,segment=false){
  const p=new THREE.Shape();p.moveTo(-width/2,0);p.lineTo(-width/2,height-(segment?.22:width/2));
  if(segment)p.quadraticCurveTo(0,height+.13,width/2,height-.22);
  else p.absarc(0,height-width/2,width/2,Math.PI,0,true);
  p.lineTo(width/2,0);p.closePath();return p;
 }
 function pane(parent,x,y,width,height,type){
  if(type==='round'||type==='segment'){
   for(const [grow,mat,z] of [[.26,ivory,.08],[0,windowGlass,.115]]){const m=new THREE.Mesh(new THREE.ShapeGeometry(roundShape(width+grow,height+grow,type==='segment')),mat);m.position.set(x,y-grow/2,z);parent.add(m);}
  }else{box(width+.25,height+.25,.17,ivory,x,y+height/2,.04,parent);box(width,height,.07,windowGlass,x,y+height/2,.15,parent);}
  for(const yy of [.27,.55,.79])box(width,.045,.045,ivory,x,y+height*yy,.2,parent);
  box(.05,height-.12,.045,ivory,x,y+height/2,.2,parent);box(width+.36,.13,.32,ivory,x,y-.1,.1,parent);
  // A few window air conditioners add scale without covering every opening.
  if(Math.round(x*10)%4===0&&y>5&&y<15){box(width*.55,.32,.42,metal,x,y+.16,.35,parent);for(let j=0;j<5;j++)box(width*.48,.018,.03,trim,x,y+.05+j*.05,.57,parent);}
 }
 for(let side=0;side<4;side++){
  const face=new THREE.Group();face.rotation.y=side*Math.PI/2;root.add(face);const width=side%2?d:w;face.translateZ((side%2?w:d)/2+.015);
  const columns=Math.max(5,Math.round(width/3.6)),spacing=width/columns;
  for(let i=0;i<columns;i++){
   const x=-width/2+spacing*(i+.5);
   pane(face,x,.65,1.45,2.1,'rect');pane(face,x,4.3,1.65,2.8,'round');pane(face,x,8.7,1.65,2.65,'segment');
   pane(face,x-.47,13.05,.73,2.85,'round');pane(face,x+.47,13.05,.73,2.85,'round');pane(face,x,18.35,1.25,2.45,'rect');
  }
  // Pale masonry blocks down the corners, matching the photographed quoins.
  for(const x of [-width/2+.15,width/2-.15])for(let y=.65;y<17.5;y+=.78)box(y%1.56<.78?.7:.45,.55,.2,ivory,x,y,.06,face);
 }
 // Flat roof, shallow parapet, mechanical screen and a small rooftop stair enclosure.
 for(const x of [-w/2,w/2])box(.22,.65,d,topStone,x,h+.55,0,root);for(const z of [-d/2,d/2])box(w,.65,.22,topStone,0,h+.55,z,root);
 box(w*.55,2.1,d*.38,material('#a4a9a3'),-w*.09,h+1.05,-d*.08,root);for(let x=-w*.36;x<w*.2;x+=1.3)box(.06,2.1,d*.39,metal,x,h+1.05,-d*.08,root);
 box(3.1,2.8,3.2,topStone,-w*.32,h+1.4,-d*.27,root);
 // Main east-facing stone portal; cafe sits farther along this same ground-floor wing.
 const entry=new THREE.Group();entry.position.set(w/2+.12,0,-d*.23);entry.rotation.y=Math.PI/2;root.add(entry);
 box(4.4,4.8,.3,ivory,0,2.4,0,entry);archPanel(3.5,4.2,dark,0,.1,.18,0,entry);box(2.6,3,.08,wood,0,1.6,.24,entry);for(const x of [-.85,0,.85])box(.055,3,.06,metal,x,1.6,.31,entry);
 const label=canvasTexture((c,ww,hh)=>{c.fillStyle='#d8d3bf';c.fillRect(0,0,ww,hh);c.fillStyle='#434c43';c.font='bold 64px Georgia';c.textAlign='center';c.fillText('DEALY HALL',ww/2,hh*.67);},512,128);
 const signMesh=new THREE.Mesh(new THREE.PlaneGeometry(3.8,.7),material('#ffffff',{map:label}));signMesh.position.set(0,4.45,.2);entry.add(signMesh);
 const cafe=state.buildings.find(x=>x.name==='STARBUCKS AT DEALY');buildDealyCafe(cafe);
}
function buildDealyCafe(b){
 const w=b.w*S,d=b.h*S,h=b.height*1.5,root=new THREE.Group();root.position.set((b.x+b.w/2)*S,0,(b.y+b.h/2)*S);scene.add(root);
 const green=material('#006343'),frame=material('#263f3b'),glazing=material('#537878',{roughness:.19,metalness:.3}),base=material('#9c9e8e');
 box(w,h,d,glazing,0,h/2,0,root);box(w+.2,.42,d+.2,base,0,.21,0,root);box(w+.55,.3,d+.55,frame,0,h,0,root);
 // Window frames on the exposed east facade and southern patio entrance.
 for(const z of [-d/2,0,d/2])box(.12,h,.14,frame,w/2+.07,h/2,z,root);
 for(const y of [1.1,3.55])box(.12,.08,d,frame,w/2+.08,y,0,root);
 for(const x of [-w/2,0,w/2])box(.12,h,.14,frame,x,h/2,d/2+.07,root);
 box(w,.08,.14,frame,0,1.1,d/2+.07,root);box(w*.7,.08,1.1,frame,0,3.05,d/2+.5,root);
 for(const x of [-.13,.13])box(.04,.6,.04,cream,x,1.4,d/2+.18,root);
 // Large readable wordmark; no improvised imitation of the siren logo.

 const cafeView=canvasTexture((c,ww,hh)=>{
  c.fillStyle='#b6a27e';c.fillRect(0,0,ww,hh);c.fillStyle='#e2d4af';c.fillRect(0,0,ww,hh*.22);
  c.fillStyle='#85745d';for(let x=0;x<ww;x+=19)c.fillRect(x,hh*.2,2,hh*.48);
  // A counter, pastry case and menu boards seen through the cafe windows.
  c.fillStyle='#1b342e';c.fillRect(ww*.12,hh*.22,ww*.21,hh*.25);c.fillRect(ww*.35,hh*.22,ww*.21,hh*.25);c.fillRect(ww*.58,hh*.22,ww*.21,hh*.25);
  c.fillStyle='#ece5cb';c.font='bold 17px Arial';c.fillText('COFFEE',ww*.15,hh*.28);c.fillText('ESPRESSO',ww*.38,hh*.28);c.fillText('BAKERY',ww*.61,hh*.28);
  c.fillStyle='#b9c4ac';for(let y=0;y<4;y++)for(let x=0;x<3;x++)c.fillRect(ww*(.15+x*.23),hh*(.32+y*.028),ww*.14,2);
  c.fillStyle='#805b3e';c.fillRect(ww*.05,hh*.62,ww*.86,hh*.22);c.fillStyle='#d8c8a5';c.fillRect(ww*.04,hh*.6,ww*.88,hh*.035);
  c.fillStyle='#2a3433';c.fillRect(ww*.58,hh*.47,ww*.15,hh*.13);c.fillStyle='#d8ddd0';for(let x=0;x<5;x++)c.fillRect(ww*(.59+x*.025),hh*.455,ww*.013,hh*.022);
  c.fillStyle='#b5d0c380';c.fillRect(ww*.17,hh*.48,ww*.2,hh*.12);c.strokeStyle='#dedbcc';c.lineWidth=3;c.strokeRect(ww*.17,hh*.48,ww*.2,hh*.12);c.fillStyle='#c9965f';for(let x=0;x<5;x++)c.fillRect(ww*(.19+x*.035),hh*.54,ww*.02,hh*.03);
  for(const x of [.18,.5,.82]){c.fillStyle='#36413c';c.fillRect(ww*x,0,2,hh*.15);c.beginPath();c.ellipse(ww*x,hh*.15,ww*.023,hh*.035,0,Math.PI,Math.PI*2);c.fill();c.fillStyle='#ffeac0';c.beginPath();c.ellipse(ww*x,hh*.15,ww*.023,hh*.009,0,0,Math.PI*2);c.fill();}
  c.fillStyle='#6f817f44';c.fillRect(0,0,ww,hh);c.fillStyle='#d3e1da19';c.beginPath();c.moveTo(ww*.2,0);c.lineTo(ww*.37,0);c.lineTo(ww*.65,hh);c.lineTo(ww*.48,hh);c.closePath();c.fill();
 },1024,384);
 const viewMat=material('#ffffff',{map:cafeView,emissive:'#b0a285',emissiveMap:cafeView,emissiveIntensity:.32,roughness:.4});
 const eastView=new THREE.Mesh(new THREE.PlaneGeometry(d-.3,2.75),viewMat);eastView.rotation.y=Math.PI/2;eastView.position.set(w/2+.08,1.95,0);root.add(eastView);
 const southView=new THREE.Mesh(new THREE.PlaneGeometry(w-.3,2.75),viewMat);southView.position.set(0,1.95,d/2+.08);root.add(southView);
 for(let z=-d/2;z<=d/2;z+=d/4)box(.1,3.2,.1,frame,w/2+.13,1.85,z,root);
 for(const x of [-.75,.75])box(.065,2.5,.12,frame,x,1.55,d/2+.16,root);
 const text=canvasTexture((c,ww,hh)=>{c.fillStyle='#006343';c.fillRect(0,0,ww,hh);c.fillStyle='#fffaf1';c.font='bold 126px Arial';c.textAlign='center';c.fillText('STARBUCKS',ww/2,hh*.62,ww*.91);c.font='27px Arial';c.fillText('COFFEE',ww/2,hh*.86);},1024,256);
 for(const side of [0,1]){const m=new THREE.Mesh(new THREE.PlaneGeometry(side?d*.68:w*.94,1.05),new THREE.MeshBasicMaterial({map:text}));if(side){m.position.set(w/2+.11,3.75,0);m.rotation.y=Math.PI/2;}else m.position.set(0,3.75,d/2+.11);root.add(m);}
 // Paved seating court on the south side, with room between the table groups.
 const patio=new THREE.Group();patio.position.set((b.x+b.w/2)*S,0,(b.y+b.h)*S+5.7);scene.add(patio);
 const paving=canvasTexture((c,ww,hh)=>{c.fillStyle='#b4b2a4';c.fillRect(0,0,ww,hh);c.strokeStyle='#8c9187';c.lineWidth=2;for(let y=0;y<hh;y+=64)for(let x=0;x<ww;x+=64){c.strokeRect(x,y,64,64);}},512,512);
 const pavingMat=material('#ffffff',{map:paving});plane(17,11,pavingMat,-4,.045,0,patio);
 const furniture=material('#33433d'),tableTop=material('#657169');
 for(const [i,[x,z]] of [[-10,-2.8],[-4.5,-2.8],[1,-2.8],[-10,2.7],[-4.5,2.7],[1,2.7]].entries()){
  const table=new THREE.Mesh(new THREE.CylinderGeometry(.72,.72,.07,24),tableTop);table.position.set(x,.79,z);table.castShadow=true;table.receiveShadow=true;patio.add(table);box(.1,.76,.1,furniture,x,.38,z,patio);for(const offset of [-.42,.42]){box(.9,.06,.1,furniture,x,.08,z+offset,patio);}
  for(let j=0;j<4;j++){
   const chair=new THREE.Group(),a=j*Math.PI/2;chair.position.set(x+Math.cos(a)*1.18,0,z+Math.sin(a)*1.18);chair.rotation.y=-a-Math.PI/2;patio.add(chair);box(.48,.06,.48,furniture,0,.45,0,chair);for(const xx of [-.2,.2])for(const zz of [-.2,.2])box(.035,.44,.035,furniture,xx,.22,zz,chair);for(const xx of [-.2,.2])box(.035,.55,.035,furniture,xx,.7,-.2,chair);for(const yy of [.61,.78,.94])box(.43,.035,.04,furniture,0,yy,-.2,chair);
  }
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(.06,.045,.16,10),cream);cup.position.set(x+.25,.91,z);patio.add(cup);const lid=new THREE.Mesh(new THREE.CylinderGeometry(.066,.066,.025,10),dark);lid.position.set(x+.25,1.002,z);patio.add(lid);
 }
 // Edge planting and a bicycle stand define the terrace without enclosing its paths.
 for(const x of [-12.1,4.1]){box(.65,.5,9,base,x,.25,0,patio);for(let j=0;j<8;j++){const bush=new THREE.Mesh(new THREE.IcosahedronGeometry(.45,1),material('#4c6742'));bush.position.set(x,.7,-3.5+j);bush.castShadow=true;patio.add(bush);}}
 for(let j=0;j<4;j++){const hoop=new THREE.Mesh(new THREE.TorusGeometry(.42,.035,6,16,Math.PI),furniture);hoop.position.set(-4+j*1.2,.55,5);patio.add(hoop);for(const xx of [-.42,.42])box(.07,.55,.07,furniture,-4+j*1.2+xx,.275,5,patio);}
}

// The completed McShane facade: lower glass bays, stone piers, tower and recessed entry.
function buildMcShane(b){
 const w=b.w*S,depth=b.h*S,h=b.height*1.5,root=new THREE.Group();
 root.position.set((b.x+b.w/2)*S,0,(b.y+b.h)*S);scene.add(root);
 const towerX=9,towerW=8,towerH=27.8,entryLeft=13,entryRight=(1157-1017)/24*S-w/2;
 const darkFrame=material('#33454a',{metalness:.45,roughness:.45}),silver=material('#c8d1ce',{metalness:.12,roughness:.55}),pale=material('#d8d4c5'),roofMat=material('#79817b');
 function stoneMap(light){return canvasTexture((c,ww,hh)=>{let seed=119;c.fillStyle=light?'#b7b6ac':'#59615e';c.fillRect(0,0,ww,hh);const row=light?88:22,col=light?174:57;for(let y=0;y<hh;y+=row)for(let x=-col;x<ww;x+=col){seed=seed*16807%2147483647;let v=seed%24;const xx=x+(y/row%2)*col/2;c.fillStyle=light?`rgb(${180+v},${177+v},${166+v})`:`rgb(${71+v},${80+v},${77+v})`;c.fillRect(xx+1,y+1,col-2,row-2);if(!light){c.fillStyle='#d8d3bc14';c.fillRect(xx+3,y+2,col-8,3);}}},512,1024);}
 const stoneMapDark=stoneMap(false);stoneMapDark.wrapS=stoneMapDark.wrapT=THREE.RepeatWrapping;stoneMapDark.repeat.set(1,1.7);
 const darkStone=material('#ffffff',{map:stoneMapDark,bumpMap:stoneMapDark,bumpScale:.08}),lightStone=material('#ffffff',{map:stoneMap(true)});
 // Glass uses original reflected-sky/curtain artwork, with depth supplied by real mullions.
 function glazing(tower=false){const tex=canvasTexture((c,ww,hh)=>{
  const sky=c.createLinearGradient(0,0,0,hh);sky.addColorStop(0,'#9aaeb8');sky.addColorStop(.5,'#7f979d');sky.addColorStop(1,'#536a69');c.fillStyle=sky;c.fillRect(0,0,ww,hh);
  for(let floor=0;floor<(tower?7:4);floor++){const y=hh*(floor+.28)/(tower?7:4);c.fillStyle=floor%2?'#d1c5a63f':'#324c5a32';c.fillRect(0,y,ww,hh/(tower?10:6));c.fillStyle='#dfd5ba60';c.fillRect(ww*.14,y+hh*.028,ww*.7,2);}
  for(let x=0;x<ww;x+=12){c.fillStyle=x%24?'#e8e3ca25':'#3c53561b';c.fillRect(x,0,4,hh);}
  c.fillStyle='#dbe3df25';for(const [x,y,rx,ry] of [[.2,.12,.4,.06],[.75,.25,.35,.04],[.4,.46,.45,.04]]){c.beginPath();c.ellipse(ww*x,hh*y,ww*rx,hh*ry,-.12,0,Math.PI*2);c.fill();}
  c.fillStyle='#344d431f';c.beginPath();c.moveTo(0,hh*.63);for(let x=0;x<=ww;x+=8)c.lineTo(x,hh*(.72+.04*Math.sin(x*.055)));c.lineTo(ww,hh);c.lineTo(0,hh);c.fill();
 },512,1024);return material('#ffffff',{map:tex,emissive:'#7c969d',emissiveMap:tex,emissiveIntensity:.12,roughness:.28,metalness:.08});}
 const glass=glazing(),towerGlass=glazing(true);
 function curtainWall(width,height,mat,x,y,z,parent,columns=3,rows=4){
  const pane=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);pane.position.set(x,y+height/2,z);parent.add(pane);
  for(let col=0;col<=columns;col++)box(.12,height+.12,.16,silver,x-width/2+width*col/columns,y+height/2,z+.08,parent);
  for(let row=0;row<=rows;row++)box(width,.065,.13,darkFrame,x,y+height*row/rows,z+.09,parent);
 }
 const wingLeft=-w/2,wingRight=5,wingWidth=wingRight-wingLeft;
 // New three-level wing, with four full-height glass bays and projecting stone piers.
 box(wingWidth,h,29,darkStone,(wingLeft+wingRight)/2,h/2,-14.5,root);
 const bays=4,pitch=wingWidth/bays;
 for(let i=0;i<bays;i++){
  const x=wingLeft+pitch*(i+.5),glassW=pitch-1.65;
  curtainWall(glassW,h-.6,glass,x,.3,.06,root,3,4);
  for(const dx of [-glassW/6,glassW/6])box(.11,h-1.1,.5,darkFrame,x+dx,(h-1.1)/2+.35,.28,root);
  box(1.4,h+.2,.6,darkStone,wingLeft+pitch*i,h/2,.16,root);
 }
 box(.5,h+.2,.6,darkStone,wingRight,h/2,.16,root);box(wingWidth+.45,.22,29.4,silver,(wingLeft+wingRight)/2,h+.12,-14.5,root);
 // Substantial north/rear volume and flat roof; a glazed return at the west end.
 box(wingWidth,11.6,depth-29,darkStone,(wingLeft+wingRight)/2,5.8,-29-(depth-29)/2,root);
 const west=new THREE.Group();west.position.set(wingLeft-.04,0,-14.5);west.rotation.y=-Math.PI/2;root.add(west);
 for(let i=0;i<5;i++){const x=-11.6+i*5.8;curtainWall(4.6,h-.6,glass,x,.3,0,west,2,4);box(1.1,h+.1,.55,darkStone,x+2.85,h/2,.1,west);}
 box(wingWidth-.5,.15,28,roofMat,(wingLeft+wingRight)/2,h+.05,-14.5,root);
 // Tower front is a three-column curtain wall; pale slab walls run back at either side.
 box(towerW,towerH,10,lightStone,towerX,towerH/2,-4.6,root);
 curtainWall(towerW-.8,towerH-.25,towerGlass,towerX,.16,.47,root,3,10);
 box(.5,towerH-3.8,10.4,lightStone,towerX-towerW/2+.05,(towerH-3.8)/2,-4.6,root);
 box(.5,towerH-3.8,10.4,lightStone,towerX+towerW/2-.05,(towerH-3.8)/2,-4.6,root);
 box(towerW+.25,.2,10.4,silver,towerX,towerH+.05,-4.6,root);
 // High glazing continues above the stone side wall, as in the completed exterior.
 const towerSide=new THREE.Group();towerSide.position.set(entryLeft+.03,0,-4.6);towerSide.rotation.y=Math.PI/2;root.add(towerSide);
 curtainWall(9.8,3.4,towerGlass,0,towerH-3.5,.04,towerSide,4,1);
 // Low-contrast seal relief on the pale wall: simple original linework at architectural scale.
 const seal=canvasTexture((c,ww,hh)=>{c.clearRect(0,0,ww,hh);c.strokeStyle='#817f7066';c.fillStyle='#817f7066';c.lineWidth=4;for(const r of [218,202,164]){c.beginPath();c.arc(256,256,r,0,Math.PI*2);c.stroke();}c.font='bold 66px Georgia';c.textAlign='center';c.fillText('IHS',256,275);c.font='25px Georgia';c.fillText('FORDHAM',256,110);c.fillText('1841',256,398);for(let j=0;j<12;j++){let a=j*Math.PI/6;c.beginPath();c.moveTo(256+Math.cos(a)*107,256+Math.sin(a)*107);c.lineTo(256+Math.cos(a)*135,256+Math.sin(a)*135);c.stroke();}},512,512);
 const sealMesh=new THREE.Mesh(new THREE.PlaneGeometry(3.3,3.3),material('#ffffff',{map:seal,transparent:true,depthWrite:false}));sealMesh.position.set(entryLeft+.3,20.3,-3.9);sealMesh.rotation.y=Math.PI/2;root.add(sealMesh);

 const doorTexture=canvasTexture((c,ww,hh)=>{
  const reflection=c.createLinearGradient(0,0,0,hh);reflection.addColorStop(0,'#8ea6ac');reflection.addColorStop(.55,'#718b8e');reflection.addColorStop(1,'#405d60');c.fillStyle=reflection;c.fillRect(0,0,ww,hh);
  c.fillStyle='#dce4d82c';c.beginPath();c.moveTo(ww*.1,0);c.lineTo(ww*.28,0);c.lineTo(ww*.72,hh);c.lineTo(ww*.54,hh);c.closePath();c.fill();
  c.fillStyle='#d5c7a938';c.fillRect(ww*.15,hh*.35,ww*.7,hh*.36);c.fillStyle='#263f473d';c.fillRect(ww*.3,hh*.4,ww*.4,hh*.58);
 },256,512);
 const lobbyGlass=material('#ffffff',{map:doorTexture,emissive:'#687d77',emissiveMap:doorTexture,emissiveIntensity:.12,roughness:.3});
 // Recessed entry and glass arcade beside the historic gym wall.
 const entryWidth=entryRight-entryLeft,entryX=(entryRight+entryLeft)/2;
 box(entryWidth,10.2,14,glass,entryX,5.1,-8.3,root);
 curtainWall(entryWidth-.2,8.9,glass,entryX,.12,-1.24,root,3,3);
 for(const dx of [-entryWidth*.25,entryWidth*.25]){
  box(entryWidth*.43,3.2,.16,silver,entryX+dx,1.6,-1.06,root);
  box(entryWidth*.43-.2,2.98,.09,lobbyGlass,entryX+dx,1.58,-.94,root);
  box(.055,.6,.07,metal,entryX+dx+.18,1.5,-.82,root);
 }
 const canopyGlass=material('#b8cecc',{roughness:.25,metalness:.05,transparent:true,opacity:.68,depthWrite:false});
 for(const x of [entryLeft+.15,entryX,entryRight-.15])box(.14,3.4,.16,silver,x,1.7,-.76,root);
 box(entryWidth,.14,.16,silver,entryX,3.4,-.76,root);box(entryWidth,.12,.3,silver,entryX,.08,-.7,root);
 for(let row=0;row<5;row++){
  const z=-.91+row*1.02;
  box(entryWidth+.3,.075,1,canopyGlass,entryX,5.4,z,root);
  box(entryWidth+.44,.1,.062,silver,entryX,5.37,z+.51,root);
 }
 // The entrance photo shows a planted vertical wall next to the glazed portal.
 const livingWall=canvasTexture((c,ww,hh)=>{
  const random=seededRandom(182);c.fillStyle='#26352a';c.fillRect(0,0,ww,hh);
  for(let i=0;i<1850;i++){
   c.fillStyle=['#304d2c','#627747','#4a613a','#85915a','#344b3b'][i%5];
   c.beginPath();c.ellipse(random()*ww,random()*hh,2+random()*7,2+random()*5,random()*Math.PI,0,Math.PI*2);c.fill();
  }
 },256,512);
 const garden=material('#e3e6d0',{map:livingWall,bumpMap:livingWall,bumpScale:.12});
 box(1.55,4.52,.17,darkFrame,entryRight-.66,2.34,-.79,root);
 box(1.37,4.34,.11,garden,entryRight-.66,2.34,-.67,root);
 for(let j=0;j<4;j++){
  const x=entryLeft+(entryWidth)*j/3;box(.13,.28,5.3,silver,x,5.35,1.15,root);box(.045,.035,5.2,new THREE.MeshBasicMaterial({color:'#f1e9d2'}),x,5.19,1.15,root);
 }
 box(entryWidth+.5,.18,.15,silver,entryX,5.4,3.7,root);
 const name=canvasTexture((c,ww,hh)=>{c.clearRect(0,0,ww,hh);c.fillStyle='#344246';c.textAlign='center';c.font='49px Georgia';c.fillText('McSHANE CAMPUS CENTER',ww/2,hh*.7,ww*.97);},1024,128);
 box(entryWidth,.68,.08,pale,entryX,5.88,-1.2,root);
 const letters=new THREE.Mesh(new THREE.PlaneGeometry(entryWidth-.2,.74),new THREE.MeshBasicMaterial({map:name,transparent:true,depthWrite:false}));letters.position.set(entryX,5.88,-1.11);root.add(letters);
 // Glazed gallery continues north alongside the gym, visibly joining the older volumes.
 const galleryRight=entryRight+.04,galleryLeft=entryLeft+.35,galleryLength=depth-13.9;
 box(galleryRight-galleryLeft,9.5,galleryLength,glass,(galleryRight+galleryLeft)/2,4.75,-14-galleryLength/2,root);
 for(let z=-14;z>-depth;z-=3.4)box(.12,9.6,.12,silver,galleryRight+.05,4.8,z,root);
 box(galleryRight-galleryLeft+.25,.14,galleryLength,silver,(galleryRight+galleryLeft)/2,9.6,-14-galleryLength/2,root);
 const link=state.buildings.find(x=>x.name==='MCSHANE GLASS ARCADE');
 const connector=new THREE.Group();connector.position.set((link.x+link.w/2)*S,0,(link.y+link.h/2)*S);scene.add(connector);
 const lw=link.w*S,ld=link.h*S;box(lw,10.8,ld,glass,0,5.4,0,connector);box(lw+.2,.18,ld+.2,silver,0,10.9,0,connector);
 for(const side of [-1,1])for(let z=-ld/2;z<=ld/2;z+=2.65){box(.1,10.7,.1,silver,side*(lw/2+.02),5.4,z,connector);box(.12,.08,ld,silver,side*(lw/2+.02),5.5,0,connector);}

 // Paved arrival court and low rectangular beds, leaving a broad clear door approach.
 const paving=canvasTexture((c,ww,hh)=>{c.fillStyle='#b5b5a9';c.fillRect(0,0,ww,hh);c.strokeStyle='#8d978f';c.lineWidth=2;for(let y=0;y<hh;y+=64)for(let x=0;x<ww;x+=128)c.strokeRect(x+(y/64%2)*64,y,128,64);},512,512);
 const pavingMat=material('#ffffff',{map:paving});const court=plane(w+3,14,pavingMat,0,.05,6.4,root);
 const courtUV=court.geometry.attributes.uv;
 for(let i=0;i<courtUV.count;i++)courtUV.setXY(i,courtUV.getX(i)*(w+3)/9,courtUV.getY(i)*14/9);
 paving.wrapS=paving.wrapT=THREE.RepeatWrapping;
 for(const x of [-20,-11,-2]){
  box(3.9,.38,1.7,pale,x,.22,9.8,root);box(3.5,.08,1.3,material('#5f604b'),x,.45,9.8,root);
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.1,.17,4.3,8),wood);trunk.position.set(x,2.5,9.8);root.add(trunk);
  for(const [dx,dy,dz] of [[0,0,0],[-.65,-.3,.2],[.6,-.2,-.2]]){const leaves=new THREE.Mesh(new THREE.IcosahedronGeometry(1.2,2),material('#526849'));leaves.position.set(x+dx,5+dy,9.8+dz);leaves.scale.y=1.15;leaves.castShadow=true;root.add(leaves);}
 }
 // Period lamps and benches shown in the exterior photographs.
 for(const x of [-24,2,22]){
  box(.1,3.7,.1,metal,x,1.85,11.5,root);box(.42,.07,.42,metal,x,3.6,11.5,root);box(.52,.08,.52,metal,x,4.18,11.5,root);
  for(const dx of [-.17,.17])for(const dz of [-.17,.17])box(.025,.55,.025,metal,x+dx,3.9,11.5+dz,root);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),gold);bulb.position.set(x,3.9,11.5);root.add(bulb);
 }
 for(const x of [-16,-7]){
  box(2.76,.4,.83,lightStone,x,.24,12,root);
  box(2.8,.085,.87,pale,x,.48,12,root);
  box(2.64,.07,.72,darkStone,x,.045,12,root);
 }
}

// Hughes keeps its historic masonry and a contrasting green glass mansard roof.
const hughesSite=state.buildings.find(b=>b.name==='HUGHES HALL');
function hughesGround(x,z){
 const out=z-(hughesSite.y+hughesSite.h)*S,lateral=Math.abs(x-(hughesSite.x+hughesSite.w/2)*S);
 if(out<0||out>5.6||lateral>4.8)return 0;
 if(out<=2)return 1.02;
 return Math.min(1.02,Math.max(0,Math.ceil((5.6-out-1e-7)/.6)*.17));
}
function buildHughes(b){
 const w=b.w*S,d=b.h*S,h=14.6,root=new THREE.Group();root.position.set((b.x+b.w/2)*S,0,(b.y+b.h)*S);scene.add(root);
 const masonryMap=canvasTexture((c,ww,hh)=>{c.fillStyle='#8d9290';c.fillRect(0,0,ww,hh);let seed=71;const rnd=()=>{seed=seed*16807%2147483647;return seed/2147483647;};for(let row=0;row<24;row++)for(let col=-1;col<12;col++){const x=col*49+(row%2)*24,y=row*23,v=75+rnd()*55;c.fillStyle=`rgb(${v},${v+3},${v+2})`;c.beginPath();c.moveTo(x+2,y+3);c.lineTo(x+44,y+1);c.lineTo(x+47,y+18);c.lineTo(x+6,y+22);c.lineTo(x,y+13);c.closePath();c.fill();c.strokeStyle='#313d362c';c.lineWidth=1;c.stroke();}},512,512);
 masonryMap.wrapS=masonryMap.wrapT=THREE.RepeatWrapping;masonryMap.repeat.set(3,2);
 const windowReflection=canvasTexture((c,ww,hh)=>{
  const tint=c.createLinearGradient(0,0,0,hh);
  tint.addColorStop(0,'#879fac');tint.addColorStop(.41,'#607984');tint.addColorStop(1,'#2f4347');
  c.fillStyle=tint;c.fillRect(0,0,ww,hh);
  c.fillStyle='#d2e0df27';c.beginPath();c.moveTo(0,hh*.06);
  c.lineTo(ww,hh*.48);c.lineTo(ww,hh*.6);c.lineTo(0,hh*.23);c.closePath();c.fill();
  const random=seededRandom(319);
  for(let i=0;i<75;i++){
   c.fillStyle=i%2?'#2b49461e':'#445d542f';
   c.beginPath();c.ellipse(random()*ww,hh*(.55+random()*.47),8+random()*16,5+random()*12,0,0,Math.PI*2);c.fill();
  }
 },128,256);
 const masonry=material('#ffffff',{map:masonryMap,bumpMap:masonryMap,bumpScale:.085}),pale=material('#d3d4c9'),shadow=material('#3c4849'),iron=material('#777f7c',{metalness:.65,roughness:.35}),pane=material('#d3dcda',{map:windowReflection,emissive:'#759486',emissiveMap:windowReflection,emissiveIntensity:.06,metalness:.06,roughness:.45}),roofGlass=material('#739c9d',{metalness:.48,roughness:.2}),canopyGlass=material('#8bc4b5',{transparent:true,opacity:.55,metalness:.2,roughness:.18,side:THREE.DoubleSide,depthWrite:false});
 const marbleMap=canvasTexture((c,ww,hh)=>{c.fillStyle='#d7d8cb';c.fillRect(0,0,ww,hh);c.strokeStyle='#abb8b345';c.lineWidth=1.3;for(let i=0;i<12;i++){c.beginPath();c.moveTo(-10,i*47);c.bezierCurveTo(90,i*47+30,190,i*47-20,ww+5,i*47+70);c.stroke();}},512,512),marble=material('#ffffff',{map:marbleMap});
 box(w,h,d,masonry,0,h/2,-d/2,root);
 for(const [y,thick,over] of [[.3,.3,.18],[4.55,.2,.19],[8.05,.1,.12],[11.25,.1,.12],[14.42,.25,.32],[14.68,.18,.62],[14.86,.12,.45]])box(w+over,thick,d+over,pale,0,y,-d/2,root);
 // Corner quoins and a dentilled cornice replace the previous repeated facade texture.
 for(const x of [-w/2,w/2])for(const z of [0,-d])for(let j=0;j<30;j++)box(j%2?.63:.94,.39,j%2?.94:.63,pale,x,j*.47+.44,z,root);
 for(let i=0;i<Math.floor(w/.45);i++)for(const z of [.2,-d-.2])box(.16,.16,.18,pale,-w/2+.3+i*.45,14.55,z,root);
 function shape(kind,width,height){const p=new THREE.Shape();p.moveTo(-width/2,0);if(kind==='round'){const spring=height-width/2;p.lineTo(-width/2,spring);p.absarc(0,spring,width/2,Math.PI,0,true);}else if(kind==='segment'){p.lineTo(-width/2,height-width*.2);p.quadraticCurveTo(0,height+width*.2,width/2,height-width*.2);}else{p.lineTo(-width/2,height);p.lineTo(width/2,height);}p.lineTo(width/2,0);p.closePath();return p;}
 function panel(parent,x,y,z,width,height,kind,mat){
  const geometry=new THREE.ShapeGeometry(shape(kind,width,height)),{position,uv}=geometry.attributes;
  for(let i=0;i<uv.count;i++)uv.setXY(i,position.getX(i)/width+.5,position.getY(i)/height);
  const mesh=new THREE.Mesh(geometry,mat);
  mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
 }
 function windowBay(parent,x,y,width,height,kind){panel(parent,x,y-.14,.12,width+.32,height+.28,kind,pale);panel(parent,x,y,.15,width,height,kind,pane);box(width+.47,.13,.34,pale,x,y-.16,.13,parent);box(.045,height-.12,.055,iron,x,y+(height-.12)/2,.2,parent);for(const t of [.24,.5,.74])box(width,.04,.055,iron,x,y+height*t,.2,parent);for(const sign of [-1,1])for(let j=0;j<4;j++)box(.15,.16,.07,pale,x+sign*(width/2+.12),y+.3+j*.47,.17,parent);}
 function elevation(width,count,position,angle){const f=new THREE.Group();f.position.set(...position);f.rotation.y=angle;root.add(f);const pitch=width/count;
  for(let i=0;i<count;i++){const x=-width/2+pitch*(i+.5),center=Math.abs(x)<3.2&&angle===0;
   if(!center)windowBay(f,x,1.65,1.08,2.25,'rect');
   windowBay(f,x,5.12,1.12,2.43,'round');windowBay(f,x,8.55,1.12,2.23,'segment');
   for(const dx of [-.29,.29])windowBay(f,x+dx,11.75,.47,2.18,'round');
  }return f;
 }
 elevation(w,11,[0,0,0],0);elevation(w,11,[0,0,-d],Math.PI);elevation(d,6,[-w/2,0,-d/2],-Math.PI/2);elevation(d,6,[w/2,0,-d/2],Math.PI/2);
 function bar(a,b,r,mat=iron){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,start.distanceTo(end),8),mat);mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());mesh.castShadow=true;root.add(mesh);}
 // Four sloped glass faces and thin ribs make the mansard silhouette visible from the quad.
 const base=14.94,top=18.04,inset=2.35,bottom=[[-w/2,base,.12],[w/2,base,.12],[w/2,base,-d-.12],[-w/2,base,-d-.12]],upper=[[-w/2+inset,top,-inset],[w/2-inset,top,-inset],[w/2-inset,top,-d+inset],[-w/2+inset,top,-d+inset]];
 const roofPanes=['#83a9a3','#6c9794','#98b8ac'].map(color=>material(color,{
  roughness:.23,metalness:.12,side:THREE.DoubleSide,emissive:'#647d70',emissiveIntensity:.12
 }));
 for(let i=0;i<4;i++){
  const j=(i+1)%4,count=i%2?9:18;
  const lerp=(start,end,t)=>start.map((value,n)=>value+(end[n]-value)*t);
  bar(bottom[i],bottom[j],.046,iron);bar(upper[i],upper[j],.046,iron);
  for(let k=0;k<count;k++){
   const a=lerp(bottom[i],bottom[j],k/count),b=lerp(bottom[i],bottom[j],(k+1)/count);
   const c=lerp(upper[i],upper[j],k/count),d=lerp(upper[i],upper[j],(k+1)/count);
   const geometry=new THREE.BufferGeometry();
   geometry.setAttribute('position',new THREE.Float32BufferAttribute([...a,...b,...c,...b,...d,...c],3));
   geometry.computeVertexNormals();
   const pane=new THREE.Mesh(geometry,roofPanes[(k*7+i)%roofPanes.length]);
   pane.castShadow=true;root.add(pane);
   bar(a,c,.029,iron);
   bar(lerp(a,c,.55),lerp(b,d,.55),.025,iron);
  }
 }
 box(w-inset*2,.1,d-inset*2,roofGlass,0,top,-d/2,root);
 // Raised sliding-glass entry, canopy and the thin Hughes Hall name above it.
 box(7.2,3.35,.36,pale,0,2.695,.18,root);box(6.6,3.08,.12,shadow,0,2.56,.39,root);
 const entryArt=canvasTexture((c,ww,hh)=>{const shade=c.createLinearGradient(0,0,0,hh);shade.addColorStop(0,'#64786e');shade.addColorStop(1,'#253e40');c.fillStyle=shade;c.fillRect(0,0,ww,hh);c.fillStyle='#d9ddbf';for(let row=0;row<3;row++)for(let col=0;col<5;col++)c.fillRect(50+col*100,30+row*44,42,5);c.fillStyle='#172b2c';c.fillRect(ww*.35,hh*.42,ww*.3,hh*.58);c.strokeStyle='#a8c0b270';c.lineWidth=2;for(let x=0;x<ww;x+=90){c.beginPath();c.moveTo(x,0);c.lineTo(x,hh);c.stroke();}c.fillStyle='#dee2d0';c.textAlign='center';c.font='14px Arial';c.fillText('GABELLI SCHOOL OF BUSINESS',ww/2,hh*.51);for(let x=15;x<ww;x+=20){c.beginPath();c.arc(x,hh*.7,2.5,0,Math.PI*2);c.fill();}},512,256);
 const doors=new THREE.Mesh(new THREE.PlaneGeometry(6.35,3.02),material('#ffffff',{map:entryArt,roughness:.25,metalness:.15}));doors.position.set(0,2.56,.47);root.add(doors);
 for(const x of [-3.22,-1.08,0,1.08,3.22])box(.055,3.04,.08,iron,x,2.56,.53,root);box(6.5,.12,.09,iron,0,4.1,.52,root);
 box(7.5,.1,2.05,canopyGlass,0,4.5,1.05,root);for(const x of [-3.7,-1.85,0,1.85,3.7]){bar([x,4.53,.1],[x,4.53,2.08],.03);bar([x,4.9,.13],[x,4.62,1.85],.028);box(.09,.1,.18,iron,x,4.61,1.85,root);}bar([-3.75,4.55,2.08],[3.75,4.55,2.08],.035);
 const letters=canvasTexture((c,ww,hh)=>{c.clearRect(0,0,ww,hh);c.fillStyle='#d0d4cf';c.textAlign='center';c.font='68px Georgia';c.fillText('HUGHES HALL',ww/2,hh*.8);},1024,128);const sign=new THREE.Mesh(new THREE.PlaneGeometry(5.3,.48),new THREE.MeshStandardMaterial({map:letters,transparent:true,side:THREE.DoubleSide}));sign.position.set(0,4.94,1.96);root.add(sign);
 // Six readable marble treads, a broad landing, and handrails; heights match hughesGround.
 box(9.6,1.02,2,marble,0,.51,1,root);
 for(let i=0;i<6;i++){const y=1.02-i*.17,z=2+(i+.5)*.6;box(9.6,y,.6,marble,0,y/2,z,root);box(9.6,.025,.045,pale,0,y+.006,z+.27,root);}
 for(const x of [-4.55,0,4.55]){bar([x,2.0,.5],[x,2.0,1.8],.028);bar([x,2.0,1.8],[x,1.0,5.8],.028);for(let j=0;j<4;j++){const z=1.8+j*1.2,y=j===0?1.02:Math.max(0,Math.ceil((5.6-z)/.6)*.17);bar([x,y,z],[x,y+.95,z],.025);}}
 for(const sign of [-1,1]){box(2.5,.35,2.2,masonry,sign*6.35,.175,1.2,root);box(2.65,.12,2.35,pale,sign*6.35,.41,1.2,root);for(let j=0;j<3;j++){const shrub=new THREE.Mesh(new THREE.IcosahedronGeometry(.55,1),material('#3e5945'));shrub.position.set(sign*6.35+(j-1)*.55,.75,1.15);shrub.scale.y=.75;root.add(shrub);}}

}

const gymSite=state.buildings.find(b=>b.name==='ROSE HILL GYMNASIUM');
function gymGround(x,z){
 if(!gymSite)return 0;
 const out=z-(gymSite.y+gymSite.h)*S,lateral=Math.abs(x-(gymSite.x+gymSite.w/2)*S);
 if(out<0||out>15.6||lateral>11.1)return 0;
 if(out<=2)return 2.8;
 if(out<6.8){
  if(lateral>5.75)return 1.68+(6.8-out)/4.8*1.12;
  return Math.min(2.8,1.68+Math.ceil((6.8-out-1e-7)/.6)*.14);
 }
 if(out<=8.4)return 1.68;
 return Math.max(0,Math.ceil((15.6-out-1e-7)/.6)*.14);
}
function campusGround(x,z){return Math.max(keatingGround(x,z),gymGround(x,z),hughesGround(x,z),freemanGround(x,z));}
function buildRoseHillGym(b){
 const w=b.w*S,d=b.h*S,root=new THREE.Group();root.position.set((b.x+b.w/2)*S,0,(b.y+b.h)*S);scene.add(root);
 // Rough light fieldstone with irregular faces and pale mortar, based on the athletics photo.
 const masonryMap=canvasTexture((c,ww,hh)=>{
  let seed=353;const rnd=()=>{seed=seed*16807%2147483647;return seed/2147483647;};c.fillStyle='#b3b0a0';c.fillRect(0,0,ww,hh);
  for(let y=0;y<hh;y+=46){let x=-rnd()*90;while(x<ww){const width=42+rnd()*76,v=Math.floor(rnd()*49);c.beginPath();c.moveTo(x+4,y+3+rnd()*4);c.lineTo(x+width*.5,y+2);c.lineTo(x+width-3,y+5);c.lineTo(x+width-1,y+33+rnd()*8);c.lineTo(x+width*.45,y+43);c.lineTo(x+2,y+40);c.closePath();c.fillStyle=`rgb(${90+v},${94+v},${88+v})`;c.fill();c.strokeStyle='#59646166';c.lineWidth=2;c.stroke();c.strokeStyle='#d4d1bd55';c.beginPath();c.moveTo(x+7,y+8);c.lineTo(x+width-8,y+8);c.stroke();x+=width;}}
 },1024,1024);masonryMap.wrapS=masonryMap.wrapT=THREE.RepeatWrapping;masonryMap.repeat.set(2.5,1.6);
 const fieldstone=surfaceMaterial('fieldstone',masonryMap,'#c6d0d0',1.04),limestone=material('#d2cabb'),shadowStone=material('#a39e90'),stairStone=material('#bcbdb2'),iron=material('#35433f',{metalness:.25,roughness:.62}),pane=material('#596966',{roughness:.42,metalness:.08});
 const doorMap=canvasTexture((c,ww,hh)=>{let seed=7;c.fillStyle='#a3552d';c.fillRect(0,0,ww,hh);for(let x=0;x<ww;x+=8){seed=seed*16807%2147483647;c.fillStyle=`rgba(54,23,9,${.05+(seed%13)/100})`;c.fillRect(x,0,2,hh);}c.strokeStyle='#653c28';c.lineWidth=5;c.strokeRect(10,12,ww-20,hh-24);},256,512);
 const oak=material('#ffffff',{map:doorMap}),brass=material('#a99862',{metalness:.6,roughness:.5});
 function stoneBlock(bw,bh,bd,x,y,z){const mesh=box(bw,bh,bd,fieldstone,x,y,z,root),p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,uv=mesh.geometry.attributes.uv;for(let i=0;i<p.count;i++){const horizontal=Math.abs(n.getX(i))>.5?p.getZ(i):p.getX(i);const vertical=Math.abs(n.getY(i))>.5?p.getZ(i):p.getY(i);uv.setXY(i,(horizontal+(Math.abs(n.getX(i))>.5?z:x))/3.35,(vertical+(Math.abs(n.getY(i))>.5?z:y))/3.35);}return mesh;}

 stoneBlock(w,10.6,d,0,5.3,-d/2);
 stoneBlock(9.7,12.35,d-.2,0,6.175,-d/2-.1);roof(9.8,d-.1,2.05,0,12.35,-d/2-.1,root);
 box(w+.2,.22,d+.2,limestone,0,1.9,-d/2,root);
 // Raised central gable and stepped parapets across the flanking wings.
 const gable=new THREE.Shape();gable.moveTo(-4.85,10.55);gable.lineTo(-4.85,12.35);gable.lineTo(0,14.4);gable.lineTo(4.85,12.35);gable.lineTo(4.85,10.55);gable.closePath();
 const gableMesh=new THREE.Mesh(new THREE.ExtrudeGeometry(gable,{depth:.5,bevelEnabled:false}),fieldstone);const gp=gableMesh.geometry.attributes.position,guv=gableMesh.geometry.attributes.uv;for(let i=0;i<gp.count;i++)guv.setXY(i,gp.getX(i)/w+.5,gp.getY(i)/10.6);gableMesh.position.z=-.35;gableMesh.castShadow=true;root.add(gableMesh);
 function bar(a,b,width,mat,parent=root){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);const beam=new THREE.Mesh(new THREE.CylinderGeometry(width,width,delta.length(),8),mat);beam.position.copy(av).add(bv).multiplyScalar(.5);beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());beam.castShadow=true;parent.add(beam);}
 bar([-4.85,12.45,.2],[0,14.5,.2],.09,limestone);bar([0,14.5,.2],[4.85,12.45,.2],.09,limestone);
 for(const side of [-1,1]){
  box((w-9.7)/2,.22,.6,limestone,side*(w/4+2.425),10.7,0,root);
  for(const x of [side*(w/2-.35),side*4.55]){stoneBlock(.8,11.1,.75,x,5.55,.05);box(1.02,.18,.95,limestone,x,11.18,.05,root);}
 }
 // Rectangular windows on both flank levels, with deep pale surrounds.
 function rectWindow(parent,x,y,width,height,z=.1){
  box(width+.3,height+.3,.24,limestone,x,y+height/2,z,parent);box(width,height,.12,pane,x,y+height/2,z+.14,parent);
  box(.055,height,.06,iron,x,y+height/2,z+.23,parent);for(const t of [.3,.6,.82])box(width,.045,.06,iron,x,y+height*t,z+.23,parent);
  box(width+.45,.12,.4,limestone,x,y-.1,z+.08,parent);
 }
 for(const side of [-1,1]){
  for(const x of [side*6.15,side*9.15])rectWindow(root,x,3.15,.85,2.2);
  rectWindow(root,side*7.5,7.45,1.45,2.25);
  box(4.7,.18,.25,limestone,side*7.5,7.13,.12,root);
 }
 for(const side of [-1,1]){const wall=new THREE.Group();wall.position.set(side*(w/2+.03),0,-d/2);wall.rotation.y=side*Math.PI/2;root.add(wall);for(let i=0;i<6;i++){const x=-d*.4+i*d*.16;rectWindow(wall,x,3.2,.95,2.1);rectWindow(wall,x,7.3,1.2,2.2);}}
 // Tudor portal and six traceried lights above three wooden double doors.
 function tudor(width,height){const p=new THREE.Shape();p.moveTo(-width/2,0);p.lineTo(-width/2,height*.59);p.quadraticCurveTo(-width*.49,height*.72,-width*.31,height*.84);p.lineTo(0,height);p.lineTo(width*.31,height*.84);p.quadraticCurveTo(width*.49,height*.72,width/2,height*.59);p.lineTo(width/2,0);p.closePath();return p;}
 function tudorPanel(width,height,mat,y,z){const mesh=new THREE.Mesh(new THREE.ShapeGeometry(tudor(width,height)),mat);mesh.position.set(0,y,z);root.add(mesh);}
 box(8.3,6.4,.55,limestone,0,6,.32,root);
 for(const [width,height,y,z,mat] of [[8.55,5.05,6.8,.66,limestone],[8.18,4.81,6.87,.68,shadowStone],[7.86,4.59,6.94,.7,limestone],[7.48,4.33,7.02,.72,shadowStone],[7.1,4.08,7.1,.74,pane]])tudorPanel(width,height,mat,y,z);
 const glassArt=canvasTexture((c,ww,hh)=>{c.fillStyle='#69716c';c.fillRect(0,0,ww,hh);for(let y=0;y<hh;y+=36)for(let x=0;x<ww;x+=36){c.fillStyle=(x/36+y/36)%4===0?'#a69963':'#747c74';c.fillRect(x+2,y+2,33,33);c.strokeStyle='#353f3a';c.lineWidth=1;c.strokeRect(x+2,y+2,33,33);}},256,512);
 const glassMat=material('#ffffff',{map:glassArt,roughness:.6});
 for(const pair of [-1,0,1]){
  const cx=pair*2.28,winH=pair===0?3.65:2.9;
  for(const dx of [-.5,.5]){archPanel(1.04,winH+.15,limestone,cx+dx,7.12,.79,0,root);archPanel(.82,winH-.05,glassMat,cx+dx,7.16,.81,0,root);box(.045,winH*.73,.06,limestone,cx+dx,7.16+winH*.365,.85,root);}
  box(.12,winH,.15,limestone,cx,7.12+winH/2,.86,root);
  for(const dx of [-.48,.48]){const ornament=new THREE.Mesh(new THREE.TorusGeometry(.19,.035,4,12),limestone);ornament.position.set(cx+dx,7.2+winH*.79,.86);root.add(ornament);}
 }
 for(const x of [-1.14,1.14])box(.23,3.9,.22,limestone,x,9.05,.84,root);
 // Historic inscription and small stone shields, raised slightly from the portal face.
 const inscription=canvasTexture((c,ww,hh)=>{c.fillStyle='#d2cabb';c.fillRect(0,0,ww,hh);c.fillStyle='#77796b';c.textAlign='center';c.font='62px Georgia';c.fillText('GYMNASIUM',ww/2,hh*.68,ww*.8);c.fillStyle='#f2ead6';c.globalAlpha=.35;c.fillText('GYMNASIUM',ww/2-1,hh*.68-1,ww*.8);},1024,160);
 const name=new THREE.Mesh(new THREE.PlaneGeometry(7.2,.85),material('#ffffff',{map:inscription}));name.position.set(0,6.64,.64);root.add(name);
 for(const x of [-3.45,3.45]){const shield=new THREE.Shape();shield.moveTo(-.25,.3);shield.lineTo(.25,.3);shield.lineTo(.25,-.08);shield.quadraticCurveTo(.2,-.3,0,-.43);shield.quadraticCurveTo(-.2,-.3,-.25,-.08);shield.closePath();const m=new THREE.Mesh(new THREE.ShapeGeometry(shield),shadowStone);m.position.set(x,6.7,.69);root.add(m);}
 // Three double doors at the top landing, with small glazing slots and brass handles.
 for(const x of [-2.32,0,2.32]){
  box(2.22,3.55,.24,shadowStone,x,4.575,.65,root);
  for(const dx of [-.49,.49]){
   box(.94,3.3,.16,oak,x+dx,4.45,.82,root);box(.16,.52,.025,dark,x+dx,4.8,.916,root);box(.055,.72,.04,brass,x+dx*.4,4.12,.94,root);
   box(.94,.07,.04,wood,x+dx,5.71,.93,root);box(.94,.07,.04,wood,x+dx,3.03,.93,root);
  }
 }
 for(const x of [-3.6,-1.16,1.16,3.6])box(.17,3.7,.26,limestone,x,4.65,.66,root);
 // Central medallion and cross on the gable crown.
 box(1.1,1.18,.16,limestone,0,13.65,.2,root);const crest=new THREE.Mesh(new THREE.TorusGeometry(.36,.06,6,32),shadowStone);crest.position.set(0,13.65,.32);root.add(crest);
 box(.13,.65,.16,shadowStone,0,12.63,.3,root);box(.48,.12,.16,shadowStone,0,12.75,.3,root);
 // Two flights with a broad intermediate landing and a narrower upper flight.
 box(11.5,2.8,2,stairStone,0,1.4,1,root);
 for(let i=0;i<8;i++){const height=2.8-i*.14,z=2+(i+.5)*.6;box(11.5,height,.6,stairStone,0,height/2,z,root);box(11.5,.025,.05,limestone,0,height+.005,z+.27,root);}
 box(22.2,1.68,1.6,stairStone,0,.84,7.6,root);
 for(let i=0;i<12;i++){const height=1.68-i*.14,z=8.4+(i+.5)*.6;box(22.2,height,.6,stairStone,0,height/2,z,root);box(22.2,.025,.05,limestone,0,height+.005,z+.27,root);}
 for(const x of [-2.6,2.6]){
  for(const [near,far,high,low,count] of [[2,6.8,2.8,1.68,4],[8.4,15.6,1.68,0,5]]){
   bar([x,high+1,near],[x,low+1,far],.038,iron);
   for(let i=0;i<count;i++){const t=i/(count-1),z=near+(far-near)*t,y=high+(low-high)*t;bar([x,y,z],[x,y+1,z],.034,iron);}
  }
  bar([x,2.68,6.8],[x,2.68,8.4],.038,iron);
 }
 // Grass banks slope beside the upper flight, with pale stone stair edges.
 for(const side of [-1,1]){
  const xa=side*5.9,xb=side*11.1,geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([xa,2.8,2,xb,2.8,2,xa,1.68,6.8,xb,2.8,2,xb,1.68,6.8,xa,1.68,6.8],3));geo.computeVertexNormals();const bank=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:'#557441',side:THREE.DoubleSide,roughness:1}));bank.receiveShadow=true;root.add(bank);
  bar([side*5.9,2.9,2],[side*5.9,1.78,6.8],.12,limestone);bar([side*11,1.78,8.4],[side*11,.1,15.6],.15,limestone);
  for(const z of [2.3,4.3]){const tree=new THREE.Group();tree.position.set(side*8.4,2.8-(z-2)/4.8*1.12,z);root.add(tree);const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.06,.11,2.1,7),wood);trunk.position.y=1.05;tree.add(trunk);for(const [dx,dy] of [[0,0],[-.35,-.4],[.35,-.4]]){const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(.65,2),material('#4e6847'));leaf.position.set(dx,2.35+dy,0);leaf.scale.y=1.4;leaf.castShadow=true;tree.add(leaf);}}
 }
 // Ivy hugs the stone outside the two window banks, as in the athletics exterior.
 const ivy=canvasTexture((c,ww,hh)=>{
  const random=seededRandom(417);
  for(let stem=0;stem<11;stem++){
   const x=ww*.21+random()*ww*.58,height=hh*(.51+random()*.47);
   c.strokeStyle='#485441';c.lineWidth=2;c.beginPath();c.moveTo(ww*.5,hh);
   c.quadraticCurveTo(x+ww*.24,hh-height*.52,x,hh-height);c.stroke();
   for(let n=0;n<56;n++){
    const t=random(),y=hh-height*t,side=n%2?1:-1;
    const left=ww*.5+(x-ww*.5)*t+side*random()*ww*.21*Math.sin(t*Math.PI);
    c.fillStyle=['#314b36','#546745','#687b49','#435a38'][n%4];
    c.beginPath();c.ellipse(left,y,2+random()*5,2+random()*4,side*.75,0,Math.PI*2);c.fill();
   }
  }
 },256,512);
 const ivyMaterial=material('#ffffff',{map:ivy,alphaTest:.4,side:THREE.DoubleSide});
 for(const [x,y,width,height] of [[-w/2+.71,2.35,2.35,8.5],[w/2-.72,2.4,2.1,7.7],[-4.94,2.8,1.35,4.4]]){
  const vine=new THREE.Mesh(new THREE.PlaneGeometry(width,height),ivyMaterial);
  vine.position.set(x,y+height/2,.468);vine.castShadow=true;root.add(vine);
 }
 // Globe sconces at the entry corners.
 for(const x of [-4.5,4.5]){box(.1,.55,.35,iron,x,5.55,.4,root);const globe=new THREE.Mesh(new THREE.SphereGeometry(.15,12,8),cream);globe.position.set(x,5.95,.65);root.add(globe);}
}

function buildCunniffe(b){
 const w=b.h*S,d=b.w*S,h=8.1,root=new THREE.Group();root.position.set((b.x+b.w)*S,0,(b.y+b.h/2)*S);root.rotation.y=Math.PI/2;scene.add(root);
 const brick=canvasTexture((c,ww,hh)=>{c.fillStyle='#99887b';c.fillRect(0,0,ww,hh);for(let row=0;row<40;row++)for(let col=-1;col<14;col++){const v=(row*19+col*13)%18;c.fillStyle=`rgb(${137+v},${94+v},${72+v})`;c.fillRect(col*40+(row%2)*20,row*13,38,11);}},512,512);brick.wrapS=brick.wrapT=THREE.RepeatWrapping;brick.repeat.set(4,1);
 const wall=material('#ffffff',{map:brick}),pale=material('#d2cfc0'),glass=material('#526c71',{roughness:.4}),green=material('#668b7f');box(w,h,d,wall,0,h/2,-d/2,root);box(w+.35,.25,d+.35,pale,0,h,-d/2,root);box(w,.14,d,green,0,h+.2,-d/2,root);
 for(let i=0;i<13;i++){const x=-w/2+(i+.5)*w/13;if(i!==6){archPanel(1.5,2.65,wall,x,.7,.12,0,root);archPanel(1.23,2.45,glass,x,.78,.15,0,root);box(.055,2.3,.05,pale,x,1.93,.2,root);for(let j=0;j<4;j++)box(1.23,.04,.05,pale,x,1.05+j*.5,.21,root);}box(1.5,2.1,.16,pale,x,5.95,.1,root);box(1.22,1.87,.08,glass,x,5.95,.22,root);box(.05,1.85,.04,pale,x,5.95,.29,root);box(1.22,.045,.04,pale,x,5.9,.29,root);box(1.75,.15,.28,pale,x,7.1,.17,root);}
 box(2.4,3.4,.2,pale,0,1.7,.16,root);box(1.85,2.95,.15,wood,0,1.48,.31,root);box(.07,2.8,.06,pale,0,1.48,.42,root);box(3,.22,1.25,pale,0,3.5,.6,root);
 // The historic Greek Revival porch is on the west, not copied onto the brick courtyard side.
 const west=new THREE.Group();west.position.set(0,0,-d);west.rotation.y=Math.PI;root.add(west);box(11,8.5,.5,stone,0,4.25,0,west);box(5.2,.25,2.6,pale,0,.2,1.1,west);box(5.5,.3,2.8,pale,0,3.9,1,west);for(const x of [-2.25,-.9,.9,2.25]){const col=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,3.4,12),pale);col.position.set(x,2.1,2.15);west.add(col);box(.5,.16,.5,pale,x,3.82,2.15,west);}box(1.9,3,.1,wood,0,1.75,.3,west);for(const x of [-3.8,3.8])for(const y of [2.1,6.2]){box(1.6,2.3,.15,pale,x,y,.35,west);box(1.3,2.0,.08,glass,x,y,.46,west);}
 for(const x of [-w*.35,w*.35])box(.8,1.5,.8,wall,x,h+.75,-d*.55,root);
}
const freemanSite=state.buildings.find(b=>b.name==='FREEMAN HALL');
function freemanGround(x,z){const out=freemanSite.y*S-z,lateral=Math.abs(x-(freemanSite.x+freemanSite.w/2)*S);if(out<0||out>7||lateral>8)return 0;if(out<=2)return 1.6;if(lateral>2.7)return 0;return Math.max(0,Math.ceil((7-out-1e-7)/.5)*.16);}
function buildFreeman(b){
 const w=b.w*S,d=b.h*S,h=12.7,g=new THREE.Group();g.position.set((b.x+b.w/2)*S,0,b.y*S);g.rotation.y=Math.PI;scene.add(g);
 const masonry=canvasTexture((c,ww,hh)=>{let seed=71;const rnd=()=>{seed=seed*16807%2147483647;return seed/2147483647};c.fillStyle='#777a70';c.fillRect(0,0,ww,hh);for(let row=0;row<28;row++){let x=-(row%2)*27;const y=row*hh/28;while(x<ww){const width=30+rnd()*42,v=Math.floor(rnd()*30);c.fillStyle=`rgb(${119+v},${123+v},${112+v})`;c.beginPath();c.moveTo(x+2,y+2);c.lineTo(x+width-3,y+1+rnd()*2);c.lineTo(x+width-1,y+hh/28-3);c.lineTo(x+1,y+hh/28-1);c.closePath();c.fill();c.fillStyle='#d6d4be25';c.fillRect(x+4,y+3,width-9,1);x+=width;}}for(let i=0;i<18000;i++){c.fillStyle=i%2?'#ffffff12':'#252b2018';c.fillRect(rnd()*ww,rnd()*hh,1+rnd()*2,1);}},512,512);masonry.wrapS=masonry.wrapT=THREE.RepeatWrapping;masonry.repeat.set(2,1);
 const pale=material('#c5c3af'),wall=material('#ffffff',{map:masonry,bumpMap:masonry,bumpScale:.045}),glass=material('#647b7c',{roughness:.4});
 box(w,h,d,wall,0,h/2,-d/2,g);for(const x of [-w*.4,w*.4])box(w*.2,h+.5,d+.8,wall,x,(h+.5)/2,-d/2+.4,g);box(w+.4,.3,d+.4,pale,0,h,-d/2,g);
 function window(parent,x,y,width=1.1,height=2){box(width+.22,height+.25,.15,pale,x,y,.12,parent);box(width,height,.08,glass,x,y,.24,parent);box(.05,height,.05,pale,x,y,.3,parent);box(width,.05,.05,pale,x,y,.3,parent);}
 for(const side of [-1,1]){const face=new THREE.Group();face.position.z=side===1?0:-d;face.rotation.y=side===1?0:Math.PI;g.add(face);for(let i=0;i<15;i++){const x=-w/2+(i+.5)*w/15;if(Math.abs(x)<2.5)continue;window(face,x,1.1,1.15,.8);for(const y of [4.2,7.35,10.5])window(face,x,y);}}
 box(4.8,14.4,1.3,wall,0,7.2,.55,g);for(const x of [-2.4,2.4])box(.22,14.4,.3,pale,x,7.2,1.24,g);archPanel(2.9,3.7,pale,0,1.6,1.3,0,g);archPanel(2.35,3.25,wood,0,1.6,1.35,0,g);for(const y of [6.8,9.6,12.2])for(const x of [-.62,.62]){const f=new THREE.Group();f.position.z=1.31;g.add(f);window(f,x,y,.83,1.95);}box(5.2,.25,1.65,pale,0,14.4,.55,g);box(.12,.9,.12,metal,0,15.05,.65,g);box(.5,.1,.1,metal,0,15.2,.65,g);
 box(16,1.6,2,pale,0,.8,1,g);for(let i=0;i<10;i++){const y=1.6-i*.16,z=2+(i+.5)*.5;box(5.4,y,.5,pale,0,y/2,z,g);box(5.4,.025,.04,trim,0,y+.005,z+.22,g);}for(const side of [-1,1]){box(5.2,.14,.3,pale,side*5.4,2.55,1.9,g);for(let i=0;i<10;i++)box(.14,.85,.16,pale,side*(3+i*.5),2.08,1.9,g);}
}
function buildRamStatue(){
 const p=state.landmarks.find(p=>p.id==='ram'),g=new THREE.Group();g.position.set(p.x*S,0,p.y*S);g.rotation.y=-.5;scene.add(g);
 const wool=canvasTexture((c,w,h)=>{c.fillStyle='#776452';c.fillRect(0,0,w,h);for(let i=0;i<2600;i++){const x=(i*67)%w,y=(i*97)%h;c.strokeStyle=i%3?'#40382e':'#b4a084';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x-4,y+4,x+2,y+10);c.stroke();}},256,256);
 const bronze=material('#706052',{map:wool,bumpMap:wool,bumpScale:.035,metalness:.6,roughness:.5}),smooth=material('#6a5540',{metalness:.65,roughness:.4}),horn=material('#9f8867',{metalness:.64,roughness:.38});box(3.5,.18,2.2,stone,0,.09,0,g);const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(1.25,1),material('#6c746d'));rock.position.set(0,.32,0);rock.scale.set(1.32,.26,.8);rock.receiveShadow=true;g.add(rock);
 function oval(x,y,z,sx,sy,sz,mat=bronze){const m=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;g.add(m);return m;}
 function limb(a,b,r){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),m=new THREE.Mesh(new THREE.CylinderGeometry(r*.75,r,start.distanceTo(end),10),bronze);m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());m.castShadow=true;g.add(m);}
 oval(-.12,1.55,0,1.08,.57,.42);oval(.73,1.95,0,.36,.62,.32);oval(1.04,2.32,0,.3,.34,.25,smooth);oval(1.3,2.24,0,.34,.17,.19,smooth);oval(1.53,2.24,0,.1,.12,.17,smooth);
 for(const z of [-.27,.27]){limb([.52,1.48,z],[.59,.65,z],.1);oval(.63,.59,z,.15,.075,.1,smooth);limb([-.8,1.45,z],[-1.02,1.0,z],.13);limb([-1.02,1,z],[-.88,.63,z],.08);oval(-.86,.59,z,.15,.075,.1,smooth);oval(.85,2.49,z,.19,.07,.11,smooth);oval(1.2,2.39,z*.85,.045,.04,.022,material('#252522'));
  const points=[];for(let i=0;i<=50;i++){const t=i/50,a=-.2+t*Math.PI*1.86,r=.43*(1-t*.66);points.push(new THREE.Vector3(.94+Math.cos(a)*r,2.29+Math.sin(a)*r,z*1.2));}const spiral=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,.075,10,false),horn);spiral.castShadow=true;g.add(spiral);
 }oval(-1.13,1.49,0,.12,.24,.14);const plaque=canvasTexture((c,w,h)=>{c.fillStyle='#4a463b';c.fillRect(0,0,w,h);c.fillStyle='#d8ca9f';c.textAlign='center';c.font='bold 36px Georgia';c.fillText('THE FORDHAM RAM',w/2,h*.58);},512,96);const label=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.27),material('#ffffff',{map:plaque}));label.position.set(0,.21,1.11);g.add(label);
}

function buildStadium(b){const g=new THREE.Group(),w=b.w*S,d=b.h*S;g.position.set((b.x+b.w/2)*S,0,(b.y+b.h/2)*S);scene.add(g);const concrete=material('#9ca49c'),seats=material('#79364a');for(let i=0;i<10;i++){const x=w/2-.6-i*1.18,height=.45+i*.35;box(1.18,height,d,concrete,x,height/2,0,g);box(.55,.12,d-.5,seats,x,height+.08,0,g);}for(const z of [-d/2,d/2]){box(w,.07,.07,metal,0,4.3,z,g);for(let x=-w/2;x<w/2;x+=1.5)box(.05,4.2,.05,metal,x,2.1,z,g);}box(.07,.9,d,metal,-w/2+.1,4.15,0,g);}
for(const b of state.buildings){
 if(b.name==='DUANE LIBRARY'){
  buildDuane(b,{S,scene,box,material,archPanel,surfaceTexture,seededRandom,tiledGround,walkMaterial,surfaceMaterial});
  continue;
 }
 if(b.name==='CUNNIFFE HOUSE'){buildCunniffe(b);continue;}if(b.name==='FREEMAN HALL'){buildFreeman(b);continue;}if(b.name==='HUGHES HALL'){buildHughes(b);continue;}if(b.name==='MOGLIA STADIUM'){buildStadium(b);continue;}if(b.name==='MCSHANE GLASS ARCADE')continue;if(b.name==='ROSE HILL GYMNASIUM'){buildRoseHillGym(b);continue;}if(b.name==='MCSHANE CAMPUS CENTER'){buildMcShane(b);continue;}if(b.name==='STARBUCKS AT DEALY')continue;if(b.name==='DEALY HALL'){buildDealy(b);continue;}if(b.name==='KEATING TOWER')continue;if(b.name==='KEATING HALL'){buildKeating(b);continue;}const w=b.w*S,d=b.h*S,h=b.height*1.5,g=new THREE.Group();g.position.set((b.x+b.w/2)*S,0,(b.y+b.h/2)*S);scene.add(g);const hughes=b.name==='HUGHES HALL',duane=b.name==='DUANE LIBRARY',dealy=b.name==='DEALY HALL',freeman=b.name==='FREEMAN HALL',tower=/TOWER/.test(b.name),church=b.name==='UNIVERSITY CHURCH',keating=b.name==='KEATING HALL',modern=!duane&&/MCSHANE|LOMBARDI|GARAGE|LIBRARY/.test(b.name);const style=duane?'duane':hughes?'hughes':keating?'keating':modern?'modern':church?'church':/MARTYRS|O’HARE|WALSH HALL/.test(b.name)?'brick':'gothic';
 const front=material('#ffffff',{map:facade(w,h,style)}),side=material('#ffffff',{map:facade(d,h,style)});box(w,h,d,[side,side,stone,stone,front,front],0,h/2,0,g);
 box(w+.3,.35,d+.3,trim,0,.25,0,g);box(w+.35,.25,d+.35,trim,0,h-.15,0,g);
 if(!tower&&!modern&&!keating&&!hughes&&!duane)roof(w+.35,d+.35,church?3.8:keating?2.6:1.8,0,h,0,g);
 if(modern){box(w+.45,.3,d+.45,trim,0,h+.15,0,g);for(let i=-1;i<=1;i++)box(.28,h,.2,trim,i*w*.29,h/2,d/2+.12,g);}
 if(keating||church){for(const sign of [-1,1]){const face=new THREE.Group();face.position.set(sign*w/2,0,0);face.rotation.y=sign*Math.PI/2;g.add(face);archPanel(3.5,5.3,trim,0,0,.15,0,face);archPanel(2.8,4.7,wood,0,0,.19,0,face);box(.12,4.2,.1,trim,0,2.1,.22,face);for(let i=0;i<3;i++)box(4.5+i*.7,.18,1.1,trim,0,.1-i*.13,.5+i*.4,face);}
 for(const sign of [-1,1])for(let i=0;i<5;i++)box(.4,h+1,.7,trim,sign*(w/2+.08),(h+1)/2,-d/2+i*d/4,g);}
 if(tower){const keat=b.name.includes('KEATING');for(const sign of [-1,1]){for(const offset of [-.18,.18]){archPanel(w*.26,h*.23,dark,offset*w,h*.59,sign*(d/2+.04),sign===1?0:Math.PI,g);for(let k=0;k<8;k++)box(w*.22,.06,.07,trim,offset*w,h*.61+k*h*.022,sign*(d/2+.06),g);}const face=new THREE.Group();face.position.set(sign*w/2,0,0);face.rotation.y=sign*Math.PI/2;g.add(face);for(const offset of [-.18,.18]){archPanel(d*.26,h*.23,dark,offset*d,h*.59,.03,0,face);for(let k=0;k<8;k++)box(d*.22,.06,.07,trim,offset*d,h*.61+k*h*.022,.05,face);}}
 for(const x of [-w/2,w/2])for(const z of [-d/2,d/2]){box(.36,h+1,.36,trim,x,(h+1)/2,z,g);if(keat){const turret=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,1.5,8),stone);turret.position.set(x,h+.6,z);turret.castShadow=true;g.add(turret);box(.75,.15,.75,trim,x,h+1.4,z,g);}else pinnacle(x,h,z,g);}for(let i=0;i<5;i++){let t=-.5+i/4;box(w/8,.9,.4,trim,t*w,h+.45,-d/2,g);box(w/8,.9,.4,trim,t*w,h+.45,d/2,g);box(.4,.9,d/8,trim,-w/2,h+.45,t*d,g);box(.4,.9,d/8,trim,w/2,h+.45,t*d,g);}
 if(keat){const front=new THREE.Group();front.position.set(-w/2-.08,0,0);front.rotation.y=-Math.PI/2;g.add(front);archPanel(d*.73,h*.35,trim,0,h*.51,.02,0,front);archPanel(d*.62,h*.32,dark,0,h*.52,.04,0,front);for(let j=-2;j<=2;j++)box(.07,h*.27,.07,trim,j*d*.1,h*.655,.08,front);for(const yy of [h*.57,h*.64,h*.77])box(d*.62,.07,.07,trim,0,yy,.09,front);}
 if(keat)for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.2),clockMat);let a=i*Math.PI/2;m.position.set(Math.sin(a)*(w/2+.04),h*.89,Math.cos(a)*(d/2+.04));m.rotation.y=a;g.add(m);}}
 if(duane){
 // Neo-Gothic masonry hall, tall traceried windows and a square entrance tower.
 const entrance=new THREE.Group();entrance.position.set(0,0,d/2+.12);g.add(entrance);
 const towerHeight=h*1.95;box(5.8,towerHeight,2.8,stone,0,towerHeight/2,-1.2,entrance);
 box(6.2,.4,3.1,trim,0,towerHeight-.4,-1.2,entrance);
 archPanel(3.5,5.5,trim,0,0,.24,0,entrance);archPanel(2.95,4.95,wood,0,0,.28,0,entrance);
 archPanel(2.1,5.2,trim,0,towerHeight*.53,.25,0,entrance);archPanel(1.65,4.7,dark,0,towerHeight*.55,.29,0,entrance);
 for(const xx of [-.55,0,.55]){box(.065,4.25,.06,trim,xx,towerHeight*.55+2.1,.35,entrance);box(.08,3.7,.06,trim,xx,2,.34,entrance);}
 for(const yy of [h-.1,towerHeight-.9])box(6.1,.3,3.1,trim,0,yy,-1.2,entrance);
 for(const xx of [-2.75,2.75])box(.5,towerHeight+1.3,.55,trim,xx,(towerHeight+1.3)/2,.1,entrance);
 for(let j=0;j<8;j++)box(.38,.7,.4,trim,-2.6+j*.75,towerHeight+.15,.08,entrance);
 for(const side of [-1,1]){box(w,.65,.3,stone,0,h+.325,side*d/2,g);for(let i=0;i<Math.ceil(w/2.5);i++)box(.65,.4,.4,trim,-w/2+i*2.5,h+.7,side*d/2,g);}
 for(const side of [-1,1]){const face=new THREE.Group();face.position.set(side*w/2,0,0);face.rotation.y=side*Math.PI/2;g.add(face);archPanel(2.9,4.5,trim,0,0,.1,0,face);archPanel(2.3,3.9,wood,0,0,.14,0,face);}
 for(const z of [-d*.25,d*.25]){const stair=new THREE.Group();stair.position.set(-w/2-.25,0,z);g.add(stair);box(1.5,h+1,1.6,metal,0,(h+1)/2,0,stair);box(.06,h,1.4,dark,-.8,h/2,0,stair);for(let yy=1;yy<h;yy+=1.5)box(.12,.06,1.45,trim,-.85,yy,0,stair);}
 }

 if(dealy||freeman){for(const side of [-1,1]){const entry=new THREE.Group();entry.position.set(0,0,side*d/2);entry.rotation.y=side===1?0:Math.PI;g.add(entry);archPanel(2.8,4.1,trim,0,0,.1,0,entry);archPanel(2.2,3.6,dark,0,0,.14,0,entry);box(.08,3,.08,metal,0,1.5,.2,entry);}for(const xx of [-w*.35,w*.35]){box(.65,h+.5,.65,trim,xx,(h+.5)/2,d/2,g);}}
 if(keating){
 const entrance=new THREE.Group();entrance.position.set(-w/2-.2,0,0);entrance.rotation.y=-Math.PI/2;g.add(entrance);
 box(4.8,h+1.2,.4,stone,0,(h+1.2)/2,-.15,entrance);
 archPanel(3.4,4.8,trim,0,.5,.12,0,entrance);archPanel(2.65,4.2,dark,0,.5,.16,0,entrance);box(1.8,2.8,.15,wood,0,1.9,.19,entrance);
 for(const xx of [-.88,0,.88])box(.07,2.8,.08,trim,xx,1.9,.29,entrance);
 archPanel(3.2,3.7,trim,0,7,.12,0,entrance);archPanel(2.75,3.25,dark,0,7.1,.16,0,entrance);
 for(const xx of [-.9,-.45,0,.45,.9])box(.055,2.55,.05,trim,xx,8.4,.22,entrance);box(2.75,.07,.05,trim,0,8.1,.24,entrance);
 for(const yy of [5.2,5.6,6,6.4])for(const xx of [-1.1,-.55,0,.55,1.1]){const rosette=new THREE.Mesh(new THREE.TorusGeometry(.2,.035,4,8),trim);rosette.position.set(xx,yy,.18);entrance.add(rosette);}
 for(let i=0;i<12;i++)box(17+i*.15,.08+i*.07,.55,trim,0,(.08+i*.07)/2,6.3-i*.52,entrance);for(const xx of [-9,9]){box(.3,.85,6.6,trim,xx,.43,3,entrance);for(let zz=.4;zz<6.4;zz+=1.2)box(.48,1.05,.48,stone,xx,.525,zz,entrance);}
 for(const zz of [-d/2+.3,0,d/2-.3]){const turret=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,1.1,8),stone);turret.position.set(-w/2,h+.55,zz);g.add(turret);}
 for(const xx of [-w/2,w/2])box(.3,.7,d,stone,xx,h+.35,0,g);for(const zz of [-d/2,d/2])box(w,.7,.3,stone,0,h+.35,zz,g);
 }
 if(church){
 for(const side of [-1,1])for(let j=0;j<3;j++){const wall=new THREE.Group();wall.position.set(side*(w/2+.04),0,-d*.26+j*d*.26);wall.rotation.y=side*Math.PI/2;g.add(wall);archPanel(1.8,5.6,trim,0,3.3,.04,0,wall);archPanel(1.45,5.15,stainedMat,0,3.45,.06,0,wall);box(.08,4.3,.08,trim,0,5.7,.1,wall);box(1.45,.07,.08,trim,0,5.6,.1,wall);}
 // Transept-inspired window surrounds and buttress caps, outside the collision footprint.
 for(const sign of [-1,1])for(let j=0;j<4;j++){const z=-d*.36+j*d*.24;box(.8,h*.82,.48,stone,sign*(w/2+.2),h*.41,z,g);roof(.85,.65,.45,sign*(w/2+.2),h*.82,z,g);}
 }
 // Gutters and downpipes give the roof edges scale at walking height.
 if(!tower&&!modern){for(const side of [-1,1]){box(.12,.12,d,metal,side*(w/2+.12),h-.05,0,g);box(.09,h-.3,.09,metal,side*(w/2+.12),(h-.3)/2,d/2-.3,g);}}
 // String courses and corner quoins add depth to the historic facades.
 if(!modern&&!tower){for(const yy of [h*.32,h*.65]){box(w+.18,.12,d+.18,trim,0,yy,0,g);}for(const xx of [-w/2,w/2])for(const zz of [-d/2,d/2])for(let yy=.8;yy<h;yy+=1.1)box(.38,.5,.38,trim,xx,yy,zz,g);}
 // Campus banners: original lettering rather than a copied university logo.
 if(keating||church||b.name==='HUGHES HALL'){for(const sign of [-1,1]){box(.9,2,.12,maroon,sign*w*.32,3.5,d/2+.12,g);}}
}
// Alpha-tested leaf clusters break up the canopy silhouette at walking distance.
const leavesTexture=canvasTexture((c,w,h)=>{
 const random=seededRandom(550);
 for(let cluster=0;cluster<13;cluster++){
  const angle=random()*Math.PI*2,radius=cluster===0?0:Math.sqrt(random())*w*.32;
  const cx=w*.5+Math.cos(angle)*radius,cy=h*.5+Math.sin(angle)*radius;
  for(let leaf=0;leaf<53;leaf++){
   const a=random()*Math.PI*2,r=Math.sqrt(random())*w*.13;
   const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
   const tint=Math.floor(40+random()*71);
   c.fillStyle='rgb('+(tint-3)+','+(tint+18)+','+(tint-23)+')';
   c.beginPath();c.ellipse(x,y,2+random()*5,1.3+random()*3,a,0,Math.PI*2);c.fill();
  }
 }
},256,256);
const leafMaterials=['#c2cc95','#bac5a0','#ddd1a1'].map(color=>
 material(color,{map:leavesTexture,alphaTest:.39,side:THREE.DoubleSide,roughness:1}));
const barkTexture=surfaceTexture((c,w,h)=>{
 c.fillStyle='#625344';c.fillRect(0,0,w,h);const random=seededRandom(347);
 for(let i=0;i<1800;i++){
  c.strokeStyle=i%2?'#342b226b':'#aa8e6b75';c.lineWidth=1+random()*4;
  const x=random()*w,y=random()*h;
  c.beginPath();c.moveTo(x,y);c.lineTo(x-3+random()*6,y+8+random()*95);c.stroke();
 }
});
const bark=material('#c6ae96',{map:barkTexture,bumpMap:barkTexture,bumpScale:.075});
function branch(a,b,r,parent){
 const delta=b.clone().sub(a),m=new THREE.Mesh(new THREE.CylinderGeometry(r*.56,r,delta.length(),8),bark);
 m.position.copy(a).add(b).multiplyScalar(.5);
 m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
 m.castShadow=m.receiveShadow=true;parent.add(m);
}
for(const [index,t] of state.trees.entries()){
 const random=seededRandom(35+index*113),g=new THREE.Group();
 const framesKeating=t.x*S>248&&t.x*S<258&&(t.y*S>233&&t.y*S<239||t.y*S>275&&t.y*S<281);
 const crownScale=framesKeating?1.55:1,height=(7.3+(index%4)*.62)*crownScale;
 g.position.set(t.x*S,0,t.y*S);scene.add(g);
 const fork=new THREE.Vector3(.21,height*.54,0);
 branch(new THREE.Vector3(),fork,.41,g);
 branch(fork,new THREE.Vector3(-.25,height,0),.25,g);
 const foliage=leafMaterials[index%leafMaterials.length];
 const detailed=t.x*S>188&&t.x*S<269&&t.y*S>205&&t.y*S<306;
 for(let j=0;j<7;j++){
  const angle=j*Math.PI*2/7+index*.61,radius=(1.5+random()*2.3)*crownScale;
  const end=new THREE.Vector3(Math.cos(angle)*radius,height-1+random()*2.7,Math.sin(angle)*radius);
  branch(fork,end,.135,g);
  if(detailed){
   for(const sign of [-1,1]){
    const twig=end.clone().add(new THREE.Vector3(Math.cos(angle+sign)*1.65,.7+random(),Math.sin(angle+sign)*1.65));
    branch(fork.clone().lerp(end,.7),twig,.061,g);
    const spray=new THREE.Mesh(new THREE.PlaneGeometry(4.3,3.9),foliage);
    spray.position.copy(twig);
    spray.rotation.set(-.65+random()*1.4,angle+sign*.9,sign*.2);
    spray.castShadow=spray.receiveShadow=true;
    g.add(spray);
   }
  }
  for(let k=0;k<4;k++){
   const size=(3.7+random()*2.4)*crownScale,leaf=new THREE.Mesh(new THREE.PlaneGeometry(size,size),foliage);
   leaf.position.copy(end).add(new THREE.Vector3((random()-.5)*2,(random()-.25)*1.8,(random()-.5)*2));
   leaf.rotation.set((random()-.5)*2,k*Math.PI/4+angle,(random()-.5)*.5);
   leaf.castShadow=leaf.receiveShadow=true;g.add(leaf);
  }
 }
}
for(const [text,px,py] of [['DUANE LIBRARY',914,913],['EDWARDS PARADE',1060,738],['HUGHES HALL',1040,670],['McSHANE CENTER',1042,539],['ROSE HILL GYM',1231,550]]){sign(text,(px-450)/24*S,(py-150)/18*S);}
for(const [x,z] of [[26,28],[26,35],[30.3,28],[30.3,35],[14,23],[8,48]]){box(3,.25,1.1,stone,x*S,.13,z*S);for(let i=0;i<6;i++){const bush=new THREE.Mesh(new THREE.IcosahedronGeometry(.45,1),material('#3e6140'));bush.position.set(x*S-1.1+i*.44,.5,z*S);bush.castShadow=true;scene.add(bush);const flower=new THREE.Mesh(new THREE.SphereGeometry(.09,5,4),material(i%2?'#e9b6c9':'#f0d594'));flower.position.set(x*S-1.1+i*.44,.92,z*S);scene.add(flower);}}
// Small leaves sit flush with the lawn around its trees, without extra draw calls per leaf.
const leafLitter=new THREE.InstancedMesh(new THREE.CircleGeometry(1,5),
 material('#ffffff',{roughness:.95,side:THREE.DoubleSide}),state.trees.length*22);
const leafPose=new THREE.Object3D(), leafRandom=seededRandom(918);
const leafTones=['#816541','#996e39','#7b7842','#a88851','#735641'].map(color=>new THREE.Color(color));
for(const [i,tree] of state.trees.entries()){
 for(let j=0;j<22;j++){
  const angle=leafRandom()*Math.PI*2, radius=.5+Math.sqrt(leafRandom())*4.8;
  leafPose.position.set(tree.x*S+Math.sin(angle)*radius,.014,tree.y*S+Math.cos(angle)*radius);
  leafPose.rotation.set(-Math.PI/2,0,angle);
  const size=.025+leafRandom()*.055;
  leafPose.scale.set(size,size*.59,1);leafPose.updateMatrix();
  const index=i*22+j;
  leafLitter.setMatrixAt(index,leafPose.matrix);leafLitter.setColorAt(index,leafTones[index%leafTones.length]);
 }
}
leafLitter.receiveShadow=true;scene.add(leafLitter);
// Continue the canopy beyond the map edge so distant views have depth.
const distanceLeaves=material('#a6ae80',{map:leavesTexture,alphaTest:.34,side:THREE.DoubleSide});
const distantTreeRandom=seededRandom(764);
const horizonTrees=[];
const {minX,maxX,minY,maxY}=state.bounds;
for(const side of [-1,1]){
 const edge=(side<0?minX:maxX)*S;
 for(let index=0;index<12;index++){
  horizonTrees.push([edge+side*(12+distantTreeRandom()*29),minY*S+index*23+distantTreeRandom()*11]);
 }
}
for(const edge of [minY*S,maxY*S]){
 const outward=edge===minY*S?-1:1;
 for(let i=0;i<18;i++){
  horizonTrees.push([minX*S+i*12+distantTreeRandom()*9,edge+outward*(7+distantTreeRandom()*32)]);
 }
}
const horizonTrunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.07,.24,1,5),bark,horizonTrees.length);
const horizonCanopy=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),distanceLeaves,horizonTrees.length*3);
const treePose=new THREE.Object3D();
for(const [index,[x,z]] of horizonTrees.entries()){
 const height=7+distantTreeRandom()*8;
 treePose.position.set(x,height/2,z);
 treePose.rotation.set(0,0,0);
 treePose.scale.set(1,height,1);
 treePose.updateMatrix();
 horizonTrunks.setMatrixAt(index,treePose.matrix);
 for(let i=0;i<3;i++){
  treePose.position.set(x+(distantTreeRandom()-.5)*2.6,height*(.72+i*.093),z+(distantTreeRandom()-.5)*2.5);
  treePose.rotation.set((i-1)*.28,i*Math.PI/3,0);
  treePose.scale.set(height*.91,height*.73,1);
  treePose.updateMatrix();
  horizonCanopy.setMatrixAt(index*3+i,treePose.matrix);
 }
}
scene.add(horizonTrunks,horizonCanopy);
// Slatted benches and lanterns on the walks around Eddie's.
const benchGrain=surfaceTexture((c,w,h)=>{
 const random=seededRandom(934);
 c.fillStyle='#a88360';c.fillRect(0,0,w,h);
 for(let i=0;i<1900;i++){
  const x=random()*w,y=random()*h,run=30+random()*160;
  c.strokeStyle=i%3?'#68462f32':'#e5c6a043';
  c.lineWidth=.4+random()*1.1;
  c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+run*.35,y+3,x+run*.7,y-3,x+run,y);c.stroke();
 }
});
const benchOak=material('#94765f',{map:benchGrain,bumpMap:benchGrain,bumpScale:.035,roughness:.88});
const castIron=material('#383d36',{metalness:.48,roughness:.59});
const boltMat=material('#81806e',{metalness:.44,roughness:.46});
const lampWindow=material('#bea982',{emissive:'#e8b373',emissiveIntensity:.08,roughness:.29});
function buildWalkBench(x,z,heading){
 const g=new THREE.Group();
 g.position.set(x,0,z);g.rotation.y=heading;scene.add(g);
 for(let i=0;i<6;i++)box(2.17,.054,.091,benchOak,0,.57,-.235+i*.087,g);
 for(let i=0;i<4;i++)box(2.17,.106,.043,benchOak,0,.762+i*.113,.27+i*.025,g);
 for(const x of [-.78,.78]){
  box(.155,.042,.22,castIron,x,.021,-.23,g);
  box(.155,.042,.22,castIron,x,.021,.25,g);
  const curves=[
   [[x,.041,-.22],[x,.23,-.18],[x,.55,-.28],[x,.6,.25],[x,1.12,.38]],
   [[x,.041,.25],[x,.34,.14],[x,.59,.25],[x,.81,.25]],
   [[x,.59,-.24],[x,.78,-.16],[x,.8,.06],[x,.69,.25]]
  ];
  for(const points of curves){
   const frame=new THREE.Mesh(new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map(point=>new THREE.Vector3(...point))),12,.028,6,false),castIron);
   frame.castShadow=frame.receiveShadow=true;g.add(frame);
  }
  for(let i=0;i<4;i++)box(.026,.023,.009,boltMat,x,.762+i*.113,.245+i*.025,g);
 }
}
function buildWalkLamp(x,z){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 const shaft=new THREE.Mesh(new THREE.LatheGeometry([
  [.22,.02],[.22,.13],[.158,.17],[.15,.56],[.088,.72],[.072,3.52],[.12,3.64]
 ].map(([r,y])=>new THREE.Vector2(r,y)),10),castIron);
 shaft.castShadow=shaft.receiveShadow=true;g.add(shaft);
 box(.36,.095,.36,castIron,0,3.65,0,g);
 box(.274,.43,.274,lampWindow,0,3.91,0,g);
 for(const dx of [-.163,.163])for(const dz of [-.163,.163])box(.029,.49,.029,castIron,dx,3.91,dz,g);
 const cap=new THREE.Mesh(new THREE.ConeGeometry(.33,.21,4),castIron);
 cap.position.y=4.25;cap.rotation.y=Math.PI/4;cap.castShadow=true;g.add(cap);
 const finial=new THREE.Mesh(new THREE.SphereGeometry(.056,8,6),castIron);
 finial.position.y=4.4;g.add(finial);
}
for(let i=0;i<8;i++){
 const x=(i%2?30.1:25.3)*S,z=(27+Math.floor(i/2)*2.6)*S;
 buildWalkBench(x,z,i%2?Math.PI/2:-Math.PI/2);
 buildWalkLamp(x+1.8,z);
}
// Parked fictional campus shuttle: scenery for the optional meetup story.
const shuttle=new THREE.Group();shuttle.position.set((1042-450)/24*S,0,(832-150)/18*S);scene.add(shuttle);
box(2.3,1.8,5.7,maroon,0,1.25,0,shuttle);box(2.4,.25,5.8,cream,0,2.26,0,shuttle);box(2.1,.85,.06,dark,0,1.82,-2.88,shuttle);
for(const side of [-1,1]){for(let i=0;i<3;i++)box(.06,.7,1.05,dark,side*1.17,1.85,-1.7+i*1.45,shuttle);for(const z of [-1.9,1.9]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.47,.47,.22,14),dark);wheel.rotation.z=Math.PI/2;wheel.position.set(side*1.18,.47,z);shuttle.add(wheel);}}
const vanLabel=canvasTexture((c,w,h)=>{c.fillStyle='#711d3b';c.fillRect(0,0,w,h);c.fillStyle='#f5e4c0';c.font='bold 50px Arial';c.textAlign='center';c.fillText('RAM VAN',w/2,h*.48);c.font='24px Arial';c.fillText('ROSE HILL CAMPUS SHUTTLE',w/2,h*.76);},512,256);
for(const side of [-1,1]){const label=new THREE.Mesh(new THREE.PlaneGeometry(2.9,1.1),new THREE.MeshStandardMaterial({map:vanLabel}));label.position.set(side*1.18,1.15,.2);label.rotation.y=side*Math.PI/2;shuttle.add(label);}
// Cunniffe courtyard: patterned paving, planted two-tier fountain, ram, benches and tables.
const plaza=surfaceTexture((c,w,h)=>{
 const random=seededRandom(611);
 c.fillStyle='#8e9087';c.fillRect(0,0,w,h);
 for(let row=0;row<16;row++){
  const y=row*32,shift=row%2?32:0;
  for(let x=-64;x<w;x+=64){
   const shade=155+Math.floor(random()*21);
   c.fillStyle='rgb('+(shade+6)+','+(shade+5)+','+(shade-3)+')';
   c.fillRect(x+shift+.6,y+.8,62.8,30.4);
   c.fillStyle='#f0ead31f';c.fillRect(x+shift+2,y+2,60,1);
  }
 }
 for(let i=0;i<10000;i++){
  c.fillStyle=i%3?'#fff9e319':'#514a402a';c.fillRect(random()*w,random()*h,2,2);
 }
});
const courtStone=material('#e8e3d2',{map:plaza,bumpMap:plaza,bumpScale:.05});
tiledGround(38,36,courtStone,((978-450)/24)*S,.038,((699-150)/18)*S,8);
const fp=state.landmarks.find(p=>p.id==='fountain'),fountain=new THREE.Group();
fountain.position.set(fp.x*S,0,fp.y*S);scene.add(fountain);
const fountainIron=material('#37443e',{metalness:.43,roughness:.48});
const fountainLip=material('#526058',{metalness:.52,roughness:.43});
function fountainLathe(points,mat,y){
 const mesh=new THREE.Mesh(new THREE.LatheGeometry(points.map(([x,h])=>new THREE.Vector2(x,h)),48),mat);
 mesh.position.y=y;mesh.castShadow=mesh.receiveShadow=true;fountain.add(mesh);
}
fountainLathe([[0,0],[2.55,0],[2.55,.11],[2.42,.17],[2.42,.42],[2.32,.5],[2.24,.5],[2.24,.13],[0,.13]],fountainIron,0);
fountainLathe([[.57,.05],[.6,.16],[.48,.26],[.32,.47],[.26,.92],[.36,1.12],[.4,1.23],
 [.21,1.46],[.14,2.05],[.26,2.3],[.15,2.76],[.09,3.42],[0,3.52]],fountainIron,.25);
const fountainTiers=[{radius:1.18,y:1.65,fall:1.29},{radius:.77,y:2.9,fall:1.21}];
for(const {radius,y} of fountainTiers){
 fountainLathe([[.15,-.32],[radius*.45,-.28],[radius*.75,-.16],[radius,-.045],
  [radius,.055],[radius-.065,.055],[radius*.7,-.04],[.14,-.04]],fountainIron,y);
 const lip=new THREE.Mesh(new THREE.TorusGeometry(radius-.015,.043,8,48),fountainLip);
 lip.rotation.x=Math.PI/2;lip.position.y=y+.03;fountain.add(lip);
}
const bedSoil=material('#6d5c46');
fountainLathe([[2.43,.03],[2.72,.035],[2.71,.092],[2.43,.092]],bedSoil,0);
const courtyardLeaves=material('#bac29b',{map:leavesTexture,alphaTest:.39,side:THREE.DoubleSide});
for(let i=0;i<17;i++){
 const angle=i*Math.PI*2/17,x=Math.cos(angle)*2.6,z=Math.sin(angle)*2.6;
 const plant=new THREE.Mesh(new THREE.PlaneGeometry(.46,.46),courtyardLeaves);
 plant.position.set(x,.21,z);plant.rotation.set(-.3,angle,.1);fountain.add(plant);
}
const fountainFinial=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),fountainIron);
fountainFinial.position.y=3.78;fountain.add(fountainFinial);
buildRamStatue();
function courtyardBench(x,z,angle=0){const bench=new THREE.Group();bench.position.set(x,0,z);bench.rotation.y=angle;scene.add(bench);for(let j=0;j<5;j++)box(2.3,.055,.1,wood,0,.52,-.23+j*.12,bench);for(let j=0;j<3;j++)box(2.3,.12,.06,wood,0,.86+j*.14,.3,bench);for(const dx of [-.85,.85]){box(.09,.55,.55,metal,dx,.27,0,bench);box(.07,.4,.07,metal,dx,.8,.25,bench);}}
for(const [x,y,a] of [[941,701,Math.PI/2],[1004,718,-Math.PI/2],[957,725,0]]){const p={x:(x-450)/24,y:(y-150)/18};courtyardBench(p.x*S,p.y*S,a);}
for(const [x,y] of [[1010,671],[1021,681]]){const px=(x-450)/24*S,pz=(y-150)/18*S,table=new THREE.Mesh(new THREE.CylinderGeometry(.65,.65,.07,20),wood);table.position.set(px,.82,pz);scene.add(table);box(.1,.8,.1,metal,px,.4,pz);for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){const cx=px+Math.cos(a),cz=pz+Math.sin(a);box(.45,.07,.45,wood,cx,.45,cz);for(const dx of [-.16,.16])box(.04,.45,.04,metal,cx+dx,.225,cz);}}
// A low perimeter treatment marks the playable crop without inventing more buildings.
for(const z of [state.bounds.minY*S+.3,state.bounds.maxY*S-.3])for(let x=state.bounds.minX*S+1;x<state.bounds.maxX*S;x+=3){box(.09,.7,.09,wood,x,.35,z);box(3,.04,.04,metal,x+1.5,.5,z);}
// Fictional founder mixer and student DJ setup: movable-event dressing, not campus architecture.
function eventLettering(text,width,height,color='#e7d7b7'){const tex=canvasTexture((c,w,h)=>{c.fillStyle='#182b35';c.fillRect(0,0,w,h);c.strokeStyle='#b89b67';c.lineWidth=8;c.strokeRect(10,10,w-20,h-20);c.fillStyle=color;c.textAlign='center';c.font='bold 45px Georgia';const lines=text.split('|');lines.forEach((line,i)=>c.fillText(line,w/2,h*(i+1)/(lines.length+1),w-45));},768,384);return new THREE.Mesh(new THREE.PlaneGeometry(width,height),material('#ffffff',{map:tex}));}
const mixer=new THREE.Group(),mixerP={x:(1047-450)/24*S,z:(704-150)/18*S};mixer.position.set(mixerP.x,0,mixerP.z);mixer.rotation.y=Math.PI/2;scene.add(mixer);
box(3.5,.16,1.3,wood,0,1.02,0,mixer);for(const x of [-1.4,1.4])box(.08,1,.85,metal,x,.5,0,mixer);box(3.55,.5,.04,maroon,0,.78,.69,mixer);
const mixerSign=eventLettering('CUFFLINK|FOUNDERS MIXER|DRESS CODE: CONNECTIONS',4.2,2.1);mixerSign.position.set(0,2.8,-.9);mixer.add(mixerSign);for(const x of [-1.9,1.9])box(.06,2.8,.06,metal,x,1.4,-.95,mixer);
for(const x of [-1.15,0,1.15]){box(.65,.025,.44,metal,x,1.13,0,mixer);const lid=box(.65,.42,.025,metal,x,1.34,-.19,mixer);lid.rotation.x=-.16;box(.57,.34,.012,material('#526b70',{emissive:'#8aaec1',emissiveIntensity:.3}),x,1.34,-.16,mixer);}
for(const x of [-1.45,1.45]){const glass=new THREE.Mesh(new THREE.CylinderGeometry(.045,.027,.15,10),cream);glass.position.set(x,1.2,.35);mixer.add(glass);}
const dj=new THREE.Group();dj.position.set((1157-450)/24*S,0,(719-150)/18*S);scene.add(dj);box(4.2,1.05,1.4,maroon,0,.525,0,dj);const djSign=eventLettering('DUE DILIGENCE|DUBIOUS DECISIONS',3.9,.9);djSign.position.set(0,.56,.72);dj.add(djSign);for(const x of [-1.05,1.05]){const deck=new THREE.Mesh(new THREE.CylinderGeometry(.44,.44,.06,24),dark);deck.position.set(x,1.13,0);dj.add(deck);const label=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.065,16),gold);label.position.set(x,1.15,0);dj.add(label);}box(.7,.1,.65,metal,0,1.12,0,dj);
const stringMat=material('#f8db95',{emissive:'#ffbd62',emissiveIntensity:.8});
const cableStart=new THREE.Vector3((1076-450)/24*S,4.6,(687-150)/18*S),cableEnd=new THREE.Vector3((1192-450)/24*S,4.6,(687-150)/18*S);
const cablePoints=[];for(let i=0;i<=28;i++){const t=i/28,p=cableStart.clone().lerp(cableEnd,t);p.y-=Math.sin(t*Math.PI)*.65;cablePoints.push(p);if(i%2===0){const bulb=new THREE.Mesh(new THREE.SphereGeometry(.075,8,6),stringMat);bulb.position.copy(p);scene.add(bulb);}}
const cable=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cablePoints),40,.016,5,false),metal);scene.add(cable);for(const point of [cableStart,cableEnd])box(.07,4.7,.07,metal,point.x,2.35,point.z);

// Batch fixed scenery by material so added detail does not require thousands of draw calls.
function batchScenery(){scene.updateMatrixWorld(true);const batches=new Map(),remove=[];scene.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;const key=o.material.uuid+':'+o.castShadow+':'+o.receiveShadow;if(!batches.has(key))batches.set(key,{mat:o.material,cast:o.castShadow,receive:o.receiveShadow,parts:[]});const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrixWorld);batches.get(key).parts.push(geo);remove.push(o);});
 for(const o of remove)o.removeFromParent();for(const b of batches.values()){const geometry=new THREE.BufferGeometry();for(const attr of ['position','normal','uv']){const size=attr==='uv'?2:3;const total=b.parts.reduce((n,g)=>n+g.attributes.position.count,0),data=new Float32Array(total*size);let offset=0;for(const g of b.parts){const values=g.attributes[attr]?.array;if(values)data.set(values,offset);offset+=g.attributes.position.count*size;}geometry.setAttribute(attr,new THREE.BufferAttribute(data,size));}const mesh=new THREE.Mesh(geometry,b.mat);mesh.castShadow=b.cast;mesh.receiveShadow=b.receive;geometry.computeBoundingSphere();scene.add(mesh);for(const part of b.parts)part.dispose();}}
batchScenery();

// Run the water separately from the static courtyard. One draw call covers the falling droplets.
const fountainWaterMap=surfaceTexture((c,w,h)=>{
 const random=seededRandom(122);
 c.fillStyle='#627d79';c.fillRect(0,0,w,h);
 for(let i=0;i<110;i++){
  const x=random()*w,y=random()*h;
  c.strokeStyle=i%3?'#b3cbc05b':'#354c526f';c.lineWidth=1+random()*4;
  c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+21,y-7,x+37+random()*28,y+2);c.stroke();
 }
});
fountainWaterMap.repeat.set(2.6,2.6);
const basinWater=new THREE.Mesh(new THREE.CircleGeometry(2.225,56),material('#c2d4cd',{
 map:fountainWaterMap,bumpMap:fountainWaterMap,bumpScale:.045,roughness:.25,metalness:.12
}));
basinWater.rotation.x=-Math.PI/2;basinWater.position.y=.37;basinWater.receiveShadow=true;fountain.add(basinWater);
const fallingWater=new THREE.InstancedMesh(new THREE.SphereGeometry(1,5,4),new THREE.MeshBasicMaterial({
 color:'#c8e9e4',transparent:true,opacity:.63,depthWrite:false
}),96);
fallingWater.frustumCulled=false;
fallingWater.instanceMatrix.setUsage(THREE.DynamicDrawUsage);fountain.add(fallingWater);
const dropTransform=new THREE.Object3D();
let lastFountainTime=-1;
function updateFountain(time){
 const nearby=Math.hypot(camera.position.x-fountain.position.x,camera.position.z-fountain.position.z)<58;
 fallingWater.visible=nearby;
 if(!nearby||time===lastFountainTime)return;
 lastFountainTime=time;
 fountainWaterMap.offset.set(time*.018,time*.009);
 for(let i=0;i<fallingWater.count;i++){
  const {radius,y,fall}=fountainTiers[i%2],angle=(i>>1)%24*Math.PI/12;
  const t=(time*1.15+i*.61803399)%1,r=radius+t*.16;
  dropTransform.position.set(Math.cos(angle)*r,y+.03-t*t*fall,Math.sin(angle)*r);
  dropTransform.scale.set(.012,.027+t*.067,.012);
  dropTransform.updateMatrix();fallingWater.setMatrixAt(i,dropTransform.matrix);
 }
 fallingWater.instanceMatrix.needsUpdate=true;
}


// One sky dome and a small tiled cloud mask cover the horizon in every camera direction.
const cloudMask=surfaceTexture((c,w,h)=>{
 c.fillStyle='#000';c.fillRect(0,0,w,h);
 const random=seededRandom(130);
 c.globalCompositeOperation='screen';
 for(let i=0;i<20;i++){
  const x=random()*w,y=random()*h,width=24+random()*58,height=7+random()*17;
  for(let offset=-w;offset<=w;offset+=w){
   c.save();c.translate(x+offset,y);c.scale(width,height);
   const fade=c.createRadialGradient(0,0,.13,0,0,1);
   fade.addColorStop(0,'rgba(255,255,255,.8)');fade.addColorStop(.48,'rgba(255,255,255,.45)');fade.addColorStop(1,'rgba(255,255,255,0)');
   c.fillStyle=fade;c.fillRect(-1,-1,2,2);c.restore();
  }
 }
});
cloudMask.colorSpace=THREE.NoColorSpace;
const skyColors={
 day:['#3276b3','#bfdbec','#f7eed6','#e7edf2'],
 sunset:['#376aa2','#e8baa2','#ffd4a2','#e7c3b4'],
 night:['#080f23','#293857','#41516c','#61728c']
};
const skyMaterial=new THREE.ShaderMaterial({
 side:THREE.BackSide,depthWrite:false,depthTest:false,toneMapped:false,
 uniforms:{zenith:{value:new THREE.Color()},horizon:{value:new THREE.Color()},
  glow:{value:new THREE.Color()},cloudColor:{value:new THREE.Color()},
  sunDirection:{value:new THREE.Vector3()},clouds:{value:cloudMask},
  time:{value:0},night:{value:0},daylight:{value:0},
  skyPhoto:{value:campusSurfaces.sky||cloudMask},photoAvailable:{value:Number(!!campusSurfaces.sky)}},
 vertexShader:`
  varying vec3 direction;
  void main() {
   direction = position;
   gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
 `,
 fragmentShader:`
  uniform vec3 zenith, horizon, glow, cloudColor, sunDirection;
  uniform sampler2D clouds,skyPhoto;
  uniform float time,night,daylight,photoAvailable;
  varying vec3 direction;
  void main() {
   vec3 d = normalize(direction);
   float up = max(d.y, 0.0);
   vec3 color = mix(horizon, zenith, pow(up, 0.51));
   float light = max(dot(d, sunDirection), 0.0);
   color = mix(color, glow, pow(light, 7.0) * (1.0-night*0.8));
   vec2 cloudPlane=d.xz/(.37+up)*.52;
   vec2 drift=vec2(time*.0014,time*.0006);
   vec2 cloudUV=cloudPlane+drift;
   float low=texture2D(clouds,cloudUV).r;
   float grain=texture2D(clouds,cloudUV*2.83+vec2(.37,.18)).r;
   float wisps=texture2D(clouds,cloudUV*5.24+vec2(.16,.48)).r;
   float cover=low*.73+grain*.23+wisps*.07;
   float cloud=smoothstep(.24,.58,cover)*smoothstep(.045,.29,up)*(1.0-photoAvailable*.75);
   float silver=smoothstep(.2,.54,cover)*.36+pow(light,7.0)*.27;
   vec3 shaded=mix(zenith*.81,cloudColor,0.4+silver);
   color=mix(color,shaded,cloud*(.97-night*.57));
   if(photoAvailable>.5){
    float longitude=atan(d.z,d.x)*.159155+.32+time*.00007;
    float latitude=asin(clamp(d.y,0.,1.))*.31831+.5;
    vec3 photo=texture2D(skyPhoto,vec2(longitude,latitude)).rgb;
    float chroma=max(max(photo.r,photo.g),photo.b)-min(min(photo.r,photo.g),photo.b);
    float cloudLight=smoothstep(.22,.67,dot(photo,vec3(.25,.60,.15)))*(1.-.72*chroma);
    vec3 evening=mix(color, mix(cloudColor*.64,glow*.67,pow(light,3.0)),cloudLight*.74);
    vec3 nightSky=mix(color,vec3(.15,.19,.28),cloudLight*.27);
    vec3 graded=mix(mix(evening,photo,daylight),nightSky,night);
    color=mix(color,graded,smoothstep(.01,.15,up));
   }
   color+=glow*smoothstep(.9988,.99955,light)*(1.0-night)*(1.0-daylight*.82);
   gl_FragColor = vec4(color,1.0);
   #include <colorspace_fragment>
  }
 `
});
const sky=new THREE.Mesh(new THREE.SphereGeometry(480,32,20),skyMaterial);
sky.renderOrder=-100;
sky.frustumCulled=false;
scene.add(sky);
const ambientWindows=new Set();scene.traverse(o=>{if(o.isMesh&&o.material?.emissive&&o.material.roughness<.55&&o.material.color.g>o.material.color.r*1.03)ambientWindows.add(o.material);});
const campusLights=[];
for(const [x,y] of [[1044,690],[1157,719],[1118,525],[1190,552],[1018,706],[1135,804],[904,898]]){
 const light=new THREE.PointLight('#ffbc70',0,24,1.5);
 light.position.set((x-450)/24*S,4,(y-150)/18*S);
 scene.add(light);campusLights.push(light);
}
const entranceLights=[];
for(const y of [693,720,749]){
 const light=new THREE.SpotLight('#ffd49b',0,23,.58,.57,1.25);
 light.position.set((1228-450)/24*S,.24,(y-150)/18*S);
 light.target.position.set((1241-450)/24*S,9,(y-150)/18*S);
 scene.add(light,light.target);entranceLights.push(light);
}
const lightOffset=new THREE.Vector3();
let environmentMode='';
function updateEnvironment(mode='sunset'){
 if(mode===environmentMode)return;
 environmentMode=mode;
 const uniforms=skyMaterial.uniforms,palette=skyColors[mode]||skyColors.sunset;
 for(const [index,key] of ['zenith','horizon','glow','cloudColor'].entries())uniforms[key].value.set(palette[index]);
 const night=mode==='night',day=mode==='day';
 uniforms.night.value=Number(night);
 uniforms.daylight.value=Number(day);
 scene.background.set(palette[1]);
 scene.fog.color.set(night?'#26394d':day?'#bbcbd2':'#c6bfb2');
 scene.fog.near=night?77:95;
 scene.fog.far=night?270:295;
 sun.color.set(day?'#fff3e2':night?'#99b7ed':'#ffddad');
 sun.intensity=night?.59:day?2.48:2.37;
 lightOffset.set(day?-72:night?38:-91,day?145:night?126:67,day?-49:night?-70:-61);
 uniforms.sunDirection.value.copy(lightOffset).normalize();
 const hemi=scene.children.find(o=>o.isHemisphereLight);
 hemi.intensity=night?1.42:day?1.6:1.53;
 hemi.color.set(night?'#93acd8':day?'#e0edff':'#d9e6fa');
 hemi.groundColor.set(night?'#30384b':'#71715b');
 renderer.toneMappingExposure=night?1.17:day?1.02:1.09;
 scene.environmentIntensity=night?.13:day?.38:.29;
 for(const light of campusLights)light.intensity=night?45:day?0:10;
 for(const light of entranceLights)light.intensity=night?110:0;
 lampWindow.emissiveIntensity=night?1.5:day?0:.12;
 for(const mat of ambientWindows){
  mat.emissive.set('#f7ca8c');
  mat.emissiveIntensity=night?(mat===keatingNightGlass?.30:mat===keatingCoolGlass?.034:.19):day?0:.025;
 }
}
const humanGeometry={
 head:new THREE.SphereGeometry(1,20,14),
 limb:new THREE.CapsuleGeometry(1,1,4,12),
 shoe:new THREE.BoxGeometry(1,1,1),
 eye:new THREE.SphereGeometry(1,12,8),
 curl:new THREE.IcosahedronGeometry(1,1),
 taper:new THREE.LatheGeometry([[-.52,0],[-.51,.67],[-.42,.72],[-.23,.79],
  [.02,.91],[.21,.99],[.42,1],[.5,.89],[.51,0]].map(([y,r])=>new THREE.Vector2(r,y)),16)
};
const torsoProfile=[[-.56,0],[-.55,.76],[-.42,.79],[-.25,.73],[-.08,.79],
 [.12,.9],[.31,1],[.42,.94],[.53,.55],[.57,.32],[.58,0]];
humanGeometry.torso=new THREE.LatheGeometry(torsoProfile.map(([y,r])=>new THREE.Vector2(r,y)),28);
function limbGeometry(profile,depth=1){
 const geometry=new THREE.LatheGeometry(profile.slice().reverse().map(([y,radius])=>new THREE.Vector2(radius,y)),16);
 geometry.scale(1,1,depth);return geometry;
}
humanGeometry.pantLeg=limbGeometry([[.05,0],[.035,.085],[-.03,.093],[-.16,.084],[-.28,.071],
 [-.35,.064],[-.38,.064],[-.42,.063],[-.49,.067],[-.59,.054],[-.68,.047],
 [-.726,.043],[-.748,.046],[-.758,.04],[-.76,0]],1.04);
humanGeometry.longSleeve=limbGeometry([[.045,0],[.034,.047],[.009,.071],[-.04,.073],[-.111,.065],
 [-.188,.052],[-.238,.047],[-.268,.046],[-.305,.045],[-.366,.041],[-.422,.037],[-.467,.034],[-.476,0]]);
humanGeometry.shortSleeve=limbGeometry([[.045,0],[.034,.048],[.01,.073],[-.045,.073],[-.115,.065],
 [-.19,.053],[-.222,.053],[-.228,.048],[-.23,0]]);
humanGeometry.forearmSkin=limbGeometry([[-.189,0],[-.203,.043],[-.244,.044],[-.281,.045],
 [-.326,.044],[-.39,.036],[-.448,.029],[-.492,.03],[-.499,0]],.92);
function attachSkinnedLimbs(body,bones,pieces){
 // Bind all clothing surfaces to one skeleton per person. Each limb blends across the joint.
 body.updateMatrixWorld(true);
 const skeleton=new THREE.Skeleton(bones);
 const surfaces=new Map();
 for(const piece of pieces){
  if(!surfaces.has(piece.mat))surfaces.set(piece.mat,[]);
  surfaces.get(piece.mat).push(piece);
 }
 for(const [mat,parts] of surfaces){
  const count=parts.reduce((n,p)=>n+p.geometry.attributes.position.count,0);
  const indexCount=parts.reduce((n,p)=>n+p.geometry.index.count,0);
  const position=new Float32Array(count*3),normal=new Float32Array(count*3),uv=new Float32Array(count*2);
  const skinIndex=new Uint16Array(count*4),skinWeight=new Float32Array(count*4),index=new Uint16Array(indexCount);
  let vertex=0,face=0;
  for(const {geometry,upper,lower,joint} of parts){
   const offset=upper.position,{position:src,normal:srcNormal,uv:srcUV}=geometry.attributes;
   const upperIndex=bones.indexOf(upper),lowerIndex=bones.indexOf(lower);
   for(let i=0;i<geometry.index.count;i++)index[face++]=geometry.index.getX(i)+vertex;
   normal.set(srcNormal.array,vertex*3);uv.set(srcUV.array,vertex*2);
   for(let i=0;i<src.count;i++,vertex++){
    const y=src.getY(i),blend=THREE.MathUtils.smoothstep(-y,joint-.068,joint+.068);
    position.set([src.getX(i)+offset.x,y+offset.y,src.getZ(i)+offset.z],vertex*3);
    skinIndex[vertex*4]=upperIndex;skinIndex[vertex*4+1]=lowerIndex;
    skinWeight[vertex*4]=1-blend;skinWeight[vertex*4+1]=blend;
   }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setIndex(new THREE.BufferAttribute(index,1));
  for(const [name,values,size] of [['position',position,3],['normal',normal,3],['uv',uv,2],
   ['skinIndex',skinIndex,4],['skinWeight',skinWeight,4]])geometry.setAttribute(name,new THREE.BufferAttribute(values,size));
  const mesh=new THREE.SkinnedMesh(geometry,mat);mesh.castShadow=mesh.receiveShadow=true;
  mesh.frustumCulled=false;body.add(mesh);mesh.bind(skeleton);
 }
}
function faceRelief(x,y){
 const bump=(cx,cy,rx,ry)=>Math.exp(-(((x-cx)/rx)**2+((y-cy)/ry)**2));
 return .037*bump(0,-.012,.022,.027)+.012*bump(0,.022,.023,.065)
  -.016*bump(Math.abs(x),.026,.026,.023)+.01*bump(Math.abs(x),-.014,.038,.035)
  +.008*bump(0,-.071,.049,.032)+.008*bump(Math.abs(x),.058,.043,.022);
}
function jawWidth(y){
 return y<0?1+.16*y-.11*Math.max(0,-y-.38):1-.1*Math.max(0,y-.35);
}
function faceDepth(x,y){
 const vertical=y/.142, across=x/(.118*jawWidth(vertical));
 return .108*Math.sqrt(Math.max(0,1-across*across-vertical*vertical))+faceRelief(x,y);
}
function sculptHead(beard){
 const geometry=new THREE.SphereGeometry(1,52,38),positions=geometry.attributes.position;
 const colors=new Float32Array(positions.count*3);
 for(let i=0;i<positions.count;i++){
  const nx=positions.getX(i),ny=positions.getY(i),nz=positions.getZ(i);
  const x=nx*.118*jawWidth(ny),y=ny*.142;
  const relief=nz>0?faceRelief(x,y)*Math.min(1,nz*3):0;
  positions.setXYZ(i,x,y,nz*.108+relief);
  const cheek=Math.exp(-(((Math.abs(x)-.059)/.046)**2+((y+.015)/.048)**2));
  const grain=.019*Math.sin(x*785+y*235)*Math.cos(y*955-x*113);
  let tint=1+grain;
  if(beard&&nz>-.14){
   const line=-.077+Math.max(0,Math.abs(x)-.057)*1.53+grain*.11;
   const coverage=THREE.MathUtils.smoothstep(line-y,-.009,.018)
    *THREE.MathUtils.smoothstep(nz,-.14,.18);
   const mustache=(1-THREE.MathUtils.smoothstep(Math.abs(x),.034,.045))
    *THREE.MathUtils.smoothstep(y,-.057,-.05)*(1-THREE.MathUtils.smoothstep(y,-.036,-.026))
    *THREE.MathUtils.smoothstep(nz,.5,.85);
   tint*=1-.75*Math.max(coverage,mustache*.89);
  }
  const eyeShadow=nz>0?Math.exp(-(((Math.abs(x)-.043)/.026)**2+((y-.033)/.017)**2))*.095:0;
  const temple=Math.max(0,Math.abs(nx)-.52)*.13;
  const warmth=cheek*.095+(nz>0?Math.max(0,relief)*.48:0);
  colors[i*3]=tint*(1-eyeShadow*.68-temple);
  colors[i*3+1]=tint*(1-eyeShadow-warmth-temple);
  colors[i*3+2]=tint*(1-eyeShadow*.92-warmth*.77-temple);
 }
 geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.computeVertexNormals();
 return geometry;
}
function hairShell(style){
 const geometry=new THREE.SphereGeometry(1,36,18,0,Math.PI*2,0,Math.PI/2);
 const {position,uv}=geometry.attributes;
 for(let i=0;i<position.count;i++){
  const a=(uv.getX(i)-.5)*Math.PI*2,v=1-uv.getY(i);
  const front=Math.max(0,Math.cos(a)),wave=Math.sin(a*7)*.02+Math.cos(a*13)*.012;
  const angle=v*(1.83-(style==='layered'?.56:.68)*front+wave);
  const fullness=style==='shaved'?1.005:style==='layered'?1.082:1.055;
  const lift=style==='curls'?.028:style==='swept'?.026:style==='layered'?.009:.006;
  const x=Math.sin(a)*Math.sin(angle)*.121*fullness;
  const y=Math.cos(angle)*(.143+lift)+.012+(style==='swept'?.009*Math.sin(a)*Math.sin(v*Math.PI):0);
  const z=Math.cos(a)*Math.sin(angle)*.116*fullness-(style==='layered'?.002:.012);
  position.setXYZ(i,x+(style==='swept'?.022*Math.cos(angle)**2:0),y,z);
 }
 geometry.computeVertexNormals();
 return geometry;
}
humanGeometry.skull=sculptHead(false);
humanGeometry.beardedSkull=sculptHead(true);
for(const style of ['short','swept','curls','shaved','layered'])humanGeometry['hair-'+style]=hairShell(style);
const skinPalette=['#d3a17e','#ae7654','#80513b','#e2b698','#603f30'];
const fabricGrain=(()=> {
 const side=128,data=new Uint8Array(side*side*4);
 for(let y=0;y<side;y++)for(let x=0;x<side;x++){
  const index=(y*side+x)*4;
  const warp=Math.cos(x*Math.PI/2),weft=Math.cos(y*Math.PI/2);
  const twill=Math.sin((x+y*1.18)*1.37)*Math.cos((y-x*.68)*1.9);
  const value=124+warp*15+weft*12+twill*18+(x*17+y*23)%13;
  data[index]=data[index+1]=data[index+2]=value;data[index+3]=255;
 }
 const texture=new THREE.DataTexture(data,side,side);
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(3,3);
 texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
 texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
})();
const hairStrands=(()=>{
 const side=64,data=new Uint8Array(side*side*4);
 for(let y=0;y<side;y++)for(let x=0;x<side;x++){
  const index=(y*side+x)*4,t=Math.sin(x*1.77+Math.sin(y*.11)*.76);
  const shade=Math.round(126+t*38+Math.sin(x*3.81+y*.05)*22);
  data[index]=data[index+1]=data[index+2]=shade;data[index+3]=255;
 }
 const texture=new THREE.DataTexture(data,side,side);
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 texture.repeat.set(4,1);texture.magFilter=THREE.LinearFilter;
 texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;
 return texture;
})();
const humanMaterials=new Map();
function humanMat(color,finish='matte'){
 const key=color+finish;
 if(!humanMaterials.has(key)){
  const mat=material(color);
  if(finish==='fabric'){mat.bumpMap=fabricGrain;mat.bumpScale=.008;mat.roughness=.78;}
  if(finish==='skin'||finish==='face'){mat.roughness=.54;mat.vertexColors=finish==='face';}
  if(finish==='hair'){mat.roughness=.49;mat.bumpMap=hairStrands;mat.bumpScale=.006;}
  if(finish==='iris')mat.roughness=.29;
  if(finish==='jewelry'){mat.roughness=.28;mat.metalness=color==='#d1a85e'?.52:.12;}
  humanMaterials.set(key,mat);
 }
 return humanMaterials.get(key);
}
function frontTorsoDepth(x,y,width){
 const height=(y-1.14)/.54;
 const row=torsoProfile.findIndex(([level])=>level>height);
 if(row<=0)return 0;
 const [start,r0]=torsoProfile[row-1],[end,r1]=torsoProfile[row];
 const radius=THREE.MathUtils.lerp(r0,r1,(height-start)/(end-start));
 return .151*Math.sqrt(Math.max(0,radius*radius-(x/width)**2));
}
function jacketPatch(points,mat,parent,width,offset=.012){
 const positions=[],uv=[];
 const outline=points.map(([x,y])=>new THREE.Vector2(x,y));
 function triangle(a,b,c,depth){
  if(depth>0){
   const ab=a.clone().lerp(b,.5),bc=b.clone().lerp(c,.5),ca=c.clone().lerp(a,.5);
   triangle(a,ab,ca,depth-1);triangle(ab,b,bc,depth-1);
   triangle(ca,bc,c,depth-1);triangle(ab,bc,ca,depth-1);return;
  }
  for(const {x,y} of [a,b,c]){
   positions.push(x,y,frontTorsoDepth(x,y,width)+offset);
   uv.push(x/.35+.5,(y-1.08)/.45);
  }
 }
 for(const [a,b,c] of THREE.ShapeUtils.triangulateShape(outline,[]))triangle(outline[a],outline[b],outline[c],4);
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,mat);parent.add(mesh);
}
function humanPart(geometry,mat,x,y,z,sx,sy,sz,parent){const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function shapeLongHair(style,face,hair){
 function lock(x,y,z,width,height,depth,tilt=0){
  const mesh=humanPart(humanGeometry.head,hair,x,y,z,width,height,depth,face);
  mesh.rotation.z=tilt;
 }
 const tie=humanMat('#35272c');
 if(style==='bob'||style==='halfup'){
  const long=style==='halfup';
  lock(0,long?-.073:-.038,-.077,.117,long?.174:.123,.069);
  for(const side of [-1,1]){
   lock(side*.097,long?-.074:-.029,-.025,.035,long?.146:.112,.071,side*.075);
   lock(side*.113,long?-.128:-.071,.014,.023,long?.11:.055,.029,-side*.13);
  }
  if(long){
   humanPart(humanGeometry.eye,tie,0,.028,-.142,.025,.015,.022,face);
   lock(.003,-.053,-.146,.054,.098,.037,-.22);
  }
  return;
 }
 if(style==='ponytail'){
  humanPart(humanGeometry.eye,tie,0,.095,-.137,.036,.023,.027,face);
  lock(0,.052,-.152,.048,.072,.048,.23);
  lock(.017,-.015,-.172,.04,.085,.04,.28);
  lock(.031,-.087,-.177,.026,.073,.028,.34);
  return;
 }
 if(style==='braids'){
  for(const side of [-1,1]){
   lock(side*.086,.035,-.053,.046,.079,.063,-side*.2);
   for(let strand=0;strand<3;strand++){
    const points=[];
    for(let i=0;i<=48;i++){
     const t=i/48,angle=t*Math.PI*12+strand*Math.PI*2/3;
     const radius=.012*(1-t*.53);
     points.push(new THREE.Vector3(
      side*(.089+.039*Math.sin(t*Math.PI*.8))+Math.cos(angle)*radius,
      .018-.255*t,-.077+t*.082+Math.sin(angle)*radius
     ));
    }
    const plait=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),45,.0085,5,false),hair);
    plait.castShadow=plait.receiveShadow=true;face.add(plait);
   }
   humanPart(humanGeometry.eye,tie,side*.112,-.237,.005,.014,.009,.014,face);
  }
 }
}
function character(color,index=0,security=false,look=null){
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);const female=look?.gender==='female';
 const skinTone=look?.skin||skinPalette[index%skinPalette.length];
 const skin=humanMat(skinTone,'skin'),cloth=humanMat(look?.top||color,'fabric');
 const sleeve=look?.outfit==='vest'?humanMat('#e4ded0','fabric'):cloth;
 const pants=humanMat(look?.pants||(security?'#263244':['#354c62','#45444a','#665b49','#243b4c'][index%4]),'fabric');
 const hair=humanMat(look?.hairColor||['#30251e','#191b1e','#61452e','#a17a44'][index%4],'hair');
 humanPart(humanGeometry.torso,cloth,0,1.14,0,female?.223:.238,.54,.151,body);
 humanPart(humanGeometry.limb,pants,0,.886,0,female?.181:.177,.055,.11,body);
 humanPart(humanGeometry.taper,skin,0,1.462,0,.056,.12,.061,body);
 const detail=(parent,x,y,z,sx,sy,sz,mat)=>humanPart(humanGeometry.shoe,mat,x,y,z,sx,sy,sz,parent);
 if(!look||look.outfit==='vest'){
  for(const sign of [-1,1]){
   const collar=detail(body,sign*.051,1.405,.078,.077,.024,.039,sleeve);
   collar.rotation.z=sign*.22;
  }
  detail(body,0,1.19,.144,.008,.32,.01,humanMat('#b1a497'));
 }
 const head=new THREE.Group();head.position.set(0,1.617,0);body.add(head);
 const face=new THREE.Group();
 face.scale.set(female?.91:look?.professor?1:.97,female?.96:1,female?.94:1);
 head.add(face);
 humanPart(look?.beard?humanGeometry.beardedSkull:humanGeometry.skull,humanMat(skinTone,'face'),0,0,0,1,1,1,face);
 const eyes=[],lip=humanMat(look?.beard?'#ab7765':female?'#9b5a52':'#9a685b','skin');
 const crease=humanMat('#482b2b'),iris=humanMat(look?.professor?'#4d3428':['#52635a','#593d2e','#506273'][index%3],'iris');
 for(const sign of [-1,1]){
  const ear=humanPart(humanGeometry.eye,skin,sign*.111,-.009,-.012,.021,.036,.022,face);
  ear.rotation.z=-sign*.16;
  humanPart(humanGeometry.eye,humanMat('#'+skin.color.clone().multiplyScalar(.73).getHexString(),'skin'),
   sign*.124,-.009,.004,.008,.018,.006,face);
  const socket=new THREE.Group(),ex=sign*.042,ey=.027;
  socket.position.set(ex,ey,faceDepth(ex,ey)-.001);
  socket.rotation.y=sign*.24;face.add(socket);eyes.push(socket);
  humanPart(humanGeometry.eye,humanMat('#523b36'),0,0,-.002,.022,.0083,.009,socket);
  humanPart(humanGeometry.eye,humanMat('#e8dace','iris'),0,-.0005,.001,.019,.0068,.009,socket);
  humanPart(humanGeometry.eye,iris,0,-.0005,.009,.0068,.0068,.0032,socket);
  humanPart(humanGeometry.eye,humanMat('#1c1615','iris'),0,-.0005,.0115,.0036,.0041,.002,socket);
  humanPart(humanGeometry.eye,humanMat('#fff4dd'),-.0024,.0024,.0128,.0016,.0015,.0011,socket);
  const brow=humanPart(humanGeometry.eye,hair,ex,.053,faceDepth(ex,.053)+.003,.025,.0036,.006,face);
  brow.rotation.z=sign*(look?.professor?.045:.12);brow.rotation.y=sign*.28;
  humanPart(humanGeometry.eye,humanMat('#755245'),sign*.012,-.028,faceDepth(sign*.012,-.028)+.001,.007,.003,.005,face);
 }
 const smile=look?.professor?.008:.003,mouthY=-.061,mouthWidth=look?.professor?.038:.034;
 const smileLine=new THREE.CatmullRomCurve3([-1,-.5,0,.5,1].map(t=>{
  const x=t*mouthWidth,y=mouthY+smile*t*t;
  return new THREE.Vector3(x,y,faceDepth(x,y)+.003);
 }));
 face.add(new THREE.Mesh(new THREE.TubeGeometry(smileLine,12,.0028,5,false),crease));
 const lowerLip=humanPart(humanGeometry.eye,lip,0,mouthY-.005,faceDepth(0,mouthY-.005)+.001,mouthWidth*.76,.0057,.0051,face);
 if(look?.professor)lowerLip.rotation.x=-.17;
 const hairStyle=look?.hair||(!security&&index%3===1?'long':'short');
 const layeredHair=['long','bob','ponytail','braids','halfup'].includes(hairStyle);
 const hairGeo=humanGeometry['hair-'+(layeredHair?(hairStyle==='long'?'swept':'layered'):hairStyle)]||humanGeometry['hair-short'];
 face.add(new THREE.Mesh(hairGeo,hair));
 if(layeredHair&&hairStyle!=='long')shapeLongHair(hairStyle,face,hair);
 if(hairStyle==='curls'){
  const count=look?.professor?63:27;
  for(let i=0;i<count;i++){
   const angle=i*2.39996,r=Math.sqrt((i+.4)/count),x=Math.cos(angle)*r*.106,z=Math.sin(angle)*r*.097;
   const radius=(look?.professor?.013:.017)+.01*(.5+.5*Math.sin(i*7.6));
   const curl=humanPart(humanGeometry.curl,hair,x,.143+(1-r*r)*.033+Math.sin(i*5)*.008,z,radius,radius*.88,radius,face);
   curl.rotation.set(i*.54,angle,i*.31);
  }
  if(look?.professor)for(let i=0;i<18;i++){
   const a=-1.41+i*2.82/17;
   const curl=humanPart(humanGeometry.curl,hair,Math.sin(a)*.107,.101+Math.cos(a)*.02+Math.sin(i*4.6)*.011,
    Math.cos(a)*.098,.014+(i%3)*.003,.018+(i%2)*.003,.017,face);
   curl.rotation.set(a*.3,i*.76,a);
  }
 }
 if(hairStyle==='long'){
  humanPart(humanGeometry.head,hair,0,-.047,-.085,.117,.162,.065,face);
  for(const sign of [-1,1]){
   const lock=humanPart(humanGeometry.head,hair,sign*.103,-.069,-.051,.027,.118,.043,face);
   lock.rotation.z=sign*.11;
  }
  humanPart(humanGeometry.head,hair,.028,-.082,-.146,.05,.1,.049,face);
 }
 const hips=[],knees=[],arms=[],elbows=[],bones=[],limbs=[];
 for(const sign of [-1,1]){
  const hip=new THREE.Bone();hip.position.set(sign*.102,.87,0);body.add(hip);
  const knee=new THREE.Bone();knee.position.y=-.38;hip.add(knee);
  limbs.push({geometry:humanGeometry.pantLeg,mat:pants,upper:hip,lower:knee,joint:.38});
  const shoeColor=look?.shoes||(index%2?'#ddd9cc':'#292a2c'),shoe=humanMat(shoeColor);
  const sole=humanMat(shoeColor==='#74563e'||look?.professor?'#282323':'#c6c2b4');
  humanPart(humanGeometry.head,shoe,0,-.41,.047,.073,.053,.134,knee);
  humanPart(humanGeometry.head,sole,0,-.454,.047,.075,.018,.139,knee);
  humanPart(humanGeometry.head,shoe,0,-.373,-.007,.061,.039,.068,knee);
  for(let j=0;j<4;j++)detail(knee,0,-.379,.036+j*.016,.054,.004,.006,sole);
  detail(hip,sign*.063,-.18,-.035,.008,.31,.009,pants);
  hips.push(hip);knees.push(knee);
  const arm=new THREE.Bone();arm.position.set(sign*(female?.207:look?.professor?.211:.227),1.356,0);body.add(arm);
  const elbow=new THREE.Bone();elbow.position.y=-.26;arm.add(elbow);
  const short=look?.outfit==='rugby'||(!look&&index%2===0);
  limbs.push({geometry:short?humanGeometry.shortSleeve:humanGeometry.longSleeve,mat:sleeve,
   upper:arm,lower:elbow,joint:.26});
  if(short)limbs.push({geometry:humanGeometry.forearmSkin,mat:skin,upper:arm,lower:elbow,joint:.26});
  else humanPart(humanGeometry.taper,sleeve,0,-.208,0,.038,.027,.041,elbow);
  humanPart(humanGeometry.head,skin,0,-.252,.006,.033,.054,.023,elbow);
  for(let finger=0;finger<4;finger++){
   const digit=humanPart(humanGeometry.eye,skin,(finger-1.5)*.013,-.292+.004*Math.abs(finger-1.5),.013,.008,.025,.011,elbow);
   digit.rotation.x=-.21;digit.rotation.z=sign*.035*(finger-1.5);
  }
  const thumb=humanPart(humanGeometry.eye,skin,-sign*.029,-.251,.025,.012,.029,.013,elbow);
  thumb.rotation.z=sign*.28;
  arms.push(arm);elbows.push(elbow);bones.push(hip,knee,arm,elbow);
 }
 attachSkinnedLimbs(body,bones,limbs);
 const phone=detail(elbows[0],0,-.265,.039,.07,.125,.014,humanMat('#26323d'));detail(phone,0,0,.55,.8,.82,.14,humanMat('#93b8b5'));phone.visible=false;
 if(!security&&!look&&index%3===0){humanPart(humanGeometry.limb,humanMat('#535e59'),0,1.14,-.19,.16,.12,.065,body);for(const sign of [-1,1])detail(body,sign*.15,1.22,.134,.025,.3,.015,humanMat('#323d3a'));}
 if(security){detail(body,0,.92,0,.4,.05,.27,metal);detail(body,-.105,1.26,.15,.05,.07,.015,gold);detail(body,.13,1.2,.16,.06,.11,.035,dark);detail(head,0,.155,.01,.265,.06,.24,dark);detail(head,0,.14,.13,.265,.02,.14,dark);}
 const height=look?(female?.98:1.02):[.96,1.02,1.06,.99][index%4];root.scale.set(height*(look?.build==='broad'?1.1:look?.build==='slim'?.92:1),height,height);
 root.userData.rig={body,head,hips,knees,arms,elbows,phone,eyes,phase:index*.73,stride:0,lastX:null,lastZ:null};return root;
}
// Merge fixed pieces within each animated joint; keep hands, limbs and phone independent.
function batchHuman(root){const shared=new Set(Object.values(humanGeometry)),groups=[];root.traverse(o=>{if(o.isGroup||o.isBone)groups.push(o);});for(const group of groups){const batches=new Map();for(const mesh of group.children){if(!mesh.isMesh||mesh.isSkinnedMesh||mesh.children.length||Array.isArray(mesh.material))continue;const key=mesh.material.uuid+':'+mesh.castShadow+':'+mesh.receiveShadow;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(mesh);}for(const meshes of batches.values()){if(meshes.length<2)continue;const parts=meshes.map(mesh=>{mesh.updateMatrix();const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();return g.applyMatrix4(mesh.matrix);}),merged=new THREE.BufferGeometry();for(const name of ['position','normal','uv',...(meshes[0].material.vertexColors?['color']:[])]){const size=name==='uv'?2:3,data=new Float32Array(parts.reduce((sum,g)=>sum+g.attributes.position.count,0)*size);let offset=0;for(const part of parts){if(part.attributes[name])data.set(part.attributes[name].array,offset);offset+=part.attributes.position.count*size;}merged.setAttribute(name,new THREE.BufferAttribute(data,size));}merged.computeBoundingSphere();const result=new THREE.Mesh(merged,meshes[0].material);result.castShadow=meshes[0].castShadow;result.receiveShadow=meshes[0].receiveShadow;for(const mesh of meshes){mesh.removeFromParent();if(!shared.has(mesh.geometry))mesh.geometry.dispose();}for(const part of parts)part.dispose();group.add(result);}}return root;}

// Contact costumes attach to the animated rig, so props follow hands and gestures.
function dressContact(root,id){const r=root.userData.rig;root.userData.persona=id;
 const part=(parent,x,y,z,sx,sy,sz,color)=>humanPart(humanGeometry.shoe,humanMat(color),x,y,z,sx,sy,sz,parent);
 function glasses(shades=false){for(const sign of [-1,1]){part(r.head,sign*.047,.026,.128,.073,.046,.017,'#24232b');part(r.head,sign*.047,.026,.139,.052,.027,.005,shades?'#242e38':'#9db5b4');}part(r.head,0,.032,.134,.026,.009,.012,'#24232b');}
 function cup(hand,color,lid=false){const c=new THREE.Mesh(new THREE.CylinderGeometry(.055,.039,.14,12),humanMat(color));c.position.set(0,-.25,.08);hand.add(c);if(lid){const top=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.016,12),humanMat('#ddd4c3'));top.position.set(0,-.173,.08);hand.add(top);}return c;}
 if(id==='project'){glasses();cup(r.elbows[1],'#c7a278',true);part(r.elbows[0],0,-.19,.075,.17,.22,.025,'#d5c6a4');part(r.elbows[0],0,-.18,.091,.13,.16,.008,'#f0e8d8');for(let j=0;j<4;j++)part(r.elbows[0],0,-.13-j*.03,.098,.1,.006,.005,'#77596a');part(r.head,0,.14,-.09,.15,.04,.12,'#7a2646');}
 if(id==='nico'){glasses(true);const cap=new THREE.Mesh(new THREE.SphereGeometry(.139,14,8,0,Math.PI*2,0,Math.PI*.5),humanMat('#792843'));cap.position.y=.04;r.head.add(cap);part(r.head,0,.062,-.17,.25,.025,.16,'#792843');part(r.elbows[0],0,-.24,.055,.075,.13,.025,'#232b32');part(r.elbows[0],0,-.24,.071,.06,.1,.006,'#8fdad1');cup(r.elbows[1],'#b63a47');part(r.body,0,1.19,.154,.2,.09,.018,'#f0d6a6');}
 if(id==='walk'){glasses(true);part(r.body,0,1.08,.02,.48,.35,.32,'#782641');part(r.body,0,1.22,.19,.19,.075,.02,'#ead4a9');cup(r.elbows[1],'#e8ddc2',true);}
 if(id==='takeover'){glasses(true);part(r.body,-.12,1.29,.16,.045,.05,.02,'#c3a46b');part(r.elbows[0],0,-.19,0,.11,.028,.1,'#d5b980');part(r.elbows[1],0,-.24,.055,.075,.13,.025,'#232b32');}
 if(id==='professor'){
  const folio=new THREE.Group();
  folio.position.set(.012,-.255,.075);folio.rotation.set(.33,.22,-.24);r.elbows[0].add(folio);
  part(folio,0,0,0,.15,.213,.024,'#273845');part(folio,.005,0,.011,.129,.197,.014,'#d6cbbc');
  part(folio,0,0,.023,.143,.212,.01,'#384756');
  humanPart(humanGeometry.taper,humanMat('#423c33'),0,-.207,0,.038,.018,.038,r.elbows[1]);
  humanPart(humanGeometry.eye,humanMat('#a79b87'),0,-.209,.039,.017,.017,.006,r.elbows[1]);
  humanPart(humanGeometry.eye,humanMat('#292d31'),0,-.208,.044,.013,.013,.003,r.elbows[1]);
 }
 if(id==='van'){for(const sign of [-1,1]){const strap=part(r.body,sign*.045,1.25,.15,.016,.22,.015,'#8ed5bd');strap.rotation.z=sign*.22;}part(r.body,0,1.1,.17,.08,.1,.016,'#f3e4c7');part(r.elbows[0],0,-.2,.07,.18,.23,.025,'#6a4e36');}
}
function animateHuman(root,n,time,dt,watchPlayer=null){
 const rig=root.userData.rig,x=n.x*S,z=n.y*S;
 const moved=rig.lastX===null?0:Math.hypot(x-rig.lastX,z-rig.lastZ);
 const speed=dt>0&&moved<2?Math.min(10,moved/dt):0;
 root.rotation.x=0;root.rotation.z=0;root.position.set(x,campusGround(x,z),z);
 root.visible=!n.hidden&&Math.hypot(x-camera.position.x,z-camera.position.z)<104;
 if(!root.visible){rig.lastX=x;rig.lastZ=z;rig.stride=0;return;}
 if(speed>.05){
  const heading=Math.atan2(x-rig.lastX,z-rig.lastZ),turn=heading-root.rotation.y;
  root.rotation.y+=Math.atan2(Math.sin(turn),Math.cos(turn))*(1-Math.exp(-dt*15));
  rig.phase+=dt*(3.2+speed*.95);
 }
 else if(n.faceX!==undefined&&n.moodUntil>time)root.rotation.y=Math.atan2((n.faceX-n.x)*S,(n.faceY-n.y)*S);
 else if(watchPlayer){const dx=watchPlayer.x*S-x,dz=watchPlayer.y*S-z;if(Math.hypot(dx,dz)<10)root.rotation.y=Math.atan2(dx,dz);}
 const amount=Math.min(1,speed/5.2);
 rig.stride+=(amount-rig.stride)*(dt>0?1-Math.exp(-dt*13):0);
 const sprint=THREE.MathUtils.smoothstep(speed,5.7,9);
 for(let i=0;i<2;i++){
  const sign=i?1:-1,cycle=rig.phase+i*Math.PI,step=Math.sin(cycle)*rig.stride;
  const bend=Math.max(0,Math.cos(cycle+.46))*rig.stride;
  rig.hips[i].rotation.set(step*(.49+sprint*.32),-.035*sign,-sign*.027);
  rig.knees[i].rotation.set(bend*(.51+sprint*.47)+.055*rig.stride,0,0);
  rig.arms[i].rotation.set(-step*(.43+sprint*.36),0,sign*(.055+.08*rig.stride));
  rig.elbows[i].rotation.set(-.09-rig.stride*(.11+.53*sprint)-Math.max(0,step)*.17,0,0);
 }
 rig.body.position.y=rig.stride*(.008+Math.abs(Math.sin(rig.phase))* (.022+sprint*.017))+
  (1-rig.stride)*Math.sin(time*1.8+rig.phase)*.006;
 rig.body.rotation.set(rig.stride*(.05+sprint*.105),Math.sin(rig.phase)*rig.stride*.105,Math.cos(rig.phase)*rig.stride*.042);
 rig.head.rotation.set(-rig.body.rotation.x*.4,Math.sin(time*.62+rig.phase*.25)*.037,-rig.body.rotation.z*.4);
 rig.phone.visible=false;
 const blink=(time+.83+rig.phase*.018)%4.08;
 const eyeScale=blink<.16?1-.94*Math.sin(blink/.16*Math.PI):1;
 for(const eye of rig.eyes)eye.scale.y=eyeScale;
 if(n.flee){for(let i=0;i<2;i++){rig.arms[i].rotation.x=-.9;rig.elbows[i].rotation.x=-1.1;}rig.head.rotation.y=Math.sin(time*4)*.18;}
 else if(speed<.08){
  const action=n.emote||(n.moodUntil>time?n.mood:n.idle),beat=Math.sin(time*7+rig.phase);
  if(action==='dance'){rig.body.position.y=.025+Math.abs(beat)*.045;rig.body.rotation.z=beat*.1;rig.body.rotation.y=Math.sin(time*3.5)*.2;for(let i=0;i<2;i++){const sign=i?1:-1;rig.arms[i].rotation.z=sign*(.75+beat*.3);rig.arms[i].rotation.x=-.4+Math.sin(time*5+i)*.45;rig.elbows[i].rotation.x=-.85;rig.hips[i].rotation.x=sign*beat*.2;rig.knees[i].rotation.x=.15+Math.max(0,sign*beat)*.2;}rig.head.rotation.z=-beat*.08;}
  else if(action==='wave'){rig.arms[1].rotation.z=2.5;rig.elbows[1].rotation.z=Math.sin(time*8)*.28;rig.elbows[1].rotation.x=-.3;rig.head.rotation.z=-.04;}
  else if(action==='roast'){rig.arms[1].rotation.x=-1.05;rig.arms[1].rotation.z=.2;rig.elbows[1].rotation.x=-.3;rig.head.rotation.z=.08;rig.body.rotation.y=Math.sin(time*3)*.06;}
  else if(action==='shrug'){for(let i=0;i<2;i++){rig.arms[i].rotation.z=(i?1:-1)*.65;rig.elbows[i].rotation.x=-1.5;}rig.head.rotation.y=Math.sin(time*4)*.12;}
  else if(action==='pose'||action==='phone'){rig.phone.visible=true;rig.arms[0].rotation.x=action==='pose'?-1.4:-.5;rig.arms[0].rotation.z=action==='pose'?-.45:0;rig.elbows[0].rotation.x=-.7;rig.head.rotation.x=action==='pose'?-.06:.22;rig.head.rotation.y=-.13;if(action==='pose'){rig.arms[1].rotation.z=.25;rig.elbows[1].rotation.x=-1.5;rig.hips[1].rotation.z=.09;}}
  else if(action==='chat'){rig.arms[1].rotation.x=-.2;rig.elbows[1].rotation.x=-.8;rig.arms[1].rotation.z=.12+Math.sin(time*2)*.08;}
  else if(root.userData.persona){const persona=root.userData.persona,idle=Math.sin(time*1.5+rig.phase);
   if(persona==='professor'){
    rig.arms[0].rotation.x=-.22;rig.elbows[0].rotation.x=-.66;
    rig.head.rotation.x=.025+idle*.025;rig.head.rotation.z=-.047;
    rig.arms[1].rotation.x=-.12;rig.elbows[1].rotation.x=-.16;
   }
   if(persona==='project'){rig.arms[0].rotation.x=-.42;rig.elbows[0].rotation.x=-.5;rig.elbows[1].rotation.x=-.65;rig.head.rotation.z=-.045;}
   if(persona==='nico'){rig.arms[0].rotation.x=-.35;rig.elbows[0].rotation.x=-.9;rig.arms[1].rotation.z=.2+idle*.07;rig.elbows[1].rotation.x=-.35;rig.head.rotation.z=idle*.055;}
   if(persona==='walk'){rig.elbows[1].rotation.x=-.85;rig.head.rotation.z=.07;}
   if(persona==='van'){rig.arms[0].rotation.x=-.25;rig.elbows[0].rotation.x=-.5;rig.arms[1].rotation.z=.15+idle*.05;}
  }
 }
 if(n.seated){rig.body.position.y=-.35;for(let i=0;i<2;i++){rig.hips[i].rotation.x=-1.4;rig.knees[i].rotation.x=1.5;}}
 if(n.fighting){rig.arms[0].rotation.x=-1.15;rig.arms[1].rotation.x=-1.1;rig.elbows[0].rotation.x=-1.2;rig.elbows[1].rotation.x=-1.25;rig.body.rotation.y=.18;if(n.punchAt!==undefined&&time-n.punchAt<.3){rig.arms[1].rotation.x=-1.8;rig.elbows[1].rotation.x=-.1;}}
 if(n.blocking){for(let i=0;i<2;i++){rig.arms[i].rotation.x=-1.25;rig.elbows[i].rotation.x=-1.45;}rig.head.rotation.x=.12;}
 if(n.swing){const side=n.swing.hand,phase=n.swing.phase;rig.arms[side].rotation.x=-1.3-Math.sin(phase*Math.PI)*.45;rig.elbows[side].rotation.x=-.9+Math.sin(phase*Math.PI)*.9;rig.body.rotation.y=(side?1:-1)*Math.sin(phase*Math.PI)*.28;root.rotation.y=Math.PI/2-n.a;}
 if(n.hitAt!==undefined&&time-n.hitAt<.35){rig.body.rotation.x=-.17;rig.head.rotation.x=-.2;}
 if(n.downUntil>time){root.rotation.z=-Math.PI/2;root.position.y+=.22;rig.hips[0].rotation.x=-.25;rig.knees[0].rotation.x=.5;rig.hips[1].rotation.x=.25;rig.knees[1].rotation.x=.3;rig.phone.visible=false;}
 rig.lastX=x;rig.lastZ=z;
}
function dressLayer(look,rig){
 const width=look.gender==='female'?.223:.238, body=rig.body;
 const offWhite=humanMat('#e2d8bd','fabric'),silver=humanMat('#b2aa9f');
 const darkest=humanMat(new THREE.Color(look.top).multiplyScalar(.65).getStyle(),'fabric');
 const patch=(points,mat,offset)=>jacketPatch(points,mat,body,width,offset);
 if(look.outfit==='cardigan'){
  patch([[-.073,1.445],[.073,1.445],[.015,1.235],[-.015,1.235]],offWhite,.014);
  for(const side of [-1,1]){
   patch([[side*.082,1.438],[side*.067,1.438],[side*.01,1.244],
    [side*.008,.961],[side*.028,.962],[side*.028,1.235]],offWhite,.017);
   patch([[side*.098,1.042],[side*.157,1.037],[side*.155,1.019],[side*.096,1.024]],offWhite,.015);
  }
  for(let i=0;i<5;i++){
   const y=.986+i*.053;
   humanPart(humanGeometry.eye,silver,.003,y,frontTorsoDepth(0,y,width)+.025,.007,.007,.004,body);
  }
 }
 if(look.outfit==='moto'){
  patch([[-.073,1.442],[.074,1.442],[.031,1.277],[-.041,1.277]],offWhite,.016);
  patch([[-.134,1.41],[-.036,1.446],[.058,1.195],[-.092,1.282],[-.056,1.315]],darkest,.019);
  patch([[.076,1.44],[.144,1.388],[.134,1.305],[.044,1.201],[.081,1.337]],darkest,.02);
  patch([[-.073,.964],[-.063,.966],[.066,1.26],[.058,1.27]],silver,.018);
  patch([[.081,1.071],[.149,1.097],[.152,1.084],[.082,1.059]],silver,.014);
 }
 if(look.outfit==='track'){
  patch([[-.014,.963],[.014,.963],[.016,1.453],[-.016,1.453]],darkest,.013);
  patch([[-.003,.97],[.004,.97],[.004,1.425],[-.003,1.425]],silver,.018);
  patch([[-.14,1.33],[-.087,1.33],[-.087,1.283],[-.114,1.27],[-.139,1.283]],offWhite,.018);
  patch([[-.133,1.323],[-.095,1.323],[-.095,1.29],[-.115,1.281],[-.132,1.29]],darkest,.022);
  for(const [i,arm] of rig.arms.entries()){
   const side=i===0?-1:1;
   for(const x of [0,.023]){
    const stripe=humanPart(humanGeometry.eye,offWhite,side*x,-.083,.057,.008,.043,.008,arm);
    stripe.rotation.z=-side*.15;
   }
  }
 }
 if(['cardigan','track','moto'].includes(look.outfit)){
  for(const cuff of rig.elbows){
   humanPart(humanGeometry.taper,darkest,0,-.207,0,.04,.022,.042,cuff);
  }
 }
}
function styleCharacter(look){const root=character(look.top,5,false,look),r=root.userData.rig;
 const part=(parent,x,y,z,sx,sy,sz,color)=>humanPart(humanGeometry.shoe,humanMat(color),x,y,z,sx,sy,sz,parent);
 if(look.outfit==='blazer'){
  const professor=look.professor,width=look.gender==='female'?.223:.238;
  const shirt=humanMat(professor?'#172a40':'#ede3d0','fabric');
  const lapel=humanMat(professor?'#294769':new THREE.Color(look.top).multiplyScalar(1.12).getStyle(),'fabric');
  const button=humanMat(professor?'#17222e':'#93816c');
  jacketPatch([[-.075,1.427],[-.035,1.161],[.039,1.161],[.075,1.427]],shirt,r.body,width);
  if(professor)jacketPatch([[-.036,1.44],[.002,1.333],[.044,1.438]],humanMat(look.skin,'skin'),r.body,width,.017);
  for(const sign of [-1,1]){
   jacketPatch([[sign*.044,1.443],[sign*.021,1.165],[sign*.113,1.317],
    [sign*.071,1.324],[sign*.137,1.383]],lapel,r.body,width,.018);
   if(professor)jacketPatch([[sign*.033,1.44],[sign*.031,1.345],[sign*.065,1.384],[sign*.064,1.43]],
    shirt,r.body,width,.021);
   jacketPatch([[sign*.105,1.044],[sign*.106,1.025],[sign*.19,1.026],[sign*.19,1.045]],lapel,r.body,width,.014);
  }
  for(let i=0;i<3;i++){
   const y=1.015+i*.066,x=-.018;
   humanPart(humanGeometry.eye,button,x,y,frontTorsoDepth(x,y,width)+.009,.006,.006,.003,r.body);
  }
  if(!professor)jacketPatch([[-.021,1.369],[-.016,1.154],[0,1.132],[.019,1.154],[.019,1.371]],
   humanMat('#711d3b','fabric'),r.body,width,.021);
 }
 if(look.outfit==='vest'){
  const quilting=new THREE.Color(look.top).multiplyScalar(.64).getStyle();
  for(let j=0;j<5;j++){
   part(r.body,0,1.046+j*.058,.138,.30,.004,.004,quilting);
   part(r.body,0,1.046+j*.058,-.136,.30,.004,.004,quilting);
  }for(const sign of [-1,1])part(r.body,sign*.13,1.08,.153,.085,.012,.016,'#c9b489');part(r.elbows[0],0,-.19,0,.13,.035,.12,'#c6a163');part(r.elbows[0],0,-.19,.068,.055,.04,.015,'#26363e');}
 if(look.outfit==='hoodie'){humanPart(humanGeometry.head,humanMat(look.top),0,1.38,-.075,.18,.14,.13,r.body);part(r.body,0,1.05,.15,.25,.1,.025,look.top);for(const sign of [-1,1])part(r.body,sign*.06,1.3,.16,.012,.14,.014,'#e5d8bc');}
 if(look.outfit==='rugby'){part(r.body,0,1.18,.151,.39,.1,.02,'#eee7d8');for(const sign of [-1,1]){const collar=part(r.body,sign*.057,1.385,.12,.1,.05,.04,'#eee7d8');collar.rotation.z=sign*.2;}}
 dressLayer(look,r);
 if(look.accessory==='hoops'||look.accessory==='pearls'){
  const jewelry=look.accessory==='hoops'
   ?humanMat('#d1a85e','jewelry'):humanMat('#eee3cb','jewelry');
  for(const side of [-1,1]){
   if(look.accessory==='hoops'){
    const hoop=new THREE.Mesh(new THREE.TorusGeometry(.021,.0037,7,20),jewelry);
    hoop.position.set(side*.108,-.05,.029);
    hoop.rotation.y=side*.48;
    r.head.add(hoop);
   }else humanPart(humanGeometry.eye,jewelry,side*.103,-.025,.017,.009,.009,.008,r.head);
  }
 }
 if(look.accessory==='headband'){
  const points=[];
  for(let i=0;i<=28;i++){
   const a=i*Math.PI/28;
   points.push(new THREE.Vector3(Math.cos(a)*.114,.031+Math.sin(a)*.126,-.012+Math.sin(a)*.063));
  }
  const band=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),28,.008,8,false),
   humanMat('#e0c5a6','fabric'));
  r.head.add(band);
 }
 if(look.accessory==='shades'||look.accessory==='glasses'){const frames=humanMat('#242b32'),lens=humanMat(look.accessory==='shades'?'#263d49':'#afc8c5');for(const sign of [-1,1]){humanPart(humanGeometry.head,frames,sign*.049,.026,.128,.043,.031,.018,r.head);humanPart(humanGeometry.head,lens,sign*.049,.026,.14,.033,.021,.006,r.head);}part(r.head,0,.03,.133,.03,.012,.014,'#242b32');}
 if(look.accessory==='cap'||look.accessory==='beanie'){const cap=new THREE.Mesh(new THREE.SphereGeometry(.143,14,8,0,Math.PI*2,0,Math.PI*.53),humanMat(look.top));cap.position.y=.03;cap.scale.y=look.accessory==='beanie'?1.25:1;r.head.add(cap);if(look.accessory==='cap')part(r.head,0,.055,-.17,.25,.025,.16,look.top);else{part(r.head,0,.05,.136,.25,.045,.027,look.top);part(r.head,0,.05,.155,.045,.026,.01,'#e4d2aa');}}
 return batchHuman(root);
}
function removeHuman(root){
 root.removeFromParent();
 const shared=new Set(Object.values(humanGeometry)),skeletons=new Set();
 root.traverse(o=>{
  if(o.isMesh&&!shared.has(o.geometry))o.geometry.dispose();
  if(o.isSkinnedMesh)skeletons.add(o.skeleton);
 });
 for(const skeleton of skeletons)skeleton.dispose();
}
let playerModel=character('#4b5d65',5),driverModel=character('#4b5d65',5),appearanceKey='';scene.add(playerModel,driverModel);
function syncPlayerLook(){const look=window.presentationAPI?.appearance();if(!look)return;const key=JSON.stringify(look);if(key===appearanceKey)return;appearanceKey=key;removeHuman(playerModel);removeHuman(driverModel);playerModel=styleCharacter(look);driverModel=styleCharacter(look);scene.add(playerModel,driverModel);}
let styleRenderer=null,styleScene=null,styleCamera=null,styleModel=null,styleKey='';
function renderStylePreview(){const look=window.presentationAPI?.preview();if(!look)return;const preview=document.querySelector('#style-preview');
 if(!styleRenderer){try{styleRenderer=new THREE.WebGLRenderer({canvas:preview,antialias:true});}catch{document.querySelector('#style-status').textContent='Preview unavailable. Your selections will still apply in game.';return;}styleRenderer.setPixelRatio(Math.min(devicePixelRatio,1.5));styleRenderer.outputColorSpace=THREE.SRGBColorSpace;styleRenderer.toneMapping=THREE.ACESFilmicToneMapping;styleScene=new THREE.Scene();styleScene.background=new THREE.Color('#20363f');styleScene.add(new THREE.HemisphereLight('#fff1d7','#5e7881',2.8));const key=new THREE.DirectionalLight('#ffe2b5',3.5);key.position.set(3,5,4);styleScene.add(key);const rim=new THREE.DirectionalLight('#a8dbed',2);rim.position.set(-3,3,-2);styleScene.add(rim);const stage=new THREE.Mesh(new THREE.CylinderGeometry(.92,1.03,.08,48),humanMat('#344f5a'));stage.position.y=-.06;styleScene.add(stage);styleCamera=new THREE.PerspectiveCamera(32,1,.1,30);styleCamera.position.set(1.9,1.45,3.1);styleCamera.lookAt(0,.9,0);}
 const key=JSON.stringify(look);if(key!==styleKey){if(styleModel)removeHuman(styleModel);styleModel=styleCharacter(look);styleScene.add(styleModel);styleKey=key;}
 const width=Math.max(1,preview.clientWidth),height=Math.max(1,preview.clientHeight);if(preview.width!==Math.floor(width*styleRenderer.getPixelRatio())||preview.height!==Math.floor(height*styleRenderer.getPixelRatio())){styleRenderer.setSize(width,height,false);styleCamera.aspect=width/height;styleCamera.updateProjectionMatrix();}
 const portrait=window.presentationAPI.portraitView?.()??false;
 styleCamera.position.set(portrait?.68:1.9,portrait?1.66:1.45,portrait?1.42:3.1);
 styleCamera.lookAt(0,portrait?1.50:.9,0);
 styleModel.rotation.y=window.presentationAPI.rotation();
 styleModel.userData.rig.body.position.y=Math.sin(performance.now()*.0018)*.007;
 const blink=(performance.now()*.001+.52)%4.2;
 for(const eye of styleModel.userData.rig.eyes)eye.scale.y=blink<.16?1-.94*Math.sin(blink/.16*Math.PI):1;
 styleRenderer.render(styleScene,styleCamera);
}
const portraitLight=new THREE.PointLight('#ffe2c9',0,6,2);
scene.add(portraitLight);
const professorLook={
 professor:true,gender:'male',skin:'#d5a18c',hair:'curls',hairColor:'#2a211e',
 beard:true,outfit:'blazer',top:'#284764',pants:'#273444',shoes:'#29282c',accessory:'none'
};
const beaLook={
 gender:'female',skin:'#80513b',hair:'braids',hairColor:'#191b1e',top:'#536c60',
 outfit:'track',pants:'#45444a',shoes:'#eee7d8',accessory:'hoops'
};
const openMic=new THREE.Group();
openMic.position.set(state.replyAllSites.stage.x*S,0,state.replyAllSites.stage.y*S);
box(.64,.05,.55,metal,0,.025,0,openMic);
box(.035,1.22,.035,metal,0,.61,0,openMic);
const micArm=box(.026,.39,.026,metal,0,1.28,.12,openMic);
micArm.rotation.x=Math.PI*.34;
const micHead=new THREE.Mesh(new THREE.SphereGeometry(.061,10,7),dark);
micHead.position.set(0,1.365,.291);
openMic.add(micHead);scene.add(openMic);
const contacts=state.contacts.map((contact,i)=>{const outfit={gender:['takeover','nico','van'].includes(contact.id)?'male':'female',skin:skinPalette[(i+3)%5],top:['#7c2847','#53686b','#c09b66','#718567','#c39b58'][i%5],pants:['#26394d','#c5b28b','#45444a'][i%3],hair:i%2?'long':'short',hairColor:['#30251e','#191b1e','#61452e'][i%3],outfit:contact.id==='takeover'?'blazer':['hoodie','blazer','rugby'][i%3],shoes:'#eee7d8',accessory:'none'};const person=styleCharacter(contact.id==='professor'?professorLook:contact.id==='bea'?beaLook:outfit);dressContact(person,contact.id);person.position.set(contact.x*S,0,contact.y*S);scene.add(person);return person;});
const people=state.students.map((n,i)=>{const g=styleCharacter({gender:i<2?'male':i%2?'female':'male',skin:skinPalette[i%5],top:n.color,pants:['#26394d','#c5b28b','#45444a'][i%3],hair:['short','bob','curls','halfup','swept','braids','short','ponytail'][i%8],hairColor:['#191b1e','#61452e','#a17a44'][i%3],outfit:n.faction==='finance'?'vest':n.faction==='prep'?(i%8===1?'cardigan':'blazer'):n.faction==='party'?'hoodie':i%8===7?'track':'rugby',accessory:i%4===0?'cap':i%4===1?'glasses':'none',shoes:i%3?'#eee7d8':'#292a2c'});scene.add(g);return g;});
const guardMeshes=state.guards.map((n,i)=>{const g=character('#293d54',i+2,true);scene.add(g);return g;});
function propMesh(type,missionCone){const g=new THREE.Group();if(type==='speaker'){box(1,1.9,.65,dark,0,.95,0,g);for(let y of [.5,1.3]){let m=new THREE.Mesh(new THREE.CylinderGeometry(.31,.31,.09,20),material('#4b3f67'));m.rotation.x=Math.PI/2;m.position.set(0,y,.36);g.add(m);}}else if(type==='cone'){box(.8,.08,.8,dark,0,.04,0,g);let m=new THREE.Mesh(new THREE.ConeGeometry(.32,1,12),material(missionCone?'#ec70b5':'#ed7d3c'));m.position.y=.6;g.add(m);}else{box(2,.15,1,wood,0,.9,0,g);for(let x of [-.8,.8])box(.1,.9,.8,metal,x,.45,0,g);for(let x of [-.5,0,.5]){let m=new THREE.Mesh(new THREE.CylinderGeometry(.15,.11,.3,12),maroon);m.position.set(x,1.12,0);g.add(m);}}
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1,.035,6,32),new THREE.MeshBasicMaterial({color:type==='speaker'?'#c993ed':missionCone?'#ff7fc2':'#f4d17d'}));ring.rotation.x=Math.PI/2;ring.position.y=.06;g.userData.ring=ring;g.add(ring);return g;}
const propMeshes=state.props.map(p=>{let g=propMesh(p.type,p.missionCone);scene.add(g);return g;});
const cartMesh=new THREE.Group(),cartBody=new THREE.Group(),cartWheels=[];
cartMesh.add(cartBody);scene.add(cartMesh);
const cartPaint=material('#624156',{roughness:.31,metalness:.25});
const cartTrim=material('#c5ad81',{roughness:.46,metalness:.35});
const rubber=material('#202427'),vinyl=material('#554a43',{roughness:.76});
const glass=material('#a6c6c8',{transparent:true,opacity:.27,depthWrite:false,roughness:.18,side:THREE.DoubleSide});
const headLamp=material('#ffedb2',{emissive:'#ffcc83',emissiveIntensity:.22});
const tailLamp=material('#a92b31',{emissive:'#fa4e39',emissiveIntensity:.24});
box(1.65,.22,2.64,metal,0,.39,0,cartBody);
box(1.56,.44,.94,cartPaint,0,.65,-.89,cartBody);
box(1.48,.1,.92,cartPaint,0,.89,-.89,cartBody);
box(1.63,.56,.66,cartPaint,0,.66,1.02,cartBody);
box(1.48,.17,.69,vinyl,0,.85,.31,cartBody);
box(1.44,.49,.12,vinyl,0,1.08,.64,cartBody);
box(1.7,.14,2.27,cream,0,2.13,-.02,cartBody);
box(1.76,.065,2.34,cartTrim,0,2.06,-.02,cartBody);
box(1.7,.1,.16,rubber,0,.42,-1.39,cartBody);
box(1.69,.1,.16,rubber,0,.42,1.37,cartBody);
box(.74,.19,.038,metal,0,.63,-1.377,cartBody);
for(let i=0;i<5;i++)box(.61,.012,.022,cartTrim,0,.56+i*.034,-1.406,cartBody);
for(const x of [-.71,.71]){
 box(.054,1.15,.054,metal,x,1.48,-.91,cartBody);
 box(.055,1.09,.055,metal,x,1.53,.92,cartBody);
 box(.34,.12,.051,headLamp,x*.79,.72,-1.375,cartBody);
 box(.22,.12,.05,tailLamp,x*.84,.73,1.373,cartBody);
 box(.087,.08,1.95,cartTrim,x*1.16,.49,-.03,cartBody);
 for(const z of [-.91,.92]){
  const wheel=new THREE.Group(),axle=new THREE.Group();
  wheel.position.set(x*1.12,.34,z);wheel.add(axle);cartMesh.add(wheel);
  const tire=new THREE.Mesh(new THREE.CylinderGeometry(.33,.33,.25,24),rubber);
  tire.rotation.z=Math.PI/2;tire.castShadow=true;axle.add(tire);
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(.167,.167,.025,16),cartTrim);
  hub.rotation.z=Math.PI/2;hub.position.x=Math.sign(x)*.134;axle.add(hub);
  for(let j=0;j<5;j++){
   const angle=j*Math.PI*2/5;
   box(.029,.045,.045,metal,Math.sign(x)*.15,Math.cos(angle)*.105,Math.sin(angle)*.105,axle);
  }
  cartWheels.push({wheel,axle,front:z<0});
 }
}
box(1.36,.74,.017,glass,0,1.5,-.91,cartBody);
box(1.44,.052,.052,metal,0,1.12,-.92,cartBody);
const cartBadge=eventLettering('ROSE HILL|CAMPUS SERVICES',.92,.29);
cartBadge.position.set(0,.7,1.361);cartBody.add(cartBadge);

// A compact reflection panorama gives the lacquer and glazing a readable outdoor reflection.
const vehicleReflection=canvasTexture((c,w,h)=>{
 const sky=c.createLinearGradient(0,0,0,h);
 sky.addColorStop(0,'#648eb3');sky.addColorStop(.44,'#c9dce7');
 sky.addColorStop(.52,'#f4d8b5');sky.addColorStop(.58,'#5f654e');sky.addColorStop(1,'#273b31');
 c.fillStyle=sky;c.fillRect(0,0,w,h);
 const random=seededRandom(935);
 for(let i=0;i<24;i++){
  const x=random()*w,y=h*(.45+random()*.1);
  c.fillStyle=i%2?'#54655391':'#374f4f88';
  c.beginPath();c.ellipse(x,y,9+random()*30,3+random()*11,0,0,Math.PI*2);c.fill();
 }
 c.fillStyle='#fff4df';c.beginPath();c.arc(w*.73,h*.29,h*.037,0,Math.PI*2);c.fill();
},512,256);
vehicleReflection.mapping=THREE.EquirectangularReflectionMapping;
const sportsPlate=canvasTexture((c,w,h)=>{
 c.fillStyle='#efe6c9';c.fillRect(0,0,w,h);
 c.strokeStyle='#363647';c.lineWidth=4;c.strokeRect(5,5,w-10,h-10);
 c.fillStyle='#6d263e';c.textAlign='center';c.font='bold 14px Arial';c.fillText('ROSE HILL',w/2,22);
 c.fillStyle='#222b36';c.font='bold 30px monospace';c.fillText('TRUST FND',w/2,54,w-15);
},256,72);
const sportsCar=buildSupercar(vehicleReflection,sportsPlate);
scene.environment=vehicleReflection;
scene.environmentIntensity=.32;
scene.add(sportsCar.root);
const sportsCockpit=buildCockpit(camera);
const sportsTray=coffeeTray();sportsTray.position.set(.39,-.25,-.67);sportsCockpit.root.add(sportsTray);
const beamTexture=canvasTexture((c,w,h)=>{
 const fade=c.createLinearGradient(0,0,0,h);
 fade.addColorStop(0,'#daeaff00');fade.addColorStop(.44,'#daeaff11');fade.addColorStop(.92,'#edf8ffbb');fade.addColorStop(1,'#edf8ff00');
 c.fillStyle=fade;c.beginPath();c.moveTo(w*.43,h);c.lineTo(w*.57,h);
 c.lineTo(w*.96,0);c.lineTo(w*.04,0);c.closePath();c.fill();
},64,256);
const sportsBeams=new THREE.Group();scene.add(sportsBeams);
for(const x of [-.61,.61]){
 const beam=plane(6.2,14,new THREE.MeshBasicMaterial({map:beamTexture,transparent:true,
  opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending}),x,.061,-9,sportsBeams);
 beam.receiveShadow=false;
}
const dustTexture=canvasTexture((c,w,h)=>{
 const cloud=c.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,w*.49);
 cloud.addColorStop(0,'#ad997165');cloud.addColorStop(.52,'#aa987331');cloud.addColorStop(1,'#aa987300');
 c.fillStyle=cloud;c.fillRect(0,0,w,h);
},64,64);
const dust=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({
 map:dustTexture,transparent:true,depthWrite:false,opacity:.76
}),24);
dust.frustumCulled=false;dust.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(dust);
const dustPuffs=Array.from({length:24},()=>({time:-10,x:0,z:0,y:0}));
const dustPose=new THREE.Object3D();
let dustIndex=0,lastDustTime=-10;
function updateSupercarDust(s,dt,occupied){
 if(s.elapsed<lastDustTime){lastDustTime=-10;for(const puff of dustPuffs)puff.time=-10;}
 if(dt>0&&occupied&&Math.abs(s.velocity)>1.45&&s.supercar.paved===false&&s.elapsed-lastDustTime>.075){
  const {x,y,a}=s.supercar,side=dustIndex%2===0?.72:-.72;
  const px=x*S-Math.cos(a)*1.62-Math.sin(a)*side,pz=y*S-Math.sin(a)*1.62+Math.cos(a)*side;
  Object.assign(dustPuffs[dustIndex],{time:s.elapsed,x:px,y:campusGround(px,pz),z:pz});
  dustIndex=(dustIndex+1)%dustPuffs.length;lastDustTime=s.elapsed;
 }
 let count=0;
 for(const puff of dustPuffs){
  const age=s.elapsed-puff.time;
  if(age>=1.3)continue;
  const scale=(.55+age*1.19)*Math.min(1,(1.3-age)*4);
  dustPose.position.set(puff.x+age*.3,puff.y+.23+age*.48,puff.z+age*.22);
  dustPose.quaternion.copy(camera.quaternion);dustPose.scale.set(scale*1.3,scale,1);dustPose.updateMatrix();
  dust.setMatrixAt(count++,dustPose.matrix);
 }
 dust.count=count;dust.visible=count>0;dust.instanceMatrix.needsUpdate=true;
}
function drawSupercar(s,dt,talking){
 const state=s.supercar;
 if(!state){sportsCar.root.visible=false;sportsCockpit.root.visible=false;sportsBeams.visible=false;return;}
 const occupied=s.driving&&s.vehicleId==='supercar',night=s.life?.lighting==='night';
 const x=state.x*S,z=state.y*S,ground=campusGround(x,z);
 const heading=-(state.a??0)-Math.PI/2;
 sportsCar.root.position.set(x,ground,z);sportsCar.root.rotation.y=heading;
 sportsCar.root.visible=!occupied||s.thirdPerson;
 sportsCar.paint.envMapIntensity=night?.67:1.22;
 sportsCar.red.emissiveIntensity=occupied&&s.cartBraking?2.5:night?1.25:.55;
 sportsCar.white.emissiveIntensity=night?2.25:.44;
 const tilt=occupied?s.cartSteer*Math.min(.064,Math.abs(s.velocity)*.027):0;
 sportsCar.body.rotation.z=THREE.MathUtils.lerp(sportsCar.body.rotation.z,tilt,.22);
 for(const {pivot,spindle,front} of sportsCar.wheels){
  if(occupied)spindle.rotation.x+=dt*s.velocity*S/.36;
  if(front)pivot.rotation.y=THREE.MathUtils.lerp(pivot.rotation.y,occupied?s.cartSteer*.42:0,.25);
 }
 sportsCockpit.root.visible=occupied&&!s.thirdPerson&&!talking;
 sportsCockpit.wheel.rotation.z=THREE.MathUtils.lerp(sportsCockpit.wheel.rotation.z,-s.cartSteer*.62,.22);
 sportsTray.visible=!!s.activity?.carryingCoffee;
 if(sportsCockpit.root.visible){
  const bars=Math.min(12,Math.max(2,Math.ceil(Math.abs(s.velocity)*2.7)));
  sportsCockpit.indicators.forEach((bar,index)=>{bar.visible=index<bars;});
 }
 sportsBeams.visible=occupied&&night&&ground<.2;
 sportsBeams.position.set(x,ground,z);sportsBeams.rotation.y=heading;
 updateSupercarDust(s,dt,occupied);
}

const coffeeMarker=new THREE.Group();
const coffeeRing=new THREE.Mesh(new THREE.RingGeometry(.7,.8,40),new THREE.MeshBasicMaterial({color:'#fcd588',side:THREE.DoubleSide}));
coffeeRing.rotation.x=-Math.PI/2;coffeeRing.position.y=.028;coffeeMarker.add(coffeeRing);
const coffeeIcon=new THREE.Sprite(new THREE.SpriteMaterial({map:canvasTexture((c,w,h)=>{
 c.beginPath();c.arc(w/2,h/2,w*.4,0,Math.PI*2);c.fillStyle='#282733';c.fill();
 c.strokeStyle='#fcd588';c.lineWidth=5;c.stroke();
 c.fillStyle='#fcd588';c.font='bold 76px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText('$',w/2,h/2+4);
},128,128)}));
coffeeIcon.position.y=1.7;coffeeIcon.scale.setScalar(.83);coffeeMarker.add(coffeeIcon);scene.add(coffeeMarker);

function coffeeTray(){
 const tray=new THREE.Group();
 box(.41,.027,.28,cartTrim,0,0,0,tray);
 for(const [x,z] of [[-.105,-.06],[.105,-.06],[0,.065]]){
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(.047,.035,.118,12),cream);
  cup.position.set(x,.07,z);tray.add(cup);
  const lid=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.013,12),dark);
  lid.position.set(x,.134,z);tray.add(lid);
 }
 return tray;
}
const footTray=coffeeTray(),dashTray=coffeeTray(),viewTray=coffeeTray();
dashTray.position.set(.39,1.005,-1.05);cartBody.add(dashTray);scene.add(footTray);
viewTray.position.set(0,-.23,-.57);camera.add(viewTray);

const pickupShoe=new THREE.Group();humanPart(humanGeometry.head,humanMat('#ddd9cc'),0,.12,0,.18,.1,.34,pickupShoe);box(.32,.05,.6,dark,0,.05,0,pickupShoe);scene.add(pickupShoe);
const pickupUSB=new THREE.Group();box(.32,.05,.14,dark,0,.16,0,pickupUSB);box(.12,.04,.1,trim,.2,.16,0,pickupUSB);scene.add(pickupUSB);
const flyerTexture=canvasTexture((c,w,h)=>{c.fillStyle='#eee6d2';c.fillRect(0,0,w,h);c.fillStyle='#792747';c.fillRect(12,12,w-24,h*.35);c.fillStyle='#fff8e7';c.textAlign='center';c.font='bold 28px Arial';c.fillText('AFTER',w/2,53);c.fillText('HOURS',w/2,88);c.fillStyle='#746b59';for(let j=0;j<5;j++)c.fillRect(28,145+j*21,w-56,6);},256,384);
const pickupFlyer=new THREE.Mesh(new THREE.PlaneGeometry(.6,.9),material('#ffffff',{map:flyerTexture,side:THREE.DoubleSide}));pickupFlyer.rotation.x=-Math.PI/2;scene.add(pickupFlyer);pickupFlyer.visible=false;
const beacon=new THREE.Group();const beamMat=new THREE.MeshBasicMaterial({color:'#ef80be',transparent:true,opacity:.09,depthWrite:false,side:THREE.DoubleSide});const beam=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.2,9,24,1,true),beamMat);beam.position.y=4.5;beacon.add(beam);const halo=new THREE.Mesh(new THREE.TorusGeometry(1.5,.12,8,40),new THREE.MeshBasicMaterial({color:'#ff9cd3'}));halo.rotation.x=Math.PI/2;halo.position.y=.15;beacon.add(halo);const arrow=new THREE.Mesh(new THREE.ConeGeometry(.6,1,4),new THREE.MeshBasicMaterial({color:'#ffd4ed'}));arrow.rotation.z=Math.PI;arrow.position.y=3;beacon.add(arrow);scene.add(beacon);
const cupFlights=Array.from({length:5},()=>{const g=new THREE.Group(),body=new THREE.Mesh(new THREE.CylinderGeometry(.09,.064,.21,12),maroon);g.add(body);const rim=new THREE.Mesh(new THREE.TorusGeometry(.091,.008,5,16),cream);rim.rotation.x=Math.PI/2;rim.position.y=.108;g.add(rim);scene.add(g);g.visible=false;return g;});
// Current race checkpoint stays dynamic, so it never becomes fixed scenery.
const gateMarker=new THREE.Group(),gateMaterial=new THREE.MeshStandardMaterial({color:'#ffd27d',emissive:'#bb6f20',emissiveIntensity:.5,roughness:.45});
const gateRing=new THREE.Mesh(new THREE.TorusGeometry(4.3,.11,8,64),gateMaterial);gateMarker.add(gateRing);scene.add(gateMarker);gateMarker.visible=false;
// First-person prop is attached to the camera.
scene.add(camera);const cup=new THREE.Group();const cupBody=new THREE.Mesh(new THREE.CylinderGeometry(.09,.065,.21,16),maroon);cup.add(cupBody);const rim=new THREE.Mesh(new THREE.TorusGeometry(.092,.008,5,20),cream);rim.rotation.x=Math.PI/2;rim.position.y=.108;cup.add(rim);cup.position.set(.25,-.25,-.5);cup.rotation.z=-.15;camera.add(cup);
const firstPersonSkin=material('#d3a17e',{depthTest:false,depthWrite:false}),firstPersonCloth=material('#25394e',{depthTest:false,depthWrite:false});const fists=new THREE.Group();camera.add(fists);const fistMeshes=[];
for(const sign of [-1,1]){const arm=new THREE.Group();arm.position.set(sign*.22,-.26,-.42);const add=(geometry,mat,x,y,z)=>{const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.renderOrder=1000;arm.add(mesh);return mesh;};
 const palm=add(new THREE.CapsuleGeometry(.032,.035,4,12),firstPersonSkin,0,0,0);palm.scale.z=.83;
 for(let j=0;j<4;j++){const finger=add(new THREE.CapsuleGeometry(.0095,.021,3,8),firstPersonSkin,(j-1.5)*.017,.021,-.022);finger.rotation.x=.3;}
 const thumb=add(new THREE.CapsuleGeometry(.012,.029,3,10),firstPersonSkin,-sign*.028,-.008,-.019);thumb.rotation.z=sign*.55;
 const forearm=add(new THREE.CylinderGeometry(.025,.034,.22,12),firstPersonSkin,0,-.11,.054);forearm.rotation.x=-.55;
 const cuff=add(new THREE.CylinderGeometry(.03,.031,.038,12),firstPersonCloth,0,-.057,.021);cuff.rotation.x=-.55;fists.add(arm);fistMeshes.push(arm);
}
const dash=box(.9,.2,.35,dark,0,-.45,-.6,camera);const steering=new THREE.Mesh(new THREE.TorusGeometry(.17,.016,8,32),metal);steering.position.set(0,-.3,-.51);steering.rotation.x=-.4;camera.add(steering);
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}addEventListener('resize',resize);
// The simulation's resize handler changes canvas dimensions; resize again after it.
let lastAnimationTime=0,cameraReady=false,lastView=null,lastDriving=null;
const chaseTarget=new THREE.Vector3(),desiredCamera=new THREE.Vector3(),safeCamera=new THREE.Vector3();
function frameProfessor(s){
 const target=s.contacts.find(n=>n.id==='professor');
 if(!target)return;
 const x=target.x*S,z=target.y*S,y=campusGround(x,z);
 let facing=Math.atan2(s.player.x*S-x,s.player.y*S-z);
 const angle=[0,.5,-.5,1,-1,Math.PI].map(offset=>facing+offset)
  .find(a=>!s.cameraSolid((x+Math.sin(a)*1.96)/S,(z+Math.cos(a)*1.96)/S,.06));
 facing=angle??facing;
 camera.position.set(x+Math.sin(facing)*1.92,y+1.62,z+Math.cos(facing)*1.92);
 portraitLight.position.set(x+Math.sin(facing)*1.34-Math.cos(facing)*.54,y+2.21,
  z+Math.cos(facing)*1.34+Math.sin(facing)*.54);
 const offset=innerWidth>=740?.53:0;
 camera.lookAt(x+Math.cos(facing)*offset,y+1.41,z-Math.sin(facing)*offset);
 cameraReady=false;
 return facing;
}
const contactShadowTexture=canvasTexture((c,w,h)=>{
 const fade=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
 fade.addColorStop(0,'#12141672');fade.addColorStop(.52,'#12141633');fade.addColorStop(1,'#12141600');
 c.fillStyle=fade;c.fillRect(0,0,w,h);
},64,64);
const contactShadows=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),
 new THREE.MeshBasicMaterial({map:contactShadowTexture,transparent:true,depthWrite:false}),1+people.length+contacts.length+guardMeshes.length);
contactShadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
contactShadows.frustumCulled=false;scene.add(contactShadows);
const shadowPeople=[...people,...contacts,...guardMeshes],shadowTransform=new THREE.Object3D();
function updateContactShadows(){
 let count=0;
 for(const person of [playerModel,...shadowPeople]){
  if(!person.visible)continue;
  const {x,z}=person.position;
  if(Math.hypot(x-camera.position.x,z-camera.position.z)>43)continue;
  shadowTransform.position.set(x,campusGround(x,z)+.054,z);
  shadowTransform.rotation.y=person.rotation.y;
  shadowTransform.scale.set(.81,1,.65);shadowTransform.updateMatrix();
  contactShadows.setMatrixAt(count++,shadowTransform.matrix);
 }
 contactShadows.count=count;
 contactShadows.instanceMatrix.needsUpdate=true;
}
let pausedFrameKey='',lastFrameSample=0,slowFrames=0,fastFrames=0,lastShadowFrame=-Infinity,shadowLighting='',portraitStarted=null,lastPortraitFrame=-Infinity;
function tuneResolution(now,running){
 const ms=now-lastFrameSample;lastFrameSample=now;
 if(!running||ms>110){slowFrames=fastFrames=0;return;}
 slowFrames=ms>27?slowFrames+1:Math.max(0,slowFrames-2);
 fastFrames=ms<18?fastFrames+1:Math.max(0,fastFrames-2);
 const current=renderer.getPixelRatio();
 if(slowFrames>55&&current>minRenderRatio){
  renderer.setPixelRatio(Math.max(minRenderRatio,current-.15));slowFrames=fastFrames=0;
 }else if(fastFrames>210&&current<maxRenderRatio){
  renderer.setPixelRatio(Math.min(maxRenderRatio,current+.15));slowFrames=fastFrames=0;
 }
}
function cameraPositionFor(s){const px=s.player.x*S,pz=s.player.y*S,pitch=s.player.pitch||0;
 const sports=s.driving&&s.vehicleId==='supercar';
 if(!s.thirdPerson){desiredCamera.set(px,(sports?1.12:s.driving?1.65:1.75)+s.jump,pz);camera.position.copy(desiredCamera);camera.rotation.set(pitch,-s.player.a-Math.PI/2,0,'YXZ');cameraReady=false;return;}
 const obstructed=(x,y,z)=>s.cameraSolid(x/S,z/S,.08)||(s.trees||[]).some(t=>{const distance=Math.hypot(x-t.x*S,z-t.y*S);return (distance<.5&&y<8)||(distance<4&&y>6.5&&y<15);});
 const back=s.driving?s.cameraDistance*(sports?1.43:1.6):s.cameraDistance*1.34,shoulder=s.driving?0:.46,forwardX=Math.cos(s.player.a),forwardZ=Math.sin(s.player.a);
 chaseTarget.set(px,(sports?.88:s.driving?1.45:1.61)+s.jump+pitch*(s.driving?4:6.9),pz);
 desiredCamera.set(px-forwardX*back-forwardZ*shoulder,(sports?2.85:s.driving?3.7:3.1)+s.jump-pitch*2,pz-forwardZ*back+forwardX*shoulder);
 safeCamera.copy(desiredCamera);const delta=desiredCamera.clone().sub(new THREE.Vector3(px,1.45+s.jump,pz));for(let i=1;i<=40;i++){const t=i/40,x=px+delta.x*t,z=pz+delta.z*t;if(obstructed(x,1.45+s.jump+delta.y*t,z)){const safe=Math.max(.06,(i-2)/40);safeCamera.set(px+delta.x*safe,1.45+s.jump+delta.y*safe,pz+delta.z*safe);break;}}
 const snap=!cameraReady||lastView!==s.thirdPerson||lastDriving!==s.driving||camera.position.distanceTo(safeCamera)>25;
 if(snap)camera.position.copy(safeCamera);else camera.position.lerp(safeCamera,.2);
 if(obstructed(camera.position.x,camera.position.y,camera.position.z))camera.position.copy(safeCamera);
 const fullDistance=Math.max(.01,Math.hypot(desiredCamera.x-px,desiredCamera.z-pz)),actualDistance=Math.hypot(camera.position.x-px,camera.position.z-pz);const slope=(chaseTarget.y-desiredCamera.y)/fullDistance;chaseTarget.y=camera.position.y+slope*actualDistance;
 camera.lookAt(chaseTarget);cameraReady=true;
}
window.renderCampus3D=()=>{
 if(window.presentationAPI?.isLoading?.())return;
 syncPlayerLook();
 const s=window.campusState(),talking=s.dialogueSpeaker==='professor',inSports=s.driving&&s.vehicleId==='supercar';
 const needsResize=canvas.width!==Math.floor(innerWidth*renderer.getPixelRatio())
  ||canvas.height!==Math.floor(innerHeight*renderer.getPixelRatio());
 const frozenKey=s.running?'':[s.elapsed,s.life?.lighting,s.waypoint?.label,s.waypoint?.x,s.waypoint?.y,
  s.player.a,s.player.pitch,s.thirdPerson,s.dialogueSpeaker,innerWidth,innerHeight,appearanceKey].join('|');
 if(frozenKey&&frozenKey===pausedFrameKey&&!needsResize&&!talking){renderStylePreview();return;}
 pausedFrameKey=frozenKey;
 const now=performance.now();
 if(talking){
  portraitStarted??=now;
  if(!needsResize&&now-lastPortraitFrame<30)return;
  lastPortraitFrame=now;
 }else{portraitStarted=null;lastPortraitFrame=-Infinity;}
 tuneResolution(now,s.running);
 if(shadowLighting!==s.life?.lighting||now-lastShadowFrame>(phoneGraphics?64:31)){
  renderer.shadowMap.needsUpdate=true;lastShadowFrame=now;shadowLighting=s.life?.lighting;
 }
 updateEnvironment(s.life?.lighting);
 const targetFov=talking?43:s.activity?.boosting?77:s.driving?66+Math.min(8,Math.abs(s.velocity)*2.2)
  :s.combat?.blocking?61:s.thirdPerson?(s.touch&&innerWidth<innerHeight?75:67):70;
 if(Math.abs(camera.fov-targetFov)>.05){
  camera.fov=talking?targetFov:camera.fov+(targetFov-camera.fov)*.12;
  camera.updateProjectionMatrix();
 }
 s.jump+=campusGround(s.player.x*S,s.player.y*S);
 if(needsResize)resize();
 portraitLight.intensity=talking?8.2:0;
 const professorFacing=talking?frameProfessor(s):null;
 if(!talking)cameraPositionFor(s);
 if(renderer.shadowMap.needsUpdate){
  aimCampusShadow(sun,{x:s.player.x*S+Math.cos(s.player.a)*12,z:s.player.y*S+Math.sin(s.player.a)*12},lightOffset);
 }
 updateGrass(camera.position,s.elapsed);
 if(s.combat?.hurt&&!talking){
  camera.position.x+=Math.sin(s.elapsed*55)*s.combat.hurt*.035;
  camera.position.y+=Math.cos(s.elapsed*46)*s.combat.hurt*.025;
 }
 const animationDt=Math.max(0,Math.min(.1,s.elapsed-lastAnimationTime));lastAnimationTime=s.elapsed;
 animateHuman(playerModel,{...s.player,emote:s.social?.action,swing:s.combat?.swing,blocking:s.combat?.blocking},s.elapsed,animationDt);if(s.throwFlash>0){const r=playerModel.userData.rig;r.arms[1].rotation.x=-1.4+(1-s.throwFlash/.25)*1.1;r.elbows[1].rotation.x=-.35;r.body.rotation.y=Math.sin(s.throwFlash/.25*Math.PI)*.2;}playerModel.position.y=s.jump+(s.combat?.down?.22:0);playerModel.visible=!talking&&s.thirdPerson&&!s.driving&&Math.hypot(camera.position.x-s.player.x*S,camera.position.z-s.player.y*S)>1.3;
 if(!s.running||animationDt===0)playerModel.rotation.y=Math.PI/2-s.player.a;
 const carrying=s.activity?.carryingCoffee;
 footTray.visible=!!carrying&&playerModel.visible&&!s.combat?.down&&!s.combat?.swing&&!s.combat?.blocking;
 if(footTray.visible){
  const rig=playerModel.userData.rig;
  playerModel.rotation.y=Math.PI/2-s.player.a;
  for(const [i,arm] of rig.arms.entries()){
   arm.rotation.set(-.55,0,i===0?.12:-.12);
   rig.elbows[i].rotation.x=-.98;
  }
  footTray.position.set(playerModel.position.x+Math.cos(s.player.a)*.34,s.jump+1.13,playerModel.position.z+Math.sin(s.player.a)*.34);
  footTray.rotation.y=playerModel.rotation.y;
 }
 dashTray.visible=!!carrying&&s.driving&&!inSports;
 viewTray.visible=!talking&&!!carrying&&!s.driving&&!s.thirdPerson&&!s.combat?.blocking&&!s.combat?.swing;
 const stand=s.activity?.coffeeStand;
 coffeeMarker.visible=!!stand;
 if(stand){
  coffeeMarker.position.set(stand.x*S,campusGround(stand.x*S,stand.y*S),stand.y*S);
  coffeeIcon.position.y=1.5+Math.sin(s.elapsed*2.6)*.15;
 }
 animateHuman(driverModel,{...s.player,seated:true},s.elapsed,0);driverModel.visible=!talking&&s.thirdPerson&&s.driving&&!inSports;driverModel.position.y=.35+campusGround(s.player.x*S,s.player.y*S);driverModel.rotation.y=Math.PI/2-s.player.a;for(const arm of driverModel.userData.rig.arms)arm.rotation.x=-.8;
 fists.visible=!talking&&!viewTray.visible&&!s.driving&&!s.thirdPerson&&s.throwFlash<=0;fistMeshes.forEach((arm,i)=>{const active=s.combat?.swing?.hand===i,phase=active?s.combat.swing.phase:0;const compact=innerWidth/innerHeight<1.1;arm.position.set((i?1:-1)*(s.combat?.blocking?(compact?.09:.12):(compact?.13:.22)),s.combat?.blocking?(compact?-.02:-.1):(compact?-.12:-.26),(compact?-.5:-.42)-(active?Math.sin(phase*Math.PI)*.25:0));const look=window.presentationAPI?.appearance();firstPersonSkin.color.set(look?.skin||'#d3a17e');firstPersonCloth.color.set(look?.outfit==='vest'?'#eee8d9':look?.top||'#25394e');});cup.visible=!talking&&!s.driving&&!s.thirdPerson&&s.throwFlash>0;cup.rotation.x=s.throwFlash>0?-.8:0;cup.position.y=-.25+Math.sin(s.elapsed*7)*.008;dash.visible=steering.visible=!talking&&s.driving&&!inSports&&!s.thirdPerson;steering.rotation.z=-s.velocity*.015;
 lastView=s.thirdPerson;lastDriving=s.driving;
 s.props.forEach((p,i)=>{const g=propMeshes[i];g.position.set(p.x*S,0,p.y*S);g.visible=(p.partyStation!==undefined||p.ready<=s.elapsed)&&(!p.missionCone||s.missionConeActive);if(p.partyStation!==undefined)g.userData.ring.material.color.set(p.ready>s.elapsed?'#89efb5':'#eeb573');});s.students.forEach((n,i)=>animateHuman(people[i],n,s.elapsed,animationDt));s.guards.forEach((n,i)=>animateHuman(guardMeshes[i],n,s.elapsed,animationDt));openMic.visible=s.activity?.id==='receipts'&&s.activity.stage==='perform';s.contacts.forEach((n,i)=>{
  const isSpeaker=talking&&n.id==='professor';
  const poseTime=isSpeaker?s.elapsed+(now-portraitStarted)*.001:s.elapsed;
  animateHuman(contacts[i],n,poseTime,animationDt,s.player);
  if(isSpeaker){
   const professor=contacts[i],rig=professor.userData.rig;
   professor.rotation.y=professorFacing??professor.rotation.y;
   rig.head.rotation.x+=Math.sin(poseTime*1.7)*.036;
   rig.elbows[1].rotation.x-=.16+.08*Math.sin(poseTime*2);
  }
 });cartMesh.position.set(s.cart.x*S,campusGround(s.cart.x*S,s.cart.y*S),s.cart.y*S);cartMesh.visible=!s.driving||inSports||s.thirdPerson;cartMesh.rotation.y=-(s.cart.a??-Math.PI/2)-Math.PI/2;
 const tilt=s.driving&&!inSports?s.cartSteer*Math.min(.12,Math.abs(s.velocity)*.05):0;
 cartBody.rotation.z=THREE.MathUtils.lerp(cartBody.rotation.z,tilt,.22);
 headLamp.emissiveIntensity=s.life?.lighting==='night'?1.6:.23;
 tailLamp.emissiveIntensity=s.driving&&!inSports&&s.cartBraking?2:.3;
 for(const {wheel,axle,front} of cartWheels){
  axle.rotation.x+=s.driving&&!inSports?animationDt*s.velocity*S/.33:0;
  if(front)wheel.rotation.y=THREE.MathUtils.lerp(wheel.rotation.y,s.driving&&!inSports?s.cartSteer*.43:0,.25);
 }
 drawSupercar(s,animationDt,talking);
 pickupShoe.visible=!!s.waypoint&&s.waypoint.kind==='pickup'&&s.pickupKind==='shoe';pickupUSB.visible=!!s.waypoint&&s.waypoint.kind==='pickup'&&s.pickupKind==='usb';for(const obj of [pickupShoe,pickupUSB])if(obj.visible)obj.position.set(s.waypoint.x*S,0,s.waypoint.y*S);

 pickupFlyer.visible=s.activity?.id==='escape'&&s.activity.stage==='flyer';if(pickupFlyer.visible&&s.waypoint)pickupFlyer.position.set(s.waypoint.x*S,campusGround(s.waypoint.x*S,s.waypoint.y*S)+.12,s.waypoint.y*S);
 gateMarker.visible=!!s.activity?.gate;if(gateMarker.visible){gateMarker.position.set(s.activity.gate.x*S,4.3,s.activity.gate.y*S);gateMarker.rotation.y=-s.player.a-Math.PI/2;gateMaterial.emissiveIntensity=.35+Math.sin(s.elapsed*5)*.15;}
 cupFlights.forEach((mesh,i)=>{const shot=s.cupShots[i];mesh.visible=!!shot;if(shot){const t=shot.age/shot.duration;mesh.position.set((shot.x+(shot.tx-shot.x)*t)*S,campusGround(shot.x*S,shot.y*S)+1.3+Math.sin(t*Math.PI)*2-t*.9,(shot.y+(shot.ty-shot.y)*t)*S);mesh.rotation.set(t*7,0,t*4);}});
 const jobColor=s.activity?.id?'#ffd27d':'#ef80be';beamMat.color.set(jobColor);halo.material.color.set(jobColor);arrow.material.color.set(s.activity?.id?'#ffe0a2':'#ffd4ed');
 beacon.visible=!!s.waypoint&&s.waypoint.kind!=='hide';if(s.waypoint){beacon.position.set(s.waypoint.x*S,campusGround(s.waypoint.x*S,s.waypoint.y*S),s.waypoint.y*S);const markerDistance=Math.hypot(s.waypoint.x-s.player.x,s.waypoint.y-s.player.y)*S;beam.visible=markerDistance>10;arrow.visible=markerDistance>6;arrow.position.y=3+Math.sin(s.elapsed*3)*.3;halo.rotation.z=s.elapsed*.4;}sky.position.copy(camera.position);skyMaterial.uniforms.time.value=s.elapsed;updateFountain(s.elapsed);updateContactShadows();renderer.render(scene,camera);renderStylePreview();};
document.querySelector('#renderer-status').textContent='3D READY · ALL ASSETS LOCAL';
requestAnimationFrame(()=>window.presentationAPI?.ready());
