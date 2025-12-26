import { useEffect, useState } from 'react';
import wassiLogo from '@/assets/wassi-tv-logo.png';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Logo with glow effect */}
        <div className="relative mb-6 animate-fade-in">
          <div className="absolute inset-0 blur-2xl bg-primary/30 scale-110" />
          <img 
            src={wassiLogo} 
            alt="Wassi TV" 
            className="relative w-40 h-40 md:w-56 md:h-56 object-contain drop-shadow-2xl"
          />
        </div>

        {/* Developer Credit */}
        <p className="text-muted-foreground text-base md:text-lg mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Developed by <span className="text-foreground font-bold">Zaid Ashiq</span>
        </p>

        {/* Rainbow Loading Spinner */}
        <div className="relative w-16 h-16 md:w-20 md:h-20 mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <svg className="w-full h-full animate-spin" style={{ animationDuration: '1.5s' }} viewBox="0 0 50 50">
            <defs>
              <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B6B" />
                <stop offset="16%" stopColor="#FFB347" />
                <stop offset="33%" stopColor="#FFFF6B" />
                <stop offset="50%" stopColor="#6BFF6B" />
                <stop offset="66%" stopColor="#6BFFFF" />
                <stop offset="83%" stopColor="#6B6BFF" />
                <stop offset="100%" stopColor="#FF6BFF" />
              </linearGradient>
            </defs>
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="url(#rainbow)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="80 40"
            />
          </svg>
          {/* Inner dots */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div 
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <p className="text-foreground text-lg md:text-xl font-semibold animate-pulse">
          Loading...
        </p>

        {/* Progress Bar */}
        <div className="w-48 md:w-64 h-1.5 bg-secondary rounded-full mt-6 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary via-orange-400 to-primary rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
