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
s = s.replace('<head>', '<head>' + pre, 1)
a = "renderer = new THREE.WebGLRenderer({canvas, antialias:true,"
assert a in s
s = s.replace(a, "renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, preserveDrawingBuffer:true,", 1)
end = "requestAnimationFrame(tick);\n})();"
i = s.rindex(end)
hook = """window.__swg = {
  play, sleep, wake, setExpr, root, scene, camera, renderer, controls, head,
  calm(){ hunger = 0.1; sleepy = 0.05; anger = 0; mad = false; idleT = 999; ignoredT = 0; walkTarget = null; yaw = 0; },
  setMad(v){ mad = v; anger = v ? 1 : 0; },
  get act(){ return act; }, get sleeping(){ return sleeping; },
  studio(){
    renderer.setClearColor(0x000000, 0);
    controls.enabled = false; controls.update = () => {};
    const render = renderer.render.bind(renderer);
    renderer.render = (sc, cam) => {
      sc.children.forEach(c => { if(c !== root) c.visible = false; });
      cam.children.forEach(c => { c.visible = false; });
      sc.background = null; sc.fog = null;
      render(sc, cam);
    };
  },
};
"""
s = s[:i] + hook + s[i:]
a2 = "  if(lookAt && !sleeping && !mad){"
assert a2 in s
s = s.replace(a2, "  if(window.__studioLook !== undefined) lookAt = window.__studioLook;\n" + a2, 1)
css = "<style>html,body{background:transparent!important}body>*:not(#stage){display:none!important}#stage{cursor:default}</style>"
s = s.replace('</body>', css + '</body>') if '</body>' in s else s + css
open(out, 'w', encoding='utf8').write(s)
print('ok', len(s))
