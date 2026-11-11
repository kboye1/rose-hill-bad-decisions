import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../world3d.js',import.meta.url),'utf8');
const body=source.slice(source.indexOf('function gymGround('),source.indexOf('function campusGround('));
const scope={S:8,gymSite:{x:30,y:20,w:3,h:4}};vm.createContext(scope);vm.runInContext(body,scope);
const ground=(out,lateral=0)=>scope.gymGround(252+lateral,192+out);
assert.equal(ground(16),0);assert.equal(ground(-1),0);assert.equal(ground(5,12),0);
assert.equal(ground(7.5),1.68);assert.equal(ground(1),2.8);
let last=0;
for(let out=15.65;out>=0;out-=.025){const h=ground(out);assert(h>=last-1e-8,'ascent cannot drop between flights');assert(h-last<=.14+1e-8,'risers stay at walking height');last=h;}
assert(ground(4.4,8)>1.68&&ground(4.4,8)<2.8,'side bank follows the upper flight');
console.log('PASS: gym lower flight, intermediate landing, upper flight, side banks and maximum riser');
