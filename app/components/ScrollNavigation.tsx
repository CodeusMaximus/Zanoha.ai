 "use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface ScrollNavigationProps {
  totalSections: number;
  currentSection: number;
  onNavigate: (direction: "up" | "down") => void;
  isDarkBackground?: boolean; // New prop to control colors
}

const ScrollNavigation = ({ 
  totalSections, 
  currentSection, 
  onNavigate,
  isDarkBackground = true 
}: ScrollNavigationProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollTime, setLastScrollTime] = useState(Date.now());

  // Auto-hide after 3 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Date.now() - lastScrollTime > 3000) {
        setIsVisible(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [lastScrollTime]);

  // Show on mouse move
  useEffect(() => {
    const handleMouseMove = () => {
      setIsVisible(true);
      setLastScrollTime(Date.now());
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const canGoUp = currentSection > 0;
  const canGoDown = currentSection < totalSections - 1;

  // Dynamic colors based on background
  const colors = isDarkBackground ? {
    bg: "bg-white/10",
    border: "border-white/20",
    text: "text-white",
    hoverBg: "hover:bg-white/20",
    tooltip: "bg-white/90 text-gray-900",
    dots: "bg-white",
    dotsInactive: "bg-white/30 hover:bg-white/50"
  } : {
    bg: "bg-gray-900/10",
    border: "border-gray-900/20",
    text: "text-gray-900",
    hoverBg: "hover:bg-gray-900/20",
    tooltip: "bg-gray-900/90 text-white",
    dots: "bg-gray-900",
    dotsInactive: "bg-gray-900/30 hover:bg-gray-900/50"
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4"
        >
          {/* Up Arrow */}
          <motion.button
            onClick={() => canGoUp && onNavigate("up")}
            disabled={!canGoUp}
            whileHover={{ scale: canGoUp ? 1.1 : 1 }}
            whileTap={{ scale: canGoUp ? 0.9 : 1 }}
            className={`
              relative group ${colors.bg} backdrop-blur-md rounded-full p-4 border ${colors.border}
              transition-all duration-300 shadow-lg
              ${canGoUp ? `${colors.hoverBg} cursor-pointer` : "opacity-30 cursor-not-allowed"}
            `}
          >
            <motion.svg
              animate={canGoUp ? { y: [-2, 2, -2] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className={`w-6 h-6 ${colors.text}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </motion.svg>
            
            {/* Tooltip */}
            {canGoUp && (
              <span className={`absolute right-full mr-3 top-1/2 -translate-y-1/2 ${colors.tooltip} px-3 py-1 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity`}>
                Previous Section
              </span>
            )}
          </motion.button>

          {/* Section Indicator */}
          <div className="flex flex-col items-center gap-2 py-2">
            {Array.from({ length: totalSections }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${index === currentSection 
                    ? `${colors.dots} w-3 h-3` 
                    : colors.dotsInactive
                  }
                `}
              />
            ))}
          </div>

          {/* Down Arrow */}
          <motion.button
            onClick={() => canGoDown && onNavigate("down")}
            disabled={!canGoDown}
            whileHover={{ scale: canGoDown ? 1.1 : 1 }}
            whileTap={{ scale: canGoDown ? 0.9 : 1 }}
            className={`
              relative group ${colors.bg} backdrop-blur-md rounded-full p-4 border ${colors.border}
              transition-all duration-300 shadow-lg
              ${canGoDown ? `${colors.hoverBg} cursor-pointer` : "opacity-30 cursor-not-allowed"}
            `}
          >
            <motion.svg
              animate={canGoDown ? { y: [-2, 2, -2] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className={`w-6 h-6 ${colors.text}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
            
            {/* Tooltip */}
            {canGoDown && (
              <span className={`absolute right-full mr-3 top-1/2 -translate-y-1/2 ${colors.tooltip} px-3 py-1 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity`}>
                Next Section
              </span>
            )}
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScrollNavigation;