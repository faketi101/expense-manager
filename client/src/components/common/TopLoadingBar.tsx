import React, { useEffect, useState, useRef } from 'react';
import { subscribeToApiLoading } from '../../services/api';

export const TopLoadingBar: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToApiLoading((_count, loading) => {
      setIsLoading(loading);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setVisible(true);
      setProgress(15);

      // Progressively increment progress while loading
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev < 60) return prev + Math.random() * 15;
          if (prev < 85) return prev + Math.random() * 5;
          if (prev < 95) return prev + 0.5;
          return prev;
        });
      }, 200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      // Finish progress to 100%
      setProgress(100);
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 350);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isLoading]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] pointer-events-none transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Background track */}
      <div className="h-[2.5px] w-full bg-transparent overflow-hidden">
        {/* Animated Progress Bar */}
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 transition-all duration-200 ease-out shadow-[0_0_10px_rgba(59,130,246,0.8)] relative"
          style={{ width: `${progress}%` }}
        >
          {/* Leading glow point */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-cyan-300 blur-[3px] opacity-90" />
        </div>
      </div>
    </div>
  );
};
