/* ---------- Warehouse home: 3D hangar ---------- */
const HG={mode:'overview',layout:{items:[],rows:1,maxW:20,more:false},pos:new Map(),born:new Map(),drop:null,flash:null,hover:null,lastR:null};
const BOXC=['#1d4ed8','#2563eb','#1e40af','#3b82f6'];
const hangS=Mini3D($('cvHangar'),{theta:0.75,phi:1.05,minDist:14,build:hangBuild,onHover:id=>{HG.hover=id;hangHoverInfo()},onPick:id=>{HG.hover=id;hangHoverInfo()}});
$('cvHangar').addEventListener('pointerdown',()=>{if(HG.mode!=='manual'){HG.mode='manual';camTabs()}});
function hangLayout(){let segs=[];
  if(query){const r=ix.query(query[0],query[1]);segs=[...r.intervals.map(b=>({s:b[0],e:b[1],g:0})),...r.gaps.map(b=>({s:b[0],e:b[1],g:1}))].sort((a,b)=>a.s-b.s)}
  else{const b=ix.intervals();for(let i=0;i<b.length;i++){if(i)segs.push({s:b[i-1][1]+1,e:b[i][0]-1,g:1});segs.push({s:b[i][0],e:b[i][1],g:0})}}
  const more=segs.length>48;if(more)segs=segs.slice(0,48);
  const RW=5.2,GW=2.8,MAXROW=38;let x=0,row=0;const rowW=[];
  for(const s of segs){const w=s.g?GW:RW;if(x>0&&x+w>MAXROW){rowW.push(x-0.8);x=0;row++}s.row=row;s.x=x+w/2;s.w=w;x+=w+0.8}
  rowW.push(Math.max(0,x-0.8));
  segs.forEach((s,i)=>{s.cx=s.x-rowW[s.row]/2;s.cz=-s.row*9;if(!s.g){const n=ix.floor(s.s);s.key=n?n.id:'x'+i}else s.key='g'+s.s});
  return{items:segs,rows:row+1,maxW:Math.max(14,...rowW),more}}
function hangFit(){const L=HG.layout;hangS.fit([-L.maxW/2-1,L.maxW/2+1,0,6.6,-(L.rows-1)*9-1.5,1.5])}
function hangBuild(S,now){const L=HG.layout;const t=now/1000;
  const ext=[-L.maxW/2-6,L.maxW/2+6,-(L.rows-1)*9-6,6];S.floor(0,ext,'#22d3ee',Math.min(40,Math.round((ext[1]-ext[0])/2)),0.16);
  if(HG.mode==='orbit'){S.theta+=0.0035;if(Math.round(now/16)%30===0)hangFit()}
  if(HG.mode==='scanner'){const sx=Math.sin(t*0.35)*L.maxW/2;const z=-(Math.floor((t*0.35/Math.PI/2))%L.rows)*9;S.userMoved=false;S.goal={tgt:[sx,2.4,z],dist:12};S.theta=0.08;S.phi=1.4;
    S.line([[sx,0.05,z-1.6],[sx,6,z-1.6]],{color:'#22d3ee',width:3,zBias:-40});S.line([[sx-0.4,6,z-1.6],[sx+0.4,6,z-1.6]],{color:'#22d3ee',width:3,zBias:-40})}
  if(!L.items.length){S.label([0,2.5,0],'EMPTY HANGAR — ADD A PACKAGE',{size:0.8,color:'#5f7a96'});return}
  for(const s of L.items){let p=HG.pos.get(s.key);if(!p){p=[s.cx,s.cz];HG.pos.set(s.key,p);HG.born.set(s.key,now)}p[0]+=(s.cx-p[0])*0.14;p[1]+=(s.cz-p[1])*0.14;
    const [cx,cz]=p;
    if(s.g){const hw=s.w/2-0.15;const y=0.03;const col='#f59e0b';
      S.line([[cx-hw,y,cz-1.1],[cx+hw,y,cz-1.1],[cx+hw,y,cz+1.1],[cx-hw,y,cz+1.1],[cx-hw,y,cz-1.1]],{color:col,width:2,dash:[5,4],dashOff:-t*12});
      S.box({x:cx,y:0.02,z:cz,w:s.w-0.4,h:0.04,d:2.1,color:'#f59e0b',alpha:0.12,id:s.key,shadow:false});
      S.label([cx,1.3,cz],'GAP',{size:0.42,color:'#fbbf24'});S.label([cx,0.75,cz],(s.e-s.s+1).toLocaleString()+' missing',{size:0.32,color:'#c08a2c',mono:true});continue}
    const n=s.e-s.s+1,grow=Math.min(1,(now-(HG.born.get(s.key)||0))/500),H=5*ease(grow)+0.01;
    const fl=HG.flash&&HG.flash.key===s.key&&now-HG.flash.t0<1400?HG.flash.c:null;const hv=HG.hover===s.key;
    const post={w:0.14,h:H,d:0.14,color:'#0b1322',edge:'rgba(34,211,238,.45)',shadow:false,id:s.key};
    for(const dx of [-2.45,2.45])for(const dz of [-1.0,1.0])S.box(Object.assign({},post,{x:cx+dx,y:H/2,z:cz+dz}));
    for(const sy of [0.12,1.72,3.32])if(sy<H)S.box({x:cx,y:sy,z:cz,w:5.0,h:0.1,d:2.1,color:'#0c1626',edge:'rgba(34,211,238,.25)',shadow:false,id:s.key,glow:fl||(hv?'#22d3ee':null)});
    S.box({x:cx,y:H,z:cz-1.0,w:5.0,h:0.06,d:0.06,color:'#22d3ee',shadow:false});S.box({x:cx,y:H,z:cz+1.0,w:5.0,h:0.06,d:0.06,color:'#22d3ee',shadow:false});
    if(grow<1)continue;
    const shown=Math.min(12,n);const dr=HG.drop&&HG.drop.key===s.key?HG.drop:null;const dSlot=dr?Math.min(11,dr.x-s.s):-1;
    for(let i=0;i<shown;i++){const col=i%4,lv=Math.floor(i/4);let y=0.17+lv*1.6+0.5;
      if(i===dSlot&&dr){const k=Math.min(1,(now-dr.t0)/700);y+=7*(1-ease(k))}
      S.box({x:cx-1.65+col*1.1,y,z:cz,w:0.95,h:0.95,d:0.95,color:BOXC[(s.s+i)%4],edge:'rgba(147,197,253,.35)',shadow:false,id:s.key,glow:i===dSlot&&dr&&now-dr.t0<1500?'#22d3ee':null})}
    S.label([cx,5.75,cz],s.s===s.e?fmt(s.s):fmt(s.s)+'–'+fmt(s.e),{size:0.48,color:'#e6f1ff'});
    S.label([cx,6.45,cz],n.toLocaleString()+(n===1?' PKG':' PKGS'),{size:0.34,pill:'rgba(45,212,191,.9)',color:'#062a24'})}}
