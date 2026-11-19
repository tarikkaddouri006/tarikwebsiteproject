// Desk: the ventures as one family of objects. Click selects, double-click opens (tap, then tap again on touch).
(() => {
  const nav = document.querySelector('nav.desk');
  if (!nav) return;
  const icons = [...nav.querySelectorAll('.obj')];
  const coarse = matchMedia('(pointer:coarse)').matches;
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  let sel = null;

  // ---------- interaction ----------
  function select(a) {
    if (sel && sel !== a) sel.classList.remove('sel');
    sel = a || null;
    if (sel) sel.classList.add('sel');
    icons.forEach(i => i.setAttribute('aria-current', i === sel ? 'true' : 'false'));
  }
  function launch(a) {
    a.classList.remove('pulse'); void a.offsetWidth; a.classList.add('pulse');
    nav.classList.remove('teach');
  }
  let dragged = false;
  // one click or tap opens: the object turns, then its window comes out of it
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('.obj');
    if (!a) { if (sel && !e.target.closest('.win')) select(null); return; }
    if (dragged) { dragged = false; e.preventDefault(); e.stopImmediatePropagation(); return; }
    if (a._go) return; // the real open, let it through
    e.preventDefault(); e.stopImmediatePropagation();
    if (a._wait) return;
    select(a); launch(a);
    a.dispatchEvent(new CustomEvent('deskspin'));
    a._wait = setTimeout(() => { a._wait = null; a._go = true; window.DESK_FROM = { el: a, id: +a.dataset.o }; a.click(); a._go = false; }, reduce ? 0 : 260);
  }, true);
  nav.addEventListener('focusin', e => { const a = e.target.closest('.obj'); if (a && a.matches(':focus-visible')) select(a); });
  nav.addEventListener('keydown', e => {
    const i = icons.indexOf(document.activeElement);
    if (i < 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); icons[(i + 1) % icons.length].focus(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); icons[(i - 1 + icons.length) % icons.length].focus(); }
    if (e.key === 'Escape') { select(null); document.activeElement.blur(); }
  });

  // ---------- objects ----------
  const glc = document.createElement('canvas');
  const gl = glc.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true });
  if (!gl) { nav.classList.add('flat'); return; }

  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FS = `precision highp float;
uniform vec2 R;uniform float ID,YAW,HOV,SEL,T;uniform vec2 TL;uniform vec2 PL[32];
#define G -.72
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float box(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float rbox(vec3 p,vec3 b,float r){return box(p,b-r)-r;}
float tor(vec3 p,vec2 t){return length(vec2(length(p.xy)-t.x,p.z))-t.y;}
float cyl(vec3 p,float r,float h){vec2 d=abs(vec2(length(p.xy),p.z))-vec2(r,h);return min(max(d.x,d.y),0.)+length(max(d,0.));}
float oct(vec3 p,vec3 s){p=abs(p/s);return (p.x+p.y+p.z-1.)*.57735*min(s.x,min(s.y,s.z));}
vec2 U(vec2 a,vec2 b){return a.x<b.x?a:b;}
// materials: 1 aluminum  2 dark chrome  3 obsidian  4 pearl resin  5 brushed titanium  6 smoked glass  7 blue-black glass  8 matte black
float hash(vec3 p){p=fract(p*.3183+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return .5*noise(p)+.25*noise(p*2.03)+.125*noise(p*4.01)+.0625*noise(p*8.02);}
float bez(vec2 pos,vec2 A,vec2 B,vec2 C){vec2 a=B-A,b=A-2.*B+C,c=a*2.,d=A-pos;
  float kk=1./dot(b,b),kx=kk*dot(a,b),ky=kk*(2.*dot(a,a)+dot(d,b))/3.,kz=kk*dot(d,a),res;
  float p=ky-kx*kx,p3=p*p*p,q=kx*(2.*kx*kx-3.*ky)+kz,h=q*q+4.*p3;
  if(h>=0.){h=sqrt(h);vec2 x=(vec2(h,-h)-q)/2.;vec2 uv=sign(x)*pow(abs(x),vec2(1./3.));float t=clamp(uv.x+uv.y-kx,0.,1.);res=dot(d+(c+b*t)*t,d+(c+b*t)*t);}
  else{float z=sqrt(-p),v=acos(q/(p*z*2.))/3.,m=cos(v),n=sin(v)*1.732050808;vec3 t=clamp(vec3(m+m,-n-m,n-m)*z-kx,0.,1.);
    res=min(dot(d+(c+b*t.x)*t.x,d+(c+b*t.x)*t.x),dot(d+(c+b*t.y)*t.y,d+(c+b*t.y)*t.y));}
  return sqrt(res);}
float cap(vec3 p,vec3 a,vec3 b,float ra,float rb){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-mix(ra,rb,h);}
float ell(vec3 p,vec3 r){float k0=length(p/r),k1=length(p/(r*r));return k0*(k0-1.)/k1;}
vec3 EP;
vec2 obj(vec3 p){
  if(ID<.5){ // KADDOURI: the world inside the signature's loop, above the line
    float bar=rbox(p-vec3(0.,G+.03,0.),vec3(.6,.03,.12),.02);
    vec3 q=p-vec3(0.,G+.6,0.);
    float earth=length(q)-.36;
    EP=q;EP.xz*=rot(T*.35);
    vec3 o=q;o.xy*=rot(.12);o.yz*=rot(1.18);
    float ang=atan(o.z,o.x);
    vec2 e=vec2(o.x,o.z*1.55);
    float ring=(length(e)-.7)*.66;
    float th=mix(.008,.03,smoothstep(-2.6,1.4,ang));
    float loop=length(vec2(ring,o.y))-th;
    float gap=abs(ang+.55)-.32;          // the loop is open where the pen started
    loop=max(loop,-gap*.3);
    return U(U(vec2(earth,9.),vec2(bar,1.)),vec2(loop,1.));
  }
  if(ID<1.5){ // GLOURI: the House, travertine floors swept around a glass core, lattice crown
    vec3 q=p-vec3(0.,G,0.);
    float d=1e3;
    for(int i=0;i<4;i++){
      float fi=float(i);
      float th=fi==0.?.25:fi==1.?1.35:fi==2.?2.45:.75;
      float L=.82-fi*.08,W=.44-fi*.04;
      vec2 s=q.xz*rot(th);
      float y=.12+fi*.165+.03*s.x+.1*(s.x/L)*(s.x/L);
      float Rr=(L*L+W*W)/(2.*W);
      float lens=max(length(s-vec2(0.,Rr-W)),length(s+vec2(0.,Rr-W)))-Rr;
      float dy=abs(q.y-y)-.032;
      d=min(d,(length(max(vec2(lens,dy),0.))+min(max(lens,dy),0.)-.02)*.85);
    }
    float core=max(length(q.xz)-.4+.08*q.y,abs(q.y-.36)-.34);
    float arch=max(abs(q.y-.04)-.1,-(length(q.xz)-.25));
    vec3 s=q-vec3(0.,.9,0.);
    float k=24.;float sph=abs(length(s)-.17)-.01;float lat=(abs(dot(sin(s*k),cos(s.zxy*k)))-.55)/k;
    float crown=max(sph,lat*.8);
    float nest=tor((q-vec3(0.,.75,0.)).xzy,vec2(.17,.035));
    return U(U(vec2(min(d,nest),4.),vec2(core,12.)),vec2(crown,10.));
  }
  if(ID<2.5){ // STOURI: the symbol, two blades
    vec3 q=p-vec3(0.,G+.62,0.);
    float d2=1e3;
    for(int k=0;k<2;k++){
      float dd=1e3,sg=1.;
      for(int i=0;i<16;i++){
        vec2 vi=PL[k*16+i],vj=PL[k*16+(i==0?15:i-1)];
        vec2 e=vj-vi,w=q.xy-vi,b=w-e*clamp(dot(w,e)/dot(e,e),0.,1.);
        dd=min(dd,dot(b,b));
        bvec3 c=bvec3(q.y>=vi.y,q.y<vj.y,e.x*w.y>e.y*w.x);
        if(all(c)||all(not(c)))sg=-sg;
      }
      d2=min(d2,sg*sqrt(dd));
    }
    float thk=.025+clamp(-d2,0.,.1)*.7;
    vec2 e=vec2(d2,abs(q.z)-thk);
    float S=(length(max(e,0.))+min(max(e.x,e.y),0.))*.8;
    return vec2(S,13.);
  }
  if(ID<3.5){ // NOURI: the slingback, sheer upper, lattice hourglass heel
    float S=1.35;vec3 q=(p-vec3(-.03,G,0.))/S;q.x=-q.x;
    float x=q.x;
    float lo=.45*pow(clamp((x+.2)/.56,0.,1.),1.6);
    float h=.015+.09*smoothstep(-.54,-.3,x)-.03*smoothstep(-.26,0.,x)+.11*smoothstep(.18,.38,x);
    float up=lo+h;
    float w=mix(.0,.1,smoothstep(-.56,-.3,x))-.025*smoothstep(-.1,.38,x);
    float f=max(max(lo-q.y,q.y-up),max(-.55-x,x-.39))*.55;
    vec2 e=vec2(f,abs(q.z)-w);
    float body=length(max(e,0.))+min(max(e.x,e.y),0.);
    float shell=abs(body*.8)-.007;
    float opening=max((up-.012)-q.y,-(x+.22));
    shell=max(shell,-opening);
    float sole=max(abs(q.y-lo-.008)-.01,max(abs(q.z)-w,max(-.55-x,x-.39)))*.6;
    // slingback strap
    vec3 st=q-vec3(.25,.54,0.);st.xy*=rot(-.5);
    float strap=length(vec2((length(vec2(st.x,st.z*1.6))-.13)*.6,st.y))-.011;
    strap=max(strap,-(st.x+.04));
    // hourglass lattice heel
    vec3 hq=q-vec3(.345,0.,0.);float t=clamp(q.y/.46,0.,1.);
    float r=.026+.055*pow(abs(t-.5)*2.,2.);
    float hs=max(abs(length(hq.xz)-r)-.008,max(-q.y,q.y-.46));
    float an=atan(hq.z,hq.x);
    float holes=sin(an*6.+t*20.)*sin(an*6.-t*20.)-.2;
    hs=max(hs,holes*.02*step(.08,t)*step(t,.92));
    float pad=max(length(hq.xz)-r-.004,abs(q.y-.012)-.012);
    float m=(q.y>up-.022)?4.:11.;
    vec2 res=U(vec2(shell*S,m),vec2(sole*S,4.));
    res=U(res,vec2(strap*S,4.));res=U(res,vec2(min(hs,pad)*S,4.));
    return res;
  }
  if(ID<4.5){ // EXPLOURI: the compass star in orbit
    vec3 q=p-vec3(0.,G+.7,0.);
    float s=min(oct(q,vec3(.15,.7,.1)),oct(q,vec3(.48,.15,.1)));
    vec3 r=q;r.xy*=rot(.7854);s=min(s,min(oct(r,vec3(.08,.32,.07)),oct(r,vec3(.32,.08,.07))));
    vec3 o=q;o.yz*=rot(1.25);o.xy*=rot(.3);
    float orb=tor(o,vec2(.66,.018));
    return U(vec2(s,1.),vec2(orb,2.));
  }
  if(ID<5.5){ // OURI: the Super 8
    vec3 q=p-vec3(0.,G,0.);
    float body=rbox(q-vec3(.05,.6,0.),vec3(.42,.2,.15),.05);
    float grip=rbox(q-vec3(.18,.24,0.),vec3(.075,.24,.1),.045);
    vec3 g=q-vec3(.18,.24,0.);
    float lens=cyl((q-vec3(-.48,.6,0.)).yzx,.13,.12);
    float ring=cyl((q-vec3(-.46,.6,0.)).yzx,.15,.03);
    float glass=cyl((q-vec3(-.6,.6,0.)).yzx,.1,.005);
    float vf=cap(q,vec3(.3,.86,0.),vec3(.6,.86,0.),.05,.06);
    float door=rbox(q-vec3(.05,.6,.15),vec3(.26,.13,.012),.02);
    vec2 r=U(U(vec2(body,8.),vec2(grip,8.)),vec2(min(lens,vf),5.));
    r=U(r,vec2(ring,1.));r=U(r,vec2(glass,3.));r=U(r,vec2(door,5.));
    return r;
  }
  // CONTACT: the sealed black envelope
  vec3 q=p-vec3(0.,G+.42,0.);q.yz*=rot(-.16);
  float env=rbox(q,vec3(.62,.42,.045),.02);
  float tri=max(q.y-.4,(.4-q.y)-(.6-abs(q.x))*.68)*.8;
  float fl=max(tri,abs(q.z-.058)-.012);
  float seal=cyl(q-vec3(0.,-.02,.07),.095,.018);
  return U(U(vec2(env,8.),vec2(fl,3.)),vec2(seal,1.));
}
vec2 map(vec3 p){p.xz*=rot(YAW+TL.x);p.yz*=rot(TL.y*.3);return obj(p);}
vec3 nrm(vec3 p){vec2 e=vec2(.0012,0.);return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x,map(p+e.yxy).x-map(p-e.yxy).x,map(p+e.yyx).x-map(p-e.yyx).x));}
vec3 env(vec3 d,float r){
  float w=.03+r*.4;
  float c=.006+.02*smoothstep(-.1,.9,d.y);
  c+=3.0*smoothstep(.55-w,.75,d.y)*smoothstep(.75+w,.5,abs(d.x+.15)+.0)*.6;           // overhead softbox
  c+=2.4*smoothstep(w,0.,abs(d.x+.7))*smoothstep(-.05,.3,d.y)*smoothstep(.85,.5,d.y);  // key strip, left
  c+=1.2*smoothstep(w*1.4,0.,abs(d.x-.8))*smoothstep(-.2,.15,d.y)*smoothstep(.7,.3,d.y);// rim strip, right
  c+=.5*smoothstep(.015+r*.2,0.,abs(d.y+.02));                                          // horizon
  return vec3(c);
}
float ao(vec3 p,vec3 n){float o=0.,s=1.;for(int i=1;i<5;i++){float h=.035*float(i);o+=(h-map(p+n*h).x)*s;s*=.6;}return clamp(1.-2.8*o,0.,1.);}
float soft(vec3 o,vec3 d){float r=1.,t=.02;for(int i=0;i<18;i++){float h=map(o+d*t).x;r=min(r,9.*h/t);t+=clamp(h,.03,.25);if(r<.01||t>3.)break;}return clamp(r,0.,1.);}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;
  vec3 ro=vec3(0.,.62,3.3),ta=vec3(0.,-.08,0.);
  vec3 ww=normalize(ta-ro),uu=normalize(cross(ww,vec3(0.,1.,0.))),vv=cross(uu,ww);
  vec3 rd=normalize(uv.x*uu+uv.y*vv+1.95*ww);
  vec3 L=normalize(vec3(-.45,1.,.4));
  float t=0.,m=-1.;
  for(int i=0;i<96;i++){vec2 h=map(ro+rd*t);if(h.x<.0008){m=h.y;break;}t+=h.x;if(t>7.)break;}
  float tg=(G-ro.y)/rd.y;
  if(m<0.||(tg>0.&&tg<t)){ // the shared floor: shadow only
    if(tg<0.){gl_FragColor=vec4(0.);return;}
    vec3 g=ro+rd*tg;
    float sh=soft(g+vec3(0.,.002,0.),L);
    float cnt=smoothstep(0.,.28,map(g).x);
    float a=max((1.-sh)*.75,(1.-cnt)*.8)*smoothstep(1.2,.45,length(g.xz));
    gl_FragColor=vec4(0.,0.,0.,a*.7);return;
  }
  vec3 p=ro+rd*t,n=nrm(p),v=-rd,r=reflect(rd,n);
  float f=.04+.96*pow(1.-max(dot(n,v),0.),5.);
  float dl=max(dot(n,L),0.),am=.5+.5*n.y,o=ao(p,n),sh=mix(.35,1.,soft(p+n*.01,L));
  float sp=pow(max(dot(r,L),0.),90.)*sh;
  map(p);
  vec3 c;float a=1.;
  if(m<1.5)      c=env(r,.06)*vec3(.92,.93,.95)*mix(.8,1.,f)+.015+sp*1.4;                  // polished aluminum
  else if(m<2.5) c=env(r,.02)*vec3(.42,.43,.45)*mix(.75,1.2,f)+sp*1.2;                      // dark chrome
  else if(m<3.5) c=vec3(.008)*(dl*sh+am*.3)+env(r,0.)*(.05+.95*f)+sp*1.5;                   // obsidian
  else if(m<4.5){c=vec3(.84,.81,.76)*(dl*sh*.8+am*.35)+env(r,.05)*(.04+f*.9)+sp;            // pearl resin
                 c+=vec3(.03,.02,.04)*pow(1.-max(dot(n,v),0.),2.);}
  else if(m<5.5){float br=.85+.15*sin(p.y*420.+sin(p.x*9.));
                 c=env(r,.38)*vec3(.62,.6,.57)*br*.9+vec3(.05)*dl*sh+sp*.25;}               // brushed titanium
  else if(m<6.5){c=env(r,0.)*(.12+f)+env(r,.25)*.18+vec3(.02,.021,.025)+sp*1.5;a=clamp(.24+.85*f+sp,0.,1.);}// smoked glass
  else if(m<7.5){c=vec3(.01,.02,.07)*(dl*sh+am*.4)+vec3(.02,.05,.17)*smoothstep(.0,-.5,dot(n,L))*.3
                 +env(r,0.)*vec3(.82,.86,1.)*(.05+.95*f)+sp*1.5;}                            // blue-black glass
  else if(m>12.5){c=vec3(.02,.015,.04)*(dl*sh+am*.3)+env(r,.02)*vec3(.8,.72,1.)*mix(.5,1.1,f)+vec3(.12,.07,.25)*pow(1.-max(dot(n,v),0.),2.)+sp*1.2;}
  else if(m>11.5){c=vec3(.95,.92,.85)*(.35+.25*dl)+env(r,0.)*f*.6;}
  else if(m>10.5){c=vec3(.95,.92,.86)*(dl*sh*.7+am*.45)+env(r,.05)*f*.8+sp*.6;a=clamp(.78+.4*f,0.,1.);}
  else if(m>9.5){c=vec3(.95,.9,.8)*(.55+.45*dl)+vec3(.35,.3,.22)+env(r,.1)*f*.4;}
  else if(m<8.5) c=vec3(.03)*(dl*sh+am*.5)+env(r,.55)*(.03+.22*f);                          // matte black
  else{ // earth: pearl continents on blue-black glass
    vec3 e=normalize(EP);float land=smoothstep(.52,.56,fbm(e*2.6+3.));
    vec3 sea=vec3(.01,.02,.07)*(dl*sh+am*.4)+env(r,0.)*vec3(.82,.86,1.)*(.05+.95*f)+sp*1.3;
    vec3 gnd=vec3(.8,.78,.74)*(dl*sh*.85+am*.3)+env(r,.4)*f*.4;
    c=mix(sea,gnd,land);}
  c*=mix(1.,o,.85);
  c*=1.+.1*SEL+.05*HOV;
  c=c/(1.+c*.5);
  c=pow(c,vec3(.4545));
  gl_FragColor=vec4(c*a,a);
}`;
  function sh(t, s) { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o); return o; }
  let pr;
  try { pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr); }
  catch (err) { console.warn(err); nav.classList.add('flat'); return; }
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const pa = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(pa); gl.vertexAttribPointer(pa, 2, gl.FLOAT, false, 0, 0);
  const u = {}; ['R', 'ID', 'YAW', 'HOV', 'SEL', 'TL', 'T'].forEach(k => u[k] = gl.getUniformLocation(pr, k));
  gl.uniform2fv(gl.getUniformLocation(pr, 'PL[0]'), new Float32Array([-0.5609,0.0969,-0.3592,0.1795,-0.1523,0.2575,0.0578,0.3316,0.2694,0.4028,0.4805,0.4718,0.6893,0.5394,0.5387,0.4454,0.4014,0.3472,0.2853,0.2450,0.1985,0.1391,0.1489,0.0296,0.0090,0.0363,-0.1344,0.0474,-0.2789,0.0618,-0.4218,0.0787,0.1489,0.0296,0.2602,0.0239,0.3623,0.0039,0.4608,-0.0299,0.5611,-0.0766,0.6689,-0.1356,0.4523,-0.2300,0.2314,-0.2968,0.0065,-0.3486,-0.2222,-0.3980,-0.4542,-0.4574,-0.6893,-0.5394,-0.3977,-0.4266,-0.1775,-0.3310,-0.0193,-0.2349,0.0863,-0.1207]));

  // every object shares one camera and one light; each turns to its best three-quarter view
  const BASE = [0.5, -0.55, -0.2, 0.75, -0.35, -0.6, 0.45];
  const KEY = {}; icons.forEach(a => { if (a.dataset.world) KEY[a.dataset.world] = +a.dataset.o; });

  function make(c, id, a) {
    return { a, c, x: c.getContext('2d'), id, base: BASE[id], yaw: BASE[id] - (reduce || !a ? 0 : 2.2), hov: 0, ht: 0, tx: 0, ty: 0, tlx: 0, tly: 0, dirty: true };
  }
  const st = icons.map(a => {
    const s = make(a.querySelector('canvas'), +a.dataset.o, a);
    if (!coarse) {
      a.addEventListener('pointerenter', () => { s.ht = 1; });
      a.addEventListener('pointerleave', () => { s.ht = 0; s.tx = s.ty = 0; });
      a.addEventListener('pointermove', e => { const b = s.c.getBoundingClientRect(); s.tx = ((e.clientX - b.left) / b.width - .5) * .7; s.ty = ((e.clientY - b.top) / b.height - .5) * .5; });
    }
    a.addEventListener('deskspin', () => { s.spinT = performance.now(); });
    return s;
  });
  // the object travels with its window: a small live copy in the window's top bar
  const mirrors = [...document.querySelectorAll('.win canvas.wobj')].map(c => {
    const w = c.closest('.win'); const s = make(c, 0, null); s.win = w; return s;
  });

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  function fit(s) { const css = s.c.getBoundingClientRect().width; if (!css) return false; const px = Math.round(css * dpr); if (s.c.width !== px) { s.c.width = s.c.height = px; } return true; }
  function size() { st.forEach(s => { fit(s); s.dirty = true; }); }
  size(); addEventListener('resize', size);

  function draw(s) {
    const px = s.c.width, rs = Math.min(Math.round(px * 1.35), 200);
    if (glc.width !== rs) { glc.width = glc.height = rs; gl.viewport(0, 0, rs, rs); }
    gl.uniform2f(u.R, rs, rs); gl.uniform1f(u.ID, s.id); gl.uniform1f(u.YAW, s.yaw + (s.off || 0));
    gl.uniform1f(u.HOV, s.hov); gl.uniform1f(u.SEL, s.a && s.a.classList.contains('sel') ? 1 : 0); gl.uniform2f(u.TL, s.tlx, s.tly); gl.uniform1f(u.T, performance.now() / 1000);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
    s.x.clearRect(0, 0, px, px); s.x.drawImage(glc, 0, 0, px, px);
  }

  let last = performance.now(), frame = 0; const t0 = last;
  function tick(now) {
    const dt = Math.min((now - last) / 1000, .05); last = now;
    const k = 1 - Math.exp(-dt * 6); frame++;
    st.forEach((s, i) => {
      let moved = false;
      if (now - t0 > (reduce ? 0 : 500 + i * 110)) {
        const on = s.a.classList.contains('sel');
        if (on !== s._sel) { s._sel = on; moved = true; }
        const nh = s.hov + (s.ht - s.hov) * k;
        if (Math.abs(nh - s.hov) > 1e-4) { s.hov = nh; moved = true; }
        if (!reduce) { s.ph = (s.ph ?? i * 1.3) + dt * (.45 + .7 * s.hov + (on ? .3 : 0)); const ty = s.base + .6 * Math.sin(s.ph); s.yaw += (ty - s.yaw) * Math.min(1, dt * 4); moved = true; }
        const nx = s.tlx + (s.tx - s.tlx) * k, ny2 = s.tly + (s.ty - s.tly) * k;
        if (Math.abs(nx - s.tlx) + Math.abs(ny2 - s.tly) > 1e-4) { s.tlx = nx; s.tly = ny2; moved = true; }
      }
      if (s.spinT) { const q = Math.min(1, (now - s.spinT) / 760); s.off = 2 * Math.PI * (1 - Math.pow(1 - q, 3)); moved = true; if (q >= 1) { s.spinT = 0; s.off = 0; } }
      if ((moved || s.dirty) && (s.dirty || (frame + i) % 3 === 0)) { draw(s); s.dirty = false; }
    });
    mirrors.forEach(s => {
      if (s.win.hidden || !s.win.classList.contains('open')) { s.live = false; return; }
      const id = s.win.id === 'win-about' ? 0 : (KEY[s.win.dataset.key] ?? 0);
      if (id !== s.id || !s.live) { s.id = id; s.yaw = BASE[id]; s.live = true; fit(s); }
      if (!reduce) s.yaw += dt * .35;
      if (frame % 3 === 1) draw(s);
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  nav.classList.add('lit');
})();
