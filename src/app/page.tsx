"use client";

import { useRef, useState, useEffect } from 'react';
import GalaxyCanvas, { type GalaxyCanvasHandle, type GalaxyParameters } from '@/components/galaxy/galaxy-canvas';
import GalaxyControls from '@/components/galaxy/galaxy-controls';
import { Music } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const galaxyRef = useRef<GalaxyCanvasHandle>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  
  const [galaxyParams, setGalaxyParams] = useState<GalaxyParameters>({
    count: 150000,
    radius: 7,
    branches: 10,
    spin: 0.5,
    randomness: 0.5,
    randomnessPower: 4,
  });

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        // Autoplay was prevented, user will need to click the button.
        setIsPlaying(false);
      });
    }
  }, []);

  const handleGenerate = (params: GalaxyParameters) => {
    galaxyRef.current?.regenerate(params);
  };

  const handleSetView = (preset: 'top' | 'side') => {
    galaxyRef.current?.setCameraPosition(preset);
  };

  const handleWarp = () => {
    galaxyRef.current?.triggerWarp();
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background">
      <audio ref={audioRef} src="/ambient-soundscapes-007-space-atmosphere-304974.mp3" loop autoPlay />
      <GalaxyCanvas ref={galaxyRef} initialParams={galaxyParams} />
      <GalaxyControls 
        onGenerate={handleGenerate} 
        onSetView={handleSetView}
        onWarp={handleWarp}
        initialParams={galaxyParams}
      />
      <div className="absolute bottom-4 left-4 z-10 text-xs text-muted-foreground font-headline">
        <p>Cosmic Explorer</p>
        <p className="hidden md:block">Use your mouse to explore. Press 'B' to toggle controls.</p>
      </div>
      <div className="absolute bottom-4 right-4 z-10">
        <Button variant="ghost" size="icon" onClick={toggleMusic} className="text-muted-foreground hover:text-foreground">
          <Music className={`h-6 w-6 ${isPlaying ? 'text-accent drop-shadow-[0_0_5px_hsl(var(--accent))]' : ''}`} />
        </Button>
      </div>
    </main>
  );
}
