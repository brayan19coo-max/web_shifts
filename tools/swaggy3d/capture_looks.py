import asyncio, base64, os, sys, json
from playwright.async_api import async_playwright
D='/tmp/sw'
FPS=12
PLAN=json.loads(sys.argv[1]) if len(sys.argv)>1 else [{"name":"quieto","act":None,"dur":3.0}]
SETUP=sys.argv[2] if len(sys.argv)>2 else ''
OUT=sys.argv[3] if len(sys.argv)>3 else D+'/frames'
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':400,'height':480},device_scale_factor=1)
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.route('**/three.min.js',lambda r:r.fulfill(body=open(D+'/libs3d/three.min.js','rb').read(),content_type='application/javascript'))
    await pg.route('**/OrbitControls.js',lambda r:r.fulfill(body=open(D+'/libs3d/OrbitControls.js','rb').read(),content_type='application/javascript'))
    await pg.add_init_script('Date.prototype.getHours = function(){ return 12; };')
    await pg.goto('file://'+D+'/studio/studio.html')
    for _ in range(60):
      if await pg.evaluate('!!(window.__swg && window.__step)'): break
      await pg.wait_for_timeout(500)
    await pg.evaluate("""() => {
      const S = window.__swg;
      for (let i = 0; i < 30; i++) { S.calm(); window.__step(1 / 30); }
      S.studio();
      const cam = S.camera;
      cam.fov = 34; cam.position.set(0.9, 1.6, 6.6); cam.lookAt(0, 1.45, 0); cam.updateProjectionMatrix();
      window.__studioLook = cam.position.clone();
      window.__keep = (mad) => { S.calm(); if (mad) S.setMad(true); S.root.position.x = 0; S.root.position.z = 0; };
    }""")
    if SETUP: await pg.evaluate(SETUP)
    for step in PLAN:
      frames=await pg.evaluate("""({step, FPS}) => {
        const S = window.__swg; const dt = 1 / FPS;
        if (S.sleeping) S.wake(true);
        for (let i = 0; i < 24; i++) { window.__keep(false); window.__step(1 / 30); }
        if (step.sleep) S.sleep();
        if (step.mad) S.setMad(true);
        if (step.act) S.play(step.act, 0, { silent: true });
        for (let t = 0; t < (step.skip || 0); t += 1 / 30) { window.__keep(step.mad); window.__step(1 / 30); }
        const out = []; const n = Math.round(step.dur * FPS);
        for (let i = 0; i < n; i++) {
          window.__keep(step.mad);
          window.__step(dt / 2); window.__keep(step.mad); window.__step(dt / 2);
          if (window.__beforeShot) window.__beforeShot();
          out.push(S.renderer.domElement.toDataURL('image/png'));
          if (window.__afterShot) window.__afterShot();
        }
        if (step.mad) S.setMad(false);
        return out;
      }""",{'step':step,'FPS':FPS})
      d=f"{OUT}/{step['name']}";os.makedirs(d,exist_ok=True)
      for i,f in enumerate(frames): open(f"{d}/{i:03d}.png",'wb').write(base64.b64decode(f.split(',')[1]))
      print(step['name'],len(frames),flush=True)
    print('errores',errs[:5]); await b.close()
asyncio.run(main())
