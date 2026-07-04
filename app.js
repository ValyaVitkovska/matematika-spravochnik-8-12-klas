/* ============================================================
   ЛОГИКА НА ПРИЛОЖЕНИЕТО — помощници, клас Graph, интерактивни
   модели (MODELS), търсачка, филтри, режими, теми, печат.
   Зарежда се СЛЕД data.js.
   ============================================================ */
/* ================= ПОМОЩНИ ================= */

const $ = s => document.querySelector(s);
function el(tag, cls, html){ const e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }
function cssVar(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
const fmt = (x,d=2)=>{ const v=Math.round(x*10**d)/10**d; return (Object.is(v,-0)?0:v).toLocaleString('bg-BG',{maximumFractionDigits:d}); };

/* ================= ГРАФИЧЕН ПОМОЩНИК ================= */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const snap=(v,s=0.5)=>Math.round(v/s)*s;
const MJ={'\\tg':'\\operatorname{tg}','\\cotg':'\\operatorname{cotg}','\\arctg':'\\operatorname{arctg}','\\arcctg':'\\operatorname{arcctg}'};
function renderMath(node){ if(window.renderMathInElement){ try{ renderMathInElement(node,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],macros:MJ,throwOnError:false}); }catch(e){} } }
const frac=(a,b)=>String.raw`$\dfrac{${a}}{${b}}$`;

class Graph{
  constructor(cv,xa,xb,ya,yb){ this.cv=cv; this.c=cv.getContext('2d'); this.set(xa,xb,ya,yb); }
  set(xa,xb,ya,yb){ this.xa=xa; this.xb=xb; this.ya=ya; this.yb=yb; }
  get w(){return this.cv.width} get h(){return this.cv.height}
  X(x){ return (x-this.xa)/(this.xb-this.xa)*this.w; }
  Y(y){ return this.h-(y-this.ya)/(this.yb-this.ya)*this.h; }
  gx(sx){ return this.xa + sx/this.w*(this.xb-this.xa); }
  gy(sy){ return this.ya + (this.h-sy)/this.h*(this.yb-this.ya); }
  clear(){ this.c.clearRect(0,0,this.w,this.h); }
  grid(step=1){
    const c=this.c; c.strokeStyle=cssVar('--grid')||'rgba(100,120,180,.15)'; c.lineWidth=1; c.beginPath();
    for(let x=Math.ceil(this.xa/step)*step; x<=this.xb; x+=step){ c.moveTo(this.X(x),0); c.lineTo(this.X(x),this.h); }
    for(let y=Math.ceil(this.ya/step)*step; y<=this.yb; y+=step){ c.moveTo(0,this.Y(y)); c.lineTo(this.w,this.Y(y)); }
    c.stroke();
  }
  axes(lblStep=1){
    const c=this.c; c.strokeStyle=cssVar('--muted'); c.lineWidth=1.4; c.beginPath();
    c.moveTo(0,this.Y(0)); c.lineTo(this.w,this.Y(0)); c.moveTo(this.X(0),0); c.lineTo(this.X(0),this.h); c.stroke();
    c.fillStyle=cssVar('--muted'); c.font='11px system-ui'; c.textAlign='center';
    for(let x=Math.ceil(this.xa); x<=this.xb; x+=lblStep){ if(Math.abs(x)>1e-9) c.fillText(fmt(x,0), this.X(x), this.Y(0)+13); }
    c.textAlign='right';
    for(let y=Math.ceil(this.ya); y<=this.yb; y+=lblStep){ if(Math.abs(y)>1e-9) c.fillText(fmt(y,0), this.X(0)-4, this.Y(y)+4); }
    c.textAlign='left';
  }
  fn(f,color,w=2.2){
    const c=this.c; c.strokeStyle=color; c.lineWidth=w; c.beginPath(); let pen=false; const N=this.w;
    for(let i=0;i<=N;i++){ const x=this.xa+(this.xb-this.xa)*i/N; const y=f(x);
      if(!isFinite(y)||Math.abs(y)>1e4){ pen=false; continue; }
      const sx=this.X(x), sy=this.Y(y);
      if(sy<-2000||sy>this.h+2000){ pen=false; continue; }
      if(pen) c.lineTo(sx,sy); else { c.moveTo(sx,sy); pen=true; }
    }
    c.stroke();
  }
  seg(x1,y1,x2,y2,color,w=2,dash){ const c=this.c; c.strokeStyle=color; c.lineWidth=w; c.setLineDash(dash||[]);
    c.beginPath(); c.moveTo(this.X(x1),this.Y(y1)); c.lineTo(this.X(x2),this.Y(y2)); c.stroke(); c.setLineDash([]); }
  dot(x,y,color,rad=5){ const c=this.c; c.fillStyle=color; c.beginPath(); c.arc(this.X(x),this.Y(y),rad,0,7); c.fill(); }
  label(x,y,txt,color,dx=8,dy=-8,font='12.5px system-ui'){ const c=this.c; c.fillStyle=color||cssVar('--ink'); c.font=font; c.fillText(txt,this.X(x)+dx,this.Y(y)+dy); }
  poly(pts,fill,stroke,w=2){ const c=this.c; c.beginPath(); pts.forEach((p,i)=> i?c.lineTo(this.X(p[0]),this.Y(p[1])):c.moveTo(this.X(p[0]),this.Y(p[1]))); c.closePath();
    if(fill){c.fillStyle=fill;c.fill();} if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();} }
  circle(cx,cy,rad,color,w=2,dash){ const c=this.c; c.strokeStyle=color; c.lineWidth=w; c.setLineDash(dash||[]);
    c.beginPath(); c.arc(this.X(cx),this.Y(cy),Math.abs(this.X(cx+rad)-this.X(cx)),0,7); c.stroke(); c.setLineDash([]); }
  handle(x,y,color){ const c=this.c,X=this.X(x),Y=this.Y(y); c.save();
    c.lineWidth=2; c.strokeStyle=color; c.globalAlpha=.4; c.beginPath(); c.arc(X,Y,12,0,7); c.stroke();
    c.globalAlpha=1; c.fillStyle=color; c.strokeStyle='#fff'; c.beginPath(); c.arc(X,Y,7,0,7); c.fill(); c.stroke(); c.restore(); }
}

/* Плъзгане на точки: handlesFn()->[{x,y,set(nx,ny),axis?}] в координати на графиката */
function draggable(cv,g,handlesFn,redraw){
  cv.style.touchAction='none';
  let active=-1;
  const P=e=>{ const r=cv.getBoundingClientRect(); return { sx:(e.clientX-r.left)*cv.width/r.width, sy:(e.clientY-r.top)*cv.height/r.height }; };
  const pick=p=>{ const hs=handlesFn(); let bi=-1,bd=1e9; hs.forEach((h,i)=>{ const d=Math.hypot(g.X(h.x)-p.sx,g.Y(h.y)-p.sy); if(d<bd){bd=d;bi=i;} }); return bd<34?bi:-1; };
  const applyAt=p=>{ const h=handlesFn()[active]; if(!h) return; let nx=g.gx(p.sx), ny=g.gy(p.sy); if(h.axis==='x')ny=h.y; if(h.axis==='y')nx=h.x; h.set(nx,ny); redraw(); };
  cv.addEventListener('pointerdown',e=>{ const p=P(e); active=pick(p); if(active>=0){ cv.setPointerCapture&&cv.setPointerCapture(e.pointerId); e.preventDefault(); cv.style.cursor='grabbing'; applyAt(p); } });
  cv.addEventListener('pointermove',e=>{ const p=P(e); if(active>=0){ e.preventDefault(); applyAt(p); } else { cv.style.cursor=pick(p)>=0?'grab':'default'; } });
  const end=()=>{ active=-1; cv.style.cursor='default'; };
  cv.addEventListener('pointerup',end); cv.addEventListener('pointercancel',end);
}

/* Изпадащо меню (за категории) */
function sel(parent,label,options,onch){
  const box=el('div','ctl'); const lab=el('label',null,label); const s=document.createElement('select');
  options.forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;s.append(o);});
  s.addEventListener('change',()=>onch&&onch());
  box.append(lab,s); parent.append(box); const g=()=>s.value; g.el=s; return g;
}
/* Стъпков брояч (цяло число) — заменя плъзгачите за брой */
function stepper(parent,label,min,max,val,onch){
  const box=el('div','ctl'); const lab=el('label'); let v=val;
  const dec=el('button','stepb','−'), num=el('span','stepv'), inc=el('button','stepb','+');
  const row=el('div','steprow'); row.append(dec,num,inc);
  const upd=()=>{ lab.innerHTML=label; num.textContent=v; };
  dec.onclick=()=>{ if(v>min){v--;upd();onch&&onch();} };
  inc.onclick=()=>{ if(v<max){v++;upd();onch&&onch();} };
  upd(); box.append(lab,row); parent.append(box);
  const g=()=>v; g.set=x=>{ v=clamp(Math.round(x),min,max); upd(); }; return g;
}
/* Стъпков брояч (дробна стъпка) — за вероятности и т.н. */
function stepperF(parent,label,min,max,step,val,onch){
  const box=el('div','ctl'); const lab=el('label'); let v=val;
  const dec=el('button','stepb','−'), num=el('span','stepv'), inc=el('button','stepb','+');
  const row=el('div','steprow'); row.append(dec,num,inc);
  const upd=()=>{ lab.innerHTML=label; num.textContent=fmt(v,2); };
  dec.onclick=()=>{ v=Math.max(min,+(v-step).toFixed(4)); upd(); onch&&onch(); };
  inc.onclick=()=>{ v=Math.min(max,+(v+step).toFixed(4)); upd(); onch&&onch(); };
  upd(); box.append(lab,row); parent.append(box);
  const g=()=>v; g.set=x=>{ v=clamp(x,min,max); upd(); }; return g;
}
function mkCanvas(parent,w=760,h=380){ const cv=document.createElement('canvas'); cv.width=w; cv.height=h; parent.append(cv); return cv; }
function mkOut(parent){ const d=el('div','mout'); parent.append(d); return d; }
const liveRedraws=[];

/* комбинаторни изброявания */
function factN(n){ let s=1; for(let i=2;i<=n;i++) s*=i; return s; }
function kcombos(arr,k){ if(k===0)return[[]]; if(k>arr.length)return[]; const [f,...rest]=arr; return [...kcombos(rest,k-1).map(c=>[f,...c]), ...kcombos(rest,k)]; }
function kperms(arr,k){ if(k===0)return[[]]; const res=[]; arr.forEach((v,i)=>{ const rest=arr.slice(0,i).concat(arr.slice(i+1)); kperms(rest,k-1).forEach(p=>res.push([v,...p])); }); return res; }

