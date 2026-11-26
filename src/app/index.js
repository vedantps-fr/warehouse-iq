/* ---------- Live index section ---------- */
const main=TreeView($('cvIndex'),{getIx:()=>ix,colorOf:id=>colorOf.get(id),track:true,getQuery:()=>query,getScale:()=>scale,debug:()=>debug,
  onSelect:showSel,onSync:V=>{const cb=$('capBadge');if(V.capped){cb.style.display='inline-block';cb.textContent='Showing top 7 levels of '+V.height+' · '+V.count.toLocaleString()+' nodes'}else cb.style.display='none'}});
function showSel(q){const el=$('selInfo');if(!q){el.innerHTML='<span class="muted">Click a node or a block in the 3D view.</span>';return}
  const n=q.e-q.s+1;el.innerHTML='<b style="font-size:18px">['+q.s.toLocaleString()+', '+q.e.toLocaleString()+']</b><br>'+n.toLocaleString()+' ID'+(n>1?'s':'')+' · depth '+q.d+' · height '+q.h+' · balance '+q.bf+
   '<br><span class="muted">Left child '+iv(q.l)+' · right child '+iv(q.r)+'</span><br><span class="muted">The blue ray links this node to its block on the track.</span>'}

function opText(o){return o.t==='ins'?'insert '+o.x:o.t==='rng'?'insert range ['+o.L+','+o.R+']':o.t==='del'?'remove '+o.x:'mode '+(o.b?'AVL':'Unbalanced')}
function opsToCode(list){return 'LAI1:'+list.map(o=>o.t==='ins'?'i'+o.x:o.t==='del'?'d'+o.x:o.t==='rng'?'r'+o.L+'-'+o.R:'m'+(o.b?1:0)).join('.')}
function codeToOps(code){code=code.trim();if(!code.startsWith('LAI1:'))throw new Error('A share code starts with LAI1:');const body=code.slice(5);if(!body)return[];
  return body.split('.').map(tok=>{let m;if(m=/^i(\d+)$/.exec(tok))return{t:'ins',x:chk(+m[1])};if(m=/^d(\d+)$/.exec(tok))return{t:'del',x:chk(+m[1])};
   if(m=/^r(\d+)-(\d+)$/.exec(tok)){const L=chk(+m[1]),R=chk(+m[2]);if(L>R)throw new Error('Bad range in code');return{t:'rng',L,R}}
   if(m=/^m([01])$/.exec(tok))return{t:'mode',b:m[1]==='1'};throw new Error('Unreadable part: '+tok.slice(0,20))})}

function captionFor(r){const n=ix.count;let t='';const c=COL[r.kind]||'#8a8f98';
  if(r.op==='insert'){const f='floor('+r.x+') = '+iv(r.floor)+', higher('+r.x+') = '+iv(r.higher)+'. ';
    t={NEW:'<b>'+r.x+' arrived.</b> '+f+'Neither touches '+r.x+', so a new range ['+r.x+','+r.x+'] starts.',
     EXTEND_RIGHT:'<b>'+r.x+' arrived.</b> '+f+iv(r.floor)+' ends at '+(r.x-1)+', so it grows to '+iv(r.result)+'.',
     EXTEND_LEFT:'<b>'+r.x+' arrived.</b> '+f+iv(r.higher)+' starts at '+(r.x+1)+', so it grows to '+iv(r.result)+'.',
     BRIDGE:'<b>'+r.x+' fills the hole.</b> '+iv(r.floor)+' ends at '+(r.x-1)+' and '+iv(r.higher)+' starts at '+(r.x+1)+', so they merge into '+iv(r.result)+'. Only these two neighbours were examined.',
     DUPLICATE:'<b>'+r.x+' is already here</b>, inside '+iv(r.floor)+'. Nothing changes.'}[r.kind]}
  else if(r.op==='range')t='<b>Range ['+r.L+','+r.R+'] inserted.</b> '+(r.absorbed.length?'It absorbed '+r.absorbed.map(iv).join(' ')+' and ':'')+'became '+iv(r.result)+'.';
  else if(r.op==='delete')t={NOT_PRESENT:'<b>'+r.x+' is not in the index</b>, so nothing is removed.',REMOVED:'<b>'+r.x+' removed.</b> Its single-ID range is gone.',
    SHRINK:'<b>'+r.x+' removed</b> from the edge of '+iv(r.was)+', which becomes '+iv(r.result[0])+'.',SPLIT:'<b>'+r.x+' removed</b> from the middle of '+iv(r.was)+', which splits into '+iv(r.result[0])+' and '+iv(r.result[1])+'.'}[r.kind];
  else t='<b>Mode is now '+(r.b?'AVL':'Unbalanced')+'.</b> '+(r.b?'The tree was rebuilt balanced; new arrivals rotate when needed.':'New arrivals will not rotate, so sorted input makes a tall chain.');
  if(r.rot&&r.rot.length)t+=' Rebalanced: '+r.rot.map(o=>o.type+' rotation at '+iv(o.at)).join(', ')+'.';
  if(r.op!=='mode')t+=' <span class="muted">Visited '+r.visited+' nodes; log₂ n ≈ '+(n?Math.log2(n+1).toFixed(1):0)+'.</span>';
  return{t,c}}
