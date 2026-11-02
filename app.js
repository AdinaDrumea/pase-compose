const VERBS = {"jouer": {"pp": "joué", "aux": "avoir"}, "décider": {"pp": "décidé", "aux": "avoir"}, "passer": {"pp": "passé", "aux": "avoir"}, "fabriquer": {"pp": "fabriqué", "aux": "avoir"}, "regarder": {"pp": "regardé", "aux": "avoir"}, "payer": {"pp": "payé", "aux": "avoir"}, "entrer": {"pp": "entré", "aux": "être"}, "courir": {"pp": "couru", "aux": "avoir"}, "prendre": {"pp": "pris", "aux": "avoir"}, "faire": {"pp": "fait", "aux": "avoir"}, "dire": {"pp": "dit", "aux": "avoir"}, "voir": {"pp": "vu", "aux": "avoir"}, "avoir": {"pp": "eu", "aux": "avoir"}, "mettre": {"pp": "mis", "aux": "avoir"}, "être": {"pp": "été", "aux": "avoir"}, "ouvrir": {"pp": "ouvert", "aux": "avoir"}, "remplir": {"pp": "rempli", "aux": "avoir"}, "aller": {"pp": "allé", "aux": "être"}, "rentrer": {"pp": "rentré", "aux": "être"}, "acheter": {"pp": "acheté", "aux": "avoir"}};
const ACCENTS = ["é","è","ê","ë","à","â","ç","î","ï","ô","ù","û","ü","œ"];
let soundOn = true;
let audioCtx = null;
let activeInput = null;

function showScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>showScreen(b.dataset.open)));
document.querySelectorAll(".home-btn").forEach(b=>b.addEventListener("click",()=>showScreen("home")));

document.getElementById("soundToggle").addEventListener("click",()=>{
  soundOn=!soundOn;
  document.getElementById("soundToggle").textContent=soundOn?"🔊 Töne an":"🔇 Töne aus";
});

function tone(freq=660,duration=.11,delay=0,vol=.045){
  if(!soundOn) return;
  try{
    audioCtx = audioCtx || new (window.AudioContext||window.webkitAudioContext)();
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type="sine"; o.frequency.value=freq;
    g.gain.setValueAtTime(0,audioCtx.currentTime+delay);
    g.gain.linearRampToValueAtTime(vol,audioCtx.currentTime+delay+.01);
    g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+delay+duration);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(audioCtx.currentTime+delay); o.stop(audioCtx.currentTime+delay+duration+.03);
  }catch(e){}
}
function soundGood(){ tone(620,.11); tone(830,.13,.10,.035); }
function soundWarn(){ tone(520,.12,0,.035); }
function soundBad(){ tone(260,.13,0,.03); tone(220,.12,.10,.025); }

