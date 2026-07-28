#!/usr/bin/env python3
"""
Lay the real sound effects and the voiceover over the synthesised bed.

    python3 scripts/score.py     # public/bed.wav   (drones, subs, pads)
    node    scripts/vo.mjs       # public/vo/NN.mp3 (ElevenLabs)
    python3 scripts/mix.py       # public/mix.wav   ← what the film plays

Runs fine before the voiceover exists: it mixes bed + effects and says so.

Every cue is a frame number at 30fps, matching the picture. Effects are real CC0
recordings, one per cue (scripts/sfx.py pulls them from Freesound) — the first
pass used five generic samples seventy times, and that density with that little
variety is exactly what "cheap" sounds like. This pass is nine distinct sounds at
roughly a third the hits.

The keyboard fires on every fourth character, not every character: a hit per
character is a typewriter, not a person.

The bed ducks 9 dB under the voice; the effects duck 3.5 dB, so a tick that lands
under a line still cuts through.
"""

import array
import math
import struct
import subprocess
import wave
from pathlib import Path

SR = 48_000
FPS = 30
ROOT = Path(__file__).resolve().parent.parent
SFX = ROOT / "public/sfx"
VO = ROOT / "public/vo"

DUCK_DB = -9.0  #  how far the bed drops under the voice
DUCK_SFX_DB = -3.5
ATTACK = 0.14  #  seconds
RELEASE = 0.34


def db(x: float) -> float:
    return 10 ** (x / 20)


def t(frame: float) -> float:
    return frame / FPS


# ── io ────────────────────────────────────────────────────────────────────


def read_wav(path: Path) -> tuple[list[float], list[float]]:
    """Any wav → two float channels at SR, linearly resampled."""
    with wave.open(str(path), "rb") as w:
        n, ch, sw, sr = w.getnframes(), w.getnchannels(), w.getsampwidth(), w.getframerate()
        raw = w.readframes(n)
    if sw != 2:
        raise SystemExit(f"{path.name}: only 16-bit wavs supported")
    samples = array.array("h")
    samples.frombytes(raw)
    left = [samples[i * ch] / 32768 for i in range(n)]
    right = [samples[i * ch + (1 if ch > 1 else 0)] / 32768 for i in range(n)]
    if sr == SR:
        return left, right
    ratio = SR / sr
    out_n = int(n * ratio)

    def resample(src):
        out = []
        for i in range(out_n):
            x = i / ratio
            a = int(x)
            b = min(a + 1, n - 1)
            f = x - a
            out.append(src[a] * (1 - f) + src[b] * f)
        return out

    return resample(left), resample(right)


