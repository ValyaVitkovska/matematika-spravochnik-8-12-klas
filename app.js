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
class Graph{
  constructor(cv,xa,xb,ya,yb){ this.cv=cv; this.c=cv.getContext('2d'); this.set(xa,xb,ya,yb); }
  set(xa,xb,ya,yb){ this.xa=xa; this.xb=xb; this.ya=ya; this.yb=yb; }
  get w(){return this.cv.width} get h(){return this.cv.height}
  X(x){ return (x-this.xa)/(this.xb-this.xa)*this.w; }
  Y(y){ return this.h-(y-this.ya)/(this.yb-this.ya)*this.h; }
  clear(){ const c=this.c; c.clearRect(0,0,this.w,this.h); }
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
    const c=this.c; c.strokeStyle=color; c.lineWidth=w; c.beginPath(); let pen=false;
    const N=this.w;
    for(let i=0;i<=N;i++){ const x=this.xa+(this.xb-this.xa)*i/N; const y=f(x);
      if(!isFinite(y)||Math.abs(y)>1e4){ pen=false; continue; }
      const sx=this.X(x), sy=this.Y(y);
      if(sy<-2000||sy>this.h+2000){ pen=false; continue; }
      if(pen) c.lineTo(sx,sy); else { c.moveTo(sx,sy); pen=true; }
    }
    c.stroke();
  }
  seg(x1,y1,x2,y2,color,w=2,dash){
    const c=this.c; c.strokeStyle=color; c.lineWidth=w; c.setLineDash(dash||[]);
    c.beginPath(); c.moveTo(this.X(x1),this.Y(y1)); c.lineTo(this.X(x2),this.Y(y2)); c.stroke(); c.setLineDash([]);
  }
  dot(x,y,color,rad=5){ const c=this.c; c.fillStyle=color; c.beginPath(); c.arc(this.X(x),this.Y(y),rad,0,7); c.fill(); }
  label(x,y,txt,color,dx=8,dy=-8,font='12.5px system-ui'){ const c=this.c; c.fillStyle=color||cssVar('--ink'); c.font=font; c.fillText(txt,this.X(x)+dx,this.Y(y)+dy); }
  poly(pts,fill,stroke,w=2){ const c=this.c; c.beginPath(); pts.forEach((p,i)=> i?c.lineTo(this.X(p[0]),this.Y(p[1])):c.moveTo(this.X(p[0]),this.Y(p[1]))); c.closePath();
    if(fill){c.fillStyle=fill;c.fill();} if(stroke){c.strokeStyle=stroke;c.lineWidth=w;c.stroke();} }
}
/* Плъзгач с етикет; връща getter */
function ctl(parent,label,min,max,step,val,onch){
  const box=el('div','ctl'); const lab=el('label'); const inp=document.createElement('input');
  inp.type='range'; inp.min=min; inp.max=max; inp.step=step; inp.value=val;
  const upd=()=>{ lab.innerHTML=label+' = <b>'+fmt(+inp.value,2)+'</b>'; };
  inp.addEventListener('input',()=>{upd(); onch&&onch();});
  upd(); box.append(lab,inp); parent.append(box);
  return ()=>+inp.value;
}
function sel(parent,label,options,onch){
  const box=el('div','ctl'); const lab=el('label',null,label); const s=document.createElement('select');
  options.forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;s.append(o);});
  s.addEventListener('change',()=>onch&&onch());
  box.append(lab,s); parent.append(box); return ()=>s.value;
}
function mkCanvas(parent,w=760,h=380){ const cv=document.createElement('canvas'); cv.width=w; cv.height=h; parent.append(cv); return cv; }
function mkOut(parent){ const d=el('div','mout'); parent.append(d); return d; }
const liveRedraws=[];

/* ================= МОДЕЛИ ================= */
const MODELS = {

linear:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,380), out=mkOut(root);
  const g=new Graph(cv,-8,8,-6,6);
  const A=ctl(ctls,'a (наклон)',-5,5,0.1,1,draw), B=ctl(ctls,'b (свободен член)',-5,5,0.1,2,draw);
  function draw(){
    const a=A(), b=B();
    g.clear(); g.grid(1); g.axes(2);
    g.fn(x=>a*x+b, cssVar('--plot-line'));
    g.dot(0,b,cssVar('--plot-line2'),6); g.label(0,b,'(0; '+fmt(b)+')',cssVar('--plot-line2'));
    if(Math.abs(a)>1e-9){ const x0=-b/a; g.dot(x0,0,cssVar('--plot-line3'),5); g.label(x0,0,'x₀='+fmt(x0),cssVar('--plot-line3'),8,18); }
    // триъгълник на наклона
    g.seg(1,a+b,2,a+b,cssVar('--muted'),1.6,[5,4]); g.seg(2,a+b,2,2*a+b,cssVar('--muted'),1.6,[5,4]);
    const beh = a>0?'функцията расте':(a<0?'функцията намалява':'функцията е постоянна');
    out.innerHTML='y = <b>'+fmt(A())+'</b>·x + <b>'+fmt(b)+'</b> &nbsp;·&nbsp; наклон a = <b>'+fmt(a)+'</b> → '+beh+' &nbsp;·&nbsp; пресечна точка с Oy: <b>(0; '+fmt(b)+')</b>';
  }
  draw(); liveRedraws.push(draw);
}},

quad:{ build(root,emph){ 
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,400), out=mkOut(root);
  const g=new Graph(cv,-8,8,-8,8);
  const A=ctl(ctls,'a',-3,3,0.1,1,draw), B=ctl(ctls,'b',-6,6,0.1,-2,draw), C=ctl(ctls,'c',-6,6,0.1,-3,draw);
  function draw(){
    let a=A(); const b=B(), cc=C();
    g.clear(); g.grid(1); g.axes(2);
    if(Math.abs(a)<1e-9){
      g.fn(x=>b*x+cc, cssVar('--plot-line'));
      out.innerHTML='a = 0 → функцията е <b>линейна</b>: y = '+fmt(b)+'x + '+fmt(cc);
      return;
    }
    g.fn(x=>a*x*x+b*x+cc, cssVar('--plot-line'));
    const xv=-b/(2*a), yv=a*xv*xv+b*xv+cc, D=b*b-4*a*cc;
    g.seg(xv,-8,xv,8,cssVar('--plot-line3'),1.5,[6,5]);
    g.dot(xv,yv,cssVar('--plot-line2'),6); g.label(xv,yv,'V('+fmt(xv)+'; '+fmt(yv)+')',cssVar('--plot-line2'));
    let roots='';
    if(D>1e-9){ const x1=(-b-Math.sqrt(D))/(2*a), x2=(-b+Math.sqrt(D))/(2*a);
      g.dot(x1,0,cssVar('--cW'),5.5); g.dot(x2,0,cssVar('--cW'),5.5);
      g.label(x1,0,'x₁='+fmt(x1),cssVar('--cW'),6,20); g.label(x2,0,'x₂='+fmt(x2),cssVar('--cW'),6,-12);
      roots='<b>два реални корена</b>: x₁ = '+fmt(x1)+', x₂ = '+fmt(x2);
    } else if(Math.abs(D)<=1e-9){ g.dot(xv,0,cssVar('--cW'),5.5); roots='<b>един (двоен) корен</b>: x = '+fmt(xv); }
    else roots='<b>няма реални корени</b> — параболата не пресича Ox';
    out.innerHTML='Връх <b>('+fmt(xv)+'; '+fmt(yv)+')</b>, ос на симетрия x = '+fmt(xv)+
      ' &nbsp;·&nbsp; отваряне: <b>'+(a>0?'нагоре (минимум)':'надолу (максимум)')+'</b><br>D = b² − 4ac = <b>'+fmt(D)+'</b> → '+roots;
  }
  draw(); liveRedraws.push(draw);
}},

quadroots:{ build(root){ MODELS.quad.build(root,true); }},

system:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,400), out=mkOut(root);
  const g=new Graph(cv,-8,8,-6,6);
  const A1=ctl(ctls,'a₁',-4,4,0.5,1,draw), B1=ctl(ctls,'b₁',-4,4,0.5,1,draw), C1=ctl(ctls,'c₁',-6,6,0.5,2,draw);
  const A2=ctl(ctls,'a₂',-4,4,0.5,1,draw), B2=ctl(ctls,'b₂',-4,4,0.5,-1,draw), C2=ctl(ctls,'c₂',-6,6,0.5,0,draw);
  function lineFn(a,b,c,color){
    if(Math.abs(b)>1e-9) g.fn(x=>(c-a*x)/b,color);
    else if(Math.abs(a)>1e-9) g.seg(c/a,-6,c/a,6,color,2.2);
  }
  function draw(){
    const a1=A1(),b1=B1(),c1=C1(),a2=A2(),b2=B2(),c2=C2();
    g.clear(); g.grid(1); g.axes(2);
    lineFn(a1,b1,c1,cssVar('--plot-line')); lineFn(a2,b2,c2,cssVar('--plot-line2'));
    const D=a1*b2-a2*b1;
    let msg;
    if(Math.abs(D)>1e-9){
      const x=(c1*b2-c2*b1)/D, y=(a1*c2-a2*c1)/D;
      g.dot(x,y,cssVar('--cW'),6); g.label(x,y,'('+fmt(x)+'; '+fmt(y)+')',cssVar('--cW'));
      msg='Правите се пресичат → <b>единствено решение</b> (x; y) = (<b>'+fmt(x)+'</b>; <b>'+fmt(y)+'</b>). Системата е определена.';
    } else {
      const prop = Math.abs(c1*a2-c2*a1)<1e-9 && Math.abs(c1*b2-c2*b1)<1e-9;
      msg = prop ? 'Правите съвпадат → <b>безброй много решения</b> (зависими уравнения).'
                 : 'Правите са успоредни и различни → <b>няма решение</b> (несъвместима система).';
    }
    out.innerHTML='Система: '+fmt(a1)+'x + '+fmt(b1)+'y = '+fmt(c1)+' &nbsp;и&nbsp; '+fmt(a2)+'x + '+fmt(b2)+'y = '+fmt(c2)+'<br>'+msg;
  }
  draw(); liveRedraws.push(draw);
}},

