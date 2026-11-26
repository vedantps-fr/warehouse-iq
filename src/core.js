const MAXID=1e9;
class IntervalIndex{
  constructor(balanced=true){this.root=null;this.balanced=balanced;this.count=0;this.uid=1;this.visits=0;this.rot=[];}
  hh(n){return n?n.h:0}
  upd(n){n.h=1+Math.max(this.hh(n.l),this.hh(n.r))}
  rotR(n){const l=n.l;n.l=l.r;l.r=n;this.upd(n);this.upd(l);return l}
  rotL(n){const r=n.r;n.r=r.l;r.l=n;this.upd(n);this.upd(r);return r}
  fix(n){
    this.upd(n);if(!this.balanced)return n;
    const b=this.hh(n.l)-this.hh(n.r),at=[n.s,n.e];
    if(b>1){if(this.hh(n.l.l)>=this.hh(n.l.r)){this.rot.push({type:'LL',at});return this.rotR(n)}
      this.rot.push({type:'LR',at});n.l=this.rotL(n.l);return this.rotR(n)}
    if(b<-1){if(this.hh(n.r.r)>=this.hh(n.r.l)){this.rot.push({type:'RR',at});return this.rotL(n)}
      this.rot.push({type:'RL',at});n.r=this.rotR(n.r);return this.rotL(n)}
    return n;
  }
  addNode(s,e){
    const ins=n=>{if(!n){this.count++;return{id:this.uid++,s,e,h:1,l:null,r:null}}
      if(s<n.s)n.l=ins(n.l);else n.r=ins(n.r);return this.fix(n)};
    this.root=ins(this.root);
  }
  removeNode(s){
    const del=(n,k)=>{if(!n)return null;
      if(k<n.s)n.l=del(n.l,k);else if(k>n.s)n.r=del(n.r,k);
      else{if(!n.l||!n.r){this.count--;return n.l||n.r}
        let m=n.r;while(m.l)m=m.l;n.s=m.s;n.e=m.e;n.id=m.id;n.r=del(n.r,m.s)}
      return this.fix(n)};
    this.root=del(this.root,s);
  }
  floor(x,path){let n=this.root,b=null;while(n){this.visits++;if(path)path.push(n.id);if(n.s<=x){b=n;n=n.r}else n=n.l}return b}
  higher(x,path){let n=this.root,b=null;while(n){this.visits++;if(path)path.push(n.id);if(n.s>x){b=n;n=n.l}else n=n.r}return b}
  collect(lo,hi){const out=[];const w=n=>{if(!n)return;this.visits++;if(n.s>lo)w(n.l);if(n.s<=hi&&n.e>=lo)out.push(n);if(n.s<=hi)w(n.r)};w(this.root);return out}
  insert(x){
    this.rot=[];const v0=this.visits,fp=[],hp=[];
    const L=this.floor(x,fp),R=this.higher(x,hp);const vis=this.visits-v0;
    const res={op:'insert',x,floor:L?[L.s,L.e]:null,higher:R?[R.s,R.e]:null,floorId:L?L.id:null,higherId:R?R.id:null,path:[...new Set([...fp,...hp])]};
    if(L&&L.e>=x){res.kind='DUPLICATE'}
    else{const lt=!!(L&&L.e===x-1),rt=!!(R&&R.s===x+1);
      if(lt&&rt){const e=R.e;this.removeNode(R.s);const n=this.floor(x);n.e=e;res.kind='BRIDGE';res.result=[n.s,n.e];res.id=n.id}
      else if(lt){L.e=x;res.kind='EXTEND_RIGHT';res.result=[L.s,L.e];res.id=L.id}
      else if(rt){R.s=x;res.kind='EXTEND_LEFT';res.result=[R.s,R.e];res.id=R.id}
      else{this.addNode(x,x);res.kind='NEW';res.result=[x,x];res.id=this.floor(x).id}}
    res.rot=this.rot;res.visited=vis;return res;
  }
  insertRange(a,b){
    this.rot=[];const v0=this.visits;const hit=this.collect(a-1,b+1);const vis=this.visits-v0;
    let s=a,e=b;if(hit.length){s=Math.min(a,hit[0].s);e=Math.max(b,hit[hit.length-1].e)}
    const absorbed=hit.map(n=>[n.s,n.e]);for(const [k] of absorbed)this.removeNode(k);
    this.addNode(s,e);const n=this.floor(s);
    return{op:'range',L:a,R:b,kind:'RANGE',absorbed,result:[s,e],id:n.id,rot:this.rot,visited:vis,path:[]};
  }
  delete(x){
    this.rot=[];const v0=this.visits,path=[];const n=this.floor(x,path);const vis=this.visits-v0;const res={op:'delete',x,path,floorId:n?n.id:null};
    if(!n||n.e<x){res.kind='NOT_PRESENT'}
    else{const was=[n.s,n.e];res.was=was;
      if(n.s===n.e){this.removeNode(n.s);res.kind='REMOVED';res.result=[]}
      else if(x===n.s){n.s=x+1;res.kind='SHRINK';res.result=[[n.s,n.e]];res.id=n.id}
      else if(x===n.e){n.e=x-1;res.kind='SHRINK';res.result=[[n.s,n.e]];res.id=n.id}
      else{const e=n.e;n.e=x-1;this.addNode(x+1,e);res.kind='SPLIT';res.result=[[was[0],x-1],[x+1,e]];res.id=this.floor(x+1).id}}
    res.rot=this.rot;res.visited=vis;return res;
  }
  query(a,b){
    if(!(a<=b))throw new Error('L must be ≤ R');
    const v0=this.visits;const ivs=this.collect(a,b).map(n=>[Math.max(a,n.s),Math.min(b,n.e)]);
    const gaps=[];let c=a;for(const [s,e] of ivs){if(s>c)gaps.push([c,s-1]);c=e+1}if(c<=b)gaps.push([c,b]);
    return{intervals:ivs,gaps,visited:this.visits-v0};
  }
  intervals(){const out=[],st=[];let n=this.root;while(n||st.length){while(n){st.push(n);n=n.l}n=st.pop();out.push([n.s,n.e]);n=n.r}return out}
  height(){return this.hh(this.root)}
  setBalanced(b){
    this.balanced=b;if(!b)return;
    const iv=this.intervals();const build=(lo,hi)=>{if(lo>hi)return null;const m=(lo+hi)>>1;
      const n={id:this.uid++,s:iv[m][0],e:iv[m][1],l:build(lo,m-1),r:build(m+1,hi),h:1};this.upd(n);return n};
    this.root=build(0,iv.length-1);
  }
  check(){
    const errs=[];let cnt=0;
    const w=n=>{if(!n)return 0;cnt++;const a=w(n.l),b=w(n.r);const h=1+Math.max(a,b);
      if(n.h!==h)errs.push('stale height at ['+n.s+','+n.e+']');
      if(this.balanced&&Math.abs(a-b)>1)errs.push('AVL balance broken at ['+n.s+','+n.e+']');
      if(n.s>n.e)errs.push('start > end at ['+n.s+','+n.e+']');return h};
    w(this.root);
    const iv=this.intervals();for(let i=1;i<iv.length;i++)if(!(iv[i-1][1]+1<iv[i][0]))errs.push('['+iv[i-1]+'] and ['+iv[i]+'] overlap or touch');
    if(cnt!==this.count)errs.push('node count '+cnt+' ≠ '+this.count);
    return errs;
  }
}
class Oracle{
  constructor(){this.iv=[]}
  norm(){this.iv.sort((a,b)=>a[0]-b[0]);const o=[];for(const [s,e] of this.iv){const t=o[o.length-1];if(t&&s<=t[1]+1)t[1]=Math.max(t[1],e);else o.push([s,e])}this.iv=o}
  insert(x){this.iv.push([x,x]);this.norm()}
  insertRange(a,b){this.iv.push([a,b]);this.norm()}
  delete(x){const o=[];for(const [s,e] of this.iv){if(x<s||x>e){o.push([s,e]);continue}if(s<x)o.push([s,x-1]);if(x<e)o.push([x+1,e])}this.iv=o}
  intervals(){return this.iv.map(a=>a.slice())}
}
function applyOp(ix,orc,op){
  if(op.t==='ins'){orc&&orc.insert(op.x);return ix.insert(op.x)}
  if(op.t==='rng'){orc&&orc.insertRange(op.L,op.R);return ix.insertRange(op.L,op.R)}
  if(op.t==='del'){orc&&orc.delete(op.x);return ix.delete(op.x)}
  if(op.t==='mode'){ix.setBalanced(op.b);return{op:'mode',kind:'MODE',b:op.b,rot:[],path:[],visited:0}}
}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function mkRng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}}
function runTests(){
  const T=[];const now=()=>(typeof performance!=='undefined'?performance:Date).now();const t=(name,fn)=>{const t0=now();try{const r=fn();T.push({name,ok:r===true,detail:r===true?'':String(r),ms:now()-t0})}catch(e){T.push({name,ok:false,detail:e.message,ms:now()-t0})}};
  const build=(xs,bal=true)=>{const ix=new IntervalIndex(bal);for(const x of xs)ix.insert(x);return ix};
  t('Problem example: 1,3,7,2,6',()=>{const ix=build([1,3,7,2,6]);const q=ix.query(1,7);
    return same(ix.intervals(),[[1,3],[6,7]])&&same(q.gaps,[[4,5]])||'got '+JSON.stringify(ix.intervals())});
  t('Bridge merge: 1, 3, then 2',()=>{const ix=build([1,3]);const r=ix.insert(2);return r.kind==='BRIDGE'&&same(ix.intervals(),[[1,3]])||r.kind});
  t('Bridge merge: [1,3] [5,8] plus 4',()=>{const ix=build([1,2,3,5,6,7,8]);const r=ix.insert(4);return r.kind==='BRIDGE'&&same(ix.intervals(),[[1,8]])&&ix.count===1||r.kind});
  t('Duplicate at endpoint: 5, 5',()=>{const ix=build([5]);const h=JSON.stringify(ix.root);const r=ix.insert(5);return r.kind==='DUPLICATE'&&JSON.stringify(ix.root)===h||'changed'});
  t('Duplicate inside an interval: [1,10] then 5',()=>{const ix=new IntervalIndex();ix.insertRange(1,10);const r=ix.insert(5);return r.kind==='DUPLICATE'&&same(ix.intervals(),[[1,10]])||r.kind});
  t('Extend left / right: 5 then 4; 5 then 6',()=>{const a=build([5]);const r1=a.insert(4);const b=build([5]);const r2=b.insert(6);
    return r1.kind==='EXTEND_LEFT'&&same(a.intervals(),[[4,5]])&&r2.kind==='EXTEND_RIGHT'&&same(b.intervals(),[[5,6]])||r1.kind+'/'+r2.kind});
  t('Sparse IDs: 0, 10^9, 500000000',()=>{const ix=build([0,MAXID,500000000]);const q=ix.query(0,MAXID);
    return ix.count===3&&same(q.gaps,[[1,499999999],[500000001,999999999]])||JSON.stringify(q.gaps)});
  t('Boundaries: 0 and 10^9, clipped queries',()=>{const ix=build([0,1,MAXID-1,MAXID]);const a=ix.query(0,0),b=ix.query(1,5),c=ix.query(MAXID,MAXID);
    return same(a.intervals,[[0,0]])&&same(b.intervals,[[1,1]])&&same(b.gaps,[[2,5]])&&same(c.intervals,[[MAXID,MAXID]])||'clip wrong'});
  t('Window cutting through a range',()=>{const ix=build([1,2,3,6,7]);const q=ix.query(2,6);return same(q.intervals,[[2,3],[6,6]])&&same(q.gaps,[[4,5]])||JSON.stringify(q)});
  t('Sorted worst case (2000 IDs): AVL height ≤ 1.44 log2 n',()=>{const xs=[];for(let i=1;i<=2000;i++)xs.push(2*i);const ix=build(xs);const bound=1.44*Math.log2(2002);
    return ix.height()<=bound&&ix.check().length===0||'height '+ix.height()});
  t('Sorted worst case: Unbalanced height is 2000',()=>{const xs=[];for(let i=1;i<=2000;i++)xs.push(2*i);const ix=build(xs,false);return ix.height()===2000||'height '+ix.height()});
  for(const [type,xs] of [['LL',[30,20,10]],['RR',[10,20,30]],['LR',[30,10,20]],['RL',[10,30,20]]])
    t('Rotation '+type,()=>{const ix=new IntervalIndex();let rs=[];for(const x of xs)rs=rs.concat(ix.insert(x).rot);
      return rs.length===1&&rs[0].type===type&&ix.check().length===0&&ix.height()===2||JSON.stringify(rs)});
  t('insertRange absorbs several intervals',()=>{const ix=build([1,5,9,20,40]);const r=ix.insertRange(4,21);return same(ix.intervals(),[[1,1],[4,21],[40,40]])&&r.absorbed.length===3||JSON.stringify(ix.intervals())});
  t('insertRange joins touching neighbours',()=>{const ix=build([1,2,9]);ix.insertRange(3,8);return same(ix.intervals(),[[1,9]])||JSON.stringify(ix.intervals())});
  t('Delete split: [1,10] minus 5',()=>{const ix=new IntervalIndex();ix.insertRange(1,10);const r=ix.delete(5);return r.kind==='SPLIT'&&same(ix.intervals(),[[1,4],[6,10]])||r.kind});
  t('Delete edge cases',()=>{const ix=new IntervalIndex();ix.insertRange(1,10);ix.insert(20);
    const a=ix.delete(1),b=ix.delete(10),c=ix.delete(20),d=ix.delete(50);
    return a.kind==='SHRINK'&&b.kind==='SHRINK'&&c.kind==='REMOVED'&&d.kind==='NOT_PRESENT'&&same(ix.intervals(),[[2,9]])||[a.kind,b.kind,c.kind,d.kind].join(',')});
  t('Query edge cases',()=>{const ix=build([5,6,7]);let err=false;try{ix.query(9,3)}catch(e){err=true}
    const out=ix.query(100,200),full=ix.query(5,7);return err&&same(out.gaps,[[100,200]])&&full.gaps.length===0||'bad'});
  t('Random fuzz: 10,000 mixed ops vs brute force',()=>{const rnd=mkRng(12345);const ix=new IntervalIndex(),o=new Oracle();
    for(let i=0;i<10000;i++){const p=rnd();let op;
      if(p<0.6)op={t:'ins',x:Math.floor(rnd()*400)};else if(p<0.75){const a=Math.floor(rnd()*400);op={t:'rng',L:a,R:a+Math.floor(rnd()*12)}}
      else if(p<0.98)op={t:'del',x:Math.floor(rnd()*400)};else op={t:'mode',b:rnd()<0.5};
      applyOp(ix,o,op);if(i%250===0||i===9999){if(!same(ix.intervals(),o.intervals()))return'mismatch at op '+i;const e=ix.check();if(e.length)return e[0]+' at op '+i}}
    return true});
  return T;
}
function fuzzMismatches(n,seed){const rnd=mkRng(seed||99);const ix=new IntervalIndex(),o=new Oracle();let bad=0,inv=0;
  for(let i=0;i<n;i++){const p=rnd();let op;if(p<0.6)op={t:'ins',x:Math.floor(rnd()*400)};else if(p<0.75){const a=Math.floor(rnd()*400);op={t:'rng',L:a,R:a+Math.floor(rnd()*12)}}else if(p<0.98)op={t:'del',x:Math.floor(rnd()*400)};else op={t:'mode',b:rnd()<0.5};
    applyOp(ix,o,op);if(!same(ix.intervals(),o.intervals()))bad++;if(i%500===0&&ix.check().length)inv++}return{ops:n,mismatches:bad,invariantFailures:inv}}
if(typeof module!=='undefined')module.exports={IntervalIndex,Oracle,applyOp,runTests,mkRng,same,MAXID,fuzzMismatches};