function setCaption(r){const {t,c}=captionFor(r);$('caption').innerHTML=t;$('caption').style.borderLeftColor=c}
function say(html,c){$('caption').innerHTML=html;$('caption').style.borderLeftColor=c||'var(--grey)'}

function commit(op){ops.length=cur;opRes.length=cur;opTimes.length=cur;ops.push(op);cur++;const r=applyOp(ix,orc,op);r.h=ix.height();r.n=ix.count;opRes.push(r);opTimes.push(Date.now());bugged=false;
  if(r.id&&COL[r.kind])colorOf.set(r.id,COL[r.kind]);caseCount[r.kind]=(caseCount[r.kind]||0)+1;rotTotal+=(r.rot||[]).length;
  if(op.t!=='mode')visHist.push({v:r.visited,lg:2*Math.log2(ix.count+1),kind:r.kind,label:'#'+cur+' '+opText(op)});heightHist.push(ix.height());
  logLines.push(String(cur).padStart(3,' ')+'  '+opText(op).padEnd(26,' ')+(NAME[r.kind]||'')+(r.result&&r.result.length&&typeof r.result[0]==='number'?' → '+iv(r.result):'')+((r.rot||[]).length?'  ['+r.rot.map(o=>o.type).join(',')+']':''));
  return r}
async function animateOp(op){const g=gen;const base=window.__route==='tree'?900/+$('speed').value:(reduced?60:240);const r=commit(op);
  if(op.t==='mode'){setCaption(r);main.sync(true,base);changed();return}
  await animOp(main,ix,r,{base,alive:()=>g===gen,focus:window.__route==='tree',onCase:()=>setCaption(r),onRotate:()=>setCaption(r)});
  if(g===gen)changed()}
async function pump(){if(busy)return;busy=true;const g=gen;
  while(queue.length&&g===gen){if(!playing&&!stepOnce)break;stepOnce=false;await animateOp(queue.shift())}
  if(g===gen)busy=false;updQueue()}
function updQueue(){$('queueOut').textContent=queue.length?queue.length+' waiting':'';$('play').textContent=playing?'Pause':'Play';$('play').classList.toggle('on',playing)}
function enqueue(list){queue.push(...list);updQueue();pump()}
function instant(list){for(const o of list)commit(o);main.sync(false);changed()}
function rebuild(){gen++;queue=[];busy=false;ix=new IntervalIndex();orc=new Oracle();colorOf=new Map();opRes=[];for(const k in caseCount)delete caseCount[k];rotTotal=0;visHist=[];heightHist=[];
  for(const o of ops.slice(0,cur)){const r=applyOp(ix,orc,o);r.h=ix.height();r.n=ix.count;opRes.push(r);if(r.id&&COL[r.kind])colorOf.set(r.id,COL[r.kind]);caseCount[r.kind]=(caseCount[r.kind]||0)+1;rotTotal+=(r.rot||[]).length;if(o.t!=='mode')visHist.push({v:r.visited,lg:2*Math.log2(r.n+1),kind:r.kind,label:'#'+opRes.length+' '+opText(o)});heightHist.push(r.h)}
  while(opTimes.length<cur)opTimes.push(Date.now());
  bugged=false;main.clearGlow();main.clearTags();main.clearPkg();main.sync(false);changed();updQueue()}
function hardReset(){ops=[];cur=0;opTimes=[];logLines=[];query=null;$('qL').value=$('qR').value='';rebuild();say('Index cleared.')}

function renderIndexPanels(){const list=query?ix.query(query[0],query[1]):null;const ivs=list?list.intervals:ix.intervals();
  let gaps=list?list.gaps:[];if(!list)for(let i=1;i<ivs.length;i++)gaps.push([ivs[i-1][1]+1,ivs[i][0]-1]);
  $('ivTitle').textContent=query?'Arrived inside ['+query[0]+', '+query[1]+']':'Arrived ranges';$('gapTitle').textContent=query?'Missing inside ['+query[0]+', '+query[1]+']':'Missing between them';
  const chips=(a,c)=>a.length?a.slice(0,60).map(x=>'<span class="chip '+c+'">'+iv(x)+'</span>').join('')+(a.length>60?'<span class="small muted">and '+(a.length-60)+' more</span>':''):'<span class="small muted">None</span>';
  $('ivList').innerHTML=chips(ivs,'');$('gapList').innerHTML=chips(gaps,'gap');
  $('undo').disabled=cur===0;$('redo').disabled=cur>=ops.length;$('mAVL').classList.toggle('on',ix.balanced);$('mUnb').classList.toggle('on',!ix.balanced)}
onChange(renderIndexPanels);

