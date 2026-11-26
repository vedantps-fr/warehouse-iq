/* ---------- shared helpers and state ---------- */
const $=id=>document.getElementById(id);
const COL={NEW:'#3b82f6',EXTEND_RIGHT:'#22c55e',EXTEND_LEFT:'#22c55e',BRIDGE:'#f97316',DUPLICATE:'#64748b',RANGE:'#8b5cf6',SPLIT:'#8b5cf6',SHRINK:'#8b5cf6',REMOVED:'#8b5cf6',NOT_PRESENT:'#64748b',MODE:'#64748b'};
const NAME={NEW:'New range',EXTEND_RIGHT:'Extend right',EXTEND_LEFT:'Extend left',BRIDGE:'Bridge merge',DUPLICATE:'Duplicate',RANGE:'Range insert',SPLIT:'Split',SHRINK:'Shrink',REMOVED:'Removed',NOT_PRESENT:'Not present',MODE:'Mode change'};
const iv=a=>a?'['+a[0]+','+a[1]+']':'none';
const fmt=n=>n<1e4?String(n):n<1e6?(+(n/1e3).toFixed(n%1e3?1:0))+'k':n<1e9?(+(n/1e6).toFixed(n%1e6?1:0))+'M':(+(n/1e9).toFixed(n%1e9?2:0))+'B';
const fIv=(s,e)=>s===e?fmt(s):fmt(s)+'–'+fmt(e);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function isDark(){const t=document.documentElement.dataset.theme;return t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches}
function pal(){return{ink:'#e6f1ff',muted:'#7f93ad',grid:'#1f7f95',node:'#14365a',nodeEdge:'rgba(34,211,238,.6)',slab:'#0c1a2c',edge:'#2f7f9e'}}
function chk(v){if(!Number.isInteger(v)||v<0||v>MAXID)throw new Error('IDs must be whole numbers from 0 to 1,000,000,000');return v}
function parseId(s){s=String(s).trim();if(!/^\d+$/.test(s))throw new Error('"'+s.slice(0,20)+'" is not a whole number of 0 or more');return chk(Number(s))}
function parseList(txt){const toks=txt.split(/[\s,]+/).filter(Boolean);if(!toks.length)throw new Error('Type one or more IDs, like 1, 3, 7');return toks.map(parseId)}
function parseRanges(txt){const out=[];for(const tok of txt.split(/[\s,]+/).filter(Boolean)){const m=/^(\d+)(?:-(\d+))?$/.exec(tok);if(!m)throw new Error('"'+tok.slice(0,20)+'" should look like 20 or 12-14');
  const a=chk(+m[1]),b=m[2]!==undefined?chk(+m[2]):a;if(a>b)throw new Error(tok+' runs backwards');out.push([a,b])}return out}

let ix=new IntervalIndex(),orc=new Oracle(),ops=[],cur=0,queue=[],playing=true,stepOnce=false,busy=false,gen=0;
let colorOf=new Map(),visHist=[],heightHist=[],logLines=[],query=null,scale='linear',debug=false,bugged=false,opRes=[],opTimes=[];
const caseCount={};let rotTotal=0;
const hooks=[];function onChange(f){hooks.push(f)}function changed(){for(const f of hooks){try{f()}catch(e){console.error(e)}}}