def decode_mp3(path: Path) -> list[float]:
    """ffmpeg is the only mp3 decoder available to the stdlib world."""
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
        capture_output=True,
        check=True,
    ).stdout
    s = array.array("h")
    s.frombytes(raw[: len(raw) // 2 * 2])
    return [v / 32768 for v in s]


# ── placement ─────────────────────────────────────────────────────────────

bedL, bedR = read_wav(ROOT / "public/bed.wav")
N = len(bedL)
fxL = [0.0] * N
fxR = [0.0] * N
voM = [0.0] * N

_cache: dict[str, tuple[list[float], list[float]]] = {}


def sfx(name: str):
    if name not in _cache:
        _cache[name] = read_wav(SFX / f"{name}.wav")
    return _cache[name]


def place(name: str, frame: float, gain_db: float, trim: float | None = None, reverse=False):
    """Drop one effect at one frame. `trim` keeps only the first N seconds."""
    L, R = sfx(name)
    if trim:
        k = int(trim * SR)
        L, R = L[:k], R[:k]
        fade = int(0.012 * SR)  #  never cut a waveform dead — it clicks
        for i in range(min(fade, len(L))):
            g = 1 - i / fade
            L[-1 - i] *= g
            R[-1 - i] *= g
    if reverse:
        L, R = L[::-1], R[::-1]
    g = db(gain_db)
    start = int(t(frame) * SR)
    for i in range(len(L)):
        j = start + i
        if 0 <= j < N:
            fxL[j] += L[i] * g
            fxR[j] += R[i] * g


# I. the sentence being typed on a real keyboard, then the keypress that gives
#    it away. Every fourth character — a hit per character is a typewriter, not a
#    person, and the ear only needs the rhythm.
for i, f in enumerate(range(18, 97, 4)):
    place("key", f, -25 + (i % 3) * 0.9, trim=0.16)
place("sub", 108, -11)
place("whoosh", 108, -19)

# II. writes escaping into the dark — eight, not twenty-six. The picture already
#     shows twenty-six; the ear reads eight as "many" and seventy as "cheap".
for i in range(8):
    place("tick", 190 + i * 13, -31)

# III. the torrent, then the line that mattered
place("whoosh", 330, -22)
place("alert", 462, -23)
place("whoosh", 462, -24, reverse=True)

# IV. a tick per context switch (every other one), under the only build in the film
JUMPS = [10, 30, 48, 64, 78, 90, 100, 109, 117, 124, 130, 136, 141, 146, 150, 154, 158, 162]
for i, j in enumerate(JUMPS):
    if i % 2 == 0:
        place("tick", 520 + j, -28 + i * 0.4)
place("riser", 646, -21)

# V. scrubbing back, then the wall
place("whoosh", 744, -18, reverse=True)
place("impact", 806, -14)
place("sub", 806, -11)

# VI. the turn. A glass ping, because a bell sounded like a church.
place("bell", 872, -11)

# VII. each impulse crossing the seam
for f in (1016, 1126, 1220):
    place("whoosh", f, -22)

# VIII. the pipeline assembling, then classifier.rs line by line
for i in range(3):
    place("tick", 1314 + i * 16, -27)
for i in range(5):
    place("tick", 1368 + i * 6, -33)

# IX. the ghost chrome collapsing into the seam
place("whoosh", 1506, -18, reverse=True)

# X. the spec sheet landing
place("paper", 1608, -22)

# XI. the mark — the ping again, quieter: the film ends where it turned
place("bell", 1694, -21)

# ── voice ─────────────────────────────────────────────────────────────────

import json

cfg = json.loads((ROOT / "scripts/vo-script.json").read_text())
spoken = 0
for line in cfg["lines"]:
    path = VO / f"{line['id']}.mp3"
    if not path.exists():
        continue
    mono = decode_mp3(path)
    start = int(t(line["f"]) * SR)
    for i, v in enumerate(mono):
        j = start + i
        if 0 <= j < N:
            voM[j] += v
    spoken += 1

# ── ducking ───────────────────────────────────────────────────────────────

# envelope from where the voice actually is, smoothed asymmetrically
env = [0.0] * N
win = int(0.02 * SR)
peak_hold = 0.0
for i in range(0, N, win):
    block = max((abs(v) for v in voM[i : i + win]), default=0.0)
    peak_hold = block if block > peak_hold else peak_hold * 0.86
    for j in range(i, min(i + win, N)):
        env[j] = 1.0 if peak_hold > 0.02 else 0.0

atk = 1 / (ATTACK * SR)
rel = 1 / (RELEASE * SR)
smooth = [0.0] * N
cur = 0.0
for i in range(N):
    target = env[i]
    cur = min(cur + atk, target) if target > cur else max(cur - rel, target)
    smooth[i] = cur

# ── sum, limit, write ─────────────────────────────────────────────────────

outL = [0.0] * N
outR = [0.0] * N
for i in range(N):
    d = smooth[i]
    bg = db(DUCK_DB * d)
    fg = db(DUCK_SFX_DB * d)
    v = voM[i] * db(-1.5)
    outL[i] = bedL[i] * bg + fxL[i] * fg + v
    outR[i] = bedR[i] * bg + fxR[i] * fg + v

peak = max(max(abs(x) for x in outL), max(abs(x) for x in outR)) or 1.0
target = db(-1.2) / peak
fade_in, fade_out = int(0.05 * SR), int(0.5 * SR)

with wave.open(str(ROOT / "public/mix.wav"), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    frames = bytearray()
    for i in range(N):
        gl = math.tanh(outL[i] * target * 1.04)
        gr = math.tanh(outR[i] * target * 1.04)
        if i < fade_in:
            gl *= i / fade_in
            gr *= i / fade_in
        if i > N - fade_out:
            g = (N - i) / fade_out
            gl *= g
            gr *= g
        frames += struct.pack("<hh", int(gl * 32000), int(gr * 32000))
    w.writeframes(bytes(frames))

print(
    f"public/mix.wav · {N / SR:.1f}s · {spoken}/{len(cfg['lines'])} voice lines"
    + ("" if spoken else "  (run scripts/vo.mjs for the voiceover)")
)
