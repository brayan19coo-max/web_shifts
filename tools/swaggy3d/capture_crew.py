"""Graba al guardia y al perro de "Esquiva al guardia" desde la calle 3D.
Uso: python3 capture_crew.py <studio.html o URL> <carpeta_frames>
(studio.html lo arma game_studio.py). Después: build_game_sheets.py.
Los modelos están en swaggy3d.html (busca "Guardia y perro"); sus poses
son guardPose(nombre, t) y dogPose(nombre, t)."""
import asyncio, base64, json, os, sys
from playwright.async_api import async_playwright

STUDIO, OUT = sys.argv[1], sys.argv[2]
EVEN = lambda n, dt: [i * dt for i in range(n)]
# nombre de la tira, quién, pose, tiempos (s)
PLAN = [
    ('guardia_espalda', 'g', 'espalda', EVEN(12, 2 / 12)),
    ('guardia_sospecha', 'g', 'sospecha', [0.0, 0.06, 0.12, 0.18, 0.25, 0.3, 0.35, 0.4]),
    ('guardia_voltea', 'g', 'voltea', EVEN(6, 0.42 / 5)),
    ('guardia_mira', 'g', 'mira', EVEN(8, 1.33 / 8)),
    ('guardia_grita', 'g', 'grita', EVEN(8, (1 / 1.5) / 8)),
    ('perro_duerme', 'd', 'duerme', EVEN(12, 2 / 12)),
    ('perro_alerta', 'd', 'alerta', [0.0, 0.08, 0.16, 0.24, 0.32, 0.45]),
    ('perro_ladra', 'd', 'ladra', EVEN(8, (1 / 3) / 4)),
]


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width': 600, 'height': 760}, device_scale_factor=1)
        await pg.route('**/fonts.g*/**', lambda r: r.abort())
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        url = STUDIO if STUDIO.startswith('http') else 'file://' + os.path.abspath(STUDIO)
        await pg.goto(url)
        for _ in range(120):
            await pg.wait_for_timeout(500)
            if await pg.evaluate('!!(window.__swg && window.__step && window.__crew)'):
                break
        await pg.evaluate("""() => { const S = window.__swg, C = window.__crew;
          for (let i = 0; i < 10; i++) { S.calm(); window.__step(1/30); }
          C.setTimeMode(0); window.__step(1/30);
          S.studio(); window.__keepVis = new Set([C.group]); C.group.visible = true; S.root.visible = false; }""")
        os.makedirs(OUT, exist_ok=True)
        for name, who, pose, times in PLAN:
            frames = await pg.evaluate("""({who, pose, times}) => { const S = window.__swg, C = window.__crew, cam = S.camera;
              C.G.g.visible = who === 'g'; C.D.g.visible = who === 'd';
              const g = who === 'g' ? C.G.g : C.D.g; g.position.set(who === 'd' ? 0.35 : 0, 0, 0);
              cam.fov = 32; cam.zoom = 1;
              if (who === 'g') { cam.position.set(0, 1.4, 7.5); cam.lookAt(0, 1.1, 0); }
              else { cam.position.set(0, 0.95, 5.2); cam.lookAt(0, 0.42, 0); }
              cam.updateProjectionMatrix();
              return times.map(t => { (who === 'g' ? C.guardPose : C.dogPose)(pose, t); S.renderer.render(S.scene, cam); return S.renderer.domElement.toDataURL('image/png'); });
            }""", {'who': who, 'pose': pose, 'times': times})
            d = os.path.join(OUT, name)
            os.makedirs(d, exist_ok=True)
            for i, f in enumerate(frames):
                open(os.path.join(d, f'{i:03d}.png'), 'wb').write(base64.b64decode(f.split(',')[1]))
            json.dump({'view': 'guardia' if who == 'g' else 'perro'}, open(os.path.join(d, 'info.json'), 'w'))
            print(name, len(frames), flush=True)
        print('errores', errs[:5])
        await b.close()

asyncio.run(main())
