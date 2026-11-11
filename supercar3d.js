import * as THREE from './three.module.js';

const black = new THREE.MeshStandardMaterial({color:'#171c21',roughness:.63});
const carbon = new THREE.MeshStandardMaterial({color:'#293037',roughness:.38,metalness:.28});
const tire = new THREE.MeshStandardMaterial({color:'#242629',roughness:.95});
const alloy = new THREE.MeshStandardMaterial({color:'#acb6b5',roughness:.3,metalness:.68});
const rotor = new THREE.MeshStandardMaterial({color:'#737d7f',roughness:.48,metalness:.53});

function addMesh(parent,geometry,material,x=0,y=0,z=0){
 const mesh=new THREE.Mesh(geometry,material);
 mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;
 parent.add(mesh);return mesh;
}

function solid(parent,material,w,h,d,x,y,z){
 return addMesh(parent,new THREE.BoxGeometry(w,h,d),material,x,y,z);
}

function panel(parent,material,points){
 const vertices=[];
 for(let i=1;i<points.length-1;i++)vertices.push(...points[0],...points[i],...points[i+1]);
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geometry.computeVertexNormals();
 return addMesh(parent,geometry,material);
}

function bead(parent,material,points,radius){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
 return addMesh(parent,new THREE.TubeGeometry(curve,Math.max(6,points.length*4),radius,6),material);
}

