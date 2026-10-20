"""Graba las animaciones de Swaggy para los mini juegos desde la calle 3D.
Uso: python3 capture_games.py <studio.html> <carpeta_frames>
(studio.html lo arma game_studio.py; la carpeta 'assets/vendor/three' debe
estar junto a studio.html). Después: build_game_sheets.py."""
import asyncio, base64, json, math, os, sys
from playwright.async_api import async_playwright

STUDIO, OUT = sys.argv[1], sys.argv[2]
FRONT, SIDE, Q34, BACK = 0.0, math.pi / 2, 0.9, math.pi - 0.75
TAU = math.pi * 2

# nombre, vista (grupo de encuadre), giro, preparación (JS), avance antes de grabar (s), cuadros [(t relativo)]
EVEN = lambda n, dt, t0=0: [t0 + i * dt for i in range(n)]
PLAN = [
    ('quieto', 'front', FRONT, '', 0.3, EVEN(24, 1 / 12)),
    ('triste', 'front', FRONT, "S.play('sad', 0, {silent:true})", 0.8, EVEN(12, 1 / 12)),
    ('golpe', 'front', FRONT, "S.play('bonk', 0, {silent:true})", 0.15, EVEN(8, 1 / 12)),
    ('celebrar', 'front', FRONT, "S.play('tantrum', 0, {silent:true})", 0.2, EVEN(10, 1 / 12)),
    ('atrapar', 'front', FRONT, "S.play('highFive', 1, {silent:true})", 0.45, EVEN(1, 0.1)),
    ('nervioso', 'front', FRONT, "S.play('scared', 0, {silent:true})", 0.5, EVEN(8, 1 / 12)),
    ('disimular', 'front', FRONT, "S.play('sing', 0, {silent:true})", 0.35, EVEN(16, 1 / 12)),
    ('bailar', 'front', FRONT, "S.play('dance', 0, {silent:true})", 1.0, 'beat4'),
    ('caminar', 'front', FRONT, 'walk', 0.8, 'phase4'),
    ('pintar', 'front', BACK, "S.place('spray','hand'); S.play('spray', 0, {silent:true})", 0.6, EVEN(12, 1 / 12)),
    ('aletear', 'side', Q34, "S.play('tantrum', 0, {silent:true})", 0.25, [0, 0.105]),
    ('planear', 'side', Q34, "S.play('startle', 0, {silent:true})", 0.35, EVEN(4, 1 / 12)),
    ('correr', 'side', SIDE, 'run', 1.4, 'phase4'),
    ('saltar', 'side', SIDE, 'jump', 0.12, EVEN(1, 0.1)),
    ('caer', 'side', SIDE, 'jump', 0.62, EVEN(1, 0.1)),
    ('recoger', 'side', SIDE, "S.play('scared', 0, {silent:true})", 0.5, EVEN(1, 0.1)),
    ('golpe_lado', 'side', SIDE, "S.play('bonk', 0, {silent:true})", 0.15, EVEN(8, 1 / 12)),
]

CAM = {'front': (0, 1.3, 8.6), 'side': (0, 1.3, 8.6)}


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width': 600, 'height': 760}, device_scale_factor=1)
        await pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://' + os.path.abspath(STUDIO))
        for _ in range(120):
            await pg.wait_for_timeout(500)
            if await pg.evaluate('!!(window.__swg && window.__step)'):
                break
        await pg.evaluate("""() => { const S = window.__swg; window.S = S;
          for (let i = 0; i < 30; i++) { S.calm(); window.__step(1/30); }
          S.studio(); }""")
        os.makedirs(OUT, exist_ok=True)
        for name, view, yaw, setup, skip, times in PLAN:
            cx, cy, cz = CAM[view]
            frames = await pg.evaluate("""async ({name, view, yaw, setup, skip, times, cam}) => {
              const S = window.S, step = window.__step;
              const keep = () => { S.root.position.x = 0; S.root.position.z = 0; };
              // calma
              S.place('spray', 'hidden');
              for (let i = 0; i < 40; i++) { S.calm(); keep(); step(1/30); }
              window.__yawLock = yaw;
              const c = S.camera; c.fov = 32; c.position.set(cam[0], cam[1] + 0.35, cam[2]); c.lookAt(0, cam[1], 0); c.updateProjectionMatrix();
              window.__studioLook = c.position.clone();
              const tickKeep = () => {
                if (setup === 'run') S.go(30, 0, true);
                if (setup === 'walk') S.go(0, 0.9, false);
                keep();
              };
              if (setup === 'jump') S.jump();
              else if (setup && setup !== 'run' && setup !== 'walk') eval(setup);
              let t = 0;
              const adv = (dt) => { const n = Math.max(1, Math.round(dt / (1/60))); for (let i = 0; i < n; i++) { tickKeep(); step(dt/n); } t += dt; };
              adv(skip);
              let ts = times;
              if (times === 'phase4' || times === 'beat4') {
                // 4 cuadros repartidos en un ciclo
                const out = [];
                if (times === 'beat4') { for (let k = 0; k < 4; k++) { if (k) adv(0.785/4); out.push(S.renderer.domElement.toDataURL('image/png')); } return out; }
                const p0 = S.phase; let k = 0;
                while (k < 4) {
                  adv(1/120);
                  if (S.phase - p0 >= k * Math.PI / 2) { out.push(S.renderer.domElement.toDataURL('image/png')); k++; }
                }
                return out;
              }
              const out = [];
              let prev = 0;
              for (const tt of ts) { if (tt > prev) adv(tt - prev); prev = tt; step(0); out.push(S.renderer.domElement.toDataURL('image/png')); }
              return out;
            }""", {'name': name, 'view': view, 'yaw': yaw, 'setup': setup, 'skip': skip, 'times': times, 'cam': [cx, cy, cz]})
            d = os.path.join(OUT, name)
            os.makedirs(d, exist_ok=True)
            for i, f in enumerate(frames):
                open(os.path.join(d, f'{i:03d}.png'), 'wb').write(base64.b64decode(f.split(',')[1]))
            json.dump({'view': view}, open(os.path.join(d, 'info.json'), 'w'))
            print(name, len(frames), flush=True)
        print('errores', errs[:5])
        await b.close()

asyncio.run(main())