/* ================= МОДЕЛИ ================= */
const MODELS = {

/* ---------- Линейна функция: права през две подвижни точки ---------- */
linear:{ build(root){
  const hint=el('div','mnote','Влачи двете сини точки — правата минава през тях.'); root.append(hint);
  const cv=mkCanvas(root,720,430), out=mkOut(root);
  const g=new Graph(cv,-8,8,-6,6);
  let P=[[-3,-1],[3,3]];
  function draw(){
    let p0=P[0], p1=P[1]; if(Math.abs(p1[0]-p0[0])<0.4) p1[0]=p0[0]+0.4;
    const a=(p1[1]-p0[1])/(p1[0]-p0[0]); const b=p0[1]-a*p0[0];
    g.clear(); g.grid(1); g.axes(2);
    g.fn(x=>a*x+b, cssVar('--plot-line'));
    if(Math.abs(a)>1e-9){ const x0=-b/a; g.dot(x0,0,cssVar('--cW'),5); g.label(x0,0,'x₀='+fmt(x0),cssVar('--cW'),6,18); }
    g.dot(0,b,cssVar('--plot-line3'),4);
    g.handle(p0[0],p0[1],cssVar('--plot-line2')); g.handle(p1[0],p1[1],cssVar('--plot-line2'));
    const beh=a>0?'расте':(a<0?'намалява':'е постоянна');
    out.innerHTML='y = <b>'+fmt(a)+'</b>·x + <b>'+fmt(b)+'</b> · наклон a = '+fmt(a)+' → функцията '+beh+
      ' · пресича Oy в (0; '+fmt(b)+')'+(Math.abs(a)>1e-9?', а Ox в x₀ = '+frac('−('+fmt(b)+')',fmt(a))+' = '+fmt(-b/a):'')+'.';
    renderMath(out);
  }
  draw(); liveRedraws.push(draw);
  draggable(cv,g,()=>[
    {x:P[0][0],y:P[0][1],set:(x,y)=>P[0]=[clamp(x,-7.5,7.5),clamp(y,-5.5,5.5)]},
    {x:P[1][0],y:P[1][1],set:(x,y)=>P[1]=[clamp(x,-7.5,7.5),clamp(y,-5.5,5.5)]},
  ],draw);
}},

/* ---------- Квадратна функция: връх + точка за широчината ---------- */
quad:{ build(root){
  const hint=el('div','mnote','Влачи <b>върха</b> (оранжевата точка) и <b>точката за широчината</b> (синята).'); root.append(hint);
  const cv=mkCanvas(root,720,440), out=mkOut(root);
  const g=new Graph(cv,-8,8,-8,8);
  let V=[1,-3], W=[4,1];
  function draw(){
    let h=V[0],k=V[1]; if(Math.abs(W[0]-h)<0.6) W[0]=h+ (W[0]>=h?0.6:-0.6);
    let a=(W[1]-k)/((W[0]-h)**2); if(Math.abs(a)<0.02) a=a<0?-0.02:0.02;
    const b=-2*a*h, c=a*h*h+k;
    g.clear(); g.grid(1); g.axes(2);
    g.fn(x=>a*(x-h)*(x-h)+k, cssVar('--plot-line'));
    g.seg(h,-8,h,8,cssVar('--plot-line3'),1.4,[6,5]);
    const D=b*b-4*a*c;
    let roots;
    if(D>1e-9){ const x1=(-b-Math.sqrt(D))/(2*a),x2=(-b+Math.sqrt(D))/(2*a);
      g.dot(x1,0,cssVar('--cW'),5); g.dot(x2,0,cssVar('--cW'),5);
      g.label(x1,0,'x₁='+fmt(x1),cssVar('--cW'),6,20); g.label(x2,0,'x₂='+fmt(x2),cssVar('--cW'),6,-10);
      roots='<b>два корена</b>: x₁ = '+fmt(x1)+', x₂ = '+fmt(x2);
    } else if(Math.abs(D)<=1e-9) roots='<b>един (двоен) корен</b>: x = '+fmt(h);
    else roots='<b>няма реални корени</b>';
    g.handle(V[0],V[1],cssVar('--plot-line2')); g.handle(W[0],W[1],cssVar('--accent'));
    out.innerHTML='y = '+fmt(a)+'(x − '+fmt(h)+')² + '+fmt(k)+' = '+fmt(a)+'x² + '+fmt(b)+'x + '+fmt(c)+
      ' · връх V('+fmt(h)+'; '+fmt(k)+'), ос x = '+frac('−b','2a')+' = '+fmt(h)+
      ' · отваря се '+(a>0?'нагоре':'надолу')+'<br>D = b² − 4ac = '+fmt(D)+' → '+roots+'.';
    renderMath(out);
  }
  draw(); liveRedraws.push(draw);
  draggable(cv,g,()=>[
    {x:V[0],y:V[1],set:(x,y)=>V=[clamp(x,-6,6),clamp(y,-7,7)]},
    {x:W[0],y:W[1],set:(x,y)=>W=[clamp(x,-7.5,7.5),clamp(y,-7.5,7.5)]},
  ],draw);
}},
quadroots:{ build(root){ MODELS.quad.build(root); }},

/* ---------- Система линейни уравнения: по две точки на всяка права ---------- */
system:{ build(root){
  const hint=el('div','mnote','Влачи точките — всяка права минава през своите две точки.'); root.append(hint);
  const cv=mkCanvas(root,720,440), out=mkOut(root);
  const g=new Graph(cv,-8,8,-6,6);
  let L1=[[-4,-2],[2,3]], L2=[[-3,3],[4,-3]];
  const line=(p,q)=>({a:q[1]-p[1], b:p[0]-q[0], c:(q[1]-p[1])*p[0]+(p[0]-q[0])*p[1]});
  function drawLine(p,q,color){ const L=line(p,q);
    if(Math.abs(L.b)>1e-9) g.fn(x=>(L.c-L.a*x)/L.b,color); else g.seg(p[0],-6,p[0],6,color,2.2);
    g.handle(p[0],p[1],color); g.handle(q[0],q[1],color); }
  function draw(){
    g.clear(); g.grid(1); g.axes(2);
    drawLine(L1[0],L1[1],cssVar('--plot-line')); drawLine(L2[0],L2[1],cssVar('--plot-line2'));
    const A=line(L1[0],L1[1]), B=line(L2[0],L2[1]); const D=A.a*B.b-B.a*A.b;
    let msg;
    if(Math.abs(D)>1e-9){ const x=(A.c*B.b-B.c*A.b)/D, y=(A.a*B.c-B.a*A.c)/D;
      g.dot(x,y,cssVar('--cW'),6); g.label(x,y,'('+fmt(x)+'; '+fmt(y)+')',cssVar('--cW'));
      msg='Правите се пресичат → <b>едно решение</b> (x; y) = (<b>'+fmt(x)+'</b>; <b>'+fmt(y)+'</b>).';
    } else { const par=Math.abs(A.c*B.a-B.c*A.a)<1e-6 && Math.abs(A.c*B.b-B.c*A.b)<1e-6;
      msg = par?'Правите съвпадат → <b>безброй много решения</b>.':'Правите са успоредни → <b>няма решение</b>.'; }
    out.innerHTML=msg+'<br><span class="mnote">Всяка права е зададена от две подвижни точки; пресечната им точка е решението на системата.</span>';
  }
  draw(); liveRedraws.push(draw);
  const H=(arr,i)=>({x:arr[i][0],y:arr[i][1],set:(x,y)=>arr[i]=[clamp(x,-7.5,7.5),clamp(y,-5.5,5.5)]});
  draggable(cv,g,()=>[H(L1,0),H(L1,1),H(L2,0),H(L2,1)],draw);
}},

/* ---------- Метод на интервалите: подвижни корени на числовата ос ---------- */
intervals:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const hint=el('div','mnote','Влачи корените по оста. Съвпаднат ли, се получава кратен корен (×2, ×3…).'); root.append(hint);
  const cv=mkCanvas(root,760,210), out=mkOut(root);
  const g=new Graph(cv,-7.5,7.5,-1.6,1.6);
  const N=sel(ctls,'Брой корени (с кратностите)',[['2','2'],['3','3'],['4','4'],['5','5']],draw);
  const SGN=sel(ctls,'Неравенство',[['gt','> 0'],['ge','≥ 0'],['lt','< 0'],['le','≤ 0']],draw);
  const LEAD=sel(ctls,'Старши коефициент',[['1','положителен (+)'],['-1','отрицателен (−)']],draw);
  let roots=[-3,1,4,-2,-5];
  function draw(){
    const n=+N(), lead=+LEAD(), sign=SGN(); const all=roots.slice(0,n);
    const mult={}; all.forEach(rt=>mult[rt]=(mult[rt]||0)+1);
    const rs=Object.keys(mult).map(Number).sort((a,b)=>a-b);
    const f=x=>lead*all.reduce((p,rt)=>p*(x-rt),1);
    const strict=sign==='gt'||sign==='lt', wantPos=sign==='gt'||sign==='ge';
    g.clear(); g.seg(-7.5,0,7.5,0,cssVar('--muted'),2);
    for(let x=-7;x<=7;x++){ g.seg(x,-0.08,x,0.08,cssVar('--muted'),1); g.label(x,0,fmt(x,0),cssVar('--muted'),-4,30,'10.5px system-ui'); }
    const pts=[-Infinity,...rs,Infinity], segs=[];
    for(let i=0;i<pts.length-1;i++){ const lo=pts[i]===-Infinity?-7.5:pts[i], hi=pts[i+1]===Infinity?7.5:pts[i+1];
      const pos=f((lo+hi)/2)>0; if(pos===wantPos) segs.push({a:pts[i],b:pts[i+1]});
      g.label((lo+hi)/2,0,pos?'+':'−',pos?cssVar('--cF'):cssVar('--cW'),-5,-24,'bold 19px system-ui'); }
    const merged=[]; segs.forEach(s=>{ const l=merged[merged.length-1]; if(l&&!strict&&l.b===s.a)l.b=s.b; else merged.push({a:s.a,b:s.b}); });
    const iso=[]; if(!strict) rs.forEach(rt=>{ if(!merged.some(s=>s.a===rt||s.b===rt||(rt>s.a&&rt<s.b))) iso.push(rt); });
    merged.forEach(s=> g.seg(s.a===-Infinity?-7.5:s.a,0,s.b===Infinity?7.5:s.b,0,cssVar('--accent'),7));
    rs.forEach(rt=>{ const c=g.c; c.lineWidth=2.4; c.strokeStyle=cssVar('--ink'); c.fillStyle=strict?cssVar('--card'):cssVar('--ink');
      c.beginPath(); c.arc(g.X(rt),g.Y(0),7,0,7); c.fill(); c.stroke();
      if(mult[rt]>1) g.label(rt,0,'×'+mult[rt],cssVar('--plot-line2'),8,-14,'bold 12px system-ui'); });
    iso.forEach(rt=>{ const c=g.c; c.fillStyle=cssVar('--accent'); c.beginPath(); c.arc(g.X(rt),g.Y(0),7.5,0,7); c.fill(); });
    const items=merged.map(s=>({key:s.a===-Infinity?-1e9:s.a,str:(s.a===-Infinity?'(−∞':(strict?'(':'[')+fmt(s.a))+'; '+(s.b===Infinity?'+∞)':fmt(s.b)+(strict?')':']'))}))
      .concat(iso.map(rt=>({key:rt,str:'{'+fmt(rt)+'}'}))); items.sort((u,v)=>u.key-v.key);
    const parts=items.map(i=>i.str);
    const signTxt={gt:'> 0',ge:'≥ 0',lt:'< 0',le:'≤ 0'}[sign];
    const expr=(lead<0?'− ':'')+rs.map(rt=>{ const base=rt===0?'x':'(x '+(rt<0?'+ '+fmt(-rt):'− '+fmt(rt))+')'; return base+(mult[rt]>1?'^'+mult[rt]:''); }).join('·');
    const hasEven=rs.some(rt=>mult[rt]%2===0);
    out.innerHTML='Неравенство: <b>'+expr+' '+signTxt+'</b><br>Решение: <b>x ∈ '+(parts.length?parts.join(' ∪ '):'∅')+'</b>'+
      (hasEven?'<br><span class="mnote">През корен с <b>четна</b> кратност знакът НЕ се сменя; през нечетна — се сменя.</span>':'');
  }
  draw(); liveRedraws.push(draw);
  draggable(cv,g,()=>{ const n=+N(); return roots.slice(0,n).map((r,i)=>({x:r,y:0,axis:'x',set:x=>roots[i]=snap(clamp(x,-7,7),0.5)})); },draw);
}},

/* ---------- Питагорова теорема: подвижни катети ---------- */
pythagoras:{ build(root){
  const hint=el('div','mnote','Влачи двете точки по осите, за да смениш дължините на катетите.'); root.append(hint);
  const cv=mkCanvas(root,640,560), out=mkOut(root);
  const g=new Graph(cv,-6.2,12.2,-5.6,10.5);
  let a=3,b=4;
  function sq(p1,p2,color){ const dx=p2[0]-p1[0],dy=p2[1]-p1[1]; const n=[dy,-dx];
    g.poly([p1,p2,[p2[0]+n[0],p2[1]+n[1]],[p1[0]+n[0],p1[1]+n[1]]],color+'33',color,2);
    return [(p1[0]+p2[0])/2+n[0]/2,(p1[1]+p2[1])/2+n[1]/2]; }
  function draw(){
    const cH=Math.hypot(a,b); const C=[0,0],Bp=[b,0],Ap=[0,a];
    g.clear(); g.grid(1);
    const cb=sq(C,Bp,cssVar('--plot-line')), ca=sq(Ap,C,cssVar('--plot-line3')), cn=sq(Bp,Ap,cssVar('--plot-line2'));
    g.poly([C,Bp,Ap],'rgba(127,127,127,.12)',cssVar('--ink'),2.4);
    g.label(cb[0],cb[1],'b² = '+fmt(b*b),cssVar('--plot-line'),-26,4,'bold 13px system-ui');
    g.label(ca[0],ca[1],'a² = '+fmt(a*a),cssVar('--plot-line3'),-26,4,'bold 13px system-ui');
    g.label(cn[0],cn[1],'c² = '+fmt(cH*cH),cssVar('--plot-line2'),-30,4,'bold 13px system-ui');
    g.label(0.12,0.02,'∟',cssVar('--ink'),2,-4,'15px system-ui');
    g.handle(b,0,cssVar('--plot-line')); g.handle(0,a,cssVar('--plot-line3'));
    out.innerHTML='c = √(a² + b²) = √('+fmt(a*a)+' + '+fmt(b*b)+') = √'+fmt(a*a+b*b)+' = <b>'+fmt(cH,3)+'</b>'+
      ' · проверка на лицата: '+fmt(a*a)+' + '+fmt(b*b)+' = '+fmt(a*a+b*b)+'.';
  }
  draw(); liveRedraws.push(draw);
  draggable(cv,g,()=>[
    {x:b,y:0,axis:'x',set:x=>b=clamp(snap(x,0.5),1,8)},
    {x:0,y:a,axis:'y',set:(x,y)=>a=clamp(snap(y,0.5),1,8)},
  ],draw);
}},

/* ---------- Талес: подвижна успоредна права ---------- */
thales:{ build(root){
  const hint=el('div','mnote','Влачи точката M по страната AB — успоредната права MN дели страните в равни отношения.'); root.append(hint);
  const cv=mkCanvas(root,760,380), out=mkOut(root);
  const g=new Graph(cv,-1,11,-0.3,5.7);
  const A=[5,5.3], B=[0.5,0.6], C=[10,0.6]; let t=0.45;
  function draw(){
    const M=[A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t], Nn=[A[0]+(C[0]-A[0])*t,A[1]+(C[1]-A[1])*t];
    g.clear(); g.poly([A,B,C],null,cssVar('--ink'),2.2);
    g.seg(M[0],M[1],Nn[0],Nn[1],cssVar('--plot-line2'),3); g.seg(B[0],B[1],C[0],C[1],cssVar('--plot-line'),3);
    [['A',A],['B',B],['C',C],['N',Nn]].forEach(([n,p])=>{ g.dot(p[0],p[1],cssVar('--accent'),4.5); g.label(p[0],p[1],n,cssVar('--ink'),8,-6,'bold 14px Georgia'); });
    g.handle(M[0],M[1],cssVar('--plot-line2')); g.label(M[0],M[1],'M',cssVar('--ink'),10,-8,'bold 14px Georgia');
    out.innerHTML='MN ∥ BC · AM : MB = AN : NC = <b>'+fmt(t/(1-t),3)+'</b> — равни отношения (теорема на Талес).'+
      '<br>MN : BC = '+frac('AM','AB')+' = <b>'+fmt(t,2)+'</b> → триъгълник AMN е подобен на ABC с коефициент k = '+fmt(t,2)+'.';
    renderMath(out);
  }
  draw(); liveRedraws.push(draw);
  draggable(cv,g,()=>{ const M=[A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t]; return [{x:M[0],y:M[1],set:(x,y)=>{
    const ABx=B[0]-A[0],ABy=B[1]-A[1]; t=clamp(((x-A[0])*ABx+(y-A[1])*ABy)/(ABx*ABx+ABy*ABy),0.12,0.9); }}]; },draw);
}},

/* ---------- Ъглополовяща: подвижни върхове B и C ---------- */
bisector:{ build(root){
  const hint=el('div','mnote','Влачи върховете B и C — ъглополовящата от A дели BC в отношение AB : AC.'); root.append(hint);
  const cv=mkCanvas(root,760,420), out=mkOut(root);
  const g=new Graph(cv,-0.5,10.7,-0.4,5.79);
  const A=[1,0.8]; let B=[7,0.8], C=[3.1,4.9];
  function draw(){
    const c=Math.hypot(B[0]-A[0],B[1]-A[1]), b=Math.hypot(C[0]-A[0],C[1]-A[1]);
    const L=[B[0]+(C[0]-B[0])*(c/(b+c)),B[1]+(C[1]-B[1])*(c/(b+c))];
    g.clear(); g.poly([A,B,C],null,cssVar('--ink'),2.2);
    g.seg(A[0],A[1],L[0],L[1],cssVar('--plot-line2'),3);
    g.seg(B[0],B[1],L[0],L[1],cssVar('--plot-line'),4); g.seg(L[0],L[1],C[0],C[1],cssVar('--plot-line3'),4);
    [['A',A],['L',L]].forEach(([n,p])=>{ g.dot(p[0],p[1],cssVar('--accent'),4.5); g.label(p[0],p[1],n,cssVar('--ink'),8,-6,'bold 14px Georgia'); });
    g.handle(B[0],B[1],cssVar('--plot-line')); g.label(B[0],B[1],'B',cssVar('--ink'),10,-8,'bold 14px Georgia');
    g.handle(C[0],C[1],cssVar('--plot-line3')); g.label(C[0],C[1],'C',cssVar('--ink'),10,-8,'bold 14px Georgia');
    const BL=Math.hypot(L[0]-B[0],L[1]-B[1]), LC=Math.hypot(C[0]-L[0],C[1]-L[1]);
    out.innerHTML='AL е ъглополовяща от A. '+frac('BL','LC')+' = <b>'+fmt(BL/LC,3)+'</b> = '+frac('AB','AC')+' = '+frac(fmt(c,2),fmt(b,2))+' = <b>'+fmt(c/b,3)+'</b> ✓';
    renderMath(out);
  }
  draw(); liveRedraws.push(draw);
  draggable(cv,g,()=>[
    {x:B[0],y:B[1],set:(x,y)=>B=[clamp(x,1.5,10.2),clamp(y,0.4,5.4)]},
    {x:C[0],y:C[1],set:(x,y)=>C=[clamp(x,0.4,10.2),clamp(y,0.4,5.4)]},
  ],draw);
}},

/* ---------- Окръжност: централен и вписан ъгъл (три подвижни точки) ---------- */
circle:{ build(root){
  const hint=el('div','mnote','Влачи A, B и C по окръжността — виж връзката централен ↔ вписан ъгъл.'); root.append(hint);
  const cv=mkCanvas(root,760,430), out=mkOut(root);
  const g=new Graph(cv,-2.2,2.2,-1.245,1.245);
  let A=[Math.cos(2.2),Math.sin(2.2)], B=[Math.cos(0.9),Math.sin(0.9)], C=[Math.cos(-1.4),Math.sin(-1.4)];
  const norm=p=>{ const L=Math.hypot(p[0],p[1])||1; return [p[0]/L,p[1]/L]; };
  function draw(){
    g.clear(); g.circle(0,0,1,cssVar('--ink'),2);
    g.seg(0,0,A[0],A[1],cssVar('--plot-line'),2); g.seg(0,0,B[0],B[1],cssVar('--plot-line'),2);
    g.seg(A[0],A[1],B[0],B[1],cssVar('--cS'),2.4);
    g.seg(C[0],C[1],A[0],A[1],cssVar('--plot-line3'),2.2); g.seg(C[0],C[1],B[0],B[1],cssVar('--plot-line3'),2.2);
    g.dot(0,0,cssVar('--accent'),4); g.label(0,0,'O',cssVar('--ink'),7,16,'bold 13px Georgia');
    [['A',A],['B',B],['C',C]].forEach(([n,p])=>{ g.handle(p[0],p[1],cssVar('--accent')); g.label(p[0],p[1],n,cssVar('--ink'),9,-7,'bold 14px Georgia'); });
    const dot=A[0]*B[0]+A[1]*B[1]; const central=Math.acos(clamp(dot,-1,1))*180/Math.PI;
    out.innerHTML='Централен ъгъл ∠AOB = <b>'+fmt(central,1)+'°</b> (равен на дъгата AB).'+
      '<br>Вписан ъгъл ∠ACB = '+frac(fmt(central,1)+'°','2')+' = <b>'+fmt(central/2,1)+'°</b> — половината от централния, за всяко положение на C по голямата дъга.';
    renderMath(out);
  }
  draw(); liveRedraws.push(draw);
  draggable(cv,g,()=>[
    {x:A[0],y:A[1],set:(x,y)=>A=norm([x,y])},
    {x:B[0],y:B[1],set:(x,y)=>B=norm([x,y])},
    {x:C[0],y:C[1],set:(x,y)=>C=norm([x,y])},
  ],draw);
}},

