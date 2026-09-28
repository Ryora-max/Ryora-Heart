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
    <div className="surface-card p-4">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Gamepad2 size={16} className="text-secondary" />
          <span className="text-xs font-extrabold text-heading">Tic-Tac-Toe Berdua</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-muted">
            Kamu: {myMark === "x" ? "❌" : "⭕"}
          </span>
          {(game.winner || game.board.some((c) => c !== "")) && (
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1 rounded-lg bg-secondary-soft text-secondary text-[10px] font-bold hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1"
            >
              <RotateCcw size={11} /> {game.winner ? "Main lagi" : "Reset"}
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
                  ? "bg-surface-warm border-border hover:bg-secondary-soft cursor-pointer"
                  : "bg-surface-warm border-border/60 cursor-not-allowed opacity-70"
                : "bg-surface-warm border-secondary/40"
            )}
          >
            {cell === "x" ? <span className="text-primary">❌</span> : cell === "o" ? <span className="text-secondary">⭕</span> : ""}
          </button>
        ))}
      </div>

      <p className={cn(
        "text-center text-[11px] font-bold mt-2.5",
        game.winner === myMark && game.winner ? "text-accent" : "text-muted"
      )}>
        {statusText}
      </p>
    </div>
  );
}
