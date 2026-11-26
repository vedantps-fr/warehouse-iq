/* Mini3D: a small perspective 3D renderer on Canvas 2D.
   Immediate mode: every frame the owner's build(S) pushes boxes, lines, curves and labels.
   Supports orbit (drag), pan (right-drag or shift-drag or two fingers), zoom (wheel or pinch),
   hover and click picking of boxes, soft floor shadows and glow. */
function Mini3D(canvas,opt){
  opt=opt||{};
  const ctx=canvas.getContext('2d');
  const S={fog:opt.fog||null,canvas,ctx,build:opt.build||function(){},onPick:opt.onPick||null,onHover:opt.onHover||null,
    theta:opt.theta??0.5,phi:opt.phi??1.15,dist:30,fov:40*Math.PI/180,tgt:[0,0,0],
    goal:{tgt:[0,0,0],dist:30},userMoved:false,visible:true,hoverId:null,W:1,H:1,dpr:1,time:0,_floorY:null};
  const H0={theta:S.theta,phi:S.phi};
  let polys=[],labels=[],picks=[],cam=null,F=1;
  const light=norm([0.45,0.85,0.55]);
  function norm(v){const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l]}
  function sub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
  function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
  function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
  function setCam(){const t=S.tgt,d=S.dist;const eye=[t[0]+d*Math.sin(S.phi)*Math.sin(S.theta),t[1]+d*Math.cos(S.phi),t[2]+d*Math.sin(S.phi)*Math.cos(S.theta)];
    const f=norm(sub(t,eye));const r=norm(cross(f,[0,1,0]));const u=cross(r,f);cam={eye,f,r,u};F=(S.H/2)/Math.tan(S.fov/2)}
  function proj(p){const d=sub(p,cam.eye);const z=dot(d,cam.f);if(z<0.3)return null;return[S.W/2+dot(d,cam.r)*F/z,S.H/2-dot(d,cam.u)*F/z,z]}
  S.project=p=>{setCam();return proj(p)};
  function hex(c){if(c[0]!=='#')return[128,128,128];if(c.length===4)c='#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3];const n=parseInt(c.slice(1,7),16);return[n>>16&255,n>>8&255,n&255]}
  function fogK(z){const f=S.fog;if(!f)return 0;return Math.max(0,Math.min(1,(z-f.near)/(f.far-f.near)))*(f.max??0.85)}
  function shadeF(rgb,k,a,z){const f=fogK(z);if(!f)return shade(rgb,k,a);const c=S.fog.rgb;const m=x=>x;return'rgba('+Math.round(Math.min(255,rgb[0]*k)*(1-f)+c[0]*f)+','+Math.round(Math.min(255,rgb[1]*k)*(1-f)+c[1]*f)+','+Math.round(Math.min(255,rgb[2]*k)*(1-f)+c[2]*f)+','+(a??1)+')'}
  function shade(rgb,k,a){return'rgba('+Math.round(Math.min(255,rgb[0]*k))+','+Math.round(Math.min(255,rgb[1]*k))+','+Math.round(Math.min(255,rgb[2]*k))+','+(a??1)+')'}
  const FACES=[[[0,1,3,2],[-1,0,0]],[[4,6,7,5],[1,0,0]],[[0,4,5,1],[0,-1,0]],[[2,3,7,6],[0,1,0]],[[0,2,6,4],[0,0,-1]],[[1,5,7,3],[0,0,1]]];
  /* box: centre x,y,z, size w,h,d, colour, id (pickable), glow colour, alpha, shadow */
  S.box=function(b){const hw=b.w/2,hh=b.h/2,hd=b.d/2;const C=[];
    for(let i=0;i<8;i++)C.push([b.x+(i&4?hw:-hw),b.y+(i&2?hh:-hh),b.z+(i&1?hd:-hd)]);
    const P=C.map(proj);if(P.some(p=>!p))return;const rgb=hex(b.color||'#888888');let minx=1e9,maxx=-1e9,miny=1e9,maxy=-1e9,zs=0;
    for(const p of P){minx=Math.min(minx,p[0]);maxx=Math.max(maxx,p[0]);miny=Math.min(miny,p[1]);maxy=Math.max(maxy,p[1]);zs+=p[2]}
    const zc=zs/8;
    if(b.shadow!==false&&S._floorY!==null){const fy=S._floorY+0.01,s=1+(b.y-S._floorY)*0.04;const q=[[b.x-hw*s,fy,b.z-hd*s],[b.x+hw*s,fy,b.z-hd*s],[b.x+hw*s,fy,b.z+hd*s],[b.x-hw*s,fy,b.z+hd*s]].map(proj);
      if(q.every(Boolean))polys.push({pts:q,z:1e6-zc,fill:'rgba(0,0,0,'+(0.16/s)+')',shadow:true})}
    for(const [idx,n] of FACES){const ctr=[0,0,0];for(const i of idx){ctr[0]+=C[i][0]/4;ctr[1]+=C[i][1]/4;ctr[2]+=C[i][2]/4}
      if(dot(n,sub(cam.eye,ctr))<=0)continue;const k=0.62+0.5*Math.max(0,dot(n,light));const pts=idx.map(i=>P[i]);const zf=pts.reduce((a,p)=>a+p[2],0)/4;
      polys.push({pts,z:zf,fill:shadeF(rgb,k,b.alpha,zf),stroke:b.edge||shadeF(rgb,0.72,b.alpha,zf),glow:b.glow,id:b.id,fa:1-fogK(zf)})}
    if(b.id!=null)picks.push({id:b.id,x0:minx,x1:maxx,y0:miny,y1:maxy,z:zc,pts:P});
    if(b.label)labels.push({p:[b.x,b.y,b.z+hd+0.02],text:b.label,sub:b.sub,size:b.labelSize||0.55,color:b.labelColor||'#ffffff',z:zc,maxW:(maxx-minx)*0.92})};
  S.pickBox=function(id,b){};
  S.line=function(pts,o){o=o||{};const P=pts.map(proj);for(let i=1;i<P.length;i++){if(!P[i-1]||!P[i])continue;
    const zz=(P[i-1][2]+P[i][2])/2;polys.push({seg:[P[i-1],P[i]],z:zz+(o.zBias||0),color:o.color||'#888',width:o.width||1.5,dash:o.dash,dashOff:o.dashOff||0,alpha:(o.alpha??1)*(1-fogK(zz))})}};
  S.ring=function(c,r,o){const pts=[];for(let i=0;i<=40;i++){const a=i/40*Math.PI*2;pts.push([c[0]+Math.cos(a)*r,c[1],c[2]+Math.sin(a)*r])}S.line(pts,o)};
  S.glowDot=function(p,r,color,alpha){const q=proj(p);if(!q)return;polys.push({halo:true,x:q[0],y:q[1],r:r*F/q[2],rgb:hex(color),alpha:(alpha??0.5)*(1-fogK(q[2])),z:q[2]+(r*0.5)})};
  S.dot=function(p,r,color,alpha){const q=proj(p);if(!q)return;const rr=Math.max(0.6,r*F/q[2]);polys.push({dot:true,x:q[0],y:q[1],r:rr,rgb:hex(color),alpha:(alpha??1)*(1-fogK(q[2])),z:q[2]})};
  S.curve=function(a,c,b,o){const pts=[];for(let i=0;i<=24;i++){const t=i/24,u=1-t;pts.push([u*u*a[0]+2*u*t*c[0]+t*t*b[0],u*u*a[1]+2*u*t*c[1]+t*t*b[1],u*u*a[2]+2*u*t*c[2]+t*t*b[2]])}S.line(pts,o)};
  S.label=function(p,text,o){o=o||{};labels.push({p,text,sub:o.sub,size:o.size||0.5,color:o.color||'#888',z:-1,align:o.align,pill:o.pill,flat:o.flat,mono:o.mono})};
  S.floor=function(y,extent,color,n,alpha){S._floorY=y;n=n||10;alpha=alpha??0.5;const [x0,x1,z0,z1]=extent;
    for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,z=z0+(z1-z0)*i/n;S.line([[x,y,z0],[x,y,z1]],{color,width:1,zBias:1e6,alpha});S.line([[x0,y,z],[x1,y,z]],{color,width:1,zBias:1e6,alpha})}};
  S.fit=function(bx){/* bx: [minX,maxX,minY,maxY,minZ,maxZ] */S._lastFit=bx;
    const cx=(bx[0]+bx[1])/2,cy=(bx[2]+bx[3])/2,cz=(bx[4]+bx[5])/2;const w=bx[1]-bx[0],h=bx[3]-bx[2],d=bx[5]-bx[4];const asp=S.W/Math.max(1,S.H);
    const th=S.theta,ph=S.phi;const fw=norm([-Math.sin(ph)*Math.sin(th),-Math.cos(ph),-Math.sin(ph)*Math.cos(th)]);const rr=norm(cross(fw,[0,1,0]));const uu=cross(rr,fw);
    const tH=Math.tan(S.fov/2)*0.9,tW=tH*asp;let need=0;
    for(let i=0;i<8;i++){const v=[(i&1?bx[1]:bx[0])-cx,(i&2?bx[3]:bx[2])-cy,(i&4?bx[5]:bx[4])-cz];const x=dot(v,rr),y=dot(v,uu),z=dot(v,fw);need=Math.max(need,Math.abs(x)/tW-z,Math.abs(y)/tH-z)}
    S.goal={tgt:[cx,cy,cz],dist:Math.max(opt.minDist||8,need+1)};S._fitDist=S.goal.dist;
    if(!S.userMoved&&S._snap){S.tgt=S.goal.tgt.slice();S.dist=S.goal.dist;S._snap=false}};
  S.resetView=function(){S.userMoved=false;S.theta=H0.theta;S.phi=H0.phi};
  S.snap=function(){S._snap=true};
  function resize(){const r=canvas.getBoundingClientRect();S.dpr=Math.min(window.devicePixelRatio||1,2);S.W=Math.max(1,r.width);S.H=Math.max(1,r.height);
    canvas.width=Math.round(S.W*S.dpr);canvas.height=Math.round(S.H*S.dpr)}
  S.resize=resize;
  function frame(now){requestAnimationFrame(frame);if(!S.visible||!canvas.isConnected||canvas.offsetParent===null)return;S.time=now/1000;
    {const r=canvas.getBoundingClientRect();if(Math.abs(r.width-S.W)>0.5||Math.abs(r.height-S.H)>0.5){resize();if(S._lastFit){if(!S.userMoved)S._snap=true;S.fit(S._lastFit)}}}
    if(!S.userMoved){for(let i=0;i<3;i++)S.tgt[i]+=(S.goal.tgt[i]-S.tgt[i])*0.1;S.dist+=(S.goal.dist-S.dist)*0.1}
    setCam();polys=[];labels=[];picks=[];S._floorY=null;
    S.build(S,now);
    ctx.setTransform(S.dpr,0,0,S.dpr,0,0);ctx.clearRect(0,0,S.W,S.H);
    polys.sort((a,b)=>b.z-a.z);
    for(const p of polys){
      if(p.halo){if(p.r<1)continue;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);const c=p.rgb.join(',');g.addColorStop(0,'rgba('+c+','+p.alpha+')');g.addColorStop(1,'rgba('+c+',0)');ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(p.x-p.r,p.y-p.r,p.r*2,p.r*2);ctx.globalCompositeOperation='source-over';continue}
      if(p.dot){ctx.fillStyle='rgba('+p.rgb.join(',')+','+p.alpha+')';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.2832);ctx.fill();continue}
      if(p.seg){ctx.globalAlpha=p.alpha;ctx.strokeStyle=p.color;ctx.lineWidth=p.width;ctx.setLineDash(p.dash||[]);ctx.lineDashOffset=p.dashOff;
        ctx.beginPath();ctx.moveTo(p.seg[0][0],p.seg[0][1]);ctx.lineTo(p.seg[1][0],p.seg[1][1]);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;continue}
      ctx.beginPath();ctx.moveTo(p.pts[0][0],p.pts[0][1]);for(let i=1;i<p.pts.length;i++)ctx.lineTo(p.pts[i][0],p.pts[i][1]);ctx.closePath();
      if(p.glow){ctx.shadowColor=p.glow;ctx.shadowBlur=22}ctx.fillStyle=p.fill;ctx.fill();ctx.shadowBlur=0;
      if(p.stroke){ctx.strokeStyle=p.glow||p.stroke;ctx.lineWidth=p.glow?2.5:1;ctx.lineJoin='round';ctx.stroke()}}
    for(const L of labels){const q=proj(L.p);if(!q)continue;ctx.globalAlpha=1-fogK(q[2])*0.9;let px=L.size*F/q[2];if(L.pill)px=Math.max(px,11);if(px<8){if(L.maxW&&L.maxW>=16)px=8.5;else continue}px=Math.min(px,26);
      const FF=L.mono?"500 PXpx 'JetBrains Mono', monospace":"700 PXpx Orbitron, Inter, system-ui, sans-serif";ctx.font=FF.replace('PX',px.toFixed(1));let w=ctx.measureText(L.text).width;
      if(L.maxW&&w>L.maxW){px=px*L.maxW/w;if(px<7)continue;ctx.font=FF.replace('PX',px.toFixed(1));w=ctx.measureText(L.text).width}
      ctx.textAlign=L.align||'center';ctx.textBaseline='middle';
      if(L.pill){ctx.fillStyle=L.pill;const pw=w+px*0.9,ph=px*1.5,x0=L.align==='left'?q[0]-px*0.45:q[0]-pw/2;ctx.beginPath();ctx.roundRect?ctx.roundRect(x0,q[1]-ph/2,pw,ph,ph/2):ctx.rect(x0,q[1]-ph/2,pw,ph);ctx.fill()}
      ctx.fillStyle=L.color;ctx.fillText(L.text,q[0],L.sub?q[1]-px*0.35:q[1]);
      if(L.sub){ctx.font="500 "+(px*0.62).toFixed(1)+"px 'JetBrains Mono', monospace";ctx.fillStyle='rgba(255,235,170,1)';ctx.fillText(L.sub,q[0],q[1]+px*0.5)}}ctx.globalAlpha=1}
  requestAnimationFrame(frame);
  function inPoly(x,y,pts){let c=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const a=pts[i],b=pts[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
  function hull(P){const p=P.map(q=>[q[0],q[1]]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const lo=[],up=[];
    for(const q of p){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q)}for(const q of p.reverse()){while(up.length>1&&cr(up[up.length-2],up[up.length-1],q)<=0)up.pop();up.push(q)}return lo.slice(0,-1).concat(up.slice(0,-1))}
  S.pickAt=function(x,y){let best=null;for(const k of picks){if(x<k.x0||x>k.x1||y<k.y0||y>k.y1)continue;if(!inPoly(x,y,hull(k.pts)))continue;if(!best||k.z<best.z)best=k}return best?best.id:null};
  const ptrs=new Map();let down=null,pinch=0;
  canvas.style.touchAction='none';
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,[e.clientX,e.clientY]);down={x:e.clientX,y:e.clientY,moved:0,pan:e.button===2||e.shiftKey};
    if(ptrs.size===2){const v=[...ptrs.values()];pinch=Math.hypot(v[0][0]-v[1][0],v[0][1]-v[1][1])}});
  canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();
    if(!down){const id=S.pickAt(e.clientX-r.left,e.clientY-r.top);if(id!==S.hoverId){S.hoverId=id;canvas.style.cursor=id!=null&&S.onPick?'pointer':'grab';S.onHover&&S.onHover(id)}return}
    const prev=ptrs.get(e.pointerId);if(!prev)return;const dx=e.clientX-prev[0],dy=e.clientY-prev[1];ptrs.set(e.pointerId,[e.clientX,e.clientY]);down.moved+=Math.abs(dx)+Math.abs(dy);
    if(down.moved<4)return;S.userMoved=true;canvas.style.cursor='grabbing';
    if(ptrs.size===2){const v=[...ptrs.values()];const d=Math.hypot(v[0][0]-v[1][0],v[0][1]-v[1][1]);if(pinch){S.dist=Math.max(3,Math.min(5000,S.dist*pinch/d))}pinch=d;panBy(dx/2,dy/2);return}
    if(down.pan)panBy(dx,dy);else{S.theta-=dx*0.007;S.phi=Math.min(1.62,Math.max(0.25,S.phi-dy*0.007))}});
  function panBy(dx,dy){setCam();const s=S.dist/S.H*1.0;for(let i=0;i<3;i++)S.tgt[i]+=-dx*s*cam.r[i]+dy*s*cam.u[i]}
  const up=e=>{ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=0;if(down&&down.moved<4&&ptrs.size===0&&S.onPick){const r=canvas.getBoundingClientRect();S.onPick(S.pickAt(e.clientX-r.left,e.clientY-r.top))}
    if(ptrs.size===0){down=null;canvas.style.cursor='grab'}};
  canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
  canvas.addEventListener('wheel',e=>{e.preventDefault();S.userMoved=true;S.dist=Math.max(3,Math.min(5000,S.dist*Math.exp(e.deltaY*0.0012)))},{passive:false});
  canvas.addEventListener('dblclick',()=>S.resetView());
  if('IntersectionObserver' in window)new IntersectionObserver(es=>{for(const e of es)S.visible=e.isIntersecting}).observe(canvas);
  resize();return S;
}
