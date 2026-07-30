"use strict";

const LESSONS = [
  { id:"a-short", name:"สระอะ", vowel:"ะ", display:"ะ", icon:"🥚", color:"#f57c00", bg:"#fff2db", border:"#ffd39c", dark:"#b55300", items:[["ก","กะ"],["จ","จะ"],["ด","ดะ"],["ต","ตะ"],["บ","บะ"],["ป","ปะ"],["อ","อะ"]] },
  { id:"a-long", name:"สระอา", vowel:"า", display:"า", icon:"🌋", color:"#e05b36", bg:"#ffe8df", border:"#ffc1ad", dark:"#a83a20", items:[["ก","กา"],["จ","จา"],["ด","ดา"],["ต","ตา"],["บ","บา"],["ป","ปา"],["อ","อา"]] },
  { id:"i-short", name:"สระอิ", vowel:"ิ", display:"◌ิ", icon:"🌿", color:"#15966a", bg:"#e2f9ed", border:"#afe3ca", dark:"#08714d", items:[["ก","กิ"],["จ","จิ"],["ด","ดิ"],["ต","ติ"],["บ","บิ"],["ป","ปิ"],["อ","อิ"]] },
  { id:"i-long", name:"สระอี", vowel:"ี", display:"◌ี", icon:"🦕", color:"#1685c3", bg:"#e1f4ff", border:"#addfff", dark:"#086395", items:[["ก","กี"],["จ","จี"],["ด","ดี"],["ต","ตี"],["บ","บี"],["ป","ปี"],["อ","อี"]] },
  { id:"ue-short", name:"สระอึ", vowel:"ึ", display:"◌ึ", icon:"🌴", color:"#778f23", bg:"#f2f8d8", border:"#d5e597", dark:"#5d7017", items:[["ก","กึ"],["ห","หึ"],["ถ","ถึ"],["ท","ทึ"],["ผ","ผึ"],["ส","สึ"],["อ","อึ"]] },
  { id:"ue-long", name:"สระอือ", vowel:"ือ", display:"◌ือ", icon:"🦖", color:"#7966c5", bg:"#eeeaff", border:"#cfc4ff", dark:"#5844ad", note:"พยางค์เปิดมีตัว อ ต่อท้าย", items:[["ม","มือ"],["ถ","ถือ"],["ค","คือ"],["ล","ลือ"],["ส","สือ"],["ก","กือ"],["ง","งือ"]] },
  { id:"u-short", name:"สระอุ", vowel:"ุ", display:"◌ุ", icon:"🐾", color:"#db6b16", bg:"#fff0df", border:"#ffd0a6", dark:"#a94b06", items:[["อ","อุ"],["ด","ดุ"],["จ","จุ"],["ล","ลุ"],["ห","หุ"],["บ","บุ"],["ป","ปุ"],["ส","สุ"]] },
  { id:"u-long", name:"สระอู", vowel:"ู", display:"◌ู", icon:"⭐", color:"#d29b00", bg:"#fff8d7", border:"#ffe487", dark:"#967000", items:[["ง","งู"],["ห","หู"],["ด","ดู"],["ต","ตู"],["ถ","ถู"],["ป","ปู"],["อ","อู"]] }
];

const $ = s => document.querySelector(s);
const screens = {home:$("#homeScreen"), play:$("#playScreen"), result:$("#resultScreen")};
const saved = JSON.parse(localStorage.getItem("dinoWordProgress") || "{}");
let progress = saved.progress || {};
let soundOn = saved.soundOn !== false;
let currentLesson = null, questions = [], index = 0, correct = 0, solved = false;
let strokes = [], activeStroke = null, ctx = null, dpr = 1;

