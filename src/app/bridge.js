/* ---------- Bridge demo section ---------- */
let brB=new IntervalIndex(),brA=new IntervalIndex(),brCol0=new Map(),brCol1=new Map(),brGen=0,brCfg=null;
const brV0=TreeView($('cvB0'),{getIx:()=>brB,colorOf:id=>brCol0.get(id),track:true,minDist:10,theta:0.25,phi:1.25});
const brV1=TreeView($('cvB1'),{getIx:()=>brA,colorOf:id=>brCol1.get(id),track:true,minDist:10,theta:0.25,phi:1.25});
function brRead(){const a=parseId($('bA').value),b=parseId($('bB').value),c=parseId($('bC').value),d=parseId($('bD').value);
  if(a>b||c>d)throw new Error('Each range must run from a smaller number to a larger one');
  if(c!==b+2)throw new Error('The right range must start at '+(b+2)+' so exactly one ID ('+(b+1)+') is missing');
  const other=$('bOther').value.trim()?parseRanges($('bOther').value):[];
  for(const [s,e] of other)if(e>=a-1&&s<=d+1)throw new Error('Other range ['+s+','+e+'] touches the two ranges; move it away');
  return{a,b,c,d,x:b+1,other}}
function brSetup(){let cfg;try{cfg=brRead();$('bErr').textContent=''}catch(e){$('bErr').textContent=e.message;return false}
  brGen++;brCfg=cfg;const mk=()=>{const I=new IntervalIndex();for(const [s,e] of cfg.other)I.insertRange(s,e);I.insertRange(cfg.a,cfg.b);I.insertRange(cfg.c,cfg.d);return I};
  brB=mk();brA=mk();brCol0=new Map();brCol1=new Map();
  const L=brB.floor(cfg.x),R=brB.higher(cfg.x);brCol0.set(L.id,'#3b82f6');brCol0.set(R.id,'#3b82f6');
  const L1=brA.floor(cfg.x),R1=brA.higher(cfg.x);brCol1.set(L1.id,'#3b82f6');brCol1.set(R1.id,'#3b82f6');
  brV0.snap();brV1.snap();brV0.sync(false);brV1.sync(false);brV0.clearTags();brV0.tag(L.id,'floor('+cfg.x+')');brV0.tag(R.id,'higher('+cfg.x+')');brV1.clearTags();brV1.clearGlow();
  $('bSteps').innerHTML='<li>The index holds '+brB.intervals().map(iv).join(' ')+' in '+brB.count+' nodes.</li><li>ID '+cfg.x+' is missing between '+iv([cfg.a,cfg.b])+' and '+iv([cfg.c,cfg.d])+'. Press "Add the missing ID".</li>';
  $('bPlay').disabled=false;$('bPlay').textContent='Add the missing ID';return true}
async function brPlay(){if(!brCfg||brA.count!==brB.count){if(!brSetup())return;await sleep(500)}const g=brGen;const cfg=brCfg;$('bPlay').disabled=true;
  const before=brA.count,v0=brA.visits;const r=brA.insert(cfg.x);
  brV1.pkg(cfg.x,r.path,reduced?1:420,'#ffb400');for(const id of r.path){brV1.glow(id);await sleep(reduced?1:420);if(g!==brGen)return}
  brV1.tag(r.floorId,'floor('+cfg.x+')');brV1.tag(r.higherId,'higher('+cfg.x+')');await sleep(reduced?1:900);if(g!==brGen)return;
  brV1.clearPkg();brV1.clearTags();brV1.clearGlow();brCol1=new Map([[r.id,'#f97316']]);brV1.sync(true,1100);brV1.glow(r.id,'#f97316');
  $('bSteps').innerHTML='<li><b>floor('+cfg.x+')</b> walked down the tree and found '+iv(r.floor)+'.</li><li><b>higher('+cfg.x+')</b> found '+iv(r.higher)+'. Together the two searches visited '+r.visited+' nodes.</li>'+
   '<li>'+iv(r.floor)+' ends at '+(cfg.x-1)+' and '+iv(r.higher)+' starts at '+(cfg.x+1)+', so '+cfg.x+' bridges them.</li>'+
   '<li>The right node was deleted and the left node now ends at '+cfg.d+': the result is <b>'+iv(r.result)+'</b>.'+(r.rot.length?' The deletion triggered '+r.rot.map(o=>o.type).join(', ')+' rotation to stay balanced.':'')+'</li>'+
   '<li>Nodes: '+before+' before, '+brA.count+' after. '+(cfg.other.length?'The other ranges '+cfg.other.map(iv).join(' ')+' were not touched.':'')+'</li>'+
   '<li>Invariants '+(brA.check().length?'broken':'valid')+'.</li>';
  $('bPlay').disabled=false;$('bPlay').textContent='Play again';await sleep(1300);if(g===brGen)brV1.clearGlow()}
$('bBuild').onclick=brSetup;$('bPlay').onclick=brPlay;
for(const id of ['bA','bB','bC','bD','bOther'])$(id).addEventListener('input',()=>{$('bErr').textContent=''});
brSetup();