function hangHoverInfo(){const el=$('hangHover');const s=HG.layout.items.find(q=>q.key===HG.hover);if(!s){el.style.display='none';return}
  el.style.display='block';const n=s.e-s.s+1;el.innerHTML=s.g?'GAP <b>['+s.s.toLocaleString()+' .. '+s.e.toLocaleString()+']</b><br>'+n.toLocaleString()+' ID'+(n>1?'S':'')+' NOT ARRIVED':'RACK <b>['+s.s.toLocaleString()+', '+s.e.toLocaleString()+']</b><br>'+n.toLocaleString()+' PACKAGE'+(n>1?'S':'')+(n>12?' · 12 SHOWN':'')}
const CAMS={overview:[0.75,1.05],bays:[0,1.36],top:[0,0.06],orbit:[0.75,1.0],scanner:[0.08,1.4]};
function setCam(m){HG.mode=m;hangS.userMoved=false;if(CAMS[m]){hangS.theta=CAMS[m][0];hangS.phi=CAMS[m][1]}if(m!=='scanner')hangFit();camTabs()}
function camTabs(){document.querySelectorAll('[data-cam]').forEach(b=>b.classList.toggle('on',b.dataset.cam===HG.mode))}
document.querySelectorAll('[data-cam]').forEach(b=>b.onclick=()=>setCam(b.dataset.cam));

/* ---------- KPIs, interval cards, HUD ---------- */
function renderHome(){if(query&&document.activeElement!==$('hS')&&document.activeElement!==$('hE')){$('hS').value=query[0];$('hE').value=query[1]}HG.layout=hangLayout();if(HG.mode!=='scanner'&&HG.mode!=='manual')hangFit();
  const r=opRes[cur-1];if(r&&r!==HG.lastR){HG.lastR=r;const now=performance.now();if(r.op==='insert'&&r.id&&r.kind!=='DUPLICATE')HG.drop={key:r.id,x:r.x,t0:now};if(r.id)HG.flash={key:r.id,c:COL[r.kind],t0:now}}
  const ivs=ix.intervals();const k=ivs.length;const ids=ivs.reduce((a,b)=>a+b[1]-b[0]+1,0);
  let miss=0;if(query){miss=ix.query(query[0],query[1]).gaps.reduce((a,g)=>a+g[1]-g[0]+1,0)}else for(let i=1;i<k;i++)miss+=ivs[i][0]-ivs[i-1][1]-1;
  $('kU').textContent=ids.toLocaleString();$('kI').textContent=k.toLocaleString();$('kM').textContent=(miss>=1e6?fmt(miss):miss.toLocaleString())+' MISSING';
  $('kMl').textContent=query?'Missing in range':'Missing between';$('kMd').textContent=query?'Gaps in query ['+query[0].toLocaleString()+' .. '+query[1].toLocaleString()+']':'Gaps between the first and last ID';
  $('kD').textContent=(caseCount.DUPLICATE||0).toLocaleString();$('kCd').textContent='Max comparisons ≈ '+(k?Math.log2(k+1):0).toFixed(1)+' steps · height '+ix.height();
  $('hud').innerHTML='UNIQUE ARRIVALS: <b>'+ids.toLocaleString()+'</b><br>ACTIVE INTERVALS (k): <b>'+k.toLocaleString()+'</b><br>DUPLICATES FILTERED: <b>'+(caseCount.DUPLICATE||0)+'</b>';
  $('hangCap').textContent=(query?'Showing the window ['+query[0].toLocaleString()+' .. '+query[1].toLocaleString()+']. ':'')+'Each rack is one range and holds up to 12 boxes; bigger ranges show their full count on the label. Amber bays are missing IDs.'+(HG.layout.more?' Showing the first 48 racks and bays.':'');
  const strip=$('ivStrip');if(!k){strip.innerHTML='<span class="desc">No packages yet. Add one below or pick a scenario.</span>'}
  else{const last=r&&r.result&&typeof r.result[0]==='number'?r.result:null;let h='';const lim=Math.min(k,60);
    for(let i=0;i<lim;i++){const [s,e]=ivs[i];if(i){const a=ivs[i-1][1]+1,b=s-1,m=b-a+1;h+='<div class="gapc">GAP ['+fmt(a)+(a===b?'':'..'+fmt(b))+']<hr><span>'+(m>=1e6?fmt(m):m.toLocaleString())+' MISSING</span></div>'}
      const n=e-s+1,isNew=last&&last[0]===s&&last[1]===e;h+='<div class="ivc'+(isNew?' new':'')+'"><div class="n">INTERVAL #'+(i+1)+'</div><div class="v">['+fmt(s)+', '+fmt(e)+']</div><span class="k">'+(n>=1e6?fmt(n):n.toLocaleString())+' PACKAGE'+(n>1?'S':'')+'</span></div>'}
    if(k>lim)h+='<div class="gapc">+'+(k-lim)+' more</div>';strip.innerHTML=h}
  renderGaps();renderAudit()}
onChange(renderHome);

/* ---------- ingest ---------- */
function hErr(m){$('hErr').textContent=m||''}
$('hAdd').onclick=()=>{try{enqueue([{t:'ins',x:parseId($('hPkg').value)}]);$('hPkg').value='';hErr()}catch(e){hErr(e.message)}};
$('hPkg').addEventListener('keydown',e=>{if(e.key==='Enter')$('hAdd').click()});$('hPkg').addEventListener('input',()=>hErr());
$('hNext').onclick=()=>{const a=ix.intervals();const x=a.length?Math.min(MAXID,a[a.length-1][1]+1):1;enqueue([{t:'ins',x}]);hErr()};
$('hRand').onclick=()=>{enqueue([{t:'ins',x:1+Math.floor(Math.random()*100)}]);hErr()};
$('hBig').onclick=()=>{enqueue([{t:'ins',x:1000000000}]);hErr()};
$('hBatchBtn').onclick=()=>{try{enqueue(parseList($('hBatch').value).map(x=>({t:'ins',x})));$('hBatch').value='';hErr()}catch(e){hErr(e.message)}};
$('hBatch').addEventListener('keydown',e=>{if(e.key==='Enter')$('hBatchBtn').click()});$('hBatch').addEventListener('input',()=>hErr());
$('resetAll').onclick=()=>{hardReset();for(const c of document.querySelectorAll('.sc .st'))c.textContent='';HG.pos.clear()};