/* ---------- Тригонометрия на остър ъгъл: ъглова точка + точка за дължина ---------- */
trigright:{ build(root){
  const hint=el('div','mnote','Влачи <b style="color:#C05621">ъгловата точка</b>, за да смениш ъгъла α (отношенията се менят). Влачи <b style="color:#2B6CB0">върха C</b> по хипотенузата, за да смениш само дължините — отношенията остават същите!'); root.append(hint);
  const cv=mkCanvas(root,760,440), out=mkOut(root);
  const g=new Graph(cv,-0.6,10,-0.5,6.4);
  const A=[0.8,0.6]; const rA=2.0; let al=35*Math.PI/180, L=5;
  function draw(){
    // ограничаваме дължината, за да остане чертежът в екрана
    const Lmax=Math.min((9.5-A[0])/Math.cos(al),(5.9-A[1])/Math.sin(al)); L=clamp(L,2.7,Lmax);
    const u=[Math.cos(al),Math.sin(al)];
    const C=[A[0]+L*u[0],A[1]+L*u[1]], B=[C[0],A[1]];
    const opp=L*u[1], adj=L*u[0], hyp=L;
    const Hang=[A[0]+rA*u[0],A[1]+rA*u[1]];
    g.clear();
    // дъга на ъгъла
    const c=g.c; c.strokeStyle=cssVar('--cW'); c.lineWidth=1.6; c.beginPath(); c.arc(g.X(A[0]),g.Y(A[1]),34,0,-al,true); c.stroke();
    g.poly([A,B,C],null,cssVar('--ink'),2.2);
    g.seg(A[0],A[1],B[0],B[1],cssVar('--plot-line'),4); g.seg(B[0],B[1],C[0],C[1],cssVar('--plot-line2'),4);
    g.label((A[0]+B[0])/2,A[1],'прилежащ = '+fmt(adj,2),cssVar('--plot-line'),-40,22,'12px system-ui');
    g.label(B[0],(B[1]+C[1])/2,'срещулежащ = '+fmt(opp,2),cssVar('--plot-line2'),10,4,'12px system-ui');
    g.label((A[0]+C[0])/2,(A[1]+C[1])/2,'хипотенуза = '+fmt(hyp,2),cssVar('--ink'),-100,-10,'12px system-ui');
    g.label(A[0],A[1],'α = '+fmt(al*180/Math.PI,1)+'°',cssVar('--cW'),40,-4,'bold 14px Georgia');
    g.label(B[0],B[1],'∟',cssVar('--ink'),-16,-6,'14px system-ui');
    g.handle(Hang[0],Hang[1],cssVar('--accent'));
    g.handle(C[0],C[1],cssVar('--plot-line')); g.label(C[0],C[1],'C',cssVar('--ink'),10,-8,'bold 14px Georgia');
    out.innerHTML='sin α = '+frac('срещулежащ','хипотенуза')+' = '+frac(fmt(opp,2),fmt(hyp,2))+' = <b>'+fmt(Math.sin(al),3)+'</b> · '+
      'cos α = '+frac('прилежащ','хипотенуза')+' = '+frac(fmt(adj,2),fmt(hyp,2))+' = <b>'+fmt(Math.cos(al),3)+'</b> · tg α = '+frac('sin α','cos α')+' = <b>'+fmt(Math.tan(al),3)+'</b>'+
      '<br><span class="mnote">Провери: докато влачиш C (само дължините), тези три числа не се променят — зависят единствено от ъгъла α.</span>';
    renderMath(out);
  }
  draw(); liveRedraws.push(draw);
  draggable(cv,g,()=>{ const u=[Math.cos(al),Math.sin(al)]; const C=[A[0]+L*u[0],A[1]+L*u[1]]; const Hang=[A[0]+rA*u[0],A[1]+rA*u[1]];
    return [
      {x:Hang[0],y:Hang[1],set:(x,y)=>{ al=clamp(Math.atan2(y-A[1],x-A[0]),5*Math.PI/180,85*Math.PI/180); }},
      {x:C[0],y:C[1],set:(x,y)=>{ L=(x-A[0])*Math.cos(al)+(y-A[1])*Math.sin(al); }},
    ]; },draw);
}},

/* ---------- Единична окръжност: подвижна точка + анимация ---------- */
unitcircle:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const hint=el('div','mnote','Влачи точката по окръжността (или пусни анимацията) — виж синуса и косинуса.'); root.append(hint);
  const btn=el('button','btn','▶ Пусни'); ctls.append(btn);
  const cv=mkCanvas(root,760,320), out=mkOut(root);
  let ang=50*Math.PI/180, playing=false, raf=null;
  const cx=140, cy=160, R=110;
  btn.onclick=()=>{ playing=!playing; btn.textContent=playing?'⏸ Пауза':'▶ Пусни'; if(playing) tick(); else cancelAnimationFrame(raf); };
  function tick(){ ang=(ang+0.02)%(2*Math.PI); draw(); if(playing) raf=requestAnimationFrame(tick); }
  function draw(){
    const x=ang, deg=(x*180/Math.PI);
    const c=cv.getContext('2d'); c.clearRect(0,0,760,320);
    c.strokeStyle=cssVar('--muted'); c.lineWidth=1.4; c.beginPath(); c.arc(cx,cy,R,0,7); c.stroke();
    c.beginPath(); c.moveTo(cx-R-16,cy); c.lineTo(cx+R+16,cy); c.moveTo(cx,cy-R-16); c.lineTo(cx,cy+R+16); c.stroke();
    const px=cx+R*Math.cos(x), py=cy-R*Math.sin(x);
    c.strokeStyle=cssVar('--plot-line2'); c.setLineDash([4,4]); c.beginPath(); c.moveTo(px,py); c.lineTo(px,cy); c.stroke();
    c.strokeStyle=cssVar('--plot-line3'); c.beginPath(); c.moveTo(px,py); c.lineTo(cx,py); c.stroke(); c.setLineDash([]);
    c.strokeStyle=cssVar('--accent'); c.lineWidth=2; c.beginPath(); c.moveTo(cx,cy); c.lineTo(px,py); c.stroke();
    c.fillStyle=cssVar('--accent'); c.globalAlpha=.35; c.beginPath(); c.arc(px,py,11,0,7); c.fill(); c.globalAlpha=1;
    c.fillStyle=cssVar('--cW'); c.strokeStyle='#fff'; c.lineWidth=2; c.beginPath(); c.arc(px,py,7,0,7); c.fill(); c.stroke();
    c.fillStyle=cssVar('--plot-line2'); c.font='12px system-ui'; c.fillText('sin',px+8,(py+cy)/2);
    c.fillStyle=cssVar('--plot-line3'); c.fillText('cos',(px+cx)/2-12,py-6);
    const gx0=300,gw=440,gy=160,amp=95,per=2*Math.PI;
    c.strokeStyle=cssVar('--muted'); c.lineWidth=1; c.beginPath(); c.moveTo(gx0,gy); c.lineTo(gx0+gw,gy); c.moveTo(gx0,40); c.lineTo(gx0,280); c.stroke();
    const plot=(f,color)=>{ c.strokeStyle=color; c.lineWidth=2.2; c.beginPath(); for(let i=0;i<=gw;i++){ const d=per*i/gw; const Y=gy-amp*f(d); i?c.lineTo(gx0+i,Y):c.moveTo(gx0+i,Y);} c.stroke(); };
    plot(Math.sin,cssVar('--plot-line2')); plot(Math.cos,cssVar('--plot-line3'));
    const gX=gx0+gw*(x%per)/per;
    c.strokeStyle=cssVar('--accent'); c.setLineDash([4,4]); c.beginPath(); c.moveTo(gX,40); c.lineTo(gX,280); c.stroke(); c.setLineDash([]);
    c.fillStyle=cssVar('--plot-line2'); c.beginPath(); c.arc(gX,gy-amp*Math.sin(x),5,0,7); c.fill();
    c.fillStyle=cssVar('--plot-line3'); c.beginPath(); c.arc(gX,gy-amp*Math.cos(x),5,0,7); c.fill();
    c.fillStyle=cssVar('--plot-line2'); c.font='12.5px system-ui'; c.fillText('sin x',gx0+gw-42,54); c.fillStyle=cssVar('--plot-line3'); c.fillText('cos x',gx0+gw-42,70);
    const tg=Math.abs(Math.cos(x))<1e-3?'—':fmt(Math.tan(x),3);
    out.innerHTML='x = <b>'+fmt(deg,0)+'°</b> = '+fmt(x,2)+' rad · sin x = <b>'+fmt(Math.sin(x),3)+'</b> · cos x = <b>'+fmt(Math.cos(x),3)+'</b> · tg x = '+frac('sin x','cos x')+' = <b>'+tg+'</b>';
    renderMath(out);
  }
  draw(); liveRedraws.push(draw);
  // собствено плъзгане на точката по окръжността (пиксели)
  cv.style.touchAction='none'; let drag=false;
  const near=e=>{ const r=cv.getBoundingClientRect(); const mx=(e.clientX-r.left)*cv.width/r.width, my=(e.clientY-r.top)*cv.height/r.height;
    const px=cx+R*Math.cos(ang), py=cy-R*Math.sin(ang); return Math.hypot(mx-px,my-py)<28; };
  const setAng=e=>{ const r=cv.getBoundingClientRect(); const mx=(e.clientX-r.left)*cv.width/r.width, my=(e.clientY-r.top)*cv.height/r.height;
    ang=Math.atan2(cy-my,mx-cx); if(ang<0)ang+=2*Math.PI; draw(); };
  cv.addEventListener('pointerdown',e=>{ if(near(e)){ drag=true; cv.setPointerCapture&&cv.setPointerCapture(e.pointerId); e.preventDefault(); setAng(e); } });
  cv.addEventListener('pointermove',e=>{ if(drag){ e.preventDefault(); setAng(e); } else { cv.style.cursor=near(e)?'grab':'default'; } });
  cv.addEventListener('pointerup',()=>drag=false); cv.addEventListener('pointercancel',()=>drag=false);
}},

/* ---------- Прогресии: подвижни точки за първите два члена ---------- */
progr:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const hint=el('div','mnote','Влачи вертикално точките за a₁ и a₂ — те задават прогресията. Броят членове се сменя с бутоните.'); root.append(hint);
  const TYPE=sel(ctls,'Вид',[['a','аритметична'],['g','геометрична']],draw);
  const N=stepper(ctls,'n (брой членове)',3,14,8,draw);
  const cv=mkCanvas(root,760,360), out=mkOut(root);
  let a1=2, a2=3.5;
  function terms(){ const n=N(), type=TYPE(); const arr=[]; 
    if(type==='a'){ const d=a2-a1; for(let i=0;i<n;i++) arr.push(a1+i*d); }
    else { let q=Math.abs(a1)<1e-6?1:a2/a1; for(let i=0;i<n;i++) arr.push(a1*Math.pow(q,i)); }
    return arr; }
  function draw(){
    const n=N(), type=TYPE(), arr=terms();
    const maxA=Math.max(2,...arr.map(v=>Math.abs(v))); const g=new Graph(cv,0,n+1,-maxA*1.15,maxA*1.15);
    g.clear(); g.grid(1); g.seg(0,0,n+1,0,cssVar('--muted'),1.4);
    arr.forEach((v,i)=>{ const x=i+1; g.seg(x,0,x,v,cssVar('--plot-line'),2); g.dot(x,v,cssVar('--plot-line'),3.5);
      g.label(x,v,fmt(v,1),cssVar('--muted'),-8,v>=0?-8:16,'10.5px system-ui'); });
    g.handle(1,a1,cssVar('--plot-line2')); g.handle(2,a2,cssVar('--accent'));
    g.label(1,a1,'a₁',cssVar('--ink'),-6,22,'bold 12px Georgia'); g.label(2,a2,'a₂',cssVar('--ink'),-6,22,'bold 12px Georgia');
    const an=arr[n-1];
    if(type==='a'){ const d=a2-a1; const Sn=n*(a1+an)/2;
      out.innerHTML='Аритметична: a₁ = '+fmt(a1,2)+', d = a₂ − a₁ = <b>'+fmt(d,2)+'</b> · aₙ = a₁ + (n−1)d = <b>'+fmt(an,2)+'</b> · Sₙ = '+frac('n(a₁+aₙ)','2')+' = <b>'+fmt(Sn,2)+'</b>'; }
    else { let q=Math.abs(a1)<1e-6?1:a2/a1; const Sn=Math.abs(q-1)<1e-9?n*a1:a1*(Math.pow(q,n)-1)/(q-1);
      out.innerHTML='Геометрична: a₁ = '+fmt(a1,2)+', q = '+frac('a₂','a₁')+' = <b>'+fmt(q,3)+'</b> · aₙ = a₁·qⁿ⁻¹ = <b>'+fmt(an,3)+'</b> · Sₙ = '+frac('a₁(qⁿ − 1)','q − 1')+' = <b>'+fmt(Sn,3)+'</b>'; }
    renderMath(out);
  }
  draw(); liveRedraws.push(draw);
  const g0=new Graph(cv,0,9,-5,5); // временна; истинската се прави в draw, но за drag ни трябва актуален мащаб
  draggable(cv,{ X:(x)=>{const n=N();return x/(n+1)*cv.width;}, Y:(y)=>{const arr=terms();const maxA=Math.max(2,...arr.map(v=>Math.abs(v)));return cv.height-(y+maxA*1.15)/(2*maxA*1.15)*cv.height;},
      gx:sx=>{const n=N();return sx/cv.width*(n+1);}, gy:sy=>{const arr=terms();const maxA=Math.max(2,...arr.map(v=>Math.abs(v)));return -maxA*1.15+(cv.height-sy)/cv.height*(2*maxA*1.15);} },
    ()=>[{x:1,y:a1,axis:'y',set:(x,y)=>a1=snap(y,0.5)},{x:2,y:a2,axis:'y',set:(x,y)=>a2=snap(y,0.5)}],draw);
}},

/* ---------- Вероятност: обединение (стъпкови вероятности + диаграма) ---------- */
venn:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const hint=el('div','mnote','Задай вероятностите с бутоните − / + и виж формулата за обединение.'); root.append(hint);
  const PA=stepperF(ctls,'P(A)',0.05,0.95,0.05,0.5,draw), PB=stepperF(ctls,'P(B)',0.05,0.95,0.05,0.4,draw), PAB=stepperF(ctls,'P(A∩B)',0,0.6,0.05,0.2,draw);
  const cv=mkCanvas(root,760,300), out=mkOut(root);
  function draw(){
    const pa=PA(); const pb=PB(); let pab=Math.min(PAB(),pa,pb);
    const c=cv.getContext('2d'); c.clearRect(0,0,760,300);
    const rA=40+90*Math.sqrt(pa), rB=40+90*Math.sqrt(pb); const overlap=pab/Math.min(pa,pb);
    const dist=(rA+rB)*(1-0.85*overlap); const cx=380,cy=150,xA=cx-dist/2,xB=cx+dist/2;
    c.globalAlpha=.45; c.fillStyle=cssVar('--plot-line'); c.beginPath(); c.arc(xA,cy,rA,0,7); c.fill();
    c.fillStyle=cssVar('--plot-line2'); c.beginPath(); c.arc(xB,cy,rB,0,7); c.fill(); c.globalAlpha=1;
    c.strokeStyle=cssVar('--ink'); c.lineWidth=1.6; c.beginPath(); c.arc(xA,cy,rA,0,7); c.stroke(); c.beginPath(); c.arc(xB,cy,rB,0,7); c.stroke();
    c.fillStyle=cssVar('--ink'); c.font='bold 16px Georgia'; c.fillText('A',xA-rA+12,cy-rA+26); c.fillText('B',xB+rB-24,cy-rB+26);
    if(pab>0){ c.font='12px system-ui'; c.fillText('A∩B',cx-16,cy+4); }
    const un=pa+pb-pab;
    out.innerHTML='P(A∪B) = P(A) + P(B) − P(A∩B) = '+fmt(pa)+' + '+fmt(pb)+' − '+fmt(pab)+' = <b>'+fmt(un,2)+'</b>'+
      (pab===0?'<br><span class="mnote">A∩B = ∅ → несъвместими събития, P(A∪B) = P(A) + P(B).</span>':'')+
      (un>1?'<br><span class="mnote" style="color:var(--cW)">P(A∪B) не може да надхвърля 1 — намали P(A) или P(B), или увеличи сечението.</span>':'');
  }
  draw(); liveRedraws.push(draw);
}},

