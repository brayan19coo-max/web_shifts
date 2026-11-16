import { prefersReducedMotion } from '../utils/dom.js';
import { LITE, whileVisible } from '../utils/perf.js';

/**
 * Rayos X del drop
 * -------------------------------------------------------------
 * De vez en cuando el logo parpadea en los colores del drop (como un
 * escáner que se prende y se apaga) y, mientras está prendido, en el
 * fondo aparecen "radiografías" de armas, cuchillos, dinero, balas,
 * esposas y placas. Solo corre mientras el drop se ve en pantalla.
 *
 * Los colores salen de DROP.xray.colors (config.js).
 */

// Radiografías: partes densas (metal, balas) más brillantes, como en un escáner. viewBox 0 0 240 160.
const ITEMS = {
  pistola: `<path d="M26 58H196V70H120L114 70Q114 98 88 98L84 98L78 146H36L46 92Q30 86 30 72Z" fill="currentColor" fill-opacity="0.13"/><rect x="22" y="34" width="176" height="24" rx="3" fill="currentColor" fill-opacity="0.16"/><rect x="58" y="40" width="142" height="10" rx="2" fill="currentColor" fill-opacity="0.5"/><line x1="62" y1="45" x2="198" y2="45" stroke-width=".8"/><rect x="110" y="36" width="30" height="6" fill="currentColor" fill-opacity="0.04"/><rect x="188" y="29" width="6" height="6" fill="currentColor" fill-opacity="0.6"/><rect x="26" y="29" width="9" height="6" fill="currentColor" fill-opacity="0.6"/><rect x="30" y="43" width="26" height="4" fill="currentColor" fill-opacity="0.75"/><polyline points="120.0,60 126.0,68 132.0,60 138.0,68 144.0,60 150.0,68 156.0,60 162.0,68 168.0,60 174.0,68 180.0,60 186.0,68 192.0,60" fill="none" stroke-width="1.1"/><line x1="30" y1="37" x2="30" y2="55" stroke-opacity=".5"/><line x1="34" y1="37" x2="34" y2="55" stroke-opacity=".5"/><line x1="38" y1="37" x2="38" y2="55" stroke-opacity=".5"/><line x1="42" y1="37" x2="42" y2="55" stroke-opacity=".5"/><line x1="46" y1="37" x2="46" y2="55" stroke-opacity=".5"/><line x1="50" y1="37" x2="50" y2="55" stroke-opacity=".5"/><line x1="54" y1="37" x2="54" y2="55" stroke-opacity=".5"/><path d="M52 78H84L78 142H44Z" fill="currentColor" fill-opacity="0.28"/><rect x="54.5" y="82.0" width="24" height="5.4" rx="2.7" fill="currentColor" fill-opacity="0.72"/><rect x="53.6" y="89.3" width="24" height="5.4" rx="2.7" fill="currentColor" fill-opacity="0.72"/><rect x="52.7" y="96.6" width="24" height="5.4" rx="2.7" fill="currentColor" fill-opacity="0.72"/><rect x="51.8" y="103.9" width="24" height="5.4" rx="2.7" fill="currentColor" fill-opacity="0.72"/><rect x="50.9" y="111.2" width="24" height="5.4" rx="2.7" fill="currentColor" fill-opacity="0.72"/><rect x="49.9" y="118.5" width="24" height="5.4" rx="2.7" fill="currentColor" fill-opacity="0.72"/><rect x="49.0" y="125.8" width="24" height="5.4" rx="2.7" fill="currentColor" fill-opacity="0.72"/><rect x="48.1" y="133.1" width="24" height="5.4" rx="2.7" fill="currentColor" fill-opacity="0.72"/><path d="M110 70Q110 92 90 92L90 87Q104 87 104 70Z" fill="currentColor" fill-opacity="0.3"/><path d="M96 70Q103 80 96 90" fill="none" stroke-width="2.2"/><circle cx="62" cy="64" r="2.6" fill="currentColor" fill-opacity="0.95"/><circle cx="160" cy="64" r="2.6" fill="currentColor" fill-opacity="0.95"/>`,
  uzi: `<path d="M40 46L8 50V58L40 60" fill="none" stroke-width="2"/><rect x="6" y="48" width="6" height="54" rx="2" fill="currentColor" fill-opacity="0.3"/><rect x="40" y="40" width="150" height="28" rx="3" fill="currentColor" fill-opacity="0.15"/><rect x="70" y="44" width="92" height="18" rx="2" fill="currentColor" fill-opacity="0.38"/><polyline points="44.0,46 47.2,60 50.5,46 53.8,60 57.0,46 60.2,60 63.5,46 66.8,60 70.0,46" fill="none" stroke-width="1.1"/><rect x="188" y="44" width="9" height="20" fill="currentColor" fill-opacity="0.55"/><rect x="196" y="48" width="34" height="11" rx="2" fill="currentColor" fill-opacity="0.45"/><line x1="198" y1="53.5" x2="230" y2="53.5" stroke-width=".8"/><circle cx="150" cy="36" r="5" fill="currentColor" fill-opacity="0.6"/><line x1="46" y1="41" x2="46" y2="44" stroke-opacity=".6"/><line x1="54" y1="41" x2="54" y2="44" stroke-opacity=".6"/><line x1="62" y1="41" x2="62" y2="44" stroke-opacity=".6"/><line x1="70" y1="41" x2="70" y2="44" stroke-opacity=".6"/><line x1="78" y1="41" x2="78" y2="44" stroke-opacity=".6"/><line x1="86" y1="41" x2="86" y2="44" stroke-opacity=".6"/><line x1="94" y1="41" x2="94" y2="44" stroke-opacity=".6"/><line x1="102" y1="41" x2="102" y2="44" stroke-opacity=".6"/><line x1="110" y1="41" x2="110" y2="44" stroke-opacity=".6"/><line x1="118" y1="41" x2="118" y2="44" stroke-opacity=".6"/><line x1="126" y1="41" x2="126" y2="44" stroke-opacity=".6"/><line x1="134" y1="41" x2="134" y2="44" stroke-opacity=".6"/><line x1="142" y1="41" x2="142" y2="44" stroke-opacity=".6"/><line x1="150" y1="41" x2="150" y2="44" stroke-opacity=".6"/><line x1="158" y1="41" x2="158" y2="44" stroke-opacity=".6"/><line x1="166" y1="41" x2="166" y2="44" stroke-opacity=".6"/><line x1="174" y1="41" x2="174" y2="44" stroke-opacity=".6"/><line x1="182" y1="41" x2="182" y2="44" stroke-opacity=".6"/><path d="M102 68H136L130 140H98Z" fill="currentColor" fill-opacity="0.14"/><path d="M108 68H128L126 156H106Z" fill="currentColor" fill-opacity="0.3"/><rect x="109.5" y="72" width="15" height="6" rx="3" fill="currentColor" fill-opacity="0.72"/><rect x="109.4" y="80" width="15" height="6" rx="3" fill="currentColor" fill-opacity="0.72"/><rect x="109.3" y="88" width="15" height="6" rx="3" fill="currentColor" fill-opacity="0.72"/><rect x="109.2" y="96" width="15" height="6" rx="3" fill="currentColor" fill-opacity="0.72"/><rect x="109.1" y="104" width="15" height="6" rx="3" fill="currentColor" fill-opacity="0.72"/><rect x="109.0" y="112" width="15" height="6" rx="3" fill="currentColor" fill-opacity="0.72"/><rect x="108.9" y="120" width="15" height="6" rx="3" fill="currentColor" fill-opacity="0.72"/><rect x="108.8" y="128" width="15" height="6" rx="3" fill="currentColor" fill-opacity="0.72"/><rect x="108.7" y="136" width="15" height="6" rx="3" fill="currentColor" fill-opacity="0.72"/><rect x="108.6" y="144" width="15" height="6" rx="3" fill="currentColor" fill-opacity="0.72"/><path d="M136 68Q162 70 162 94L155 94Q155 77 136 76Z" fill="currentColor" fill-opacity="0.28"/><path d="M140 70Q146 80 141 88" fill="none" stroke-width="2.2"/>`,
  revolver: `<path d="M62 74Q50 110 40 140L74 146Q78 112 94 82Z" fill="currentColor" fill-opacity="0.13"/><polyline transform="rotate(-62 68 100)" points="56.0,96 60.0,104 64.0,96 68.0,104 72.0,96 76.0,104 80.0,96" fill="none" stroke-width="1.1"/><circle cx="62" cy="114" r="3.2" fill="currentColor" fill-opacity="0.95"/><path d="M60 34H132V74H112L104 82H78L70 74H60Z" fill="currentColor" fill-opacity="0.15"/><path d="M60 34L46 20L55 15L69 33Z" fill="currentColor" fill-opacity="0.42"/><rect x="120" y="40" width="102" height="15" rx="2" fill="currentColor" fill-opacity="0.2"/><rect x="122" y="45.5" width="99" height="4" fill="currentColor" fill-opacity="0.62"/><rect x="132" y="57" width="62" height="5" rx="2" fill="currentColor" fill-opacity="0.42"/><rect x="214" y="33" width="6" height="7" fill="currentColor" fill-opacity="0.6"/><rect x="78" y="38" width="44" height="34" rx="6" fill="currentColor" fill-opacity="0.24"/><rect x="81" y="41" width="38" height="8" rx="3.5" fill="currentColor" fill-opacity="0.75"/><rect x="81" y="52" width="38" height="8" rx="3.5" fill="currentColor" fill-opacity="0.75"/><rect x="81" y="63" width="38" height="8" rx="3.5" fill="currentColor" fill-opacity="0.75"/><path d="M94 82Q98 104 118 102V96Q104 96 102 82Z" fill="currentColor" fill-opacity="0.28"/><path d="M100 82Q106 90 101 98" fill="none" stroke-width="2.2"/><circle cx="100" cy="56" r="2.4" fill="currentColor" fill-opacity="0.95"/>`,
  cuchillo: `<path d="M14 72Q64 44 150 47V80H42Q22 80 14 72Z" fill="currentColor" fill-opacity="0.3"/><path d="M22 73Q70 71 148 73" fill="none" stroke-opacity=".6"/><line x1="62" y1="58" x2="142" y2="56" stroke-width="2.4" stroke-opacity=".7"/><rect x="150" y="57" width="78" height="13" rx="2" fill="currentColor" fill-opacity="0.55"/><rect x="144" y="36" width="11" height="54" rx="3" fill="currentColor" fill-opacity="0.62"/><path d="M155 49H222Q234 49 234 63.5Q234 78 222 78H155Z" fill="currentColor" fill-opacity="0.1"/><circle cx="172" cy="63.5" r="4.2" fill="currentColor" fill-opacity="0.95"/><circle cx="193" cy="63.5" r="4.2" fill="currentColor" fill-opacity="0.95"/><circle cx="214" cy="63.5" r="4.2" fill="currentColor" fill-opacity="0.95"/><circle cx="228" cy="63.5" r="2.6" fill="none"/>`,
  navaja: `<rect x="118" y="70" width="104" height="26" rx="13" fill="currentColor" fill-opacity="0.12"/><rect x="124" y="75" width="92" height="16" rx="8" fill="currentColor" fill-opacity="0.3"/><line x1="140" y1="77" x2="206" y2="77" stroke-width="2" stroke-opacity=".8"/><path d="M128 77L44 56Q20 52 12 62L126 92Z" fill="currentColor" fill-opacity="0.32"/><path d="M20 63L124 88" fill="none" stroke-opacity=".6"/><circle cx="128" cy="83" r="6.5" fill="currentColor" fill-opacity="0.85"/><circle cx="208" cy="83" r="3.2" fill="currentColor" fill-opacity="0.95"/><circle cx="62" cy="64" r="3" fill="none"/>`,
  fajo: `<rect x="24" y="52" width="192" height="58" rx="2" fill="currentColor" fill-opacity="0.13"/><line x1="24" y1="56" x2="216" y2="56" stroke-opacity=".35" stroke-width=".8"/><line x1="24" y1="60" x2="216" y2="60" stroke-opacity=".35" stroke-width=".8"/><line x1="24" y1="64" x2="216" y2="64" stroke-opacity=".35" stroke-width=".8"/><line x1="24" y1="68" x2="216" y2="68" stroke-opacity=".35" stroke-width=".8"/><line x1="24" y1="72" x2="216" y2="72" stroke-opacity=".35" stroke-width=".8"/><line x1="24" y1="76" x2="216" y2="76" stroke-opacity=".35" stroke-width=".8"/><line x1="24" y1="80" x2="216" y2="80" stroke-opacity=".35" stroke-width=".8"/><line x1="24" y1="84" x2="216" y2="84" stroke-opacity=".35" stroke-width=".8"/><line x1="24" y1="88" x2="216" y2="88" stroke-opacity=".35" stroke-width=".8"/><line x1="24" y1="92" x2="216" y2="92" stroke-opacity=".35" stroke-width=".8"/><line x1="24" y1="96" x2="216" y2="96" stroke-opacity=".35" stroke-width=".8"/><line x1="24" y1="100" x2="216" y2="100" stroke-opacity=".35" stroke-width=".8"/><line x1="24" y1="104" x2="216" y2="104" stroke-opacity=".35" stroke-width=".8"/><line x1="24" y1="108" x2="216" y2="108" stroke-opacity=".35" stroke-width=".8"/><path d="M24 52L40 32H232L216 52Z" fill="currentColor" fill-opacity="0.2"/><path d="M216 52L232 32V90L216 110" fill="none"/><ellipse cx="128" cy="42" rx="22" ry="6" fill="none" stroke-opacity=".7"/><path d="M100 30H130L114 52V112H98V50Z" fill="currentColor" fill-opacity="0.5"/><text x="56" y="47" font-size="12" font-family="Arial,sans-serif" font-weight="700" fill="currentColor" fill-opacity="0.8" stroke="none">$100</text>`,
  billetes: `<g transform="rotate(-28 90 140)"><rect x="40" y="56" width="150" height="66" rx="3" fill="currentColor" fill-opacity="0.14"/><rect x="47" y="62" width="136" height="54" rx="2" fill="none" stroke-opacity=".55"/><ellipse cx="115" cy="89" rx="17" ry="20" fill="none" stroke-opacity=".7"/><text x="52" y="76" font-size="10" font-family="Arial,sans-serif" font-weight="700" fill="currentColor" fill-opacity="0.75" stroke="none">100</text><text x="160" y="112" font-size="10" font-family="Arial,sans-serif" font-weight="700" fill="currentColor" fill-opacity="0.75" stroke="none">100</text></g><g transform="rotate(-12 90 140)"><rect x="40" y="56" width="150" height="66" rx="3" fill="currentColor" fill-opacity="0.14"/><rect x="47" y="62" width="136" height="54" rx="2" fill="none" stroke-opacity=".55"/><ellipse cx="115" cy="89" rx="17" ry="20" fill="none" stroke-opacity=".7"/><text x="52" y="76" font-size="10" font-family="Arial,sans-serif" font-weight="700" fill="currentColor" fill-opacity="0.75" stroke="none">100</text><text x="160" y="112" font-size="10" font-family="Arial,sans-serif" font-weight="700" fill="currentColor" fill-opacity="0.75" stroke="none">100</text></g><g transform="rotate(4 90 140)"><rect x="40" y="56" width="150" height="66" rx="3" fill="currentColor" fill-opacity="0.14"/><rect x="47" y="62" width="136" height="54" rx="2" fill="none" stroke-opacity=".55"/><ellipse cx="115" cy="89" rx="17" ry="20" fill="none" stroke-opacity=".7"/><text x="52" y="76" font-size="10" font-family="Arial,sans-serif" font-weight="700" fill="currentColor" fill-opacity="0.75" stroke="none">100</text><text x="160" y="112" font-size="10" font-family="Arial,sans-serif" font-weight="700" fill="currentColor" fill-opacity="0.75" stroke="none">100</text></g><g transform="rotate(20 90 140)"><rect x="40" y="56" width="150" height="66" rx="3" fill="currentColor" fill-opacity="0.14"/><rect x="47" y="62" width="136" height="54" rx="2" fill="none" stroke-opacity=".55"/><ellipse cx="115" cy="89" rx="17" ry="20" fill="none" stroke-opacity=".7"/><text x="52" y="76" font-size="10" font-family="Arial,sans-serif" font-weight="700" fill="currentColor" fill-opacity="0.75" stroke="none">100</text><text x="160" y="112" font-size="10" font-family="Arial,sans-serif" font-weight="700" fill="currentColor" fill-opacity="0.75" stroke="none">100</text></g>`,
  esposas: `<circle cx="62" cy="92" r="34" fill="none" stroke-width="9" stroke-opacity=".38"/><circle cx="62" cy="92" r="34" fill="none" stroke-width="1"/><circle cx="62" cy="92" r="25" fill="none" stroke-width="1"/><rect x="48" y="44" width="28" height="22" rx="4" fill="currentColor" fill-opacity="0.48"/><circle cx="62" cy="53" r="3" fill="currentColor" fill-opacity="0.95"/><line x1="62" y1="56" x2="62" y2="61" stroke-width="2"/><path d="M42 116l4-4M50 122l3-5M59 125l1-6" fill="none" stroke-opacity=".7"/><circle cx="178" cy="92" r="34" fill="none" stroke-width="9" stroke-opacity=".38"/><circle cx="178" cy="92" r="34" fill="none" stroke-width="1"/><circle cx="178" cy="92" r="25" fill="none" stroke-width="1"/><rect x="164" y="44" width="28" height="22" rx="4" fill="currentColor" fill-opacity="0.48"/><circle cx="178" cy="53" r="3" fill="currentColor" fill-opacity="0.95"/><line x1="178" y1="56" x2="178" y2="61" stroke-width="2"/><path d="M158 116l4-4M166 122l3-5M175 125l1-6" fill="none" stroke-opacity=".7"/><ellipse cx="94" cy="50" rx="8" ry="5" fill="none" stroke-width="3" stroke-opacity=".6"/><ellipse cx="108" cy="50" rx="8" ry="5" fill="none" stroke-width="3" stroke-opacity=".6"/><ellipse cx="122" cy="50" rx="8" ry="5" fill="none" stroke-width="3" stroke-opacity=".6"/><ellipse cx="136" cy="50" rx="8" ry="5" fill="none" stroke-width="3" stroke-opacity=".6"/><ellipse cx="150" cy="50" rx="8" ry="5" fill="none" stroke-width="3" stroke-opacity=".6"/>`,
  placa: `<polygon points="120.0,18.0 102.4,55.7 61.0,60.8 91.5,89.3 83.6,130.2 120.0,110.0 156.4,130.2 148.5,89.3 179.0,60.8 137.6,55.7" fill="currentColor" fill-opacity="0.2"/><circle cx="120" cy="82" r="24" fill="currentColor" fill-opacity="0.32"/><circle cx="120" cy="82" r="18" fill="none" stroke-opacity=".8"/><text x="120" y="87" text-anchor="middle" font-size="11" font-family="Arial,sans-serif" font-weight="800" fill="currentColor" fill-opacity="0.9" stroke="none">X-COPS</text><circle cx="120.0" cy="20.0" r="4" fill="currentColor" fill-opacity="0.85"/><circle cx="62.9" cy="61.5" r="4" fill="currentColor" fill-opacity="0.85"/><circle cx="84.7" cy="128.5" r="4" fill="currentColor" fill-opacity="0.85"/><circle cx="155.3" cy="128.5" r="4" fill="currentColor" fill-opacity="0.85"/><circle cx="177.1" cy="61.5" r="4" fill="currentColor" fill-opacity="0.85"/><rect x="112" y="128" width="16" height="10" rx="2" fill="currentColor" fill-opacity="0.55"/>`,
  balas: `<rect x="50" y="70" width="26" height="74" rx="2" fill="currentColor" fill-opacity="0.3"/><rect x="48" y="140" width="30" height="7" rx="1.5" fill="currentColor" fill-opacity="0.55"/><path d="M51 70V48Q63 12 75 48V70Z" fill="currentColor" fill-opacity="0.7"/><circle cx="63" cy="143.5" r="3.5" fill="currentColor" fill-opacity="0.95"/><circle cx="56" cy="82" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="63" cy="82" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="70" cy="82" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="56" cy="94" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="63" cy="94" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="70" cy="94" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="56" cy="106" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="63" cy="106" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="70" cy="106" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="56" cy="118" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="63" cy="118" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="70" cy="118" r="1.6" fill="currentColor" fill-opacity="0.85"/><rect x="108" y="70" width="26" height="74" rx="2" fill="currentColor" fill-opacity="0.3"/><rect x="106" y="140" width="30" height="7" rx="1.5" fill="currentColor" fill-opacity="0.55"/><path d="M109 70V48Q121 12 133 48V70Z" fill="currentColor" fill-opacity="0.7"/><circle cx="121" cy="143.5" r="3.5" fill="currentColor" fill-opacity="0.95"/><circle cx="114" cy="82" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="121" cy="82" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="128" cy="82" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="114" cy="94" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="121" cy="94" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="128" cy="94" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="114" cy="106" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="121" cy="106" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="128" cy="106" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="114" cy="118" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="121" cy="118" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="128" cy="118" r="1.6" fill="currentColor" fill-opacity="0.85"/><rect x="166" y="70" width="26" height="74" rx="2" fill="currentColor" fill-opacity="0.3"/><rect x="164" y="140" width="30" height="7" rx="1.5" fill="currentColor" fill-opacity="0.55"/><path d="M167 70V48Q179 12 191 48V70Z" fill="currentColor" fill-opacity="0.7"/><circle cx="179" cy="143.5" r="3.5" fill="currentColor" fill-opacity="0.95"/><circle cx="172" cy="82" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="179" cy="82" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="186" cy="82" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="172" cy="94" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="179" cy="94" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="186" cy="94" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="172" cy="106" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="179" cy="106" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="186" cy="106" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="172" cy="118" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="179" cy="118" r="1.6" fill="currentColor" fill-opacity="0.85"/><circle cx="186" cy="118" r="1.6" fill="currentColor" fill-opacity="0.85"/>`,
  manopla: `<path d="M14 66Q14 40 40 40H204Q228 40 228 64V72Q228 104 196 112H52Q14 108 14 80Z" fill="currentColor" fill-opacity="0.22"/><circle cx="52" cy="64" r="15" fill="currentColor" fill-opacity="0.0" stroke-width="1.2"/><circle cx="52" cy="64" r="15" fill="#000" fill-opacity=".55" stroke="none"/><circle cx="94" cy="64" r="15" fill="currentColor" fill-opacity="0.0" stroke-width="1.2"/><circle cx="94" cy="64" r="15" fill="#000" fill-opacity=".55" stroke="none"/><circle cx="136" cy="64" r="15" fill="currentColor" fill-opacity="0.0" stroke-width="1.2"/><circle cx="136" cy="64" r="15" fill="#000" fill-opacity=".55" stroke="none"/><circle cx="178" cy="64" r="15" fill="currentColor" fill-opacity="0.0" stroke-width="1.2"/><circle cx="178" cy="64" r="15" fill="#000" fill-opacity=".55" stroke="none"/><path d="M40 96Q120 104 200 96" fill="none" stroke-opacity=".6"/>`,
};

