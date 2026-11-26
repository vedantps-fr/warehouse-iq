/* ---------- Story mode: enter screen, four chapters, ending ---------- */
const FOG={rgb:[4,7,13],near:26,far:95};
const ST={ch:0,gen:0,auto:true,waiters:[],ixA:new IntervalIndex(),ixB:new IntervalIndex(),colA:new Map(),colB:new Map(),trackA:false,trackB:false,scale:'linear',halo:true,
  split:false,hold:false,busy:false,ops:[],cur:0,started:false,rot:{A:0,B:0},stress:null};
const SA=TreeView($('cvSA'),{getIx:()=>ST.ixA,colorOf:id=>ST.colA.get(id),track:()=>ST.trackA,getScale:()=>ST.scale,halo:()=>ST.halo,particles:110,drift:true,fog:FOG,theta:0.35,phi:1.22,minDist:13,cap:260,capDepth:6});
const SB=TreeView($('cvSB'),{getIx:()=>ST.ixB,colorOf:id=>ST.colB.get(id),track:()=>ST.trackB,getScale:()=>ST.scale,halo:()=>ST.halo,particles:70,drift:true,fog:FOG,theta:0.35,phi:1.22,minDist:13,cap:260,capDepth:6});
const live=g=>()=>g===ST.gen;
function setSplit(on){ST.split=on;$('story').classList.toggle('split',on);SA.S.snap();SB.S.snap()}
function tags(a,b){$('tagA').innerHTML=a||'';$('tagB').innerHTML=b||''}
function narrate(html){const box=$('stNarr');for(const p of box.querySelectorAll('p.in'))p.classList.add('old');
  const p=document.createElement('p');p.innerHTML=html;box.appendChild(p);requestAnimationFrame(()=>requestAnimationFrame(()=>p.classList.add('in')));
  const all=box.querySelectorAll('p');if(all.length>2)for(let i=0;i<all.length-2;i++){const q=all[i];q.classList.add('out');setTimeout(()=>q.remove(),900)}}
function clearNarr(){$('stNarr').innerHTML=''}
function next(g,ms){return new Promise(res=>{let done=false;const fin=()=>{if(done)return;done=true;ST.waiters=ST.waiters.filter(f=>f!==fin);res(g===ST.gen)};ST.waiters.push(fin);if(ST.auto&&ms!=null)setTimeout(fin,reduced?Math.min(ms,1500):ms)})}
function advance(){const w=ST.waiters.slice();if(w.length)w.forEach(f=>f());else if(ST.ch===0)goChapter(1);else if(!ST.busy&&ST.ch<5)skip()}
function panels(p1,p3,hud){$('stP1').classList.toggle('on',!!p1);$('stP3').classList.toggle('on',!!p3);$('stHud').classList.toggle('on',!!hud)}
function chapUI(){document.querySelectorAll('[data-ch]').forEach(b=>{const n=+b.dataset.ch;b.classList.toggle('on',n===ST.ch);b.classList.toggle('done',n<ST.ch)})}
function freshA(bal=true){ST.ixA=new IntervalIndex(bal);ST.colA=new Map();SA.clearGlow();SA.clearTags();SA.clearPkg()}
function freshB(bal=true){ST.ixB=new IntervalIndex(bal);ST.colB=new Map();SB.clearGlow();SB.clearTags();SB.clearPkg()}
function caseLine(r){const x=r.x;switch(r.kind){
  case'NEW':return'Package <b>'+x+'</b> lands alone. Nothing beside it, so a new range ['+x+','+x+'] begins.';
  case'EXTEND_RIGHT':return'<b>'+x+'</b> touches the end of '+iv(r.floor)+'. The range grows to '+iv(r.result)+'; no new node is needed.';
  case'EXTEND_LEFT':return'<b>'+x+'</b> touches the start of '+iv(r.higher)+'. The range grows to '+iv(r.result)+'.';
  case'BRIDGE':return'<b>'+x+'</b> closes the gap between '+iv(r.floor)+' and '+iv(r.higher)+'. Two ranges become one: '+iv(r.result)+'.';
  case'DUPLICATE':return'<b>'+x+'</b> is already on the shelf. Duplicates change nothing.';
  default:return''}}
function rotLine(r){return'The tree leans two levels too far, so it rotates: <b>'+r.rot.map(o=>o.type).join(', ')+'</b>. Balance restored, height stays logarithmic.'}
async function stInsert(view,side,x,base,g,quiet){const I=side==='A'?ST.ixA:ST.ixB,C=side==='A'?ST.colA:ST.colB;const r=I.insert(x);if(r.id&&COL[r.kind])C.set(r.id,COL[r.kind]);ST.rot[side]+=r.rot.length;
  await animOp(view,I,r,{base,alive:live(g),focus:true,onCase:()=>{if(!quiet)narrate(caseLine(r))},onRotate:()=>{if(!quiet)narrate(rotLine(r))}});return r}