function bodyGeometry(){
 // Section dimensions measured in scene units. Lower edges rise over each wheel.
 const profiles=[
  [-2.36,.73,.46,.50],[-2.23,.91,.51,.54],[-2.00,.99,.60,.61],
  [-1.82,1.01,.69,.66],[-1.67,1.03,.75,.68],[-1.47,1.04,.77,.70],
  [-1.26,1.02,.76,.72],[-1.03,.99,.73,.75],[-.69,.96,.73,.77],
  [0,.95,.76,.79],[.62,1.00,.81,.83],[.99,1.07,.85,.84],
  [1.20,1.09,.86,.85],[1.41,1.10,.87,.86],[1.62,1.08,.86,.85],
  [1.82,1.06,.83,.82],[2.04,1.01,.77,.78],[2.26,.96,.71,.74]
 ];
 const position=[],uv=[],index=[];
 for(const [z,w,shoulder,deck] of profiles){
  const arch=Math.min(Math.abs(z+1.46),Math.abs(z-1.39));
  const lower=.27+.46*Math.sqrt(Math.max(0,1-(arch/.443)**2));
  const corner=Math.min(shoulder-.014,Math.max(.46,lower+.014));
  const vertices=[[-w*.89,Math.min(lower,corner-.003)],[-w,corner],[-w*.94,shoulder],
   [-w*.61,deck],[0,deck+.018],[w*.61,deck],[w*.94,shoulder],[w,corner],[w*.89,Math.min(lower,corner-.003)]];
  vertices.forEach(([x,y],i)=>{position.push(x,y,z);uv.push(i/8,(z+2.36)/4.62);});
 }
 for(let row=0;row<profiles.length-1;row++){
  for(let col=0;col<8;col++){
   const a=row*9+col,b=a+1,c=b+9,d=a+9;
   index.push(a,d,b,b,d,c);
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setIndex(index);
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geometry.computeVertexNormals();return geometry;
}

export function buildSupercar(environment,plateTexture){
 const root=new THREE.Group(),body=new THREE.Group(),wheels=[];
 root.add(body);
 const paint=new THREE.MeshPhysicalMaterial({color:'#b0d324',roughness:.3,metalness:.53,
  clearcoat:.92,clearcoatRoughness:.14,envMap:environment,envMapIntensity:1.22,side:THREE.DoubleSide});
 const windowGlass=new THREE.MeshPhysicalMaterial({color:'#284958',roughness:.16,metalness:.61,
  clearcoat:1,clearcoatRoughness:.1,envMap:environment,envMapIntensity:1.22,side:THREE.DoubleSide});
 const red=new THREE.MeshStandardMaterial({color:'#ff453b',emissive:'#e51a15',emissiveIntensity:.55,roughness:.34});
 const white=new THREE.MeshStandardMaterial({color:'#e9f8ff',emissive:'#b5dcff',emissiveIntensity:.44});
 const vent=new THREE.MeshStandardMaterial({color:'#12181c',roughness:.81,side:THREE.DoubleSide});
 addMesh(body,bodyGeometry(),paint);

 // Low cabin, separate roof and glass. The original wedge body uses no factory marks.
 const frontLow=[[-.84,.747,-1.06],[.84,.747,-1.06]],frontHigh=[[-.61,1.258,-.33],[.61,1.258,-.33]];
 const backHigh=[[-.57,1.246,.52],[.57,1.246,.52]],backLow=[[-.82,.867,1.54],[.82,.867,1.54]];
 panel(body,windowGlass,[frontLow[0],frontLow[1],frontHigh[1],frontHigh[0]]);
 panel(body,windowGlass,[backHigh[1],backHigh[0],backLow[0],backLow[1]]);
 panel(body,paint,[frontHigh[0],backHigh[0],backHigh[1],frontHigh[1]]);
 for(const i of [0,1]){
  const sign=i===0?-1:1;
  panel(body,windowGlass,[frontLow[i],frontHigh[i],backHigh[i],backLow[i]]);
  bead(body,black,[frontLow[i],frontHigh[i],backHigh[i],backLow[i]],.018);
  bead(body,black,[[sign*.59,1.25,.23],[sign*.84,.82,.29]],.015);
  bead(body,black,[frontLow[i],backLow[i]],.013);
  const mirror=solid(body,paint,.20,.09,.22,sign*.99,.91,-.73);
  mirror.rotation.y=sign*.23;
  solid(body,black,.12,.038,.14,sign*.925,.874,-.73);
 }

 panel(body,vent,[[-.87,.26,-2.32],[.87,.26,-2.32],[.92,.42,-2.26],[-.92,.42,-2.26]]);
 solid(body,carbon,1.86,.057,.28,0,.253,-2.20);
 solid(body,black,1.9,.065,.27,0,.255,2.10);
 panel(body,vent,[[-.99,.28,2.22],[.99,.28,2.22],[.96,.69,2.26],[-.96,.69,2.26]]);
 for(const sign of [-1,1]){
  solid(body,carbon,.11,.08,2.02,sign*.941,.282,.03);
  panel(body,vent,[[sign*.997,.5,.32],[sign*1.057,.77,.67],[sign*1.073,.742,1.02],[sign*1.033,.53,.99]]);
  bead(body,black,[[sign*.943,.71,-.87],[sign*.953,.58,-.54],[sign*.987,.56,.53],[sign*1.047,.71,.92]],.007);
  bead(body,carbon,[[sign*.947,.721,.02],[sign*.957,.726,.23]],.018);
  const lightPoints=[[sign*.47,.56,-2.21],[sign*.79,.58,-2.17],[sign*.91,.639,-1.94],[sign*.6,.617,-1.91]];
  panel(body,vent,lightPoints);
  bead(body,white,[[sign*.53,.575,-2.195],[sign*.79,.593,-2.15],[sign*.864,.624,-2.00]],.022);
  bead(body,red,[[sign*.16,.596,2.271],[sign*.56,.61,2.275],[sign*.861,.638,2.254]],.027);
  bead(body,red,[[sign*.56,.609,2.278],[sign*.71,.54,2.28]],.017);
  solid(body,alloy,.17,.084,.12,sign*.64,.345,2.28);
  solid(body,black,.106,.051,.132,sign*.64,.348,2.30);
  for(const z of [-1.46,1.39]){
   const pivot=new THREE.Group(),spindle=new THREE.Group();
   pivot.position.set(sign*.889,.36,z);pivot.add(spindle);root.add(pivot);
   const wheel=addMesh(spindle,new THREE.CylinderGeometry(.36,.36,.27,28),tire);
   wheel.rotation.z=Math.PI/2;
   const rim=addMesh(spindle,new THREE.CylinderGeometry(.274,.274,.035,24),black,sign*.14,0,0);
   rim.rotation.z=Math.PI/2;
   const edge=addMesh(spindle,new THREE.TorusGeometry(.266,.016,6,24),alloy,sign*.164,0,0);
   edge.rotation.y=Math.PI/2;
   const disc=addMesh(spindle,new THREE.CylinderGeometry(.184,.184,.018,20),rotor,sign*.161,0,0);
   disc.rotation.z=Math.PI/2;
   for(let i=0;i<7;i++){
    const a=i*Math.PI*2/7;
    const spoke=solid(spindle,alloy,.021,.189,.029,sign*.173,Math.cos(a)*.147,Math.sin(a)*.147);
    spoke.rotation.x=a+.15;
   }
   const hub=addMesh(spindle,new THREE.CylinderGeometry(.061,.061,.024,16),carbon,sign*.18,0,0);
   hub.rotation.z=Math.PI/2;
   wheels.push({pivot,spindle,front:z<0});
  }
 }
 // Rear deck vents and a thin active-wing profile.
 for(let i=0;i<7;i++)solid(body,carbon,1.07,.012,.041,0,.877,1.59+i*.066);
 for(const x of [-.67,.67])solid(body,carbon,.066,.125,.12,x,.85,1.98);
 solid(body,paint,1.78,.061,.25,0,.94,2.035);
 const plate=new THREE.MeshStandardMaterial({map:plateTexture,color:'#fff8e5',roughness:.7});
 addMesh(body,new THREE.PlaneGeometry(.44,.15),plate,0,.499,2.285);
 return {root,body,wheels,paint,white,red};
}

export function buildCockpit(camera){
 const root=new THREE.Group();
 camera.add(root);
 solid(root,carbon,1.36,.21,.38,0,-.39,-.61);
 solid(root,black,.68,.16,.22,-.08,-.279,-.61);
 const wheelGroup=new THREE.Group();wheelGroup.position.set(-.09,-.266,-.44);root.add(wheelGroup);
 const wheel=addMesh(wheelGroup,new THREE.TorusGeometry(.133,.016,12,36),carbon);
 wheel.rotation.x=-.34;
 solid(wheelGroup,alloy,.197,.015,.019,0,-.012,.015);
 solid(wheelGroup,carbon,.026,.101,.017,0,-.063,.013);
 solid(wheelGroup,alloy,.083,.04,.026,0,-.011,.036);
 const gauge=new THREE.MeshBasicMaterial({color:'#a6f8c6'});
 const bezel=new THREE.MeshBasicMaterial({color:'#3e5755'});
 const indicators=[];
 for(let i=0;i<12;i++){
  const x=-.24+i*.025,y=-.218+Math.sin(i/11*Math.PI)*.02;
  solid(root,bezel,.019,.014,.01,x,y,-.632);
  indicators.push(solid(root,gauge,.015,.009,.008,x,y,-.624));
 }
 solid(root,alloy,.41,.008,.011,-.10,-.237,-.618);
 for(const sign of [-1,1]){
  const pillar=solid(root,carbon,.034,.41,.025,sign*.585,-.02,-.71);
  pillar.rotation.z=sign*.31;
 }

 for(const sign of [-1,1])solid(root,carbon,.09,.08,.37,sign*.56,-.358,-.6);
 root.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=false;});
 return {root,wheel:wheelGroup,indicators};
}
