import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../world3d.js',import.meta.url),'utf8');
const body=source.slice(source.indexOf('function hughesGround('),source.indexOf('function buildHughes('));
const scope={S:8,hughesSite:{x:20,y:25,w:4,h:2}};vm.createContext(scope);vm.runInContext(body,scope);
const ground=(out,lateral=0)=>scope.hughesGround(176+lateral,216+out);
assert.equal(ground(6),0);assert.equal(ground(-1),0);assert.equal(ground(3,4.81),0);assert.equal(ground(1),1.02);
let last=0;
for(let out=5.65;out>=0;out-=.025){const height=ground(out);assert(height>=last-1e-8,'ascent stays continuous between treads and landing');assert(height-last<=.17+1e-8,'maximum riser .17m');last=height;}
for(let out=0;out<=5.7;out+=.025){const height=ground(out);assert(height<=last+1e-8,'descent never jumps upward');last=height;}
assert(source.includes('gymGround(x,z),hughesGround(x,z)'),'camera and characters use Hughes stair height');
console.log('PASS: Hughes landing, six-tread ascent/descent, stair footprint and maximum riser');