/* ---------- enter screen ---------- */
function showEnter(){ST.gen++;ST.ch=0;chapUI();setSplit(false);panels();clearNarr();tags();$('stEnd').classList.remove('on');$('stEnter').classList.add('on');
  freshA();ST.trackA=false;ST.halo=true;const r=mkRng(7);const s=new Set();while(s.size<23)s.add(2*Math.floor(r()*60));for(const x of s){const q=ST.ixA.insert(x);if(q.id)ST.colA.set(q.id,['#3b82f6','#22c55e','#f97316','#3b82f6'][x%4])}
  SA.S.snap();SA.sync(false)}
/* ---------- chapters ---------- */
async function ch1(g){setSplit(false);freshA();ST.trackA=true;ST.scale='linear';ST.halo=true;ST.ops=[];ST.cur=0;SA.S.snap();SA.sync(false);panels();
  narrate('<b>Chapter 1 · Arrivals.</b> Packages reach the warehouse out of order. The index keeps ranges, never a list of every ID.');
  if(!await next(g,2600))return;
  for(const x of [1,3,7,2,6]){ST.busy=true;await stInsert(SA,'A',x,950,g);ST.busy=false;if(g!==ST.gen)return;ST.ops.push(x);ST.cur=ST.ops.length;if(!await next(g,900))return}
  narrate('Each arrival asks only two questions: <b>floor(x)</b> and <b>higher(x)</b>. That is why every arrival costs O(log k).');
  if(!await next(g,3200))return;
  narrate('Your turn. <b>Press and hold</b> to stream arrivals, or type an ID. Press Next when you are ready for chapter 2.');panels(true)}
async function ch2(g){setSplit(true);ST.halo=true;freshA();freshB();ST.trackA=ST.trackB=true;ST.scale='linear';panels();
  for(const I of [ST.ixA,ST.ixB])for(const [a,b] of [[12,14],[20,20],[1,3],[5,8]])I.insertRange(a,b);
  const L=ST.ixA.floor(4),R=ST.ixA.higher(4);ST.colA.set(L.id,'#3b82f6');ST.colA.set(R.id,'#3b82f6');
  SA.S.snap();SB.S.snap();SA.sync(false);SB.sync(false);SA.tag(L.id,'floor(4)');SA.tag(R.id,'higher(4)');tags('<span class="pill gy">BEFORE</span>','<span class="pill or">AFTER</span>');
  narrate('<b>Chapter 2 · Bridges.</b> Two ranges, [1,3] and [5,8], with a single missing ID between them.');
  if(!await next(g,3000))return;
  ST.busy=true;const r=await stInsert(SB,'B',4,1050,g,true);ST.busy=false;if(g!==ST.gen)return;
  narrate('Package <b>4</b> arrives. Only two neighbours were checked, floor(4) and higher(4), so the cost stays logarithmic.');
  if(!await next(g,2600))return;narrate('Two nodes fused into one: <b>'+iv(r.result)+'</b>. The tree got smaller, and nothing else moved.');
  if(!await next(g,3400))return;
  setSplit(false);tags();ST.ixA=ST.ixB;ST.colA=ST.colB;ST.ixB=new IntervalIndex();SA.clearTags();SA.clearGlow();SA.S.snap();SA.sync(false);
  narrate('A whole truckload arrives: <b>[10, 22]</b>. One sweep absorbs every range it touches.');if(!await next(g,1800))return;
  ST.busy=true;const r2=ST.ixA.insertRange(10,22);ST.colA.set(r2.id,COL.RANGE);await animOp(SA,ST.ixA,r2,{base:1000,alive:live(g),focus:true});ST.busy=false;if(g!==ST.gen)return;
  narrate('It absorbed '+r2.absorbed.map(iv).join(' and ')+'. Now: '+ST.ixA.intervals().map(iv).join(' ')+'.');
  if(!await next(g,3400))return;narrate('Package <b>16</b> is recalled. Its range splits around the hole.');if(!await next(g,1600))return;
  ST.busy=true;const r3=ST.ixA.delete(16);ST.colA.set(r3.id,COL.SPLIT);await animOp(SA,ST.ixA,r3,{base:1000,alive:live(g),focus:true});ST.busy=false;if(g!==ST.gen)return;
  narrate('Split into '+iv(r3.result[0])+' and '+iv(r3.result[1])+'. A split adds one node; a merge removes one. Every change stays local.')}
