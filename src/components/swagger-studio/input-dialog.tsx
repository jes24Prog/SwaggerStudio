
"use client"

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InputDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description: string;
  inputLabel: string;
  initialValue?: string;
  onConfirm: (value: string) => void;
}

export function InputDialog({ isOpen, onOpenChange, title, description, inputLabel, initialValue = '', onConfirm }: InputDialogProps) {
  const [inputValue, setInputValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue);
    }
  }, [isOpen, initialValue]);

  const handleConfirm = () => {
    onConfirm(inputValue);
    onOpenChange(false);
    setInputValue('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
        setInputValue('');
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="input-name" className="text-right">
              {inputLabel}
            </Label>
            <Input 
              id="input-name" 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
              className="col-span-3" 
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!inputValue.trim()}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    