function norm(s){
  return (s||"").trim().toLowerCase().replace(/[’`´]/g,"'").replace(/\s+/g," ");
}
function stripAccents(s){
  return norm(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}
function evaluate(got, akzeptiert){
  const g=norm(got);
  const acc=akzeptiert.map(norm);
  if(acc.includes(g)) return {kind:"good", exact:true, correct:akzeptiert[0]};
  const ga=stripAccents(g);
  const accentMatch=akzeptiert.find(a=>stripAccents(a)===ga);
  if(accentMatch) return {kind:"warn", exact:false, correct:accentMatch};
  return {kind:"bad", exact:false, correct:akzeptiert[0]};
}
function setInputStatus(input,res){
  input.classList.remove("status-good","status-warn","status-bad");
  input.classList.add(res.kind==="good"?"status-good":res.kind==="warn"?"status-warn":"status-bad");
}
function feedbackText(res){
  if(res.kind==="good") return "Richtig.";
  if(res.kind==="warn") return `Akzeptiert – die Akzente gehören zur korrekten Schreibweise. Richtig ist: ${res.correct}`;
  return `Noch nicht ganz. Richtig ist: ${res.correct}`;
}
function activateInput(input){ activeInput=input; }
document.addEventListener("focusin",e=>{ if(e.target.matches("input[type=text]")) activateInput(e.target); });

function accentPalette(container){
  const wrap=document.createElement("div"); wrap.className="accent-tools";
  wrap.innerHTML='<div class="accent-label">Französische Sonderzeichen</div>';
  const row=document.createElement("div"); row.className="accent-row";
  ACCENTS.forEach(ch=>{
    const b=document.createElement("button"); b.type="button"; b.className="accent-btn"; b.textContent=ch;
    b.addEventListener("click",()=>{
      if(!activeInput) return;
      const s=activeInput.selectionStart??activeInput.value.length, e=activeInput.selectionEnd??s;
      activeInput.value=activeInput.value.slice(0,s)+ch+activeInput.value.slice(e);
      activeInput.focus(); activeInput.setSelectionRange(s+ch.length,s+ch.length);
    });
    row.appendChild(b);
  });
  wrap.appendChild(row); container.appendChild(wrap);
}

function makeFeedback(){
  const f=document.createElement("div"); f.className="feedback"; return f;
}

// EXERCISE 1
const auxRows = [
  ["avoir","j’","ai"],["avoir","tu","as"],["avoir","il / elle / on","a"],["avoir","nous","avons"],["avoir","vous","avez"],["avoir","ils / elles","ont"],
  ["être","je","suis"],["être","tu","es"],["être","il / elle / on","est"],["être","nous","sommes"],["être","vous","êtes"],["être","ils / elles","sont"]
];
function renderAux(){
  const grid=document.getElementById("auxGrid"); grid.innerHTML="";
  ["avoir","être"].forEach(aux=>{
    const box=document.createElement("div");
    box.innerHTML=`<h3 style="margin-top:0">${aux}</h3>`;
    auxRows.filter(r=>r[0]===aux).forEach(([_,pro,ans])=>{
      const row=document.createElement("div"); row.className="conj-row";
      row.innerHTML=`<label>${pro}</label><input type="text" data-answer="${ans}"><div class="row-note"></div>`;
      box.appendChild(row);
    });
    grid.appendChild(box);
  });
  document.getElementById("auxAccents").innerHTML=""; accentPalette(document.getElementById("auxAccents"));
}
document.getElementById("checkAux").addEventListener("click",()=>{
  let allGood=true, anyWarn=false;
  document.querySelectorAll("#auxGrid .conj-row").forEach(row=>{
    const input=row.querySelector("input"), note=row.querySelector(".row-note");
    const res=evaluate(input.value,[input.dataset.answer]);
    setInputStatus(input,res); note.className=`row-note ${res.kind}`; note.textContent=feedbackText(res);
    if(res.kind==="bad") allGood=false; if(res.kind==="warn") anyWarn=true;
  });
  if(allGood&&!anyWarn) soundGood(); else if(allGood) soundWarn(); else soundBad();
});
document.getElementById("resetAux").addEventListener("click",()=>renderAux());

// GENERIC ONE-BY-ONE ENGINE
function oneByOne(id, questions, renderer){
  const state={base:questions.slice(), queue:questions.slice(), index:0, falsch:[], right:0, warn:0, review:false};
  const body=document.getElementById(id+"Body"), prog=document.getElementById(id+"Progress");

  function next(){
    state.index++;
    if(state.index>=state.queue.length) finish(); else draw();
  }
  function draw(){
    const q=state.queue[state.index];
    prog.style.width=((state.index)/state.queue.length*100)+"%";
    body.innerHTML="";
    renderer(body,q,state,{
      submit:(result)=>{
        if(result.kind==="bad") state.falsch.push(q);
        else {state.right++; if(result.kind==="warn") state.warn++;}
      },
      next
    });
  }
  function finish(){
    prog.style.width="100%"; body.innerHTML="";
    const box=document.createElement("div"); box.className="result-box question-card";
    const attempted=state.queue.length, falsch=state.falsch.length;
    box.innerHTML=`<div class="score-pill">${state.right} akzeptiert · ${falsch} falsch${state.warn?` · ${state.warn} Hinweis zu Akzenten${state.warn>1?"s":""}`:""}</div>
      <h3 style="margin-top:14px">${falsch===0?"Sehr gut!":"Übung beendet"}</h3>
      <p>${falsch===0?"Du hast diese Übung ohne Fehler abgeschlossen.":"Du kannst jetzt nur die Aufgaben wiederholen, die noch nicht richtig waren."}</p>`;
    const acts=document.createElement("div"); acts.className="actions center-actions";
    if(falsch){
      const b=document.createElement("button"); b.className="primary-btn"; b.textContent="Nur meine Fehler wiederholen";
      b.addEventListener("click",()=>{
        state.queue=state.falsch.slice(); state.falsch=[]; state.index=0; state.right=0; state.warn=0; state.review=true; draw();
      }); acts.appendChild(b);
    }
    const again=document.createElement("button"); again.className="soft-btn"; again.textContent="Ganze Übung wiederholen";
    again.addEventListener("click",()=>{state.queue=state.base.slice();state.falsch=[];state.index=0;state.right=0;state.warn=0;state.review=false;draw();});
    acts.appendChild(again);
    const home=document.createElement("button"); home.className="ghost-btn"; home.textContent="Zurück zum Start";
    home.addEventListener("click",()=>showScreen("home")); acts.appendChild(home);
    box.appendChild(acts); body.appendChild(box);
  }
  draw();
  return state;
}

function inputQuestionRenderer(body,q,state,api){
  const card=document.createElement("div"); card.className="question-card";
  card.innerHTML=`<div class="question-kicker">Aufgabe ${state.index+1} von ${state.queue.length}</div>
    <div class="question-text">${q.prompt}</div>`;
  const input=document.createElement("input"); input.type="text"; input.autocomplete="off"; input.spellcheck=false;
  input.placeholder="Antwort eingeben";
  card.appendChild(input); activateInput(input);
  accentPalette(card);
  const fb=makeFeedback(); card.appendChild(fb);
  const actions=document.createElement("div"); actions.className="actions";
  const check=document.createElement("button"); check.className="primary-btn"; check.textContent="Kontrollieren answer";
  const next=document.createElement("button"); next.className="soft-btn hidden"; next.textContent="Nächste Aufgabe →";
  actions.append(check,next); card.appendChild(actions); body.appendChild(card);
  input.focus();
  check.addEventListener("click",()=>{
    const res=evaluate(input.value,q.answers);
    setInputStatus(input,res); fb.textContent=feedbackText(res); fb.className=`feedback show ${res.kind}`;
    if(res.kind==="good") soundGood(); else if(res.kind==="warn") soundWarn(); else soundBad();
    api.submit(res); check.classList.add("hidden"); next.classList.remove("hidden"); input.disabled=true;
  });
  input.addEventListener("keydown",e=>{ if(e.key==="Enter"&&!check.classList.contains("hidden")) check.click(); });
  next.addEventListener("click",api.next);
}

// EXERCISE 2
const ppQs = [
  ["décider","décidé"],["passer","passé"],["fabriquer","fabriqué"],["regarder","regardé"],
  ["payer","payé"],["entrer","entré"],["courir","couru"],["prendre","pris"],["faire","fait"],
  ["dire","dit"],["voir","vu"],["avoir","eu"],["mettre","mis"],["être","été"],["ouvrir","ouvert"],["remplir","rempli"]
].map(([v,a])=>({prompt:`Wie lautet das participe passé von <strong>${v}</strong>?`,answers:[a]}));
oneByOne("ex2",ppQs,inputQuestionRenderer);

// EXERCISE 3
const pronouns=[["je","je / j’"],["tu","tu"],["il","il"],["elle","elle"],["nous","nous"],["vous","vous"],["ils","ils"],["elles","elles"]];
const avoirForms={je:"ai",tu:"as",il:"a",elle:"a",nous:"avons",vous:"avez",ils:"ont",elles:"ont"};
const etreForms={je:"suis",tu:"es",il:"est",elle:"est",nous:"sommes",vous:"êtes",ils:"sont",elles:"sont"};
const conjVerbs=["jouer","décider","passer","fabriquer","regarder","payer","entrer","courir","prendre","faire","dire","voir","avoir","mettre","être","ouvrir","remplir","acheter"];
let verbIndex=0;
const vs=document.getElementById("verbSelect");
conjVerbs.forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=v;vs.appendChild(o)});

function conjAnswers(v,p){
  const d=VERBS[v], aux=d.aux==="être"?etreForms[p]:avoirForms[p], pp=d.pp;
  if(d.aux!=="être") return [aux+" "+pp];
  if(p==="je"||p==="tu") return [aux+" "+pp,aux+" "+pp+"e"];
  if(p==="il") return [aux+" "+pp];
  if(p==="elle") return [aux+" "+pp+"e"];
  if(p==="nous"||p==="vous") return [aux+" "+pp+"s",aux+" "+pp+"es"];
  if(p==="ils") return [aux+" "+pp+"s"];
  if(p==="elles") return [aux+" "+pp+"es"];
  return [aux+" "+pp];
}
function renderVerb(){
  const v=conjVerbs[verbIndex]; vs.value=v;
  const grid=document.getElementById("verbConjGrid"); grid.innerHTML="";
  pronouns.forEach(([p,label])=>{
    const row=document.createElement("div"); row.className="conj-row";
    row.innerHTML=`<label>${label}</label><input type="text" data-pronoun="${p}" autocomplete="off" spellcheck="false"><div class="row-note"></div>`;
    grid.appendChild(row);
  });
  document.getElementById("verbAccents").innerHTML=""; accentPalette(document.getElementById("verbAccents"));
}
vs.addEventListener("change",()=>{verbIndex=conjVerbs.indexOf(vs.value);renderVerb()});
document.getElementById("prevVerb").addEventListener("click",()=>{verbIndex=(verbIndex-1+conjVerbs.length)%conjVerbs.length;renderVerb()});
document.getElementById("nextVerb").addEventListener("click",()=>{verbIndex=(verbIndex+1)%conjVerbs.length;renderVerb()});
document.getElementById("resetVerb").addEventListener("click",renderVerb);
document.getElementById("checkVerb").addEventListener("click",()=>{
  const v=conjVerbs[verbIndex]; let bad=false,warn=false;
  document.querySelectorAll("#verbConjGrid .conj-row").forEach(row=>{
    const input=row.querySelector("input"),note=row.querySelector(".row-note");
    const res=evaluate(input.value,conjAnswers(v,input.dataset.pronoun));
    setInputStatus(input,res); note.className=`row-note ${res.kind}`; note.textContent=feedbackText(res);
    if(res.kind==="bad") bad=true;if(res.kind==="warn") warn=true;
  });
  if(bad) soundBad(); else if(warn) soundWarn(); else soundGood();
});

// EXERCISE 4 — book-based sentences
const ex4Qs=[
 {prompt:`J’ □ de monter ma propre maison hantée. <span class="mini">(décider)</span>`,answers:["ai décidé"]},
 {prompt:`Nous □ la majeure partie de la journée à dresser un plan. <span class="mini">(passer)</span>`,answers:["avons passé"]},
 {prompt:`Pour faire connaître notre projet, on □ du papier. <span class="mini">(prendre)</span>`,answers:["a pris"]},
 {prompt:`On □ des pubs. <span class="mini">(fabriquer)</span>`,answers:["a fabriqué"]},
 {prompt:`À 15 heures, on □ dehors pour voir s’il y avait des clients. <span class="mini">(regarder)</span>`,answers:["a regardé"]},
 {prompt:`Denis Snella □ deux dollars. <span class="mini">(payer)</span>`,answers:["a payé"]},
 {prompt:`Denis Snella □ dans la maison. <span class="mini">(entrer)</span>`,answers:["est entré"]},
 {prompt:`Robert et moi, on □ se mettre en place. <span class="mini">(courir)</span>`,answers:["a couru"]},
 {prompt:`J’ □ mes devoirs. <span class="mini">(faire)</span>`,answers:["ai fait"]},
 {prompt:`Il □ : « L’entrée coûte 2 francs. » <span class="mini">(dire)</span>`,answers:["a dit"]},
 {prompt:`À Saignelégier, le public □ beaucoup de chevaux. <span class="mini">(voir)</span>`,answers:["a vu"]},
 {prompt:`J’ □ une idée. <span class="mini">(avoir)</span>`,answers:["ai eu"]},
 {prompt:`J’ □ le ballon sur la table. <span class="mini">(mettre)</span>`,answers:["ai mis"]},
 {prompt:`Il □ à Paris. <span class="mini">(être)</span>`,answers:["a été"]}
];
oneByOne("ex4",ex4Qs,inputQuestionRenderer);

// EXERCISE 5 — alle Verben gleichzeitig zuordnen
const allMatchVerbs=[
  "jouer","entrer","regarder","aller","faire","prendre","rentrer",
  "dire","voir","mettre","fabriquer","payer","courir","être"
];
let allMatchAssignments={};
let selectedMatchVerb=null;

function renderAllMatching(){
  const bank=document.getElementById("allVerbBank");
  const a=document.getElementById("allPlacedAvoir");
  const e=document.getElementById("allPlacedEtre");
  bank.innerHTML=""; a.innerHTML=""; e.innerHTML="";
  selectedMatchVerb=null;

  allMatchVerbs.forEach(v=>{
    const assigned=allMatchAssignments[v];
    if(!assigned){
      const card=document.createElement("div");
      card.className="all-verb-card";
      card.textContent=v;
      card.draggable=true;
      card.dataset.verb=v;
      card.addEventListener("dragstart",ev=>ev.dataTransfer.setData("text/plain",v));
      card.addEventListener("click",()=>{
        document.querySelectorAll(".all-verb-card").forEach(x=>x.classList.remove("selected"));
        selectedMatchVerb=v;
        card.classList.add("selected");
      });
      bank.appendChild(card);
    }else{
      const chip=document.createElement("div");
      chip.className="drop-chip";
      chip.textContent=v;
      chip.dataset.verb=v;
      chip.addEventListener("click",()=>{
        allMatchAssignments[v]=null;
        renderAllMatching();
      });
      (assigned==="avoir"?a:e).appendChild(chip);
    }
  });
}

function assignMatchVerb(v,aux){
  if(!v) return;
  allMatchAssignments[v]=aux;
  selectedMatchVerb=null;
  renderAllMatching();
}

document.querySelectorAll(".all-dropzone").forEach(zone=>{
  zone.addEventListener("dragover",ev=>{ev.preventDefault();zone.classList.add("over")});
  zone.addEventListener("dragleave",()=>zone.classList.remove("over"));
  zone.addEventListener("drop",ev=>{
    ev.preventDefault(); zone.classList.remove("over");
    assignMatchVerb(ev.dataTransfer.getData("text/plain"),zone.dataset.aux);
  });
  zone.addEventListener("click",()=>assignMatchVerb(selectedMatchVerb,zone.dataset.aux));
});

document.getElementById("checkAllMatch").addEventListener("click",()=>{
  const fb=document.getElementById("allMatchFeedback");
  const missing=allMatchVerbs.filter(v=>!allMatchAssignments[v]);
  if(missing.length){
    fb.textContent=`Ordne zuerst alle Verben zu. Es fehlen noch ${missing.length}.`;
    fb.className="feedback show warn";
    soundWarn();
    return;
  }
  let falsch=[];
  document.querySelectorAll(".drop-chip").forEach(chip=>{
    const v=chip.dataset.verb;
    const ok=allMatchAssignments[v]===VERBS[v].aux;
    chip.classList.remove("match-good","match-bad");
    chip.classList.add(ok?"match-good":"match-bad");
    if(!ok) falsch.push(v);
  });
  if(falsch.length===0){
    fb.textContent="Alles richtig!";
    fb.className="feedback show good";
    soundGood();
  }else{
    const corrections=falsch.map(v=>`${v} → ${VERBS[v].aux}`).join(" · ");
    fb.textContent=`Noch nicht ganz. Richtig wäre: ${corrections}`;
    fb.className="feedback show bad";
    soundBad();
  }
});

document.getElementById("resetAllMatch").addEventListener("click",()=>{
  allMatchAssignments={};
  const fb=document.getElementById("allMatchFeedback");
  fb.className="feedback"; fb.textContent="";
  renderAllMatching();
});

renderAllMatching();

// EXERCISE 6 — vom Präsens ins passé composé
const ex6Qs=[
 {prompt:`Setze den Satz ins passé composé:<br><strong>J’ai une idée.</strong>`,answers:["j’ai eu une idée.","j'ai eu une idée.","j’ai eu une idée","j'ai eu une idée"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Il prend du papier.</strong>`,answers:["il a pris du papier.","il a pris du papier"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>On fabrique des pubs.</strong>`,answers:["on a fabriqué des pubs.","on a fabriqué des pubs"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>On regarde dehors.</strong>`,answers:["on a regardé dehors.","on a regardé dehors"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Denis paie deux dollars.</strong>`,answers:["denis a payé deux dollars.","denis a payé deux dollars"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Denis entre dans la maison.</strong>`,answers:["denis est entré dans la maison.","denis est entré dans la maison"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Il dit bonjour.</strong>`,answers:["il a dit bonjour.","il a dit bonjour"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Le public voit beaucoup de chevaux.</strong>`,answers:["le public a vu beaucoup de chevaux.","le public a vu beaucoup de chevaux"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Je fais mes devoirs.</strong>`,answers:["j’ai fait mes devoirs.","j'ai fait mes devoirs.","j’ai fait mes devoirs","j'ai fait mes devoirs"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Je mets le ballon sur la table.</strong>`,answers:["j’ai mis le ballon sur la table.","j'ai mis le ballon sur la table.","j’ai mis le ballon sur la table","j'ai mis le ballon sur la table"]}
];
oneByOne("ex6",ex6Qs,inputQuestionRenderer);

renderAux();
renderVerb();