intervals:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,200), out=mkOut(root);
  const g=new Graph(cv,-7.5,7.5,-1.6,1.6);
  const N=sel(ctls,'Брой корени (с кратностите)',[['2','2'],['3','3'],['4','4'],['5','5']],draw);
  const SGN=sel(ctls,'Неравенство',[['gt','> 0'],['ge','≥ 0'],['lt','< 0'],['le','≤ 0']],draw);
  const LEAD=sel(ctls,'Старши коефициент',[['1','положителен (+)'],['-1','отрицателен (−)']],draw);
  const R1=ctl(ctls,'корен №1',-6,6,0.5,-3,draw);
  const R2=ctl(ctls,'корен №2',-6,6,0.5,1,draw);
  const R3=ctl(ctls,'корен №3',-6,6,0.5,4,draw);  const B3=ctls.lastElementChild;
  const R4=ctl(ctls,'корен №4',-6,6,0.5,1,draw);  const B4=ctls.lastElementChild;
  const R5=ctl(ctls,'корен №5',-6,6,0.5,-5,draw); const B5=ctls.lastElementChild;
  function draw(){
    const n=+N(), lead=+LEAD(), sign=SGN();
    B3.style.display=n>=3?'':'none'; B4.style.display=n>=4?'':'none'; B5.style.display=n>=5?'':'none';
    let all=[R1(),R2()]; if(n>=3)all.push(R3()); if(n>=4)all.push(R4()); if(n>=5)all.push(R5());
    const mult={}; all.forEach(rt=>mult[rt]=(mult[rt]||0)+1);           // кратности!
    const roots=Object.keys(mult).map(Number).sort((a,b)=>a-b);
    const f=x=>lead*all.reduce((p,rt)=>p*(x-rt),1);                     // всички множители, вкл. повторените
    const strict = sign==='gt'||sign==='lt', wantPos = sign==='gt'||sign==='ge';
    g.clear();
    g.seg(-7.5,0,7.5,0,cssVar('--muted'),2);
    for(let x=-7;x<=7;x++){ g.seg(x,-0.08,x,0.08,cssVar('--muted'),1); g.label(x,0,fmt(x,0),cssVar('--muted'),-4,28,'10.5px system-ui'); }
    // знаци по интервалите (пробна точка във всеки)
    const pts=[-Infinity,...roots,Infinity], segs=[];
    for(let i=0;i<pts.length-1;i++){
      const lo=pts[i]===-Infinity?-7.5:pts[i], hi=pts[i+1]===Infinity?7.5:pts[i+1];
      const m=(lo+hi)/2, pos=f(m)>0;
      if(pos===wantPos) segs.push({a:pts[i],b:pts[i+1]});
      g.label(m,0,pos?'+':'−',pos?cssVar('--cF'):cssVar('--cW'),-5,-26,'bold 19px system-ui');
    }
    // при нестрого неравенство: сливаме съседни интервали през включен корен
    const merged=[];
    segs.forEach(s=>{ const last=merged[merged.length-1];
      if(last && !strict && last.b===s.a) last.b=s.b; else merged.push({a:s.a,b:s.b}); });
    // изолирани корени при нестрого неравенство — напр. (x+2)²·x ≥ 0 дава и точката {−2}
    const iso=[];
    if(!strict) roots.forEach(rt=>{
      const inSeg=merged.some(s=> s.a===rt || s.b===rt || (rt>s.a && rt<s.b));
      if(!inSeg) iso.push(rt);
    });
    merged.forEach(s=> g.seg(s.a===-Infinity?-7.5:s.a,0, s.b===Infinity?7.5:s.b,0, cssVar('--accent'),7));
    roots.forEach(rt=>{ const c=g.c; c.lineWidth=2.4; c.strokeStyle=cssVar('--ink');
      c.fillStyle= strict? cssVar('--card') : cssVar('--ink');
      c.beginPath(); c.arc(g.X(rt),g.Y(0),6,0,7); c.fill(); c.stroke();
      if(mult[rt]>1) g.label(rt,0,'×'+mult[rt],cssVar('--plot-line2'),7,-12,'bold 11.5px system-ui');
    });
    iso.forEach(rt=>{ const c=g.c; c.fillStyle=cssVar('--accent'); c.beginPath(); c.arc(g.X(rt),g.Y(0),7.5,0,7); c.fill(); });
    // запис на решението в правилен ред
    const items=merged.map(s=>{
      const L = s.a===-Infinity ? '(−∞' : (strict?'(':'[')+fmt(s.a);
      const Rr= s.b===Infinity ? '+∞)' : fmt(s.b)+(strict?')':']');
      return {key: s.a===-Infinity?-1e9:s.a, str:L+'; '+Rr};
    }).concat(iso.map(rt=>({key:rt, str:'{'+fmt(rt)+'}'})));
    items.sort((u,v)=>u.key-v.key);
    const parts=items.map(i=>i.str);
    const signTxt={gt:'> 0',ge:'≥ 0',lt:'< 0',le:'≤ 0'}[sign];
    const expr=(lead<0?'− ':'')+roots.map(rt=>{
      const base = rt===0 ? 'x' : '(x '+(rt<0?'+ '+fmt(-rt):'− '+fmt(rt))+')';
      return base+(mult[rt]>1?'<sup>'+mult[rt]+'</sup>':'');
    }).join('·');
    const hasEven=roots.some(rt=>mult[rt]%2===0);
    out.innerHTML='Неравенство: <b>'+expr+' '+signTxt+'</b><br>Решение: <b>x ∈ '+(parts.length?parts.join(' ∪ '):'∅')+'</b>'+
      (hasEven?'<br><span class="mnote">Корен с <b>четна кратност</b> (означен ×2, ×4): знакът НЕ се сменя при преминаване през него; при нечетна кратност знакът се сменя.</span>':'')+
      (strict?'':'<br><span class="mnote">Нестрого неравенство — корените се включват; изолиран корен се записва като самостоятелна точка {r}.</span>');
  }
  draw(); liveRedraws.push(draw);
}},

pythagoras:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,640,560), out=mkOut(root);
  const g=new Graph(cv,-6.2,12.2,-5.6,10.5);   // еднакъв мащаб по двете оси → квадратите са квадрати
  const A=ctl(ctls,'катет a',1,5,0.1,3,draw), B=ctl(ctls,'катет b',1,5,0.1,4,draw);
  function sq(p1,p2,color){ // квадрат НАВЪН от триъгълника (надясно от p1→p2)
    const dx=p2[0]-p1[0], dy=p2[1]-p1[1]; const n=[dy,-dx];
    g.poly([p1,p2,[p2[0]+n[0],p2[1]+n[1]],[p1[0]+n[0],p1[1]+n[1]]], color+'33', color, 2);
    return [(p1[0]+p2[0])/2+n[0]/2, (p1[1]+p2[1])/2+n[1]/2];
  }
  function draw(){
    const a=A(), b=B(), cH=Math.hypot(a,b);
    g.clear(); g.grid(1);
    const C=[0,0], Bp=[b,0], Ap=[0,a];
    const cb=sq(C,Bp,cssVar('--plot-line'));   // b² надолу
    const ca=sq(Ap,C,cssVar('--plot-line3'));  // a² наляво
    const cn=sq(Bp,Ap,cssVar('--plot-line2')); // c² навън от хипотенузата
    g.poly([C,Bp,Ap],'rgba(127,127,127,.12)',cssVar('--ink'),2.4);
    g.label(cb[0],cb[1],'b² = '+fmt(b*b),cssVar('--plot-line'),-26,4,'bold 13px system-ui');
    g.label(ca[0],ca[1],'a² = '+fmt(a*a),cssVar('--plot-line3'),-26,4,'bold 13px system-ui');
    g.label(cn[0],cn[1],'c² = '+fmt(cH*cH),cssVar('--plot-line2'),-30,4,'bold 13px system-ui');
    g.label(0.12,0.02,'∟',cssVar('--ink'),2,-4,'15px system-ui');
    out.innerHTML='c = √(a² + b²) = √('+fmt(a*a)+' + '+fmt(b*b)+') = √'+fmt(a*a+b*b)+' = <b>'+fmt(cH,3)+'</b>'+
      ' &nbsp;·&nbsp; проверка на лицата: '+fmt(a*a)+' + '+fmt(b*b)+' = '+fmt(a*a+b*b);
  }
  draw(); liveRedraws.push(draw);
}},

thales:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,380), out=mkOut(root);
  const g=new Graph(cv,-1,11,-0.3,5.7);   // еднакъв мащаб по осите
  const T=ctl(ctls,'положение t на успоредната права',0.15,0.9,0.01,0.45,draw);
  function draw(){
    const t=T();
    const A=[5,5.3], B=[0.5,0.6], C=[10,0.6];
    const M=[A[0]+(B[0]-A[0])*t, A[1]+(B[1]-A[1])*t];
    const N=[A[0]+(C[0]-A[0])*t, A[1]+(C[1]-A[1])*t];
    g.clear();
    g.poly([A,B,C],null,cssVar('--ink'),2.2);
    g.seg(M[0],M[1],N[0],N[1],cssVar('--plot-line2'),3);
    g.seg(B[0],B[1],C[0],C[1],cssVar('--plot-line'),3);
    [['A',A],['B',B],['C',C],['M',M],['N',N]].forEach(([n,p])=>{ g.dot(p[0],p[1],cssVar('--accent'),4.5); g.label(p[0],p[1],n,cssVar('--ink'),8,-6,'bold 14px Georgia'); });
    const ratio=t/(1-t);
    out.innerHTML='MN ∥ BC &nbsp;·&nbsp; AM : MB = <b>'+fmt(ratio,3)+'</b> &nbsp;и&nbsp; AN : NC = <b>'+fmt(ratio,3)+'</b> — отношенията са равни (теорема на Талес).'+
      '<br>MN : BC = <b>'+fmt(t,2)+'</b> — успоредната права отсича подобен триъгълник AMN с коефициент k = '+fmt(t,2)+'.';
  }
  draw(); liveRedraws.push(draw);
}},

bisector:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,420), out=mkOut(root);
  const g=new Graph(cv,-0.5,10.7,-0.4,5.79);  // еднакъв мащаб по осите
  const Cc=ctl(ctls,'страна AB = c',2.5,6.5,0.1,6,draw), Bb=ctl(ctls,'страна AC = b',2.5,6.5,0.1,4,draw);
  function draw(){
    const c=Cc(), b=Bb(), ang=52*Math.PI/180;
    const A=[1,0.8];
    const B=[A[0]+c,A[1]];
    const C=[A[0]+b*Math.cos(ang), A[1]+b*Math.sin(ang)];
    const L=[B[0]+(C[0]-B[0])*(c/(b+c)), B[1]+(C[1]-B[1])*(c/(b+c))]; // BL:LC = c:b
    g.clear();
    g.poly([A,B,C],null,cssVar('--ink'),2.2);
    g.seg(A[0],A[1],L[0],L[1],cssVar('--plot-line2'),3);
    g.seg(B[0],B[1],L[0],L[1],cssVar('--plot-line'),4);
    g.seg(L[0],L[1],C[0],C[1],cssVar('--plot-line3'),4);
    [['A',A],['B',B],['C',C],['L',L]].forEach(([n,p])=>{ g.dot(p[0],p[1],cssVar('--accent'),4.5); g.label(p[0],p[1],n,cssVar('--ink'),8,-6,'bold 14px Georgia'); });
    const BL=Math.hypot(L[0]-B[0],L[1]-B[1]), LC=Math.hypot(C[0]-L[0],C[1]-L[1]);
    out.innerHTML='AL е ъглополовяща от A. &nbsp; BL : LC = <b>'+fmt(BL/LC,3)+'</b> &nbsp;=&nbsp; AB : AC = c : b = <b>'+fmt(c/b,3)+'</b> ✓';
  }
  draw(); liveRedraws.push(draw);
}},