/* ---------- reusable 3D tree + track view ---------- */
function TreeView(canvas,o){
  const V={nodes:new Map(),edges:[],dying:[],glow:new Map(),tags:new Map(),rings:[],pkg:null,sweep:null,focus:null,sel:null,hover:null,track:null,trackFrom:null,W:12,minY:0,trackY:-4,capped:false,height:0,count:0};
  const SPX=3.9,SPY=2.7,TZ=2.6;const trk=()=>typeof o.track==='function'?o.track():!!o.track;const halo=()=>typeof o.halo==='function'?o.halo():!!o.halo;
  const PT=[];for(let i=0;i<(o.particles||0);i++)PT.push([Math.random()*2-1,Math.random()*14-6,Math.random()*30-22,Math.random()*6.28]);
  const S=Mini3D(canvas,{theta:o.theta??0.42,phi:o.phi??1.2,minDist:o.minDist||12,fog:o.fog||null,build,onPick:id=>{V.sel=id==null?null:(typeof id==='string'?+id.slice(1):id);o.onSelect&&o.onSelect(info(V.sel))},
    onHover:id=>{V.hover=id==null?null:(typeof id==='string'?+id.slice(1):id);o.onHover&&o.onHover(V.hover)}});
  const baseTheta=o.theta??0.42;
  function cur(q,now){const k=ease(Math.min(1,Math.max(0,(now-q.t0)/q.dur)));return[q.from[0]+(q.to[0]-q.from[0])*k,q.from[1]+(q.to[1]-q.from[1])*k,q.from[2]+(q.to[2]-q.from[2])*k]}
  function snapshot(){const I=o.getIx();const total=I.count;const cap=total>(o.cap||300)?(o.capDepth||7):Infinity;const out=[];let i=0;
    (function w(n,d,p){if(!n||d>cap)return;w(n.l,d+1,n.id);out.push({id:n.id,s:n.s,e:n.e,h:n.h,bf:(n.l?n.l.h:0)-(n.r?n.r.h:0),d,p,i:i++,l:n.l?[n.l.s,n.l.e]:null,r:n.r?[n.r.s,n.r.e]:null});w(n.r,d+1,n.id)})(I.root,1,null);
    return{list:out,capped:total>(o.cap||300),height:I.height(),count:total}}
  function buildTrack(W){const I=o.getIx();const q=o.getQuery?o.getQuery():null;const sc=o.getScale?o.getScale():'linear';let A,B,blocks,gaps;
    if(q){const r=I.query(q[0],q[1]);A=q[0];B=q[1];blocks=r.intervals;gaps=r.gaps}
    else{blocks=I.intervals();if(!blocks.length)return{empty:true,W};A=blocks[0][0];B=blocks[blocks.length-1][1];gaps=[];for(let i=1;i<blocks.length;i++)gaps.push([blocks[i-1][1]+1,blocks[i][0]-1])}
    let segs=[...blocks.map(b=>({s:b[0],e:b[1],g:0})),...gaps.map(b=>({s:b[0],e:b[1],g:1}))].sort((a,b)=>a.s-b.s);const more=segs.length>600;if(more)segs=segs.slice(0,600);
    const x0=-W/2,span=W;
    if(sc==='linear'){const tot=B-A+1;for(const s of segs){s.x0=x0+(s.s-A)/tot*span;s.x1=x0+(s.e-A+1)/tot*span}}
    else{const wt=s=>s.g&&s.e-s.s+1>3?2.2:1+Math.log10(s.e-s.s+1);const tot=segs.reduce((a,s)=>a+wt(s),0);let x=x0;for(const s of segs){const w=wt(s)/tot*span;s.x0=x;s.x1=x+w;x+=w}}
    for(const s of segs)if(!s.g){const n=I.floor(s.s);s.id=n?n.id:null}
    return{segs,A,B,W,q:!!q,sc,more}}
  function trackX(v){const T=V.track;if(!T||T.empty)return 0;const sg=T.segs;if(v<=sg[0].s)return sg[0].x0;const last=sg[sg.length-1];if(v>=last.e)return last.x1;
    for(const s of sg)if(v>=s.s&&v<=s.e)return s.x0+(v-s.s+0.5)/(s.e-s.s+1)*(s.x1-s.x0);return 0}
  function sync(animate,dur,spawn){const now=performance.now();dur=reduced?1:dur;const snap=snapshot();const cnt=snap.list.length;const ids=new Set();let maxD=1;
    for(const q of snap.list){q.x=(q.i-(cnt-1)/2)*SPX;q.y=-(q.d-1)*SPY;ids.add(q.id);maxD=Math.max(maxD,q.d);
      const old=V.nodes.get(q.id);const sp=spawn&&spawn.get(q.id);const cp=old?cur(old,now):sp?sp.slice():[q.x,q.y+(animate?8:0),0];q.from=animate?cp:[q.x,q.y,0];q.to=[q.x,q.y,0];q.t0=now;q.dur=animate?dur:1;V.nodes.set(q.id,q)}
    for(const [id,old] of V.nodes)if(!ids.has(id)){if(animate)V.dying.push(Object.assign({},old,{from:cur(old,now),to:cur(old,now),t0:now,dur}));V.nodes.delete(id)}
    V.edges=snap.list.filter(q=>q.p!=null&&ids.has(q.p)).map(q=>[q.p,q.id]);V.capped=snap.capped;V.height=snap.height;V.count=snap.count;
    const oldT=V.track;V.W=Math.max(cnt*SPX,trk()?18:10);V.minY=-(maxD-1)*SPY;V.trackY=V.minY-3.6;V.track=trk()?buildTrack(V.W):null;
    if(animate&&oldT&&!oldT.empty&&V.track&&!V.track.empty){const m=new Map();for(const s of oldT.segs)m.set(s.s+':'+s.g,[s.x0,s.x1]);V.trackFrom={m,t0:now,dur}}else V.trackFrom=null;
    S.fit([-V.W/2-1,V.W/2+1,trk()?V.trackY-1.2:V.minY-1,1.6,-1,trk()?TZ+1:1]);
    if(V.sel!=null&&!V.nodes.has(V.sel)){V.sel=null;o.onSelect&&o.onSelect(null)}
    if(o.onSync)o.onSync(V)}
  function build(S,now){const P=pal();const t=S.time;const tr=!!V.track;
    if(o.drift&&!reduced&&!S.userMoved)S.theta=baseTheta+Math.sin(t*0.12)*0.22;
    const fy=(tr?V.trackY:V.minY)-1.0;S.floor(fy,[-V.W/2-3,V.W/2+3,-3,tr?TZ+3:3],P.grid,14,0.35);
    for(const p of PT){const x=p[0]*(V.W/2+10)+(reduced?0:Math.sin(t*0.2+p[3])*0.8),y=p[1]+(reduced?0:Math.sin(t*0.3+p[3]*2)*0.6);S.dot([x,y,p[2]],0.05,'#7dd3fc',0.55)}
    V.dying=V.dying.filter(q=>now-q.t0<q.dur);V.rings=V.rings.filter(r=>now-r.t0<900);
    const pos=new Map();for(const [id,q] of V.nodes)pos.set(id,cur(q,now));
    if(V.focus&&!S.userMoved){if(now<V.focus.until&&pos.get(V.focus.id)){const p=pos.get(V.focus.id);S.goal={tgt:[p[0],p[1]-0.5,p[2]],dist:Math.max(10,(S._fitDist||20)*0.62)}}else{V.focus=null;if(S._lastFit)S.fit(S._lastFit)}}
    for(const [a,b] of V.edges){const p=pos.get(a),c=pos.get(b);if(p&&c)S.line([[p[0],p[1]-0.58,p[2]],[c[0],c[1]+0.58,c[2]]],{color:P.edge,width:2})}
    const focus=V.hover!=null?V.hover:V.sel;const hl=halo();
    for(const [id,q] of V.nodes){const p=pos.get(id);const gl=V.glow.get(id)||(id===V.sel?'#22d3ee':id===V.hover?'#67e8f9':null);
      const cc=o.colorOf&&o.colorOf(id);if(hl)S.glowDot(p,2.6,cc||'#22d3ee',cc?0.45:0.22);
      S.box({x:p[0],y:p[1],z:p[2],w:3.3,h:1.15,d:1.15,color:cc||P.node,edge:cc?null:P.nodeEdge,id,glow:gl,label:fIv(q.s,q.e),sub:o.debug&&o.debug()?'h'+q.h+' · bf '+q.bf:null});
      const tg=V.tags.get(id);if(tg)S.label([p[0],p[1]+1.25,p[2]],tg.t,{size:0.5,pill:tg.c||'#ffb400',color:tg.tc||'#2a1c00'})}
    for(const r of V.rings){const p=r.id!=null?pos.get(r.id):r.p;if(!p)continue;const k=(now-r.t0)/900;S.ring([p[0],p[1]-0.55,p[2]],1.9+k*3.2,{color:r.c,width:3,alpha:(1-k)*0.9,zBias:-2})}
    for(const q of V.dying){const k=Math.min(1,(now-q.t0)/q.dur),s=Math.max(0.05,1-k);S.box({x:q.from[0],y:q.from[1],z:0,w:3.3*s,h:1.15*s,d:1.15*s,color:(o.colorOf&&o.colorOf(q.id))||P.node,alpha:1-k,shadow:false})}
    if(V.pkg){const g=V.pkg;const el=now-g.t0;let idx=Math.min(g.path.length-1,Math.floor(el/g.step));let target;
      if(g.path.length&&pos.get(g.path[Math.max(0,idx)])){const p=pos.get(g.path[Math.max(0,idx)]);target=[p[0],p[1]+1.55,p[2]]}else target=[0,2.2,0];
      if(!g.p)g.p=[target[0],target[1]+5,target[2]];for(let i=0;i<3;i++)g.p[i]+=(target[i]-g.p[i])*0.18;
      if(hl)S.glowDot(g.p,2,g.color||'#ffb400',0.6);S.box({x:g.p[0],y:g.p[1],z:g.p[2],w:1.5,h:0.9,d:0.9,color:g.color||'#ffb400',label:fmt(g.x),labelColor:'#2a1c00',shadow:true})}
    if(V.track){const T=V.track,y=V.trackY;S.box({x:0,y,z:TZ,w:T.W+1.4,h:0.36,d:1.7,color:P.slab,edge:'rgba(34,211,238,.35)',shadow:false});
      if(T.empty){S.label([0,y+0.9,TZ],'Nothing has arrived yet',{size:0.6,color:P.muted})}
      else{let lastL=-1e9;const TF=V.trackFrom;const kk=TF?ease(Math.min(1,(now-TF.t0)/TF.dur)):1;if(TF&&kk>=1)V.trackFrom=null;
        const X=s=>{const f=TF&&TF.m.get(s.s+':'+s.g);return f?[f[0]+(s.x0-f[0])*kk,f[1]+(s.x1-f[1])*kk]:[s.x0,s.x1]};
        if(T.q)S.box({x:0,y:y+0.55,z:TZ,w:T.W+0.6,h:1.5,d:2.1,color:'#22d3ee',alpha:0.1,shadow:false});
        for(const s of T.segs){let [x0,x1]=X(s);if(s.g){S.line([[x0,y+0.2,TZ],[x1,y+0.2,TZ]],{color:'#ef4444',width:3,dash:[5,4]});
            if(T.sc==='compressed'&&s.e-s.s+1>3)S.label([(x0+x1)/2,y+0.55,TZ+0.9],'//',{size:0.55,color:'#ef4444'});continue}
          if(x1-x0<0.35){const c=(x0+x1)/2;x0=c-0.175;x1=c+0.175}
          const hb=s.id!=null&&s.id===focus;const bc=o.colorOf&&o.colorOf(s.id);S.box({x:(x0+x1)/2,y:y+0.5,z:TZ,w:x1-x0,h:0.55,d:1.1,color:bc||'#1e5a8a',edge:bc?null:P.nodeEdge,id:'b'+s.id,glow:hb?'#22d3ee':null,shadow:false});
          if(x0-lastL>3){S.label([x0,y+1.3,TZ],fmt(s.s),{size:0.6,color:P.ink,align:'left'});lastL=x0}}
        S.label([-T.W/2,y-0.75,TZ+0.9],(T.q?'window ':'')+T.A.toLocaleString(),{size:0.55,color:P.muted,align:'left'});
        S.label([T.W/2,y-0.75,TZ+0.9],T.B.toLocaleString()+(T.more?' (first 600 pieces)':''),{size:0.55,color:P.muted,align:'right'});
        if(V.sweep){const w=V.sweep;const k=Math.min(1,(now-w.t0)/w.dur);const xa=trackX(w.a),xb=trackX(w.b);const xe=xa+(xb-xa)*ease(k);
          S.box({x:(xa+xe)/2,y:y+0.6,z:TZ,w:Math.max(0.2,xe-xa),h:1.0,d:1.6,color:w.c||'#8b5cf6',alpha:0.45,shadow:false});if(hl)S.glowDot([xe,y+0.8,TZ],1.6,w.c||'#8b5cf6',0.7);
          if(k>=1&&now-w.t0>w.dur+600)V.sweep=null}}
      if(focus!=null&&pos.get(focus)&&T.segs){const seg=T.segs.find(s=>!s.g&&s.id===focus);if(seg){const p=pos.get(focus);const bx=(seg.x0+seg.x1)/2;
        S.curve([p[0],p[1]-0.6,p[2]+0.3],[(p[0]+bx)/2,(p[1]+y)/2,TZ+2.2],[bx,y+0.8,TZ],{color:'#22d3ee',width:3,dash:[8,7],dashOff:-t*40});
        const k=(t*0.8)%1,u=1-k;const pp=[u*u*p[0]+2*u*k*(p[0]+bx)/2+k*k*bx,u*u*(p[1]-0.6)+2*u*k*(p[1]+y)/2+k*k*(y+0.8),u*u*(p[2]+0.3)+2*u*k*(TZ+2.2)+k*k*TZ];
        S.glowDot(pp,0.9,'#22d3ee',0.9);S.dot(pp,0.12,'#e0faff',1)}}}}
  function info(id){const q=V.nodes.get(id);if(!q)return null;return q}
  function idAt(iv2){for(const [id,q] of V.nodes)if(q.s===iv2[0]&&q.e===iv2[1])return id;return null}
  return{S,V,sync,glow:(id,c)=>V.glow.set(id,c||'#ffb400'),clearGlow:()=>V.glow.clear(),tag:(id,t,c,tc)=>{if(id!=null)V.tags.set(id,{t,c,tc})},clearTags:()=>V.tags.clear(),
    ring:(id,c)=>{if(id!=null)V.rings.push({id,c:c||'#22d3ee',t0:performance.now()})},sweep:(a,b,dur,c)=>{V.sweep={a,b,dur:reduced?1:dur,c,t0:performance.now()}},
    focus:(id,ms)=>{V.focus={id,until:performance.now()+ms}},idAt,posOf:id=>{const q=V.nodes.get(id);return q?cur(q,performance.now()):null},
    pkg:(x,path,step,color)=>{V.pkg={x,path,step,color,t0:performance.now()}},clearPkg:()=>{V.pkg=null},resetView:()=>{S.resetView()},snap:()=>S.snap(),info}}