// Lugares del fondo (en %), pegados a los bordes para no tapar el texto
const SLOTS = [
  { x: 2, y: 6, w: 28 },
  { x: 24, y: 2, w: 18 },
  { x: 40, y: 8, w: 17 },
  { x: 2, y: 40, w: 20 },
  { x: 3, y: 72, w: 27 },
  { x: 26, y: 82, w: 18 },
  { x: 44, y: 76, w: 17 },
  { x: 80, y: 4, w: 25 },
  { x: 64, y: 2, w: 18 },
  { x: 86, y: 44, w: 17 },
  { x: 78, y: 76, w: 27 },
  { x: 62, y: 84, w: 17 },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const rand = (min, max) => min + Math.random() * (max - min);
const shuffle = (list) => list.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);

/** Filtro SVG que pinta el blanco del logo del color dado (el contorno negro se queda negro). */
function tintFilters(colors) {
  const rows = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => (v / 255 / 3).toFixed(4));
    return `${r} ${r} ${r} 0 0  ${g} ${g} ${g} 0 0  ${b} ${b} ${b} 0 0  0 0 0 1 0`;
  };
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.innerHTML = colors
    .map((c, i) => `<filter id="xr-tint-${i}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${rows(c)}"/></filter>`)
    .join('');
  document.body.append(svg);
}

