import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { MainScene } from './MainScene';
import Preload from "./Preload.js";

export function PhaserGame({ children }) {
  const parentRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    if (gameRef.current || !parentRef.current) return; // защита от двойного эффекта в StrictMode
    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: parentRef.current,
      width: 480,
      height: 720,
      backgroundColor: '#dfe9f8',
      physics: { default: 'matter', matter: { gravity: { x: 0, y: 1.4 }, debug: false } },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [Preload,MainScene],
      audio: {
        disableWebAudio: false
      },
    });
    return () => { gameRef.current?.destroy(true); gameRef.current = null; };
  }, []);

  return (
      <div className="shell">
        <div ref={parentRef} className="game"/>
        {children}
      </div>
  );
}
