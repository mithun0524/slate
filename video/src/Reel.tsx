import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from "remotion";
import { loadFont as loadSans } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { P } from "./palette";
import {
  BigNumber, CLAMP, Flash, FPS, Grade, LogField, Nebula, SlitWipe, TypeBed, Words,
  easeOut, lerp, pulse, ramp,
} from "./cine";
import { App, Shell, Term, type TermLine } from "./chrome";
import { ActivityPane, AuthDiffPane, SpecCheckPane } from "./panes";
import { C } from "./theme";

const { fontFamily: SANS } = loadSans();
const { fontFamily: MONO } = loadMono();

/* ══ the reel ═════════════════════════════════════════════════
   30 seconds. Five acts, each with its own colour, and one camera that
   never really stops moving.

     0.0  DARK    blue    you handed the work to something tireless
     3.0  BLIND   blue    it worked. you couldn't watch.
     7.0  ALARM   red     41 files. one of them was auth.
    10.0  TURN    warm    the product arrives out of the dark
    14.0  PROOF   keyed   it follows the work, view by view
    23.0  CALM    green   now you see everything it does
    27.0  END     green   the name

   Rules this file keeps to, because breaking them is what made the
   earlier cuts feel like a slide deck:
     · nothing crossfades. cuts are flashes, slit wipes, or camera moves.
     · nothing sits still. if a layer is on screen it is drifting.
     · the grade changes per act — the frame is never grey-on-grey.
     · text is staged out of depth, never faded in place.                */

const ACTS = {
  dark: 90,     // 3.0s
  blind: 120,   // 4.0s
  alarm: 90,    // 3.0s
  turn: 120,    // 4.0s
  proof: 270,   // 9.0s
  calm: 120,    // 4.0s
  end: 90,      // 3.0s
} as const;

export const TOTAL_REEL = Object.values(ACTS).reduce((a, b) => a + b, 0);

const AT = (() => {
  let n = 0;
  const o = {} as Record<keyof typeof ACTS, number>;
  for (const k of Object.keys(ACTS) as (keyof typeof ACTS)[]) { o[k] = n; n += ACTS[k]; }
  return o;
})();

/* ── the grade ───────────────────────────────────────────────
   One colour per act, cross-faded on the act boundaries so the frame is
   never neutral. This layer alone is most of why the reel reads warmer
   than the earlier cuts. */

const hueAt = (frame: number) => {
  if (frame < AT.alarm) return { a: P.blue, b: P.blueDeep, power: 0.9 };
  if (frame < AT.turn) {
    const p = ramp(frame, AT.alarm, AT.alarm + 10);
    return { a: p > 0.5 ? P.red : P.blue, b: P.redDeep, power: 1 };
  }
  if (frame < AT.proof) return { a: P.amber, b: P.violet, power: 0.75 };
  if (frame < AT.calm) {
    const seg = Math.floor((frame - AT.proof) / 90);
    return { a: [P.violet, P.green, P.amber][seg] ?? P.green, b: P.blueDeep, power: 1 };
  }
  return { a: P.green, b: P.greenDeep, power: 0.85 };
};

/* ── act 1 + 2: the dark, and the blindness ─────────────────── */

