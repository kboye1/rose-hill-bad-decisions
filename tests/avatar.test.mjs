import * as THREE from '../three.module.js';
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../world3d.js',import.meta.url),'utf8');
const rigSource=source.slice(source.indexOf('const humanGeometry='),source.indexOf('// Contact costumes'));
const styleSource=source.slice(source.indexOf('function dressLayer('),source.indexOf('function removeHuman('));
const material=color=>new THREE.MeshStandardMaterial({color});
const scope={THREE,material,metal:material('#444444'),gold:material('#c6a163'),dark:material('#222222')};vm.createContext(scope);vm.runInContext(rigSource+styleSource,scope);
const male={gender:'male',skin:'#ae7654',hair:'long',hairColor:'#30251e',top:'#711d3b',pants:'#26394d',shoes:'#eee7d8',outfit:'vest',build:'regular',accessory:'glasses'};
const m=scope.styleCharacter(male),f=scope.styleCharacter({...male,gender:'female'});
assert(m.scale.y>f.scale.y,'distinct male/female model proportions');assert(f.userData.rig.arms[0].position.x>m.userData.rig.arms[0].position.x,'female shoulder width reflected in rig');
for(const gender of ['male','female'])for(const outfit of ['vest','blazer','hoodie','rugby','cardigan','moto','track'])for(const accessory of ['none','shades','glasses','cap','beanie','hoops','pearls','headband']){
 const avatar=scope.styleCharacter({...male,gender,outfit,accessory});avatar.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(avatar);assert(Number.isFinite(bounds.max.y)&&bounds.max.y>1.5,'valid complete model for every outfit/accessory');assert.equal(avatar.userData.rig.arms.length,2);assert.equal(avatar.userData.rig.knees.length,2);
}
const shortHair=scope.styleCharacter({...male,gender:'female',hair:'short',accessory:'none'});
shortHair.updateMatrixWorld(true);
const shortHead=new THREE.Box3().setFromObject(shortHair.userData.rig.head);
for(const hair of ['bob','ponytail','braids','halfup']){
 const avatar=scope.styleCharacter({...male,gender:'female',hair,accessory:'none'});
 avatar.updateMatrixWorld(true);
 const headBounds=new THREE.Box3().setFromObject(avatar.userData.rig.head);
 assert(headBounds.min.y<shortHead.min.y-.012||headBounds.min.z<shortHead.min.z-.019,
  hair+' extends beyond the short cut');
}
console.log('PASS: distinct male/female rigs and every shared outfit/accessory combination');