/* ---------- shared animated operation (path, tags, ±2 flash, sweep, split, rings) ---------- */
async function animOp(view,I,r,o){/* r: result already applied to I; view still shows the old tree */
  const base=o.base,alive=o.alive||(()=>true),stepMs=base*0.32;
  if(r.op==='insert'||r.op==='delete'){view.pkg(r.x,r.path,stepMs,r.op==='delete'?'#fca5a5':'#ffb400');for(const id of r.path){view.glow(id);await sleep(stepMs);if(!alive())return false}}
  if(r.op==='insert'){view.tag(r.floorId,'floor('+r.x+')');if(r.higherId!==r.floorId)view.tag(r.higherId,'higher('+r.x+')')}
  if(r.op==='range'){view.clearGlow();for(const a of r.absorbed){const id=view.idAt(a);if(id!=null)view.glow(id,'#8b5cf6')}view.sweep(r.L,r.R,base*1.2,'#8b5cf6');await sleep(base*1.3);if(!alive())return false}
  if(r.op==='delete'&&r.floorId!=null){view.glow(r.floorId,'#ef4444');view.tag(r.floorId,r.kind==='SPLIT'?'split at '+r.x:r.kind==='NOT_PRESENT'?'not here':'remove '+r.x,'#ef4444','#fff')}
  o.onCase&&o.onCase(r);await sleep(base*0.55);if(!alive())return false;
  if(r.rot&&r.rot.length){view.clearTags();view.clearGlow();for(const ro of r.rot){const id=view.idAt(ro.at);if(id!=null){view.glow(id,'#ef4444');view.tag(id,'bf '+(ro.type[0]==='L'?'+2':'−2')+' → '+ro.type,'#ef4444','#fff')}}
    o.onRotate&&o.onRotate(r);await sleep(base*0.9);if(!alive())return false}
  view.clearPkg();view.clearTags();view.clearGlow();
  let spawn=null;if(r.kind==='SPLIT'&&r.floorId!=null){const p=view.posOf(r.floorId);if(p){spawn=new Map([[r.id,p]])}}
  view.sync(true,base,spawn);if(r.id!=null){view.glow(r.id,COL[r.kind]);view.ring(r.id,COL[r.kind]);if(o.focus)view.focus(r.id,base*2.2)}
  Sfx.play(r.kind);
  await sleep(base*1.1);if(!alive())return false;view.clearGlow();return true}

