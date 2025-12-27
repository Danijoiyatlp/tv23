import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { X, Volume2, VolumeX, Maximize, Minimize, Play, Pause, SkipBack, SkipForward, Settings, Radio } from 'lucide-react';
import { Channel } from '@/data/channels';
import splashImage from '@/assets/wassi-tv-player-splash.png';

interface VideoPlayerProps {
  channel: Channel;
  onClose: () => void;
}

const VideoPlayer = ({ channel, onClose }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(channel.streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        setIsLoading(false);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError('Stream unavailable. Please try another channel.');
          setIsLoading(false);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = channel.streamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play();
        setIsLoading(false);
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [channel.streamUrl]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPaused(false);
      } else {
        videoRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (!isPaused) {
        setShowControls(false);
      }
    }, 3000);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background animate-fade-in">
      <div 
        ref={containerRef}
        className="relative w-full h-full flex flex-col"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => !isPaused && setShowControls(false)}
      >
        {/* Top Bar */}
        <div className={`absolute top-0 left-0 right-0 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-gradient-to-b from-background via-background/80 to-transparent p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src={channel.logoUrl} 
                  alt={channel.name}
                  className="w-12 h-12 md:w-14 md:h-14 object-contain rounded-xl bg-secondary/50 backdrop-blur-sm p-2 border border-border/50"
                />
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-foreground">{channel.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Radio className="w-3 h-3 text-primary animate-pulse" />
                    <span className="text-xs md:text-sm text-primary font-medium">LIVE NOW</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 rounded-full bg-secondary/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 border border-border/50"
                aria-label="Close player"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Video Container */}
        <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-20 h-20 border-l-2 border-t-2 border-primary/50 pointer-events-none z-30" />
          <div className="absolute top-0 right-0 w-20 h-20 border-r-2 border-t-2 border-primary/50 pointer-events-none z-30" />
          <div className="absolute bottom-0 left-0 w-20 h-20 border-l-2 border-b-2 border-primary/50 pointer-events-none z-30" />
          <div className="absolute bottom-0 right-0 w-20 h-20 border-r-2 border-b-2 border-primary/50 pointer-events-none z-30" />
          
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-background">
              {/* Background gradient effects */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
              
              <img 
                src={splashImage} 
                alt="Loading Wassi TV" 
                className="relative w-48 h-48 md:w-64 md:h-64 object-contain mb-6 drop-shadow-2xl animate-pulse"
              />
              
              {/* Rainbow spinner */}
              <div className="relative w-14 h-14 mb-4">
                <svg className="w-full h-full animate-spin" style={{ animationDuration: '1.5s' }} viewBox="0 0 50 50">
                  <defs>
                    <linearGradient id="rainbow-player" x1="0%" y1="0%" x2="100%" y2="100%">
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
                    stroke="url(#rainbow-player)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="80 40"
                  />
                </svg>
              </div>
              
              <p className="text-foreground text-lg font-semibold animate-pulse">Loading Stream...</p>
              <p className="text-muted-foreground text-sm mt-2">{channel.name}</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/95">
              <div className="text-center p-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center">
                  <X className="w-10 h-10 text-destructive" />
                </div>
                <p className="text-xl text-destructive mb-2 font-semibold">{error}</p>
                <p className="text-muted-foreground mb-6">Please select another channel to continue watching</p>
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all font-medium"
                >
                  Browse Channels
                </button>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            autoPlay
            onClick={togglePlayPause}
          />
        </div>

        {/* Bottom Controls */}
        <div className={`absolute bottom-0 left-0 right-0 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-gradient-to-t from-background via-background/80 to-transparent p-4 md:p-6">
            {/* Progress bar aesthetic */}
            <div className="w-full h-1 bg-secondary/50 rounded-full mb-4 overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '100%' }} />
            </div>
            
            <div className="flex items-center justify-between gap-4">
              {/* Left Controls */}
              <div className="flex items-center gap-2 md:gap-4">
                <button
                  onClick={togglePlayPause}
                  className="p-3 md:p-4 rounded-full bg-primary text-primary-foreground hover:scale-110 transition-all duration-300 shadow-lg shadow-primary/30"
                  aria-label={isPaused ? "Play" : "Pause"}
                >
                  {isPaused ? (
                    <Play className="w-5 h-5 md:w-6 md:h-6 ml-0.5" />
                  ) : (
                    <Pause className="w-5 h-5 md:w-6 md:h-6" />
                  )}
                </button>
                
                <button
                  className="p-2 md:p-3 rounded-full bg-secondary/80 backdrop-blur-sm hover:bg-muted transition-all border border-border/50 hidden sm:flex"
                  aria-label="Previous"
                >
                  <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                
                <button
                  className="p-2 md:p-3 rounded-full bg-secondary/80 backdrop-blur-sm hover:bg-muted transition-all border border-border/50 hidden sm:flex"
                  aria-label="Next"
                >
                  <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
                </button>

                {/* Volume Control */}
                <div className="flex items-center gap-2 group">
                  <button
                    onClick={toggleMute}
                    className="p-2 md:p-3 rounded-full bg-secondary/80 backdrop-blur-sm hover:bg-muted transition-all border border-border/50"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 md:w-5 md:h-5" />
                    ) : (
                      <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-0 group-hover:w-20 md:group-hover:w-24 transition-all duration-300 h-1 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  className="p-2 md:p-3 rounded-full bg-secondary/80 backdrop-blur-sm hover:bg-muted transition-all border border-border/50 hidden sm:flex"
                  aria-label="Settings"
                >
                  <Settings className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                
                <button
                  onClick={toggleFullscreen}
                  className="p-2 md:p-3 rounded-full bg-secondary/80 backdrop-blur-sm hover:bg-muted transition-all border border-border/50"
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4 md:w-5 md:h-5" />
                  ) : (
                    <Maximize className="w-4 h-4 md:w-5 md:h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-black to-purple-900 animate-fade-in">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 animate-float"
            style={{
              width: Math.random() * 60 + 20,
              height: Math.random() * 60 + 20,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 10}s`,
            }}
          />
        ))}
      </div>

      <div 
        ref={containerRef}
        className="relative w-full h-full flex flex-col"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => !isPaused && setShowControls(false)}
      >
        {/* Floating Top Bar */}
        <div className={`absolute top-0 left-0 right-0 z-40 transition-all duration-500 ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-xl blur-md opacity-60" />
                  <img 
                    src={channel.logoUrl} 
                    alt={channel.name}
                    className="relative w-14 h-14 md:w-16 md:h-16 object-contain rounded-xl bg-black/80 backdrop-blur-sm p-2 border border-white/10"
                  />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow-lg">{channel.name}</h2>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30">
                      <Radio className="w-3 h-3 text-primary animate-pulse" />
                      <span className="text-xs font-medium text-primary">LIVE</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <Signal className="w-3 h-3" />
                      <span>HD • 1080p</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/70">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(currentTime)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/10 group"
                  aria-label="Like channel"
                >
                  <Heart className={`w-5 h-5 transition-all duration-300 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white/70 group-hover:text-white'}`} />
                </button>
                
                <button
                  className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/10"
                  aria-label="Share"
                >
                  <Share2 className="w-5 h-5 text-white/70 hover:text-white" />
                </button>
                
                <button
                  onClick={onClose}
                  className="p-3 rounded-full bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 transition-all duration-300 border border-red-500/30 backdrop-blur-sm group"
                  aria-label="Close player"
                >
                  <X className="w-5 h-5 text-red-400 group-hover:text-red-300" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Video Container */}
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
          {/* Neon Border Effect */}
          <div className="absolute inset-0 z-20">
            <div className="absolute inset-0 border-[16px] border-transparent rounded-3xl">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/20 via-transparent to-purple-500/20 blur-sm" />
            </div>
          </div>

          {/* Corner accents */}
          <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary/50 rounded-tl-xl" />
          <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-purple-500/50 rounded-tr-xl" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-primary/50 rounded-bl-xl" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-purple-500/50 rounded-br-xl" />

          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/90">
              {/* Animated gradient background */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
              
              {/* Animated logo */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-3xl blur-xl animate-pulse" />
                <img 
                  src={splashImage} 
                  alt="Loading Wassi TV" 
                  className="relative w-56 h-56 md:w-72 md:h-72 object-contain drop-shadow-2xl animate-float"
                  style={{ animationDuration: '3s' }}
                />
              </div>
              
              {/* Loading indicator */}
              <div className="relative">
                <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary via-purple-500 to-primary rounded-full animate-loading-bar" />
                </div>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Zap className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-white font-medium">Buffering stream...</span>
                  <span className="text-white/60 text-sm ml-2">{channel.name}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/95 backdrop-blur-sm">
              <div className="text-center p-8 max-w-md">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 to-pink-500/30 rounded-full blur-xl" />
                  <div className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 flex items-center justify-center">
                    <X className="w-12 h-12 text-red-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Stream Unavailable</h3>
                <p className="text-white/70 mb-6">The channel is currently experiencing technical difficulties. Please try another channel.</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl hover:opacity-90 transition-all font-medium shadow-lg shadow-primary/20"
                  >
                    Browse Channels
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all font-medium border border-white/20"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            className="w-full h-full object-contain z-10"
            playsInline
            autoPlay
            onClick={togglePlayPause}
          />

          {/* Play/Pause overlay */}
          {!isLoading && !error && (
            <div 
              className={`absolute inset-0 z-20 flex items-center justify-center transition-all duration-300 ${isPaused ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              onClick={togglePlayPause}
            >
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              <div className="relative p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl">
                <Play className="w-16 h-16 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls Panel */}
        <div className={`absolute bottom-0 left-0 right-0 z-40 transition-all duration-500 ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
          <div className="p-4 md:p-6">
            <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-6 shadow-2xl">
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-white/70 mb-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-primary [&::-webkit-slider-thumb]:to-purple-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                />
                <div className="flex justify-between text-xs text-white/50 mt-1">
                  <span>Live</span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Buffered: 100%
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                {/* Left controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlayPause}
                    className="p-4 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white hover:scale-110 transition-all duration-300 shadow-lg shadow-primary/30 hover:shadow-primary/50"
                    aria-label={isPaused ? "Play" : "Pause"}
                  >
                    {isPaused ? (
                      <Play className="w-6 h-6 ml-0.5" />
                    ) : (
                      <Pause className="w-6 h-6" />
                    )}
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/10">
                      <SkipBack className="w-5 h-5 text-white/70 hover:text-white" />
                    </button>
                    <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/10">
                      <SkipForward className="w-5 h-5 text-white/70 hover:text-white" />
                    </button>
                  </div>

                  {/* Volume */}
                  <div className="flex items-center gap-3 ml-4">
                    <button
                      onClick={toggleMute}
                      className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-5 h-5 text-white/70 hover:text-white" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-white/70 hover:text-white" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                    />
                  </div>
                </div>

                {/* Center info */}
                <div className="hidden md:flex items-center gap-4">
                  <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30">
                    <span className="text-sm font-medium text-primary">LIVE TV</span>
                  </div>
                  <div className="text-sm text-white/70">
                    Quality: <span className="text-white font-medium">Auto (1080p)</span>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2">
                  <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/10 hidden md:flex">
                    <Captions className="w-5 h-5 text-white/70 hover:text-white" />
                  </button>
                  
                  <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/10 hidden md:flex">
                    <Pip className="w-5 h-5 text-white/70 hover:text-white" />
                 
