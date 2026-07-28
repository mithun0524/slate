#!/usr/bin/env python3
"""
Score for "Trust needs a window" — synthesised, no samples, no licences.

    python3 scripts/score.py            # writes public/score.wav

The film is silent-first (autoplay muted), so this is a tension curve, not a
soundtrack: room tone and a low drone that tighten through the four cost acts,
a hard cut to silence at the turn, one bell, then a calm pad that resolves on
the end card. Every cue is placed off the same frame numbers as the picture
(30fps), so re-timing an act means moving one number here too.
"""

import math
import struct
import wave

SR = 48_000
FPS = 30
DUR = 60.0
N = int(SR * DUR)
buf = [0.0] * N


def t(frame: int) -> float:
    return frame / FPS


def db(x: float) -> float:
    return 10 ** (x / 20)


# deterministic noise — same file every run
_seed = 0x2BAD


def rand() -> float:
    global _seed
    _seed = (1103515245 * _seed + 12345) & 0x7FFFFFFF
    return (_seed / 0x3FFFFFFF) - 1.0


def add(start: float, dur: float, fn):
    """fn(u, i) -> sample, u in [0,1)"""
    a = max(0, int(start * SR))
    b = min(N, a + int(dur * SR))
    if b <= a:
        return
    span = b - a
    for i in range(span):
        buf[a + i] += fn(i / span, i)


def tone(start, dur, freq, amp, decay=None, attack=0.004, wobble=0.0, drift=0.0):
    w = 2 * math.pi / SR

    def fn(u, i):
        f = freq * (1 + drift * u)
        env = min(1.0, (i / SR) / attack) if attack else 1.0
        env *= math.exp(-u * decay) if decay else (1 - u) ** 0.35
        trem = 1 + wobble * math.sin(2 * math.pi * 0.8 * i / SR)
        return amp * env * trem * math.sin(w * f * i)

    add(start, dur, fn)


def sweep(start, dur, f0, f1, amp, curve=1.0):
    phase = [0.0]

    def fn(u, i):
        f = f0 + (f1 - f0) * (u**curve)
        phase[0] += 2 * math.pi * f / SR
        return amp * (1 - u) ** 0.6 * math.sin(phase[0])

    add(start, dur, fn)


def click(start, amp, colour=0.75, dur=0.03):
    """short filtered noise — key press, tick, mechanism"""
    state = [0.0]

    def fn(u, i):
        n = rand()
        state[0] += (n - state[0]) * colour
        return amp * math.exp(-u * 9) * (n - state[0])

    add(start, dur, fn)


def hiss(start, dur, amp, colour=0.06, mod=0.0, shape=lambda u: 1 - u):
    state = [0.0]

    def fn(u, i):
        state[0] += (rand() - state[0]) * colour
        m = 1.0 if mod == 0 else (0.55 + 0.45 * math.sin(2 * math.pi * mod * i / SR))
        return amp * shape(u) * m * state[0]

    add(start, dur, fn)


# ── I. handoff ────────────────────────────────────────────────────────────
# room tone under the whole first half, so the cut to silence at the turn lands
hiss(0.0, t(860), db(-44), colour=0.02, shape=lambda u: 0.4 + 0.6 * u)

for f in range(18, 97, 4):  # the sentence being typed
    click(t(f), db(-30), colour=0.85, dur=0.022)

tone(t(108), 1.1, 44, db(-13), decay=4.2)  # ⏎ — it is not yours any more
hiss(t(108), 0.35, db(-24), colour=0.2, shape=lambda u: u**2)

# ── II–V. the cost ────────────────────────────────────────────────────────
# one drone, tightening: level up, fifth added, tremolo faster by act V
tone(t(150), t(710) - t(150), 55, db(-26), attack=1.4, wobble=0.18)
tone(t(150), t(710) - t(150), 82.5, db(-34), attack=2.6, wobble=0.12)

for i in range(26):  # writes escaping into the dark
    click(t(190 + i * 5.2), db(-38), colour=0.6, dur=0.02)