function memHud(n,slots){$('stHud').innerHTML='<div class="lbl" style="margin-bottom:6px">Memory counter</div><div class="memrow"><div class="lbl"><span>AVL tree</span><span class="desc">≈'+(n*48).toLocaleString()+' bytes</span></div><b style="color:var(--teal)" id="memT">'+n.toLocaleString()+' nodes</b></div><div class="meter"><i style="width:'+Math.max(2,Math.log10(n+1)/9*100)+'%;background:var(--teal)"></i></div>'+
  '<div class="memrow"><div class="lbl"><span>Boolean array</span><span class="desc">≈'+(slots/1e9).toFixed(2)+' GB</span></div><b style="color:#fca5a5" id="memS">0 slots</b></div><div class="meter"><i style="width:'+(Math.log10(slots+1)/9*100)+'%;background:var(--red)"></i></div><p class="desc">Log scale. The tree grows with ranges; the array grows with the largest ID.</p>';
  const t0=performance.now(),el=$('memS');(function tick(){const k=Math.min(1,(performance.now()-t0)/1600);if(!el.isConnected)return;el.textContent=Math.round(slots*ease(k)).toLocaleString()+' slots';if(k<1)requestAnimationFrame(tick)})()}
async function ch3(g){setSplit(false);freshA();ST.trackA=true;ST.scale='linear';ST.halo=true;$('stLin').classList.add('on');$('stCmp').classList.remove('on');SA.S.snap();SA.sync(false);panels(false,true);
  narrate('<b>Chapter 3 · The vast gaps.</b> Now the IDs are far apart: zero, five hundred million, one billion.');if(!await next(g,2600))return;
  for(const x of [0,500000000,1000000000]){ST.busy=true;await stInsert(SA,'A',x,850,g,true);ST.busy=false;if(g!==ST.gen)return;if(!await next(g,500))return}
  panels(false,true,true);memHud(ST.ixA.count,1000000001);
  narrate('A plain true/false array would need <b>1,000,000,001</b> slots. The tree needs <b>'+ST.ixA.count+'</b> nodes.');if(!await next(g,3800))return;
  narrate('On a true scale each package is a speck on a line a billion long.');if(!await next(g,3000))return;
  stScale('compressed');narrate('Compressed, every long gap folds into a <b>//</b> break, and the ranges become readable again.');
  for(let i=0;i<3;i++){if(!await next(g,4200))return;stScale(ST.scale==='linear'?'compressed':'linear')}}
function stScale(s){ST.scale=s;$('stLin').classList.toggle('on',s==='linear');$('stCmp').classList.toggle('on',s==='compressed');SA.sync(true,1400)}
function heightHud(){const a=ST.ixA,b=ST.ixB;const bd=n=>n?1.44*Math.log2(n+2):0;const row=(nm,I,c,rot)=>'<div class="memrow"><div class="lbl"><span>'+nm+'</span><span class="desc">'+I.count+' nodes'+(rot!=null?' · '+rot+' rotations':'')+'</span></div><b style="color:'+c+'">height '+I.height()+'</b></div><div class="meter"><i style="width:'+Math.min(100,I.height()/Math.max(200,I.height())*100)+'%;background:'+c+'"></i></div>';
  $('stHud').innerHTML='<div class="lbl" style="margin-bottom:6px">Height meter · AVL bound '+bd(a.count).toFixed(1)+'</div>'+row('AVL',a,'var(--cyan)',ST.rot.A)+row('Unbalanced',b,'#fca5a5',null)}