/* ---------- Статистика: свои данни ---------- */
stats:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const box=el('div','ctl'); box.style.flex='1 1 320px'; box.innerHTML='<label>Данни (числа със запетая)</label>';
  const ta=document.createElement('textarea'); ta.rows=2; ta.value='2, 3, 3, 5, 7, 7, 7, 8, 10, 12, 4, 6, 6, 9'; box.append(ta); ctls.append(box);
  const BINS=stepper(ctls,'брой интервали',3,10,5,draw); ta.addEventListener('input',draw);
  const cv=mkCanvas(root,760,300), tblWrap=el('div'), out=mkOut(root); root.append(tblWrap);
  function draw(){
    const data=ta.value.split(/[,;\s]+/).map(Number).filter(v=>isFinite(v));
    const c=cv.getContext('2d'); c.clearRect(0,0,760,300);
    if(data.length<2){ out.innerHTML='Въведи поне две числа.'; tblWrap.innerHTML=''; return; }
    const n=data.length, sorted=[...data].sort((a,b)=>a-b); const mean=data.reduce((s,v)=>s+v,0)/n;
    const median=n%2?sorted[(n-1)/2]:(sorted[n/2-1]+sorted[n/2])/2;
    const freq={}; data.forEach(v=>freq[v]=(freq[v]||0)+1); const maxf=Math.max(...Object.values(freq));
    const modes=Object.keys(freq).filter(k=>freq[k]===maxf).map(Number); const range=sorted[n-1]-sorted[0];
    const varr=data.reduce((s,v)=>s+(v-mean)**2,0)/n, sd=Math.sqrt(varr);
    const k=BINS(), lo=sorted[0], hi=sorted[n-1]+1e-9, w=(hi-lo)/k||1; const bins=Array(k).fill(0); data.forEach(v=>bins[Math.min(k-1,Math.floor((v-lo)/w))]++);
    const bmax=Math.max(...bins), x0=60,y0=250,gw=660,gh=200;
    c.strokeStyle=cssVar('--muted'); c.beginPath(); c.moveTo(x0,y0); c.lineTo(x0+gw,y0); c.moveTo(x0,y0); c.lineTo(x0,y0-gh-10); c.stroke(); c.font='11px system-ui';
    const pts=[]; bins.forEach((f,i)=>{ const bx=x0+i*(gw/k)+4,bw=gw/k-8,bh=gh*f/bmax; c.fillStyle=cssVar('--plot-line'); c.globalAlpha=.75; c.fillRect(bx,y0-bh,bw,bh); c.globalAlpha=1;
      c.fillStyle=cssVar('--ink'); c.textAlign='center'; c.fillText(f,bx+bw/2,y0-bh-5); c.fillStyle=cssVar('--muted'); c.fillText(fmt(lo+i*w,1)+'–'+fmt(lo+(i+1)*w,1),bx+bw/2,y0+14); pts.push([bx+bw/2,y0-bh]); });
    c.strokeStyle=cssVar('--plot-line2'); c.lineWidth=2.4; c.beginPath(); pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])); c.stroke();
    pts.forEach(p=>{ c.fillStyle=cssVar('--plot-line2'); c.beginPath(); c.arc(p[0],p[1],4,0,7); c.fill(); }); c.textAlign='left';
    const rows=Object.keys(freq).map(Number).sort((a,b)=>a-b);
    tblWrap.innerHTML='<table class="mt"><tr><th>стойност</th>'+rows.map(v=>'<td>'+v+'</td>').join('')+'</tr><tr><th>честота</th>'+rows.map(v=>'<td>'+freq[v]+'</td>').join('')+'</tr></table>';
    out.innerHTML='n = <b>'+n+'</b> · средно x̄ = <b>'+fmt(mean,2)+'</b> · медиана = <b>'+fmt(median,2)+'</b> · мода = <b>'+modes.join(', ')+'</b> · размах = <b>'+fmt(range,2)+'</b> · стандартно отклонение s = <b>'+fmt(sd,3)+'</b>';
  }
  draw(); liveRedraws.push(draw);
}},

/* ---------- Стереометрия: тела (видими/скрити ръбове + построения) ---------- */
stereo:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const hint=el('div','mnote','Влачи върху чертежа, за да завъртиш тялото. Плътните ръбове са видими, пунктираните — скрити. Избери построение долу.'); root.append(hint);
  const SHAPE=sel(ctls,'Тяло',[['prism','права призма'],['pyr','правилна пирамида'],['cyl','цилиндър'],['cone','конус'],['sph','сфера / кълбо']],draw);
  const CON=sel(ctls,'Построение',[['none','— без'],['height','височина h'],['apo','апотема / радиус'],['lp','ъгъл права–равнина'],['dih','линеен ъгъл на двустенен ъгъл']],draw);
  const spin=el('button','btn','⟳ Автовъртене'); ctls.append(spin);
  const A=stepperF(ctls,'основа a / радиус r',1,4,0.2,2,draw), Hh=stepperF(ctls,'височина h / R',1,5,0.2,3.2,draw), NN=stepper(ctls,'брой стени n',3,8,6,draw);
  const cv=mkCanvas(root,760,400), out=mkOut(root); let rot=25*Math.PI/180, spinning=false, raf=null;
  spin.onclick=()=>{ spinning=!spinning; spin.classList.toggle('on',spinning); if(spinning) loop(); else cancelAnimationFrame(raf); };
  function loop(){ rot+=0.014; draw(); if(spinning) raf=requestAnimationFrame(loop); }
  const view=(()=>{ const v=[0,0.42,1],L=Math.hypot(...v); return [v[0]/L,v[1]/L,v[2]/L]; })();
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const norm=a=>{const L=Math.hypot(...a)||1;return [a[0]/L,a[1]/L,a[2]/L];}, mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];
  function rotP(p){ const [x,y,z]=p; return [x*Math.cos(rot)+z*Math.sin(rot), y, z*Math.cos(rot)-x*Math.sin(rot)]; }
  function scr(rp){ const k=52; return [380+k*rp[0], 210-k*rp[1]+k*rp[2]*0.42]; }
  function line(c,rA,rB,color,w,dashed){ const A2=scr(rA),B2=scr(rB); c.globalAlpha=dashed?0.5:1; c.strokeStyle=color; c.lineWidth=dashed?Math.max(1,w-0.5):w; c.setLineDash(dashed?[5,5]:[]); c.beginPath(); c.moveTo(A2[0],A2[1]); c.lineTo(B2[0],B2[1]); c.stroke(); c.setLineDash([]); c.globalAlpha=1; }
  function wline(c,Pa,Pb,color,w,dashed){ line(c,rotP(Pa),rotP(Pb),color,w,dashed); }
  function wlabel(c,P,txt,color,dx,dy){ const s=scr(rotP(P)); c.fillStyle=color; c.font='bold 13px Georgia'; c.fillText(txt,s[0]+(dx||6),s[1]+(dy||-6)); }
  function angleArc(c,Vp,P1,P2,arcR,color){ const d1=norm(sub(P1,Vp)),d2=norm(sub(P2,Vp)); const ang=Math.acos(clamp(dot(d1,d2),-1,1));
    c.strokeStyle=color; c.lineWidth=1.8; c.setLineDash([]); c.beginPath();
    for(let i=0;i<=20;i++){ const t=i/20; const d=norm([d1[0]+(d2[0]-d1[0])*t,d1[1]+(d2[1]-d1[1])*t,d1[2]+(d2[2]-d1[2])*t]); const P=scr(rotP(add(Vp,mul(d,arcR)))); i?c.lineTo(P[0],P[1]):c.moveTo(P[0],P[1]); }
    c.stroke(); return ang*180/Math.PI; }
  function drawPoly(c,verts,faces,colV,colH){
    const rv=verts.map(rotP); const cen=rv.reduce((s,p)=>add(s,p),[0,0,0]).map(x=>x/rv.length);
    const fv=faces.map(f=>{ let nrm=cross(sub(rv[f[1]],rv[f[0]]),sub(rv[f[2]],rv[f[0]])); const fc=f.reduce((s,i)=>add(s,rv[i]),[0,0,0]).map(x=>x/f.length); if(dot(nrm,sub(fc,cen))<0)nrm=mul(nrm,-1); return dot(nrm,view)>0; });
    const em={}; faces.forEach((f,fi)=>{ for(let i=0;i<f.length;i++){ const a=f[i],b=f[(i+1)%f.length],key=Math.min(a,b)+'_'+Math.max(a,b); if(!em[key])em[key]={a:Math.min(a,b),b:Math.max(a,b),vis:false}; if(fv[fi])em[key].vis=true; } });
    const eg=Object.values(em); eg.filter(e=>!e.vis).forEach(e=>line(c,rv[e.a],rv[e.b],colH,1.7,true)); eg.filter(e=>e.vis).forEach(e=>line(c,rv[e.a],rv[e.b],colV,2.1,false));
  }
  function ringPts(rad,y,m){ return [...Array(m)].map((_,i)=>{const t=2*Math.PI*i/m;return [rad*Math.cos(t),y,rad*Math.sin(t)];}); }
  function drawRing(c,pts,colV,colH){ const rv=pts.map(rotP),m=rv.length; for(let i=0;i<m;i++){ const A2=rv[i],B2=rv[(i+1)%m],front=(A2[2]+B2[2])/2>0; line(c,A2,B2,front?colV:colH,front?2.1:1.7,!front); } }
  function pickFront(pts){ let bi=0,bd=-1e9; pts.forEach((p,i)=>{const z=rotP(p)[2]; if(z>bd){bd=z;bi=i;}}); return pts[bi]; }
  function extremes(pts){ let li=0,ri=0,lu=1e9,ru=-1e9; pts.forEach((p,i)=>{const u=rotP(p)[0]; if(u<lu){lu=u;li=i;} if(u>ru){ru=u;ri=i;}}); return [pts[li],pts[ri]]; }

  function draw(){
    const shape=SHAPE(), con=CON(), a=A(), h=Hh(), n=NN();
    const c=cv.getContext('2d'); c.clearRect(0,0,760,400);
    const ink=cssVar('--ink'), mut=cssVar('--muted'), red=cssVar('--cW'), grn=cssVar('--cF'); let txt='', cnote='';
    const Rb=a/(2*Math.sin(Math.PI/n)), apo=a/(2*Math.tan(Math.PI/n));
    if(shape==='prism'||shape==='pyr'){
      const verts=[]; for(let i=0;i<n;i++){const t=2*Math.PI*i/n; verts.push([Rb*Math.cos(t),0,Rb*Math.sin(t)]);}
      const faces=[]; const base=[]; for(let i=0;i<n;i++)base.push(i);
      const Sb=n*a*a/(4*Math.tan(Math.PI/n)), Pp=n*a;
      if(shape==='prism'){ for(let i=0;i<n;i++){const t=2*Math.PI*i/n; verts.push([Rb*Math.cos(t),h,Rb*Math.sin(t)]);}
        const top=[]; for(let i=0;i<n;i++)top.push(i+n); faces.push(base.slice().reverse()); faces.push(top.slice()); for(let i=0;i<n;i++){const j=(i+1)%n; faces.push([i,j,j+n,i+n]);}
        drawPoly(c,verts,faces,ink,mut);
        txt='Права '+n+'-ъгълна призма: S = P·h + 2S<sub>осн</sub> = <b>'+fmt(Pp*h+2*Sb,2)+'</b> · V = S<sub>осн</sub>·h = <b>'+fmt(Sb*h,2)+'</b>';
        const cB=[0,0,0],cT=[0,h,0], m01=mid(verts[0],verts[1]);
        if(con==='height'){ wline(c,cB,cT,red,2.6); wlabel(c,mid(cB,cT),'h',red,8,0); cnote='Височината съединява центровете на основите и е ⟂ на тях.'; }
        else if(con==='apo'){ wline(c,cB,m01,red,2.4,true); wlabel(c,mid(cB,m01),'r',red,4,-4); cnote='r = апотема на основата = '+fmt(apo,2)+' (радиус на вписаната в основата окръжност).'; }
        else if(con==='lp'){ const k=Math.floor(n/2), Vb0=verts[0], Vt=[verts[k][0],h,verts[k][2]]; wline(c,Vb0,Vt,red,2.4); wline(c,Vb0,verts[k],grn,2,true); const ang=angleArc(c,Vb0,Vt,verts[k],0.9,red); wlabel(c,Vb0,fmt(ang,0)+'°',red,10,14); cnote='Ъгъл между диагонала на призмата и основата (проекцията му) = <b>'+fmt(ang,0)+'°</b>.'; }
        else if(con==='dih'){ const ang=angleArc(c,verts[0],verts[1],verts[n-1],0.9,red); wline(c,verts[0],verts[1],red,2); wline(c,verts[0],verts[n-1],red,2); wlabel(c,verts[0],fmt(ang,0)+'°',red,8,16); cnote='Двустенният ъгъл между две съседни околни стени има линеен ъгъл = вътрешния ъгъл на основата = <b>'+fmt(ang,0)+'°</b>.'; }
      } else { const apex=[0,h,0]; verts.push(apex); faces.push(base.slice().reverse()); for(let i=0;i<n;i++){const j=(i+1)%n; faces.push([i,j,n]);}
        drawPoly(c,verts,faces,ink,mut);
        const l=Math.hypot(h,apo);
        txt='Правилна '+n+'-ъгълна пирамида: S = '+frac('P·l','2')+' + S<sub>осн</sub> = <b>'+fmt(Pp*l/2+Sb,2)+'</b> · V = '+frac('S<sub>осн</sub>·h','3')+' = <b>'+fmt(Sb*h/3,2)+'</b>';
        const cB=[0,0,0], m01=mid(verts[0],verts[1]);
        if(con==='height'){ wline(c,cB,apex,red,2.6); wlabel(c,mid(cB,apex),'h',red,8,0); cnote='Височината h съединява върха с центъра на основата и е ⟂ на нея.'; }
        else if(con==='apo'){ wline(c,apex,m01,red,2.6); wlabel(c,mid(apex,m01),'l',red,8,0); wline(c,cB,m01,grn,2,true); wlabel(c,mid(cB,m01),'r',grn,4,12); cnote='Апотема на пирамидата l = '+fmt(l,2)+' (от върха до средата на основен ръб); r = апотема на основата = '+fmt(apo,2)+'.'; }
        else if(con==='lp'){ const Vb0=verts[0]; wline(c,apex,Vb0,red,2.4); wline(c,cB,Vb0,grn,2,true); const ang=angleArc(c,Vb0,apex,cB,0.9,red); wlabel(c,Vb0,fmt(ang,0)+'°',red,10,14); cnote='Ъгъл между околен ръб и основата = ъгъла между ръба и проекцията му = <b>'+fmt(ang,0)+'°</b>.'; }
        else if(con==='dih'){ wline(c,m01,apex,red,2.4); wline(c,m01,cB,grn,2,true); const ang=angleArc(c,m01,apex,cB,0.8,red); wlabel(c,m01,fmt(ang,0)+'°',red,10,14); cnote='Линеен ъгъл на двустенния ъгъл между околна стена и основата (при средата на основен ръб) = <b>'+fmt(ang,0)+'°</b>.'; }
      }
    }
    else if(shape==='cyl'||shape==='cone'){
      const m=44, rimB=ringPts(a,0,m); const cB=[0,0,0];
      if(shape==='cyl'){ const rimT=ringPts(a,h,m); drawRing(c,rimB,ink,mut); drawRing(c,rimT,ink,mut);
        const [l1,l2]=extremes(rimB); wline(c,l1,[l1[0],h,l1[2]],ink,2.1); wline(c,l2,[l2[0],h,l2[2]],ink,2.1);
        txt='Цилиндър: S = 2πrh + 2πr² = <b>'+fmt(2*Math.PI*a*h+2*Math.PI*a*a,2)+'</b> · V = πr²h = <b>'+fmt(Math.PI*a*a*h,2)+'</b>';
        const cT=[0,h,0], rf=pickFront(rimB);
        if(con==='height'){ wline(c,cB,cT,red,2.6); wlabel(c,mid(cB,cT),'h',red,8,0); cnote='Височината съединява центровете на основите.'; }
        else if(con==='apo'){ wline(c,cB,rf,red,2.4); wlabel(c,mid(cB,rf),'r',red,4,-4); cnote='r = радиус на основата = '+fmt(a,2)+' (цилиндърът няма апотема).'; }
        else if(con!=='none') cnote='За цилиндър се разглеждат височина и радиус; ъгъл права–равнина и двустенен ъгъл не са характерни.';
      } else { const apex=[0,h,0]; drawRing(c,rimB,ink,mut); const [l1,l2]=extremes(rimB); wline(c,l1,apex,ink,2.1); wline(c,l2,apex,ink,2.1);
        const l=Math.hypot(a,h);
        txt='Конус: l = √(r²+h²) = '+fmt(l,2)+' · S = πrl + πr² = <b>'+fmt(Math.PI*a*l+Math.PI*a*a,2)+'</b> · V = '+frac('πr²h','3')+' = <b>'+fmt(Math.PI*a*a*h/3,2)+'</b>';
        const rf=pickFront(rimB);
        if(con==='height'){ wline(c,cB,apex,red,2.6); wlabel(c,mid(cB,apex),'h',red,8,0); cnote='Височината съединява върха с центъра на основата.'; }
        else if(con==='apo'){ wline(c,apex,rf,red,2.6); wlabel(c,mid(apex,rf),'l',red,8,0); wline(c,cB,rf,grn,2,true); cnote='Образувателна (апотема) l = √(r²+h²) = '+fmt(l,2)+'.'; }
        else if(con==='lp'){ wline(c,apex,rf,red,2.4); wline(c,cB,rf,grn,2,true); const ang=angleArc(c,rf,apex,cB,0.9,red); wlabel(c,rf,fmt(ang,0)+'°',red,10,14); cnote='Ъгъл между образувателната и основата = <b>'+fmt(ang,0)+'°</b>.'; }
        else if(con==='dih') cnote='Двустенен ъгъл не е характерен за конус — избери височина, апотема или ъгъл права–равнина.';
      }
    }
    else { const R=h/1.6+0.8, m=40;
      for(const lat of[-55,-30,0,30,55]){ const y=R*Math.sin(lat*Math.PI/180), rr=R*Math.cos(lat*Math.PI/180); drawRing(c,ringPts(rr,y,m),lat===0?ink:mut,mut); }
      for(const lon of[0,60,120]){ const pts=[...Array(m)].map((_,i)=>{const t=2*Math.PI*i/m;return [R*Math.cos(t)*Math.cos(lon*Math.PI/180),R*Math.sin(t),R*Math.cos(t)*Math.sin(lon*Math.PI/180)];}); const rv=pts.map(rotP); for(let i=0;i<m;i++){const A2=rv[i],B2=rv[(i+1)%m],front=(A2[2]+B2[2])/2>0; line(c,A2,B2,front?ink:mut,front?1.6:1.3,!front);} }
      txt='Сфера с R = '+fmt(R,2)+': S = 4πR² = <b>'+fmt(4*Math.PI*R*R,2)+'</b> · кълбо: V = '+frac('4πR³','3')+' = <b>'+fmt(4/3*Math.PI*R**3,2)+'</b>';
      const cO=[0,0,0], top=[0,R,0], rf=pickFront(ringPts(R,0,m));
      if(con==='height'||con==='apo'){ wline(c,cO,con==='height'?top:rf,red,2.4); wlabel(c,mid(cO,con==='height'?top:rf),'R',red,8,0); cnote='При сфера всички радиуси са равни на R = '+fmt(R,2)+'.'; }
      else if(con!=='none') cnote='Ъгъл права–равнина и двустенен ъгъл не се разглеждат за сфера.';
    }
    out.innerHTML=txt+(cnote?'<br><span class="mnote">'+cnote+'</span>':''); renderMath(out);
  }
  draw(); liveRedraws.push(draw);
  cv.style.touchAction='none'; let drag=false,lastX=0;
  cv.addEventListener('pointerdown',e=>{ drag=true; lastX=e.clientX; cv.setPointerCapture&&cv.setPointerCapture(e.pointerId); cv.style.cursor='grabbing'; });
  cv.addEventListener('pointermove',e=>{ if(drag){ rot+=(e.clientX-lastX)*0.012; lastX=e.clientX; draw(); } else cv.style.cursor='grab'; });
  cv.addEventListener('pointerup',()=>{drag=false;cv.style.cursor='grab';}); cv.addEventListener('pointercancel',()=>drag=false);
}},