const Dark: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame >= AT.alarm) return null;

  /* the log field starts far away and accelerates past the camera */
  const logIn = ramp(frame, AT.blind - 20, AT.blind + 30);
  const dolly = interpolate(frame, [0, AT.alarm], [0, -160], CLAMP);

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, opacity: logIn, transform: `scale(${lerp(1.3, 1, logIn)})` }}>
        <LogField frame={frame} from={AT.blind} font={MONO} tint={P.blue} />
      </div>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translateZ(${dolly}px)` }}>
        {frame < AT.blind && (
          <div style={{ transform: `translateY(${interpolate(frame, [0, AT.blind], [0, -30], CLAMP)}px)` }}>
            <TypeBed>
              <Words frame={frame} from={8} font={SANS} text="You handed it the keys."
                size={106} accent={P.blue} accentWords={[3]} />
            </TypeBed>
          </div>
        )}

        {frame >= AT.blind + 26 && (
          <div style={{
            textAlign: "center",
            transform: `scale(${lerp(0.94, 1, ramp(frame, AT.blind + 26, AT.blind + 50, easeOut))})`,
          }}>
            <TypeBed h={520}>
              <Words frame={frame} from={AT.blind + 26} font={SANS} text="It worked all night."
                size={92} color={P.white} />
              <div style={{ marginTop: 22 }}>
                <Words frame={frame} from={AT.blind + 44} font={SANS} text="You watched none of it."
                  size={62} color={P.mute} weight={520} />
              </div>
            </TypeBed>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ── act 3: the alarm ────────────────────────────────────────
   The only red in the film. Shake, a hot line in the log, and a number
   big enough to be uncomfortable. */

const Alarm: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < AT.alarm || frame >= AT.turn) return null;
  const f = frame - AT.alarm;

  /* a short, decaying camera shake on the hit — not a loop */
  const shake = Math.max(0, 1 - f / 22);
  const sx = Math.sin(f * 2.1) * 13 * shake;
  const sy = Math.cos(f * 2.7) * 9 * shake;

  return (
    <AbsoluteFill style={{ transform: `translate(${sx}px, ${sy}px)` }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
        <LogField frame={frame} from={AT.blind} font={MONO} tint={P.red} hot={5} />
      </div>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <TypeBed w={1600} h={760}>
         <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 26 }}>
            <BigNumber frame={frame} from={AT.alarm + 2} to={AT.alarm + 30} value={41} font={SANS} color={P.white} />
            <span style={{ fontFamily: SANS, fontSize: 76, fontWeight: 600, color: P.mute, letterSpacing: "-.04em" }}>
              files
            </span>
          </div>
          <div style={{ marginTop: -6 }}>
            <Words frame={frame} from={AT.alarm + 38} font={SANS} text="One of them was auth."
              size={72} color={P.white} accent={P.red} accentWords={[4]} />
          </div>
         </div>
        </TypeBed>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ── act 4 + 5: the product ──────────────────────────────────
   The window flies in out of depth on a rotateY, then the camera works
   it: push, whip, settle. The pane content and the backdrop hue change
   together, so a view switch is also a colour cut. */

const TERM_REEL: TermLine[] = [
  { at: 0.0, text: "$ claude", ink: C.fg, type: true, dur: 0.35 },
  { at: 0.5, text: "› harden the checkout retry path", ink: C.dim, type: true, dur: 0.8 },
  { at: 1.6, text: "", ink: C.dim },
  { at: 1.8, head: "●", text: "Read docs/retry.md", ink: C.dim },
  { at: 2.9, head: "●", text: "Write src/checkout/retry.ts", ink: C.ok },
  { at: 3.1, head: "●", text: "Write src/checkout/backoff.ts", ink: C.ok },
  { at: 4.6, head: "●", text: "Edit src/auth/session.ts", ink: C.ok },
  { at: 5.4, head: "◍", text: "note: auth touched", ink: C.warn },
  { at: 7.0, head: "✓", text: "12 tests passed", ink: C.ok },
];

/** the camera rig — one continuous move across turn → proof → calm */
const camera = (frame: number) => {
  if (frame < AT.proof) {
    /* arrival: out of depth, swinging square to the lens */
    const p = ramp(frame, AT.turn + 6, AT.turn + 74, easeOut);
    return { scale: lerp(0.42, 0.92, p), ry: lerp(-38, 0, p), rx: lerp(14, 0, p), z: lerp(-900, 0, p), x: 0, blur: (1 - p) * 6 };
  }
  if (frame < AT.calm) {
    const f = frame - AT.proof;
    /* three moves, one per view: push in, whip left, pull back and settle */
    if (f < 90) {
      const p = ramp(frame, AT.proof, AT.proof + 90);
      return { scale: lerp(0.92, 1.26, p), ry: lerp(0, -5, p), rx: 0, z: 0, x: lerp(0, -120, p), blur: 0 };
    }
    if (f < 180) {
      const p = ramp(frame, AT.proof + 90, AT.proof + 180);
      const whip = pulse(frame, AT.proof + 96, 9);
      return { scale: lerp(1.26, 1.5, p), ry: lerp(-5, 4, p), rx: 0, z: 0, x: lerp(-120, -560, p), blur: whip * 14 };
    }
    const p = ramp(frame, AT.proof + 180, AT.proof + 270);
    const whip = pulse(frame, AT.proof + 186, 9);
    return { scale: lerp(1.5, 1.05, p), ry: lerp(4, 0, p), rx: lerp(0, -3, p), z: 0, x: lerp(-560, 240, p), blur: whip * 14 };
  }
  /* calm: pull all the way back out */
  const p = ramp(frame, AT.calm, AT.calm + 70);
  return { scale: lerp(1.05, 0.66, p), ry: 0, rx: 0, z: 0, x: lerp(240, 0, p), blur: 0 };
};

const Product: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < AT.turn + 6 || frame >= AT.end) return null;

  const cam = camera(frame);
  const t = (frame - AT.turn - 6) / FPS;

  /* Pane B follows the same clock the terminal does, and each segment is
     matched to the type stab over it — "Spec." must not sit on a diff. */
  const seg = frame < AT.proof ? 0 : Math.floor((frame - AT.proof) / 90);
  const paneB = seg >= 2
    ? <ActivityPane t={(frame - AT.proof - 180) / FPS} mono={MONO} sans={SANS} steps={[0.3, 1.4, 2.4]} />
    : seg === 1
      ? <AuthDiffPane t={(frame - AT.proof - 90) / FPS} at={0.1} mono={MONO} />
      : <SpecCheckPane t={0} mono={MONO} sans={SANS} tickAt={1e6} tickRow={1} />;
  const tab = seg >= 2 ? "activity" : seg === 1 ? "diff" : "specs";

  const glow = [P.violet, P.green, P.amber][Math.min(2, seg)] ?? P.green;

  return (
    <AbsoluteFill style={{ perspective: 2000, alignItems: "center", justifyContent: "center" }}>
      <div style={{
        transformStyle: "preserve-3d",
        transform: `translateX(${cam.x}px) translateZ(${cam.z}px) rotateY(${cam.ry}deg) rotateX(${cam.rx}deg) scale(${cam.scale})`,
        filter: cam.blur > 0.2 ? `blur(${cam.blur}px)` : "none",
      }}>
        {/* the light the window throws into the room */}
        <div style={{
          position: "absolute", inset: -120, borderRadius: 60,
          background: `radial-gradient(closest-side, ${glow}4a, transparent 74%)`,
          filter: "blur(60px)",
        }} />
        {frame < AT.proof
          ? <App t={t} mono={MONO} sans={SANS} />
          : (
            <Shell
              mono={MONO} sans={SANS} activeTab={tab} changes={6}
              source={seg >= 2 ? "you" : "classifier"}
              pulse={pulse(frame, AT.proof + seg * 90, 14)}
              term={<Term t={t} mono={MONO} sans={SANS} lines={TERM_REEL} />}
              paneB={paneB}
            />
          )}
      </div>
    </AbsoluteFill>
  );
};

/* type stabs that ride over the product without explaining it */
const ProofType: React.FC<{ frame: number }> = ({ frame }) => {
  const beats: [number, string, string][] = [
    [AT.turn + 78, "It was watching too.", P.amber],
    [AT.proof + 16, "Spec.", P.violet],
    [AT.proof + 106, "Diff.", P.green],
    [AT.proof + 196, "Every step, kept.", P.amber],
  ];
  const hit = beats.filter(([f]) => frame >= f && frame < f + 62).pop();
  if (!hit) return null;
  const [from, text, color] = hit;

  const o = interpolate(frame, [from, from + 4, from + 50, from + 62], [0, 1, 1, 0], CLAMP);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 96, opacity: o }}>
      <div style={{
        fontFamily: SANS, fontSize: 58, fontWeight: 620, letterSpacing: "-.04em", color: P.white,
        textShadow: `0 0 60px ${color}88, 0 4px 30px #000`,
      }}>
        {text}
      </div>
    </AbsoluteFill>
  );
};