async function ch4(g){setSplit(false);freshA();ST.trackA=false;ST.halo=true;SA.S.snap();SA.sync(false);panels();
  narrate('<b>Chapter 4 · Balance.</b> A search tree is only fast while it stays short. Four shapes make it lean.');if(!await next(g,2800))return;
  const demos=[['LL',[30,20,10],'Arrivals descend: the left side grows two levels deeper. One right rotation fixes it.'],['RR',[10,20,30],'Arrivals climb: the right side grows two deeper. One left rotation fixes it.'],
    ['LR',[30,10,20],'Left, then right: a zig-zag. A double rotation straightens it.'],['RL',[10,30,20],'Right, then left: the mirror zig-zag, also fixed by a double rotation.']];
  for(const [t,xs,line] of demos){freshA();SA.sync(false);tags('<span class="pill cy">'+t+' ROTATION</span>');narrate('<b>'+t+'.</b> '+line);
    for(const x of xs){ST.busy=true;await stInsert(SA,'A',x,760,g,true);ST.busy=false;if(g!==ST.gen)return}if(!await next(g,1600))return}
  tags();setSplit(true);freshA(true);freshB(false);ST.rot={A:0,B:0};ST.trackA=ST.trackB=false;ST.halo=false;SA.S.snap();SB.S.snap();SA.sync(false);SB.sync(false);panels(false,false,true);heightHud();
  tags('<span class="pill cy">AVL</span>','<span class="pill rd">UNBALANCED</span>');
  narrate('Now <b>200 sorted arrivals</b>: 2, 4, 6 … 400, spaced so they never merge. Sorted input is the worst case for a plain search tree.');if(!await next(g,3000))return;
  let x=2;ST.busy=true;
  for(;x<=20;x+=2){const ra=ST.ixA.insert(x);ST.rot.A+=ra.rot.length;if(ra.id)ST.colA.set(ra.id,COL.NEW);ST.ixB.insert(x);
    await Promise.all([animOp(SA,ST.ixA,ra,{base:420,alive:live(g)}),(async()=>{SB.sync(true,420)})()]);if(g!==ST.gen){ST.busy=false;return}heightHud()}
  narrate('Fast-forward: the remaining 190 arrive in batches. Watch the two heights.');
  for(;x<=400;){for(let k=0;k<10&&x<=400;k++,x+=2){ST.rot.A+=ST.ixA.insert(x).rot.length;ST.ixB.insert(x)}ST.colA=new Map();SA.sync(true,260);SB.sync(true,260);heightHud();await sleep(reduced?20:300);if(g!==ST.gen){ST.busy=false;return}}
  ST.busy=false;
  narrate('AVL: height <b>'+ST.ixA.height()+'</b> after 200 arrivals, kept low by '+ST.rot.A+' rotations. Unbalanced: height <b>'+ST.ixB.height()+'</b>; every search walks the whole chain.');
  if(!await next(g,5200))return;narrate('That is the whole story. Press <b>Next</b> for the verified summary.')}
/* ---------- ending ---------- */
function ending(){ST.gen++;const g=ST.gen;ST.ch=5;chapUI();panels();clearNarr();tags();$('stEnd').classList.add('on');
  const inv=[ST.ixA,ST.ixB,ix].every(I=>I.check().length===0)&&!bugged;const T=runTests();const pass=T.filter(t=>t.ok).length;const fz=fuzzMismatches(10000,Date.now()%100000);
  const k=(c,l,v,d)=>'<div class="kpi" style="--c:'+c+'"><div class="lbl">'+l+'</div><b>'+v+'</b><div class="desc">'+d+'</div></div>';
  const draw=st=>{$('endGrid').innerHTML=k(inv?'var(--green)':'var(--red)','Invariants',inv?'ALL VALID':'BROKEN','Sorted, disjoint, non-touching; heights and AVL balance correct')+
    k(pass===T.length?'var(--teal)':'var(--red)','Tests',pass+' / '+T.length,'Bridge, duplicates, sparse, edges, rotations, range, delete, fuzz')+
    k(fz.mismatches?'var(--red)':'var(--cyan)','Oracle mismatches',String(fz.mismatches),fz.ops.toLocaleString()+' random operations against brute force')+
    k('var(--violet)','Stress · 50,000 IDs',st?Math.round(st.ms)+' ms':'running…',st?'height '+st.h+' (bound '+st.b.toFixed(1)+') · '+st.n.toLocaleString()+' ranges':'IDs from 0 to 1,000,000,000')};draw(null);
  const S=new IntervalIndex(),seen=new Set(),rnd=mkRng(Date.now()),N=50000;let t=0;
  const step=()=>{if(g!==ST.gen)return;const s=performance.now();while(seen.size<N&&performance.now()-s<12){const x=Math.floor(rnd()*(MAXID+1));if(seen.has(x))continue;seen.add(x);const a=performance.now();S.insert(x);t+=performance.now()-a}
    $('endBar').style.width=(seen.size/N*100)+'%';if(seen.size<N)return requestAnimationFrame(step);
    const st={ms:t,h:S.height(),b:1.44*Math.log2(S.count+2),n:S.count};draw(st);$('endNote').textContent='Stress run in batches of about 12 ms per frame, so the page never froze. Invariants after the run: '+(S.check().length?'broken':'valid')+'.'};
  $('endNote').textContent='Running the stress test in small batches…';requestAnimationFrame(step)}