export function initXray(section, logoEl, { colors = [] } = {}) {
  if (!section || !colors.length) return;
  section.classList.add('drop--xray');
  tintFilters(colors);

  // Capa de fondo con las radiografías
  const layer = document.createElement('div');
  layer.className = 'xray';
  layer.setAttribute('aria-hidden', 'true');
  const names = Object.keys(ITEMS);
  const items = names.map((name) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    el.setAttribute('viewBox', '0 0 240 160');
    el.setAttribute('class', `xray__item xray__item--${name}`);
    el.innerHTML = ITEMS[name];
    layer.append(el);
    return el;
  });
  section.prepend(layer);

  const reduced = prefersReducedMotion();
  const perFlash = LITE ? 4 : 7;

  const placeItems = () => {
    const slots = shuffle(SLOTS);
    const chosen = shuffle(items).slice(0, perFlash);
    items.forEach((el) => el.classList.remove('is-on'));
    chosen.forEach((el, i) => {
      const slot = slots[i];
      el.style.left = `${slot.x}%`;
      el.style.top = `${slot.y}%`;
      el.style.width = `${slot.w}%`;
      el.style.setProperty('--rot', `${Math.round(rand(-35, 35))}deg`);
      el.classList.add('is-on');
    });
  };

  const setColor = (index) => {
    const color = colors[index];
    section.style.setProperty('--xr', color);
    if (logoEl) {
      logoEl.style.filter = LITE
        ? `url(#xr-tint-${index})`
        : `url(#xr-tint-${index}) drop-shadow(0 0 10px ${color}) drop-shadow(0 0 28px ${color})`;
    }
  };
  const lightsOn = (index) => {
    setColor(index);
    section.classList.add('is-xray');
  };
  const lightsOff = () => {
    section.classList.remove('is-xray');
    if (logoEl) logoEl.style.filter = '';
  };

  let running = false;
  let busy = false;
  let timer = 0;

  // Un "escaneo": parpadeos rápidos cambiando de color y luego se queda prendido un momento
  const scan = async () => {
    if (busy || !running) return;
    busy = true;
    placeItems();
    let index = Math.floor(Math.random() * colors.length);
    const blinks = reduced ? 1 : Math.round(rand(3, 6));
    for (let i = 0; i < blinks && running; i++) {
      lightsOn(index);
      await wait(rand(60, 130));
      if (i < blinks - 1) {
        lightsOff();
        await wait(rand(40, 110));
      }
      index = (index + 1 + Math.floor(Math.random() * (colors.length - 1))) % colors.length;
    }
    if (running) {
      lightsOn(index);
      await wait(reduced ? 900 : rand(650, 1100));
    }
    lightsOff();
    busy = false;
    schedule();
  };

  const schedule = () => {
    clearTimeout(timer);
    if (running) timer = setTimeout(scan, rand(2600, 6200));
  };

  whileVisible(section, (on) => {
    running = on;
    if (on) schedule();
    else {
      clearTimeout(timer);
      lightsOff();
    }
  });
}