/* ---------- optional sound (Web Audio, muted by default) ---------- */
const Sfx={on:false,ctx:null,
  toggle(){this.on=!this.on;if(this.on&&!this.ctx){try{this.ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){this.on=false}}if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume();return this.on},
  tone(f,t0,d,g){const c=this.ctx,o=c.createOscillator(),a=c.createGain();o.type='sine';o.frequency.value=f;a.gain.setValueAtTime(0,t0);a.gain.linearRampToValueAtTime(g,t0+0.02);a.gain.exponentialRampToValueAtTime(0.0001,t0+d);o.connect(a).connect(c.destination);o.start(t0);o.stop(t0+d+0.05)},
  play(kind){if(!this.on||!this.ctx)return;try{const t=this.ctx.currentTime;const F={NEW:[523.25],EXTEND_LEFT:[587.33],EXTEND_RIGHT:[659.25],BRIDGE:[523.25,659.25,783.99],DUPLICATE:[220],RANGE:[392,493.88,587.33],SPLIT:[349.23,293.66],SHRINK:[349.23],REMOVED:[261.63],NOT_PRESENT:[196]}[kind]||[440];
    F.forEach((f,i)=>this.tone(f,t+(kind==='BRIDGE'?0:i*0.06),kind==='BRIDGE'?1.4:0.6,0.08))}catch(e){}}};