circle:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,430), out=mkOut(root);
  const g=new Graph(cv,-2.2,2.2,-1.245,1.245); // еднакъв мащаб по осите: точките лежат точно на окръжността
  const ARC=ctl(ctls,'дъга AB (°)',20,340,1,120,draw), POS=ctl(ctls,'положение на върха C',0.1,0.9,0.01,0.5,draw);
  const rad=d=>d*Math.PI/180;
  function P(ang){ return [Math.cos(rad(ang)),Math.sin(rad(ang))]; }
  function arcStroke(a1,a2,color,w,radius=1){ const c=g.c; c.strokeStyle=color; c.lineWidth=w; c.beginPath();
    c.arc(g.X(0),g.Y(0), (g.X(radius)-g.X(0)), -rad(a2), -rad(a1)); c.stroke(); }
  function draw(){
    const arc=ARC(), s=POS();
    const aA=90+arc/2, aB=90-arc/2;             // A и B симетрично около върха (90°)
    const aC=aB - s*(360-arc);                   // C върху голямата дъга
    const A=P(aA), B=P(aB), C=P(aC), O=[0,0];
    g.clear();
    // окръжност
    const c=g.c; c.strokeStyle=cssVar('--ink'); c.lineWidth=2; c.beginPath();
    c.arc(g.X(0),g.Y(0),g.X(1)-g.X(0),0,7); c.stroke();
    arcStroke(aB,aA,cssVar('--plot-line2'),4);   // дъгата AB
    // радиуси и хорда
    g.seg(O[0],O[1],A[0],A[1],cssVar('--plot-line'),2); g.seg(O[0],O[1],B[0],B[1],cssVar('--plot-line'),2);
    g.seg(A[0],A[1],B[0],B[1],cssVar('--cS'),2.4);
    // вписан ъгъл
    g.seg(C[0],C[1],A[0],A[1],cssVar('--plot-line3'),2.2); g.seg(C[0],C[1],B[0],B[1],cssVar('--plot-line3'),2.2);
    // допирателна в A
    const t=[-Math.sin(rad(aA)),Math.cos(rad(aA))];
    g.seg(A[0]-t[0]*0.85,A[1]-t[1]*0.85,A[0]+t[0]*0.85,A[1]+t[1]*0.85,cssVar('--muted'),1.6,[7,5]);
    [['A',A],['B',B],['C',C],['O',O]].forEach(([n,p])=>{ g.dot(p[0],p[1],cssVar('--accent'),4.5); g.label(p[0],p[1],n,cssVar('--ink'),7,-7,'bold 14px Georgia'); });
    out.innerHTML='Дъга AB = <b>'+fmt(arc,0)+'°</b> &nbsp;·&nbsp; централен ъгъл ∠AOB = <b>'+fmt(arc,0)+'°</b> (равен на дъгата)'+
      '<br>вписан ъгъл ∠ACB = <b>'+fmt(arc/2,1)+'°</b> (половината от дъгата) — независимо къде по голямата дъга е C.'+
      '<br><span class="mnote">Пунктираната права е допирателната в A: ъгълът между нея и хордата AB също е '+fmt(arc/2,1)+'°.</span>';
  }
  draw(); liveRedraws.push(draw);
}},

trigright:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,430), out=mkOut(root);
  const g=new Graph(cv,-0.6,10.0,-0.5,5.5);  // еднакъв мащаб по осите
  const AL=ctl(ctls,'ъгъл α (°)',10,80,1,35,draw);
  function draw(){
    const al=AL()*Math.PI/180, hyp=5;
    const A=[0.5,0.4], B=[A[0]+hyp*Math.cos(al),A[1]], Ct=[A[0]+hyp*Math.cos(al),A[1]+hyp*Math.sin(al)];
    // прав ъгъл при B; α при A; срещулежащ на α катет = BC (вертикален)
    g.clear();
    g.poly([A,B,Ct],null,cssVar('--ink'),2.2);
    g.seg(A[0],A[1],B[0],B[1],cssVar('--plot-line'),4);      // прилежащ
    g.seg(B[0],B[1],Ct[0],Ct[1],cssVar('--plot-line2'),4);   // срещулежащ
    g.label((A[0]+B[0])/2,A[1],'прилежащ = '+fmt(hyp*Math.cos(al),2),cssVar('--plot-line'),-40,24,'12.5px system-ui');
    g.label(B[0],(B[1]+Ct[1])/2,'срещулежащ = '+fmt(hyp*Math.sin(al),2),cssVar('--plot-line2'),10,4,'12.5px system-ui');
    g.label((A[0]+Ct[0])/2,(A[1]+Ct[1])/2,'хипотенуза = '+fmt(hyp,0),cssVar('--ink'),-95,-10,'12.5px system-ui');
    g.label(A[0],A[1],'α',cssVar('--cW'),26,-6,'bold 15px Georgia');
    g.label(B[0],B[1],'∟',cssVar('--ink'),-18,-6,'14px system-ui');
    const s=Math.sin(al), cO=Math.cos(al);
    out.innerHTML='sin α = <b>'+fmt(s,3)+'</b> &nbsp; cos α = <b>'+fmt(cO,3)+'</b> &nbsp; tg α = <b>'+fmt(s/cO,3)+'</b> &nbsp; cotg α = <b>'+fmt(cO/s,3)+'</b>'+
      '<br><span class="mnote">Проверка: sin²α + cos²α = '+fmt(s*s+cO*cO,3)+'</span>';
  }
  draw(); liveRedraws.push(draw);
}},

unitcircle:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,320), out=mkOut(root);
  const btn=el('button','btn','▶ Пусни'); ctls.append(btn);
  const AN=ctl(ctls,'ъгъл x (°)',0,720,1,50,draw);
  let playing=false, raf=null, angle=50;
  const slider=ctls.querySelectorAll('input[type=range]')[0];
  btn.onclick=()=>{ playing=!playing; btn.textContent=playing?'⏸ Пауза':'▶ Пусни'; if(playing) tick(); else cancelAnimationFrame(raf); };
  function tick(){ angle=(+slider.value+1.2)%720; slider.value=angle; slider.dispatchEvent(new Event('input')); if(playing) raf=requestAnimationFrame(tick); }
  function draw(){
    const deg=AN(), x=deg*Math.PI/180;
    const c=cv.getContext('2d'); c.clearRect(0,0,760,320);
    const cx=140, cy=160, R=110;
    // окръжност
    c.strokeStyle=cssVar('--muted'); c.lineWidth=1.4;
    c.beginPath(); c.arc(cx,cy,R,0,7); c.stroke();
    c.beginPath(); c.moveTo(cx-R-16,cy); c.lineTo(cx+R+16,cy); c.moveTo(cx,cy-R-16); c.lineTo(cx,cy+R+16); c.stroke();
    const px=cx+R*Math.cos(x), py=cy-R*Math.sin(x);
    c.strokeStyle=cssVar('--accent'); c.lineWidth=2; c.beginPath(); c.moveTo(cx,cy); c.lineTo(px,py); c.stroke();
    c.strokeStyle=cssVar('--plot-line2'); c.setLineDash([4,4]); c.beginPath(); c.moveTo(px,py); c.lineTo(px,cy); c.stroke();
    c.strokeStyle=cssVar('--plot-line3'); c.beginPath(); c.moveTo(px,py); c.lineTo(cx,py); c.stroke(); c.setLineDash([]);
    c.fillStyle=cssVar('--cW'); c.beginPath(); c.arc(px,py,5.5,0,7); c.fill();
    c.fillStyle=cssVar('--plot-line2'); c.font='12px system-ui'; c.fillText('sin',px+6,(py+cy)/2);
    c.fillStyle=cssVar('--plot-line3'); c.fillText('cos',(px+cx)/2-12,py-6);
    // графики
    const gx0=300, gw=440, gy=160, amp=95, per=720;
    c.strokeStyle=cssVar('--muted'); c.lineWidth=1; c.beginPath(); c.moveTo(gx0,gy); c.lineTo(gx0+gw,gy); c.moveTo(gx0,30); c.lineTo(gx0,290); c.stroke();
    c.font='11px system-ui'; c.fillStyle=cssVar('--muted');
    [0,180,360,540,720].forEach(d=>{ const X=gx0+gw*d/per; c.fillText(d+'°',X-8,gy+16); c.beginPath(); c.moveTo(X,gy-3); c.lineTo(X,gy+3); c.stroke(); });
    const plot=(f,color)=>{ c.strokeStyle=color; c.lineWidth=2.2; c.beginPath();
      for(let i=0;i<=gw;i++){ const d=per*i/gw; const Y=gy-amp*f(d*Math.PI/180); i?c.lineTo(gx0+i,Y):c.moveTo(gx0+i,Y);} c.stroke(); };
    plot(Math.sin,cssVar('--plot-line2')); plot(Math.cos,cssVar('--plot-line3'));
    const gX=gx0+gw*deg/per;
    c.strokeStyle=cssVar('--accent'); c.setLineDash([4,4]); c.beginPath(); c.moveTo(gX,30); c.lineTo(gX,290); c.stroke(); c.setLineDash([]);
    c.fillStyle=cssVar('--plot-line2'); c.beginPath(); c.arc(gX,gy-amp*Math.sin(x),5,0,7); c.fill();
    c.fillStyle=cssVar('--plot-line3'); c.beginPath(); c.arc(gX,gy-amp*Math.cos(x),5,0,7); c.fill();
    c.fillStyle=cssVar('--plot-line2'); c.font='12.5px system-ui'; c.fillText('sin x',gx0+gw-40,52);
    c.fillStyle=cssVar('--plot-line3'); c.fillText('cos x',gx0+gw-40,68);
    const tg = Math.abs(Math.cos(x))<1e-3 ? '—' : fmt(Math.tan(x),3);
    out.innerHTML='x = <b>'+fmt(deg,0)+'°</b> = '+fmt(x,2)+' rad &nbsp;·&nbsp; sin x = <b>'+fmt(Math.sin(x),3)+'</b> &nbsp; cos x = <b>'+fmt(Math.cos(x),3)+'</b> &nbsp; tg x = <b>'+tg+'</b>';
  }
  draw(); liveRedraws.push(draw);
}},

progr:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,340), out=mkOut(root);
  const TYPE=sel(ctls,'Вид прогресия',[['a','аритметична'],['g','геометрична']],draw);
  const A1=ctl(ctls,'a₁ (първи член)',-5,5,0.5,2,draw);
  const D=ctl(ctls,'d (разлика)',-3,3,0.5,1.5,draw);
  const Q=ctl(ctls,'q (частно)',-2,2.5,0.1,1.3,draw);
  const N=ctl(ctls,'n (брой членове)',3,15,1,8,draw);
  function draw(){
    const type=TYPE(), a1=A1(), d=D(), q=Math.abs(Q())<0.05?0.1:Q(), n=Math.round(N());
    const terms=[]; for(let i=1;i<=n;i++) terms.push(type==='a'? a1+(i-1)*d : a1*Math.pow(q,i-1));
    const c=cv.getContext('2d'); c.clearRect(0,0,760,340);
    const maxA=Math.max(1,...terms.map(v=>Math.abs(v)));
    const zero=170, sc=140/maxA, bw=Math.min(46,700/n-8);
    c.strokeStyle=cssVar('--muted'); c.beginPath(); c.moveTo(20,zero); c.lineTo(740,zero); c.stroke();
    terms.forEach((v,i)=>{
      const X=40+i*(700/n), H=v*sc;
      c.fillStyle= v>=0 ? cssVar('--plot-line') : cssVar('--plot-line2');
      c.fillRect(X, H>=0? zero-H : zero, bw, Math.abs(H));
      c.fillStyle=cssVar('--ink'); c.font='11px system-ui'; c.textAlign='center';
      c.fillText(fmt(v,2), X+bw/2, (H>=0? zero-H-6 : zero+Math.abs(H)+13));
      c.fillStyle=cssVar('--muted'); c.fillText('a'+(i+1), X+bw/2, zero+(H>=0?15:-6));
    });
    c.textAlign='left';
    const an=terms[n-1];
    const Sn = type==='a' ? n*(a1+an)/2 : (Math.abs(q-1)<1e-9 ? n*a1 : a1*(Math.pow(q,n)-1)/(q-1));
    out.innerHTML = type==='a'
      ? 'aₙ = a₁ + (n−1)d = '+fmt(a1)+' + '+(n-1)+'·'+fmt(d)+' = <b>'+fmt(an,2)+'</b> &nbsp;·&nbsp; Sₙ = n(a₁+aₙ)/2 = <b>'+fmt(Sn,2)+'</b>'
      : 'aₙ = a₁·qⁿ⁻¹ = '+fmt(a1)+'·'+fmt(q)+'^'+(n-1)+' = <b>'+fmt(an,3)+'</b> &nbsp;·&nbsp; Sₙ = a₁(qⁿ−1)/(q−1) = <b>'+fmt(Sn,3)+'</b>';
  }
  draw(); liveRedraws.push(draw);
}},

