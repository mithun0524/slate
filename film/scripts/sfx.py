#!/usr/bin/env python3
"""
Pull the film's sound effects from Freesound — CC0 only, no attribution owed.

    python3 scripts/sfx.py            # → public/sfx/*.wav + public/sfx/CREDITS.md

Needs FREESOUND_API_KEY in film/.env.local (free: freesound.org/apiv2/apply).

Why not the five hosted samples we started with: five generic sounds used seventy
times is what "cheap" sounds like. Each cue below asks for a *specific* recording
with its own character, and the mix uses far fewer hits.

Only `license:"Creative Commons 0"` is requested, so nothing here needs credit —
CREDITS.md is written anyway, because knowing where a sound came from is worth
more than the line it saves.

The API serves search plus previews without OAuth; originals need a user token we
do not have. Previews are 128–192 kbps mp3, which for a sub-second one-shot sitting
under a bed and a voice is indistinguishable from the original.
"""

import json
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public/sfx"

key = None
env = ROOT / ".env.local"
if env.exists():
    for line in env.read_text().splitlines():
        if line.startswith("FREESOUND_API_KEY="):
            key = line.split("=", 1)[1].strip()
if not key:
    raise SystemExit(
        "No FREESOUND_API_KEY.\n"
        "  get one: https://freesound.org/apiv2/apply/\n"
        "  then:    printf 'FREESOUND_API_KEY=%s\\n' 'key' >> film/.env.local"
    )

# name → list of (query, duration window) candidates, tried in order until one
# returns something CC0. A single query is too brittle: the CC0 filter throws away
# most of Freesound, so each cue needs a few ways of asking.
CUES = {
    "key": [("mechanical keyboard key press", (0.05, 0.6)), ("keyboard key", (0.03, 0.8))],
    "tick": [("click", (0.01, 0.3)), ("button click", (0.02, 0.5)), ("switch click", (0.02, 0.6))],
    "impact": [("cinematic impact hit", (0.5, 4.0)), ("boom low impact", (0.4, 4.0)),
               ("deep hit", (0.3, 3.0))],
    "sub": [("sub drop bass", (0.5, 4.0)), ("bass drop deep", (0.4, 5.0))],
    "whoosh": [("whoosh transition", (0.15, 1.2)), ("swish", (0.1, 1.0))],
    "riser": [("riser", (1.0, 6.0)), ("tension rise", (1.0, 8.0)), ("sweep up", (0.8, 6.0)),
              ("build up", (1.0, 8.0))],
    "alert": [("notification", (0.2, 2.0)), ("error tone", (0.2, 2.0)), ("beep low", (0.1, 1.5))],
    "bell": [("bell single", (0.8, 6.0)), ("chime", (0.5, 6.0)), ("singing bowl", (1.0, 8.0)),
             ("metal resonance", (0.8, 6.0))],
    "paper": [("page turn", (0.2, 1.2)), ("paper", (0.15, 1.5))],
}

AVOID = set("loop music song drums melody vocal speech talk war gun explosion siren game long".split())

# The first CC0 hit is often the wrong *kind* of sound — "Water Click" for a UI
# tick, "toaster oven ding" for a bell. So each cue also declares what its name
# must and must not contain, and a sound already taken cannot be reused.
WANT = {
    "key": ({"key", "keyboard", "keypress", "typewriter"}, {"water", "car", "lock", "door"}),
    "tick": ({"click", "tick", "button"}, {"water", "tongue", "camera", "gun", "pen", "mouse"}),
    "impact": ({"impact", "boom", "hit", "slam", "thud"}, {"drop", "whoosh", "riser", "glass"}),
    "sub": ({"sub", "bass", "drop", "low"}, {"guitar", "string", "808 loop"}),
    "whoosh": ({"whoosh", "woosh", "swish", "swoosh", "transition"}, {"riser", "wind"}),
    "riser": ({"riser", "rise", "build", "sweep", "tension"}, {"drop", "fall"}),
    "alert": ({"notification", "alert", "error", "beep", "tone"}, {"phone ring", "alarm clock"}),
    "bell": ({"bell", "chime", "bowl", "resonance", "ping"}, {"toaster", "oven", "microwave",
                                                             "door", "cow", "bike", "school"}),
    "paper": ({"page", "paper", "sheet", "book"}, {"crumple", "tear", "bag"}),
}

# Approved by ear and pinned by id — search ranking shifts as Freesound's download
# counts move, and a re-run must not quietly swap a sound the film was cut against.
PINNED = {
    "bell": 562196,  # glass ping — the turn. A real bell read as a church bell.
}

taken: set[int] = set()


def by_id(sound_id: int):
    q = urllib.parse.urlencode(
        {
            "fields": "id,name,username,license,duration,previews,num_downloads",
            "token": key,
        }
    )
    with urllib.request.urlopen(f"https://freesound.org/apiv2/sounds/{sound_id}/?{q}") as r:
        return [json.load(r)]


def search(cue: str, query: str, dmin: float, dmax: float):
    q = urllib.parse.urlencode(
        {
            "query": query,
            "filter": f'license:"Creative Commons 0" duration:[{dmin} TO {dmax}]',
            "fields": "id,name,username,license,duration,previews,avg_rating,num_downloads",
            "sort": "downloads_desc",
            "page_size": 12,
            "token": key,
        }
    )
    with urllib.request.urlopen(f"https://freesound.org/apiv2/search/text/?{q}") as r:
        results = json.load(r).get("results", [])
    must, never = WANT.get(cue, (set(), set()))

    def words(x):
        return set(x["name"].lower().replace("_", " ").replace(".wav", "").split())

    def score(x):
        w = words(x)
        n = x["name"].lower()
        if x["id"] in taken or (AVOID & w) or any(b in n for b in never):
            return -1
        return (2 if (must & w) else 0) + min(x["num_downloads"], 20000) / 20000

    ranked = sorted((x for x in results if score(x) > 0), key=score, reverse=True)
    return ranked[:1]


OUT.mkdir(parents=True, exist_ok=True)
credits = ["# Sound effects\n", "All CC0 (public domain) — no attribution required.\n"]

for name, candidates in CUES.items():
    hit = by_id(PINNED[name]) if name in PINNED else []
    for query, (dmin, dmax) in ([] if hit else candidates):
        hit = search(name, query, dmin, dmax)
        if hit:
            break
    if not hit:
        print(f"✗ {name}: nothing CC0 matched any of {[q for q, _ in candidates]}")
        continue
    s = hit[0]
    taken.add(s["id"])
    url = s["previews"]["preview-hq-mp3"]
    tmp = OUT / f"{name}.mp3"
    urllib.request.urlretrieve(url, tmp)
    # everything downstream expects 48k 16-bit wav
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(tmp), "-ar", "48000", "-sample_fmt", "s16",
         str(OUT / f"{name}.wav")],
        check=True,
    )
    tmp.unlink()
    print(f"✓ {name:<7} {s['duration']:.2f}s  ↓{s['num_downloads']:<7} {s['name'][:44]}")
    credits.append(
        f"- **{name}** — [{s['name']}](https://freesound.org/s/{s['id']}/) "
        f"by {s['username']} · {s['license'].split('/')[-2] if '/' in s['license'] else s['license']}\n"
    )

(OUT / "CREDITS.md").write_text("".join(credits))
print(f"\n{len(list(OUT.glob('*.wav')))} effects in public/sfx/ · CREDITS.md written")
