import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../world3d.js',import.meta.url),'utf8');
const body=source.slice(source.indexOf('function keatingGround('),source.indexOf('function buildKeating('));
const scope={S:8,keatingSite:{x:30,y:20,h:6}};vm.createContext(scope);vm.runInContext(body,scope);
const ground=(out,lateral=0)=>scope.keatingGround(240-out,184+lateral);
assert.equal(ground(16),0);assert.equal(ground(15),0);assert.equal(ground(3),2.4);assert.equal(ground(1),2.4);assert.equal(ground(7,16),0);
let last=0;
for(let out=15;out>=0;out-=.05){const h=ground(out);assert(h>=last-1e-9);assert(h-last<=2.4/18+1e-9,'a walking step cannot exceed one tread height');last=h;}
console.log('PASS: stair ascent, landing height, lawn boundary and maximum riser');