venn:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,300), out=mkOut(root);
  const PA=ctl(ctls,'P(A)',0.1,0.9,0.05,0.5,draw), PB=ctl(ctls,'P(B)',0.1,0.9,0.05,0.4,draw), PAB=ctl(ctls,'P(A∩B)',0,0.5,0.05,0.2,draw);
  function draw(){
    const pa=PA(), pb=PB(); let pab=Math.min(PAB(),pa,pb);
    const c=cv.getContext('2d'); c.clearRect(0,0,760,300);
    const rA=40+90*Math.sqrt(pa), rB=40+90*Math.sqrt(pb);
    const overlapFrac = pab/Math.min(pa,pb);           // 0..1
    const dist=(rA+rB)*(1-0.85*overlapFrac);
    const cx=380, cy=150, xA=cx-dist/2, xB=cx+dist/2;
    c.globalAlpha=0.45;
    c.fillStyle=cssVar('--plot-line');  c.beginPath(); c.arc(xA,cy,rA,0,7); c.fill();
    c.fillStyle=cssVar('--plot-line2'); c.beginPath(); c.arc(xB,cy,rB,0,7); c.fill();
    c.globalAlpha=1;
    c.strokeStyle=cssVar('--ink'); c.lineWidth=1.6;
    c.beginPath(); c.arc(xA,cy,rA,0,7); c.stroke(); c.beginPath(); c.arc(xB,cy,rB,0,7); c.stroke();
    c.fillStyle=cssVar('--ink'); c.font='bold 16px Georgia';
    c.fillText('A',xA-rA+12,cy-rA+26); c.fillText('B',xB+rB-24,cy-rB+26);
    if(pab>0){ c.font='12px system-ui'; c.fillText('A∩B',cx-16,cy+4); }
    const un=pa+pb-pab;
    out.innerHTML='P(A∪B) = P(A) + P(B) − P(A∩B) = '+fmt(pa)+' + '+fmt(pb)+' − '+fmt(pab)+' = <b>'+fmt(un,2)+'</b>'+
      (pab===0?'<br><span class="mnote">A∩B = ∅ → събитията са несъвместими и P(A∪B) = P(A) + P(B).</span>':'')+
      (un>1?'<br><span class="mnote" style="color:var(--cW)">Внимание: P(A∪B) не може да надхвърля 1 — увеличи сечението или намали P(A), P(B).</span>':'');
  }
  draw(); liveRedraws.push(draw);
}},

stats:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const box=el('div','ctl'); box.style.flex='1 1 320px';
  box.innerHTML='<label>Данни (числа, разделени със запетая)</label>';
  const ta=document.createElement('textarea'); ta.rows=2; ta.value='2, 3, 3, 5, 7, 7, 7, 8, 10, 12, 4, 6, 6, 9';
  box.append(ta); ctls.append(box);
  const BINS=ctl(ctls,'брой интервали',3,10,1,5,draw);
  ta.addEventListener('input',draw);
  const cv=mkCanvas(root,760,300), tblWrap=el('div'), out=mkOut(root); root.append(tblWrap);
  function draw(){
    const data=ta.value.split(/[,;\s]+/).map(Number).filter(v=>isFinite(v));
    const c=cv.getContext('2d'); c.clearRect(0,0,760,300);
    if(data.length<2){ out.innerHTML='Въведи поне две числа.'; tblWrap.innerHTML=''; return; }
    const n=data.length, sorted=[...data].sort((a,b)=>a-b);
    const mean=data.reduce((s,v)=>s+v,0)/n;
    const median = n%2 ? sorted[(n-1)/2] : (sorted[n/2-1]+sorted[n/2])/2;
    const freq={}; data.forEach(v=>freq[v]=(freq[v]||0)+1);
    const maxf=Math.max(...Object.values(freq));
    const modes=Object.keys(freq).filter(k=>freq[k]===maxf).map(Number);
    const range=sorted[n-1]-sorted[0];
    const varr=data.reduce((s,v)=>s+(v-mean)**2,0)/n, sd=Math.sqrt(varr);
    // хистограма
    const k=Math.round(BINS()), lo=sorted[0], hi=sorted[n-1]+1e-9, w=(hi-lo)/k||1;
    const bins=Array(k).fill(0); data.forEach(v=>{ bins[Math.min(k-1,Math.floor((v-lo)/w))]++; });
    const bmax=Math.max(...bins), x0=60, y0=250, gw=660, gh=200;
    c.strokeStyle=cssVar('--muted'); c.beginPath(); c.moveTo(x0,y0); c.lineTo(x0+gw,y0); c.moveTo(x0,y0); c.lineTo(x0,y0-gh-10); c.stroke();
    c.font='11px system-ui';
    const pts=[];
    bins.forEach((f,i)=>{
      const bx=x0+i*(gw/k)+4, bw=gw/k-8, bh=gh*f/bmax;
      c.fillStyle=cssVar('--plot-line'); c.globalAlpha=.75; c.fillRect(bx,y0-bh,bw,bh); c.globalAlpha=1;
      c.fillStyle=cssVar('--ink'); c.textAlign='center'; c.fillText(f, bx+bw/2, y0-bh-5);
      c.fillStyle=cssVar('--muted'); c.fillText(fmt(lo+i*w,1)+'–'+fmt(lo+(i+1)*w,1), bx+bw/2, y0+14);
      pts.push([bx+bw/2, y0-bh]);
    });
    // полигон
    c.strokeStyle=cssVar('--plot-line2'); c.lineWidth=2.4; c.beginPath();
    pts.forEach((p,i)=> i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])); c.stroke();
    pts.forEach(p=>{ c.fillStyle=cssVar('--plot-line2'); c.beginPath(); c.arc(p[0],p[1],4,0,7); c.fill(); });
    c.textAlign='left';
    // честотна таблица
    let rows=Object.keys(freq).map(Number).sort((a,b)=>a-b);
    tblWrap.innerHTML='<table class="mt"><tr><th>стойност</th>'+rows.map(v=>'<td>'+v+'</td>').join('')+'</tr>'+
      '<tr><th>честота</th>'+rows.map(v=>'<td>'+freq[v]+'</td>').join('')+'</tr>'+
      '<tr><th>отн. честота</th>'+rows.map(v=>'<td>'+fmt(freq[v]/n,2)+'</td>').join('')+'</tr></table>';
    out.innerHTML='n = <b>'+n+'</b> &nbsp;·&nbsp; средно x̄ = <b>'+fmt(mean,2)+'</b> &nbsp;·&nbsp; медиана = <b>'+fmt(median,2)+'</b> &nbsp;·&nbsp; мода = <b>'+modes.join(', ')+'</b>'+
      '<br>размах R = <b>'+fmt(range,2)+'</b> &nbsp;·&nbsp; дисперсия s² = <b>'+fmt(varr,3)+'</b> &nbsp;·&nbsp; стандартно отклонение s = <b>'+fmt(sd,3)+'</b>'+
      '<br><span class="mnote">Стълбчетата са хистограмата, оранжевата линия — полигонът на честотите.</span>';
  }
  draw(); liveRedraws.push(draw);
}},

