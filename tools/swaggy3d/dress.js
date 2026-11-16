// Ropa para Swaggy en el estudio: camiseta (tronco + mangas) con estampado
window.__dress = function(o){
  const S = window.__swg;
  (window.__clothes || []).forEach(m => m.parent && m.parent.remove(m));
  window.__clothes = [];
  if (o.cap) place('gorra', 'head');
  if (o.phones) place('audifonos', 'head');
  if (!o.shirt) return;
  const sh = o.shirt;
  // textura: color base + estampado al frente y atrás
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512;
  const c = cv.getContext('2d');
  c.fillStyle = sh.base; c.fillRect(0, 0, 1024, 512);
  if (sh.pattern === 'pijama') {
    c.fillStyle = sh.accent;
    for (let y = 20; y < 512; y += 56) for (let x = (y/56)%2 ? 28 : 0; x < 1024; x += 56) { c.beginPath(); c.arc(x, y, 9, 0, Math.PI*2); c.fill(); }
  }
  const front = (txt, x, y, size, color, font) => { c.save(); c.translate(x, y); c.scale(1, -1); c.font = font || `900 ${size}px Impact, Arial Black, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = color; c.lineWidth = size*0.12; c.strokeStyle = sh.ink || 'rgba(0,0,0,0.6)'; if (sh.stroke) c.strokeText(txt, 0, 0); c.fillText(txt, 0, 0); c.restore(); };
  // u: 0.5 = frente, 0 / 1 = espalda. v: 0 abajo, 1 arriba (el canvas va volteado)
  if (sh.text) front(sh.text, 512, 512*0.64, sh.size || 130, sh.accent);
  if (sh.sub) front(sh.sub, 512, 512*0.45, 44, sh.accent2 || sh.accent);
  if (sh.back) { front(sh.back, 1024*0.02, 512*0.6, 80, sh.accent); front(sh.back, 1024*0.98, 512*0.6, 80, sh.accent); }
  const tex = new THREE.CanvasTexture(cv); tex.flipY = false;
  const mat = toonMat({color: new THREE.Color('#ffffff'), map: tex});
  const shell = (geo, off, keep) => {
    const P = geo.attributes.position.array, N = geo.attributes.normal.array, n = P.length/3;
    for (let i = 0; i < n; i++){ P[i*3] += N[i*3]*off; P[i*3+1] += N[i*3+1]*off; P[i*3+2] += N[i*3+2]*off; }
    // quitar triángulos fuera de la zona
    const I = geo.index.array, out = [];
    for (let t = 0; t < I.length; t += 3){ const a = I[t], b = I[t+1], d = I[t+2]; if (keep(P[a*3], P[a*3+1], P[a*3+2]) && keep(P[b*3], P[b*3+1], P[b*3+2]) && keep(P[d*3], P[d*3+1], P[d*3+2])) out.push(a, b, d); }
    geo.setIndex(out);
    const U = new Float32Array(n*2);
    for (let i = 0; i < n; i++){ U[i*2] = Math.atan2(P[i*3], P[i*3+2])/(Math.PI*2) + 0.5; U[i*2+1] = (P[i*3+1] - 0.95)/0.85; }
    geo.setAttribute('uv', new THREE.BufferAttribute(U, 2));
    return geo;
  };
  const addMesh = (geo, parent) => {
    const m = new THREE.Mesh(geo, mat); parent.add(m);
    outlineNormals(geo); const ol = new THREE.Mesh(geo, outMatA); ol.userData.isOutline = true; m.add(ol);
    window.__clothes.push(m);
  };
  const neck = sh.neck || 1.74;
  addMesh(shell(swgGeo('torso'), 0.03, (x, y, z) => y > 0.9 && y < neck - (z > 0.1 ? 0.04 : 0)), body);
  // mangas: parte de arriba del brazo
  const SW = SWG_META._pv;
  [['brazoI', 0, -1], ['brazoD', 1, 1]].forEach(([k, i, sg]) => {
    const pv = SW[k], ep = SW[k + '_elbow'];
    const g = swgGeo(k), A = g.attributes.position.array;
    const armShift = y => 0.02 + 0.12*sstep(1.15, 1.78, y);
    for (let j = 0; j < A.length; j += 3){ A[j] -= armShift(A[j+1])*sg; A[j] -= pv[0]; A[j+1] -= pv[1]; A[j+2] -= pv[2]; }
    g.computeVertexNormals();
    const ey = ep[1] - pv[1];
    const cut = ey + (sh.long ? -0.42 : 0.03);
    const sg2 = shell(g, 0.055, (x, y) => y > cut);
    addMesh(sg2, arms[i]);
    // la manga se dobla con el codo igual que el brazo (misma piel), así no se parte
    const P0 = sg2.attributes.position.array.slice(), n = P0.length/3, W = new Float32Array(n);
    for (let v = 0; v < n; v++) W[v] = sstep(ey + 0.16, ey - 0.16, P0[v*3+1]);
    const mesh = window.__clothes[window.__clothes.length - 1];
    const e = elbows[i], qi = new THREE.Quaternion(), qq = new THREE.Quaternion(), M = new THREE.Matrix4(), T = new THREE.Matrix4(), tv = new THREE.Vector3();
    let key = '';
    mesh.onBeforeRender = () => {
      const k = e.quaternion.x.toFixed(4) + e.quaternion.y.toFixed(4) + e.quaternion.z.toFixed(4) + e.quaternion.w.toFixed(4);
      if (k === key) return; key = k;
      const P = sg2.attributes.position.array, L = 40, MS = [], back = new THREE.Matrix4().makeTranslation(-e.position.x, -e.position.y, -e.position.z);
      for (let l = 0; l <= L; l++){ qq.copy(qi).slerp(e.quaternion, l/L); MS[l] = new THREE.Matrix4().makeTranslation(e.position.x, e.position.y, e.position.z).multiply(T.makeRotationFromQuaternion(qq)).multiply(back); }
      for (let v = 0; v < n; v++){
        const o = v*3, l = Math.round(W[v]*L);
        if (l === 0){ P[o] = P0[o]; P[o+1] = P0[o+1]; P[o+2] = P0[o+2]; continue; }
        tv.set(P0[o], P0[o+1], P0[o+2]).applyMatrix4(MS[l]); P[o] = tv.x; P[o+1] = tv.y; P[o+2] = tv.z;
      }
      sg2.attributes.position.needsUpdate = true; sg2.computeVertexNormals(); sg2.computeBoundingSphere();
    };
  });
};

const __LOOKS = {'base':{},'clyde-roja':{shirt:{base:'#141414',accent:'#e0303a',text:"SHIFT'S",sub:'Every Bullet Country',accent2:'#ffffff'}},'clyde-azul':{shirt:{base:'#f2f2f2',accent:'#2f5fe0',text:"SHIFT'S",sub:'Every Bullet Country',accent2:'#2a2a2a'}},'bonnie':{shirt:{base:'#141414',accent:'#ff6ccf',text:'BONNIE',sub:'the danger of men',accent2:'#ffffff'}},'saint':{shirt:{base:'#141414',accent:'#ffffff',text:'Saint Mode',size:110,sub:'Blessed in the streets',accent2:'#e0303a'}},'xcops':{cap:true, shirt:{base:'#141414',accent:'#9b4dff',text:'X-COPS',sub:'DIVISION',accent2:'#ff5cbe'}},'pijama':{shirt:{base:'#2b3a67',accent:'#ffd36b',pattern:'pijama',long:true}}};
