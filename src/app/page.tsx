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

    const blackCanMove = checkAnywhereCanPlace(board, 1);
    const whiteCanMove = checkAnywhereCanPlace(board, 2);

    if (b + w === 64 || b === 0 || w === 0 || (!blackCanMove && !whiteCanMove)) {
      setGameOver(true);
    } else if (!isBlackTurn && !whiteCanMove) {
      setIsBlackTurn(true); 
    } else if (isBlackTurn && !blackCanMove) {
      setIsBlackTurn(false);
    }
  }, [board, isBlackTurn]);

  // 【強化版】AIの動作ロジック
  useEffect(() => {
    if (gameMode === 'solo' && !isBlackTurn && !gameOver) {
      const timer = setTimeout(() => {
        const candidates: {y: number, x: number, score: number}[] = [];
        
        board.forEach((row, y) => row.forEach((_, x) => {
          if (checkCanPlace(board, y, x, 2)) {
            let score = 0;
            // セオリー1: 四隅(0,0), (0,7), (7,0), (7,7) は非常に価値が高い
            if ((y === 0 || y === 7) && (x === 0 || x === 7)) {
              score = 100;
            } 
            // セオリー2: 端(辺)も少し価値が高い
            else if (y === 0 || y === 7 || x === 0 || x === 7) {
              score = 10;
            }
            // セオリー3: 角の隣(X打ち)などは本当はマイナス評価だが、今回はシンプルに加点方式
            else {
              score = 1;
            }
            candidates.push({y, x, score});
          }
        }));

        if (candidates.length > 0) {
          // 最もスコアが高い手の中から選ぶ
          candidates.sort((a, b) => b.score - a.score);
          const topScore = candidates[0].score;
          const bestMoves = candidates.filter(c => c.score === topScore);
          const choice = bestMoves[Math.floor(Math.random() * bestMoves.length)];
          placeStone(choice.y, choice.x);
        }
      }, 800);
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
        <h1 className="mb-2 text-5xl font-black tracking-tighter text-emerald-500">オセロ pro</h1>
        <p className="mb-12 text-slate-400 text-sm italic">made by shinnosuke mitsuda</p>
        <div className="flex flex-col gap-4 w-64">
          <button onClick={() => setGameMode('solo')} className="bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl font-bold shadow-lg transition-transform active:scale-95">
            一人で遊ぶ (VS AI)
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
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-black tracking-tighter">オセロ pro</h1>
          <span className="text-[10px] text-slate-500">made by shinnosuke mitsuda</span>
        </div>
        <div className="text-xs text-emerald-400">{gameMode === 'solo' ? 'VS AI' : '2 PLAYERS'}</div>
      </div>
      
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
            <h2 className="text-3xl font-bold mb-4 text-white uppercase tracking-widest text-center px-4">
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