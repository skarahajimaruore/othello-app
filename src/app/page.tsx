"use client";

import React, { useState, useEffect } from 'react';

export default function OthelloPage() {
  const initialBoard = Array(8).fill(null).map(() => Array(8).fill(0));
  initialBoard[3][3] = 2; initialBoard[3][4] = 1;
  initialBoard[4][3] = 1; initialBoard[4][4] = 2;

  const [board, setBoard] = useState(initialBoard);
  const [isBlackTurn, setIsBlackTurn] = useState(true);
  const [counts, setCounts] = useState({ black: 2, white: 2 });
  const [gameOver, setGameOver] = useState(false);
  const [gameMode, setGameMode] = useState<'select' | 'solo' | 'pvp'>('select');

  const directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

  // 石の集計と終了判定
  useEffect(() => {
    let b = 0, w = 0;
    board.forEach(row => row.forEach(cell => {
      if (cell === 1) b++;
      if (cell === 2) w++;
    }));
    setCounts({ black: b, white: w });

    // 置ける場所があるかチェック
    const blackCanMove = checkAnywhereCanPlace(board, 1);
    const whiteCanMove = checkAnywhereCanPlace(board, 2);

    if (b + w === 64 || b === 0 || w === 0 || (!blackCanMove && !whiteCanMove)) {
      setGameOver(true);
    } else if (!isBlackTurn && !whiteCanMove) {
      setIsBlackTurn(true); // 白が置けないならパス
    } else if (isBlackTurn && !blackCanMove) {
      setIsBlackTurn(false); // 黒が置けないならパス
    }
  }, [board, isBlackTurn]);

  // CPUの動作（ソロモードかつ白の番のとき）
  useEffect(() => {
    if (gameMode === 'solo' && !isBlackTurn && !gameOver) {
      const timer = setTimeout(() => {
        const candidates: {y: number, x: number}[] = [];
        board.forEach((row, y) => row.forEach((_, x) => {
          if (checkCanPlace(board, y, x, 2)) candidates.push({y, x});
        }));

        if (candidates.length > 0) {
          // ランダムに選ぶ（レベル1 AI）
          const choice = candidates[Math.floor(Math.random() * candidates.length)];
          placeStone(choice.y, choice.x);
        }
      }, 800); // 0.8秒待ってから打つ（人間味を出すため）
      return () => clearTimeout(timer);
    }
  }, [isBlackTurn, gameMode, gameOver]);

  function checkCanPlace(boardData: number[][], y: number, x: number, player: number) {
    if (boardData[y][x] !== 0) return false;
    const opponent = player === 1 ? 2 : 1;
    for (const [dy, dx] of directions) {
      let ty = y + dy, tx = x + dx, count = 0;
      while (ty >= 0 && ty < 8 && tx >= 0 && tx < 8 && boardData[ty][tx] === opponent) {
        ty += dy; tx += dx; count++;
      }
      if (count > 0 && ty >= 0 && ty < 8 && tx >= 0 && tx < 8 && boardData[ty][tx] === player) return true;
    }
    return false;
  }

  function checkAnywhereCanPlace(boardData: number[][], player: number) {
    return boardData.some((row, y) => row.some((_, x) => checkCanPlace(boardData, y, x, player)));
  }

  const placeStone = (y: number, x: number) => {
    if (board[y][x] !== 0 || gameOver) return;
    const player = isBlackTurn ? 1 : 2;
    const opponent = player === 1 ? 2 : 1;
    let flipped = false;
    const newBoard = board.map(row => [...row]);

    directions.forEach(([dy, dx]) => {
      let ty = y + dy, tx = x + dx;
      const stonesToFlip = [];
      while (ty >= 0 && ty < 8 && tx >= 0 && tx < 8 && board[ty][tx] === opponent) {
        stonesToFlip.push([ty, tx]);
        ty += dy; tx += dx;
      }
      if (ty >= 0 && ty < 8 && tx >= 0 && tx < 8 && board[ty][tx] === player && stonesToFlip.length > 0) {
        flipped = true;
        stonesToFlip.forEach(([fy, fx]) => newBoard[fy][fx] = player);
      }
    });

    if (flipped) {
      newBoard[y][x] = player;
      setBoard(newBoard);
      setIsBlackTurn(!isBlackTurn);
    }
  };

  if (gameMode === 'select') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white">
        <h1 className="mb-12 text-5xl font-black tracking-tighter">OTHELLO PRO</h1>
        <div className="flex flex-col gap-4 w-64">
          <button onClick={() => setGameMode('solo')} className="bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl font-bold shadow-lg transition-transform active:scale-95">
            一人で遊ぶ (CPU対戦)
          </button>
          <button onClick={() => setGameMode('pvp')} className="bg-slate-700 hover:bg-slate-600 py-4 rounded-xl font-bold shadow-lg transition-transform active:scale-95">
            二人で遊ぶ (対面対戦)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4 font-sans text-slate-100">
      <div className="mb-6 flex items-center justify-between w-full max-w-md">
        <button onClick={() => setGameMode('select')} className="text-xs bg-slate-800 px-3 py-1 rounded hover:bg-slate-700">← 戻る</button>
        <h1 className="text-2xl font-black tracking-tighter">OTHELLO PRO</h1>
        <div className="text-xs text-emerald-400">{gameMode === 'solo' ? 'VS CPU' : '2 PLAYERS'}</div>
      </div>
      
      {/* スコアボード */}
      <div className="mb-6 flex gap-8">
        <div className={`flex flex-col items-center p-4 rounded-xl border min-w-[100px] transition-all ${isBlackTurn ? 'bg-black border-white ring-2 ring-emerald-500' : 'bg-black/50 border-slate-700'}`}>
          <span className="text-xs text-slate-400 font-bold">BLACK</span>
          <span className="text-3xl font-bold">{counts.black}</span>
        </div>
        <div className={`flex flex-col items-center p-4 rounded-xl border min-w-[100px] transition-all ${!isBlackTurn ? 'bg-white border-black ring-2 ring-emerald-500' : 'bg-white/50 border-slate-700'}`}>
          <span className="text-xs text-slate-500 font-bold">WHITE</span>
          <span className="text-3xl font-bold text-black">{counts.white}</span>
        </div>
      </div>

      <div className="relative">
        <div className="grid grid-cols-8 border-4 border-slate-800 bg-emerald-800 p-1 shadow-2xl">
          {board.map((row, y) => row.map((cell, x) => {
            const canPlace = !gameOver && (gameMode === 'pvp' || isBlackTurn) && checkCanPlace(board, y, x, isBlackTurn ? 1 : 2);
            return (
              <button key={`${x}-${y}`} onClick={() => placeStone(y, x)} className="relative flex h-10 w-10 items-center justify-center border border-emerald-900 hover:bg-emerald-700 sm:h-14 sm:w-14">
                {cell !== 0 && (
                  <div className={`h-4/5 w-4/5 rounded-full shadow-md transition-all duration-300 ${cell === 1 ? 'bg-black' : 'bg-white'}`} />
                )}
                {canPlace && (
                  <div className="h-3 w-3 rounded-full bg-black/20 animate-pulse" />
                )}
              </button>
            );
          }))}
        </div>

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm rounded">
            <h2 className="text-3xl font-bold mb-4 text-white uppercase tracking-widest">
              {counts.black > counts.white ? "Black Wins!" : counts.black < counts.white ? "White Wins!" : "Draw!"}
            </h2>
            <div className="flex gap-4">
              <button onClick={() => {setBoard(initialBoard); setGameOver(false); setIsBlackTurn(true);}} className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2 rounded-full font-bold shadow-lg">
                Rematch
              </button>
              <button onClick={() => setGameMode('select')} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-full font-bold shadow-lg">
                Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}