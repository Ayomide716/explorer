"use client";

import { useRef, useState, useEffect } from 'react';
import GalaxyCanvas, { type GalaxyCanvasHandle, type GalaxyParameters } from '@/components/galaxy/galaxy-canvas';
import GalaxyControls from '@/components/galaxy/galaxy-controls';
import { Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InfoPopup, { type InfoPopupData } from '@/components/galaxy/info-popup';

const popUpData: Record<string, InfoPopupData> = {
  'black-hole': {
    title: 'Supermassive Black Hole',
    description: "At the center of most large galaxies, including our own Milky Way, lies a supermassive black hole. These cosmic giants can have masses millions or even billions of times that of our sun. They have an incredibly strong gravitational pull from which nothing, not even light, can escape.",
    imageUrl: 'https://images.unsplash.com/photo-1614726365902-18152349cf17?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    imageHint: 'black hole',
  }
};


export default function Home() {
  const galaxyRef = useRef<GalaxyCanvasHandle>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [popupContent, setPopupContent] = useState<InfoPopupData | null>(null);
  
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

  const handleObjectClick = (objectType: string) => {
    if (popUpData[objectType]) {
      setPopupContent(popUpData[objectType]);
    }
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
      <GalaxyCanvas 
        ref={galaxyRef} 
        initialParams={galaxyParams}
        onObjectClick={handleObjectClick} 
      />
      <GalaxyControls 
        onGenerate={handleGenerate} 
        onSetView={handleSetView}
        onWarp={handleWarp}
        initialParams={galaxyParams}
      />
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleMusic} className="text-muted-foreground hover:text-foreground">
          <Music className={`h-6 w-6 ${isPlaying ? 'text-accent drop-shadow-[0_0_5px_hsl(var(--accent))]' : ''}`} />
        </Button>
        <div className="text-xs text-muted-foreground font-headline">
            <p>Cosmic Explorer</p>
            <p className="hidden md:block">Click objects to learn more. Use your mouse to explore. Press 'B' to toggle controls.</p>
        </div>
      </div>
      <InfoPopup
        data={popupContent}
        open={!!popupContent}
        onOpenChange={() => setPopupContent(null)}
      />
    </main>
  );
}
