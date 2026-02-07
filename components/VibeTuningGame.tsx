
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { STRATEGY_ITEMS } from '../constants';
import { StrategyItem } from '../types';

interface FallingItem extends StrategyItem {
  uid: number;
  x: number;
  y: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
}

interface FeedbackPop {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

interface VibeTuningGameProps {
  onComplete: (achievements: StrategyItem[]) => void;
}

const VibeTuningGame: React.FC<VibeTuningGameProps> = ({ onComplete }) => {
  const [basketX, setBasketX] = useState(50);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [score, setScore] = useState(0);
  const [caughtItems, setCaughtItems] = useState<StrategyItem[]>([]);
  const [gameTime, setGameTime] = useState(30); 
  const [isActive, setIsActive] = useState(false);
  const [activeTip, setActiveTip] = useState<StrategyItem | null>(null);
  const [pops, setPops] = useState<FeedbackPop[]>([]);
  const [combo, setCombo] = useState(0);
  const [autoResumeProgress, setAutoResumeProgress] = useState(100);
  const [isFinishing, setIsFinishing] = useState(false);
  
  const gameRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(null);
  const lastSpawnTimeRef = useRef<number>(0);
  const popIdCounter = useRef(0);
  
  const basketXRef = useRef(50);
  const comboRef = useRef(0);
  const itemsRef = useRef<FallingItem[]>([]);
  const caughtItemsRef = useRef<StrategyItem[]>([]);
  const resumeTimerRef = useRef<number | null>(null);

  const createPop = (x: number, y: number, text: string, color: string) => {
    const id = ++popIdCounter.current;
    setPops(prev => [...prev, { id, x, y, text, color }]);
    setTimeout(() => {
      setPops(prev => prev.filter(p => p.id !== id));
    }, 800);
  };

  const startGame = () => {
    setIsActive(true);
    setIsFinishing(false);
    setScore(0);
    setCaughtItems([]);
    caughtItemsRef.current = [];
    setItems([]);
    itemsRef.current = [];
    setGameTime(30);
    setCombo(0);
    comboRef.current = 0;
    basketXRef.current = 50;
    setBasketX(50);
    lastSpawnTimeRef.current = performance.now();
    setActiveTip(null);
  };

  const resumeGame = useCallback(() => {
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    setActiveTip(null);
    lastSpawnTimeRef.current = performance.now(); 
  }, []);

  // Timer logic
  useEffect(() => {
    if (!isActive || isFinishing) return;
    const timer = setInterval(() => {
      setGameTime((t) => {
        if (t <= 1) {
          setIsFinishing(true);
          setTimeout(() => setIsActive(false), 2000); // Smooth transition to end screen
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive, isFinishing]);

  // Auto-resume timer logic for tips (10 SECONDS)
  useEffect(() => {
    if (activeTip) {
      setAutoResumeProgress(100);
      const duration = 10000;
      const startTime = Date.now();

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setAutoResumeProgress(remaining);
        if (remaining <= 0) clearInterval(progressInterval);
      }, 50);

      resumeTimerRef.current = window.setTimeout(() => {
        resumeGame();
      }, duration);

      return () => {
        clearInterval(progressInterval);
        if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
      };
    }
  }, [activeTip, resumeGame]);

  const animate = useCallback((time: number) => {
    if (!isActive || activeTip || isFinishing) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    const spawnThreshold = 800; 
    if (time - lastSpawnTimeRef.current > spawnThreshold) {
      const template = STRATEGY_ITEMS[Math.floor(Math.random() * STRATEGY_ITEMS.length)];
      const newItem: FallingItem = {
        ...template,
        uid: Math.random(),
        x: Math.random() * 80 + 10,
        y: -10,
        speed: Math.random() * 0.4 + 0.6,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2,
      };
      itemsRef.current.push(newItem);
      lastSpawnTimeRef.current = time;
    }

    const nextItems: FallingItem[] = [];
    let collisionDetected: StrategyItem | null = null;

    itemsRef.current.forEach((item) => {
      const updatedItem = {
        ...item,
        y: item.y + item.speed,
        rotation: item.rotation + item.rotationSpeed
      };

      const isColliding = 
        updatedItem.y > 78 && 
        updatedItem.y < 96 && 
        Math.abs(updatedItem.x - basketXRef.current) < 15;

      if (isColliding) {
        if (item.type === 'good') {
          const currentCombo = comboRef.current;
          const points = 30 + (currentCombo * 10);
          setScore(s => s + points);
          comboRef.current += 1;
          setCombo(comboRef.current);
          createPop(item.x, item.y, `+${points} ✨`, 'text-green-400');
          
          const alreadyCaught = caughtItemsRef.current.some(i => i.id === item.id);
          if (!alreadyCaught) {
            collisionDetected = item;
            caughtItemsRef.current.push(item);
            setCaughtItems([...caughtItemsRef.current]);
          }
        } else {
          setScore(s => Math.max(0, s - 40));
          comboRef.current = 0;
          setCombo(0);
          createPop(item.x, item.y, `-40 ⚡️`, 'text-red-500');
        }
      } else if (updatedItem.y < 110) {
        nextItems.push(updatedItem);
      }
    });

    if (collisionDetected) {
      setActiveTip(collisionDetected);
    }

    itemsRef.current = nextItems;
    setItems([...nextItems]);
    requestRef.current = requestAnimationFrame(animate);
  }, [isActive, activeTip, isFinishing]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  const handleInput = (clientX: number) => {
    if (!gameRef.current || activeTip || isFinishing) return;
    const rect = gameRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const constrainedX = Math.max(5, Math.min(95, x));
    setBasketX(constrainedX);
    basketXRef.current = constrainedX;
  };

  return (
    <div className="flex flex-col animate-pop select-none w-full relative overflow-hidden" style={{ height: 'calc(100dvh - 120px)', minHeight: '480px', touchAction: 'none' }}>
      {/* HUD */}
      <div className="flex justify-between items-center mb-3 px-1 z-10">
        <div className="bg-orange-500 text-white px-4 py-2 rounded-2xl font-black text-sm shadow-lg border-2 border-orange-400">
          SCORE: {score}
        </div>
        <div className="bg-slate-800 text-white px-4 py-2 rounded-2xl font-black text-sm shadow-lg border-2 border-slate-700 tabular-nums">
          {gameTime}s
        </div>
      </div>

      {!isActive && !isFinishing && gameTime === 30 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 bg-gradient-to-br from-orange-50 to-indigo-50 rounded-3xl border-2 border-white shadow-xl relative z-20">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-5xl shadow-xl animate-float border-2 border-orange-100">💎</div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Vibe Tuning</h2>
            <p className="text-slate-600 font-bold text-base">Catch Strategy Crystals to sharpen your tools!</p>
          </div>
          <button onClick={startGame} className="px-12 py-5 bg-orange-500 text-white rounded-3xl font-black text-2xl shadow-xl uppercase tracking-wide border-b-4 border-orange-700 active:scale-95 transition-transform">START 🚀</button>
        </div>
      ) : !isActive && gameTime === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 animate-pop bg-white rounded-3xl shadow-xl relative z-20">
          <div className="text-7xl">🏆</div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Quest Complete!</h2>
          <div className="bg-slate-900 p-8 rounded-3xl w-full text-white shadow-xl max-w-xs">
            <p className="text-[10px] font-black text-slate-500 tracking-[0.4em] mb-2 uppercase">Final Score</p>
            <div className="text-6xl font-black">{score}</div>
          </div>
          <button onClick={() => onComplete(caughtItems)} className="w-full max-w-xs py-5 bg-orange-500 text-white rounded-3xl font-black text-xl shadow-xl uppercase active:scale-95 transition-all">SEE RESULTS 💎</button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          <div ref={gameRef} className="flex-1 relative bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl"
            onMouseMove={(e) => handleInput(e.clientX)}
            onTouchStart={(e) => { e.preventDefault(); handleInput(e.touches[0].clientX); }}
            onTouchMove={(e) => { e.preventDefault(); handleInput(e.touches[0].clientX); }}
          >
            {isFinishing && (
              <div className="absolute inset-0 z-[150] flex items-center justify-center bg-orange-500/90 backdrop-blur-md animate-pop">
                 <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter animate-bounce">FINISH!</h2>
              </div>
            )}

            {activeTip && (
                <div className="absolute inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 animate-pop">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 text-center space-y-5 border-4 border-orange-500 max-w-sm w-full relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-1.5 bg-orange-500 transition-all duration-75 rounded-full" style={{ width: `${autoResumeProgress}%` }}></div>
                        <div className="text-6xl bg-orange-50 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto border-2 border-orange-100">{activeTip.emoji}</div>
                        <div className="space-y-3">
                            <h3 className="text-3xl font-black text-slate-900 uppercase leading-none">{activeTip.label}</h3>
                            <p className="text-lg font-bold text-slate-600">{activeTip.tip}</p>
                        </div>
                        <button onClick={resumeGame} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform uppercase">GOT IT! 👊</button>
                    </div>
                </div>
            )}

            {pops.map(pop => (
              <div key={pop.id} className={`absolute font-black text-2xl animate-bounce drop-shadow-lg z-50 ${pop.color}`} style={{ left: `${pop.x}%`, top: `${pop.y - 15}%`, transform: 'translateX(-50%)' }}>{pop.text}</div>
            ))}

            <div className="absolute inset-0 pointer-events-none">
              {items.map((item) => (
                <div key={item.uid} className="absolute transform -translate-x-1/2 flex flex-col items-center z-30" style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translateX(-50%) rotate(${item.rotation}deg)`, opacity: (activeTip || isFinishing) ? 0.05 : 1, transition: 'opacity 0.3s' }}>
                  <div className={`text-4xl p-3 rounded-2xl border-2 border-white shadow-lg ${item.type === 'good' ? 'bg-green-500' : 'bg-red-500'}`}>{item.emoji}</div>
                </div>
              ))}
            </div>

            <div className="absolute transform -translate-x-1/2 flex items-center justify-center z-40" style={{ left: `${basketX}%`, bottom: '8%', opacity: (activeTip || isFinishing) ? 0.05 : 1, transition: 'opacity 0.3s' }}>
              <div className="w-20 h-20 rounded-2xl bg-orange-500 flex items-center justify-center text-4xl shadow-xl border-2 border-white transition-transform">⭐️</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VibeTuningGame;
