/* ---------- Tests section ---------- */
let stressIx=new IntervalIndex(),stressHist=[];
const stressV=TreeView($('cvStress'),{getIx:()=>stressIx,minDist:10,theta:0,phi:1.36,cap:60,capDepth:5,onSync:V=>{const c=$('stressCap');if(V.capped){c.style.display='inline-block';c.textContent='Top 5 levels of '+V.height+' · '+V.count.toLocaleString()+' nodes'}else c.style.display='none'}});
$('runTests').onclick=()=>{$('testSum').textContent='Running…';$('runTests').disabled=true;setTimeout(()=>{const t0=performance.now();const T=runTests();const ms=performance.now()-t0;const pass=T.filter(x=>x.ok).length;
  $('tests').innerHTML=T.map(x=>'<li><span class="'+(x.ok?'p':'f')+'">'+(x.ok?'✓':'✗')+'</span><span>'+x.name+(x.detail?' <span class="muted">('+x.detail.replace(/[<>&]/g,'')+')</span>':'')+'</span></li>').join('');
  $('testSum').textContent=pass+' of '+T.length+' passed in '+Math.round(ms)+' ms.';$('runTests').disabled=false},30)};
$('bug').onclick=()=>{const a=ix.intervals();if(a.length<2){$('testSum').textContent='The warehouse needs at least two separate ranges first (try scenario 1), then inject the bug.';return}
  const n=ix.floor(a[0][0]);n.e=a[1][0];bugged='['+a[0][0]+','+a[0][1]+'] was stretched to overlap ['+a[1]+']. Undo, redo or reset on the Index tree page repairs it.';main.sync(false);changed();
  $('testSum').textContent='Bug injected into the live index: one range now overlaps its neighbour. Both badges at the top turned red.'};
$('stress').onclick=()=>{const btn=$('stress');btn.disabled=true;const S=new IntervalIndex(true),seen=new Set(),rnd=mkRng(Date.now()),N=50000;let t=0;stressHist=[];
  const step=()=>{const s=performance.now();while(seen.size<N&&performance.now()-s<12){const x=Math.floor(rnd()*(MAXID+1));if(seen.has(x))continue;seen.add(x);const a=performance.now();S.insert(x);t+=performance.now()-a;
      if(seen.size%500===0)stressHist.push([seen.size,S.height()])}
    $('stressBar').style.width=(seen.size/N*100)+'%';drawSChart();
    if(seen.size<N)return requestAnimationFrame(step);
    const sorted=[...seen].sort((a,b)=>a-b);const o=new Oracle();o.iv=sorted.map(x=>[x,x]);o.norm();const ok=same(o.intervals(),S.intervals());const errs=S.check();
    $('stressOut').innerHTML='<b>'+N.toLocaleString()+' IDs</b> inserted in '+Math.round(t)+' ms of tree work ('+(t/N*1000).toFixed(1)+' µs each). Height '+S.height()+', AVL bound '+(1.44*Math.log2(S.count+2)).toFixed(1)+'. '+S.count.toLocaleString()+' ranges. Invariants '+(errs.length?'broken':'valid')+'; brute force '+(ok?'agrees':'disagrees')+'.';
    stressIx=S;stressV.snap();stressV.sync(true,900);btn.disabled=false};requestAnimationFrame(step)};
function drawSChart(){const svg=$('sChart'),box=$('sChartBox');const W=box.clientWidth,H=box.clientHeight;if(!W)return;svg.setAttribute('viewBox','0 0 '+W+' '+H);
  if(!stressHist.length){svg.innerHTML='<text x="'+W/2+'" y="'+H/2+'" text-anchor="middle" font-size="13" fill="var(--muted)">Run the stress test to draw this</text>';return}
  const N=50000,mx=24,px=n=>34+n/N*(W-46),py=h=>H-22-h/mx*(H-36);let bound='';for(let n=500;n<=N;n+=500)bound+=(n===500?'M':'L')+px(n).toFixed(1)+' '+py(1.44*Math.log2(n+2)).toFixed(1);
  svg.innerHTML='<line x1="34" x2="'+(W-12)+'" y1="'+(H-22)+'" y2="'+(H-22)+'" stroke="var(--line)"/>'+[0,10,20].map(v=>'<text x="6" y="'+(py(v)+4)+'" font-size="11" fill="var(--muted)">'+v+'</text>').join('')+
   '<text x="'+(W-12)+'" y="'+(H-6)+'" text-anchor="end" font-size="11" fill="var(--muted)">50,000 IDs</text>'+
   '<path d="'+bound+'" fill="none" stroke="var(--muted)" stroke-dasharray="4 4" stroke-width="2"/><path d="'+stressHist.map((p,i)=>(i?'L':'M')+px(p[0]).toFixed(1)+' '+py(p[1]).toFixed(1)).join('')+'" fill="none" stroke="var(--blue)" stroke-width="2.5"/>'+
   (W>360?'<text x="44" y="16" font-size="11" fill="var(--blue)">actual height</text><text x="140" y="16" font-size="11" fill="var(--muted)">AVL bound 1.44 log₂ n</text>':'')}
new ResizeObserver(drawSChart).observe($('sChartBox'));stressV.snap();stressV.sync(false);

/* ---------- Benchmark ---------- */
$('benchBtn').onclick=async()=>{const btn=$('benchBtn'),tb=$('benchBody'),note=$('benchNote');btn.disabled=true;tb.innerHTML='';const CAP=1e5,CHUNK=5000;
  for(const kind of ['random','sorted'])for(const n of [1e3,1e4,1e5]){const N=Math.min(n,CAP);const I=new IntervalIndex();const rnd=mkRng(N+(kind==='random'?1:2));const seen=kind==='random'?new Set():null;
    const v0=I.visits;let ms=0,i=0;
    while(i<N){await new Promise(r=>setTimeout(r,0));const t0=performance.now();const end=Math.min(N,i+CHUNK);
      for(;i<end;i++){let x;if(seen){do x=Math.floor(rnd()*(MAXID+1));while(seen.has(x));seen.add(x)}else x=2*i;I.insert(x)}
      ms+=performance.now()-t0;note.textContent='Running '+kind+', n = '+N.toLocaleString()+': '+i.toLocaleString()}
    tb.insertAdjacentHTML('beforeend','<tr><td>'+kind+'</td><td>'+N.toLocaleString()+'</td><td>'+ms.toFixed(1)+'</td><td>'+((I.visits-v0)/N).toFixed(2)+'</td><td>'+I.height()+'</td><td>'+(1.44*Math.log2(N+2)).toFixed(2)+'</td></tr>')}
  note.textContent='Done.';btn.disabled=false};
