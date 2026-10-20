import { createRequire } from 'module';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const require = createRequire('/usr/local/lib/node_modules/');
const { chromium } = require('playwright');
const D = process.argv[2];
const FPS = 12;
// nombre → acción de la escena, cuánto saltar al inicio y cuánto grabar (s)
const PLAN = [
  { name: 'quieto', act: null, dur: 3.0 },
  { name: 'saludar', act: 'call', dur: 2.4 },
  { name: 'hablar', act: 'chat', dur: 1.8 },
  { name: 'risa', act: 'giggle', dur: 0.9 },
  { name: 'carcajada', act: 'bellyLaugh', dur: 1.4 },
  { name: 'bailar', act: 'dance', skip: 1.0, dur: 2.5 },
  { name: 'rapear', act: 'rap', skip: 1.0, dur: 2.5 },
  { name: 'flex', act: 'flex', dur: 1.6 },
  { name: 'chocala', act: 'highFive', dur: 1.6 },
  { name: 'bravo', act: 'stomp', mad: true, dur: 0.8 },
  { name: 'pataleta', act: 'tantrum', mad: true, dur: 1.3 },
  { name: 'triste', act: 'sad', dur: 2.0 },
  { name: 'dormido', sleep: true, skip: 2.0, dur: 3.0 },
  { name: 'bostezo', act: 'yawn', dur: 2.3 },
  { name: 'gafas', act: 'glassesPeek', dur: 2.3 },
  { name: 'susto', act: 'startle', dur: 1.0 },
  { name: 'mirar', act: 'lookAround', dur: 2.6 },
  { name: 'girar', act: 'tailSpin', dur: 1.5 },
  { name: 'saltar', act: 'footHop', dur: 1.3 },
  { name: 'cadena', act: 'showChain', dur: 2.1 },
];
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 400, height: 480 }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.route(/three\.min\.js/, r => r.fulfill({ body: readFileSync(D + '/libs3d/three.min.js'), contentType: 'application/javascript' }));
await p.route(/OrbitControls\.js/, r => r.fulfill({ body: readFileSync(D + '/libs3d/OrbitControls.js'), contentType: 'application/javascript' }));
await p.route(/fonts\.(googleapis|gstatic)/, r => r.fulfill({ body: '', contentType: 'text/css' }));
await p.goto('file://' + D + '/studio/studio.html');
await p.waitForFunction(() => window.__swg && window.__step, null, { timeout: 20000 });
await p.evaluate(() => {
  const S = window.__swg;
  for (let i = 0; i < 30; i++) { S.calm(); window.__step(1 / 30); }
  S.studio();
  const cam = S.camera;
  cam.fov = 34; cam.position.set(0.9, 1.6, 6.6); cam.lookAt(0, 1.45, 0); cam.updateProjectionMatrix();
  window.__studioLook = cam.position.clone();
  window.__keep = (mad) => { S.calm(); if (mad) S.setMad(true); S.root.position.x = 0; S.root.position.z = 0; };
});
for (const step of PLAN) {
  const frames = await p.evaluate(({ step, FPS }) => {
    const S = window.__swg;
    const dt = 1 / FPS;
    // volver a la calma entre grabaciones
    if (S.sleeping) S.wake(true);
    for (let i = 0; i < 24; i++) { window.__keep(false); window.__step(1 / 30); }
    if (step.sleep) S.sleep();
    if (step.mad) S.setMad(true);
    if (step.act) S.play(step.act, 0, { silent: true });
    // avanzar sin grabar
    for (let t = 0; t < (step.skip || 0); t += 1 / 30) { window.__keep(step.mad); window.__step(1 / 30); }
    const out = [];
    const n = Math.round(step.dur * FPS);
    for (let i = 0; i < n; i++) {
      window.__keep(step.mad);
      // dos medios pasos por cuadro para que la física vaya suave
      window.__step(dt / 2); window.__keep(step.mad); window.__step(dt / 2);
      out.push(S.renderer.domElement.toDataURL('image/png'));
    }
    if (step.mad) S.setMad(false);
    return out;
  }, { step, FPS });
  mkdirSync(`${D}/studio/frames/${step.name}`, { recursive: true });
  frames.forEach((f, i) => writeFileSync(`${D}/studio/frames/${step.name}/${String(i).padStart(3, '0')}.png`, Buffer.from(f.split(',')[1], 'base64')));
  console.log(step.name, frames.length);
}
console.log('errores', errs.slice(0, 5)); await b.close();
