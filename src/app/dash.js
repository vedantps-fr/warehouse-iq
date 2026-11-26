/* ---------- Dashboard section ---------- */
let visHover=null,memHover=null;
const visS=Mini3D($('cvVisits'),{theta:0.3,phi:1.32,minDist:10,onHover:id=>{visHover=id;readVis()},onPick:id=>{visHover=id;readVis()},build(S){
  const P=pal();const d=visHist.slice(-40);const n=d.length;const SP=1.15;const mx=Math.max(4,...d.map(p=>Math.max(p.v,p.lg)));const k=8/mx;
  const W=Math.max(n,10)*SP;S.floor(0,[-W/2-1,W/2+1,-2,2],P.grid,12,0.35);
  if(!n){S.label([0,1.5,0],'Each operation adds a bar',{size:0.7,color:P.muted});S.fit([-6,6,0,3,-1,1]);return}
  for(let v=0;v<=mx;v+=Math.max(1,Math.ceil(mx/4))){S.line([[-W/2-0.6,v*k,-0.45],[W/2+0.6,v*k,-0.45]],{color:P.grid,width:1});S.label([-W/2-1.1,v*k,-0.45],String(v),{size:0.45,color:P.muted,align:'right'})}
  d.forEach((p,i)=>{const x=-W/2+SP/2+i*SP;const h=Math.max(0.08,p.v*k);S.box({x,y:h/2,z:0,w:0.8,h,d:0.8,color:COL[p.kind]||'#8a8f98',id:i,glow:visHover===i?'#22d3ee':null,shadow:false})});
  const lp=d.map((p,i)=>[-W/2+SP/2+i*SP,p.lg*k,0]);S.line(lp,{color:'#ffb400',width:3,zBias:-50});
  S.label([lp[lp.length-1][0]+0.6,lp[lp.length-1][1],0],'2 log₂ n',{size:0.5,color:'#f59e0b',align:'left'});
  S.fit([-W/2-1.5,W/2+1.5,0,8.5,-1,1])}});
function readVis(){const d=visHist.slice(-40);const p=visHover!=null?d[visHover]:d[d.length-1];
  $('visRead').innerHTML=p?'<b>'+p.label+'</b>: '+(NAME[p.kind]||p.kind)+'. Visited '+p.v+' nodes; 2 log₂ n was '+p.lg.toFixed(1)+' (an insert runs two searches, floor and higher).':'<span class="muted">No operations yet. Add packages on the Warehouse page.</span>'}
const memS=Mini3D($('cvMem'),{theta:0.6,phi:1.18,minDist:12,onHover:id=>{memHover=id;readMem()},onPick:id=>{memHover=id;readMem()},build(S){
  const P=pal();const m=memNums();const k=1.1;S.floor(0,[-6,6,-3,3],P.grid,12,0.35);
  for(let dec=0;dec<=9;dec++){const y=dec*k;S.line([[-4.2,y,-1.6],[4.2,y,-1.6]],{color:P.grid,width:1});if(dec%3===0)S.label([-4.6,y,-1.6],dec===0?'1':dec===3?'1k':dec===6?'1M':'1B',{size:0.5,color:P.muted,align:'right'})}
  const tw=[{id:'tree',x:-1.8,v:m.n,c:'#2dd4bf',t:'tree nodes'},{id:'arr',x:1.8,v:m.slots,c:'#ef4444',t:'array slots'}];
  for(const t of tw){const h=Math.max(0.12,Math.log10(t.v+1)*k);S.box({x:t.x,y:h/2,z:0,w:2.2,h,d:2.2,color:t.c,id:t.id,glow:memHover===t.id?'#22d3ee':null});
    S.label([t.x,h+0.6,0],t.v.toLocaleString(),{size:0.6,color:P.ink});S.label([t.x,-0.6,1.4],t.t,{size:0.5,color:P.muted})}
  S.fit([-5,5,-1,10.5,-2,2])}});