$('addBtn').onclick=()=>{try{enqueue(parseList($('ids').value).map(x=>({t:'ins',x})));$('idsErr').textContent='';$('ids').value=''}catch(e){$('idsErr').textContent=e.message}};
$('ids').addEventListener('keydown',e=>{if(e.key==='Enter')$('addBtn').click()});$('ids').addEventListener('input',()=>$('idsErr').textContent='');
$('qBtn').onclick=()=>{try{const L=parseId($('qL').value),R=parseId($('qR').value);if(L>R)throw new Error('From must be less than or equal to To');query=[L,R];$('qErr').textContent='';main.sync(false);changed()}catch(e){$('qErr').textContent=e.message}};
$('qClear').onclick=()=>{query=null;$('qL').value=$('qR').value='';$('qErr').textContent='';main.sync(false);changed()};
$('rBtn').onclick=()=>{try{const L=parseId($('rL').value),R=parseId($('rR').value);if(L>R)throw new Error('From must be less than or equal to To');enqueue([{t:'rng',L,R}]);$('moreErr').textContent=''}catch(e){$('moreErr').textContent=e.message}};
$('dBtn').onclick=()=>{try{enqueue([{t:'del',x:parseId($('dX').value)}]);$('moreErr').textContent=''}catch(e){$('moreErr').textContent=e.message}};
function setMode(b){if(ix.balanced===b)return;const r=commit({t:'mode',b});setCaption(r);main.sync(true,700);changed()}
$('mAVL').onclick=()=>setMode(true);$('mUnb').onclick=()=>setMode(false);
function setScale(s){scale=s;$('sLin').classList.toggle('on',s==='linear');$('sCmp').classList.toggle('on',s==='compressed');main.sync(true,900)}
$('sLin').onclick=()=>setScale('linear');$('sCmp').onclick=()=>setScale('compressed');
$('dbg').onchange=e=>{debug=e.target.checked};
$('undo').onclick=()=>{if(cur>0){cur--;logLines.push('     undo');rebuild();say('<b>Undone.</b> Back to '+cur+' operations.')}};
$('redo').onclick=()=>{if(cur<ops.length){cur++;logLines.push('     redo');rebuild();say('<b>Redone:</b> '+opText(ops[cur-1])+'.')}};
$('reset').onclick=hardReset;
$('play').onclick=()=>{playing=!playing;updQueue();pump()};
$('step').onclick=()=>{playing=false;stepOnce=true;updQueue();pump()};
$('speed').oninput=e=>$('speedOut').textContent=e.target.value+'×';
$('fit').onclick=()=>main.resetView();

function preset(p){const bal=ix.balanced;hardReset();playing=true;
  if(p===1){query=[1,7];$('qL').value=1;$('qR').value=7;main.sync(false);changed();say('<b>Preset 1.</b> Packages 1, 3, 7, 2, 6 arrive in that order. The window [1,7] is selected, so the missing range shows on the track.');enqueue([1,3,7,2,6].map(x=>({t:'ins',x})))}
  if(p===2){instant([1,2,3,5,6,7,8].map(x=>({t:'ins',x})));say('<b>Preset 2.</b> The index holds [1,3] and [5,8]. Package 4 is about to arrive.');const g=gen;setTimeout(()=>{if(g===gen)enqueue([{t:'ins',x:4}])},1400)}
  if(p===3){setScale('compressed');instant([7,8,9].map(x=>({t:'ins',x})));say('<b>Preset 3.</b> Widely spaced IDs up to 1,000,000,000. The tree grows by one node per range, not per number. The Dashboard memory towers show the difference.');
    enqueue([0,500000000,1000000000,10,999999999].map(x=>({t:'ins',x})))}
  if(p===4){if(!bal)instant([{t:'mode',b:false}]);const xs=[];for(let i=1;i<=16;i++)xs.push(2*i);$('speed').value=4;$('speedOut').textContent='4×';
    say('<b>Preset 4.</b> Sorted IDs 2, 4, 6 … 32, spaced so they never merge. Mode: '+(bal?'AVL. Rotations keep the height near log₂ n. Switch to Unbalanced and run it again.':'Unbalanced. Each node hangs off the last one, so the height grows to n. Switch to AVL and run it again.'));
    enqueue(xs.map(x=>({t:'ins',x})))}}
document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>preset(+b.dataset.p));

document.addEventListener('keydown',e=>{const tag=(e.target.tagName||'').toLowerCase();if(tag==='input'||tag==='textarea'||tag==='select'||e.ctrlKey||e.metaKey||e.altKey)return;
  if(window.__route!=='tree')return;
  if(e.key===' '){e.preventDefault();if(queue.length){if(playing){playing=false;updQueue()}else{stepOnce=true;pump()}}else{playing=!playing;updQueue()}}
  else if(e.key==='ArrowLeft'){e.preventDefault();$('undo').click()}else if(e.key==='ArrowRight'){e.preventDefault();$('redo').click()}
  else if(/^[1-4]$/.test(e.key))preset(+e.key);
  else if(e.key==='?'){const k=$('keys');k.style.display=k.style.display==='block'?'none':'block'}});