/* ── act 6: calm ─────────────────────────────────────────────── */

const Calm: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < AT.calm + 24 || frame >= AT.end) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", marginTop: -260 }}>
        <TypeBed h={420}>
          <Words frame={frame} from={AT.calm + 24} font={SANS} text="Now you see all of it."
            size={88} accent={P.green} accentWords={[2]} />
        </TypeBed>
      </div>
    </AbsoluteFill>
  );
};

/* ── act 7: the name ─────────────────────────────────────────── */

const EndCard: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < AT.end) return null;
  const a = spring({ frame: frame - AT.end, fps: FPS, config: { damping: 200, mass: 0.6 } });
  const b = spring({ frame: frame - AT.end - 12, fps: FPS, config: { damping: 200 } });
  const c = spring({ frame: frame - AT.end - 24, fps: FPS, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: MONO, fontSize: 132, fontWeight: 500, letterSpacing: "-.07em", color: P.white,
          opacity: a, transform: `scale(${0.9 + a * 0.1})`,
          textShadow: `0 0 120px ${P.green}55`,
        }}>
          slate
        </div>
        <div style={{
          marginTop: 10, fontFamily: SANS, fontSize: 30, color: P.mute, letterSpacing: "-.02em",
          opacity: b, transform: `translateY(${(1 - b) * 14}px)`,
        }}>
          A terminal with a second brain attached.
        </div>
        <div style={{
          marginTop: 34, display: "inline-block", padding: "12px 28px", borderRadius: 100,
          border: `1px solid ${P.green}55`, background: `${P.green}14`,
          fontFamily: MONO, fontSize: 19, color: P.green, letterSpacing: ".06em",
          opacity: c, transform: `translateY(${(1 - c) * 14}px)`,
        }}>
          slate.tools
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ── assembly ────────────────────────────────────────────────── */

export const SlateReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { a, b, power } = hueAt(frame);

  return (
    <AbsoluteFill style={{ background: P.ink, fontFamily: SANS }}>
      <Nebula frame={frame} hue={a} hue2={b} power={power} />

      {/* the alarm→turn cut is a slit wipe: the frame pinches shut on the
          red and opens on the product. It is the film's only hard reset. */}
      <SlitWipe frame={frame} at={AT.turn - 14} len={28} color={P.white}>
        <Dark frame={frame} />
        <Alarm frame={frame} />
        <Product frame={frame} />
        <ProofType frame={frame} />
        <Calm frame={frame} />
        <EndCard frame={frame} />
      </SlitWipe>

      <Flash frame={frame} at={AT.alarm} color={P.red} len={5} />
      <Flash frame={frame} at={AT.proof + 90} color={P.green} len={3} />
      <Flash frame={frame} at={AT.proof + 180} color={P.amber} len={3} />

      <Grade frame={frame} vignette={frame < AT.turn ? "#04050a" : "#000"} strength={frame < AT.proof ? 1 : 0.6} />
    </AbsoluteFill>
  );
};