function persist(){ localStorage.setItem("dinoWordProgress", JSON.stringify({progress,soundOn})); }
function shuffle(items){ const a=[...items]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
function showScreen(name){ Object.values(screens).forEach(s=>s.classList.remove("active")); screens[name].classList.add("active"); window.scrollTo({top:0,behavior:"smooth"}); }
function totalStars(){ return Object.values(progress).reduce((n,x)=>n+(x.stars||0),0); }

function renderMap(){
  $("#totalStars").textContent=totalStars();
  $("#levelGrid").innerHTML=LESSONS.map((l,i)=>{
    const p=progress[l.id]||{done:0,stars:0}; const pct=Math.round((p.done/l.items.length)*100);
    return `<button class="level-card" data-level="${i}" style="--card-color:${l.color};--card-bg:${l.bg};--card-border:${l.border};--card-dark:${l.dark}" aria-label="ด่าน ${l.name} ทำแล้ว ${p.done} จาก ${l.items.length} ข้อ ได้ ${p.stars} ดาว">
      <span class="stage">ด่าน ${i+1}</span><span class="card-egg">${l.icon}</span><span class="vowel">${l.display}</span><h3>ด่าน${l.name}</h3>
      <div class="card-progress"><span style="width:${pct}%"></span></div><div class="card-footer"><span>${p.done}/${l.items.length} คำ</span><span class="card-stars">${"⭐".repeat(p.stars)}${"☆".repeat(3-p.stars)}</span></div>
    </button>`;
  }).join("");
  document.querySelectorAll(".level-card").forEach(b=>b.addEventListener("click",()=>startLesson(+b.dataset.level)));
}

function startLesson(i){
  currentLesson=LESSONS[i]; questions=shuffle(currentLesson.items); index=0; correct=0; solved=false;
  $("#lessonTitle").textContent=`ด่าน${currentLesson.name}`; $("#lessonIcon").textContent=currentLesson.icon;
  $("#currentStars").textContent=(progress[currentLesson.id]||{}).stars||0; showScreen("play"); renderQuestion();
  if(soundOn) speak(`เริ่มด่าน${currentLesson.name}`);
}
function renderQuestion(){
  solved=false; const [consonant]=questions[index]; const total=questions.length; const pct=Math.round((index/total)*100);
  $("#questionCount").textContent=`ข้อ ${index+1} จาก ${total}`; $("#progressPercent").textContent=`${pct}%`; $("#progressBar").style.width=`${pct}%`;
  $(".progress-track").setAttribute("aria-valuenow",pct);
  const html=`<span>${consonant}</span><b>+</b><span>${currentLesson.vowel}</span><b>=</b><span class="blank">____</span>`;
  $("#equation").innerHTML=html; $("#dialogEquation").textContent=`${consonant} + ${currentLesson.vowel} = ____`;
  setFeedback("",""); $("#dialogFeedback").className="dialog-feedback"; $("#dialogFeedback").textContent="";
  $("#nextButton").disabled=true; $("#laterButton").disabled=false; clearDrawing();
}
function current(){ return {consonant:questions[index][0],answer:questions[index][1]}; }
function finishWriting(){
  if(!strokes.length){
    $("#dialogFeedback").className="dialog-feedback try";
    $("#dialogFeedback").textContent="ลองเขียนคำตอบลงในกรอบก่อนนะ ✏️";
    return;
  }
  if(!solved){ correct++; solved=true; }
  const message=`เก่งมาก! คำนี้อ่านว่า “${current().answer}” 🎉`;
  setFeedback("good",message); $("#dialogFeedback").className="dialog-feedback good"; $("#dialogFeedback").textContent=message;
  $("#nextButton").disabled=false; $("#laterButton").disabled=true;
  celebrate(); if(soundOn) speak(`เก่งมาก คำนี้อ่านว่า ${current().answer}`);
  setTimeout(()=>$("#drawDialog").open&&$("#drawDialog").close(),1100);
}
function setFeedback(type,text){ $("#feedback").className=`feedback ${type}`; $("#feedback").textContent=text; }
function nextQuestion(){
  if(!solved)return;
  index++;
  if(index>=questions.length){ finishLesson(); } else { renderQuestion(); $("#openDraw").focus(); }
}
function doLater(){
  if(questions.length-index<=1){ setFeedback("try","ข้อนี้เป็นข้อสุดท้ายแล้ว ลองตอบดูนะ! 🌟"); return; }
  const postponed=questions.splice(index,1)[0]; questions.push(postponed); setFeedback("",""); renderQuestion();
}
function finishLesson(){
  const ratio=correct/questions.length; const stars=ratio===1?3:ratio>=.7?2:1;
  const old=progress[currentLesson.id]||{done:0,stars:0};
  progress[currentLesson.id]={done:questions.length,stars:Math.max(old.stars,stars),best:Math.max(old.best||0,correct)}; persist(); renderMap();
  $("#resultSubtitle").textContent=`ฝึกครบทุกคำในด่าน${currentLesson.name}แล้ว`;
  $("#correctScore").textContent=`${correct} / ${questions.length}`; $("#earnedStars").textContent=`${stars} ดาว`;
  $("#resultStars").textContent="⭐".repeat(stars)+"☆".repeat(3-stars); showScreen("result"); celebrate(30);
  if(soundOn) speak(`ผ่านด่านแล้ว ได้ ${stars} ดาว`);
}

function speak(text){
  if(!soundOn||!("speechSynthesis" in window))return;
  speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang="th-TH"; u.rate=.75; u.pitch=1.15; speechSynthesis.speak(u);
}
function tone(ok=true){
  if(!soundOn)return;
  try{const ac=new (window.AudioContext||window.webkitAudioContext)(); const osc=ac.createOscillator(),gain=ac.createGain(); osc.connect(gain);gain.connect(ac.destination);osc.frequency.value=ok?660:260;gain.gain.setValueAtTime(.08,ac.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.18);osc.start();osc.stop(ac.currentTime+.18);}catch(e){}
}
function celebrate(n=16){
  const box=$("#celebration"); box.innerHTML="";
  for(let i=0;i<n;i++){const s=document.createElement("span");s.className="spark";s.textContent=["⭐","🌟","🟡","🟢","🟠"][i%5];s.style.left=Math.random()*100+"%";s.style.animationDelay=Math.random()*.35+"s";box.append(s);}
  setTimeout(()=>box.innerHTML="",1800); tone(true);
}

function openDrawing(){
  $("#drawDialog").showModal();
  requestAnimationFrame(()=>{ resizeCanvas(); $("#drawCanvas").focus(); });
}
function resizeCanvas(){
  const canvas=$("#drawCanvas"), rect=canvas.getBoundingClientRect(); dpr=Math.max(1,window.devicePixelRatio||1);
  canvas.width=Math.round(rect.width*dpr); canvas.height=Math.round(rect.height*dpr); ctx=canvas.getContext("2d");
  ctx.scale(dpr,dpr); ctx.lineCap="round"; ctx.lineJoin="round"; redraw();
}
function point(e){const r=$("#drawCanvas").getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top,p:e.pointerType==="pen"?Math.max(.45,e.pressure):1};}
function startStroke(e){e.preventDefault();$("#drawCanvas").setPointerCapture(e.pointerId);activeStroke=[point(e)];strokes.push(activeStroke);$("#canvasPlaceholder").classList.add("hidden");}
function moveStroke(e){if(!activeStroke)return;e.preventDefault();const p=point(e),prev=activeStroke.at(-1);activeStroke.push(p);ctx.strokeStyle="#173d33";ctx.lineWidth=8*((p.p+prev.p)/2);ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.lineTo(p.x,p.y);ctx.stroke();}
function endStroke(e){if(!activeStroke)return;e.preventDefault();activeStroke=null;}
function redraw(){if(!ctx)return;const c=$("#drawCanvas");ctx.clearRect(0,0,c.width/dpr,c.height/dpr);ctx.strokeStyle="#173d33";ctx.lineCap="round";ctx.lineJoin="round";strokes.forEach(stroke=>{if(stroke.length<2)return;ctx.beginPath();ctx.moveTo(stroke[0].x,stroke[0].y);for(let i=1;i<stroke.length;i++){ctx.lineWidth=8*stroke[i].p;ctx.lineTo(stroke[i].x,stroke[i].y);}ctx.stroke();});$("#canvasPlaceholder").classList.toggle("hidden",strokes.length>0);}
function clearDrawing(){strokes=[];activeStroke=null;if(ctx)redraw();}

