"use client";

import { useState } from 'react';
import { Camera, RefreshCw, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';

type GalaxyControlsProps = {
  onGenerate: () => void;
  onSetView: (preset: 'top' | 'side') => void;
};

export default function GalaxyControls({ onGenerate, onSetView }: GalaxyControlsProps) {
  const [isOpen, setIsOpen] = useState(true);

  const buttonStyle = "w-full justify-start text-left bg-primary/50 hover:bg-primary/80 border-primary text-primary-foreground";
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
            <Card className="w-64 bg-background/50 backdrop-blur-sm border-primary/50 shadow-2xl shadow-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-headline text-2xl text-accent">Controls</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <PanelRightClose />
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 pt-2">
                <Button variant="outline" className={buttonStyle} onClick={onGenerate}>
                  <RefreshCw className={iconStyle} />
                  Generate New Galaxy
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
             <Button variant="outline" size="icon" onClick={() => setIsOpen(true)} className="bg-background/50 backdrop-blur-sm border-primary/50 h-12 w-12 rounded-full shadow-2xl shadow-primary/20">
                <PanelRightOpen className="h-6 w-6 text-accent drop-shadow-[0_0_5px_hsl(var(--accent))]"/>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
