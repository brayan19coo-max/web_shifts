import asyncio, base64, json
from playwright.async_api import async_playwright
D='/tmp/sw'
looks=json.load(open(D+'/looks.json'))
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    for look,setup in looks.items():
      pg=await b.new_page(viewport={'width':400,'height':480},device_scale_factor=2.5)
      await pg.route('**/three.min.js',lambda r:r.fulfill(body=open(D+'/libs3d/three.min.js','rb').read(),content_type='application/javascript'))
      await pg.route('**/OrbitControls.js',lambda r:r.fulfill(body=open(D+'/libs3d/OrbitControls.js','rb').read(),content_type='application/javascript'))
      await pg.add_init_script('Date.prototype.getHours = function(){ return 12; };')
      await pg.goto('file://'+D+'/studio/studio.html')
      for _ in range(60):
        if await pg.evaluate('!!(window.__swg && window.__step)'): break
        await pg.wait_for_timeout(500)
      await pg.evaluate("""() => { const S = window.__swg; for (let i = 0; i < 30; i++) { S.calm(); window.__step(1 / 30); } S.studio();
        const cam = S.camera; cam.fov = 34; cam.position.set(0.9, 1.6, 6.6); cam.lookAt(0, 1.45, 0); cam.updateProjectionMatrix();
        window.__studioLook = cam.position.clone(); }""")
      if setup: await pg.evaluate(setup)
      data=await pg.evaluate("""() => { const S = window.__swg; for (let i = 0; i < 40; i++) { S.calm(); S.root.position.set(0,0,0); window.__step(1/30); } return S.renderer.domElement.toDataURL('image/png'); }""")
      open(f'{D}/still-{look}.png','wb').write(base64.b64decode(data.split(',')[1]))
      print(look,flush=True); await pg.close()
    await b.close()
asyncio.run(main())
