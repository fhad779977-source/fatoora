/**
 * Brand-consistent illustrations generated as SVG data URIs, so templates never
 * depend on random stock photography or external hosts (and export to PDF reliably).
 */

const svg = (body: string, w = 1200, h = 700) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`)}`;

const NAVY = "#0B1220";
const IVORY = "#F5F1E8";
const COPPER = "#B9824A";
const SLATE = "#8993A4";

/** Architectural arches — used as company cover. */
export function archesCover() {
  const arches = Array.from({ length: 7 }, (_, i) => {
    const x = 90 + i * 150;
    const h = 260 + (i % 3) * 70;
    return `<path d="M${x} 700V${700 - h + 60}a60 60 0 0 1 120 0V700" fill="none" stroke="${COPPER}" stroke-opacity="${0.25 + (i % 3) * 0.2}" stroke-width="2"/>`;
  }).join("");
  return svg(
    `<rect width="1200" height="700" fill="${NAVY}"/>
     <circle cx="930" cy="190" r="120" fill="${COPPER}" fill-opacity=".9"/>
     <circle cx="930" cy="190" r="170" fill="none" stroke="${COPPER}" stroke-opacity=".25"/>
     ${arches}
     <rect y="640" width="1200" height="60" fill="${COPPER}" fill-opacity=".12"/>`
  );
}

/** Browser-window website mockup — used in portfolio projects. */
export function websiteMockup(variant: "light" | "dark" | "copper" = "light") {
  const bg = variant === "dark" ? NAVY : variant === "copper" ? "#EAD9C4" : IVORY;
  const fg = variant === "dark" ? IVORY : NAVY;
  const card = variant === "dark" ? "#16213A" : "#FFFFFF";
  return svg(
    `<rect width="1200" height="700" fill="${variant === "dark" ? "#E9E3D6" : NAVY}"/>
     <g transform="translate(110 70)">
       <rect width="980" height="600" rx="22" fill="${bg}"/>
       <rect width="980" height="46" rx="22" fill="${card}"/><rect y="24" width="980" height="22" fill="${card}"/>
       <circle cx="34" cy="23" r="7" fill="${COPPER}"/><circle cx="58" cy="23" r="7" fill="${SLATE}" fill-opacity=".5"/><circle cx="82" cy="23" r="7" fill="${SLATE}" fill-opacity=".3"/>
       <rect x="380" y="14" width="220" height="18" rx="9" fill="${SLATE}" fill-opacity=".18"/>
       <rect x="60" y="90" width="120" height="16" rx="8" fill="${fg}" fill-opacity=".85"/>
       <rect x="640" y="90" width="70" height="12" rx="6" fill="${fg}" fill-opacity=".3"/><rect x="730" y="90" width="70" height="12" rx="6" fill="${fg}" fill-opacity=".3"/><rect x="820" y="84" width="100" height="26" rx="13" fill="${COPPER}"/>
       <rect x="520" y="170" width="400" height="34" rx="8" fill="${fg}"/>
       <rect x="600" y="220" width="320" height="34" rx="8" fill="${fg}"/>
       <rect x="580" y="280" width="340" height="12" rx="6" fill="${fg}" fill-opacity=".35"/>
       <rect x="640" y="304" width="280" height="12" rx="6" fill="${fg}" fill-opacity=".35"/>
       <rect x="780" y="346" width="140" height="42" rx="21" fill="${COPPER}"/>
       <rect x="60" y="160" width="400" height="240" rx="18" fill="${COPPER}" fill-opacity=".85"/>
       <circle cx="260" cy="280" r="70" fill="${bg}" fill-opacity=".35"/>
       <g fill="${card}"><rect x="60" y="440" width="270" height="120" rx="16"/><rect x="355" y="440" width="270" height="120" rx="16"/><rect x="650" y="440" width="270" height="120" rx="16"/></g>
       <g fill="${fg}" fill-opacity=".25"><rect x="90" y="470" width="140" height="12" rx="6"/><rect x="385" y="470" width="140" height="12" rx="6"/><rect x="680" y="470" width="140" height="12" rx="6"/></g>
       <g fill="${COPPER}" fill-opacity=".7"><rect x="90" y="500" width="80" height="26" rx="6"/><rect x="385" y="500" width="80" height="26" rx="6"/><rect x="680" y="500" width="80" height="26" rx="6"/></g>
     </g>`
  );
}

/** Phone mockup of an app — used for a mobile project. */
export function appMockup() {
  return svg(
    `<rect width="1200" height="700" fill="${IVORY}"/>
     <circle cx="600" cy="350" r="300" fill="${COPPER}" fill-opacity=".12"/>
     ${[0, 1, 2]
       .map((i) => {
         const x = 300 + i * 220;
         const y = i === 1 ? 70 : 120;
         return `<g transform="translate(${x} ${y})"><rect width="200" height="${i === 1 ? 560 : 480}" rx="34" fill="${NAVY}"/><rect x="10" y="10" width="180" height="${i === 1 ? 540 : 460}" rx="26" fill="${i === 1 ? IVORY : "#FFFFFF"}"/>
           <rect x="30" y="50" width="90" height="12" rx="6" fill="${NAVY}" fill-opacity=".8"/>
           <rect x="30" y="80" width="140" height="${i === 1 ? 150 : 110}" rx="16" fill="${i === 1 ? NAVY : COPPER}" fill-opacity="${i === 1 ? 1 : 0.85}"/>
           <rect x="30" y="${i === 1 ? 250 : 210}" width="140" height="10" rx="5" fill="${SLATE}" fill-opacity=".5"/>
           <rect x="30" y="${i === 1 ? 270 : 230}" width="100" height="10" rx="5" fill="${SLATE}" fill-opacity=".35"/>
           <rect x="30" y="${i === 1 ? 310 : 270}" width="140" height="56" rx="12" fill="${COPPER}" fill-opacity=".18"/>
           <rect x="30" y="${i === 1 ? 380 : 340}" width="140" height="56" rx="12" fill="${COPPER}" fill-opacity=".18"/>
           ${i === 1 ? `<rect x="30" y="470" width="140" height="40" rx="20" fill="${COPPER}"/>` : ""}</g>`;
       })
       .join("")}`
  );
}

/** Abstract bar chart artwork — used in financial/project reports. */
export function chartArt() {
  const bars = [120, 180, 150, 230, 210, 290, 340, 320, 400]
    .map((h, i) => `<rect x="${150 + i * 105}" y="${560 - h}" width="56" height="${h}" rx="10" fill="${i === 8 ? COPPER : NAVY}" fill-opacity="${i === 8 ? 1 : 0.14 + i * 0.07}"/>`)
    .join("");
  return svg(
    `<rect width="1200" height="700" fill="#FFFFFF"/>
     ${[160, 260, 360, 460, 560].map((y) => `<line x1="120" x2="1100" y1="${y}" y2="${y}" stroke="${SLATE}" stroke-opacity=".18"/>`).join("")}
     ${bars}
     <polyline points="178,430 283,380 388,405 493,330 598,345 703,270 808,220 913,240 1018,160" fill="none" stroke="${COPPER}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
     <circle cx="1018" cy="160" r="10" fill="${COPPER}"/><circle cx="1018" cy="160" r="22" fill="${COPPER}" fill-opacity=".18"/>`,
    1200,
    640
  );
}
