const VERBS = {"jouer": {"pp": "joué", "aux": "avoir"}, "décider": {"pp": "décidé", "aux": "avoir"}, "passer": {"pp": "passé", "aux": "avoir"}, "fabriquer": {"pp": "fabriqué", "aux": "avoir"}, "regarder": {"pp": "regardé", "aux": "avoir"}, "payer": {"pp": "payé", "aux": "avoir"}, "entrer": {"pp": "entré", "aux": "être"}, "courir": {"pp": "couru", "aux": "avoir"}, "prendre": {"pp": "pris", "aux": "avoir"}, "faire": {"pp": "fait", "aux": "avoir"}, "dire": {"pp": "dit", "aux": "avoir"}, "voir": {"pp": "vu", "aux": "avoir"}, "avoir": {"pp": "eu", "aux": "avoir"}, "mettre": {"pp": "mis", "aux": "avoir"}, "être": {"pp": "été", "aux": "avoir"}, "ouvrir": {"pp": "ouvert", "aux": "avoir"}, "remplir": {"pp": "rempli", "aux": "avoir"}, "aller": {"pp": "allé", "aux": "être"}, "rentrer": {"pp": "rentré", "aux": "être"}, "acheter": {"pp": "acheté", "aux": "avoir"}};
const ACCENTS = ["'","é","è","ê","ë","à","â","ç","î","ï","ô","ù","û","ü","œ"];
let soundOn = true;
let audioCtx = null;
let activeInput = null;

const SCORE_STORAGE_KEY = "passe-compose-last-results-v2";
const OLD_SCORE_STORAGE_KEY = "passe-compose-last-results-v1";

function loadScores(){
  try{
    const current=localStorage.getItem(SCORE_STORAGE_KEY);
    if(current) return JSON.parse(current);
    const old=JSON.parse(localStorage.getItem(OLD_SCORE_STORAGE_KEY)||"{}");
    const migrated={};
    ["ex1","ex2","ex3"].forEach(id=>{if(old[id]) migrated[id]=old[id];});
    if(Object.keys(migrated).length) localStorage.setItem(SCORE_STORAGE_KEY,JSON.stringify(migrated));
    return migrated;
  }catch(e){return {};}
}
function saveScore(exerciseId,correct,total,label=""){
  const pct=total?Math.round(correct/total*100):0;
  const scores=loadScores();
  scores[exerciseId]={correct,total,pct,label};
  try{localStorage.setItem(SCORE_STORAGE_KEY,JSON.stringify(scores));}catch(e){}
  refreshScoreDisplays();
  return pct;
}
function lastScoreText(exerciseId){
  const r=loadScores()[exerciseId];
  if(!r) return "";
  return `Letztes Ergebnis: ${r.pct}% (${r.correct}/${r.total})${r.label?` · ${r.label}`:""}`;
}
function refreshScoreDisplays(){
  const scores=loadScores();
  document.querySelectorAll(".exercise-card[data-open]").forEach(card=>{
    const id=card.dataset.open, existing=card.querySelector(".last-score");
    if(existing) existing.remove();
    if(!scores[id]) return;
    const d=document.createElement("div");
    d.className="last-score";
    d.textContent=lastScoreText(id);
    card.appendChild(d);
  });
  ["ex1","ex2","ex3","ex4","ex5","ex6","ex7","ex8"].forEach(id=>{
    const section=document.getElementById(id); if(!section) return;
    const head=section.querySelector(".exercise-head > div"); if(!head) return;
    let d=head.querySelector(".last-score-inline");
    if(!scores[id]){ if(d) d.remove(); return; }
    if(!d){d=document.createElement("div");d.className="last-score-inline";head.appendChild(d);}
    d.textContent=lastScoreText(id);
  });
}
function showCurrentScore(exerciseId,correct,total,label=""){
  const pct=saveScore(exerciseId,correct,total,label);
  const section=document.getElementById(exerciseId);
  const panel=section?.querySelector(".panel");
  if(panel){
    let box=panel.querySelector(".current-score");
    if(!box){box=document.createElement("div");box.className="current-score";panel.appendChild(box);}
    box.innerHTML=`<span class="score-pill">${pct}% richtig · ${correct}/${total}</span>`;
  }
  return pct;
}
function clearCurrentScore(exerciseId){
  document.querySelector(`#${exerciseId} .current-score`)?.remove();
}

function showScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  refreshScoreDisplays();
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
  let allGood=true, anyWarn=false, correct=0, total=0;
  document.querySelectorAll("#auxGrid .conj-row").forEach(row=>{
    const input=row.querySelector("input"), note=row.querySelector(".row-note");
    const res=evaluate(input.value,[input.dataset.answer]);
    setInputStatus(input,res); note.className=`row-note ${res.kind}`; note.textContent=feedbackText(res);
    total++; if(res.kind!=="bad") correct++;
    if(res.kind==="bad") allGood=false; if(res.kind==="warn") anyWarn=true;
  });
  showCurrentScore("ex1",correct,total);
  if(allGood&&!anyWarn) soundGood(); else if(allGood) soundWarn(); else soundBad();
});
document.getElementById("resetAux").addEventListener("click",()=>{clearCurrentScore("ex1");renderAux();});

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
    const percent=attempted?Math.round(state.right/attempted*100):0;
    if(!state.review) saveScore(id,state.right,attempted);
    box.innerHTML=`<div class="score-pill">${percent}% richtig · ${state.right}/${attempted} akzeptiert · ${falsch} falsch${state.warn?` · ${state.warn} Hinweis zu Akzenten${state.warn>1?"s":""}`:""}</div>
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
  if(q.verb){
    const target=document.createElement("div");
    target.className="target-verb";
    target.innerHTML=`<span class="target-label">Verb</span><strong>${q.verb}</strong>`;
    card.appendChild(target);
  }
  const input=document.createElement("input"); input.type="text"; input.autocomplete="off"; input.spellcheck=false;
  input.placeholder="Antwort eingeben";
  card.appendChild(input); activateInput(input);
  accentPalette(card);
  const fb=makeFeedback(); card.appendChild(fb);
  const actions=document.createElement("div"); actions.className="actions";
  const check=document.createElement("button"); check.className="primary-btn"; check.textContent="Kontrollieren";
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
const conjVerbs=["jouer","décider","passer","fabriquer","regarder","payer","entrer","aller","rentrer","courir","prendre","faire","dire","voir","avoir","mettre","être","ouvrir","remplir","acheter"];
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
vs.addEventListener("change",()=>{verbIndex=conjVerbs.indexOf(vs.value);clearCurrentScore("ex3");renderVerb()});
document.getElementById("prevVerb").addEventListener("click",()=>{verbIndex=(verbIndex-1+conjVerbs.length)%conjVerbs.length;clearCurrentScore("ex3");renderVerb()});
document.getElementById("nextVerb").addEventListener("click",()=>{verbIndex=(verbIndex+1)%conjVerbs.length;clearCurrentScore("ex3");renderVerb()});
document.getElementById("resetVerb").addEventListener("click",()=>{clearCurrentScore("ex3");renderVerb();});
document.getElementById("checkVerb").addEventListener("click",()=>{
  const v=conjVerbs[verbIndex]; let bad=false,warn=false,correct=0,total=0;
  document.querySelectorAll("#verbConjGrid .conj-row").forEach(row=>{
    const input=row.querySelector("input"),note=row.querySelector(".row-note");
    const res=evaluate(input.value,conjAnswers(v,input.dataset.pronoun));
    setInputStatus(input,res); note.className=`row-note ${res.kind}`; note.textContent=feedbackText(res);
    total++; if(res.kind!=="bad") correct++;
    if(res.kind==="bad") bad=true;if(res.kind==="warn") warn=true;
  });
  showCurrentScore("ex3",correct,total,`Verb: ${v}`);
  if(bad) soundBad(); else if(warn) soundWarn(); else soundGood();
});

// EXERCISE 4 — alle Verben gleichzeitig zuordnen
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
  const correct=allMatchVerbs.length-falsch.length;
  const pct=showCurrentScore("ex4",correct,allMatchVerbs.length);
  if(falsch.length===0){
    fb.textContent=`Alles richtig! ${pct}%`;
    fb.className="feedback show good";
    soundGood();
  }else{
    const corrections=falsch.map(v=>`${v} → ${VERBS[v].aux}`).join(" · ");
    fb.textContent=`${pct}% richtig. Noch nicht ganz. Richtig wäre: ${corrections}`;
    fb.className="feedback show bad";
    soundBad();
  }
});

document.getElementById("resetAllMatch").addEventListener("click",()=>{
  clearCurrentScore("ex4");
  allMatchAssignments={};
  const fb=document.getElementById("allMatchFeedback");
  fb.className="feedback"; fb.textContent="";
  renderAllMatching();
});

renderAllMatching();

// EXERCISE 5 — Lückentext A (12 ausgewogene Aufgaben)
const ex5Qs=[
 {prompt:`J’ □ de monter ma propre maison hantée.`,verb:"décider",answers:["ai décidé"]},
 {prompt:`Tu □ tes devoirs.`,verb:"faire",answers:["as fait"]},
 {prompt:`Il □ : « L’entrée coûte 2 francs. »`,verb:"dire",answers:["a dit"]},
 {prompt:`Elle □ au marché.`,verb:"aller",answers:["est allée"]},
 {prompt:`Nous □ la majeure partie de la journée à dresser un plan.`,verb:"passer",answers:["avons passé"]},
 {prompt:`Vous □ une bonne idée.`,verb:"avoir",answers:["avez eu"]},
 {prompt:`Ils □ à Paris.`,verb:"être",answers:["ont été"]},
 {prompt:`Elles □ les verres.`,verb:"remplir",answers:["ont rempli"]},
 {prompt:`Pour faire connaître notre projet, on □ du papier.`,verb:"prendre",answers:["a pris"]},
 {prompt:`Denis Snella □ deux dollars.`,verb:"payer",answers:["a payé"]},
 {prompt:`Nous □ du pain.`,verb:"acheter",answers:["avons acheté"]},
 {prompt:`Vous □ le spectacle.`,verb:"regarder",answers:["avez regardé"]}
];
oneByOne("ex5",ex5Qs,inputQuestionRenderer);

// EXERCISE 6 — Lückentext B (12 weitere ausgewogene Aufgaben)
const ex6Qs=[
 {prompt:`On □ des pubs.`,verb:"fabriquer",answers:["a fabriqué"]},
 {prompt:`Denis Snella □ dans la maison hantée.`,verb:"entrer",answers:["est entré"]},
 {prompt:`Robert et moi, on □ se mettre en place.`,verb:"courir",answers:["a couru"]},
 {prompt:`À Saignelégier, le public □ beaucoup de chevaux.`,verb:"voir",answers:["a vu"]},
 {prompt:`Elle □ le ballon sur la table.`,verb:"mettre",answers:["a mis"]},
 {prompt:`Nous □ la porte.`,verb:"ouvrir",answers:["avons ouvert"]},
 {prompt:`Tu □ au foot avec tes amis.`,verb:"jouer",answers:["as joué"]},
 {prompt:`Ils □ le bus.`,verb:"prendre",answers:["ont pris"]},
 {prompt:`Elles □ à la maison.`,verb:"rentrer",answers:["sont rentrées"]},
 {prompt:`Il □ de partir plus tôt.`,verb:"décider",answers:["a décidé"]},
 {prompt:`Vous □ les billets.`,verb:"payer",answers:["avez payé"]},
 {prompt:`Denis Snella □ derrière la porte avant d’entrer.`,verb:"regarder",answers:["a regardé"]}
];
oneByOne("ex6",ex6Qs,inputQuestionRenderer);

// EXERCISE 7 — Präsens → passé composé A
const ex7Qs=[
 {prompt:`Setze den Satz ins passé composé:<br><strong>Je fais mes devoirs.</strong>`,verb:"faire",answers:["j’ai fait mes devoirs.","j’ai fait mes devoirs"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Tu joues au foot.</strong>`,verb:"jouer",answers:["tu as joué au foot.","tu as joué au foot"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Il prend du papier.</strong>`,verb:"prendre",answers:["il a pris du papier.","il a pris du papier"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Elle va au marché.</strong>`,verb:"aller",answers:["elle est allée au marché.","elle est allée au marché"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Nous fabriquons des pubs.</strong>`,verb:"fabriquer",answers:["nous avons fabriqué des pubs.","nous avons fabriqué des pubs"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Vous regardez dehors.</strong>`,verb:"regarder",answers:["vous avez regardé dehors.","vous avez regardé dehors"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Ils ouvrent la porte.</strong>`,verb:"ouvrir",answers:["ils ont ouvert la porte.","ils ont ouvert la porte"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Elles remplissent les verres.</strong>`,verb:"remplir",answers:["elles ont rempli les verres.","elles ont rempli les verres"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Denis Snella paie deux dollars.</strong>`,verb:"payer",answers:["denis snella a payé deux dollars.","denis snella a payé deux dollars"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>On ouvre la fenêtre.</strong>`,verb:"ouvrir",answers:["on a ouvert la fenêtre.","on a ouvert la fenêtre"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Tu dis bonjour.</strong>`,verb:"dire",answers:["tu as dit bonjour.","tu as dit bonjour"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Nous avons une idée.</strong>`,verb:"avoir",answers:["nous avons eu une idée.","nous avons eu une idée"]}
];
oneByOne("ex7",ex7Qs,inputQuestionRenderer);

// EXERCISE 8 — Präsens → passé composé B
const ex8Qs=[
 {prompt:`Setze den Satz ins passé composé:<br><strong>Denis Snella entre dans la maison.</strong>`,verb:"entrer",answers:["denis snella est entré dans la maison.","denis snella est entré dans la maison"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Elle voit les chevaux.</strong>`,verb:"voir",answers:["elle a vu les chevaux.","elle a vu les chevaux"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Vous mettez le ballon sur la table.</strong>`,verb:"mettre",answers:["vous avez mis le ballon sur la table.","vous avez mis le ballon sur la table"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Ils courent dans le jardin.</strong>`,verb:"courir",answers:["ils ont couru dans le jardin.","ils ont couru dans le jardin"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Elles rentrent à la maison.</strong>`,verb:"rentrer",answers:["elles sont rentrées à la maison.","elles sont rentrées à la maison"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Nous achetons du pain.</strong>`,verb:"acheter",answers:["nous avons acheté du pain.","nous avons acheté du pain"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Vous passez la journée à travailler.</strong>`,verb:"passer",answers:["vous avez passé la journée à travailler.","vous avez passé la journée à travailler"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Il est à Paris.</strong>`,verb:"être",answers:["il a été à paris.","il a été à paris"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Tu décides de partir.</strong>`,verb:"décider",answers:["tu as décidé de partir.","tu as décidé de partir"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Ils paient les billets.</strong>`,verb:"payer",answers:["ils ont payé les billets.","ils ont payé les billets"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Elle entre dans la maison.</strong>`,verb:"entrer",answers:["elle est entrée dans la maison.","elle est entrée dans la maison"]},
 {prompt:`Setze den Satz ins passé composé:<br><strong>Denis Snella regarde derrière la porte.</strong>`,verb:"regarder",answers:["denis snella a regardé derrière la porte.","denis snella a regardé derrière la porte"]}
];
oneByOne("ex8",ex8Qs,inputQuestionRenderer);

renderAux();
renderVerb();
refreshScoreDisplays();
