import { useState, useRef, useEffect, memo } from "react";
import { motion } from "framer-motion";
import { useIsMobile } from "./ui/use-mobile";

interface EventCardProps {
  title: string;
  date: string;
  description: string;
  media: Array<{ type: "image" | "video"; src: string; poster?: string }>;
  isRightAligned?: boolean;
}

export default memo(function EventCard({
  title,
  date,
  description,
  media,
  isRightAligned = false,
}: EventCardProps) {
  return (
    <motion.div
      className="bg-black/40 text-white p-4 sm:p-6 md:p-8 rounded-sm shadow-lg transition-all duration-300 glow-yellow-sm"
      whileHover={{ opacity: 0.9 }}
      style={{
        width: "fit-content",
        marginLeft: isRightAligned ? "auto" : "0",
      }}
    >
      <h2 className="text-xl sm:text-2xl md:text-3xl font-light text-white/95 break-words">
        {title}
      </h2>
      <p className="text-xs sm:text-sm text-gray-400/80 mt-2 break-words">{date}</p>
      {description && (
        <p className="mt-4 text-sm sm:text-base text-gray-300/90 font-light leading-relaxed break-words">
          {description}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3 sm:gap-4">
        {media.map((item, index) =>
          item.src ? (
            <MemoMediaItem key={index} type={item.type} src={item.src} poster={item.poster} />
          ) : null
        )}
      </div>
    </motion.div>
  );
});

const MemoMediaItem = memo(function MediaItem({
  type,
  src,
  poster,
}: {
  type: "image" | "video";
  src: string;
  poster?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoError, setVideoError] = useState(false);
  const isMobile = useIsMobile();
  const [isInView, setIsInView] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(!isMobile);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleVideoLoad = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const el = e.currentTarget;
    if (el.videoWidth === 0 || el.videoHeight === 0) setVideoError(true);
    else el.currentTime = 0;
  };

  const handleMouseEnter = () => {
    setShowPlayIcon(false);
    if (videoRef.current && !videoError) {
      videoRef.current.preload = "auto";
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setShowPlayIcon(true);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  if (type === "video" && videoError) return null;

  return (
    <motion.div
      ref={containerRef}
      className="overflow-hidden rounded-sm transition-all duration-300 cursor-pointer flex-1 min-w-[180px] max-w-[368px] bg-black relative"
      whileHover={{ scale: 1.02 }}
    >
      {type === "image" ? (
        <img
          src={src}
          alt="Event media"
          loading="lazy"
          className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center relative"
          onMouseEnter={!isMobile ? handleMouseEnter : undefined}
          onMouseLeave={!isMobile ? handleMouseLeave : undefined}
          onClick={isMobile ? handleMouseEnter : undefined}
        >
          <video
            ref={videoRef}
            src={src}
            onLoadedMetadata={handleVideoLoad}
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover"
            playsInline
            preload={isMobile ? "metadata" : isInView ? "metadata" : "none"}
            crossOrigin="anonymous"
            muted={false}
            loop={isMobile}
            poster={poster}
          />
          {showPlayIcon && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
});
