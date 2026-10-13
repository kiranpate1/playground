"use client";

import { useEffect, useRef } from "react";

type HoverGlowProps = {
  color: string;
  className?: string;
};

// Grows a blurred glow from the cursor entry point whenever the parent element is hovered.
export default function HoverGlow({
  color,
  className = "inset-0",
}: HoverGlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    const glow = glowRef.current;

    if (!parent || !glow) {
      return;
    }

    let frameId: number | null = null;

    const handleEnter = (event: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const originX = ((event.clientX - rect.left) / rect.width) * 100;
      const originY = ((event.clientY - rect.top) / rect.height) * 100;

      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }

      glow.style.transition = "none";
      glow.style.transformOrigin = `${originX}% ${originY}%`;
      glow.style.transform = "scale(0.4)";
      glow.style.opacity = "0";
      // Force a reflow so the reset applies before the transition starts.
      void glow.offsetHeight;

      frameId = requestAnimationFrame(() => {
        glow.style.transition =
          "transform 0.35s ease-out, opacity 0.2s ease-out";
        glow.style.transform = "scale(1)";
        glow.style.opacity = "1";
        frameId = null;
      });
    };

    const handleLeave = () => {
      glow.style.transition = "opacity 0.1s ease-out";
      glow.style.opacity = "0";
    };

    parent.addEventListener("mouseenter", handleEnter);
    parent.addEventListener("mouseleave", handleLeave);

    return () => {
      parent.removeEventListener("mouseenter", handleEnter);
      parent.removeEventListener("mouseleave", handleLeave);

      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute overflow-hidden pointer-events-none ${className}`}
    >
      <div
        ref={glowRef}
        className="absolute -inset-8 rounded-full opacity-0 blur-lg"
        style={{ backgroundColor: color, transform: "scale(0.4)" }}
      ></div>
    </div>
  );
}
