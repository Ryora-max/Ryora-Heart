"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuthStore } from "@/stores";
import { useGames, usePresence, usePartnerId } from "@/hooks/useDatabase";
import { ArrowLeft, Trophy, Gamepad2 } from "lucide-react";
import { useRouter } from "next/navigation";

type GameType = "menu" | "tictactoe" | "quiz" | "truthdare";

export default function GameArcadePage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { scores, submitScore } = useGames(token || "");
  const [currentGame, setCurrentGame] = useState<GameType>("menu");

  const renderGame = () => {
    switch (currentGame) {
      case "tictactoe":
        return <TicTacToe onWin={(score) => submitScore("tictactoe", score)} onBack={() => setCurrentGame("menu")} token={token || ""} userId={user?.id || ""} />;
      case "quiz":
        return <LoveQuiz onWin={(score) => submitScore("quiz", score)} onBack={() => setCurrentGame("menu")} />;
      case "truthdare":
        return <TruthOrDare onWin={(score) => submitScore("truthdare", score)} onBack={() => setCurrentGame("menu")} />;
      default:
        return <GameMenu onSelect={setCurrentGame} scores={scores} myId={user?.id || ""} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-900 via-purple-900 to-fuchsia-900 flex flex-col">
      <header className="sticky top-0 z-10 bg-black/20 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => currentGame === "menu" ? router.push("/home") : setCurrentGame("menu")} aria-label="Kembali" className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5" /> Game Arcade
          </h1>
          <p className="text-xs text-white/60">Main bareng pasangan 💕</p>
        </div>
      </header>

      <div className="flex-1 px-4 py-4">
        {renderGame()}
      </div>
    </div>
  );
}

