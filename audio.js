'use strict';
// An original eight-bar instrumental and vehicle effects. All sound is synthesized locally.
(() => {
 const stepSeconds=60/104/4;
 const progression=[
  [45,57,60,64,67],[45,57,60,64,71],[41,53,57,60,64],[41,53,57,60,67],
  [38,50,53,57,60],[38,50,53,57,64],[40,52,55,59,62],[40,52,56,59,62]
 ];
 const melody=[72,74,76,79,76,74,71,74,72,69,67,69,71,74,76,74];
 let context,radioBus,effectsBus,noise,engine,engineFilter,engineGain;
 let radio=true,effects=true,step=0,nextStep=null,lastBrake=false;
 try{radio=localStorage.getItem('roseHillRadio')!=='off';}catch{}
 const hz=midi=>440*2**((midi-69)/12);

 function unlock(){
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)return;
  if(!context){
   context=new Audio();
   radioBus=context.createGain();effectsBus=context.createGain();
   radioBus.gain.value=0;effectsBus.gain.value=effects?.9:0;
   radioBus.connect(context.destination);effectsBus.connect(context.destination);
   noise=context.createBuffer(1,Math.ceil(context.sampleRate*.25),context.sampleRate);
   const samples=noise.getChannelData(0);
   let seed=281;
   for(let i=0;i<samples.length;i++){seed=seed*16807%2147483647;samples[i]=seed/1073741823.5-1;}
   engine=context.createOscillator();engine.type='sawtooth';
   engineFilter=context.createBiquadFilter();engineFilter.type='lowpass';engineFilter.frequency.value=260;
   engineGain=context.createGain();engineGain.gain.value=0;
   engine.connect(engineFilter);engineFilter.connect(engineGain);engineGain.connect(effectsBus);engine.start();
  }
  if(context.state==='suspended')context.resume().catch(()=>{});
 }

 function tone(bus,type,frequency,time,length,volume,endFrequency=frequency){
  const oscillator=context.createOscillator(),gain=context.createGain();
  oscillator.type=type;
  oscillator.frequency.setValueAtTime(frequency,time);
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency,time+length);
  gain.gain.setValueAtTime(.0001,time);
  gain.gain.exponentialRampToValueAtTime(volume,time+Math.min(.025,length/4));
  gain.gain.exponentialRampToValueAtTime(.0001,time+length);
  oscillator.connect(gain);gain.connect(bus);oscillator.start(time);oscillator.stop(time+length+.02);
 }
 function percussion(bus,time,length,volume,frequency,type){
  const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
  source.buffer=noise;filter.type=type;filter.frequency.value=frequency;
  gain.gain.setValueAtTime(volume,time);
  gain.gain.exponentialRampToValueAtTime(.0001,time+length);
  source.connect(filter);filter.connect(gain);gain.connect(bus);
  source.start(time);source.stop(time+length);
 }
 function playStep(index,time){
  const beat=index%16,bar=Math.floor(index/16)%8,chord=progression[bar];
  if([0,6,10].includes(beat))tone(radioBus,'sine',132,time,.15,.2,42);
  if(beat===4||beat===12){
   percussion(radioBus,time,.135,.079,1470,'bandpass');
   tone(radioBus,'triangle',154,time,.057,.028,98);
  }
  if(beat%2===0||beat===7||beat===15)percussion(radioBus,time,beat===14?.093:.038,beat%4===0?.025:.015,6800,'highpass');
  if([0,3,8,11,14].includes(beat)){
   const note=chord[0]-12+(beat===11?7:beat===14?12:0);
   tone(radioBus,'triangle',hz(note),time,beat===0?.32:.19,.083);
  }
  if(beat===0||beat===8){
   for(const note of chord.slice(1))tone(radioBus,'sine',hz(note),time,.76,.032);
  }
  if(beat===2||beat===7||beat===13){
   const lead=melody[(bar*2+(beat===13?1:0))%melody.length];
   tone(radioBus,'triangle',hz(lead),time,.23,.025);
   tone(radioBus,'sine',hz(lead),time+.12,.16,.008);
  }
 }
 function update(running,driving,speed,throttle,brake){
  if(!context||context.state!=='running')return;
  const now=context.currentTime,radioPlaying=running&&!document.hidden&&radio;
  radioBus.gain.setTargetAtTime(radioPlaying?.64:0,now,.055);
  if(radioPlaying){
   if(nextStep===null||nextStep<now-.16)nextStep=now+.032;
   while(nextStep<now+.13){
    playStep(step,nextStep+(step%2===1?.012:0));
    nextStep+=stepSeconds;step=(step+1)%128;
   }
  }else nextStep=null;
  const motor=running&&!document.hidden&&driving&&effects;
  engine.frequency.setTargetAtTime(31+speed*18+(throttle?17:0),now,.095);
  engineFilter.frequency.setTargetAtTime(165+speed*103,now,.1);
  engineGain.gain.setTargetAtTime(motor?(throttle?.047:.02):0,now,.07);
  if(motor&&brake&&!lastBrake&&speed>1.1)percussion(effectsBus,now,.21,.046,890,'bandpass');
  lastBrake=motor&&brake;
 }
 function cue(notes,length){
  if(!effects)return;
  unlock();
  if(!context||context.state!=='running')return;
  notes.forEach((note,i)=>tone(effectsBus,'sine',note,context.currentTime+.008+i*length,length,.037));
 }
 function silence(){
  if(!context)return;
  const now=context.currentTime;
  radioBus.gain.setTargetAtTime(0,now,.03);engineGain.gain.setTargetAtTime(0,now,.03);
  nextStep=null;
 }
 window.addEventListener('blur',silence);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)silence();});
 window.campusAudio={unlock,update,cue,toggleRadio(){
  radio=!radio;if(radio)unlock();
  try{localStorage.setItem('roseHillRadio',radio?'on':'off');}catch{}
  return radio;
 },setEffects(enabled){
  effects=enabled;
  if(context)effectsBus.gain.setTargetAtTime(enabled?.9:0,context.currentTime,.03);
 }};
})();
