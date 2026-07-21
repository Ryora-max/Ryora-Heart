"use client";

import { useEffect, useState } from "react";

interface Star {
  id: number;
  top: number;
  left: number;
  opacity: number;
  size: number;
  delay: number;
  duration: number;
}

function createStars(): Star[] {
  const arr: Star[] = [];
  for (let i = 0; i < 100; i++) {
    arr.push({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      opacity: Math.random() * 0.5 + 0.1,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 5,
      duration: 2 + Math.random() * 3,
    });
  }
  return arr;
}

export function AuroraBackground() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStars(createStars());
  }, []);

  return (
    <div className="aurora-bg">
      <div className="aurora-orb-1 absolute top-[10%] left-[15%] w-[600px] h-[400px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="aurora-orb-2 absolute top-[60%] right-[10%] w-[500px] h-[500px] rounded-full bg-secondary/10 blur-[120px]" />
      <div className="aurora-orb-3 absolute top-[30%] left-[50%] w-[400px] h-[300px] rounded-full bg-accent/8 blur-[100px]" />
      <div className="absolute inset-0 overflow-hidden">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star absolute rounded-full bg-white"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              top: `${star.top}%`,
              left: `${star.left}%`,
              opacity: star.opacity,
              animation: `star-twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