function GameMenu({ onSelect, scores, myId }: { onSelect: (g: GameType) => void; scores: { id: string; userId: string; game: string; score: number; createdAt: string }[]; myId: string }) {
  const games = [
    { id: "tictactoe" as GameType, emoji: "⭕", name: "Tic-Tac-Toe", desc: "Main berdua real-time" },
    { id: "quiz" as GameType, emoji: "💕", name: "Kuis Cinta", desc: "Seberapa kenal kamu sama doi?" },
    { id: "truthdare" as GameType, emoji: "🎲", name: "Truth or Dare", desc: "Jujur atau tantangan?" },
  ];

  const myScores = scores.filter((s) => s.userId === myId);
  const totalScore = myScores.reduce((sum, s) => sum + s.score, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 backdrop-blur-xl border border-white/10 p-5 text-center">
        <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
        <p className="text-white/60 text-xs">Total Skor Kamu</p>
        <p className="text-white text-3xl font-bold">{totalScore}</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => onSelect(game.id)}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left"
          >
            <span className="text-4xl">{game.emoji}</span>
            <div className="flex-1">
              <h3 className="text-white font-bold text-sm">{game.name}</h3>
              <p className="text-white/50 text-xs">{game.desc}</p>
            </div>
            <div className="text-white/30 text-2xl">→</div>
          </button>
        ))}
      </div>

      {scores.length > 0 && (
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
          <h3 className="text-white/80 font-semibold text-sm mb-3">Skor Terbaru</h3>
          <div className="space-y-2">
            {scores.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-white/70">{s.game === "tictactoe" ? "⭕" : s.game === "quiz" ? "💕" : "🎲"} {s.userId === myId ? "Kamu" : "Pasangan"}</span>
                <span className="text-yellow-400 font-bold">+{s.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== TicTacToe 2 Pemain Real-Time =====
function TicTacToe({ onWin, onBack, token, userId }: { onWin: (score: number) => void; onBack: () => void; token: string; userId: string }) {
  const { presence, updatePresence } = usePresence(token);
  const { partnerId } = usePartnerId(token, userId);
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [mySymbol, setMySymbol] = useState<"❌" | "⭕">("❌");
  const [gameStarted, setGameStarted] = useState(false);

  const partnerPresence = presence.find((p) => p.userId === partnerId);

  const partnerBoard = (() => {
    if (!partnerPresence?.status?.startsWith("ttt:")) return null;
    const parts = partnerPresence.status.split(":");
    return { board: parts[1] || "", symbol: parts[2] as "❌" | "⭕", turn: parts[3] as "❌" | "⭕" };
  })();

  const checkWinner = useCallback((b: (string | null)[]) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a, c, d] of lines) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
    }
    return null;
  }, []);

  const boardToString = (b: (string | null)[]) => b.map((c) => c || "-").join("");
  const stringToBoard = (s: string): (string | null)[] => s.split("").map((c) => c === "-" ? null : c);

  const startGame = () => {
    const newBoard = Array(9).fill(null);
    setBoard(newBoard);
    setMySymbol("❌");
    setGameStarted(true);
    updatePresence(`ttt:${boardToString(newBoard)}:❌:❌`);
  };

  const joinGame = () => {
    if (!partnerBoard) return;
    const newBoard = stringToBoard(partnerBoard.board);
    setBoard(newBoard);
    setMySymbol("⭕");
    setGameStarted(true);
  };

  // Sync board dari partner
  useEffect(() => {
    if (!gameStarted || !partnerBoard) return;
    const partnerB = stringToBoard(partnerBoard.board);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBoard(partnerB);
    const winner = checkWinner(partnerB);
    if (winner && winner === mySymbol) onWin(10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerBoard?.board, partnerBoard?.turn]);

  const isMyTurn = gameStarted && partnerBoard?.turn === mySymbol;

  const handleClick = (i: number) => {
    if (!isMyTurn || board[i]) return;
    const newBoard = [...board];
    newBoard[i] = mySymbol;
    setBoard(newBoard);
    const nextTurn = mySymbol === "❌" ? "⭕" : "❌";
    updatePresence(`ttt:${boardToString(newBoard)}:${mySymbol}:${nextTurn}`);

    const winner = checkWinner(newBoard);
    if (winner && winner === mySymbol) onWin(10);
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setGameStarted(false);
    updatePresence("online");
  };

  const winner = checkWinner(board);
  const isDraw = board.every((c) => c !== null) && !winner;

  if (!gameStarted) {
    const partnerInGame = partnerBoard !== null;
    return (
      <div className="max-w-sm mx-auto text-center py-8">
        <div className="text-5xl mb-4">⭕❌</div>
        <h2 className="text-white text-xl font-bold mb-2">Tic-Tac-Toe Berdua</h2>
        <p className="text-white/50 text-xs mb-6">Main real-time sama pasangan. Giliran bergantian!</p>

        {partnerInGame ? (
          <div className="space-y-3">
            <div className="rounded-xl bg-green-500/20 border border-green-400/30 p-4">
              <p className="text-green-300 text-sm">✨ Pasangan sudah buat game!</p>
              <p className="text-white/60 text-xs mt-1">Kamu main sebagai ⭕</p>
            </div>
            <button onClick={joinGame} className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold hover:scale-105 transition-all">
              Gabung Game! 🎮
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-white/70 text-sm">Buat game baru dan tunggu pasangan gabung</p>
              <p className="text-white/40 text-xs mt-1">Kamu main sebagai ❌ (jalan duluan)</p>
            </div>
            <button onClick={startGame} className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold hover:scale-105 transition-all">
              Buat Game Baru 🎮
            </button>
          </div>
        )}

        <button onClick={onBack} className="mt-4 px-4 py-2 rounded-full bg-white/10 text-white text-sm border border-white/20 hover:bg-white/20 transition-colors">
          Kembali ke Menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-white text-xl font-bold mb-1">Tic-Tac-Toe</h2>
        <p className="text-white/50 text-xs">
          {winner ? (winner === mySymbol ? "🎉 Kamu menang!" : "😢 Pasangan menang") : isDraw ? "🤝 Seri!" : isMyTurn ? `Giliran kamu (${mySymbol})` : `Menunggu pasangan...`}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            disabled={!isMyTurn || !!cell || !!winner}
            className="aspect-square rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-4xl flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            {cell}
          </button>
        ))}
      </div>
      <div className="flex gap-2 justify-center">
        <button onClick={reset} className="px-4 py-2 rounded-full bg-white/10 text-white text-sm border border-white/20 hover:bg-white/20 transition-colors">
          Selesai
        </button>
        <button onClick={onBack} className="px-4 py-2 rounded-full bg-white/10 text-white text-sm border border-white/20 hover:bg-white/20 transition-colors">
          Kembali ke Menu
        </button>
      </div>
    </div>
  );
}

