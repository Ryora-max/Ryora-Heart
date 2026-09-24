"use client";

import { useMemo } from "react";
import { Gamepad2, RotateCcw } from "lucide-react";
import { useAuthStore } from "@/stores";
import { useUserExtra } from "@/hooks";
import { playHeartPopSound, playChimeSound } from "@/lib/soundEffects";
import { cn } from "@/lib/utils";

/**
 * Tic-Tac-Toe berdua — board dishare pair-scoped di user_extras
 * ("game_ttt") → realtime sync ke kedua partner.
 * Owner (user-1) selalu X, partner (user-2) selalu O. X jalan duluan.
 */

type Mark = "x" | "o";
type Board = string[]; // 9 cells: "" | "x" | "o"

interface GameState {
  board: Board;
  turn: Mark;
  winner: Mark | "draw" | null;
}

const EMPTY: GameState = { board: Array(9).fill(""), turn: "x", winner: null };

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],            // diagonals
];

function checkWinner(board: Board): Mark | "draw" | null {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as Mark;
    }
  }
  return board.every((c) => c !== "") ? "draw" : null;
}

function parseGame(raw: string | null): GameState {
  try {
    const p = raw ? (JSON.parse(raw) as Partial<GameState>) : {};
    if (Array.isArray(p.board) && p.board.length === 9) {
      return { board: p.board, turn: p.turn === "o" ? "o" : "x", winner: p.winner ?? null };
    }
    return EMPTY;
  } catch {
    return EMPTY;
  }
}

interface TicTacToeProps {
  partnerName: string;
}

export function TicTacToe({ partnerName }: TicTacToeProps) {
  const { token, user } = useAuthStore();
  const { value, setValue } = useUserExtra(token || "", "game_ttt");

  const game = useMemo(() => parseGame(value), [value]);
  const myMark: Mark = user?.role === "partner" ? "o" : "x";
  const isMyTurn = !game.winner && game.turn === myMark;

  const handleCell = async (i: number) => {
    if (!isMyTurn || game.board[i] !== "") return;
    const board = [...game.board];
    board[i] = myMark;
    const winner = checkWinner(board);
    const next: GameState = { board, turn: myMark === "x" ? "o" : "x", winner };
    if (winner) playChimeSound(); else playHeartPopSound();
    await setValue(JSON.stringify(next));
  };

  const handleReset = async () => {
    playChimeSound();
    await setValue(JSON.stringify(EMPTY));
  };

  const statusText = game.winner
    ? game.winner === "draw"
      ? "Seri! 😄"
      : game.winner === myMark
      ? "Kamu menang! 🎉"
      : `${partnerName} menang! 💕`
    : isMyTurn
    ? "Giliranmu!"
    : `Giliran ${partnerName}...`;

  return (
    <div className="p-4 rounded-2xl bg-white/70 dark:bg-amber-950/60 backdrop-blur-md border border-violet-200/60 dark:border-violet-800/60 shadow-md">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-violet-200/40 dark:border-violet-800/40">
        <div className="flex items-center gap-2">
          <Gamepad2 size={16} className="text-violet-500" />
          <span className="text-xs font-extrabold">Tic-Tac-Toe Berdua</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
            Kamu: {myMark === "x" ? "❌" : "⭕"}
          </span>
          {game.winner && (
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1 rounded-lg bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-200 text-[10px] font-bold hover:bg-violet-200 transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw size={11} /> Main lagi
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 max-w-[220px] mx-auto" role="grid" aria-label="Papan tic-tac-toe">
        {game.board.map((cell, i) => (
          <button
            key={i}
            type="button"
            role="gridcell"
            aria-label={`Kotak ${i + 1}${cell ? `, ${cell === "x" ? "X" : "O"}` : ", kosong"}`}
            disabled={!isMyTurn || cell !== ""}
            onClick={() => handleCell(i)}
            className={cn(
              "aspect-square rounded-xl text-2xl font-black flex items-center justify-center transition-all border",
              cell === ""
                ? isMyTurn
                  ? "bg-white/60 dark:bg-white/5 border-violet-200 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/40 cursor-pointer"
                  : "bg-white/40 dark:bg-white/5 border-violet-200/50 dark:border-violet-800/50 cursor-not-allowed"
                : "bg-white/80 dark:bg-white/10 border-violet-300 dark:border-violet-700"
            )}
          >
            {cell === "x" ? <span className="text-rose-500">❌</span> : cell === "o" ? <span className="text-blue-500">⭕</span> : ""}
          </button>
        ))}
      </div>

      <p className={cn(
        "text-center text-[11px] font-bold mt-2.5",
        game.winner === myMark && game.winner ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
      )}>
        {statusText}
      </p>
    </div>
  );
}
