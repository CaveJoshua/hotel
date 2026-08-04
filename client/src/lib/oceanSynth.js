// Synthesizes authentic tropical ocean wave soundscape using Web Audio API
let audioCtx = null;
let masterGain = null;
let isPlaying = false;
let waveTimer = null;

export function toggleOceanSound(onStateChange) {
  if (isPlaying) {
    stopOceanSound();
    if (onStateChange) onStateChange(false);
    return false;
  } else {
    startOceanSound();
    if (onStateChange) onStateChange(true);
    return true;
  }
}

export function isOceanPlaying() {
  return isPlaying;
}

export function startOceanSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioCtx = new AudioContext();

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);

    // Pink noise buffer generator for deep ocean rumble
    const bufferSize = audioCtx.sampleRate * 4;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const noiseSrc = audioCtx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;
    noiseSrc.loop = true;

    // Lowpass filter modulating like rolling ocean surf
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, audioCtx.currentTime);

    noiseSrc.connect(filter);
    filter.connect(masterGain);
    noiseSrc.start();

    isPlaying = true;

    // Modulate filter frequency rhythmically (wave cycle every 6-8 seconds)
    let up = true;
    waveTimer = setInterval(() => {
      if (!audioCtx || audioCtx.state === 'closed') return;
      const t = audioCtx.currentTime;
      const targetFreq = up ? 850 : 260;
      filter.frequency.exponentialRampToValueAtTime(targetFreq, t + 4.5);
      up = !up;
    }, 5000);
  } catch (err) {
    console.warn('Web Audio playback error:', err);
    isPlaying = false;
  }
}

export function stopOceanSound() {
  if (waveTimer) clearInterval(waveTimer);
  if (masterGain && audioCtx) {
    try {
      masterGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      setTimeout(() => {
        if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
        audioCtx = null;
        masterGain = null;
      }, 500);
    } catch {}
  }
  isPlaying = false;
}