$("#startButton").addEventListener("click",()=>{ $("#levelMap").scrollIntoView({behavior:"smooth"}); if(soundOn)speak("เลือกด่านที่อยากฝึก"); });
$("#homeButton").addEventListener("click",()=>{renderMap();showScreen("home")});
$("#backToMap").addEventListener("click",()=>{renderMap();showScreen("home");setTimeout(()=>$("#levelMap").scrollIntoView(),50)});
$("#chooseLevelButton").addEventListener("click",()=>{$("#backToMap").click()});
$("#replayButton").addEventListener("click",()=>startLesson(LESSONS.indexOf(currentLesson)));
$("#openDraw").addEventListener("click",openDrawing); $("#questionCard").addEventListener("click",e=>{if(!e.target.closest("button"))openDrawing()});
$("#questionCard").addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&!e.target.closest("button")){e.preventDefault();openDrawing()}});
$("#closeDraw").addEventListener("click",()=>$("#drawDialog").close());
$("#finishWriting").addEventListener("click",finishWriting);
$("#nextButton").addEventListener("click",nextQuestion); $("#laterButton").addEventListener("click",doLater);
$("#speakQuestion").addEventListener("click",e=>{e.stopPropagation();speak(`${current().consonant} บวก ${currentLesson.name} ได้คำว่าอะไร`)});
$("#soundButton").addEventListener("click",()=>{soundOn=!soundOn;$("#soundButton").setAttribute("aria-pressed",soundOn);$("#soundButton").firstElementChild.textContent=soundOn?"🔊":"🔇";$("#soundButton").lastElementChild.textContent=soundOn?"เปิดเสียงอยู่":"ปิดเสียงอยู่";persist();if(soundOn)speak("เปิดเสียงแล้ว")});
$("#resetButton").addEventListener("click",()=>$("#resetDialog").showModal()); $("#cancelReset").addEventListener("click",()=>$("#resetDialog").close());
$("#confirmReset").addEventListener("click",()=>{progress={};persist();renderMap();$("#resetDialog").close();showScreen("home")});
$("#undoStroke").addEventListener("click",()=>{strokes.pop();redraw()}); $("#clearCanvas").addEventListener("click",clearDrawing);
const canvas=$("#drawCanvas"); canvas.addEventListener("pointerdown",startStroke);canvas.addEventListener("pointermove",moveStroke);canvas.addEventListener("pointerup",endStroke);canvas.addEventListener("pointercancel",endStroke);
window.addEventListener("resize",()=>{$("#drawDialog").open&&resizeCanvas()});
document.addEventListener("contextmenu",e=>{if(!e.target.closest("input"))e.preventDefault()});
document.addEventListener("dragstart",e=>{if(!e.target.closest("input"))e.preventDefault()});
document.addEventListener("selectstart",e=>{if(!e.target.closest("input"))e.preventDefault()});

$("#soundButton").firstElementChild.textContent=soundOn?"🔊":"🔇"; renderMap();