stereo:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,380), out=mkOut(root);
  const SHAPE=sel(ctls,'Тяло',[['prism','права призма'],['pyr','правилна пирамида'],['cyl','цилиндър'],['cone','конус'],['sph','сфера / кълбо']],draw);
  const spin=el('button','btn','⟳ Автовъртене'); ctls.append(spin);
  const ROT=ctl(ctls,'завъртане (°)',0,360,1,25,draw);
  let spinning=false;
  const rotSlider=ctls.querySelectorAll('input[type=range]')[0];
  spin.onclick=()=>{ spinning=!spinning; spin.classList.toggle('on',spinning);
    (function loop(){ if(!spinning) return; rotSlider.value=(+rotSlider.value+0.8)%360;
      rotSlider.dispatchEvent(new Event('input')); requestAnimationFrame(loop); })(); };
  const P1=ctl(ctls,'основа: страна a / радиус r',1,4,0.1,2,draw);
  const P2=ctl(ctls,'височина h / радиус R',1,5,0.1,3.2,draw);
  const NN=ctl(ctls,'брой стени n (призма/пирамида)',3,8,1,6,draw);
  function project(p,th){
    const [x,y,z]=p;
    const u=x*Math.cos(th)+z*Math.sin(th), v=z*Math.cos(th)-x*Math.sin(th);
    const k=52;
    return [380+k*u, 220-k*y+k*v*0.42, v];       // v = дълбочина
  }
  function edge(c,a,b,th,color,w=1.8,dash){ const A=project(a,th),B=project(b,th);
    const hidden=(A[2]+B[2])/2 < -0.12;          // задните ръбове — пунктир и по-бледи
    c.globalAlpha=hidden?0.5:1;
    c.strokeStyle=color; c.lineWidth=hidden?Math.max(1,w-0.6):w;
    c.setLineDash(hidden?[5,5]:(dash||[]));
    c.beginPath(); c.moveTo(A[0],A[1]); c.lineTo(B[0],B[1]); c.stroke(); c.setLineDash([]); c.globalAlpha=1; }
  function draw(){
    const shape=SHAPE(), th=ROT()*Math.PI/180, a=P1(), h=P2(), n=Math.round(NN());
    const c=cv.getContext('2d'); c.clearRect(0,0,760,380);
    const ink=cssVar('--ink'), acc=cssVar('--plot-line'), mut=cssVar('--muted');
    let S,V,txt;
    if(shape==='prism'||shape==='pyr'){
      const Rb=a/(2*Math.sin(Math.PI/n));                  // радиус на описаната около основата
      const base=[...Array(n)].map((_,i)=>{ const t=2*Math.PI*i/n; return [Rb*Math.cos(t),0,Rb*Math.sin(t)]; });
      base.forEach((p,i)=> edge(c,p,base[(i+1)%n],th,acc,2));
      if(shape==='prism'){
        const top=base.map(p=>[p[0],h,p[2]]);
        top.forEach((p,i)=> edge(c,p,top[(i+1)%n],th,ink,2));
        base.forEach((p,i)=> edge(c,p,top[i],th,mut,1.6));
        const Sb=n*a*a/(4*Math.tan(Math.PI/n)), P=n*a;
        S=P*h+2*Sb; V=Sb*h;
        txt='Права '+n+'-ъгълна призма: S<sub>осн</sub> = '+fmt(Sb,2)+', S<sub>ок</sub> = P·h = '+fmt(P*h,2)+', <b>S<sub>пълна</sub> = '+fmt(S,2)+'</b>, <b>V = S<sub>осн</sub>·h = '+fmt(V,2)+'</b>';
      } else {
        const apex=[0,h,0];
        base.forEach(p=> edge(c,p,apex,th,mut,1.6));
        const Sb=n*a*a/(4*Math.tan(Math.PI/n)), P=n*a;
        const ap=a/(2*Math.tan(Math.PI/n)), l=Math.hypot(h,ap);
        S=P*l/2+Sb; V=Sb*h/3;
        txt='Правилна '+n+'-ъгълна пирамида: апотема l = '+fmt(l,2)+', S<sub>ок</sub> = P·l/2 = '+fmt(P*l/2,2)+', <b>S<sub>пълна</sub> = '+fmt(S,2)+'</b>, <b>V = S<sub>осн</sub>·h/3 = '+fmt(V,2)+'</b>';
      }
    }
    if(shape==='cyl'||shape==='cone'){
      const m=28, ring=[...Array(m)].map((_,i)=>{ const t=2*Math.PI*i/m; return [a*Math.cos(t),0,a*Math.sin(t)]; });
      ring.forEach((p,i)=> edge(c,p,ring[(i+1)%m],th,acc,2));
      if(shape==='cyl'){
        const topr=ring.map(p=>[p[0],h,p[2]]);
        topr.forEach((p,i)=> edge(c,p,topr[(i+1)%m],th,ink,2));
        for(let i=0;i<m;i+=Math.floor(m/4)) edge(c,ring[i],topr[i],th,mut,1.5);
        S=2*Math.PI*a*h+2*Math.PI*a*a; V=Math.PI*a*a*h;
        txt='Цилиндър (r = '+fmt(a)+', h = '+fmt(h)+'): S<sub>ок</sub> = 2πrh = '+fmt(2*Math.PI*a*h,2)+', <b>S<sub>пълна</sub> = '+fmt(S,2)+'</b>, <b>V = πr²h = '+fmt(V,2)+'</b>';
      } else {
        const apex=[0,h,0];
        for(let i=0;i<m;i+=Math.floor(m/6)) edge(c,ring[i],apex,th,mut,1.5);
        const l=Math.hypot(a,h);
        S=Math.PI*a*l+Math.PI*a*a; V=Math.PI*a*a*h/3;
        txt='Конус (r = '+fmt(a)+', h = '+fmt(h)+'): l = √(r²+h²) = '+fmt(l,2)+', S<sub>ок</sub> = πrl = '+fmt(Math.PI*a*l,2)+', <b>S<sub>пълна</sub> = '+fmt(S,2)+'</b>, <b>V = πr²h/3 = '+fmt(V,2)+'</b>';
      }
    }
    if(shape==='sph'){
      const R=h/1.6+0.8, m=36;
      for(const lat of [-50,-25,0,25,50]){
        const y=R*Math.sin(lat*Math.PI/180), rr=R*Math.cos(lat*Math.PI/180);
        const ring=[...Array(m)].map((_,i)=>{ const t=2*Math.PI*i/m; return [rr*Math.cos(t),y,rr*Math.sin(t)]; });
        ring.forEach((p,i)=> edge(c,p,ring[(i+1)%m],th, lat===0?acc:mut, lat===0?2:1.2));
      }
      for(const lon of [0,45,90,135]){
        const ring=[...Array(m)].map((_,i)=>{ const t=2*Math.PI*i/m;
          return [R*Math.cos(t)*Math.cos(lon*Math.PI/180), R*Math.sin(t), R*Math.cos(t)*Math.sin(lon*Math.PI/180)]; });
        ring.forEach((p,i)=> edge(c,p,ring[(i+1)%m],th,mut,1.2));
      }
      S=4*Math.PI*R*R; V=4/3*Math.PI*R**3;
      txt='Сфера с R = '+fmt(R,2)+': <b>S = 4πR² = '+fmt(S,2)+'</b>; кълбо: <b>V = 4πR³/3 = '+fmt(V,2)+'</b> <span class="mnote">(R се управлява от плъзгача за височина)</span>';
    }
    out.innerHTML=txt;
  }
  draw(); liveRedraws.push(draw);
}},

/* ---------- Вектори: сума и умножение с число ---------- */
vectors:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,430), out=mkOut(root);
  const g=new Graph(cv,-9,9,-5.1,5.1);
  const MODE=sel(ctls,'Действие',[['sum','a + b (триъгълник и успоредник)'],['mul','k · a (умножение с число)']],draw);
  const AX=ctl(ctls,'aₓ',-4,4,0.5,3,draw), AY=ctl(ctls,'aᵧ',-4,4,0.5,1,draw);
  const BX=ctl(ctls,'bₓ',-4,4,0.5,1,draw), BY=ctl(ctls,'bᵧ',-4,4,0.5,2.5,draw);
  const K=ctl(ctls,'k',-2,2,0.1,1.5,draw);
  function arrow(x1,y1,x2,y2,color,w,dash){
    if(Math.hypot(x2-x1,y2-y1)<1e-9) return;
    g.seg(x1,y1,x2,y2,color,w||2.6,dash);
    const c=g.c, X2=g.X(x2),Y2=g.Y(y2);
    const an=Math.atan2(Y2-g.Y(y1),X2-g.X(x1));
    c.fillStyle=color; c.beginPath(); c.moveTo(X2,Y2);
    c.lineTo(X2-11*Math.cos(an-0.4),Y2-11*Math.sin(an-0.4));
    c.lineTo(X2-11*Math.cos(an+0.4),Y2-11*Math.sin(an+0.4)); c.closePath(); c.fill();
  }
  function draw(){
    const ax=AX(),ay=AY(),bx=BX(),by=BY(),k=K();
    g.clear(); g.grid(1); g.axes(2);
    if(MODE()==='sum'){
      arrow(0,0,ax,ay,cssVar('--plot-line')); g.label(ax/2,ay/2,'a',cssVar('--plot-line'),8,-8,'bold 15px Georgia');
      arrow(ax,ay,ax+bx,ay+by,cssVar('--plot-line2')); g.label(ax+bx/2,ay+by/2,'b',cssVar('--plot-line2'),8,-8,'bold 15px Georgia');
      arrow(0,0,ax+bx,ay+by,cssVar('--cW'),3.2); g.label((ax+bx)/2,(ay+by)/2,'a + b',cssVar('--cW'),-46,16,'bold 15px Georgia');
      arrow(0,0,bx,by,cssVar('--plot-line2'),1.5,[6,5]); arrow(bx,by,ax+bx,ay+by,cssVar('--plot-line'),1.5,[6,5]);
      out.innerHTML='a = ('+fmt(ax)+'; '+fmt(ay)+'), b = ('+fmt(bx)+'; '+fmt(by)+') → <b>a + b = ('+fmt(ax+bx)+'; '+fmt(ay+by)+')</b>'+
        ' · |a| = '+fmt(Math.hypot(ax,ay),2)+', |b| = '+fmt(Math.hypot(bx,by),2)+', |a + b| = <b>'+fmt(Math.hypot(ax+bx,ay+by),2)+'</b>'+
        '<br><span class="mnote">Плътните стрелки показват правилото на триъгълника; пунктираните допълват успоредника — резултатът е същият.</span>';
    } else {
      arrow(0,0,k*ax,k*ay,cssVar('--plot-line2'),3.4); 
      arrow(0,0,ax,ay,cssVar('--plot-line'),2.6);
      g.label(ax,ay,'a',cssVar('--plot-line'),8,-8,'bold 15px Georgia');
      g.label(k*ax,k*ay,'k·a',cssVar('--plot-line2'),8,18,'bold 15px Georgia');
      const note = k<0 ? '<br><span class="mnote">k < 0 → направлението се обръща: k·a сочи в противоположната посока по същата права (векторите са колинеарни).</span>'
        : (Math.abs(k)<1e-9 ? '<br><span class="mnote">k = 0 → получава се нулевият вектор.</span>'
        : '<br><span class="mnote">k > 0 → посоката и направлението се запазват; двата вектора са колинеарни.</span>');
      out.innerHTML='k = '+fmt(k)+' → <b>k·a = ('+fmt(k*ax)+'; '+fmt(k*ay)+')</b> · |k·a| = |k|·|a| = '+fmt(Math.abs(k),2)+' · '+fmt(Math.hypot(ax,ay),2)+' = <b>'+fmt(Math.abs(k)*Math.hypot(ax,ay),2)+'</b>'+note;
    }
  }
  draw(); liveRedraws.push(draw);
}},

/* ---------- Триъгълник: сбор на ъглите, външен ъгъл, страни ---------- */
tribasic:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,380), out=mkOut(root);
  const g=new Graph(cv,-1,12,-0.7,5.8);   // еднакъв мащаб по осите
  const B1=ctl(ctls,'ъгъл β при B (°)',20,110,1,55,draw), G1=ctl(ctls,'ъгъл γ при C (°)',20,110,1,40,draw);
  function draw(){
    let be=B1(), ga=G1();
    if(be+ga>150) ga=150-be;
    const al=180-be-ga;
    const t1=Math.tan(be*Math.PI/180), t2=Math.tan(ga*Math.PI/180);
    const ax0=t2/(t1+t2), ay0=ax0*t1;                 // при основа с дължина 1
    const s=Math.min(9.8, 4.7/ay0);                    // мащабираме, за да се събере
    const off=0.6+(9.8-s)/2;
    const B=[off,0.5], C=[off+s,0.5], A=[off+s*ax0, 0.5+s*ay0];
    g.clear();
    g.poly([A,B,C],'rgba(127,127,127,.08)',cssVar('--ink'),2.2);
    g.seg(C[0],C[1],Math.min(C[0]+1.5,11.7),C[1],cssVar('--cW'),2,[5,4]);   // продължение → външен ъгъл
    [['A',A,-4,-10],['B',B,-15,17],['C',C,8,17]].forEach(([n,p,dx,dy])=>{ g.dot(p[0],p[1],cssVar('--accent'),4.5); g.label(p[0],p[1],n,cssVar('--ink'),dx,dy,'bold 14px Georgia'); });
    g.label(B[0],B[1],fmt(be,0)+'°',cssVar('--plot-line'),20,-10);
    g.label(C[0],C[1],fmt(ga,0)+'°',cssVar('--plot-line2'),-40,-10);
    g.label(A[0],A[1],fmt(al,0)+'°',cssVar('--plot-line3'),-12,28);
    const sr=x=>Math.sin(x*Math.PI/180);
    const a=1, b=sr(be)/sr(al), c=sr(ga)/sr(al);       // относителни дължини
    const mx=Math.max(al,be,ga);
    const big= mx===al?'BC — срещу α': (mx===be?'AC — срещу β':'AB — срещу γ');
    out.innerHTML='α + β + γ = '+fmt(al,0)+'° + '+fmt(be,0)+'° + '+fmt(ga,0)+'° = <b>180°</b>'+
      ' &nbsp;·&nbsp; външен ъгъл при C (към пунктира) = 180° − γ = <b>'+fmt(180-ga,0)+'°</b> = α + β ✓'+
      '<br>Отношение на страните a : b : c = '+fmt(a,2)+' : '+fmt(b,2)+' : '+fmt(c,2)+' → най-голяма е <b>'+big+'</b>, т.е. срещу най-големия ъгъл.';
  }
  draw(); liveRedraws.push(draw);
}},