/* ---------- Основни понятия в пространството (3D) ---------- */
stereobasics:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const hint=el('div','mnote','Влачи върху сцената, за да я завъртиш. Избери понятие от менюто.'); root.append(hint);
  const MODE=sel(ctls,'Понятие',[
    ['plane3p','Равнина през 3 неколинеарни точки'],
    ['planeLP','Равнина през права и точка извън нея'],
    ['lines-int','Две пресичащи се прави'],
    ['lines-par','Две успоредни прави'],
    ['lines-skew','Две кръстосани прави'],
    ['lp-in','Права, лежаща в равнина'],
    ['lp-par','Права, успоредна на равнина'],
    ['lp-cross','Права, пресичаща равнина в точка'],
    ['pp-par','Две успоредни равнини'],
    ['pp-int','Две пресичащи се равнини'],
    ['ang-ll','Ъгъл между две прави'],
    ['ang-lp','Ъгъл между права и равнина'],
    ['ang-pp','Ъгъл между две равнини (двустенен)'],
  ],draw);
  const cv=mkCanvas(root,760,400), out=mkOut(root); let rot=28*Math.PI/180;
  const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], mul=(a,s)=>[a[0]*s,a[1]*s,a[2]*s];
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const norm=a=>{const L=Math.hypot(...a)||1;return [a[0]/L,a[1]/L,a[2]/L];};
  function rotP(p){ const [x,y,z]=p; return [x*Math.cos(rot)+z*Math.sin(rot), y, z*Math.cos(rot)-x*Math.sin(rot)]; }
  function scr(p){ const r=rotP(p),k=48; return [380+k*r[0], 205-k*r[1]+k*r[2]*0.42]; }
  function seg(c,P,Q,color,w,dashed){ const A=scr(P),B=scr(Q); c.strokeStyle=color; c.lineWidth=w||2; c.globalAlpha=dashed?0.6:1; c.setLineDash(dashed?[6,5]:[]); c.beginPath(); c.moveTo(A[0],A[1]); c.lineTo(B[0],B[1]); c.stroke(); c.setLineDash([]); c.globalAlpha=1; }
  function line(c,C,dir,len,color,w,dashed){ seg(c,add(C,mul(dir,-len)),add(C,mul(dir,len)),color,w,dashed); }
  function dotp(c,P,lab,color){ const s=scr(P); c.fillStyle=color; c.beginPath(); c.arc(s[0],s[1],4.5,0,7); c.fill(); if(lab){ c.font='bold 13px Georgia'; c.fillText(lab,s[0]+7,s[1]-6); } }
  function plane(c,C,U,V,fill,stroke){
    const P=[add(add(C,U),V),add(sub(C,U),V),add(sub(C,U),mul(V,-1)),add(add(C,U),mul(V,-1))];
    c.beginPath(); P.forEach((p,i)=>{const s=scr(p); i?c.lineTo(s[0],s[1]):c.moveTo(s[0],s[1]);}); c.closePath();
    c.fillStyle=fill; c.globalAlpha=0.5; c.fill(); c.globalAlpha=1; c.strokeStyle=stroke; c.lineWidth=1.4; c.stroke();
    c.strokeStyle=stroke; c.globalAlpha=0.4; c.lineWidth=0.8;
    for(const s of[-0.6,-0.2,0.2,0.6]){ seg(c,add(add(C,mul(U,s)),V),add(add(C,mul(U,s)),mul(V,-1)),stroke,0.8); seg(c,add(add(C,U),mul(V,s)),add(sub(C,U),mul(V,s)),stroke,0.8); }
    c.globalAlpha=1;
  }
  function angleArc(c,Vp,d1,d2,arcR,color){ d1=norm(d1); d2=norm(d2); const ang=Math.acos(Math.max(-1,Math.min(1,dot(d1,d2))));
    c.strokeStyle=color; c.lineWidth=1.8; c.beginPath();
    for(let i=0;i<=20;i++){ const t=i/20; const d=norm([d1[0]+(d2[0]-d1[0])*t,d1[1]+(d2[1]-d1[1])*t,d1[2]+(d2[2]-d1[2])*t]); const s=scr(add(Vp,mul(d,arcR))); i?c.lineTo(s[0],s[1]):c.moveTo(s[0],s[1]); }
    c.stroke(); return ang*180/Math.PI; }
  function draw(){
    const m=MODE(); const c=cv.getContext('2d'); c.clearRect(0,0,760,400);
    const ink=cssVar('--ink'), acc=cssVar('--plot-line'), acc2=cssVar('--plot-line2'), red=cssVar('--cW'), grn=cssVar('--cF'), mut=cssVar('--muted');
    const pf=acc+'22'; let txt='';
    const U=[2.6,0,0], V=[0,0,2.0];
    if(m==='plane3p'){ const P1=[-1.6,0,-1.2],P2=[2,0,-0.6],P3=[0.2,0,1.6];
      plane(c,[0,0,0],U,V,pf,acc); dotp(c,P1,'A',red); dotp(c,P2,'B',red); dotp(c,P3,'C',red);
      seg(c,P1,P2,red,1.5,true); seg(c,P2,P3,red,1.5,true); seg(c,P3,P1,red,1.5,true);
      txt='<b>Аксиома.</b> През три точки, които не лежат на една права, минава <b>една единствена</b> равнина.'; }
    else if(m==='planeLP'){ plane(c,[0,0,0],U,V,pf,acc); const A=[-2,0,-0.8],B=[2,0,0.4]; line(c,[0,0,-0.2],norm(sub(B,A)),2.6,acc2,2.4); dotp(c,[0.9,0,1.3],'M',red);
      txt='Права $g$ и точка $M$ извън нея определят <b>една</b> равнина — тя съдържа правата и точката.'; }
    else if(m==='lines-int'){ plane(c,[0,0,0],U,V,pf,acc); line(c,[0,0,0],norm([1,0,0.5]),2.6,acc2,2.4); line(c,[0,0,0],norm([-0.6,0,1]),2.4,red,2.4); dotp(c,[0,0,0],'',ink);
      txt='Две <b>пресичащи се</b> прави имат обща точка и определят една равнина.'; }
    else if(m==='lines-par'){ plane(c,[0,0,0],U,V,pf,acc); line(c,[0,0,-0.7],norm([1,0,0.35]),2.6,acc2,2.4); line(c,[0,0,0.7],norm([1,0,0.35]),2.6,red,2.4);
      txt='Две <b>успоредни</b> прави (в една равнина, без обща точка) също определят равнина.'; }
    else if(m==='lines-skew'){ plane(c,[0,0,0],U,V,pf,acc); line(c,[0,-0.02,0],norm([1,0,0.3]),2.6,acc2,2.4);
      line(c,[0.3,1.4,0.2],norm([0.2,0,1]),1.9,red,2.4); dotp(c,[0.3,1.4,0.2],'',red);
      txt='<b>Кръстосани</b> прави не лежат в обща равнина — не се пресичат и не са успоредни. Червената минава над равнината на синята.'; }
    else if(m==='lp-in'){ plane(c,[0,0,0],U,V,pf,acc); line(c,[0,0,0.2],norm([1,0,0.25]),2.6,red,2.6);
      txt='<b>Аксиома.</b> Ако две точки на права лежат в равнина, то <b>цялата права</b> лежи в равнината.'; }
    else if(m==='lp-par'){ plane(c,[0,0,0],U,V,pf,acc); line(c,[0,1.2,0.2],norm([1,0,0.25]),2.6,red,2.6);
      txt='Права е <b>успоредна</b> на равнина, ако няма обща точка с нея (тук — на височина над равнината).'; }
    else if(m==='lp-cross'){ plane(c,[0,0,0],U,V,pf,acc); const O=[0.3,0,0.2]; line(c,O,norm([0.35,1,0.2]),2.2,red,2.6); dotp(c,O,'P',ink);
      txt='Права <b>пресича</b> равнина, ако имат точно <b>една</b> обща точка $P$.'; }
    else if(m==='pp-par'){ plane(c,[0,-0.9,0],U,V,pf,acc); plane(c,[0,1.1,0],U,V,acc2+'22',acc2);
      txt='Две <b>успоредни</b> равнини нямат обща точка. Разстоянието между тях е постоянно.'; }
    else if(m==='pp-int'){ plane(c,[0,0,0],U,V,pf,acc); plane(c,[0,0,0],[2.4,0,0],[0,2.0,0],acc2+'22',acc2); line(c,[0,0,0],[1,0,0],2.6,red,2.8);
      txt='<b>Аксиома.</b> Ако две равнини имат обща точка, те се пресичат по <b>обща права</b> (червената).'; }
    else if(m==='ang-ll'){ plane(c,[0,0,0],U,V,pf,acc); const d1=norm([1,0,0.3]),d2=norm([-0.3,0,1]); line(c,[0,0,0],d1,2.4,acc2,2.4); line(c,[0,0,0],d2,2.2,red,2.4);
      const ang=angleArc(c,[0,0,0],d1,d2,0.9,ink); txt='Ъгълът между две прави е острият ъгъл между тях (или между успоредни на тях през обща точка): <b>'+fmt(ang,0)+'°</b>.'; }
    else if(m==='ang-lp'){ plane(c,[0,0,0],U,V,pf,acc); const O=[-0.6,0,-0.2], dir=norm([1.1,1.3,0.3]); const tip=add(O,mul(dir,2)); const proj=[tip[0],0,tip[2]];
      seg(c,O,tip,red,2.6); seg(c,O,proj,grn,2,true); seg(c,tip,proj,mut,1.4,true); dotp(c,proj,'',ink);
      const ang=angleArc(c,O,sub(tip,O),sub(proj,O),0.8,ink); txt='Ъгъл между права и равнина = ъгълът между правата и <b>проекцията</b> ѝ върху равнината: <b>'+fmt(ang,0)+'°</b>.'; }
    else if(m==='ang-pp'){ plane(c,[0,0,0],U,V,pf,acc); const tilt=norm([0,0.8,1]); plane(c,[0,0,0],[2.4,0,0],mul(tilt,2.0),acc2+'22',acc2);
      line(c,[0,0,0],[1,0,0],2.6,ink,2.6); const M=[1.1,0,0]; const dBase=[0,0,1], dTilt=norm([0,0.8,1]);
      seg(c,M,add(M,mul(dBase,1.4)),grn,2.2); seg(c,M,add(M,mul(dTilt,1.4)),red,2.2);
      const ang=angleArc(c,M,dBase,dTilt,0.9,ink); dotp(c,M,'',ink);
      txt='Двустенен ъгъл: при точка от пресечницата издигаме по един перпендикуляр във всяка равнина — техният ъгъл е <b>линейният ъгъл</b> = <b>'+fmt(ang,0)+'°</b>.'; }
    out.innerHTML=txt; renderMath(out);
  }
  draw(); liveRedraws.push(draw);
  cv.style.touchAction='none'; let drag=false,lastX=0;
  cv.addEventListener('pointerdown',e=>{ drag=true; lastX=e.clientX; cv.setPointerCapture&&cv.setPointerCapture(e.pointerId); cv.style.cursor='grabbing'; });
  cv.addEventListener('pointermove',e=>{ if(drag){ rot+=(e.clientX-lastX)*0.012; lastX=e.clientX; draw(); } else cv.style.cursor='grab'; });
  cv.addEventListener('pointerup',()=>{drag=false;cv.style.cursor='grab';}); cv.addEventListener('pointercancel',()=>drag=false);
}},

/* ---------- Вектори: подвижни върхове ---------- */
vectors:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const hint=el('div','mnote','Влачи върховете на векторите (сините точки).'); root.append(hint);
  const MODE=sel(ctls,'Действие',[['sum','a + b (триъгълник и успоредник)'],['mul','k · a (умножение с число)']],draw);
  const cv=mkCanvas(root,760,430), out=mkOut(root); const g=new Graph(cv,-9,9,-5.1,5.1);
  let Pa=[3,1], Pb=[1,2.5], Pk=[4.5,1.5];
  function arrow(x1,y1,x2,y2,color,w,dash){ if(Math.hypot(x2-x1,y2-y1)<1e-6)return; g.seg(x1,y1,x2,y2,color,w||2.6,dash);
    const c=g.c,X2=g.X(x2),Y2=g.Y(y2),an=Math.atan2(Y2-g.Y(y1),X2-g.X(x1)); c.fillStyle=color; c.beginPath(); c.moveTo(X2,Y2);
    c.lineTo(X2-11*Math.cos(an-0.4),Y2-11*Math.sin(an-0.4)); c.lineTo(X2-11*Math.cos(an+0.4),Y2-11*Math.sin(an+0.4)); c.closePath(); c.fill(); }
  function draw(){
    g.clear(); g.grid(1); g.axes(2);
    if(MODE()==='sum'){
      arrow(0,0,Pa[0],Pa[1],cssVar('--plot-line')); g.label(Pa[0]/2,Pa[1]/2,'a',cssVar('--plot-line'),8,-8,'bold 15px Georgia');
      arrow(Pa[0],Pa[1],Pa[0]+Pb[0],Pa[1]+Pb[1],cssVar('--plot-line2')); g.label(Pa[0]+Pb[0]/2,Pa[1]+Pb[1]/2,'b',cssVar('--plot-line2'),8,-8,'bold 15px Georgia');
      arrow(0,0,Pa[0]+Pb[0],Pa[1]+Pb[1],cssVar('--cW'),3.2); g.label((Pa[0]+Pb[0])/2,(Pa[1]+Pb[1])/2,'a + b',cssVar('--cW'),-46,16,'bold 15px Georgia');
      arrow(0,0,Pb[0],Pb[1],cssVar('--plot-line2'),1.5,[6,5]); arrow(Pb[0],Pb[1],Pa[0]+Pb[0],Pa[1]+Pb[1],cssVar('--plot-line'),1.5,[6,5]);
      g.handle(Pa[0],Pa[1],cssVar('--accent')); g.handle(Pb[0],Pb[1],cssVar('--accent'));
      out.innerHTML='a = ('+fmt(Pa[0])+'; '+fmt(Pa[1])+'), b = ('+fmt(Pb[0])+'; '+fmt(Pb[1])+') → <b>a + b = ('+fmt(Pa[0]+Pb[0])+'; '+fmt(Pa[1]+Pb[1])+')</b> · |a + b| = <b>'+fmt(Math.hypot(Pa[0]+Pb[0],Pa[1]+Pb[1]),2)+'</b>';
    } else {
      const len2=Pa[0]*Pa[0]+Pa[1]*Pa[1]||1; const k=(Pk[0]*Pa[0]+Pk[1]*Pa[1])/len2;
      arrow(0,0,k*Pa[0],k*Pa[1],cssVar('--plot-line2'),3.4); arrow(0,0,Pa[0],Pa[1],cssVar('--plot-line'),2.6);
      g.label(Pa[0],Pa[1],'a',cssVar('--plot-line'),8,-8,'bold 15px Georgia'); g.label(k*Pa[0],k*Pa[1],'k·a',cssVar('--plot-line2'),8,18,'bold 15px Georgia');
      g.handle(Pa[0],Pa[1],cssVar('--accent')); g.handle(k*Pa[0],k*Pa[1],cssVar('--accent'));
      out.innerHTML='k = <b>'+fmt(k,2)+'</b> → k·a = ('+fmt(k*Pa[0])+'; '+fmt(k*Pa[1])+') · |k·a| = |k|·|a| = <b>'+fmt(Math.abs(k)*Math.hypot(Pa[0],Pa[1]),2)+'</b>'+
        (k<0?'<br><span class="mnote">k < 0 → k·a сочи обратно (векторите са колинеарни).</span>':'');
    }
  }
  draw(); liveRedraws.push(draw);
  draggable(cv,g,()=> MODE()==='sum'
    ? [{x:Pa[0],y:Pa[1],set:(x,y)=>Pa=[snap(x,0.5),snap(y,0.5)]},{x:Pb[0],y:Pb[1],set:(x,y)=>Pb=[snap(x,0.5),snap(y,0.5)]}]
    : [{x:Pa[0],y:Pa[1],set:(x,y)=>Pa=[snap(x,0.5),snap(y,0.5)]},{x:Pk[0],y:Pk[1],set:(x,y)=>Pk=[x,y]}], draw);
}},

