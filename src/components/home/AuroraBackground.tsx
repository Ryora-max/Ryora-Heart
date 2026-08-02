"use client";

import { useState } from "react";

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
  for (let i = 0; i < 30; i++) {
    arr.push({
      id: i,
      top: ((i * 23 + 11) % 100),
      left: ((i * 29 + 17) % 100),
      opacity: ((i * 31 + 19) % 50 + 10) / 100,
      size: ((i * 13 + 7) % 3) + 1,
      delay: ((i * 37 + 23) % 50) / 10,
      duration: 2 + ((i * 17 + 3) % 30) / 10,
    });
  }
  return arr;
}

export function AuroraBackground() {
  const [stars] = useState<Star[]>(() => createStars());

  return (
    <div className="aurora-bg">
      <div className="aurora-orb-1 absolute top-[10%] left-[15%] w-[400px] h-[300px] rounded-full bg-primary/10 blur-[60px]" />
      <div className="aurora-orb-2 absolute top-[60%] right-[10%] w-[350px] h-[350px] rounded-full bg-secondary/10 blur-[60px]" />
      <div className="aurora-orb-3 absolute top-[30%] left-[50%] w-[300px] h-[200px] rounded-full bg-accent/8 blur-[50px]" />
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