/* ---------- gap analysis ---------- */
function setQuery(q){query=q;if(q){$('qL').value=$('hS').value=q[0];$('qR').value=$('hE').value=q[1]}else{$('qL').value=$('qR').value=''}main.sync(false);changed()}
$('hAnalyze').onclick=()=>{try{const a=parseId($('hS').value),b=parseId($('hE').value);if(a>b)throw new Error('Start must be less than or equal to End');$('hQErr').textContent='';setQuery([a,b])}catch(e){$('hQErr').textContent=e.message}};
$('hClearQ').onclick=()=>{$('hQErr').textContent='';setQuery(null)};
document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{const [a,c]=b.dataset.q.split(',').map(Number);$('hQErr').textContent='';setQuery([a,c])});
function renderGaps(){const el=$('hGaps');if(!query){$('hQTitle').textContent='Missing ranges';el.innerHTML='<span class="desc">Press "Analyze gaps" to look inside a window.</span>';return}
  const r=ix.query(query[0],query[1]);const tot=r.gaps.reduce((a,g)=>a+g[1]-g[0]+1,0);
  $('hQTitle').textContent='Missing ranges in ['+query[0].toLocaleString()+' .. '+query[1].toLocaleString()+'] · '+tot.toLocaleString()+' IDs · '+r.visited+' nodes visited';
  el.innerHTML=r.gaps.length?r.gaps.slice(0,80).map(g=>{const m=g[1]-g[0]+1;return'<span class="chip gap">['+g[0].toLocaleString()+(g[0]===g[1]?'':' .. '+g[1].toLocaleString())+']<small>'+(m>=1e6?fmt(m):m.toLocaleString())+' missing</small></span>'}).join('')+(r.gaps.length>80?'<span class="desc">and '+(r.gaps.length-80)+' more</span>':''):'<span class="desc">No gaps: every ID in this window has arrived.</span>'}

/* ---------- demonstration scenarios ---------- */
const SCEN=[
 {n:'Illustrative example',d:'Arrivals: [1, 3, 7, 2, 6] → [[1,3], [6,7]]',xs:[1,3,7,2,6],ex:[[1,3],[6,7]],q:[1,7]},
 {n:'Bridge merge',d:'Arrivals: [1,2,3, 5] then 4 bridges into [1,5]',xs:[1,2,3,5,4],ex:[[1,5]]},
 {n:'No false merge',d:'Arrivals: [1..4] & [6..7]. Missing 5 keeps them separate',xs:[1,2,3,4,6,7],ex:[[1,4],[6,7]]},
 {n:'Duplicate filter',d:'Arrivals: [1, 1, 1, 2, 2] → [[1,2]], 3 duplicates',xs:[1,1,1,2,2],ex:[[1,2]],dup:3},
 {n:'Left extension',d:'[5,6,7] extended left by 4 → [4,7]',xs:[5,6,7,4],ex:[[4,7]]},
 {n:'Right extension',d:'[1,2,3] extended right by 4 → [1,4]',xs:[1,2,3,4],ex:[[1,4]]},
 {n:'Sparse IDs',d:'[10, 1,000,000, 500,000,000] → O(k) memory, no giant array',xs:[10,1000000,500000000],ex:[[10,10],[1000000,1000000],[500000000,500000000]]},
 {n:'Large ID boundary',d:'0 and the 1-billion maximum, without overflow',xs:[0,999999999,1000000000],ex:[[0,0],[999999999,1000000000]]},
 {n:'Progressive bridge',d:'[1,3], [7,9] → +5 → +4 → +6 → [1,9]',xs:[1,2,3,7,8,9,5,4,6],ex:[[1,9]]}];
$('scen').innerHTML=SCEN.map((s,i)=>'<button class="sc" data-s="'+i+'"><b>'+(i+1)+'. '+s.n+'</b><span>'+s.d+'</span><div class="st" id="st'+i+'" aria-live="polite"></div></button>').join('');
document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>runScenario(+b.dataset.s));
async function runScenario(i){const s=SCEN[i];for(const c of document.querySelectorAll('.sc .st'))c.textContent='';const st=$('st'+i);
  hardReset();HG.pos.clear();if(s.q)setQuery(s.q);$('cvHangar').scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});const g=gen;st.className='st run';st.textContent='▶ RUNNING…';playing=true;updQueue();
  enqueue(s.xs.map(x=>({t:'ins',x})));
  while(g===gen&&(queue.length||busy))await sleep(80);if(g!==gen)return;
  const got=ix.intervals();const ok=same(got,s.ex)&&(s.dup==null||(caseCount.DUPLICATE||0)===s.dup);
  st.className='st '+(ok?'ok':'bad');st.textContent=(ok?'✓ PASS · ':'✗ FAIL · ')+JSON.stringify(got)+(s.dup!=null?' · '+(caseCount.DUPLICATE||0)+' duplicates':'')}