function memNums(){const a=ix.intervals();const slots=a.length?a[a.length-1][1]+1:0;return{n:ix.count,slots}}
function readMem(){const m=memNums();if(!m.n){$('memRead').innerHTML='<span class="muted">Empty. Try scenario 7 (sparse IDs) on the Warehouse page.</span>';return}
  const ratio=m.slots/Math.max(1,m.n);$('memRead').innerHTML=(memHover==='arr'?'<b>Array:</b> one true/false slot for every number up to '+(m.slots-1).toLocaleString()+', about '+m.slots.toLocaleString()+' bytes.':
   '<b>Tree:</b> '+m.n.toLocaleString()+' nodes of about 48 bytes, '+(m.n*48).toLocaleString()+' bytes in all.')+' The array is '+(ratio>=10?Math.round(ratio).toLocaleString()+'×':ratio.toFixed(1)+'×')+' the size of the tree in entries.'}
function renderDash(){const ivs=ix.intervals();const n=ix.count,h=ix.height(),bound=n?1.44*Math.log2(n+2):0;
  $('tN').textContent=n.toLocaleString();$('tIds').textContent=ivs.reduce((a,b)=>a+b[1]-b[0]+1,0).toLocaleString();$('tH').textContent=h;$('tB').textContent=bound.toFixed(1);
  $('tOps').textContent=cur.toLocaleString();$('tRot').textContent=rotTotal.toLocaleString();
  $('hTxt').textContent='Height '+h+' · bound '+bound.toFixed(1)+' · '+(ix.balanced?'AVL mode':'Unbalanced mode');
  $('hBar').style.width=Math.min(100,n?h/Math.max(h,bound*1.6,1)*100:0)+'%';$('hBar').style.background=bound&&h>bound?'var(--red)':'var(--cyan)';
  const rows=[['New range','NEW','#3b82f6'],['Extend left','EXTEND_LEFT','#22c55e'],['Extend right','EXTEND_RIGHT','#22c55e'],['Bridge merge','BRIDGE','#f97316'],['Duplicate','DUPLICATE','#64748b'],['Range insert','RANGE','#8b5cf6'],['Removal','DEL','#8b5cf6']];
  const cnt=k=>k==='DEL'?(caseCount.SPLIT||0)+(caseCount.SHRINK||0)+(caseCount.REMOVED||0):(caseCount[k]||0);const mx=Math.max(1,...rows.map(r=>cnt(r[1])));
  $('caseBars').innerHTML=rows.map(r=>'<div class="hb"><span>'+r[0]+'</span><div class="meter"><i style="width:'+(cnt(r[1])/mx*100)+'%;background:'+r[2]+'"></i></div><b>'+cnt(r[1])+'</b></div>').join('');
  readVis();readMem();drawHChart()}
function drawHChart(){const svg=$('hChart'),box=$('hChartBox');const W=box.clientWidth,H=box.clientHeight;if(!W)return;svg.setAttribute('viewBox','0 0 '+W+' '+H);
  const d=heightHist.slice(-80);if(!d.length){svg.innerHTML='<text x="'+W/2+'" y="'+H/2+'" text-anchor="middle" font-size="13" fill="var(--muted)">Each operation adds a point</text>';return}
  const mx=Math.max(3,...d)*1.15,px=i=>30+i*(W-42)/Math.max(1,d.length-1),py=v=>H-20-v/mx*(H-34);
  svg.innerHTML='<line x1="30" x2="'+(W-12)+'" y1="'+(H-20)+'" y2="'+(H-20)+'" stroke="var(--line)"/><text x="4" y="'+(py(Math.round(mx/1.15))+4)+'" font-size="11" fill="var(--muted)">'+Math.round(mx/1.15)+'</text>'+
   '<path d="'+d.map((v,i)=>(i?'L':'M')+px(i).toFixed(1)+' '+py(v).toFixed(1)).join('')+'" fill="none" stroke="var(--blue)" stroke-width="2.5"/>'+
   '<text x="'+(W-12)+'" y="14" text-anchor="end" font-size="11" fill="var(--muted)">height after each operation</text>'}
new ResizeObserver(drawHChart).observe($('hChartBox'));
onChange(()=>{if(window.__route==='dashboard')renderDash()});