# the torrent
hiss(t(330), t(520) - t(330), db(-30), colour=0.11, mod=11.0, shape=lambda u: min(1, u * 4))
tone(t(462), 1.8, 77.8, db(-22), decay=2.4)  # one of them touched auth
tone(t(462), 1.6, 466.2, db(-30), decay=3.6)

# the tab tax — a tick per switch, accelerating with the picture
JUMPS = [10, 30, 48, 64, 78, 90, 100, 109, 117, 124, 130, 136, 141, 146, 150, 154, 158, 162]
for i, j in enumerate(JUMPS):
    click(t(520 + j), db(-26 + i * 0.35), colour=0.9, dur=0.026)
    tone(t(520 + j), 0.05, 900 + i * 44, db(-34), decay=14)
hiss(t(600), t(720) - t(600), db(-26), colour=0.09, shape=lambda u: u**1.5)

# buried — scrubbing back, then the wall
sweep(t(744), 2.4, 300, 90, db(-22), curve=0.7)
tone(t(806), 1.2, 38, db(-12), decay=5.0)  # out of buffer
hiss(t(806), 0.5, db(-22), colour=0.3, shape=lambda u: (1 - u) ** 2)

# ── VI. the turn ──────────────────────────────────────────────────────────
# 12 frames of nothing at all, then one bell while the seam draws
tone(t(872), 4.0, 220, db(-17), decay=1.4, attack=0.01)
tone(t(872), 4.4, 329.6, db(-23), decay=1.2, attack=0.02)
tone(t(872), 3.0, 55, db(-15), decay=2.2, attack=0.01)
hiss(t(870), 0.9, db(-30), colour=0.14, shape=lambda u: (1 - u) ** 1.4)

# ── VII–VIII. cause and effect, then mechanism ────────────────────────────
tone(t(980), t(1460) - t(980), 110, db(-30), attack=2.0)
tone(t(980), t(1460) - t(980), 164.8, db(-36), attack=3.0)

for beat in (1016, 1126, 1220):  # each impulse crossing the seam
    hiss(t(beat), 0.4, db(-28), colour=0.25, shape=lambda u: math.sin(math.pi * u))
    tone(t(beat), 0.5, 330, db(-30), decay=6.0)

for i in range(3):  # the pipeline assembling
    click(t(1310 + 4 + i * 16), db(-30), colour=0.95, dur=0.03)
for i in range(5):  # classifier.rs, line by line
    click(t(1310 + 58 + i * 6), db(-36), colour=0.95, dur=0.02)

# ── IX–XI. relief, trust, mark ────────────────────────────────────────────
tone(t(1460), t(1690) - t(1460), 130.8, db(-27), attack=1.2)
tone(t(1460), t(1690) - t(1460), 196.0, db(-33), attack=1.8)
sweep(t(1470), 2.0, 420, 120, db(-30), curve=1.4)  # the meter draining

for i in range(5):  # spec sheet
    click(t(1608 + i * 7), db(-34), colour=0.9, dur=0.024)

# end card — the only consonant chord in the film
for f, a in ((130.8, -20), (196.0, -25), (261.6, -24), (392.0, -30)):
    tone(t(1690), DUR - t(1690), f, db(a), attack=0.9, decay=0.35)

# ── master ────────────────────────────────────────────────────────────────
fade_in, fade_out = int(0.08 * SR), int(0.5 * SR)
peak = max(abs(s) for s in buf) or 1.0
target = db(-1.5) / peak

with wave.open("public/score.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    frames = bytearray()
    for i, s in enumerate(buf):
        x = math.tanh(s * target * 1.05)
        if i < fade_in:
            x *= i / fade_in
        if i > N - fade_out:
            x *= (N - i) / fade_out
        v = int(max(-1.0, min(1.0, x)) * 32000)
        frames += struct.pack("<hh", v, v)
    w.writeframes(bytes(frames))

print(f"public/score.wav · {DUR}s · peak {20 * math.log10(peak):.1f} dBFS pre-normalise")
