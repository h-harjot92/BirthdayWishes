/*
  app.js
  Sequence:
  START -> engine sound + car moves slowly -> speed increases -> show HAPPY BIRTHDAY -> victory sound + confetti -> 2-min countdown -> final message -> Replay
  Friend name: change FRIEND_NAME below or modify page text dynamically.
*/

const FRIEND_NAME = ""; // e.g. "Sam" — set this to personalize

// Elements
const startBtn = document.getElementById('startBtn');
const replayBtn = document.getElementById('replayBtn');
const carEl = document.getElementById('car');
const overlay = document.getElementById('overlay');
const hbText = document.getElementById('hbText');
const countdownEl = document.getElementById('countdown');
const finalMsg = document.getElementById('finalMsg');
const motionLines = document.getElementById('motion-lines');

if (FRIEND_NAME && FRIEND_NAME.trim().length) {
  hbText.textContent = `HAPPY BIRTHDAY ${FRIEND_NAME.toUpperCase()} 🎉`;
} else {
  hbText.textContent = `HAPPY BIRTHDAY 🎉`;
}

// Audio setup using Web Audio API (synthesized engine and victory)
let audioCtx = null;
let engineOsc = null;
let engineGain = null;
let engineRunning = false;

// Timing parameters
const SPEED_RAMP_DURATION = 6000; // ms to ramp to full speed
const INITIAL_SPEED = 0.12; // relative units
const MAX_SPEED = 1.0; // relative units (affects car travel)
const TOTAL_TRAVEL = 0.86; // fraction of track width the car travels (from left to almost right)
const COUNTDOWN_SECONDS = 120; // 2-minute countdown

let animationState = {
  startTime: null,
  lastTimestamp: null,
  speedFactor: INITIAL_SPEED,
  running: false,
  progress: 0 // 0..1 across TOTAL_TRAVEL
};

function ensureAudioContext(){
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function startEngineSynth(){
  ensureAudioContext();
  if (engineRunning) return;
  engineOsc = audioCtx.createOscillator();
  engineGain = audioCtx.createGain();

  // Use sawtooth for gritty engine sound, small detune for character
  engineOsc.type = 'sawtooth';
  engineOsc.frequency.value = 90; // base freq - modulated to simulate revs
  engineOsc.detune.value = -6;

  // Add subtle LFO to frequency to simulate vibration
  const lfo = audioCtx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 6; // 6Hz wobble
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 10;
  lfo.connect(lfoGain);
  lfoGain.connect(engineOsc.frequency);

  // Lowpass filter to shape tone
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1200;

  engineOsc.connect(filter);
  filter.connect(engineGain);
  engineGain.connect(audioCtx.destination);

  engineGain.gain.value = 0.0; // start silent and ramp in
  engineOsc.start();
  lfo.start();

  engineRunning = true;

  // Ramp gain to a comfortable level quickly
  engineGain.gain.cancelScheduledValues(audioCtx.currentTime);
  engineGain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.3);
}

function stopEngineSynth(){
  if (!engineRunning) return;
  // smooth fade-out
  engineGain.gain.cancelScheduledValues(audioCtx.currentTime);
  engineGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
  setTimeout(() => {
    try{
      engineOsc.stop();
    }catch(e){}
    engineOsc.disconnect();
    engineGain.disconnect();
    engineOsc = null;
    engineGain = null;
    engineRunning = false;
  }, 700);
}

// Play a short victory melody using oscillator
function playVictory(){
  ensureAudioContext();
  const now = audioCtx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  const dur = 0.18;
  const g = audioCtx.createGain();
  g.gain.value = 0.0;
  g.connect(audioCtx.destination);

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2500;
  g.connect(filter);
  filter.connect(audioCtx.destination);

  notes.forEach((freq, i) => {
    const o = audioCtx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    o.connect(g);
    o.start(now + i * dur * 1.1);
    o.stop(now + (i+1) * dur * 1.1);
  });

  // short envelope
  g.gain.linearRampToValueAtTime(0.18, now + 0.02);
  g.gain.linearRampToValueAtTime(0.0, now + notes.length * dur * 1.1 + 0.12);
}

// Confetti burst wrapper
function launchConfetti(){
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.3 },
      colors: ['#ff2b2b', '#ffb3b3', '#a70000', '#ffffff']
    });
    confetti({
      particleCount: 90,
      spread: 120,
      origin: { y: 0.6 },
      colors: ['#ff2b2b', '#a70000', '#fff100']
    });
  }
}