// ===== Kuis Cinta =====
const QUIZ_QUESTIONS = [
  { q: "Apa lambang cinta yang paling populer?", options: ["💔", "🖤", "❤️", "💛"], answer: 2 },
  { q: "Planet apa yang melambangkan cinta?", options: ["Mars", "Venus", "Jupiter", "Saturnus"], answer: 1 },
  { q: "Bunga apa yang sering dikasih pasangan?", options: ["Mawar", "Melati", "Anggrek", "Sunflower"], answer: 0 },
  { q: "Apa kepanjangan LDR?", options: ["Long Distance Relationship", "Love Distance Romance", "Long Day Romance", "Love Distance Relationship"], answer: 0 },
  { q: "Emoji apa yang paling sering dikirim pasangan LDR?", options: ["😎", "🥱", "💕", "🤔"], answer: 2 },
  { q: "Apa hal paling susah di LDR?", options: ["Cari sinyal", "Sabar nunggu", "Jaga komitmen", "Semua benar"], answer: 3 },
  { q: "Kapan hari Valentine?", options: ["1 Januari", "14 Februari", "20 Maret", "25 Desember"], answer: 1 },
  { q: "Apa yang bikin LDR bertahan?", options: ["Komunikasi", "Kepercayaan", "Sabar", "Semua benar"], answer: 3 },
];