/* ---------- Средна отсечка и медицентър / трапец ---------- */
midseg:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,380), out=mkOut(root);
  const g=new Graph(cv,-1,11,-0.4,5.6);   // еднакъв мащаб по осите
  const MODE=sel(ctls,'Фигура',[['tri','триъгълник: средна отсечка и медицентър'],['trap','трапец: средна отсечка']],draw);
  const PX=ctl(ctls,'връх — хоризонтално',2,9,0.1,6,draw), PH=ctl(ctls,'височина',2.2,4.7,0.1,4.2,draw);
  const TA=ctl(ctls,'малка основа a (трапец)',2,6,0.1,4,draw);
  function draw(){
    g.clear();
    if(MODE()==='tri'){
      const B=[0.8,0.5], C=[10.2,0.5], A=[PX(),0.5+PH()];
      const M=[(A[0]+B[0])/2,(A[1]+B[1])/2], N=[(A[0]+C[0])/2,(A[1]+C[1])/2];
      const mBC=[(B[0]+C[0])/2,(B[1]+C[1])/2];
      const G_=[(A[0]+B[0]+C[0])/3,(A[1]+B[1]+C[1])/3];
      g.poly([A,B,C],null,cssVar('--ink'),2.2);
      g.seg(A[0],A[1],mBC[0],mBC[1],cssVar('--plot-line'),1.5);
      g.seg(B[0],B[1],N[0],N[1],cssVar('--plot-line'),1.5);
      g.seg(C[0],C[1],M[0],M[1],cssVar('--plot-line'),1.5);
      g.seg(M[0],M[1],N[0],N[1],cssVar('--plot-line2'),3.2);
      g.dot(G_[0],G_[1],cssVar('--cW'),5.5); g.label(G_[0],G_[1],'G',cssVar('--cW'),9,-6,'bold 14px Georgia');
      [['A',A],['B',B],['C',C],['M',M],['N',N]].forEach(([n,p])=>{ g.dot(p[0],p[1],cssVar('--accent'),4); g.label(p[0],p[1],n,cssVar('--ink'),7,-7,'bold 13px Georgia'); });
      const MN=Math.hypot(N[0]-M[0],N[1]-M[1]), BC=Math.hypot(C[0]-B[0],C[1]-B[1]);
      const AG=Math.hypot(G_[0]-A[0],G_[1]-A[1]), GM=Math.hypot(mBC[0]-G_[0],mBC[1]-G_[1]);
      out.innerHTML='Средна отсечка (оранжевата): MN = <b>'+fmt(MN,2)+'</b> = BC/2 = '+fmt(BC/2,2)+' ✓ и MN ∥ BC'+
        '<br>Медицентър G: AG : GM = '+fmt(AG,2)+' : '+fmt(GM,2)+' = <b>'+fmt(AG/GM,2)+' : 1</b> — точно 2 : 1 от върха.';
    } else {
      const a=TA(), b=9, h=3.6, x0=(11-b)/2;
      const D=[x0,0.6], C=[x0+b,0.6], Bt=[x0+(b-a)/2+a,0.6+h], At=[x0+(b-a)/2,0.6+h];
      const P=[(At[0]+D[0])/2,(At[1]+D[1])/2], Q=[(Bt[0]+C[0])/2,(Bt[1]+C[1])/2];
      g.poly([At,Bt,C,D],'rgba(127,127,127,.07)',cssVar('--ink'),2.2);
      g.seg(P[0],P[1],Q[0],Q[1],cssVar('--plot-line2'),3.2);
      [['P',P],['Q',Q]].forEach(([n,p])=>{ g.dot(p[0],p[1],cssVar('--accent'),4); });
      g.label((At[0]+Bt[0])/2,At[1],'a = '+fmt(a,1),cssVar('--ink'),-22,-8);
      g.label((D[0]+C[0])/2,D[1],'b = '+fmt(b,0),cssVar('--ink'),-20,22);
      g.label((P[0]+Q[0])/2,P[1],'m = '+fmt((a+b)/2,2),cssVar('--plot-line2'),-30,-8,'bold 13px system-ui');
      out.innerHTML='Средна отсечка на трапеца: m = (a + b)/2 = ('+fmt(a,1)+' + '+fmt(b,0)+')/2 = <b>'+fmt((a+b)/2,2)+'</b> — успоредна на двете основи и свързва средите на бедрата.';
    }
  }
  draw(); liveRedraws.push(draw);
}},

/* ---------- Комбинаторика: триъгълник на Паскал ---------- */
comb:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,340), out=mkOut(root);
  const N=ctl(ctls,'n',1,8,1,5,draw), K=ctl(ctls,'k',0,8,1,2,draw);
  const fact=n=>{let p=1;for(let i=2;i<=n;i++)p*=i;return p;};
  function draw(){
    const n=Math.round(N()); let k=Math.min(Math.round(K()),n);
    const c=cv.getContext('2d'); c.clearRect(0,0,760,340);
    c.textAlign='center';
    for(let row=0;row<=8;row++){
      for(let j=0;j<=row;j++){
        const x=380+(j-row/2)*66, y=30+row*37;
        const val=fact(row)/(fact(j)*fact(row-j));
        const hot=row===n&&j===k;
        if(hot){ c.fillStyle=cssVar('--accent'); c.beginPath(); c.arc(x,y-5,17,0,7); c.fill(); }
        c.fillStyle= hot? '#fff' : (row===n? cssVar('--plot-line2') : cssVar('--muted'));
        c.font= hot?'bold 14px system-ui':(row===n?'bold 13px system-ui':'12px system-ui');
        c.fillText(val,x,y);
      }
    }
    c.textAlign='left';
    const P=fact(n), V=fact(n)/fact(n-k), C_=V/fact(k);
    out.innerHTML='n = '+n+', k = '+k+': &nbsp; Pₙ = n! = <b>'+P+'</b> &nbsp;·&nbsp; Vₙᵏ = n!/(n−k)! = <b>'+V+'</b> &nbsp;·&nbsp; Cₙᵏ = n!/[k!(n−k)!] = <b>'+C_+'</b>'+
      '<br><span class="mnote">Осветеното число е Cₙᵏ = C('+n+','+k+') в ред n = '+n+' на триъгълника на Паскал. Проверка: Vₙᵏ = Cₙᵏ·k! = '+C_+' · '+fact(k)+' = '+V+'.</span>';
  }
  draw(); liveRedraws.push(draw);
}},

/* ---------- Вписана и описана окръжност ---------- */
incircle:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,480), out=mkOut(root);
  const g=new Graph(cv,-1.6,12.6,-2.1,6.87);   // еднакъв мащаб по осите → окръжностите докосват точно
  const PX=ctl(ctls,'връх A — хоризонтално',1.5,10,0.1,4,draw), PY=ctl(ctls,'връх A — височина',2,6.3,0.1,5,draw);
  function circle(cx,cy,rad,color,w,dash){ const c=g.c; c.strokeStyle=color; c.lineWidth=w||2; c.setLineDash(dash||[]);
    c.beginPath(); c.arc(g.X(cx),g.Y(cy),g.X(cx+rad)-g.X(cx),0,7); c.stroke(); c.setLineDash([]); }
  function draw(){
    const B=[1.2,0.4], C=[10.6,0.4], A=[PX(),PY()];
    const a=Math.hypot(C[0]-B[0],C[1]-B[1]), b=Math.hypot(A[0]-C[0],A[1]-C[1]), cS=Math.hypot(A[0]-B[0],A[1]-B[1]);
    const p=(a+b+cS)/2, S=Math.abs((B[0]-A[0])*(C[1]-A[1])-(C[0]-A[0])*(B[1]-A[1]))/2;
    const rI=S/p, R=a*b*cS/(4*S);
    const I=[(a*A[0]+b*B[0]+cS*C[0])/(a+b+cS), (a*A[1]+b*B[1]+cS*C[1])/(a+b+cS)];
    const d=2*(A[0]*(B[1]-C[1])+B[0]*(C[1]-A[1])+C[0]*(A[1]-B[1]));
    const ux=((A[0]**2+A[1]**2)*(B[1]-C[1])+(B[0]**2+B[1]**2)*(C[1]-A[1])+(C[0]**2+C[1]**2)*(A[1]-B[1]))/d;
    const uy=((A[0]**2+A[1]**2)*(C[0]-B[0])+(B[0]**2+B[1]**2)*(A[0]-C[0])+(C[0]**2+C[1]**2)*(B[0]-A[0]))/d;
    g.clear();
    circle(ux,uy,R,cssVar('--plot-line'),2,[7,5]);
    circle(I[0],I[1],rI,cssVar('--plot-line3'),2.4);
    g.poly([A,B,C],null,cssVar('--ink'),2.2);
    g.dot(I[0],I[1],cssVar('--plot-line3'),5); g.label(I[0],I[1],'I',cssVar('--plot-line3'),8,-6,'bold 13px Georgia');
    g.dot(ux,uy,cssVar('--plot-line'),5); g.label(ux,uy,'O',cssVar('--plot-line'),8,18,'bold 13px Georgia');
    [['A',A],['B',B],['C',C]].forEach(([n,pt])=>{ g.dot(pt[0],pt[1],cssVar('--accent'),4.5); g.label(pt[0],pt[1],n,cssVar('--ink'),7,-7,'bold 14px Georgia'); });
    const cosMax=Math.min((b*b+cS*cS-a*a)/(2*b*cS),(a*a+cS*cS-b*b)/(2*a*cS),(a*a+b*b-cS*cS)/(2*a*b));
    const kind= cosMax>0.02?'остроъгълен → O е вътрешна точка': (cosMax<-0.02?'тъпоъгълен → O е външна точка':'приблизително правоъгълен → O е около средата на хипотенузата');
    out.innerHTML='Вписана окръжност (плътна, център I — пресечница на ъглополовящите): r = S/p = <b>'+fmt(rI,2)+'</b>'+
      '<br>Описана окръжност (пунктирана, център O — пресечница на симетралите): R = abc/(4S) = <b>'+fmt(R,2)+'</b>'+
      '<br>Триъгълникът е <b>'+kind+'</b>.';
  }
  draw(); liveRedraws.push(draw);
}},

