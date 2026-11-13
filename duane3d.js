import * as THREE from './three.module.js';

// Duane's 1926 exterior with the grade-level entry and stair towers from the 2004 renovation.
export function buildDuane(b, {S, scene, box, material, archPanel, surfaceTexture, seededRandom, tiledGround, walkMaterial, surfaceMaterial}) {
 const front=(b.x+b.w)*S, center=(b.y+b.h/2)*S;
 const width=b.h*S, depth=b.w*S, height=10.6, towerWidth=7.8, towerHeight=20.8;
 const root=new THREE.Group();
 root.position.set(front,0,center);
 root.rotation.y=Math.PI/2;
 scene.add(root);

 const stones=surfaceTexture((c,w,h)=>{
  const random=seededRandom(492);
  c.fillStyle='#625e55';
  c.fillRect(0,0,w,h);
  for(let y=0;y<h;y+=23){
   for(let x=-46;x<w;){
    const span=23+random()*57, shade=Math.floor(100+random()*54);
    c.fillStyle='rgb('+shade+','+(shade-4)+','+(shade-12)+')';
    c.beginPath();
    c.moveTo(x+3,y+2);
    c.lineTo(x+span-3,y+1+random()*3);
    c.lineTo(x+span-2,y+19+random()*2);
    c.lineTo(x+3,y+21);
    c.closePath();
    c.fill();
    c.fillStyle='#e7d7bc42';
    c.fillRect(x+5,y+3,span-10,1.4);
    x+=span;
   }
  }
  for(let i=0;i<10500;i++){
   c.fillStyle=i%2?'#e5d9c028':'#2e302728';
   c.fillRect(random()*w,random()*h,1+random()*2,1.5);
  }
 });
 const wall=surfaceMaterial('fieldstone',stones,'#d4d3c5',.9);
 const stone=material('#c2b9a5'),cap=material('#a8a18e');
 const lead=material('#827e71'),zinc=material('#6a7878',{roughness:.49,metalness:.26});
 const glass=material('#677d81',{roughness:.38,metalness:.24});
 const blueGlass=material('#667d86',{roughness:.29,metalness:.42});
 const reveal=material('#544f46'),oak=material('#703d2b'),iron=material('#353b3a');
 const lamp=material('#dfbd77',{emissive:'#cd9753',emissiveIntensity:.65});

 function block(w,h,d,mat,x,y,z){return box(w,h,d,mat,x,y,z,root);}
 function ashlar(w,h,d,x,y,z){
  const mesh=block(w,h,d,wall,x,y,z),{uv,position,normal}=mesh.geometry.attributes;
  for(let i=0;i<uv.count;i++){
   const side=Math.abs(normal.getX(i))>.5, flat=Math.abs(normal.getY(i))>.5;
   uv.setXY(i,(side?position.getZ(i)+z:position.getX(i)+x)/3.2,
    (flat?position.getZ(i)+z:position.getY(i)+y)/3.2);
  }
  return mesh;
 }
 function arch(w,h,mat,x,y,z){return archPanel(w,h,mat,x,y,z,0,root);}
 function pane(w,h,x,y,z,pointed=true){
  if(pointed){
   arch(w+.4,h+.25,stone,x,y-.12,z);
   arch(w+.16,h+.08,reveal,x,y-.045,z+.035);
   arch(w,h,glass,x,y,z+.065);
  }else{
   block(w+.31,h+.24,.17,stone,x,y+h/2,z-.03);
   block(w,h,.08,glass,x,y+h/2,z+.078);
  }
  for(const dx of [-w*.245,0,w*.245]){
   const rise=pointed?(dx===0?.87:.75):.99;
   block(.064,h*rise,.06,stone,x+dx,y+h*rise*.5,z+.12);
  }
  for(const level of [.27,.61])block(w,.055,.067,lead,x,y+h*level,z+.127);
  if(pointed)for(const side of [-1,1]){
   const fork=block(.05,h*.24,.05,stone,x+side*w*.135,y+h*.72,z+.132);
   fork.rotation.z=side*.42;
  }
  block(w+.42,.15,.28,cap,x,y-.07,z+.06);
 }

 ashlar(width,height,depth,0,height/2,-depth/2);
 for(const y of [.26,2.1,height-.35])block(width+.16,.17,depth+.16,cap,0,y,-depth/2);
 block(width+.28,.24,depth+.25,stone,0,height,-depth/2);
 for(const side of [-1,1]){
  for(const offset of [5.7,9.4,12.9]){
   const x=side*offset;
   pane(1.65,1.22,x,.5,.07,false);
   pane(2.17,6.35,x,2.58,.095);
   ashlar(.45,8.98,.55,x+side*1.38,4.49,.24);
   block(.56,.23,.69,stone,x+side*1.38,8.95,.27);
   block(1.15,.6,.54,wall,x,height+.38,.04);
   block(1.23,.12,.62,cap,x,height+.7,.04);
  }
  const x=side*(width/2-2.75), z=-depth+.85;
  ashlar(3.35,1.6,2.8,x,.8,z);
  block(3.12,9.5,2.24,zinc,x,6.2,z);
  block(2.49,8.85,.1,blueGlass,x,6.03,z-1.14);
  block(.11,8.85,1.59,blueGlass,x+side*1.58,6.03,z);
  for(let i=0;i<7;i++){
   const y=1.62+i*1.43;
   block(2.64,.065,.14,iron,x,y,z-1.23);
   block(.14,.065,1.62,iron,x+side*1.63,y,z);
  }
  for(const dx of [-.84,0,.84])block(.047,8.9,.12,iron,x+dx,6.03,z-1.22);
  block(3.31,.16,2.42,cap,x,11.04,z);
 }

 ashlar(towerWidth,towerHeight,6,0,towerHeight/2,-3.1);
 for(const side of [-1,1]){
  const x=side*(towerWidth*.41);
  ashlar(.8,11.5,.54,x,5.75,.24);
  for(const y of [.2,2.13,6.05,10.43])block(.96,.2,.69,stone,x,y,.25);
  block(.63,2,.74,stone,side*(towerWidth/2-.31),towerHeight+.39,.07);
 }
 for(const y of [2.1,10.35,11.0,18.36,18.72])block(towerWidth+.24,.17,.72,stone,0,y,.15);
 pane(1.75,4.85,0,11.65,.22);
 block(towerWidth-.9,1.17,.35,stone,0,19.61,.08);
 for(let i=0;i<11;i++){
  const x=(i-5)*.55;
  arch(.33,.86,cap,x,19.12,.27);
  block(.35,.28,.44,stone,x,18.21,.21);
 }
 block(1.04,1.03,.11,cap,0,19.65,.32);
 arch(3.88,6.54,stone,0,.13,.55);
 arch(3.43,6.19,cap,0,.13,.6);
 arch(3.05,5.91,reveal,0,.13,.65);
 pane(2.74,3.55,0,2.31,.67);
 arch(2.72,2.18,oak,0,.13,.79);
 for(const dx of [-.9,-.58,.58,.9])block(.15,1.21,.07,glass,dx,1.32,.84);
 block(.075,2.14,.09,oak,0,1.19,.85);
 for(const x of [-.13,.13])block(.052,.24,.09,lamp,x,1.04,.92);
 block(3.86,.17,.87,stone,0,6.81,.48);
 for(let i=0;i<8;i++)arch(.26,.41,reveal,(i-3.5)*.41,6.87,.77);
 pane(1.43,1.55,0,7.57,.45,false);
 for(const x of [-2.55,2.55]){
  block(.18,.48,.19,iron,x,2.32,.52);
  block(.11,.31,.13,lamp,x,2.32,.63);
 }
 tiledGround(7.6,13.5,walkMaterial,front+3.45,.047,center,2.2);
 for(const side of [-1,1]){
  block(4.34,.46,1.35,wall,side*4.44,.22,2.34);
  block(4.48,.12,1.51,stone,side*4.44,.51,2.34);
 }
 batchFacade(root);
}

// Keep the moldings and individual window bars in a few static draw calls.
function batchFacade(root) {
 const batches=new Map();
 for(const mesh of root.children){
  if(!batches.has(mesh.material))batches.set(mesh.material,[]);
  batches.get(mesh.material).push(mesh);
 }
 for(const [material,meshes] of batches){
  if(meshes.length<2)continue;
  const parts=meshes.map(mesh=>{
   mesh.updateMatrix();
   const geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
   return geometry.applyMatrix4(mesh.matrix);
  });
  const count=parts.reduce((total,part)=>total+part.attributes.position.count,0);
  const merged=new THREE.BufferGeometry();
  for(const name of ['position','normal','uv']){
   const size=name==='uv'?2:3, data=new Float32Array(count*size);
   let offset=0;
   for(const part of parts){
    data.set(part.attributes[name].array,offset);
    offset+=part.attributes[name].array.length;
   }
   merged.setAttribute(name,new THREE.BufferAttribute(data,size));
  }
  for(const mesh of meshes){mesh.geometry.dispose();root.remove(mesh);}
  for(const part of parts)part.dispose();
  const batch=new THREE.Mesh(merged,material);
  batch.castShadow=true;
  batch.receiveShadow=true;
  root.add(batch);
 }
}
