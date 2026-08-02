"use client";

import { HouseExperience } from "@/components/house/HouseExperience";
import { HouseErrorBoundary } from "@/components/house/HouseErrorBoundary";

export default function HomePage() {
  return (
    <HouseErrorBoundary>
      <HouseExperience />
    </HouseErrorBoundary>
  );
}