/* ---------- Триъгълник — основни факти: подвижен връх A ---------- */
tribasic:{ build(root){
  const hint=el('div','mnote','Влачи върха A — сборът на ъглите, външният ъгъл и връзката ъгъл ↔ страна се менят.'); root.append(hint);
  const cv=mkCanvas(root,760,380), out=mkOut(root); const g=new Graph(cv,-1,12,-0.7,5.8);
  const B=[1.5,0.6], C=[10.5,0.6]; let A=[5.5,4.6];
  const ang=(P,Q,R)=>{ const u=[Q[0]-P[0],Q[1]-P[1]], v=[R[0]-P[0],R[1]-P[1]]; return Math.acos(clamp((u[0]*v[0]+u[1]*v[1])/(Math.hypot(...u)*Math.hypot(...v)),-1,1))*180/Math.PI; };
  function draw(){
    A=[clamp(A[0],0,12),clamp(A[1],1.4,5.6)];
    const al=ang(A,B,C), be=ang(B,A,C), ga=ang(C,A,B);
    g.clear(); g.poly([A,B,C],'rgba(127,127,127,.08)',cssVar('--ink'),2.2);
    g.seg(C[0],C[1],Math.min(C[0]+1.4,11.8),C[1],cssVar('--cW'),2,[5,4]);
    [['B',B,-16,18],['C',C,8,18]].forEach(([n,p,dx,dy])=>{ g.dot(p[0],p[1],cssVar('--accent'),4.5); g.label(p[0],p[1],n,cssVar('--ink'),dx,dy,'bold 14px Georgia'); });
    g.handle(A[0],A[1],cssVar('--accent')); g.label(A[0],A[1],'A',cssVar('--ink'),-4,-12,'bold 14px Georgia');
    g.label(A[0],A[1],fmt(al,0)+'°',cssVar('--plot-line3'),-10,24); g.label(B[0],B[1],fmt(be,0)+'°',cssVar('--plot-line'),20,-8); g.label(C[0],C[1],fmt(ga,0)+'°',cssVar('--plot-line2'),-40,-8);
    const a=Math.hypot(C[0]-B[0],C[1]-B[1]), b=Math.hypot(A[0]-C[0],A[1]-C[1]), cc=Math.hypot(A[0]-B[0],A[1]-B[1]);
    const mx=Math.max(al,be,ga); const big=mx===al?'BC (срещу A)':(mx===be?'AC (срещу B)':'AB (срещу C)');
    out.innerHTML='α + β + γ = '+fmt(al,0)+'° + '+fmt(be,0)+'° + '+fmt(ga,0)+'° = <b>180°</b> · външен ъгъл при C = 180° − γ = <b>'+fmt(180-ga,0)+'°</b> = α + β ✓'+
      '<br>Най-голяма страна е <b>'+big+'</b> — срещу най-големия ъгъл.';
  }
  draw(); liveRedraws.push(draw);
  draggable(cv,g,()=>[{x:A[0],y:A[1],set:(x,y)=>A=[x,y]}],draw);
}},

/* ---------- Средна отсечка / медицентър — подвижен връх ---------- */
midseg:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const hint=el('div','mnote','Влачи подвижната точка — средната отсечка остава ∥ и = половината от основата.'); root.append(hint);
  const MODE=sel(ctls,'Фигура',[['tri','триъгълник: средна отсечка и медицентър'],['trap','трапец: средна отсечка']],draw);
  const cv=mkCanvas(root,760,380), out=mkOut(root); const g=new Graph(cv,-1,11,-0.4,5.6);
  let A=[6,4.6], At=[3.4,4.2];
  function draw(){
    g.clear();
    if(MODE()==='tri'){ A=[clamp(A[0],1,10),clamp(A[1],1.4,5.4)];
      const B=[0.8,0.5],C=[10.2,0.5]; const M=[(A[0]+B[0])/2,(A[1]+B[1])/2],Nn=[(A[0]+C[0])/2,(A[1]+C[1])/2];
      const mBC=[(B[0]+C[0])/2,0.5], G_=[(A[0]+B[0]+C[0])/3,(A[1]+B[1]+C[1])/3];
      g.poly([A,B,C],null,cssVar('--ink'),2.2); g.seg(A[0],A[1],mBC[0],mBC[1],cssVar('--plot-line'),1.5); g.seg(B[0],B[1],Nn[0],Nn[1],cssVar('--plot-line'),1.5); g.seg(C[0],C[1],M[0],M[1],cssVar('--plot-line'),1.5);
      g.seg(M[0],M[1],Nn[0],Nn[1],cssVar('--plot-line2'),3.2); g.dot(G_[0],G_[1],cssVar('--cW'),5.5); g.label(G_[0],G_[1],'G',cssVar('--cW'),9,-6,'bold 14px Georgia');
      [['B',B],['C',C],['M',M],['N',Nn]].forEach(([n,p])=>{ g.dot(p[0],p[1],cssVar('--accent'),4); g.label(p[0],p[1],n,cssVar('--ink'),7,-7,'bold 13px Georgia'); });
      g.handle(A[0],A[1],cssVar('--accent')); g.label(A[0],A[1],'A',cssVar('--ink'),-4,-12,'bold 14px Georgia');
      const MN=Math.hypot(Nn[0]-M[0],Nn[1]-M[1]), BC=Math.hypot(C[0]-B[0],C[1]-B[1]);
      out.innerHTML='Средна отсечка: MN = '+frac('BC','2')+' = '+fmt(BC/2,2)+' = <b>'+fmt(MN,2)+'</b> и MN ∥ BC.'+
        '<br>Медицентър G дели медианите AG : GM = <b>2 : 1</b> от върха.';
    } else { At=[clamp(At[0],1.2,4.8),clamp(At[1],1.4,5.2)];
      const b=9,x0=(11-b)/2; const D=[x0,0.6],C=[x0+b,0.6]; const a=(x0+b-At[0])-At[0]+2*x0; // симетричен трапец
      const Atc=[At[0],At[1]], Btc=[x0+b-(At[0]-x0),At[1]]; const P=[(Atc[0]+D[0])/2,(Atc[1]+D[1])/2],Q=[(Btc[0]+C[0])/2,(Btc[1]+C[1])/2];
      const aa=Math.hypot(Btc[0]-Atc[0],0);
      g.poly([Atc,Btc,C,D],'rgba(127,127,127,.07)',cssVar('--ink'),2.2); g.seg(P[0],P[1],Q[0],Q[1],cssVar('--plot-line2'),3.2);
      g.dot(Q[0],Q[1],cssVar('--accent'),4);
      g.handle(Atc[0],Atc[1],cssVar('--accent'));
      g.label((Atc[0]+Btc[0])/2,Atc[1],'a = '+fmt(aa,1),cssVar('--ink'),-20,-8); g.label((D[0]+C[0])/2,D[1],'b = '+fmt(b,0),cssVar('--ink'),-20,22);
      g.label((P[0]+Q[0])/2,P[1],'m = '+fmt((aa+b)/2,2),cssVar('--plot-line2'),-30,-8,'bold 13px system-ui');
      out.innerHTML='Средна отсечка на трапец: m = '+frac('a + b','2')+' = '+frac(fmt(aa,1)+' + '+fmt(b,0),'2')+' = <b>'+fmt((aa+b)/2,2)+'</b> — ∥ на основите.';
    }
    renderMath(out);
  }
  draw(); liveRedraws.push(draw);
  draggable(cv,g,()=> MODE()==='tri' ? [{x:A[0],y:A[1],set:(x,y)=>A=[x,y]}] : [{x:At[0],y:At[1],set:(x,y)=>At=[x,y]}], draw);
}},

/* ---------- Комбинаторика: избор на k от n (ясен, изброяващ модел) ---------- */
comb:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const MODE=sel(ctls,'Какво броим',[['C','Избор на k от n — без ред (комбинации)'],['V','Избор на k от n — с ред (вариации)'],['P','Подреждане на всичките n (пермутации)']],upd);
  const Nn=stepper(ctls,'n (общо обекти)',2,8,5,upd), Kk=stepper(ctls,'k (избрани)',1,8,2,upd);
  const out=mkOut(root); const ex=el('div','comb-ex'); root.append(ex);
  const LAB=['A','B','C','D','E','F','G','H'];
  const COL=['#2B6CB0','#C05621','#2C7A7B','#6B46C1','#B7791F','#2F855A','#C53030','#0A9C93'];
  function chip(i){ return '<span class="cchip" style="background:'+COL[i%COL.length]+'">'+LAB[i]+'</span>'; }
  function row(idxs){ return '<div class="crow">'+idxs.map(i=>chip(i)).join('')+'</div>'; }
  function upd(){
    const mode=MODE(), n=Nn(); let k=Math.min(Kk(),n); if(Kk()>n) Kk.set(n);
    const objs=[...Array(n).keys()];
    const pool='<div class="cpool">Обекти: '+objs.map(i=>chip(i)).join('')+'</div>';
    let formula, list=[], count, note;
    if(mode==='P'){ count=factN(n); k=n;
      formula='Pₙ = n! = '+objs.map((_,i)=>n-i).join('·')+' = <b>'+count+'</b>';
      note='Всяка подредба на всичките '+n+' обекта.'; list = n<=4? kperms(objs,n): [];
    } else if(mode==='V'){ count=factN(n)/factN(n-k);
      formula='Vₙᵏ = '+frac('n!','(n − k)!')+' = <b>'+count+'</b> &nbsp;(подредени избори на '+k+' от '+n+')';
      note='Редът има значение: (A, B) е различно от (B, A).'; list = count<=24? kperms(objs,k): [];
    } else { count=factN(n)/(factN(k)*factN(n-k));
      formula='Cₙᵏ = '+frac('n!','k!·(n − k)!')+' = '+frac('Vₙᵏ','k!')+' = <b>'+count+'</b> &nbsp;(групи от '+k+' от '+n+')';
      note='Редът НЯМА значение: {A, B} = {B, A}.'; list = count<=28? kcombos(objs,k): [];
    }
    out.innerHTML='<div class="cformula">'+formula+'</div><div class="mnote">'+note+'</div>';
    renderMath(out);
    let body = pool;
    if(list.length){ body += '<div class="clist-title">Всички '+count+' възможности:</div><div class="clist">'+list.map(row).join('')+'</div>'; }
    else body += '<div class="clist-title">Възможностите са '+count+' — твърде много, за да се изпишат всички. Пробвай по-малки n и k.</div>';
    ex.innerHTML = body;
  }
  upd(); liveRedraws.push(upd);
}},

/* ---------- Забележителни точки в триъгълник: три подвижни върха ---------- */
incircle:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const hint=el('div','mnote','Влачи трите върха. Направи триъгълника остроъгълен, правоъгълен или тъпоъгълен — виж как се разместват точките.'); root.append(hint);
  const SHOW=sel(ctls,'Покажи',[['all','всички забележителни точки'],['circ','само вписана и описана окръжност'],['euler','ойлерова права (O, G, H)']],draw);
  const cv=mkCanvas(root,760,500), out=mkOut(root); const g=new Graph(cv,-2.4,13.4,-3.0,6.9);
  let A=[4,5], B=[1.2,0.6], C=[10.6,0.6];
  const cI=cssVar('--plot-line3'), cO=cssVar('--plot-line'), cG=cssVar('--cF'), cH=cssVar('--cW');
  function draw(){
    const show=SHOW();
    const a=Math.hypot(C[0]-B[0],C[1]-B[1]), b=Math.hypot(A[0]-C[0],A[1]-C[1]), cS=Math.hypot(A[0]-B[0],A[1]-B[1]);
    const per=a+b+cS, p=per/2, S=Math.abs((B[0]-A[0])*(C[1]-A[1])-(C[0]-A[0])*(B[1]-A[1]))/2||1e-6;
    const rI=S/p, R=a*b*cS/(4*S);
    const I=[(a*A[0]+b*B[0]+cS*C[0])/per,(a*A[1]+b*B[1]+cS*C[1])/per];
    const d=2*(A[0]*(B[1]-C[1])+B[0]*(C[1]-A[1])+C[0]*(A[1]-B[1]))||1e-6;
    const O=[((A[0]**2+A[1]**2)*(B[1]-C[1])+(B[0]**2+B[1]**2)*(C[1]-A[1])+(C[0]**2+C[1]**2)*(A[1]-B[1]))/d,
             ((A[0]**2+A[1]**2)*(C[0]-B[0])+(B[0]**2+B[1]**2)*(A[0]-C[0])+(C[0]**2+C[1]**2)*(B[0]-A[0]))/d];
    const G=[(A[0]+B[0]+C[0])/3,(A[1]+B[1]+C[1])/3];
    const H=[A[0]+B[0]+C[0]-2*O[0], A[1]+B[1]+C[1]-2*O[1]];   // ортоцентър (Ойлер: H = A+B+C − 2O)
    g.clear();
    if(show!=='euler'){ g.circle(O[0],O[1],R,cO,2,[7,5]); g.circle(I[0],I[1],rI,cI,2.4); }
    g.poly([A,B,C],'rgba(127,127,127,.06)',cssVar('--ink'),2.2);
    if(show==='euler'){ // ойлерова права през O, G, H
      const dx=H[0]-O[0], dy=H[1]-O[1], L=Math.hypot(dx,dy)||1;
      g.seg(O[0]-dx/L*14,O[1]-dy/L*14,O[0]+dx/L*14,O[1]+dy/L*14,cssVar('--muted'),1.6,[6,5]);
    }
    const pt=(P,c,lab,dx,dy)=>{ g.dot(P[0],P[1],c,5); g.label(P[0],P[1],lab,c,dx||8,dy||-6,'bold 13px Georgia'); };
    if(show!=='circ'){ pt(G,cG,'G',8,-6); pt(H,cH,'H',8,18); }
    if(show!=='euler'){ pt(I,cI,'I',-14,-6); }
    pt(O,cO,'O',8,(O[1]>4?18:-6));
    // върхове = подвижни точки
    [['A',A],['B',B],['C',C]].forEach(([n,P])=>{ g.handle(P[0],P[1],cssVar('--accent')); g.label(P[0],P[1],n,cssVar('--ink'),8,-8,'bold 14px Georgia'); });
    const cosMin=Math.min((b*b+cS*cS-a*a)/(2*b*cS),(a*a+cS*cS-b*b)/(2*a*cS),(a*a+b*b-cS*cS)/(2*a*b));
    let kind;
    if(cosMin>0.03) kind='<b>остроъгълен</b> → O и H са вътре в триъгълника';
    else if(cosMin<-0.03) kind='<b>тъпоъгълен</b> → O и H са <b>извън</b> триъгълника';
    else kind='<b>правоъгълен</b> → O лежи на средата на хипотенузата, а H съвпада с върха при правия ъгъл';
    out.innerHTML='Триъгълникът е '+kind+'.'+
      '<br><span style="color:'+cI+'">● I</span> вписана (ъглополовящи), r = '+frac('S','p')+' = <b>'+fmt(rI,2)+'</b>'+
      ' · <span style="color:'+cO+'">● O</span> описана (симетрали), R = '+frac('abc','4S')+' = <b>'+fmt(R,2)+'</b>'+
      (show!=='circ'?' · <span style="color:'+cG+'">● G</span> медицентър (медиани) · <span style="color:'+cH+'">● H</span> ортоцентър (височини)':'')+
      (show==='euler'?'<br><span class="mnote">O, G и H винаги лежат на една права (Ойлерова права), като OG : GH = 1 : 2.</span>':'');
    renderMath(out);
  }
  draw(); liveRedraws.push(draw);
  draggable(cv,g,()=>[
    {x:A[0],y:A[1],set:(x,y)=>A=[clamp(x,-2,13),clamp(y,-2.6,6.6)]},
    {x:B[0],y:B[1],set:(x,y)=>B=[clamp(x,-2,13),clamp(y,-2.6,6.6)]},
    {x:C[0],y:C[1],set:(x,y)=>C=[clamp(x,-2,13),clamp(y,-2.6,6.6)]},
  ],draw);
}},