/* ---------- Еднаквости: симетрия, ротация, транслация ---------- */
transforms:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,430), out=mkOut(root);
  const g=new Graph(cv,-9,9,-5.1,5.1);   // еднакъв мащаб → ротациите не деформират
  const MODE=sel(ctls,'Преобразувание',[['axis','осева симетрия'],['rot','ротация около O(0;0)'],['cent','централна симетрия'],['trans','транслация']],draw);
  const P1=ctl(ctls,'параметър: ъгъл (°) / положение',-180,180,1,90,draw);
  const P2=ctl(ctls,'tᵧ (само за транслация)',-4,4,0.5,2,draw);
  const T=[[-5.5,0.5],[-2.5,0.5],[-4,3.2]];
  function draw(){
    const m=MODE(), p1=P1(), p2=P2();
    g.clear(); g.grid(1); g.axes(2);
    g.poly(T,'rgba(43,108,176,.28)',cssVar('--plot-line'),2);
    let img,msg;
    if(m==='axis'){ const x0=p1/30;
      g.seg(x0,-5.1,x0,5.1,cssVar('--cW'),2,[7,5]); g.label(x0,4.4,'g',cssVar('--cW'),8,0,'bold 14px Georgia');
      img=T.map(([x,y])=>[2*x0-x,y]);
      msg='Осева симетрия с ос g: x = '+fmt(x0,1)+'. Образът е огледален — <b>ориентацията се сменя</b> (отражение).';
    } else if(m==='rot'){ const al=p1*Math.PI/180;
      g.dot(0,0,cssVar('--cW'),5); g.label(0,0,'O',cssVar('--cW'),8,18,'bold 13px Georgia');
      img=T.map(([x,y])=>[x*Math.cos(al)-y*Math.sin(al), x*Math.sin(al)+y*Math.cos(al)]);
      msg='Ротация около O на ъгъл '+fmt(p1,0)+'°. Дължини и ъгли се запазват, <b>ориентацията също</b> (движение).';
    } else if(m==='cent'){ const x0=p1/45;
      g.dot(x0,0,cssVar('--cW'),5); g.label(x0,0,'O',cssVar('--cW'),8,18,'bold 13px Georgia');
      img=T.map(([x,y])=>[2*x0-x,-y]);
      T.forEach(([x,y],i)=>{ if(i===0) g.seg(x,y,2*x0-x,-y,cssVar('--muted'),1.2,[4,4]); });
      msg='Централна симетрия с център O('+fmt(x0,1)+'; 0) — ротация на 180°: <b>O е среда на всяка отсечка XX′</b>.';
    } else { const tx=p1/30, ty=p2;
      img=T.map(([x,y])=>[x+tx,y+ty]);
      g.seg(T[2][0],T[2][1],T[2][0]+tx,T[2][1]+ty,cssVar('--cW'),2.4);
      g.label(T[2][0]+tx/2,T[2][1]+ty/2,'t',cssVar('--cW'),6,-8,'bold 14px Georgia');
      msg='Транслация с вектор t = ('+fmt(tx,1)+'; '+fmt(ty,1)+') — <b>всички точки се преместват еднакво</b>; правите отиват в успоредни прави.';
    }
    g.poly(img,'rgba(192,86,33,.28)',cssVar('--plot-line2'),2);
    out.innerHTML=msg+'<br><span class="mnote">Синият триъгълник е оригиналът, оранжевият — образът. Всяка еднаквост запазва разстоянията.</span>';
  }
  draw(); liveRedraws.push(draw);
}},

/* ---------- Единична полуокръжност [0°;180°] ---------- */
semicircle:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,300), out=mkOut(root);
  const AL=ctl(ctls,'ъгъл α (°)',0,180,1,120,draw);
  function draw(){
    const al=AL(), x=al*Math.PI/180;
    const c=cv.getContext('2d'); c.clearRect(0,0,760,300);
    const cx=380, cy=245, R=185;
    c.strokeStyle=cssVar('--muted'); c.lineWidth=1.4;
    c.beginPath(); c.arc(cx,cy,R,Math.PI,2*Math.PI); c.stroke();
    c.beginPath(); c.moveTo(cx-R-34,cy); c.lineTo(cx+R+34,cy); c.moveTo(cx,cy+6); c.lineTo(cx,cy-R-22); c.stroke();
    c.font='11.5px system-ui'; c.fillStyle=cssVar('--muted');
    c.fillText('−1',cx-R-8,cy+16); c.fillText('1',cx+R-2,cy+16); c.fillText('O',cx+6,cy+16); c.fillText('II квадрант',cx-R+18,44); c.fillText('I квадрант',cx+R-84,44);
    const px=cx+R*Math.cos(x), py=cy-R*Math.sin(x);
    const qx=cx-R*Math.cos(x);
    c.fillStyle=cssVar('--muted'); c.globalAlpha=.45; c.beginPath(); c.arc(qx,py,5,0,7); c.fill(); c.globalAlpha=1;
    c.strokeStyle=cssVar('--accent'); c.lineWidth=2.2; c.beginPath(); c.moveTo(cx,cy); c.lineTo(px,py); c.stroke();
    c.setLineDash([5,4]);
    c.strokeStyle=cssVar('--plot-line2'); c.beginPath(); c.moveTo(px,py); c.lineTo(px,cy); c.stroke();
    c.strokeStyle=cssVar('--plot-line3'); c.beginPath(); c.moveTo(px,py); c.lineTo(cx,py); c.stroke();
    c.setLineDash([]);
    c.fillStyle=cssVar('--cW'); c.beginPath(); c.arc(px,py,6,0,7); c.fill();
    c.fillStyle=cssVar('--plot-line2'); c.font='12.5px system-ui'; c.fillText('sin α',px+9,(py+cy)/2);
    c.fillStyle=cssVar('--plot-line3'); c.fillText('cos α',(px+cx)/2-18,py-9);
    const quad= al<90?'I квадрант: sin α > 0, cos α > 0': (al>90?'II квадрант: sin α > 0, cos α < 0':'α = 90°: cos = 0, tg не е дефиниран');
    const tg=Math.abs(Math.cos(x))<1e-3?'не е дефиниран':fmt(Math.tan(x),3);
    out.innerHTML='α = <b>'+fmt(al,0)+'°</b> → sin α = <b>'+fmt(Math.sin(x),3)+'</b>, cos α = <b>'+fmt(Math.cos(x),3)+'</b>, tg α = <b>'+tg+'</b> &nbsp;·&nbsp; '+quad+
      '<br><span class="mnote">Бледата точка отговаря на 180° − α = '+fmt(180-al,0)+'°: sin(180° − α) = sin α = '+fmt(Math.sin(x),3)+', а cos(180° − α) = −cos α = '+fmt(-Math.cos(x),3)+'.</span>';
  }
  draw(); liveRedraws.push(draw);
}},

/* ---------- Решаване на произволен триъгълник ---------- */
soltriangle:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,460), out=mkOut(root);
  const g=new Graph(cv,-0.5,11.5,-0.8,6.46);   // еднакъв мащаб по осите
  const Bb=ctl(ctls,'страна b = AC',2,5.5,0.1,4,draw), Cc=ctl(ctls,'страна c = AB',2,5.5,0.1,5,draw), AA=ctl(ctls,'ъгъл A (°)',20,150,1,60,draw);
  function draw(){
    const b=Bb(), cS=Cc(), Adeg=AA(), Ar=Adeg*Math.PI/180;
    const a=Math.sqrt(b*b+cS*cS-2*b*cS*Math.cos(Ar));
    const cosB=(a*a+cS*cS-b*b)/(2*a*cS);
    const Bdeg=Math.acos(Math.max(-1,Math.min(1,cosB)))*180/Math.PI, Cdeg=180-Adeg-Bdeg;
    const S=b*cS*Math.sin(Ar)/2, p=(a+b+cS)/2, R=a/(2*Math.sin(Ar)), rI=S/p;
    const A=[4.5,0.8], B=[4.5+cS,0.8], C=[4.5+b*Math.cos(Ar),0.8+b*Math.sin(Ar)];
    g.clear();
    g.poly([A,B,C],'rgba(127,127,127,.07)',cssVar('--ink'),2.4);
    [['A',A,-6,20],['B',B,8,20],['C',C,4,-10]].forEach(([n,pt,dx,dy])=>{ g.dot(pt[0],pt[1],cssVar('--accent'),4.5); g.label(pt[0],pt[1],n,cssVar('--ink'),dx,dy,'bold 14px Georgia'); });
    g.label((A[0]+B[0])/2,A[1],'c = '+fmt(cS,1),cssVar('--plot-line'),-18,24);
    g.label((A[0]+C[0])/2,(A[1]+C[1])/2,'b = '+fmt(b,1),cssVar('--plot-line3'),-56,0);
    g.label((B[0]+C[0])/2,(B[1]+C[1])/2,'a = '+fmt(a,2),cssVar('--plot-line2'),12,0);
    g.label(A[0],A[1],fmt(Adeg,0)+'°',cssVar('--cW'),20,-8);
    out.innerHTML='Косинусова теорема: a = √(b² + c² − 2bc·cos A) = <b>'+fmt(a,3)+'</b> &nbsp;·&nbsp; ъгли: A = '+fmt(Adeg,0)+'°, B = <b>'+fmt(Bdeg,1)+'°</b>, C = <b>'+fmt(Cdeg,1)+'°</b>'+
      '<br>S = ½·b·c·sin A = <b>'+fmt(S,2)+'</b> &nbsp;·&nbsp; R = a/(2 sin A) = <b>'+fmt(R,2)+'</b> &nbsp;·&nbsp; r = S/p = <b>'+fmt(rI,2)+'</b>'+
      '<br><span class="mnote">Проверка със синусовата теорема: a/sin A = '+fmt(a/Math.sin(Ar),2)+', b/sin B = '+fmt(b/Math.sin(Bdeg*Math.PI/180),2)+', c/sin C = '+fmt(cS/Math.sin(Cdeg*Math.PI/180),2)+' — и трите равни на 2R = '+fmt(2*R,2)+'. ✓</span>';
  }
  draw(); liveRedraws.push(draw);
}},

/* ---------- Показателна и логаритмична функция ---------- */
explog:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,430), out=mkOut(root);
  const g=new Graph(cv,-6,6,-4.1,4.1);
  const A=ctl(ctls,'основа a',0.2,4,0.05,2,draw);
  function draw(){
    let a=A(); if(Math.abs(a-1)<0.03) a=1.05;
    g.clear(); g.grid(1); g.axes(2);
    g.fn(x=>x,cssVar('--muted'),1.3);
    g.fn(x=>Math.pow(a,x),cssVar('--plot-line'),2.6);
    g.fn(x=> x>1e-6? Math.log(x)/Math.log(a) : NaN, cssVar('--plot-line2'),2.6);
    g.dot(0,1,cssVar('--plot-line'),5); g.label(0,1,'(0; 1)',cssVar('--plot-line'),10,-8);
    g.dot(1,0,cssVar('--plot-line2'),5); g.label(1,0,'(1; 0)',cssVar('--plot-line2'),10,18);
    g.label(4.6,3.5,'y = aˣ',cssVar('--plot-line'),0,0,'bold 13px system-ui');
    g.label(4.6,3.0,'y = logₐ x',cssVar('--plot-line2'),0,0,'bold 13px system-ui');
    g.label(4.6,2.5,'y = x',cssVar('--muted'),0,0,'12px system-ui');
    out.innerHTML='a = <b>'+fmt(a,2)+'</b> → двете функции са <b>'+(a>1?'растящи':'намаляващи')+'</b> ('+(a>1?'a > 1':'0 < a < 1')+').'+
      '<br><span class="mnote">Графиките са симетрични спрямо правата y = x — логаритмичната функция е обратна на показателната. D(aˣ) = ℝ, E(aˣ) = (0; +∞); D(logₐx) = (0; +∞), E(logₐx) = ℝ. И двете минават през отбелязаните точки (0; 1) и (1; 0).</span>';
  }
  draw(); liveRedraws.push(draw);
}},

