"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Trophy, Sparkles, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";

/* ============ SHARED ============ */
type Leader = { playerName: string; gameType: string; score: number; level: number; createdAt: string };

function useSound() {
  const [muted, setMuted] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const beep = useCallback(
    (freq: number, dur = 0.12, type: OscillatorType = "sine") => {
      if (muted) return;
      try {
        if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const ctx = ctxRef.current;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.18, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + dur);
      } catch { /* ignore */ }
    },
    [muted]
  );
  return { beep, muted, setMuted };
}

/* ============ GAME 1: TANGKAP BAHAN ============ */
const GOOD = ["🌶️", "🍗", "🥩", "🧄", "🥥", "🍚", "🥔", "🧅"];
const BAD = ["🦠", "🪳", "💩"];

type Falling = { id: number; emoji: string; x: number; y: number; speed: number; bad: boolean };

function CatchGame({ beep, onFinish }: { beep: (f: number, d?: number, t?: OscillatorType) => void; onFinish: (score: number, level: number) => void }) {
  const [playing, setPlaying] = useState(false);
  const [items, setItems] = useState<Falling[]>([]);
  const [basketX, setBasketX] = useState(50);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [time, setTime] = useState(45);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const areaRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const stateRef = useRef({ score: 0, lives: 3, time: 45, level: 1, basketX: 50, playing: false });

  const stop = useCallback(
    (finalScore: number, finalLevel: number) => {
      stateRef.current.playing = false;
      setPlaying(false);
      setItems([]);
      onFinish(finalScore, finalLevel);
    },
    [onFinish]
  );

  const start = () => {
    stateRef.current = { score: 0, lives: 3, time: 45, level: 1, basketX: 50, playing: true };
    setScore(0);
    setLives(3);
    setTime(45);
    setLevel(1);
    setCombo(0);
    setItems([]);
    setPlaying(true);
    beep(523, 0.15, "square");
  };

  // game loop
  useEffect(() => {
    if (!playing) return;
    const spawnTimer = setInterval(() => {
      const s = stateRef.current;
      if (!s.playing) return;
      const isBad = Math.random() < 0.16;
      const emoji = isBad ? BAD[Math.floor(Math.random() * BAD.length)] : GOOD[Math.floor(Math.random() * GOOD.length)];
      const speed = 1.1 + Math.random() * 1.4 + s.level * 0.35;
      idRef.current += 1;
      const it: Falling = { id: idRef.current, emoji, x: 5 + Math.random() * 90, y: -6, speed, bad: isBad };
      setItems((p) => [...p.slice(-24), it]);
    }, Math.max(320, 700 - level * 60));

    const moveTimer = setInterval(() => {
      const s = stateRef.current;
      if (!s.playing) return;
      setItems((prev) => {
        const next: Falling[] = [];
        for (const it of prev) {
          const ny = it.y + it.speed;
          // tangkap? area keranjang di y 82-95, toleransi x 9
          if (ny >= 80 && ny <= 97 && Math.abs(it.x - s.basketX) < 10) {
            if (it.bad) {
              s.lives -= 1;
              setLives(s.lives);
              setCombo(0);
              beep(160, 0.25, "sawtooth");
              if (s.lives <= 0) {
                setTimeout(() => stop(s.score, s.level), 50);
              }
            } else {
              const gained = 10 + Math.min(40, combo * 2);
              s.score += gained;
              setScore(s.score);
              setCombo((c) => c + 1);
              beep(660 + Math.min(400, combo * 20), 0.1, "square");
              const nl = Math.floor(s.score / 250) + 1;
              if (nl !== s.level) {
                s.level = nl;
                setLevel(nl);
                beep(880, 0.2, "square");
              }
            }
            continue; // hapus item
          }
          if (ny > 102) {
            if (!it.bad) {
              // bahan bagus jatuh = combo reset
              setCombo(0);
            }
            continue;
          }
          next.push({ ...it, y: ny });
        }
        return next;
      });
    }, 50);

    const clock = setInterval(() => {
      const s = stateRef.current;
      if (!s.playing) return;
      s.time -= 1;
      setTime(s.time);
      if (s.time <= 0) {
        setTimeout(() => stop(s.score, s.level), 50);
      }
    }, 1000);

    return () => {
      clearInterval(spawnTimer);
      clearInterval(moveTimer);
      clearInterval(clock);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, level, combo]);

  const move = (clientX: number) => {
    const el = areaRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pct = Math.max(4, Math.min(96, ((clientX - r.left) / r.width) * 100));
    stateRef.current.basketX = pct;
    setBasketX(pct);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!stateRef.current.playing) return;
      const s = stateRef.current;
      if (e.key === "ArrowLeft") {
        s.basketX = Math.max(4, s.basketX - 6);
        setBasketX(s.basketX);
      } else if (e.key === "ArrowRight") {
        s.basketX = Math.min(96, s.basketX + 6);
        setBasketX(s.basketX);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="glass rounded-3xl p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-black text-lg">🧺 Tangkap Bahan Masakan!</h3>
          <p className="text-xs text-slate-400">Geser keranjang • tangkap bahan bagus • hindari yang busuk!</p>
        </div>
        <div className="flex gap-2 text-sm font-black">
          <span className="glass-soft rounded-xl px-3 py-1.5">⭐ {score}</span>
          <span className="glass-soft rounded-xl px-3 py-1.5">{"❤️".repeat(Math.max(0, lives)) || "💔"}</span>
          <span className="glass-soft rounded-xl px-3 py-1.5">⏱️ {time}s</span>
          <span className="glass-soft rounded-xl px-3 py-1.5">Lv {level}</span>
        </div>
      </div>

      <div
        ref={areaRef}
        onMouseMove={(e) => playing && move(e.clientX)}
        onTouchMove={(e) => playing && e.touches[0] && move(e.touches[0].clientX)}
        className="game-canvas-area relative mt-4 h-[380px] rounded-2xl overflow-hidden bg-gradient-to-b from-indigo-950/80 via-slate-900/60 to-amber-950/40 border border-white/10 cursor-none"
      >
        {/* dapur bg */}
        <div className="absolute inset-0 opacity-30 text-4xl flex flex-wrap gap-6 p-4 content-start pointer-events-none">
          {["🍳", "🔪", "🥘", "🧂", "🫕"].map((e, i) => (
            <span key={i}>{e}</span>
          ))}
        </div>
        {!playing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-10">
            <p className="text-6xl animate-bounce-soft">🧺</p>
            <p className="mt-3 font-black text-xl">Siap jadi Koki Cilik?</p>
            <button onClick={start} className="mt-4 flex items-center gap-2 px-8 py-3 rounded-2xl font-black bg-gradient-to-r from-amber-400 to-rose-500 text-black">
              <Play size={18} /> Mulai Main
            </button>
            <p className="mt-3 text-xs text-slate-400">💡 Geser mouse / jari / tombol ← →</p>
          </div>
        )}
        {items.map((it) => (
          <span
            key={it.id}
            className="absolute text-3xl sm:text-4xl select-none"
            style={{ left: `${it.x}%`, top: `${it.y}%`, transform: "translate(-50%,-50%)", filter: it.bad ? "grayscale(30%)" : "drop-shadow(0 0 8px rgba(251,191,36,0.5))" }}
          >
            {it.emoji}
          </span>
        ))}
        {/* basket */}
        <div
          className="absolute bottom-2 text-5xl sm:text-6xl transition-[left] duration-75 select-none"
          style={{ left: `calc(${basketX}% - 30px)` }}
        >
          🧺
        </div>
        {combo >= 5 && playing && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 text-black text-sm font-black animate-pulse">
            🔥 COMBO x{combo}!
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ GAME 2: SUSUN PIRING (SIMON) ============ */
const DISHES = [
  { e: "🥩", n: "Rendang", c: "from-red-500 to-orange-600" },
  { e: "🍗", n: "Ayam Pop", c: "from-amber-400 to-yellow-600" },
  { e: "🥬", n: "Sayur", c: "from-emerald-400 to-green-600" },
  { e: "🌶️", n: "Sambal", c: "from-rose-500 to-red-700" },
  { e: "🍚", n: "Nasi", c: "from-slate-200 to-slate-400" },
  { e: "🥚", n: "Telur", c: "from-orange-300 to-amber-500" },
];

function SimonGame({ beep, onFinish }: { beep: (f: number, d?: number, t?: OscillatorType) => void; onFinish: (score: number, level: number) => void }) {
  const [seq, setSeq] = useState<number[]>([]);
  const [input, setInput] = useState<number[]>([]);
  const [phase, setPhase] = useState<"idle" | "show" | "play" | "done">("idle");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const playSeq = async (s: number[]) => {
    setPhase("show");
    setMsg("👀 Perhatikan urutannya...");
    await new Promise((r) => setTimeout(r, 600));
    for (let i = 0; i < s.length; i++) {
      setFlash(s[i]);
      beep(300 + s[i] * 120, 0.25, "triangle");
      await new Promise((r) => setTimeout(r, 550));
      setFlash(null);
      await new Promise((r) => setTimeout(r, 250));
    }
    setInput([]);
    setPhase("play");
    setMsg("👆 Sekarang giliranmu, ulangi urutannya!");
  };

  const start = () => {
    const first = Math.floor(Math.random() * DISHES.length);
    const s = [first];
    setSeq(s);
    setScore(0);
    setRound(1);
    playSeq(s);
  };

  const press = (idx: number) => {
    if (phase !== "play") return;
    beep(300 + idx * 120, 0.15, "triangle");
    setFlash(idx);
    setTimeout(() => setFlash(null), 180);
    const ni = [...input, idx];
    setInput(ni);
    if (ni[ni.length - 1] !== seq[ni.length - 1]) {
      setPhase("done");
      setMsg(`😅 Ups! Kamu sampai ronde ${round} dengan skor ${score}. Hebat!`);
      beep(180, 0.4, "sawtooth");
      onFinish(score, round);
      return;
    }
    if (ni.length === seq.length) {
      const gained = 50 + round * 25;
      const ns = score + gained;
      setScore(ns);
      setMsg(`🎉 Benar! +${gained} poin`);
      beep(880, 0.2, "square");
      const nr = round + 1;
      setRound(nr);
      const next = [...seq, Math.floor(Math.random() * DISHES.length)];
      setSeq(next);
      setTimeout(() => playSeq(next), 1100);
    }
  };

  return (
    <div className="glass rounded-3xl p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-black text-lg">🍱 Susun Piring Padang!</h3>
          <p className="text-xs text-slate-400">Hafalkan urutan hidangan, lalu ulangi. Makin lama makin sulit!</p>
        </div>
        <div className="flex gap-2 text-sm font-black">
          <span className="glass-soft rounded-xl px-3 py-1.5">⭐ {score}</span>
          <span className="glass-soft rounded-xl px-3 py-1.5">Ronde {round}</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-bold text-center min-h-6 text-amber-200">{msg || "Tekan mulai, hafalkan urutannya! 🧠"}</p>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:gap-3 max-w-md mx-auto">
        {DISHES.map((d, i) => (
          <button
            key={i}
            onClick={() => press(i)}
            disabled={phase !== "play"}
            className={`rounded-2xl p-3 sm:p-5 text-center transition-all bg-gradient-to-br ${d.c} ${
              flash === i ? "scale-110 brightness-150 shadow-[0_0_30px_rgba(255,255,255,0.7)]" : "opacity-90 hover:scale-105"
            } ${phase !== "play" ? "cursor-default" : "cursor-pointer"}`}
          >
            <span className="text-4xl sm:text-5xl block">{d.e}</span>
            <span className="text-[11px] font-black text-black/70">{d.n}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 text-center">
        {(phase === "idle" || phase === "done") && (
          <button onClick={start} className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl font-black bg-gradient-to-r from-amber-400 to-rose-500 text-black">
            {phase === "done" ? <RotateCcw size={18} /> : <Play size={18} />}
            {phase === "done" ? "Main Lagi" : "Mulai Main"}
          </button>
        )}
        {phase === "show" && <p className="text-sm text-slate-400 animate-pulse">⏳ Sedang menunjukkan...</p>}
      </div>
    </div>
  );
}

/* ============ GAME 3: KUIS KOKI ============ */
const QUIZ = [
  { q: "Rendang berasal dari daerah mana?", opts: ["Padang, Sumatera Barat", "Bandung", "Medan", "Makassar"], a: 0 },
  { q: "Apa bahan utama rendang?", opts: ["Ayam", "Daging sapi & santan", "Ikan", "Tahu"], a: 1 },
  { q: "Sambal khas Padang yang berwarna hijau?", opts: ["Sambal terasi", "Sambal matah", "Sambal ijo", "Sambal dabu"], a: 2 },
  { q: "Ayam Pop disajikan dengan sambal apa?", opts: ["Sambal merah", "Kecap", "Mayones", "Saus tomat"], a: 0 },
  { q: "Minuman khas Minang dari telur?", opts: ["Es cendol", "Teh talua", "Kopi susu", "Bandrek"], a: 1 },
  { q: "Berapa lama rendang dimasak agar empuk?", opts: ["5 menit", "30 menit", "Berjam-jam", "1 menit"], a: 2 },
  { q: "Sate khas dari Padang?", opts: ["Sate lilit", "Sate Padang", "Sate madura", "Sate maranggi"], a: 1 },
  { q: "Daun apa yang jadi lalapan wajib nasi padang?", opts: ["Daun singkong", "Daun pisang", "Daun jeruk", "Daun salam"], a: 0 },
];

function QuizGame({ beep, onFinish }: { beep: (f: number, d?: number, t?: OscillatorType) => void; onFinish: (score: number, level: number) => void }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(0);

  const pick = (i: number) => {
    if (picked !== null || done) return;
    setPicked(i);
    if (i === QUIZ[idx].a) {
      const gained = 100 + streak * 25;
      setScore((s) => s + gained);
      setStreak((s) => s + 1);
      beep(880, 0.2, "square");
    } else {
      setStreak(0);
      beep(200, 0.3, "sawtooth");
    }
    setTimeout(() => {
      if (idx + 1 >= QUIZ.length) {
        setDone(true);
        const finalAdd = i === QUIZ[idx].a ? 100 + streak * 25 : 0;
        onFinish(score + finalAdd, Math.min(5, 1 + Math.floor((score + finalAdd) / 300)));
      } else {
        setIdx(idx + 1);
        setPicked(null);
      }
    }, 900);
  };

  const restart = () => {
    setIdx(0);
    setScore(0);
    setPicked(null);
    setDone(false);
    setStreak(0);
  };

  if (done) {
    const pct = Math.round((score / (QUIZ.length * 100)) * 100);
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <p className="text-7xl">{pct >= 70 ? "🏆" : pct >= 40 ? "👏" : "💪"}</p>
        <h3 className="mt-3 text-2xl font-black">Skor: {score}</h3>
        <p className="text-slate-400 text-sm mt-1">
          {pct >= 70 ? "Luar biasa! Kamu Koki Cilik Hebat! 👨‍🍳" : pct >= 40 ? "Bagus! Sedikit lagi sempurna!" : "Jangan menyerah, coba lagi yuk!"}
        </p>
        <button onClick={restart} className="mt-5 inline-flex items-center gap-2 px-8 py-3 rounded-2xl font-black bg-gradient-to-r from-amber-400 to-rose-500 text-black">
          <RotateCcw size={18} /> Main Lagi
        </button>
      </div>
    );
  }

  const cur = QUIZ[idx];
  return (
    <div className="glass rounded-3xl p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-400">Soal {idx + 1}/{QUIZ.length}</p>
        <div className="flex gap-2 text-sm font-black">
          <span className="glass-soft rounded-xl px-3 py-1.5">⭐ {score}</span>
          {streak >= 2 && <span className="rounded-xl px-3 py-1.5 bg-gradient-to-r from-amber-400 to-rose-500 text-black">🔥 x{streak}</span>}
        </div>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all" style={{ width: `${((idx + 1) / QUIZ.length) * 100}%` }} />
      </div>
      <h3 className="mt-5 text-xl sm:text-2xl font-black text-center min-h-16">{cur.q}</h3>
      <div className="mt-5 grid sm:grid-cols-2 gap-2.5 max-w-2xl mx-auto">
        {cur.opts.map((o, i) => {
          let cls = "glass-soft hover:bg-white/15";
          if (picked !== null) {
            if (i === cur.a) cls = "bg-emerald-500/40 border border-emerald-400";
            else if (i === picked) cls = "bg-rose-500/40 border border-rose-400";
            else cls = "glass-soft opacity-50";
          }
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={picked !== null}
              className={`rounded-2xl px-4 py-4 font-bold text-sm sm:text-base transition-all text-left ${cls}`}
            >
              <span className="inline-block w-7 h-7 rounded-lg bg-black/40 text-center leading-7 mr-2 text-xs">
                {["A", "B", "C", "D"][i]}
              </span>
              {o} {picked !== null && i === cur.a ? "✅" : picked === i ? "❌" : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============ MAIN PAGE ============ */
export default function GamePage() {
  const [tab, setTab] = useState<"catch" | "simon" | "quiz">("catch");
  const [name, setName] = useState("");
  const [me, setMe] = useState<{ name: string } | null>(null);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [result, setResult] = useState<{ score: number; level: number; game: string; points: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const { beep, muted, setMuted } = useSound();

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j.user) {
          setMe(j.user);
          setName(j.user.name);
        }
      })
      .catch(() => {});
    fetch("/api/game", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setLeaders(j.leaderboard || []))
      .catch(() => {});
  }, []);

  const finish = async (score: number, level: number) => {
    if (score <= 0) return;
    const gameType = tab === "catch" ? "Tangkap Bahan" : tab === "simon" ? "Susun Piring" : "Kuis Koki";
    setSaving(true);
    try {
      const r = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: name || me?.name || "Koki Cilik", gameType, score, level }),
      });
      const j = await r.json();
      setResult({ score, level, game: gameType, points: j.pointsEarned || 0 });
      if (j.pointsEarned > 0) window.dispatchEvent(new Event("auth-changed"));
      const l = await fetch("/api/game", { cache: "no-store" });
      setLeaders((await l.json()).leaderboard || []);
      // fanfare
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.2, "square"), i * 140));
    } catch { /* ignore */ }
    setSaving(false);
  };

  return (
    <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold tracking-[0.25em] text-cyan-300 uppercase">✦ Zona Anak ✦</p>
            <h1 className="text-3xl sm:text-5xl font-black">
              Dapur{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                Koki Cilik
              </span>{" "}
              👨‍🍳
            </h1>
            <p className="mt-2 text-slate-400 text-sm">
              Main & menangkan <b className="text-amber-300">poin loyalty</b>! (maks 60 poin/hari, khusus member)
            </p>
          </div>
          <button
            onClick={() => setMuted(!muted)}
            className="glass p-3 rounded-xl hover:bg-white/15"
            aria-label="suara"
          >
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        <div className="mt-5 glass rounded-2xl p-3 flex flex-wrap items-center gap-3">
          <span className="text-2xl">🧒</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama koki cilik..."
            className="flex-1 min-w-[160px] bg-transparent outline-none font-bold placeholder:text-slate-600 placeholder:font-normal"
          />
          {!me && (
            <Link href="/auth" className="text-xs font-bold text-amber-300 underline shrink-0">
              Masuk agar skor jadi poin! →
            </Link>
          )}
          {me && <span className="text-xs font-bold text-emerald-300 shrink-0">✅ Skor otomatis jadi poin!</span>}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { id: "catch", e: "🧺", l: "Tangkap Bahan" },
            { id: "simon", e: "🍱", l: "Susun Piring" },
            { id: "quiz", e: "🧠", l: "Kuis Koki" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`rounded-2xl py-3 sm:py-4 font-black text-xs sm:text-base transition ${
                tab === t.id
                  ? "bg-gradient-to-r from-cyan-400 to-violet-500 text-black shadow-[0_0_25px_rgba(34,211,238,0.5)]"
                  : "glass text-slate-300 hover:bg-white/10"
              }`}
            >
              <span className="text-2xl block">{t.e}</span>
              {t.l}
            </button>
          ))}
        </div>

        <div className="mt-4 grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                {tab === "catch" && <CatchGame beep={beep} onFinish={(s, l) => finish(s, l)} />}
                {tab === "simon" && <SimonGame beep={beep} onFinish={(s, l) => finish(s, l)} />}
                {tab === "quiz" && <QuizGame beep={beep} onFinish={(s, l) => finish(s, l)} />}
              </motion.div>
            </AnimatePresence>
            {saving && <p className="mt-2 text-center text-xs text-slate-400 animate-pulse">💾 Menyimpan skor...</p>}
          </div>

          <div className="space-y-4">
            <div className="glass rounded-3xl p-5">
              <p className="font-black flex items-center gap-2">
                <Trophy size={18} className="text-amber-300" /> Juara Koki Cilik
              </p>
              <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto">
                {leaders.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-6">
                    Belum ada juara.<br />Jadilah yang pertama! 🚀
                  </p>
                )}
                {leaders.map((l, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm ${
                      i < 3 ? "bg-gradient-to-r from-amber-400/15 to-rose-500/15 border border-amber-400/25" : "glass-soft"
                    }`}
                  >
                    <span className="font-black w-7 text-center">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate text-xs">{l.playerName}</p>
                      <p className="text-[10px] text-slate-500">{l.gameType} • Lv {l.level}</p>
                    </div>
                    <span className="font-black text-amber-300 text-xs">{l.score}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-strong rounded-3xl p-5 text-sm">
              <p className="font-black">🎁 Skor → Poin</p>
              <ul className="mt-2 space-y-1.5 text-xs text-slate-400">
                <li>• Tiap 100 skor = 1 poin (maks 20/main)</li>
                <li>• Maks 60 poin bonus game per hari</li>
                <li>• Harus masuk sebagai member</li>
                <li>• Poin bisa ditukar makanan gratis!</li>
              </ul>
              <Link href="/loyalty" className="mt-3 flex items-center justify-center gap-1 w-full py-2.5 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-rose-500 text-black text-xs">
                <Sparkles size={14} /> Lihat Hadiah
              </Link>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-strong w-full max-w-md rounded-3xl p-8 text-center"
            >
              <p className="text-7xl">🎉</p>
              <h3 className="mt-3 text-2xl font-black">Permainan Selesai!</h3>
              <p className="text-sm text-slate-400">{result.game} • Level {result.level}</p>
              <p className="mt-3 text-5xl font-black text-amber-300">{result.score}</p>
              <p className="text-xs text-slate-500">skor</p>
              {result.points > 0 ? (
                <p className="mt-3 inline-block px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-sm">
                  +{result.points} poin loyalty! 🎁
                </p>
              ) : !me ? (
                <Link href="/auth" className="mt-3 inline-block text-xs text-amber-300 underline">
                  Daftar/masuk agar skormu jadi poin!
                </Link>
              ) : (
                <p className="mt-3 text-xs text-slate-500">Batas bonus harian tercapai, coba lagi besok! 🌙</p>
              )}
              <button
                onClick={() => setResult(null)}
                className="mt-5 w-full py-3 rounded-xl font-bold bg-gradient-to-r from-cyan-400 to-violet-500 text-black"
              >
                Main Lagi 🚀
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
