"""Arma la copia "estudio" de la calle 3D para grabar las animaciones de los
mini juegos (fondo transparente, reloj controlado, giro de Swaggy fijo).
Uso: python3 game_studio.py <swaggy3d.html> <salida.html>"""
import sys

src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf8').read()
pre = """<script>
(function(){
  // ESTUDIO: reloj y cuadros controlados a mano
  let now = 0; const q = [];
  performance.now = () => now;
  window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  window.__step = (dt) => { now += dt * 1000; const cbs = q.splice(0); cbs.forEach((cb) => cb(now)); };
})();
</script>"""
s = s.replace('<head>', '<head>' + pre, 1) if '<head>' in s else pre + s


def rep(a, b):
    global s
    assert s.count(a) == 1, a[:70]
    s = s.replace(a, b)


rep("renderer = new THREE.WebGLRenderer({canvas, antialias:true,", "renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, preserveDrawingBuffer:true,")
# giro de Swaggy fijo (para las vistas de lado)
rep("  root.rotation.y = yaw;\n", "  root.rotation.y = window.__yawLock != null ? window.__yawLock : yaw;\n")
rep("  if(lookAt && !sleeping && !mad){", "  if(window.__studioLook !== undefined) lookAt = window.__studioLook;\n  if(lookAt && !sleeping && !mad){")
end = "requestAnimationFrame(tick);\n})();"
i = s.rindex(end)
hook = """window.__swg = {
  play, sleep, wake, jump, place, IT, root, scene, camera, renderer, controls, vel,
  calm(){ hunger = 0.1; sleepy = 0.05; anger = 0; mad = false; idleT = 999; ignoredT = 0; walkTarget = null; runFlag = false; zoomN = 0; act = null; cartJob = null; mirrorJob = null; arcadeJob = null; sprayJob = null; },
  setMad(v){ mad = v; anger = v ? 1 : 0; },
  go(x, z, run){ walkTarget = new THREE.Vector3(x, 0, z); runFlag = !!run; },
  get act(){ return act; }, get y(){ return root.position.y; }, get phase(){ return walkPhase; }, get vy(){ return vel.y; },
  studio(){
    renderer.setClearColor(0x000000, 0);
    controls.enabled = false; controls.update = () => {};
    camera.clearViewOffset();
    const render = renderer.render.bind(renderer);
    renderer.render = (sc, cam) => {
      sc.children.forEach(c => { if(c !== root && !(window.__keepVis && window.__keepVis.has(c))) c.visible = false; });
      cam.children.forEach(c => { c.visible = false; });
      sc.background = null; sc.fog = null;
      render(sc, cam);
    };
  },
};
"""
s = s[:i] + hook + s[i:]
css = "<style>html,body{background:transparent!important}body>*:not(#stage){display:none!important}</style>"
s = s.replace('</body>', css + '</body>') if '</body>' in s else s + css
open(out, 'w', encoding='utf8').write(s)
print('ok', len(s))
