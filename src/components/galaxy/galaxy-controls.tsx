"use client";

import { useState, useMemo, useEffect } from 'react';
import { Camera, RefreshCw, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import type { GalaxyParameters } from './galaxy-canvas';

type GalaxyControlsProps = {
  onGenerate: (params: GalaxyParameters) => void;
  onSetView: (preset: 'top' | 'side') => void;
  initialParams: GalaxyParameters;
};

export default function GalaxyControls({ onGenerate, onSetView, initialParams }: GalaxyControlsProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [params, setParams] = useState<GalaxyParameters>(initialParams);

  const debouncedOnGenerate = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (newParams: GalaxyParameters) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        onGenerate(newParams);
      }, 300); 
    };
  }, [onGenerate]);

  const handleSliderChange = (key: keyof GalaxyParameters) => (value: number[]) => {
    const newParams = { ...params, [key]: value[0] };
    setParams(newParams);
    debouncedOnGenerate(newParams);
  };

  const handleGenerateClick = () => {
    onGenerate(params);
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'b') {
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);


  const buttonStyle = "w-full justify-start text-left bg-muted hover:bg-muted/80 border-border text-foreground";
  const iconStyle = "mr-2 h-5 w-5 drop-shadow-[0_0_5px_hsl(var(--accent))] text-accent";

  return (
    <div className="absolute top-4 right-4 z-10">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Card className="w-80 bg-background/50 backdrop-blur-sm border-border shadow-2xl shadow-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-headline text-2xl text-accent">Controls</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <PanelRightClose />
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 pt-2">
                
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="count" className="text-sm font-medium text-muted-foreground ml-1">Stars: {params.count.toLocaleString()}</Label>
                    <Slider id="count" min={1000} max={200000} step={1000} value={[params.count]} onValueChange={handleSliderChange('count')} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="radius" className="text-sm font-medium text-muted-foreground ml-1">Radius: {params.radius.toFixed(1)}</Label>
                    <Slider id="radius" min={1} max={10} step={0.1} value={[params.radius]} onValueChange={handleSliderChange('radius')} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="branches" className="text-sm font-medium text-muted-foreground ml-1">Arms: {params.branches}</Label>
                    <Slider id="branches" min={2} max={20} step={1} value={[params.branches]} onValueChange={handleSliderChange('branches')} />
                  </div>
                  <div className="grid gap-2">
                     <Label htmlFor="spin" className="text-sm font-medium text-muted-foreground ml-1">Spin: {params.spin.toFixed(2)}</Label>
                    <Slider id="spin" min={-2} max={2} step={0.01} value={[params.spin]} onValueChange={handleSliderChange('spin')} />
                  </div>
                   <div className="grid gap-2">
                     <Label htmlFor="randomness" className="text-sm font-medium text-muted-foreground ml-1">Randomness: {params.randomness.toFixed(2)}</Label>
                    <Slider id="randomness" min={0} max={2} step={0.01} value={[params.randomness]} onValueChange={handleSliderChange('randomness')} />
                  </div>
                   <div className="grid gap-2">
                     <Label htmlFor="randomnessPower" className="text-sm font-medium text-muted-foreground ml-1">Random Power: {params.randomnessPower.toFixed(2)}</Label>
                    <Slider id="randomnessPower" min={1} max={10} step={0.1} value={[params.randomnessPower]} onValueChange={handleSliderChange('randomnessPower')} />
                  </div>
                </div>

                <Button variant="outline" className={buttonStyle} onClick={handleGenerateClick}>
                  <RefreshCw className={iconStyle} />
                  Regenerate with new Colors
                </Button>

                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-muted-foreground ml-1">Preset Views</p>
                  <Button variant="outline" className={buttonStyle} onClick={() => onSetView('top')}>
                    <Camera className={iconStyle} />
                    Top-Down View
                  </Button>
                  <Button variant="outline" className={buttonStyle} onClick={() => onSetView('side')}>
                    <Camera className={iconStyle} />
                    Side View
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
             <Button variant="outline" size="icon" onClick={() => setIsOpen(true)} className="bg-background/50 backdrop-blur-sm border-border h-12 w-12 rounded-full shadow-2xl shadow-primary/20">
                <PanelRightOpen className="h-6 w-6 text-accent drop-shadow-[0_0_5px_hsl(var(--accent))]"/>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
