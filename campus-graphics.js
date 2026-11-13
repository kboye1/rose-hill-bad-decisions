import * as THREE from './three.module.js';

export async function loadCampusSurfaces(renderer) {
 const loader=new THREE.TextureLoader();
 const assetURL=name=>window.iosSurfaceData?.[name]||new URL('./assets/surfaces/'+name,import.meta.url).href;
 async function load(stem,channel){
  try{
   const texture=await loader.loadAsync(assetURL(stem+'-'+channel+'.webp'));
   texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
   texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
   if(channel==='color')texture.colorSpace=THREE.SRGBColorSpace;
   return texture;
  }catch{return null;}
 }
 const surfaces={};
 await Promise.all(['lawn','paving','fieldstone'].map(async stem=>{
  const [color,normal,roughness]=await Promise.all(
   ['color','normal','rough'].map(channel=>load(stem,channel)));
  if(color&&normal&&roughness)surfaces[stem]={map:color,normalMap:normal,roughnessMap:roughness};
 }));
 try{
  surfaces.sky=await loader.loadAsync(assetURL('sky.webp'));
  surfaces.sky.colorSpace=THREE.SRGBColorSpace;
  surfaces.sky.wrapS=THREE.RepeatWrapping;
 }catch{ /* The procedural sky is also available. */ }
 return surfaces;
}

// Each tuft contains bent strips with a darker root. Chunks limit the drawn grass to
// walking distance. Wind and distance thinning run on the GPU in the main pass.
export function createLawnBlades(scene,field,scale,roads,random,compact=false){
 const geometry=new THREE.BufferGeometry();
 const positions=[],colors=[],indices=[];
 for(let i=0;i<6;i++){
  const angle=random()*Math.PI*2,width=.017+random()*.011;
  const height=.067+random()*.105,bend=.018+random()*.07;
  const dx=Math.cos(angle),dz=Math.sin(angle);
  const bx=(random()-.5)*.27,bz=(random()-.5)*.27;
  const offset=positions.length/3;
  positions.push(bx-dz*width,0,bz+dx*width,bx+dz*width,0,bz-dx*width,
   bx+dx*bend*.35-dz*width*.63,height*.57,bz+dz*bend*.35+dx*width*.63,
   bx+dx*bend*.35+dz*width*.63,height*.57,bz+dz*bend*.35-dx*width*.63,
   bx+dx*bend,height,bz+dz*bend);
  indices.push(offset,offset+1,offset+2,offset+1,offset+3,offset+2,offset+2,offset+3,offset+4);
  colors.push(.23,.29,.13,.24,.3,.13,.56,.65,.36,.52,.61,.32,.81,.91,.55);
 }
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geometry.setIndex(indices);
 geometry.computeVertexNormals();
 const material=new THREE.MeshStandardMaterial({color:'#9ba65f',side:THREE.DoubleSide,
  roughness:.94,vertexColors:true});
 const windTime={value:0};
 material.onBeforeCompile=shader=>{
  shader.uniforms.windTime=windTime;
  shader.vertexShader='uniform float windTime;\nvarying vec3 grassAnchor;\n'+shader.vertexShader
   .replace('#include <begin_vertex>',`
    #include <begin_vertex>
    grassAnchor=(modelMatrix*vec4(0.,0.,0.,1.)).xyz;
    #ifdef USE_INSTANCING
     grassAnchor=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
    #endif
    float phase=grassAnchor.x*.53+grassAnchor.z*.31;
    float gust=sin(windTime*2.2+phase)*.17+sin(windTime*3.1+phase*2.2)*.08;
    transformed.x+=position.y*gust;
    transformed.z+=position.y*gust*.55;
   `);
  shader.fragmentShader='varying vec3 grassAnchor;\n'+shader.fragmentShader.replace('#include <color_fragment>',`
   #include <color_fragment>
   float grassDistance=distance(cameraPosition.xz,grassAnchor.xz);
   float grassSeed=fract(sin(dot(grassAnchor.xz,vec2(14.17,47.13)))*8731.17);
   if(grassSeed>1.0-smoothstep(18.,34.,grassDistance))discard;
  `);
 };
 const x0=field.x*scale,z0=field.y*scale,w=field.w*scale,d=field.h*scale;
 const roadSegments=roads.map(({a,b,w})=>({ax:a.x*scale,az:a.y*scale,bx:b.x*scale,bz:b.y*scale,r:w*scale/2+.24}));
 function onPath(x,z){
  return roadSegments.some(({ax,az,bx,bz,r})=>{
   const dx=bx-ax,dz=bz-az;
   const t=THREE.MathUtils.clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz),0,1);
   return Math.hypot(x-ax-dx*t,z-az-dz*t)<r;
  });
 }
 const pose=new THREE.Object3D(), tint=new THREE.Color(),chunks=[],step=9;
 for(let u=-step;u<w+step;u+=step)for(let v=-step;v<d+step;v+=step){
  const points=[];
  const tuftsPerChunk=compact?225:665;
  for(let j=0;j<tuftsPerChunk;j++){
   const x=x0+u+random()*step,z=z0+v+random()*step;
   if(onPath(x,z))continue;
   const edge=x<x0+1||x>x0+w-1||z<z0+1||z>z0+d-1;
   if(edge&&random()<.55)continue;
   points.push([x,z,edge]);
  }
  if(!points.length)continue;
  const blades=new THREE.InstancedMesh(geometry,material,points.length);
  blades.position.set(x0+u,0,z0+v);
  for(const [index,[x,z,edge]] of points.entries()){
   const height=.65+random()*(edge?.66:.44),width=.77+random()*.6;
   pose.position.set(x-blades.position.x,.011,z-blades.position.z);
   pose.rotation.y=random()*Math.PI*2;
   pose.scale.set(width,height,width);
   pose.updateMatrix();
   blades.setMatrixAt(index,pose.matrix);
   tint.setRGB(.75+random()*.25,.77+random()*.23,.55+random()*.25);
   blades.setColorAt(index,tint);
  }
  blades.computeBoundingSphere();
  blades.receiveShadow=true;
  scene.add(blades);
  chunks.push(blades);
 }
 return (camera,time)=>{
  windTime.value=time;
  for(const chunk of chunks){
   chunk.visible=Math.hypot(chunk.position.x+step/2-camera.x,chunk.position.z+step/2-camera.z)<(compact?26:38);
  }
 };
}

// Center the shadow camera near the view and align it to its texel grid.
// Keeping the world light vector fixed prevents shadows rotating as the player walks.
export function aimCampusShadow(light,position,lightOffset){
 const target=light.target.position;
 const span=light.shadow.camera.right-light.shadow.camera.left;
 const step=span/light.shadow.mapSize.x;
 target.set(Math.round(position.x/step)*step,0,Math.round(position.z/step)*step);
 light.position.copy(target).add(lightOffset);
 light.target.updateMatrixWorld();
}