/* ---------- Еднаквости: подвижен управляващ елемент ---------- */
transforms:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const hint=el('div','mnote','Избери преобразувание и влачи оранжевата точка/ос, за да го управляваш.'); root.append(hint);
  const MODE=sel(ctls,'Преобразувание',[['axis','осева симетрия'],['rot','ротация около O'],['cent','централна симетрия'],['trans','транслация']],draw);
  const cv=mkCanvas(root,760,430), out=mkOut(root); const g=new Graph(cv,-9,9,-5.1,5.1);
  const T=[[-5.5,0.5],[-2.5,0.5],[-4,3.2]];
  let axX=0.5, rotA=Math.PI/2, cen=[1,0], tv=[3,2];
  function draw(){
    const m=MODE(); g.clear(); g.grid(1); g.axes(2); g.poly(T,'rgba(43,108,176,.28)',cssVar('--plot-line'),2);
    let img,msg,hx,hy;
    if(m==='axis'){ g.seg(axX,-5.1,axX,5.1,cssVar('--cW'),2,[7,5]); img=T.map(([x,y])=>[2*axX-x,y]); msg='Осева симетрия, ос x = '+fmt(axX,1)+' — образът е огледален.'; hx=axX; hy=3.6; }
    else if(m==='rot'){ g.dot(0,0,cssVar('--cW'),5); g.label(0,0,'O',cssVar('--cW'),8,18,'bold 13px Georgia'); const ca=Math.cos(rotA),sa=Math.sin(rotA); img=T.map(([x,y])=>[x*ca-y*sa,x*sa+y*ca]); msg='Ротация около O на '+fmt(rotA*180/Math.PI,0)+'° — дължини и ъгли се запазват.'; hx=3*Math.cos(rotA); hy=3*Math.sin(rotA); }
    else if(m==='cent'){ g.dot(cen[0],cen[1],cssVar('--cW'),5); g.label(cen[0],cen[1],'O',cssVar('--cW'),8,18,'bold 13px Georgia'); img=T.map(([x,y])=>[2*cen[0]-x,2*cen[1]-y]); msg='Централна симетрия с център O — ротация на 180°.'; hx=cen[0]; hy=cen[1]; }
    else { arrow0(0,0,tv[0],tv[1]); img=T.map(([x,y])=>[x+tv[0],y+tv[1]]); msg='Транслация с вектор t = ('+fmt(tv[0],1)+'; '+fmt(tv[1],1)+').'; hx=tv[0]; hy=tv[1]; }
    g.poly(img,'rgba(192,86,33,.28)',cssVar('--plot-line2'),2);
    g.handle(hx,hy,cssVar('--accent'));
    out.innerHTML=msg+'<br><span class="mnote">Синият триъгълник е оригиналът, оранжевият — образът. Всяка еднаквост запазва разстоянията.</span>';
  }
  function arrow0(x1,y1,x2,y2){ g.seg(x1,y1,x2,y2,cssVar('--cW'),2.4); const c=g.c,X2=g.X(x2),Y2=g.Y(y2),an=Math.atan2(Y2-g.Y(y1),X2-g.X(x1)); c.fillStyle=cssVar('--cW'); c.beginPath(); c.moveTo(X2,Y2); c.lineTo(X2-11*Math.cos(an-0.4),Y2-11*Math.sin(an-0.4)); c.lineTo(X2-11*Math.cos(an+0.4),Y2-11*Math.sin(an+0.4)); c.closePath(); c.fill(); g.label(x2/2,y2/2,'t',cssVar('--cW'),6,-8,'bold 14px Georgia'); }
  draw(); liveRedraws.push(draw);
  draggable(cv,g,()=>{ const m=MODE();
    if(m==='axis') return [{x:axX,y:3.6,axis:'x',set:x=>axX=clamp(snap(x,0.5),-7,7)}];
    if(m==='rot') return [{x:3*Math.cos(rotA),y:3*Math.sin(rotA),set:(x,y)=>rotA=Math.atan2(y,x)}];
    if(m==='cent') return [{x:cen[0],y:cen[1],set:(x,y)=>cen=[snap(x,0.5),snap(y,0.5)]}];
    return [{x:tv[0],y:tv[1],set:(x,y)=>tv=[snap(x,0.5),snap(y,0.5)]}];
  },draw);
}},

/* ---------- Полуокръжност [0°;180°]: подвижна точка ---------- */
semicircle:{ build(root){
  const hint=el('div','mnote','Влачи точката по полуокръжността — ъгълът α върви от 0° до 180°.'); root.append(hint);
  const cv=mkCanvas(root,760,320), out=mkOut(root); const g=new Graph(cv,-2.3,2.3,-0.35,2.0);
  let al=120*Math.PI/180;
  function draw(){
    const P=[Math.cos(al),Math.sin(al)];
    g.clear(); g.circle(0,0,1,cssVar('--muted'),1.4); // ще изчистим долната половина
    const c=g.c; c.clearRect(0,g.Y(0)+1,g.w,g.h); // маха долната част
    g.seg(-2.2,0,2.2,0,cssVar('--muted'),1.4); g.seg(0,0,0,1.9,cssVar('--muted'),1.4);
    g.seg(0,0,P[0],P[1],cssVar('--accent'),2.2);
    g.seg(P[0],P[1],P[0],0,cssVar('--plot-line2'),1.6,[5,4]); g.seg(P[0],P[1],0,P[1],cssVar('--plot-line3'),1.6,[5,4]);
    g.dot(-P[0],P[1],cssVar('--muted'),4);
    g.handle(P[0],P[1],cssVar('--accent'));
    g.label(-1,0,'−1',cssVar('--muted'),-4,16,'11px system-ui'); g.label(1,0,'1',cssVar('--muted'),-2,16,'11px system-ui');
    const deg=al*180/Math.PI, tg=Math.abs(Math.cos(al))<1e-3?'—':fmt(Math.tan(al),3);
    out.innerHTML='α = <b>'+fmt(deg,0)+'°</b> · sin α = <b>'+fmt(Math.sin(al),3)+'</b>, cos α = <b>'+fmt(Math.cos(al),3)+'</b>, tg α = '+frac('sin α','cos α')+' = <b>'+tg+'</b>'+
      '<br><span class="mnote">Сивата точка е 180° − α = '+fmt(180-deg,0)+'°: sin остава същият, cos сменя знака.</span>';
    renderMath(out);
  }
  draw(); liveRedraws.push(draw);
  draggable(cv,g,()=>{ const P=[Math.cos(al),Math.sin(al)]; return [{x:P[0],y:P[1],set:(x,y)=>{ al=Math.atan2(Math.max(0.001,y),x); al=clamp(al,0.02,Math.PI-0.02); }}]; },draw);
}},

/* ---------- Решаване на триъгълник: подвижни B и C около A ---------- */
soltriangle:{ build(root){
  const hint=el('div','mnote','Влачи върховете B и C — синусовата и косинусовата теорема се прилагат на живо.'); root.append(hint);
  const cv=mkCanvas(root,760,460), out=mkOut(root); const g=new Graph(cv,-0.5,11.5,-0.8,6.46);
  const A=[4.5,0.9]; let B=[9.2,0.9], C=[6.6,4.9];
  function draw(){
    B=[clamp(B[0],0.3,11.2),clamp(B[1],0.3,6)]; C=[clamp(C[0],0.3,11.2),clamp(C[1],0.3,6.2)];
    const a=Math.hypot(C[0]-B[0],C[1]-B[1]), b=Math.hypot(A[0]-C[0],A[1]-C[1]), cS=Math.hypot(A[0]-B[0],A[1]-B[1]);
    const angA=Math.acos(clamp(((B[0]-A[0])*(C[0]-A[0])+(B[1]-A[1])*(C[1]-A[1]))/(cS*b||1),-1,1));
    const S=Math.abs((B[0]-A[0])*(C[1]-A[1])-(C[0]-A[0])*(B[1]-A[1]))/2, p=(a+b+cS)/2;
    const R=a/(2*Math.sin(angA)||1), rI=S/p;
    const angB=Math.acos(clamp((a*a+cS*cS-b*b)/(2*a*cS||1),-1,1)), angC=Math.PI-angA-angB;
    g.clear(); g.poly([A,B,C],'rgba(127,127,127,.07)',cssVar('--ink'),2.4);
    g.dot(A[0],A[1],cssVar('--accent'),4.5); g.label(A[0],A[1],'A',cssVar('--ink'),-6,20,'bold 14px Georgia');
    g.handle(B[0],B[1],cssVar('--accent')); g.label(B[0],B[1],'B',cssVar('--ink'),8,20,'bold 14px Georgia');
    g.handle(C[0],C[1],cssVar('--accent')); g.label(C[0],C[1],'C',cssVar('--ink'),8,-8,'bold 14px Georgia');
    g.label((B[0]+C[0])/2,(B[1]+C[1])/2,'a = '+fmt(a,2),cssVar('--plot-line2'),8,0);
    out.innerHTML='Косинусова: a² = b² + c² − 2bc·cos A → a = <b>'+fmt(a,2)+'</b> · ъгли A = '+fmt(angA*180/Math.PI,0)+'°, B = '+fmt(angB*180/Math.PI,0)+'°, C = '+fmt(angC*180/Math.PI,0)+'°'+
      '<br>S = '+fmt(S,2)+' · R = '+frac('a','2 sin A')+' = <b>'+fmt(R,2)+'</b> · r = '+frac('S','p')+' = <b>'+fmt(rI,2)+'</b>';
    renderMath(out);
  }
  draw(); liveRedraws.push(draw);
  draggable(cv,g,()=>[{x:B[0],y:B[1],set:(x,y)=>B=[x,y]},{x:C[0],y:C[1],set:(x,y)=>C=[x,y]}],draw);
}},

/* ---------- Показателна и логаритмична функция: подвижна точка за основата ---------- */
explog:{ build(root){
  const hint=el('div','mnote','Влачи точката вертикално (при x = 1) — тя задава основата a на y = aˣ.'); root.append(hint);
  const cv=mkCanvas(root,720,430), out=mkOut(root); const g=new Graph(cv,-6,6,-4,4);
  let a=2;
  function draw(){
    let A=a; if(Math.abs(A-1)<0.06)A=1.06; if(A<0.15)A=0.15;
    g.clear(); g.grid(1); g.axes(2); g.fn(x=>x,cssVar('--muted'),1.3);
    g.fn(x=>Math.pow(A,x),cssVar('--plot-line'),2.6); g.fn(x=> x>1e-6?Math.log(x)/Math.log(A):NaN, cssVar('--plot-line2'),2.6);
    g.dot(0,1,cssVar('--plot-line'),4); g.dot(1,0,cssVar('--plot-line2'),4);
    g.label(4.4,3.4,'y = aˣ',cssVar('--plot-line'),0,0,'bold 13px system-ui'); g.label(4.4,2.9,'y = logₐx',cssVar('--plot-line2'),0,0,'bold 13px system-ui'); g.label(4.4,2.4,'y = x',cssVar('--muted'),0,0,'12px system-ui');
    g.handle(1,A,cssVar('--accent'));
    out.innerHTML='a = <b>'+fmt(A,2)+'</b> → двете функции са <b>'+(A>1?'растящи':'намаляващи')+'</b>. Графиките са симетрични спрямо y = x (логаритъмът е обратна функция на степента).';
  }
  draw(); liveRedraws.push(draw);
  draggable(cv,g,()=>[{x:1,y:a,axis:'y',set:(x,y)=>a=Math.max(0.15,y)}],draw);
}},

/* ---------- Равнинни фигури ---------- */
planefigs:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const hint=el('div','mnote','Влачи върховете (сините точки), за да менуваш страните и ъглите.'); root.append(hint);
  const FIG=sel(ctls,'Фигура',[['par','успоредник'],['romb','ромб'],['trap','трапец'],['ngon','правилен n-ъгълник']],draw);
  const NN=stepper(ctls,'n (за многоъгълник)',3,10,6,draw);
  const cv=mkCanvas(root,760,400), out=mkOut(root); const g=new Graph(cv,-1,12,-0.5,6.34);
  const A0=[1,0.7]; let B=[5.5,0.7], D=[3,3.6], ngonV=[8.2,4.6];
  function draw(){
    const f=FIG(); g.clear(); let txt='';
    if(f==='par'||f==='romb'){
      B=[clamp(B[0],A0[0]+1,11),0.7]; let Dd=[clamp(D[0],-0.5,11),clamp(D[1],1.4,6)];
      let a=B[0]-A0[0];
      if(f==='romb'){ const dl=Math.hypot(Dd[0]-A0[0],Dd[1]-A0[1])||1; Dd=[A0[0]+(Dd[0]-A0[0])/dl*a, A0[1]+(Dd[1]-A0[1])/dl*a]; }
      const bb=Math.hypot(Dd[0]-A0[0],Dd[1]-A0[1]); const C=[B[0]+Dd[0]-A0[0],B[1]+Dd[1]-A0[1]];
      const al=Math.atan2(Dd[1]-A0[1],Dd[0]-A0[0]);
      g.poly([A0,B,C,Dd],'rgba(43,108,176,.12)',cssVar('--ink'),2.2);
      g.seg(A0[0],A0[1],C[0],C[1],cssVar('--plot-line2'),1.6,[6,4]); g.seg(B[0],B[1],Dd[0],Dd[1],cssVar('--plot-line3'),1.6,[6,4]);
      g.handle(B[0],B[1],cssVar('--accent')); g.handle(Dd[0],Dd[1],cssVar('--accent'));
      D=Dd; const S=a*bb*Math.sin(al);
      if(f==='par') txt='Успоредник: S = a·b·sin α = '+fmt(a,1)+'·'+fmt(bb,1)+'·sin '+fmt(al*180/Math.PI,0)+'° = <b>'+fmt(S,2)+'</b>. Диагоналите се разполовяват.';
      else { const d1=Math.hypot(C[0]-A0[0],C[1]-A0[1]), d2=Math.hypot(Dd[0]-B[0],Dd[1]-B[1]); txt='Ромб: S = a²·sin α = <b>'+fmt(a*a*Math.sin(al),2)+'</b> = '+frac('d₁·d₂','2')+' = '+frac(fmt(d1,2)+'·'+fmt(d2,2),'2')+' = '+fmt(d1*d2/2,2)+' ✓'; }
    } else if(f==='trap'){
      const b=9,x0=(11-b)/2; const D2=[x0,0.7],C=[x0+b,0.7]; let At=[clamp(D[0],x0+0.3,x0+b/2-0.3),clamp(D[1],1.4,6)];
      const Bt=[x0+b-(At[0]-x0),At[1]]; const a=Bt[0]-At[0], h=At[1]-0.7;
      g.poly([At,Bt,C,D2],'rgba(43,108,176,.12)',cssVar('--ink'),2.2); g.seg(At[0],At[1],At[0],0.7,cssVar('--plot-line3'),1.6,[5,4]);
      g.handle(At[0],At[1],cssVar('--accent')); D=At;
      g.label((At[0]+Bt[0])/2,At[1],'a = '+fmt(a,1),cssVar('--ink'),-20,-8); g.label((D2[0]+C[0])/2,D2[1],'b = '+fmt(b,1),cssVar('--ink'),-20,22);
      txt='Трапец: S = '+frac('(a + b)·h','2')+' = '+frac('('+fmt(a,1)+' + '+fmt(b,0)+')·'+fmt(h,1),'2')+' = <b>'+fmt((a+b)*h/2,2)+'</b>; средна отсечка m = '+frac('a + b','2')+' = '+fmt((a+b)/2,2)+'.';
    } else {
      const n=NN(), cx=5.5, cy=3.1; let V=[clamp(ngonV[0],cx-3.2,cx+3.2),clamp(ngonV[1],cy-3,cy+3)]; ngonV=V;
      const R=Math.max(1,Math.hypot(V[0]-cx,V[1]-cy)), a0=Math.atan2(V[1]-cy,V[0]-cx);
      const pts=[...Array(n)].map((_,i)=>{ const t=a0+2*Math.PI*i/n; return [cx+R*Math.cos(t),cy+R*Math.sin(t)]; });
      g.poly(pts,'rgba(43,108,176,.12)',cssVar('--ink'),2.2); g.dot(cx,cy,cssVar('--cW'),4); g.seg(cx,cy,V[0],V[1],cssVar('--plot-line3'),1.6,[5,4]);
      g.handle(V[0],V[1],cssVar('--accent'));
      const side=2*R*Math.sin(Math.PI/n), ap=R*Math.cos(Math.PI/n), S=n*side*ap/2;
      txt='Правилен '+n+'-ъгълник (R = '+fmt(R,2)+'): страна a = '+fmt(side,2)+', вътрешен ъгъл '+frac('(n − 2)·180°','n')+' = <b>'+fmt((n-2)*180/n,1)+'°</b>, S = '+frac('P·r','2')+' = <b>'+fmt(S,2)+'</b>.';
    }
    out.innerHTML=txt; renderMath(out);
  }
  draw(); liveRedraws.push(draw);
  draggable(cv,g,()=>{ const f=FIG();
    if(f==='par'||f==='romb') return [{x:B[0],y:0.7,axis:'x',set:x=>B=[x,0.7]},{x:D[0],y:D[1],set:(x,y)=>D=[x,y]}];
    return [{x:D[0],y:D[1],set:(x,y)=>D=[x,y]}, {x:ngonV[0],y:ngonV[1],set:(x,y)=>ngonV=[x,y]}].slice(f==='ngon'?1:0,f==='ngon'?2:1);
  },draw);
}},

