# Audio Speed Changer

Speed up or slow down an audio file, entirely in the browser. React + TypeScript + Vite, deployed
as a static Cloudflare Worker.

- Drag-and-drop or file picker upload
- 0.25x-3x via presets or a slider
- Pitch changes with speed (linear resampling — no phase vocoder), clearly labelled as such
- Preview player before download; exports lossless WAV
- Nothing is uploaded — decode/resample/encode all happen locally

## Dev

```
npm install
npm run dev
npm run build
npm run deploy
```