/* ---------- home test panel ---------- */
$('hRunTests').onclick=()=>{$('hTStat').textContent='Running…';$('hRunTests').disabled=true;setTimeout(()=>{const t0=performance.now();const T=runTests();const ms=performance.now()-t0;const pass=T.filter(x=>x.ok).length;
  $('hTCount').textContent=T.length;$('hTStat').textContent=pass+' / '+T.length+' PASSED ('+Math.round(pass/T.length*100)+'%)';$('hTStat').style.color=pass===T.length?'var(--teal)':'var(--red)';$('hTTime').textContent=ms.toFixed(1)+' ms';
  $('hTList').innerHTML=T.map((x,i)=>'<div class="tc'+(x.ok?'':' fail')+'"><b>#'+(i+1)+': '+x.name.replace(/[<>&]/g,'')+'</b><span class="'+(x.ok?'ok':'bad')+'">'+(x.ok?'PASS':'FAIL')+'</span><span>'+(x.ok?'Verified.':x.detail.replace(/[<>&]/g,''))+'</span><span>'+Math.round(x.ms*1000).toLocaleString()+' µs</span></div>').join('');
  $('hRunTests').disabled=false},30)};

/* ---------- audit trail ---------- */
const OPB={NEW:['NEW INTERVAL','#2dd4bf'],EXTEND_LEFT:['EXTEND LEFT','#22c55e'],EXTEND_RIGHT:['EXTEND RIGHT','#22c55e'],BRIDGE:['BRIDGE MERGE','#a78bfa'],DUPLICATE:['DUPLICATE','#94a3b8'],RANGE:['RANGE INSERT','#60a5fa'],SPLIT:['SPLIT','#f87171'],SHRINK:['SHRINK','#f87171'],REMOVED:['REMOVED','#f87171'],NOT_PRESENT:['NOT PRESENT','#94a3b8'],MODE:['MODE','#94a3b8']};
const I2=a=>'['+a[0]+', '+a[1]+']';
function auditDesc(o,r){switch(r.kind){
  case'NEW':return'New interval: Created isolated interval '+I2(r.result)+'.';
  case'EXTEND_LEFT':return'Extended left: Interval '+I2(r.higher)+' extended left with ID '+r.x+' to '+I2(r.result)+'.';
  case'EXTEND_RIGHT':return'Extended right: Interval '+I2(r.floor)+' extended right with ID '+r.x+' to '+I2(r.result)+'.';
  case'BRIDGE':return'Bridge merge: Package ID '+r.x+' bridged '+I2(r.floor)+' and '+I2(r.higher)+' into '+I2(r.result)+'.';
  case'DUPLICATE':return'Duplicate: ID '+r.x+' is already inside '+I2(r.floor)+'; ignored without changes.';
  case'RANGE':return'Range insert: ['+r.L+', '+r.R+']'+(r.absorbed.length?' absorbed '+r.absorbed.length+' interval'+(r.absorbed.length>1?'s':''):'')+' → '+I2(r.result)+'.';
  case'SPLIT':return'Split: Removed '+r.x+' from '+I2(r.was)+' → '+I2(r.result[0])+' and '+I2(r.result[1])+'.';
  case'SHRINK':return'Shrink: Removed '+r.x+' from the edge of '+I2(r.was)+' → '+I2(r.result[0])+'.';
  case'REMOVED':return'Removed: Single-ID interval ['+r.x+', '+r.x+'] deleted.';
  case'NOT_PRESENT':return'Not present: ID '+r.x+' was not in the index.';
  default:return'Mode: '+(r.b?'AVL balancing on; tree rebuilt balanced.':'Balancing off (Unbalanced mode).')}}
function renderAudit(){const tb=$('audit');if(!cur){tb.innerHTML='<tr><td colspan="5" class="desc">No arrivals yet.</td></tr>';return}
  let h='';for(let i=cur-1;i>=Math.max(0,cur-200);i--){const o=ops[i],r=opRes[i];if(!r)continue;const b=OPB[r.kind]||['?','#94a3b8'];
    const id=o.t==='ins'||o.t==='del'?'#'+o.x.toLocaleString():o.t==='rng'?'#'+o.L+'–'+o.R:'—';
    const ts=new Date(opTimes[i]||Date.now()).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',second:'2-digit'}).toLowerCase();
    h+='<tr><td>#'+(i+1)+'</td><td class="id">'+id+'</td><td><span class="op" style="color:'+b[1]+';border-color:'+b[1]+';background:'+b[1]+'1a">'+b[0]+'</span></td><td class="hide">'+auditDesc(o,r)+'</td><td class="ts">'+ts+'</td></tr>'}
  tb.innerHTML=h}