/* ---------- Равнинни фигури ---------- */
planefigs:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,400), out=mkOut(root);
  const g=new Graph(cv,-1,12,-0.5,6.34);   // еднакъв мащаб по осите
  const FIG=sel(ctls,'Фигура',[['par','успоредник'],['romb','ромб'],['trap','трапец'],['ngon','правилен n-ъгълник']],draw);
  const P1=ctl(ctls,'страна a',2,5.5,0.1,4.5,draw), P2=ctl(ctls,'b / височина h',2,4.5,0.1,3,draw), AL=ctl(ctls,'ъгъл α (°)',25,90,1,60,draw), NN=ctl(ctls,'n (за многоъгълник)',3,10,1,6,draw);
  function draw(){
    const f=FIG(), a=P1(), b=P2(), alD=AL(), al=alD*Math.PI/180, n=Math.round(NN());
    g.clear(); let txt='';
    if(f==='par'||f==='romb'){
      const bb= f==='romb'? a : b;
      const A=[1,0.7], B=[1+a,0.7], C=[1+a+bb*Math.cos(al),0.7+bb*Math.sin(al)], D=[1+bb*Math.cos(al),0.7+bb*Math.sin(al)];
      g.poly([A,B,C,D],'rgba(43,108,176,.12)',cssVar('--ink'),2.2);
      g.seg(A[0],A[1],C[0],C[1],cssVar('--plot-line2'),1.6,[6,4]);
      g.seg(B[0],B[1],D[0],D[1],cssVar('--plot-line3'),1.6,[6,4]);
      g.label((A[0]+B[0])/2,A[1],'a = '+fmt(a,1),cssVar('--ink'),-18,22);
      g.label(A[0],A[1],fmt(alD,0)+'°',cssVar('--cW'),24,-8);
      if(f==='par'){
        txt='Успоредник: S = a·b·sin α = '+fmt(a,1)+' · '+fmt(bb,1)+' · sin '+fmt(alD,0)+'° = <b>'+fmt(a*bb*Math.sin(al),2)+'</b>. Диагоналите (пунктираните) взаимно се разполовяват.';
      } else {
        const d1=Math.hypot(C[0]-A[0],C[1]-A[1]), d2=Math.hypot(D[0]-B[0],D[1]-B[1]);
        txt='Ромб: S = a²·sin α = <b>'+fmt(a*a*Math.sin(al),2)+'</b> = d₁·d₂/2 = '+fmt(d1,2)+' · '+fmt(d2,2)+' / 2 = '+fmt(d1*d2/2,2)+' ✓ — диагоналите са перпендикулярни и се разполовяват.';
      }
    } else if(f==='trap'){
      const aa=a, bb=a+3.5, h=Math.min(b,4.5), x0=(11-bb)/2;
      const D=[x0,0.7], C=[x0+bb,0.7], Bt=[x0+(bb-aa)/2+aa,0.7+h], At=[x0+(bb-aa)/2,0.7+h];
      g.poly([At,Bt,C,D],'rgba(43,108,176,.12)',cssVar('--ink'),2.2);
      g.seg(At[0],At[1],At[0],0.7,cssVar('--plot-line3'),1.6,[5,4]);
      g.label(At[0],(At[1]+0.7)/2,'h = '+fmt(h,1),cssVar('--plot-line3'),-52,4);
      g.label((At[0]+Bt[0])/2,At[1],'a = '+fmt(aa,1),cssVar('--ink'),-20,-8);
      g.label((D[0]+C[0])/2,D[1],'b = '+fmt(bb,1),cssVar('--ink'),-20,22);
      txt='Трапец: S = (a + b)·h/2 = ('+fmt(aa,1)+' + '+fmt(bb,1)+') · '+fmt(h,1)+' / 2 = <b>'+fmt((aa+bb)*h/2,2)+'</b>; средна отсечка m = (a + b)/2 = '+fmt((aa+bb)/2,2)+'.';
    } else {
      const Rdisp=2.7, cx=5.5, cy=3.1;
      const pts=[...Array(n)].map((_,i)=>{ const t=Math.PI/2+2*Math.PI*i/n; return [cx+Rdisp*Math.cos(t),cy+Rdisp*Math.sin(t)]; });
      g.poly(pts,'rgba(43,108,176,.12)',cssVar('--ink'),2.2);
      g.dot(cx,cy,cssVar('--cW'),4);
      const mid=[(pts[0][0]+pts[1][0])/2,(pts[0][1]+pts[1][1])/2];
      g.seg(cx,cy,mid[0],mid[1],cssVar('--plot-line3'),1.8,[5,4]);
      g.label((cx+mid[0])/2,(cy+mid[1])/2,'r',cssVar('--plot-line3'),6,-4,'bold 13px Georgia');
      const ap=a/(2*Math.tan(Math.PI/n)), S=n*a*ap/2;
      txt='Правилен '+n+'-ъгълник със страна a = '+fmt(a,1)+': централен ъгъл 360°/n = <b>'+fmt(360/n,1)+'°</b>, вътрешен ъгъл (n−2)·180°/n = <b>'+fmt((n-2)*180/n,1)+'°</b>, апотема r = '+fmt(ap,2)+' → S = P·r/2 = <b>'+fmt(S,2)+'</b>.';
    }
    out.innerHTML=txt;
  }
  draw(); liveRedraws.push(draw);
}},

/* ---------- Графики на тригонометричните функции ---------- */
triggraphs:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,360), out=mkOut(root);
  const g=new Graph(cv,-6.8,6.8,-3.1,3.1);
  const F=sel(ctls,'Функция',[['sin','y = sin x'],['cos','y = cos x'],['tg','y = tg x'],['cotg','y = cotg x']],draw);
  function draw(){
    const f=F();
    g.clear(); g.grid(1);
    const c=g.c; c.strokeStyle=cssVar('--muted'); c.lineWidth=1.4; c.beginPath();
    c.moveTo(0,g.Y(0)); c.lineTo(g.w,g.Y(0)); c.moveTo(g.X(0),0); c.lineTo(g.X(0),g.h); c.stroke();
    c.fillStyle=cssVar('--muted'); c.font='11.5px system-ui'; c.textAlign='center';
    [[-2*Math.PI,'−2π'],[-3*Math.PI/2,'−3π/2'],[-Math.PI,'−π'],[-Math.PI/2,'−π/2'],[Math.PI/2,'π/2'],[Math.PI,'π'],[3*Math.PI/2,'3π/2'],[2*Math.PI,'2π']].forEach(([v,t])=>{
      c.fillText(t,g.X(v),g.Y(0)+16); c.beginPath(); c.moveTo(g.X(v),g.Y(0)-3); c.lineTo(g.X(v),g.Y(0)+3); c.stroke(); });
    c.fillText('1',g.X(0)-10,g.Y(1)+4); c.fillText('−1',g.X(0)-12,g.Y(-1)+4);
    c.textAlign='left';
    let fn, zeros=[], asym=[], props='';
    if(f==='sin'){ fn=Math.sin; for(let k=-2;k<=2;k++)zeros.push(k*Math.PI);
      props='D = ℝ, E = [−1; 1], период 2π · нули: x = kπ · максимум 1 при x = π/2 + 2kπ · минимум −1 при x = 3π/2 + 2kπ · нечетна функция.'; }
    if(f==='cos'){ fn=Math.cos; for(let k=-2;k<=1;k++)zeros.push(Math.PI/2+k*Math.PI);
      props='D = ℝ, E = [−1; 1], период 2π · нули: x = π/2 + kπ · максимум 1 при x = 2kπ · минимум −1 при x = π + 2kπ · четна функция.'; }
    if(f==='tg'){ fn=Math.tan; for(let k=-2;k<=2;k++)zeros.push(k*Math.PI); for(let k=-2;k<=1;k++)asym.push(Math.PI/2+k*Math.PI);
      props='D = ℝ \\ {π/2 + kπ}, E = ℝ, период π · нули: x = kπ · вертикални асимптоти: x = π/2 + kπ · нечетна функция.'; }
    if(f==='cotg'){ fn=x=>1/Math.tan(x); for(let k=-2;k<=1;k++)zeros.push(Math.PI/2+k*Math.PI); for(let k=-2;k<=2;k++)asym.push(k*Math.PI);
      props='D = ℝ \\ {kπ}, E = ℝ, период π · нули: x = π/2 + kπ · вертикални асимптоти: x = kπ · нечетна функция.'; }
    asym.forEach(x=> g.seg(x,-3.1,x,3.1,cssVar('--cW'),1.4,[6,5]));
    g.fn(fn,cssVar('--plot-line'),2.6);
    zeros.forEach(x=> g.dot(x,0,cssVar('--plot-line2'),4.5));
    out.innerHTML=props+'<br><span class="mnote">Оранжевите точки са нулите на функцията; червените пунктирани прави — вертикалните асимптоти.</span>';
  }
  draw(); liveRedraws.push(draw);
}},

/* ---------- Схема на Бернули ---------- */
bernoulli:{ build(root){
  const ctls=el('div','ctls'); root.append(ctls);
  const cv=mkCanvas(root,760,320), out=mkOut(root);
  const N=ctl(ctls,'n (брой опити)',1,12,1,8,draw), P=ctl(ctls,'p (вероятност за успех)',0.05,0.95,0.05,0.5,draw), K=ctl(ctls,'избрано k',0,12,1,3,draw);
  const fact=n=>{let s=1;for(let i=2;i<=n;i++)s*=i;return s;};
  function draw(){
    const n=Math.round(N()), p=P(); let k=Math.min(Math.round(K()),n);
    const c=cv.getContext('2d'); c.clearRect(0,0,760,320);
    const probs=[...Array(n+1)].map((_,i)=> fact(n)/(fact(i)*fact(n-i))*Math.pow(p,i)*Math.pow(1-p,n-i));
    const pmax=Math.max(...probs), x0=40, y0=272, gw=690, gh=220;
    c.strokeStyle=cssVar('--muted'); c.beginPath(); c.moveTo(x0,y0); c.lineTo(x0+gw,y0); c.stroke();
    c.font='11px system-ui'; c.textAlign='center';
    probs.forEach((pr,i)=>{
      const bw=gw/(n+1)-10, bx=x0+i*(gw/(n+1))+5, bh=Math.max(1.5,gh*pr/pmax);
      c.fillStyle= i===k? cssVar('--plot-line2') : cssVar('--plot-line');
      c.globalAlpha= i===k?1:.68; c.fillRect(bx,y0-bh,bw,bh); c.globalAlpha=1;
      c.fillStyle=cssVar('--ink'); c.fillText(fmt(pr,3),bx+bw/2,y0-bh-5);
      c.fillStyle=cssVar('--muted'); c.fillText('k = '+i,bx+bw/2,y0+15);
    });
    c.textAlign='left';
    const C_=fact(n)/(fact(k)*fact(n-k));
    out.innerHTML='P(X = '+k+') = C('+n+'; '+k+') · p<sup>'+k+'</sup> · (1−p)<sup>'+(n-k)+'</sup> = '+C_+' · '+fmt(Math.pow(p,k),4)+' · '+fmt(Math.pow(1-p,n-k),4)+' = <b>'+fmt(probs[k],4)+'</b>'+
      '<br><span class="mnote">Стълбчетата образуват разпределението на броя успехи X; сумата им е точно 1.</span>';
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
