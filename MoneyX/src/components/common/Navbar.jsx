import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const Navbar = ({ title, showBack = false, actions = null }) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-top">
      <div className="flex h-14 items-center justify-between px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2 flex-1">
          {showBack ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : null}
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
};