// Car movement animation
function updateAnimation(timestamp){
  if (!animationState.running) return;
  if (!animationState.startTime) {
    animationState.startTime = timestamp;
    animationState.lastTimestamp = timestamp;
  }
  const elapsed = timestamp - animationState.startTime;

  // Ramp speedFactor from INITIAL_SPEED to MAX_SPEED over SPEED_RAMP_DURATION
  const t = Math.min(elapsed / SPEED_RAMP_DURATION, 1.0);
  animationState.speedFactor = INITIAL_SPEED + (MAX_SPEED - INITIAL_SPEED) * t;

  // Progress increments based on speedFactor and delta time
  const dt = Math.min(timestamp - animationState.lastTimestamp, 50);
  const travelDelta = (animationState.speedFactor * dt) / 20000; // tuned constant
  animationState.progress = Math.min(animationState.progress + travelDelta, 1.0);

  // Map progress to translateX percentage; start from 4% left to TOTAL_TRAVEL (fraction)
  const startX = 4; // percent
  const endX = 4 + TOTAL_TRAVEL * 100; // percent
  const x = startX + (endX - startX) * animationState.progress;
  // also scale the car a little while speeding for dramatic effect
  const scale = 1 + (animationState.speedFactor - INITIAL_SPEED) * 0.18;

  carEl.style.transform = `translateX(${x}%) scale(${scale})`;

  // Adjust engine frequency with speedFactor
  if (engineOsc) {
    engineOsc.frequency.setTargetAtTime(90 + animationState.speedFactor * 160, audioCtx.currentTime, 0.08);
    // adjust filter or gain to simulate rev
    if (engineGain) {
      engineGain.gain.setTargetAtTime(0.09 + animationState.speedFactor * 0.06, audioCtx.currentTime, 0.06);
    }
  }

  animationState.lastTimestamp = timestamp;

  // if reached near end, clamp
  if (animationState.progress < 1.0) {
    requestAnimationFrame(updateAnimation);
  }
}

// Sequence orchestrator
async function runSequence(){
  // reset states
  overlay.classList.add('hidden');
  finalMsg.classList.add('hidden');
  countdownEl.classList.add('hidden');
  replayBtn.hidden = true;
  startBtn.disabled = true;

  // Start engine and car motion
  startEngineSynth();
  animationState.running = true;
  animationState.startTime = null;
  animationState.lastTimestamp = null;
  animationState.progress = 0;
  requestAnimationFrame(updateAnimation);

  // Make motion lines visible and pulse for speed sensation
  motionLines.style.opacity = '0.75';
  motionLines.animate([{opacity:0.4},{opacity:0.9},{opacity:0.4}], {duration:1200, iterations:Infinity});

  // Ramp period: wait for SPEED_RAMP_DURATION, then show birthday message and victory
  await wait(SPEED_RAMP_DURATION);

  // Show HAPPY BIRTHDAY
  overlay.classList.remove('hidden');
  overlay.style.pointerEvents = 'auto';

  // Play victory sound and confetti
  playVictory();
  launchConfetti();

  // Stop engine after a short time so victory is clearer
  setTimeout(stopEngineSynth, 1000);

  // Start 2-minute countdown
  countdownEl.classList.remove('hidden');
  startCountdown(COUNTDOWN_SECONDS, countdownEl, () => {
    // On finish of countdown
    finalMsg.classList.remove('hidden');
    replayBtn.hidden = false;
    animationState.running = false;
    startBtn.disabled = false;
    motionLines.style.opacity = '0';
  });

  // The overlay (birthday) fades away after a few seconds but can stay a bit
  setTimeout(() => {
    overlay.classList.add('hidden');
    overlay.style.pointerEvents = 'none';
  }, 5000);
}

function wait(ms){ return new Promise(res => setTimeout(res, ms)); }

// Countdown display
function startCountdown(totalSeconds, displayEl, onDone){
  let remaining = totalSeconds;
  displayEl.textContent = formatTime(remaining);
  const interval = setInterval(() => {
    remaining--;
    if (remaining < 0) {
      clearInterval(interval);
      displayEl.textContent = '00:00';
      if (onDone) onDone();
      return;
    }
    displayEl.textContent = formatTime(remaining);
  }, 1000);
}

// Helper: mm:ss
function formatTime(sec){
  const m = Math.floor(sec/60).toString().padStart(2,'0');
  const s = (sec % 60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

// Replay resets UI
function resetAll(){
  // reset audio
  stopEngineSynth();
  // reset animation
  animationState.running = false;
  animationState.progress = 0;
  animationState.startTime = null;
  animationState.lastTimestamp = null;
  carEl.style.transform = `translateX(4%) scale(1)`;
  overlay.classList.add('hidden');
  finalMsg.classList.add('hidden');
  countdownEl.classList.add('hidden');
  replayBtn.hidden = true;
  startBtn.disabled = false;
  motionLines.style.opacity = '0';
}

// UI handlers
startBtn.addEventListener('click', async () => {
  // Some browsers require resume after user gesture
  ensureAudioContext();
  if (audioCtx && audioCtx.state === 'suspended') {
    try { await audioCtx.resume(); } catch(e){}
  }
  runSequence();
});

replayBtn.addEventListener('click', () => {
  resetAll();
});

// initialize layout state
resetAll();


// Accessibility: allow keyboard start with Enter/Space when focused
startBtn.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    startBtn.click();
  }
});
replayBtn.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    replayBtn.click();
  }
});
