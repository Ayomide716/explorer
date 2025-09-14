"use client";

import { useRef, useState, type RefObject } from 'react';
import GalaxyCanvas, { type GalaxyCanvasHandle, type GalaxyParameters } from '@/components/galaxy/galaxy-canvas';
import GalaxyControls from '@/components/galaxy/galaxy-controls';

export default function Home() {
  const galaxyRef = useRef<GalaxyCanvasHandle>(null);
  
  const [galaxyParams, setGalaxyParams] = useState<GalaxyParameters>({
    count: 100000,
    radius: 5,
    branches: 5,
    spin: 0.5,
    randomness: 0.2,
    randomnessPower: 3,
  });

  const handleGenerate = (params: GalaxyParameters) => {
    setGalaxyParams(params);
    galaxyRef.current?.regenerate(params);
  };

  const handleSetView = (preset: 'top' | 'side') => {
    galaxyRef.current?.setCameraPosition(preset);
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background">
      <GalaxyCanvas ref={galaxyRef} initialParams={galaxyParams} />
      <GalaxyControls 
        onGenerate={handleGenerate} 
        onSetView={handleSetView}
        initialParams={galaxyParams}
      />
      <div className="absolute bottom-4 left-4 z-10 text-xs text-muted-foreground font-headline">
        <p>Cosmic Explorer</p>
        <p className="hidden md:block">Use your mouse to explore. Press 'B' to toggle controls.</p>
      </div>
    </main>
  );
}