/* ---------- navigation ---------- */
const CH=[null,ch1,ch2,ch3,ch4];
function goChapter(n){if(n>4)return ending();ST.gen++;const g=ST.gen;ST.ch=n;ST.waiters=[];ST.busy=false;ST.hold=false;$('stHold').classList.remove('on');
  $('stEnter').classList.remove('on');$('stEnd').classList.remove('on');chapUI();clearNarr();tags();SA.S.userMoved=false;SB.S.userMoved=false;CH[n](g)}
function skip(){goChapter(ST.ch+1)}
document.querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>goChapter(+b.dataset.ch));
$('stGo').onclick=()=>goChapter(1);$('stFree').onclick=()=>{location.hash='#index'};$('stRestart').onclick=showEnter;
$('stNext').onclick=advance;$('stSkip').onclick=()=>{if(ST.ch===0)goChapter(1);else skip()};
$('stAuto').onclick=()=>{ST.auto=!ST.auto;$('stAuto').textContent='Auto: '+(ST.auto?'on':'off');$('stAuto').setAttribute('aria-pressed',ST.auto);if(ST.auto)advance()};
$('stKeysBtn').onclick=()=>{const k=$('stKeys');k.style.display=k.style.display==='block'?'none':'block'};
$('stLin').onclick=()=>stScale('linear');$('stCmp').onclick=()=>stScale('compressed');
/* chapter 1 interaction */
function stPick(){const a=ST.ixA.intervals();const top=a.length?Math.min(60,a[a.length-1][1]+4):12;return Math.floor(Math.random()*(top+1))}
async function stAddOne(x){const g=ST.gen;if(ST.ch!==1||ST.busy)return;ST.busy=true;ST.ops.length=ST.cur;ST.ops.push(x);ST.cur++;await stInsert(SA,'A',x,ST.hold?360:700,g);if(g===ST.gen)ST.busy=false}
async function holdLoop(){while(ST.hold&&ST.ch===1){if(!ST.busy)await stAddOne(stPick());else await sleep(60)}}
const hb=$('stHold');hb.addEventListener('pointerdown',e=>{e.preventDefault();hb.setPointerCapture(e.pointerId);ST.hold=true;hb.classList.add('on');holdLoop()});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])hb.addEventListener(ev,()=>{ST.hold=false;hb.classList.remove('on')});
hb.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!ST.busy)stAddOne(stPick())}});
$('stAdd').onclick=()=>{try{const x=parseId($('stId').value);$('stErr').textContent='';$('stId').value='';stAddOne(x)}catch(e){$('stErr').textContent=e.message}};
$('stId').addEventListener('keydown',e=>{if(e.key==='Enter')$('stAdd').click()});$('stId').addEventListener('input',()=>$('stErr').textContent='');
function stReplay(){freshA();for(const x of ST.ops.slice(0,ST.cur)){const r=ST.ixA.insert(x);if(r.id&&COL[r.kind])ST.colA.set(r.id,COL[r.kind])}SA.sync(true,500)}
function stUndo(){if(ST.ch!==1||ST.busy||ST.cur===0)return;ST.cur--;stReplay();narrate('Undone. '+ST.cur+' arrivals in this chapter.')}
function stRedo(){if(ST.ch!==1||ST.busy||ST.cur>=ST.ops.length)return;ST.cur++;stReplay();narrate('Redone: package '+ST.ops[ST.cur-1]+'.')}
$('stUndo').onclick=stUndo;$('stRedo').onclick=stRedo;
document.addEventListener('keydown',e=>{if(window.__route!=='story')return;const tag=(e.target.tagName||'').toLowerCase();if(tag==='input'||tag==='textarea'||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.key===' '){e.preventDefault();advance()}else if(/^[1-4]$/.test(e.key))goChapter(+e.key);else if(e.key==='ArrowLeft'){e.preventDefault();stUndo()}else if(e.key==='ArrowRight'){e.preventDefault();stRedo()}
  else if(e.key==='?')$('stKeysBtn').click()});
/* sound toggle (header) */
$('sndBtn').onclick=()=>{const on=Sfx.toggle();$('sndBtn').setAttribute('aria-pressed',on);$('sndBtn').querySelector('.t').textContent=on?'Sound on':'Sound off';document.getElementById('sndWave').setAttribute('opacity',on?'1':'.25');if(on)Sfx.play('NEW')};
/* story starts at the enter screen the first time it opens */
function measureHeader(){document.documentElement.style.setProperty('--hh',document.querySelector('header.top').offsetHeight+'px')}
addEventListener('resize',measureHeader);measureHeader();
window.onRoute=h=>{measureHeader();if(h==='story'&&!ST.started){ST.started=true;showEnter()}if(h!=='story'){ST.hold=false}};