/* ---------- Графики на тригонометричните функции ---------- */
triggraphs:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const F=sel(ctls,'Функция',[['sin','y = sin x'],['cos','y = cos x'],['tg','y = tg x'],['cotg','y = cotg x']],draw);
  const cv=mkCanvas(root,760,360), out=mkOut(root); const g=new Graph(cv,-6.8,6.8,-3.1,3.1);
  function draw(){
    const f=F(); g.clear(); g.grid(1);
    const c=g.c; c.strokeStyle=cssVar('--muted'); c.lineWidth=1.4; c.beginPath(); c.moveTo(0,g.Y(0)); c.lineTo(g.w,g.Y(0)); c.moveTo(g.X(0),0); c.lineTo(g.X(0),g.h); c.stroke();
    c.fillStyle=cssVar('--muted'); c.font='11.5px system-ui'; c.textAlign='center';
    [[-2*Math.PI,'−2π'],[-Math.PI,'−π'],[Math.PI,'π'],[2*Math.PI,'2π']].forEach(([v,t])=>{ c.fillText(t,g.X(v),g.Y(0)+16); });
    c.fillText('1',g.X(0)-10,g.Y(1)+4); c.fillText('−1',g.X(0)-12,g.Y(-1)+4); c.textAlign='left';
    let fn,zeros=[],asym=[],props='';
    if(f==='sin'){ fn=Math.sin; for(let k=-2;k<=2;k++)zeros.push(k*Math.PI); props='D = ℝ, E = [−1; 1], период 2π · нули: x = kπ · нечетна.'; }
    if(f==='cos'){ fn=Math.cos; for(let k=-2;k<=1;k++)zeros.push(Math.PI/2+k*Math.PI); props='D = ℝ, E = [−1; 1], период 2π · нули: x = π/2 + kπ · четна.'; }
    if(f==='tg'){ fn=Math.tan; for(let k=-2;k<=2;k++)zeros.push(k*Math.PI); for(let k=-2;k<=1;k++)asym.push(Math.PI/2+k*Math.PI); props='период π · нули: x = kπ · асимптоти: x = π/2 + kπ · нечетна.'; }
    if(f==='cotg'){ fn=x=>1/Math.tan(x); for(let k=-2;k<=1;k++)zeros.push(Math.PI/2+k*Math.PI); for(let k=-2;k<=2;k++)asym.push(k*Math.PI); props='период π · нули: x = π/2 + kπ · асимптоти: x = kπ · нечетна.'; }
    asym.forEach(x=>g.seg(x,-3.1,x,3.1,cssVar('--cW'),1.4,[6,5])); g.fn(fn,cssVar('--plot-line'),2.6);
    zeros.forEach(x=>g.dot(x,0,cssVar('--plot-line2'),4.5));
    out.innerHTML=props+'<br><span class="mnote">Оранжевите точки са нулите; червените пунктирани прави — асимптотите.</span>';
  }
  draw(); liveRedraws.push(draw);
}},

/* ---------- Схема на Бернули ---------- */
bernoulli:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const hint=el('div','mnote','Задай броя опити n, вероятността p и избери k — виж разпределението и точната формула.'); root.append(hint);
  const N=stepper(ctls,'n (опити)',1,12,8,draw), P=stepperF(ctls,'p (успех)',0.05,0.95,0.05,0.5,draw), K=stepper(ctls,'k (успехи)',0,12,3,draw);
  const cv=mkCanvas(root,760,320), out=mkOut(root);
  function draw(){
    const n=N(), p=P(); let k=Math.min(K(),n); if(K()>n)K.set(n);
    const c=cv.getContext('2d'); c.clearRect(0,0,760,320);
    const probs=[...Array(n+1)].map((_,i)=>factN(n)/(factN(i)*factN(n-i))*Math.pow(p,i)*Math.pow(1-p,n-i));
    const pmax=Math.max(...probs), x0=40,y0=272,gw=690,gh=220;
    c.strokeStyle=cssVar('--muted'); c.beginPath(); c.moveTo(x0,y0); c.lineTo(x0+gw,y0); c.stroke(); c.font='11px system-ui'; c.textAlign='center';
    probs.forEach((pr,i)=>{ const bw=gw/(n+1)-10,bx=x0+i*(gw/(n+1))+5,bh=Math.max(1.5,gh*pr/pmax); c.fillStyle=i===k?cssVar('--plot-line2'):cssVar('--plot-line'); c.globalAlpha=i===k?1:.68; c.fillRect(bx,y0-bh,bw,bh); c.globalAlpha=1;
      c.fillStyle=cssVar('--ink'); c.fillText(fmt(pr,3),bx+bw/2,y0-bh-5); c.fillStyle=cssVar('--muted'); c.fillText('k = '+i,bx+bw/2,y0+15); });
    c.textAlign='left'; const C_=factN(n)/(factN(k)*factN(n-k));
    out.innerHTML='P(X = '+k+') = C('+n+'; '+k+')·p^'+k+'·(1−p)^'+(n-k)+' = '+C_+'·'+fmt(Math.pow(p,k),4)+'·'+fmt(Math.pow(1-p,n-k),4)+' = <b>'+fmt(probs[k],4)+'</b>'+
      '<br><span class="mnote">Стълбчетата са разпределението на броя успехи; сумата им е 1.</span>';
  }
  draw(); liveRedraws.push(draw);
}}

};

/* ================= СЪСТОЯНИЕ И РЕНДЕР ================= */
const state={ klas:'all', dom:'all', types:new Set(Object.keys(TYPES)), q:'', mode:'ext', details:true };

function buildSidebar(){
  const kl=$('#klist');
  [['all','Всички класове'],['8','8. клас'],['9','9. клас'],['10','10. клас'],['11','11. клас'],['12','12. клас']].forEach(([v,t])=>{
    const b=el('button',null,t); b.dataset.v=v;
    b.onclick=()=>{ state.klas=v; kl.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x.dataset.v===v)); render(); };
    if(v==='all') b.classList.add('on');
    kl.append(b);
  });
  const dm=$('#doms');
  [['all','Всички'],...Object.entries(DOMS)].forEach(([v,t])=>{
    const b=el('button','chip',t); b.dataset.v=v;
    b.onclick=()=>{ state.dom=v; dm.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x.dataset.v===v)); render(); };
    if(v==='all') b.classList.add('on');
    dm.append(b);
  });
  const tp=$('#types');
  const allBtn=el('button','chip on','Всички типове');
  allBtn.onclick=()=>{ state.types=new Set(Object.keys(TYPES)); syncTypes(); render(); };
  tp.append(allBtn);
  Object.entries(TYPES).forEach(([k,info])=>{
    const b=el('button','chip on',info.label); b.dataset.t=k; b.dataset.tc=''; b.style.setProperty('--tc','var('+info.cv+')');
    b.onclick=()=>{
      if(state.types.size===Object.keys(TYPES).length){ state.types=new Set([k]); }   // от „всички“ → само този
      else if(state.types.has(k)){ state.types.delete(k); if(!state.types.size) state.types=new Set(Object.keys(TYPES)); }
      else state.types.add(k);
      syncTypes(); render();
    };
    tp.append(b);
  });
  function syncTypes(){
    const all=state.types.size===Object.keys(TYPES).length;
    allBtn.classList.toggle('on',all);
    tp.querySelectorAll('.chip[data-t]').forEach(x=>x.classList.toggle('on',state.types.has(x.dataset.t)));
  }
}

function itemMatches(it){
  if(it.model){
    if(state.mode==='std') return false;                       // в режим „Ученик“ моделите са скрити
    if(state.q && !( (it.h+' '+it.b).toLowerCase().includes(state.q) )) return false;
    return true;
  }
  if(state.mode==='std' && it.t!=='O' && it.t!=='F') return false;
  if(!state.types.has(it.t)) return false;
  if(!state.details && (it.t==='Ex'||it.t==='W')) return false;
  if(state.q){
    const hay=(it.h+' '+it.b+' '+TYPES[it.t].label).toLowerCase();
    if(!hay.includes(state.q)) return false;
  }
  return true;
}

function render(){
  liveRedraws.length=0;
  const cont=$('#content'); cont.innerHTML='';
  let nCards=0, nTopics=0;
  DATA.forEach((topic,ti)=>{
    if(state.klas!=='all' && String(topic.klas)!==state.klas) return;
    if(state.dom!=='all' && topic.dom!==state.dom) return;
    const topicHit = state.q && topic.title.toLowerCase().includes(state.q);
    const items = topic.items.filter(it=> topicHit ? (it.model? state.mode!=='std' : (state.types.has(it.t)&&(state.mode!=='std'||it.t==='O'||it.t==='F')&&(state.details||['Ex','W'].indexOf(it.t)<0))) : itemMatches(it));
    if(!items.length) return;
    nTopics++;
    const sec=el('section','topic');
    const head=el('div','thead');
    head.append(el('h2',null,topic.title));
    const meta=el('div','tmeta');
    meta.append(el('span','tag',topic.klas+'. клас'), el('span','tag',DOMS[topic.dom]));
    const pb=el('button','printone','отпечатай темата');
    pb.onclick=()=>{ document.body.classList.add('print-one'); sec.classList.add('print-target'); window.print();
      setTimeout(()=>{ document.body.classList.remove('print-one'); sec.classList.remove('print-target'); },400); };
    meta.append(pb); head.append(meta); sec.append(head);
    const grid=el('div','cards');
    items.forEach(it=>{
      nCards++;
      if(it.model){
        const card=el('div','model');
        card.innerHTML='<div class="chead"><span class="badge" style="--tc:var(--cM)">Интерактивен модел</span><h4>'+it.h+'</h4></div><div class="mnote">'+it.b+'</div>';
        grid.append(card);
        try{ MODELS[it.model].build(card); }catch(e){ card.append(el('div','mnote','Моделът не можа да се зареди: '+e.message)); }
        return;
      }
      const info=TYPES[it.t];
      const card=el('div','card'+((it.t==='Ex'||it.t==='W')?' detail':''));
      card.style.setProperty('--tc','var('+info.cv+')');
      card.innerHTML='<div class="chead"><span class="badge">'+info.label+'</span><h4>'+it.h+'</h4></div><div class="body">'+it.b+'</div>';
      grid.append(card);
    });
    sec.append(grid); cont.append(sec);
  });
  $('#status').textContent = nCards
    ? nTopics+' теми · '+nCards+' карти'+(state.mode==='std'?' · режим „Ученик“ (само определения и формули)':'')
    : '';
  if(!nCards) cont.append(el('div','empty','Няма резултати за тези филтри. Опитай с „Покажи всичко“ или с друга ключова дума.'));
  if(window.renderMathInElement) renderMathInElement(cont,{
    delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],
    macros:{'\\tg':'\\operatorname{tg}','\\cotg':'\\operatorname{cotg}','\\arctg':'\\operatorname{arctg}','\\arcctg':'\\operatorname{arcctg}'},
    throwOnError:false
  });
}

/* ================= СЪБИТИЯ ================= */
let debounce;
$('#search').addEventListener('input',e=>{
  clearTimeout(debounce);
  debounce=setTimeout(()=>{ state.q=e.target.value.trim().toLowerCase(); render(); },200);
});
$('#modeBtn').onclick=function(){
  state.mode = state.mode==='ext' ? 'std' : 'ext';
  this.textContent = 'Режим: '+(state.mode==='ext'?'Разширен':'Ученик');
  this.classList.toggle('on', state.mode==='std');
  render();
};
$('#themeBtn').onclick=function(){
  const d=document.documentElement;
  const dark = d.dataset.theme!=='dark';
  d.dataset.theme = dark?'dark':'';
  this.textContent = dark?'☀️ Тема':'🌙 Тема';
  try{ localStorage.setItem('spr-theme', dark?'dark':'light'); }catch(e){}
  liveRedraws.forEach(f=>f());
};
$('#printBtn').onclick=()=>window.print();
$('#showAll').onclick=()=>{
  state.klas='all'; state.dom='all'; state.types=new Set(Object.keys(TYPES)); state.q='';
  state.details=true; $('#toggleDetails').textContent='Скрий подробностите'; document.body.classList.remove('nodetails');
  $('#search').value='';
  $('#klist').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x.dataset.v==='all'));
  $('#doms').querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x.dataset.v==='all'));
  $('#types').querySelectorAll('.chip').forEach(x=>x.classList.add('on'));
  render();
};
$('#toggleDetails').onclick=function(){
  state.details=!state.details;
  this.textContent = state.details?'Скрий подробностите':'Покажи подробностите';
  render();
};

/* ================= СТАРТ ================= */
try{ if(localStorage.getItem('spr-theme')==='dark'){ document.documentElement.dataset.theme='dark'; $('#themeBtn').textContent='☀️ Тема'; } }catch(e){}
buildSidebar();
function start(){ render(); }
if(window.renderMathInElement) start();
else window.addEventListener('DOMContentLoaded',()=>{ let tries=0; (function wait(){ if(window.renderMathInElement||tries++>40) start(); else setTimeout(wait,120); })(); });

/* ============================================================
   НАЧАЛНА СТРАНИЦА · ЛОГО-НАВИГАЦИЯ · PWA
   ============================================================ */
(function(){
  const body=document.body;
  function replayHomeAnims(){
    const home=document.getElementById('home'); if(!home) return;
    home.querySelectorAll('.hero-kicker,.hero-h1,.quote,.home-h2,.howto li,.home-actions,.home-logo')
      .forEach(n=>{ n.style.animation='none'; void n.offsetWidth; n.style.animation=''; });
  }
  function showHome(){ body.classList.add('view-home'); body.classList.remove('view-app'); window.scrollTo(0,0); replayHomeAnims(); }
  function showApp(){ body.classList.add('view-app'); body.classList.remove('view-home'); window.scrollTo(0,0); }

  const enter=document.getElementById('enterBtn'); if(enter) enter.addEventListener('click',showApp);
  ['homeMark','homeFab','brandHome'].forEach(id=>{
    const e=document.getElementById(id); if(!e) return;
    e.addEventListener('click',showHome);
    e.addEventListener('keydown',ev=>{ if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); showHome(); } });
  });

  // плаваш бутон „начало“ — появява се при скролиране в справочника
  const fab=document.getElementById('homeFab');
  window.addEventListener('scroll',()=>{
    if(!fab) return;
    if(body.classList.contains('view-app') && window.scrollY>380) fab.classList.add('show');
    else fab.classList.remove('show');
  },{passive:true});

  // ---------- Инсталиране като приложение (PWA) ----------
  let deferred=null;
  const installBtn=document.getElementById('installBtn');
  window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); deferred=e; if(installBtn) installBtn.hidden=false; });
  if(installBtn) installBtn.addEventListener('click',async()=>{
    if(!deferred) return;
    deferred.prompt();
    try{ await deferred.userChoice; }catch(e){}
    deferred=null; installBtn.hidden=true;
  });
  window.addEventListener('appinstalled',()=>{ if(installBtn) installBtn.hidden=true; });

  // подсказка за iPhone/iPad (Safari не поддържа автоматичен инсталационен бутон)
  const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone=window.matchMedia('(display-mode:standalone)').matches || navigator.standalone===true;
  if(isIOS && !standalone){ const h=document.getElementById('iosHint'); if(h) h.hidden=false; }

  // ---------- Service worker (офлайн + инсталируемост) ----------
  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
  }
})();