function LoveQuiz({ onWin, onBack }: { onWin: (score: number) => void; onBack: () => void }) {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [shuffled, setShuffled] = useState(QUIZ_QUESTIONS);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShuffled([...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5));
  }, []);

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const correct = idx === shuffled[current].answer;
    if (correct) setScore((prev) => prev + 10);
    setTimeout(() => {
      if (current + 1 < shuffled.length) {
        setCurrent((prev) => prev + 1);
        setSelected(null);
      } else {
        setFinished(true);
        onWin(score + (correct ? 10 : 0));
      }
    }, 1500);
  };

  if (finished) {
    return (
      <div className="max-w-sm mx-auto text-center py-8">
        <div className="text-6xl mb-4">{score >= 60 ? "🏆" : score >= 40 ? "💕" : "💔"}</div>
        <h2 className="text-white text-xl font-bold mb-2">Kuis Selesai!</h2>
        <p className="text-white/70 mb-1">Skor: <span className="text-yellow-400 font-bold text-2xl">{score}</span></p>
        <p className="text-white/50 text-xs mb-4">
          {score >= 70 ? "Kamu banget kenal doi! 💕" : score >= 40 ? "Lumayan kenal doi 😊" : "Yuk kenalan lebih dalam 🥺"}
        </p>
        <button onClick={onBack} className="px-6 py-2 rounded-full bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors">
          Kembali ke Menu
        </button>
      </div>
    );
  }

  const q = shuffled[current];
  return (
    <div className="max-w-sm mx-auto">
      <div className="text-center mb-4">
        <p className="text-white/50 text-xs">Soal {current + 1}/{shuffled.length}</p>
        <p className="text-yellow-400 text-sm font-bold">Skor: {score}</p>
      </div>
      <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 mb-4">
        <h2 className="text-white text-lg font-bold mb-4 text-center">{q.q}</h2>
        <div className="space-y-2">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={selected !== null}
              className={`w-full p-3 rounded-xl text-sm font-medium transition-all border ${
                selected === null
                  ? "bg-white/10 text-white border-white/20 hover:bg-white/20"
                  : idx === q.answer
                    ? "bg-green-500/30 text-green-300 border-green-400/50"
                    : idx === selected
                      ? "bg-red-500/30 text-red-300 border-red-400/50"
                      : "bg-white/5 text-white/40 border-white/10"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <button onClick={onBack} className="w-full px-4 py-2 rounded-full bg-white/10 text-white text-sm border border-white/20 hover:bg-white/20 transition-colors">
        Kembali ke Menu
      </button>
    </div>
  );
}

// ===== Truth or Dare =====
const TRUTH_QUESTIONS = [
  "Apa hal paling romantis yang pernah kamu lakuin untuk aku?",
  "Kapan terakhir kamu kangen banget sama aku?",
  "Apa bagian favorit kamu dari pasangan?",
  "Kalau bisa ulang satu momen bareng aku, mau ulang yang mana?",
  "Apa rahasia kecil yang belum pernah kamu kasih tau ke aku?",
  "Hal apa yang paling kamu suka dari LDR kita?",
  "Apa yang kamu pikirin pas pertama kali liat aku?",
  "Kalau kita ketemu besok, hal pertama yang mau kamu lakuin apa?",
];

const DARE_CHALLENGES = [
  "Kirim voice note bilang 'aku kangen kamu' dengan nada paling dramatis!",
  "Kirim foto selfie dengan ekspresi paling lucu sekarang!",
  "Tulis surat pendek 3 kalimat tentang perasaan kamu sekarang!",
  "Kirim sticker/meme yang paling sesuai sama mood kamu sekarang!",
  "Bikin pantun 2 baris tentang kita berdua!",
  "Ceritain mimpi terakhir kamu tentang aku (kalau ada)!",
  "Kirim voice note nyanyi 1 bait lagu favorit kita!",
  "Sebut 3 hal yang bikin kamu ngeter sama aku!",
];

function TruthOrDare({ onWin, onBack }: { onWin: (score: number) => void; onBack: () => void }) {
  const [picked, setPicked] = useState<"truth" | "dare" | null>(null);
  const [content, setContent] = useState("");
  const [used, setUsed] = useState<Set<number>>(new Set());
  const [round, setRound] = useState(0);

  const pickTruth = () => {
    const available = TRUTH_QUESTIONS.map((_, i) => i).filter((i) => !used.has(i));
    const pool = available.length > 0 ? available : TRUTH_QUESTIONS.map((_, i) => i);
    const idx = pool[Math.floor(Math.random() * pool.length)];
    setPicked("truth");
    setContent(TRUTH_QUESTIONS[idx]);
    setUsed(available.length > 0 ? new Set([...used, idx]) : new Set([idx]));
    setRound((prev) => prev + 1);
    onWin(5);
  };

  const pickDare = () => {
    const available = DARE_CHALLENGES.map((_, i) => i).filter((i) => !used.has(i + 100));
    const pool = available.length > 0 ? available : DARE_CHALLENGES.map((_, i) => i);
    const idx = pool[Math.floor(Math.random() * pool.length)];
    setPicked("dare");
    setContent(DARE_CHALLENGES[idx]);
    setUsed(available.length > 0 ? new Set([...used, idx + 100]) : new Set([idx + 100]));
    setRound((prev) => prev + 1);
    onWin(10);
  };

  return (
    <div className="max-w-sm mx-auto">
      <div className="text-center mb-4">
        <div className="text-5xl mb-2">🎲</div>
        <h2 className="text-white text-xl font-bold mb-1">Truth or Dare</h2>
        <p className="text-white/50 text-xs">Pilih jujur atau tantangan! Ronde {round}</p>
      </div>

      {picked === null ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={pickTruth}
            className="rounded-2xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-blue-400/30 p-6 text-center hover:scale-105 transition-all"
          >
            <div className="text-4xl mb-2">💬</div>
            <p className="text-white font-bold">Truth</p>
            <p className="text-white/50 text-xs mt-1">Jujur ya!</p>
          </button>
          <button
            onClick={pickDare}
            className="rounded-2xl bg-gradient-to-br from-pink-500/30 to-rose-500/30 border border-pink-400/30 p-6 text-center hover:scale-105 transition-all"
          >
            <div className="text-4xl mb-2">🔥</div>
            <p className="text-white font-bold">Dare</p>
            <p className="text-white/50 text-xs mt-1">Tantangan!</p>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className={`rounded-2xl p-5 border ${picked === "truth" ? "bg-blue-500/20 border-blue-400/30" : "bg-pink-500/20 border-pink-400/30"}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{picked === "truth" ? "💬" : "🔥"}</span>
              <span className={`font-bold ${picked === "truth" ? "text-blue-300" : "text-pink-300"}`}>
                {picked === "truth" ? "Truth" : "Dare"}
              </span>
            </div>
            <p className="text-white text-sm leading-relaxed">{content}</p>
          </div>
          <button
            onClick={() => setPicked(null)}
            className="w-full px-4 py-3 rounded-full bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors"
          >
            Lanjut! 🎲
          </button>
        </div>
      )}

      <button onClick={onBack} className="w-full mt-4 px-4 py-2 rounded-full bg-white/10 text-white text-sm border border-white/20 hover:bg-white/20 transition-colors">
        Kembali ke Menu
      </button>
    </div>
  );
}
