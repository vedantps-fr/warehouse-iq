/* ---------- AVL vs Unbalanced section ---------- */
let cmpA=new IntervalIndex(true),cmpB=new IntervalIndex(false),cmpMode='sorted',cmpGen=0,cmpRot=0,cmpNew=null;
const cmpCol=id=>id===cmpNew?'#22d3ee':null;
const viewA=TreeView($('cvA'),{getIx:()=>cmpA,colorOf:cmpCol,minDist:10,theta:0.1,phi:1.42,onSync:()=>cmpStats()});
const viewB=TreeView($('cvB'),{getIx:()=>cmpB,colorOf:cmpCol,minDist:10,theta:0.1,phi:1.42,onSync:()=>cmpStats()});
function cmpStats(){const f=(I,el,bar,extra)=>{const n=I.count,h=I.height(),b=n?1.44*Math.log2(n+2):0;
  $(el).innerHTML='<b>Height '+h+'</b> with '+n+' node'+(n===1?'':'s')+' · AVL bound '+b.toFixed(1)+extra;$(bar).style.width=(n?Math.min(100,h/Math.max(40,h)*100):0)+'%'};
  f(cmpA,'cAtxt','cAbar',' · '+cmpRot+' rotation'+(cmpRot===1?'':'s'));f(cmpB,'cBtxt','cBbar',cmpB.count>1&&cmpB.height()===cmpB.count?' · one long chain':'')}
function cmpList(){const n=+$('cN').value;if(cmpMode==='sorted'){const xs=[];for(let i=1;i<=n;i++)xs.push(2*i);return xs}
  if(cmpMode==='random'){const s=new Set();const r=mkRng(Date.now());while(s.size<n)s.add(2*Math.floor(r()*500));return[...s]}
  return parseList($('cList').value)}
function cmpReset(){cmpGen++;cmpA=new IntervalIndex(true);cmpB=new IntervalIndex(false);cmpRot=0;cmpNew=null;viewA.snap();viewB.snap();viewA.sync(false);viewB.sync(false);$('cPlay').textContent='Play'}
async function cmpPlay(){let xs;try{xs=cmpList();$('cErr').textContent=''}catch(e){$('cErr').textContent=e.message;return}
  cmpReset();const g=cmpGen;$('cPlay').textContent='Playing…';
  for(const x of xs){const ra=cmpA.insert(x);cmpB.insert(x);cmpRot+=ra.rot.length;cmpNew=ra.id??null;viewA.sync(true,380);viewB.sync(true,380);await sleep(reduced?60:440);if(g!==cmpGen)return}
  cmpNew=null;$('cPlay').textContent='Play again'}
function cmpSetMode(m){cmpMode=m;for(const [id,k] of [['cSorted','sorted'],['cRandom','random'],['cCustom','custom']])$(id).classList.toggle('on',k===m);
  $('cList').style.display=m==='custom'?'block':'none';$('cN').style.display=$('cNOut').style.display=$('cN').previousElementSibling.style.display=m==='custom'?'none':'';
  $('cDesc').textContent=m==='sorted'?'Sorted: 2, 4, 6 … (spaced so they never merge into one range).':m==='random'?'Random even numbers below 1,000, so most stay separate ranges.':'Type your own IDs in the order they arrive.'}
$('cSorted').onclick=()=>cmpSetMode('sorted');$('cRandom').onclick=()=>cmpSetMode('random');$('cCustom').onclick=()=>cmpSetMode('custom');
$('cN').oninput=e=>$('cNOut').textContent=e.target.value;$('cPlay').onclick=cmpPlay;$('cReset').onclick=cmpReset;
$('cList').addEventListener('input',()=>$('cErr').textContent='');
viewA.snap();viewB.snap();viewA.sync(false);viewB.sync(false);