/* ---------- routing ---------- */
const ROUTES=['story','index','tree','dashboard','compare','bridge','tests','data'];
function route(){let h=(location.hash||'#index').slice(1);if(!ROUTES.includes(h))h='index';
  for(const r of ROUTES){$('v-'+r).classList.toggle('on',r===h)}
  document.querySelectorAll('.tabs a').forEach(a=>{if(a.getAttribute('href')==='#'+h)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  window.__route=h;document.body.classList.toggle('story-on',h==='story');changed();if(window.onRoute)window.onRoute(h)}
addEventListener('hashchange',()=>{route();scrollTo(0,0)});

/* ---------- badges ---------- */
function updateBadges(){const errs=bugged?['Injected bug: '+bugged].concat(ix.check()):ix.check();const ok=same(ix.intervals(),orc.intervals());
  $('invBadge').classList.toggle('bad',errs.length>0);$('invBadge').querySelector('span').textContent=errs.length?'Invariant broken':'Invariants OK';
  $('orcBadge').classList.toggle('bad',!ok);$('orcBadge').querySelector('span').textContent=ok?'Brute force OK':'Brute force differs';
  $('invText').textContent=(errs.length?errs.slice(0,5).join('; ')+'.':'Ranges are sorted, never overlap or touch, every cached height is right'+(ix.balanced?', and every node is AVL-balanced.':'.'))+' '+
    (ok?'A simple sorted-list version, rebuilt by brute force after every operation, gives the same ranges.':'Brute force has '+JSON.stringify(orc.intervals().slice(0,6))+' but the tree has '+JSON.stringify(ix.intervals().slice(0,6))+'.')}
onChange(updateBadges);
$('invBadge').onclick=$('orcBadge').onclick=()=>{location.hash='#data';setTimeout(()=>{$('invDetails').open=true;$('invDetails').scrollIntoView({block:'center'})},50)};
