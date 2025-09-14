"use client";

import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export type InfoPopupData = {
  title: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

type InfoPopupProps = {
  data: InfoPopupData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function InfoPopup({ data, open, onOpenChange }: InfoPopupProps) {
  if (!data) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="aspect-video relative w-full mb-4 rounded-md overflow-hidden">
             <Image 
                src={data.imageUrl} 
                alt={data.title}
                fill
                className="object-cover"
                data-ai-hint={data.imageHint}
              />
          </div>
          <AlertDialogTitle className="font-headline text-2xl text-accent">
            {data.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base text-foreground/80">
            {data.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
