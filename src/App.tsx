import { useCallback, useState } from 'react';
import { resampleChannels, formatTime } from './speed';
import { encodeWav, readableSize } from './wav-encoder';

const PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function App() {
  const [fileName, setFileName] = useState('');
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [outUrl, setOutUrl] = useState<string | null>(null);
  const [outInfo, setOutInfo] = useState<{ seconds: number; bytes: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const loadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      setError('That is not an audio file. Try MP3, WAV, OGG, M4A or FLAC.');
      return;
    }
    if (file.size > 80 * 1024 * 1024) {
      setError('That file is over 80 MB — try a smaller one.');
      return;
    }
    setError('');
    try {
      const arrayBuf = await file.arrayBuffer();
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const decoded = await ctx.decodeAudioData(arrayBuf);
      setFileName(file.name);
      setBuffer(decoded);
      setOutUrl(null);
      setOutInfo(null);
      ctx.close();
    } catch {
      setError('Could not decode that file — it may be corrupted or an unsupported format.');
    }
  }, []);

  function reset() {
    setFileName('');
    setBuffer(null);
    setSpeed(1);
    setError('');
    setOutUrl((u) => { if (u) URL.revokeObjectURL(u); return null; });
    setOutInfo(null);
  }

  function render() {
    if (!buffer) return;
    setBusy(true);
    setTimeout(() => {
      const channels: Float32Array[] = [];
      for (let c = 0; c < buffer.numberOfChannels; c++) channels.push(buffer.getChannelData(c));
      const resampled = resampleChannels(channels, speed);
      const wav = encodeWav(resampled, buffer.sampleRate);
      const blob = new Blob([wav], { type: 'audio/wav' });
      if (outUrl) URL.revokeObjectURL(outUrl);
      setOutUrl(URL.createObjectURL(blob));
      setOutInfo({ seconds: buffer.duration / speed, bytes: blob.size });
      setBusy(false);
    }, 10);
  }

  function downloadName(): string {
    const base = fileName.replace(/\.[^.]+$/, '') || 'audio';
    return `${base}-${speed}x.wav`;
  }

  return (
    <div className="page">
      <h1>Audio Speed Changer</h1>
      <p className="lede">
        Speed up or slow down an MP3, WAV, OGG, M4A or FLAC file. Like a tape or turntable, pitch
        rises when sped up and drops when slowed down. Everything runs in your browser.
      </p>

      {!buffer && (
        <div
          className={`drop${dragOver ? ' over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) loadFile(file);
          }}
        >
          <p>Drag an audio file here, or</p>
          <label className="filebtn">
            Choose an audio file
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) loadFile(file);
              }}
            />
          </label>
          {error && <p className="err">{error}</p>}
        </div>
      )}

      {buffer && (
        <>
          <p className="filelabel">{fileName} · {formatTime(buffer.duration)} original</p>

          <div className="presets">
            {PRESETS.map((p) => (
              <button key={p} className={speed === p ? 'on' : ''} onClick={() => setSpeed(p)}>{p}×</button>
            ))}
          </div>

          <label className="slider-field">
            <span>Speed: {speed.toFixed(2)}×</span>
            <input
              type="range" min={0.25} max={3} step={0.05} value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
          </label>

          <p className="hint">New length: {formatTime(buffer.duration / speed)}</p>

          <div className="actions">
            <button className="primary" onClick={render} disabled={busy}>{busy ? 'Rendering…' : 'Change speed'}</button>
            <button className="ghost" onClick={reset}>Choose a different file</button>
          </div>

          {outUrl && outInfo && (
            <div className="result">
              <audio controls src={outUrl} className="player" />
              <p className="hint">{formatTime(outInfo.seconds)} · {readableSize(outInfo.bytes)} · WAV</p>
              <a className="primary" href={outUrl} download={downloadName()}>Download</a>
            </div>
          )}
        </>
      )}

      <section className="explainer">
        <h2>How it works</h2>
        <p>
          The file is decoded in your browser and resampled to the new speed — the same principle
          as playing a tape or record faster or slower, so the pitch changes along with the speed.
        </p>
        <h3>Can it change speed without changing pitch?</h3>
        <p>
          Not in this tool. Pitch-preserving time-stretch needs a much more complex algorithm (a
          phase vocoder); this tool keeps things simple, fast and dependency-free by resampling
          instead, which changes pitch along with speed — like a cassette or vinyl record.
        </p>
        <h3>Does this upload my audio anywhere?</h3>
        <p>No. Decoding, resampling and encoding all happen locally in your browser.</p>
      </section>
    </div>
  );
}
