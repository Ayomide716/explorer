"use client";

import { useRef, type RefObject } from 'react';
import GalaxyCanvas, { type GalaxyCanvasHandle } from '@/components/galaxy/galaxy-canvas';
import GalaxyControls from '@/components/galaxy/galaxy-controls';

export default function Home() {
  const galaxyRef = useRef<GalaxyCanvasHandle>(null);

  const handleGenerate = () => {
    galaxyRef.current?.regenerate();
  };

  const handleSetView = (preset: 'top' | 'side') => {
    galaxyRef.current?.setCameraPosition(preset);
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background">
      <GalaxyCanvas ref={galaxyRef} />
      <GalaxyControls 
        onGenerate={handleGenerate} 
        onSetView={handleSetView} 
      />
      <div className="absolute bottom-4 left-4 z-10 text-xs text-muted-foreground font-headline">
        <p>Cosmic Explorer</p>
        <p className="hidden md:block">Use your mouse to explore. Press 'B' to toggle controls.</p>
      </div>
    </main>
  );
}
