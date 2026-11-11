import * as THREE from '../three.module.js';
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../world3d.js',import.meta.url),'utf8');
const rig=source.slice(source.indexOf('const humanGeometry='),source.indexOf('// Contact costumes'));
const animation=source.slice(source.indexOf('function animateHuman('),source.indexOf('function styleCharacter('));
const style=source.slice(source.indexOf('function styleCharacter('),source.indexOf('function removeHuman('));
const material=color=>new THREE.MeshStandardMaterial({color}),scope={THREE,material,S:8,campusGround:()=>0,camera:{position:new THREE.Vector3(0,2,0)},metal:material('#444444'),gold:material('#c6a163'),dark:material('#222222')};vm.createContext(scope);vm.runInContext(rig+animation+style,scope);
const model=scope.styleCharacter({gender:'female',top:'#711d3b',pants:'#26394d',hair:'curls',outfit:'hoodie',accessory:'none'}),n={x:1,y:1};
assert(vm.runInContext(`
 ['pantLeg','longSleeve','shortSleeve','forearmSkin'].every(name=>{
  const {position,normal}=humanGeometry[name].attributes;
  let radial=0;
  for(let i=0;i<position.count;i++)radial+=position.getX(i)*normal.getX(i)+position.getZ(i)*normal.getZ(i);
  return radial>0;
 })
`,scope),'clothing normals point outward');
const {body,elbows}=model.userData.rig;
const sleeve=body.children.find(mesh=>mesh.isSkinnedMesh&&mesh.material.color.getHexString()==='711d3b');
assert(sleeve,'continuous sleeve is skinned');
const joint=sleeve.skeleton.bones.indexOf(elbows[0]);
const {skinIndex,skinWeight}=sleeve.geometry.attributes;
let sleeveVertex=-1;
for(let i=0;i<skinIndex.count;i++)if(skinIndex.getY(i)===joint&&skinWeight.getY(i)>.8){sleeveVertex=i;break;}
assert(sleeveVertex>=0,'the sleeve is weighted to the elbow');
model.updateMatrixWorld(true);
const before=sleeve.getVertexPosition(sleeveVertex,new THREE.Vector3());
elbows[0].rotation.x=-1.1;model.updateMatrixWorld(true);
assert(sleeve.getVertexPosition(sleeveVertex,new THREE.Vector3()).distanceTo(before)>.05,'the sleeve follows the bent elbow');
scope.animateHuman(model,{...n,emote:'wave'},1,.1);assert(model.userData.rig.arms[1].rotation.z>2,'wave raises a hand');
scope.animateHuman(model,n,1.2,.1);assert(Math.abs(model.userData.rig.elbows[1].rotation.z)<.01,'wave wrist rotation clears');
scope.animateHuman(model,{...n,emote:'dance'},2,.1);assert(Math.abs(model.userData.rig.body.rotation.z)>.02,'dance moves torso');
scope.animateHuman(model,{...n,emote:'pose'},3,.1);assert(model.userData.rig.phone.visible,'selfie pose shows phone');
scope.animateHuman(model,{...n,flee:true},3.1,.1);assert(!model.userData.rig.phone.visible);assert(model.userData.rig.elbows[0].rotation.x<-1,'panic interrupts idle pose');
scope.animateHuman(model,{...n,seated:true},4,.1);assert.equal(model.userData.rig.knees[0].rotation.x,1.5,'driver rig remains seated');
scope.animateHuman(model,{...n,a:0,swing:{hand:1,phase:.5}},4.2,.1);assert(model.userData.rig.arms[1].rotation.x<-1.7,'punch extends the striking arm');
scope.animateHuman(model,{...n,blocking:true},4.5,.1);assert(model.userData.rig.elbows[0].rotation.x<-1.4,'guard raises both forearms');
scope.animateHuman(model,{...n,downUntil:7},5,.1);assert(Math.abs(model.rotation.z)>1.5,'knockdown lies the rig down');
scope.animateHuman(model,n,8,.1);assert.equal(model.rotation.z,0,'recovery restores the upright rig');
let meshes=0;model.traverse(o=>{if(o.isMesh)meshes++;});assert(meshes<75,'joint-local batching limits character draw calls');
console.log('PASS: waving, dance, selfie phone, panic, punches/guard/knockdown, animation reset, seated driver and character batching ('+meshes+' meshes)');
