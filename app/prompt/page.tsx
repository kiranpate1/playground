"use client";

import { interpolate } from "flubber";
import { useEffect, useState, useRef, type MouseEvent } from "react";
import Nav from "../components/Nav";

const PHASE_MORPH_STEP_MS = 200;
const TEXTAREA_LINE_HEIGHT_PX = 20;
const SHAPE_GROWTH_PER_LINE_PX = 23.5;
const TEXTAREA_GROWTH_MORPH_MS = 180;
const BUTTON_PHASE_ONE_TRANSLATE_X = -100;
const BUTTON_PHASE_ONE_TRANSLATE_Y = 24;
const BUTTON_PHASE_TWO_TRANSLATE_X = -148;
const BUTTON_PHASE_TWO_TRANSLATE_Y = 28;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function easeIn(progress: number) {
  return progress * progress;
}

function easeOut(progress: number) {
  return 1 - (1 - progress) * (1 - progress);
}

function formatPathNumber(value: number) {
  return Number(value.toFixed(4));
}

export default function PromptPage() {
  const bubbleSurfaceRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<SVGSVGElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const glowAnimationFrameRef = useRef<number | null>(null);
  const morphPathRef = useRef<SVGPathElement>(null);
  const morphAnimationFrameRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isClickLockedRef = useRef(false);
  const textLineCountRef = useRef(1);
  const shapeExtraHeightRef = useRef(0);
  const [isClickLocked, setIsClickLocked] = useState(false);
  const [shapeExtraHeight, setShapeExtraHeight] = useState(0);

  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [displayScale, setDisplayScale] = useState(1);
  const [isColorMode, setIsColorMode] = useState(true);
  const [primaryColor, setPrimaryColor] = useState("#FFA333");
  const [bgColor, setBgColor] = useState("#15151E");
  const [buttonColor, setButtonColor] = useState("#2e2e38");
  const [activeColor, setActiveColor] = useState("#454553");
  const [borderWidth, setBorderWidth] = useState(1);
  const [borderColor, setBorderColor] = useState("#53535f");

  const getShapeExtraHeightForLineCount = (lineCount: number) => {
    return Math.max(0, lineCount - 1) * SHAPE_GROWTH_PER_LINE_PX;
  };

  const getPhaseThreePathByExtraHeight = (extraHeight: number) => {
    const safeExtraHeight = Math.max(0, extraHeight);

    const y59 = formatPathNumber(59.5 + safeExtraHeight);
    const y52p5 = formatPathNumber(52.5 + safeExtraHeight);
    const y52p1733 = formatPathNumber(52.1733 + safeExtraHeight);
    const y51p84 = formatPathNumber(51.84 + safeExtraHeight);
    const y63 = formatPathNumber(63.3053 + safeExtraHeight);
    const y66 = formatPathNumber(66.1803 + safeExtraHeight);
    const y72 = formatPathNumber(72.2691 + safeExtraHeight);
    const y77 = formatPathNumber(77.0428 + safeExtraHeight);
    const y79 = formatPathNumber(79.0211 + safeExtraHeight);
    const y80 = formatPathNumber(80 + safeExtraHeight);

    return `M0 51.5C0 44.5 0 40.8323 0.97887 37.8197C2.95723 31.7309 7.7309 26.9572 13.8197 24.9789C16.8323 24 20.5549 24 28 24C35.4451 24 114.799 24 123 24C131.201 24 145.799 24 154 24C162.201 24 166.799 24 175 24C183.201 24 187.799 24 196 24C204.201 24 218.799 24 227 24C235.201 24 314.555 24 322 24C329.445 24 333.168 24 336.18 24.9789C342.269 26.9572 347.043 31.7309 349.021 37.8197C350 40.8323 350 44.5 350 51.5C350 ${y51p84} 350 ${y52p1733} 350 ${y52p5}C350 ${y59} 349.955 ${y63} 349.021 ${y66}C347.043 ${y72} 342.269 ${y77} 336.18 ${y79}C333.168 ${y80} 329.445 ${y80} 322 ${y80}C318.277 ${y80} 246.639 ${y80} 175 ${y80}C103.361 ${y80} 31.7226 ${y80} 28 ${y80}C20.5549 ${y80} 16.8323 ${y80} 13.8197 ${y79}C7.7309 ${y77} 2.95723 ${y72} 0.97887 ${y66}C0.0447012 ${y63} 0 ${y59} 9.32194e-05 ${y52p5}C0 ${y52p1733} 0 ${y51p84} 0 51.5Z`;
  };

  const getPhaseThreePath = (lineCount: number) => {
    return getPhaseThreePathByExtraHeight(
      getShapeExtraHeightForLineCount(lineCount),
    );
  };

  const phases = [
    "M199 24C199 26.0718 198.737 28.0823 198.244 30C197.887 31.3857 197.41 32.723 196.824 34C196.669 34.3376 196.506 34.671 196.336 35C195.602 36.4221 194.729 37.7613 193.736 39C192.87 40.0804 191.912 41.0844 190.875 42C190.055 42.7238 189.185 43.3924 188.271 44C184.47 46.5274 179.907 48 175 48C170.093 48 165.53 46.5274 161.729 44C160.815 43.3924 159.945 42.7238 159.125 42C158.088 41.0844 157.13 40.0804 156.264 39C155.271 37.7613 154.398 36.4221 153.664 35C153.494 34.671 153.331 34.3376 153.176 34C152.59 32.723 152.113 31.3857 151.756 30C151.263 28.0823 151 26.0718 151 24C151 21.9282 151.263 19.9177 151.756 18C152.432 15.3757 153.54 12.9251 155 10.7288C159.3 4.26204 166.652 0 175 0C183.348 0 190.7 4.26204 195 10.7288C196.46 12.9251 197.568 15.3757 198.244 18C198.737 19.9177 199 21.9282 199 24Z",
    "M175 10C181.086 10 186.643 12.2659 190.874 16C195.461 20.0496 200.745 24 206.864 24C212.984 24 274.555 24 282 24C289.445 24 293.168 23.9996 296.181 24.9785C302.269 26.9569 307.043 31.7307 309.021 37.8193C310 40.832 310 43.5 310 47.5C310 47.8488 310 48.1818 310 48.5C310 52.5 309.954 55.3092 309.021 58.1807C307.043 64.2693 302.269 69.0431 296.181 71.0215C293.168 72.0004 289.445 72 282 72C278.277 72 226.639 72 175 72C123.361 72 71.7226 72 68 72C60.5549 72 56.832 72.0004 53.8193 71.0215C47.7307 69.0431 42.9569 64.2693 40.9785 58.1807C40.0455 55.3092 40.0001 52.5 40.0001 48.5C40 48.1818 40 47.8488 40 47.5C40 43.5 39.9996 40.832 40.9785 37.8193C42.9569 31.7307 47.7307 26.9569 53.8193 24.9785C56.832 23.9996 60.5549 24 68 24C75.4451 24 137.016 24 143.136 24C149.255 24 154.539 20.0496 159.126 16C163.357 12.2659 168.914 10 175 10Z",
  ];

  const setClickLocked = (next: boolean) => {
    isClickLockedRef.current = next;
    setIsClickLocked(next);
  };

  const resetHoverVisuals = () => {
    if (starsRef.current) {
      const stars = Array.from(starsRef.current.querySelectorAll("path"));
      stars.forEach((star) => {
        star.style.transform = "scale(1)";
        star.style.fill = "rgba(255, 255, 255, 0.8)";
      });
    }

    if (glowRef.current) {
      glowRef.current.style.transition = "opacity 0.1s ease-out";
      glowRef.current.style.opacity = "0";
      glowRef.current.style.transform = "scale(0.4)";
    }
  };

  const animateBubbleClose = () => {
    const morphPath = morphPathRef.current;
    const button = buttonRef.current;
    const input = inputRef.current;

    if (input) {
      input.value = "";
      input.style.height = "0px";
      input.style.transitionDelay = "0s";
      input.style.opacity = "0";
      setIsTextAnimated(false);
    }

    if (!morphPath || !button || !isClickLockedRef.current) {
      return;
    }

    if (morphAnimationFrameRef.current !== null) {
      cancelAnimationFrame(morphAnimationFrameRef.current);
    }

    input?.blur();

    const currentPath =
      morphPath.getAttribute("d") ??
      getPhaseThreePathByExtraHeight(shapeExtraHeightRef.current);
    const phaseTwoReverseInterpolator = interpolate(currentPath, phases[1]);
    const phaseOneReverseInterpolator = interpolate(phases[1], phases[0]);
    const closeStartTime = performance.now();

    const tickClose = (now: number) => {
      const elapsedMs = now - closeStartTime;

      if (elapsedMs <= PHASE_MORPH_STEP_MS) {
        const progress = easeIn(clamp(elapsedMs / PHASE_MORPH_STEP_MS, 0, 1));
        morphPath.setAttribute("d", phaseTwoReverseInterpolator(progress));

        const translateX =
          BUTTON_PHASE_TWO_TRANSLATE_X +
          (BUTTON_PHASE_ONE_TRANSLATE_X - BUTTON_PHASE_TWO_TRANSLATE_X) *
            progress;
        const translateY =
          BUTTON_PHASE_TWO_TRANSLATE_Y +
          (BUTTON_PHASE_ONE_TRANSLATE_Y - BUTTON_PHASE_TWO_TRANSLATE_Y) *
            progress;
        button.style.transform = `translate(${translateX}px, ${translateY}px)`;
        morphAnimationFrameRef.current = requestAnimationFrame(tickClose);
        return;
      }

      if (elapsedMs <= PHASE_MORPH_STEP_MS * 2) {
        const phaseElapsed = elapsedMs - PHASE_MORPH_STEP_MS;
        const progress = easeOut(
          clamp(phaseElapsed / PHASE_MORPH_STEP_MS, 0, 1),
        );

        morphPath.setAttribute("d", phaseOneReverseInterpolator(progress));
        button.style.transform = `translate(${BUTTON_PHASE_ONE_TRANSLATE_X * (1 - progress)}px, ${BUTTON_PHASE_ONE_TRANSLATE_Y * (1 - progress)}px)`;
        morphAnimationFrameRef.current = requestAnimationFrame(tickClose);
        return;
      }

      morphPath.setAttribute("d", phases[0]);
      button.style.transform = "translate(0px, 0px)";
      shapeExtraHeightRef.current = 0;
      setShapeExtraHeight(0);
      textLineCountRef.current = 1;
      setClickLocked(false);
      setIsTextAnimated(false);
      resetHoverVisuals();
      morphAnimationFrameRef.current = null;
    };

    morphAnimationFrameRef.current = requestAnimationFrame(tickClose);
  };

  const handleBackgroundPointerDown = (event: MouseEvent<HTMLDivElement>) => {
    const bubbleSurface = bubbleSurfaceRef.current;
    const eventTarget = event.target;

    if (!bubbleSurface || !(eventTarget instanceof Node)) {
      return;
    }

    if (bubbleSurface.contains(eventTarget)) {
      return;
    }

    animateBubbleClose();
  };

  const animateBubble = (_event: MouseEvent<HTMLDivElement>) => {
    const morphPath = morphPathRef.current;
    const button = buttonRef.current;
    const input = inputRef.current;

    if (!morphPath || !button || !input) {
      return;
    }

    setClickLocked(true);

    if (morphAnimationFrameRef.current !== null) {
      cancelAnimationFrame(morphAnimationFrameRef.current);
    }

    const phaseOneInterpolator = interpolate(phases[0], phases[1]);
    const targetExtraHeight = getShapeExtraHeightForLineCount(
      textLineCountRef.current,
    );
    const phaseThreePath = getPhaseThreePathByExtraHeight(targetExtraHeight);
    const phaseTwoInterpolator = interpolate(phases[1], phaseThreePath);
    const morphStartTime = performance.now();

    morphPath.setAttribute("d", phases[0]);
    button.style.transform = "translate(0px, 0px)";
    input.focus();

    const tickMorph = (now: number) => {
      const elapsedMs = now - morphStartTime;

      if (elapsedMs <= PHASE_MORPH_STEP_MS) {
        const progress = easeIn(clamp(elapsedMs / PHASE_MORPH_STEP_MS, 0, 1));
        morphPath.setAttribute("d", phaseOneInterpolator(progress));
        button.style.transform = `translate(${BUTTON_PHASE_ONE_TRANSLATE_X * progress}px, ${BUTTON_PHASE_ONE_TRANSLATE_Y * progress}px)`;
        morphAnimationFrameRef.current = requestAnimationFrame(tickMorph);
        return;
      }

      if (elapsedMs <= PHASE_MORPH_STEP_MS * 2) {
        const phaseElapsed = elapsedMs - PHASE_MORPH_STEP_MS;
        const progress = easeOut(
          clamp(phaseElapsed / PHASE_MORPH_STEP_MS, 0, 1),
        );

        morphPath.setAttribute("d", phaseTwoInterpolator(progress));
        const translateX =
          BUTTON_PHASE_ONE_TRANSLATE_X +
          (BUTTON_PHASE_TWO_TRANSLATE_X - BUTTON_PHASE_ONE_TRANSLATE_X) *
            progress;
        const translateY =
          BUTTON_PHASE_ONE_TRANSLATE_Y +
          (BUTTON_PHASE_TWO_TRANSLATE_Y - BUTTON_PHASE_ONE_TRANSLATE_Y) *
            progress;
        button.style.transform = `translate(${translateX}px, ${translateY}px)`;
        morphAnimationFrameRef.current = requestAnimationFrame(tickMorph);
        return;
      }

      morphPath.setAttribute("d", phaseThreePath);
      button.style.transform = `translate(${BUTTON_PHASE_TWO_TRANSLATE_X}px, ${BUTTON_PHASE_TWO_TRANSLATE_Y}px)`;
      shapeExtraHeightRef.current = targetExtraHeight;
      setShapeExtraHeight(targetExtraHeight);
      morphAnimationFrameRef.current = null;
    };

    morphAnimationFrameRef.current = requestAnimationFrame(tickMorph);
  };

  const animateStars = (event: MouseEvent<HTMLDivElement>) => {
    if (buttonRef.current && starsRef.current) {
      const glow = glowRef.current;
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const cursorX = event.clientX;
      const cursorY = event.clientY;

      if (glow) {
        const originX = ((cursorX - buttonRect.left) / buttonRect.width) * 100;
        const originY = ((cursorY - buttonRect.top) / buttonRect.height) * 100;

        if (glowAnimationFrameRef.current !== null) {
          cancelAnimationFrame(glowAnimationFrameRef.current);
        }

        glow.style.transition = "none";
        glow.style.transformOrigin = `${originX}% ${originY}%`;
        glow.style.transform = "scale(0.4)";
        glow.style.opacity = "0";
        void glow.offsetHeight;

        glowAnimationFrameRef.current = requestAnimationFrame(() => {
          glow.style.transition =
            "transform 0.35s ease-out, opacity 0.2s ease-out";
          glow.style.transform = "scale(1)";
          glow.style.opacity = "1";
          glowAnimationFrameRef.current = null;
        });
      }

      const stars = Array.from(starsRef.current.querySelectorAll("path"));
      const starsByDistance = stars
        .map((star) => {
          const rect = star.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          return {
            star,
            distance: Math.hypot(centerX - cursorX, centerY - cursorY),
          };
        })
        .sort((left, right) => left.distance - right.distance);

      const nearestDistance = starsByDistance[0]?.distance ?? 0;
      const furthestDistance =
        starsByDistance[starsByDistance.length - 1]?.distance ??
        nearestDistance;
      const distanceRange = Math.max(furthestDistance - nearestDistance, 1);

      starsByDistance.forEach(({ star, distance }) => {
        const dataStar = star.dataset.star;
        const delayMs = ((distance - nearestDistance) / distanceRange) * 180;

        setTimeout(() => {
          star.style.transform = `scale(${1 + Number(dataStar) * 0.2})`;
          star.style.fill = "white";
          setTimeout(() => {
            star.style.transform = "scale(1)";
          }, 300);
        }, delayMs);
      });
    }
  };

  const resetStars = (event: MouseEvent<HTMLDivElement>) => {
    if (isClickLockedRef.current) {
      return;
    }

    resetHoverVisuals();
  };

  const [isTextAnimated, setIsTextAnimated] = useState(false);

  const animateTextState = () => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    input.style.height = "0px";
    input.style.height = `${input.scrollHeight}px`;

    const computedLineHeight = Number.parseFloat(
      getComputedStyle(input).lineHeight,
    );
    const lineHeight = Number.isFinite(computedLineHeight)
      ? computedLineHeight
      : TEXTAREA_LINE_HEIGHT_PX;
    const nextLineCount = Math.max(
      1,
      Math.round(input.scrollHeight / lineHeight),
    );
    const didLineCountChange = nextLineCount !== textLineCountRef.current;

    if (didLineCountChange) {
      textLineCountRef.current = nextLineCount;
    }

    if (
      didLineCountChange &&
      isClickLockedRef.current &&
      morphPathRef.current
    ) {
      const morphPath = morphPathRef.current;
      const startExtraHeight = shapeExtraHeightRef.current;
      const targetExtraHeight = getShapeExtraHeightForLineCount(nextLineCount);

      if (startExtraHeight === targetExtraHeight) {
        return;
      }

      if (morphAnimationFrameRef.current !== null) {
        cancelAnimationFrame(morphAnimationFrameRef.current);
      }
      const resizeStartTime = performance.now();

      const tickResize = (now: number) => {
        const rawProgress = clamp(
          (now - resizeStartTime) / TEXTAREA_GROWTH_MORPH_MS,
          0,
          1,
        );
        const clampedProgress = easeOut(rawProgress);
        const currentExtraHeight =
          startExtraHeight +
          (targetExtraHeight - startExtraHeight) * clampedProgress;

        morphPath.setAttribute(
          "d",
          getPhaseThreePathByExtraHeight(currentExtraHeight),
        );
        setShapeExtraHeight(currentExtraHeight);

        if (clampedProgress < 1) {
          morphAnimationFrameRef.current = requestAnimationFrame(tickResize);
          return;
        }

        shapeExtraHeightRef.current = targetExtraHeight;
        setShapeExtraHeight(targetExtraHeight);
        morphAnimationFrameRef.current = null;
      };

      morphAnimationFrameRef.current = requestAnimationFrame(tickResize);
    }

    const inputLength = input.value.length;

    if (inputLength > 0) {
      setIsTextAnimated(true);
    } else {
      setIsTextAnimated(false);
    }
  };

  useEffect(() => {
    return () => {
      if (glowAnimationFrameRef.current !== null) {
        cancelAnimationFrame(glowAnimationFrameRef.current);
      }

      if (morphAnimationFrameRef.current !== null) {
        cancelAnimationFrame(morphAnimationFrameRef.current);
      }
    };
  }, []);

  return (
    <main className="min-h-screen w-full" style={{ backgroundColor: bgColor }}>
      <div className="absolute inset-0 flex items-stretch">
        <div
          className="flex-1 flex items-center justify-center"
          style={{ transform: `scale(${displayScale})` }}
          onMouseDown={handleBackgroundPointerDown}
        >
          <div className="relative w-12 h-12" ref={bubbleSurfaceRef}>
            <div
              className="absolute top-0 right-0 w-full h-full flex items-center justify-center duration-600 ease-in-out"
              style={{
                transform: isClickLocked
                  ? `translate(${isTextAnimated ? "200px" : "156px"}, 28px)`
                  : "translate(0,0)",
                transitionDuration: isTextAnimated ? "400ms" : "600ms",
              }}
            >
              <div
                className="w-9 h-9 flex items-center justify-center rounded-full duration-100 cursor-pointer"
                style={{
                  backgroundColor: isColorMode ? buttonColor : primaryColor,
                  border: `${borderWidth}px solid ${isColorMode ? borderColor : "rgba(255, 255, 255, 0.15)"}`,
                  opacity: isTextAnimated ? 1 : 0,
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.40221 6.67292C3.14221 4.33892 5.54521 2.62492 7.66821 3.63092L19.6122 9.28892C21.9002 10.3719 21.9002 13.6279 19.6122 14.7109L7.66821 20.3699C5.54521 21.3759 3.14321 19.6619 3.40221 17.3279L3.88221 12.9999H12.0002C12.2654 12.9999 12.5198 12.8946 12.7073 12.707C12.8949 12.5195 13.0002 12.2651 13.0002 11.9999C13.0002 11.7347 12.8949 11.4803 12.7073 11.2928C12.5198 11.1053 12.2654 10.9999 12.0002 10.9999H3.88321L3.40221 6.67292Z"
                    fill={isColorMode ? primaryColor : "black"}
                  />
                </svg>
              </div>
            </div>
            <svg
              className="absolute left-1/2 -translate-x-1/2"
              width={350 + borderWidth * 2}
              height={80 + borderWidth * 2 + shapeExtraHeight}
              viewBox={`${-borderWidth} ${-borderWidth} ${350 + borderWidth * 2} ${80 + borderWidth * 2 + shapeExtraHeight}`}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ top: -borderWidth }}
            >
              <path
                ref={morphPathRef}
                d={phases[0]}
                fill={activeColor}
                strokeWidth={borderWidth}
                stroke={
                  isClickLocked
                    ? `${borderColor}`
                    : `color-mix(in srgb, ${borderColor} 50%, ${buttonColor} 50%)`
                }
              />
            </svg>
            <div
              className="absolute inset-[0.5px] rounded-full cursor-pointer"
              style={{
                inset: `${borderWidth / 2}px`,
                backgroundColor: buttonColor,
                pointerEvents: isClickLocked ? "none" : "auto",
              }}
              onMouseEnter={(event) => {
                animateStars(event);
              }}
              onClick={(event) => {
                animateBubble(event);
              }}
              onMouseLeave={(event) => {
                resetStars(event);
              }}
              ref={buttonRef}
            >
              <div className="absolute inset-0 rounded-full overflow-hidden">
                <div
                  ref={glowRef}
                  className="absolute -inset-8 rounded-full opacity-0"
                  style={{
                    backgroundImage: `radial-gradient(circle, ${activeColor} 30%, ${buttonColor} 70%)`,
                    transform: "scale(0.4)",
                  }}
                ></div>
              </div>
              <div className="absolute z-1 inset-0 flex items-center justify-center overflow-hidden">
                <svg
                  className="relative z-1 duration-200 ease-[cubic-bezier(0.4,0,0.6,1)]"
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  ref={starsRef}
                  style={{
                    transform: `translateX(${isTextAnimated ? "-30px" : "0"}) scale(${isClickLocked ? 0.9 : 1})`,
                    opacity: isTextAnimated ? 0 : 1,
                  }}
                >
                  <path
                    className="origin-center transform-fill duration-300 ease-in-out"
                    d="M13.6691 11.5049L14.2381 9.81091C14.2553 9.75269 14.2898 9.70208 14.3371 9.6639C14.3729 9.63629 14.4146 9.61742 14.459 9.60882C14.5034 9.60021 14.5492 9.60211 14.5927 9.61435C14.6362 9.62659 14.6763 9.64884 14.7097 9.67932C14.7431 9.7098 14.7689 9.74767 14.7851 9.7899L15.3541 11.5049C15.5649 12.149 15.9243 12.7344 16.4033 13.2138C16.8822 13.6933 17.4672 14.0533 18.1111 14.2649L19.8031 14.8549C19.861 14.8737 19.9115 14.9103 19.9473 14.9595C19.9831 15.0087 20.0024 15.068 20.0024 15.1289C20.0024 15.1898 19.9831 15.2491 19.9473 15.2983C19.9115 15.3475 19.861 15.3842 19.8031 15.4029L18.0891 15.9719C17.4517 16.1842 16.8726 16.5422 16.3978 17.0175C15.923 17.4928 15.5656 18.0723 15.3541 18.7099L14.7641 20.4039C14.7458 20.4623 14.7094 20.5134 14.6601 20.5497C14.6108 20.5859 14.5513 20.6055 14.4901 20.6055C14.4289 20.6055 14.3693 20.5859 14.32 20.5497C14.2707 20.5134 14.2343 20.4623 14.2161 20.4039L13.6481 18.6889C13.4364 18.0512 13.0788 17.4716 12.6039 16.9963C12.1289 16.521 11.5496 16.1631 10.9121 15.9509L9.19905 15.3819C9.14114 15.3632 9.09066 15.3265 9.05485 15.2773C9.01904 15.2281 8.99976 15.1688 8.99976 15.1079C8.99976 15.047 9.01904 14.9877 9.05485 14.9385C9.09066 14.8893 9.14114 14.8527 9.19905 14.8339L10.9121 14.2649C11.5555 14.0526 12.1401 13.6923 12.619 13.213C13.0978 12.7336 13.4575 12.1486 13.6691 11.5049Z"
                    fill="rgba(255, 255, 255, 0.8)"
                    data-star="1"
                  />
                  <path
                    className="origin-center transform-fill duration-300 ease-in-out"
                    d="M11.45 4.09017L11.657 3.47417C11.6632 3.45302 11.6758 3.43434 11.6931 3.42076C11.7105 3.40719 11.7316 3.39941 11.7536 3.39852C11.7756 3.39764 11.7974 3.40369 11.8157 3.41583C11.8341 3.42797 11.8482 3.44558 11.856 3.46617L12.063 4.09017C12.1396 4.32452 12.2703 4.53754 12.4446 4.71196C12.6189 4.88639 12.8317 5.01733 13.066 5.09417L13.681 5.30817C13.7022 5.31495 13.7207 5.32829 13.7338 5.34627C13.7469 5.36424 13.754 5.38592 13.754 5.40817C13.754 5.43042 13.7469 5.45209 13.7338 5.47007C13.7207 5.48804 13.7022 5.50138 13.681 5.50817L13.058 5.71517C12.8262 5.79218 12.6155 5.92222 12.4428 6.09495C12.2701 6.26769 12.14 6.47834 12.063 6.71017L11.849 7.32617C11.8422 7.34736 11.8289 7.36585 11.8109 7.37896C11.7929 7.39208 11.7713 7.39915 11.749 7.39915C11.7268 7.39915 11.7051 7.39208 11.6871 7.37896C11.6691 7.36585 11.6558 7.34736 11.649 7.32617L11.443 6.70217C11.366 6.47034 11.236 6.25969 11.0632 6.08695C10.8905 5.91422 10.6798 5.78418 10.448 5.70717L9.82501 5.50017C9.80382 5.49332 9.78552 5.47959 9.77301 5.46117C9.76337 5.44789 9.75701 5.43252 9.75445 5.41631C9.75189 5.40011 9.7532 5.38353 9.75827 5.36792C9.76334 5.35232 9.77203 5.33814 9.78363 5.32654C9.79523 5.31493 9.80941 5.30624 9.82501 5.30117L10.448 5.09417C10.6821 5.01719 10.8948 4.8862 11.0689 4.71178C11.2429 4.53736 11.3735 4.32441 11.45 4.09017Z"
                    fill="rgba(255, 255, 255, 0.8)"
                    data-star="3"
                  />
                  <path
                    className="origin-center transform-fill duration-300 ease-in-out"
                    d="M5.51574 7.64893L5.84615 6.66414C5.85597 6.6303 5.87618 6.60041 5.90392 6.57869C5.93166 6.55697 5.96553 6.54452 6.00074 6.5431C6.03594 6.54169 6.0707 6.55138 6.1001 6.5708C6.12949 6.59022 6.15204 6.6184 6.16454 6.65134L6.49575 7.64893C6.61834 8.02366 6.82743 8.36427 7.10608 8.64321C7.38474 8.92214 7.72514 9.13156 8.09975 9.25454L9.08375 9.59853C9.11707 9.60977 9.14603 9.63117 9.16654 9.65973C9.18705 9.68829 9.19809 9.72257 9.19809 9.75774C9.19809 9.7929 9.18705 9.82718 9.16654 9.85574C9.14603 9.8843 9.11707 9.9057 9.08375 9.91694L8.08775 10.2489C7.71713 10.3727 7.38037 10.581 7.10407 10.8573C6.82778 11.1336 6.61952 11.4703 6.49575 11.8409L6.15174 12.8265C6.14051 12.8599 6.11911 12.8888 6.09055 12.9093C6.06199 12.9298 6.02771 12.9409 5.99255 12.9409C5.95738 12.9409 5.9231 12.9298 5.89454 12.9093C5.86598 12.8888 5.84458 12.8599 5.83334 12.8265L5.50295 11.8281C5.37973 11.4572 5.17166 11.1202 4.89529 10.8438C4.61892 10.5674 4.28186 10.3594 3.91094 10.2361L2.91414 9.90413C2.88082 9.8929 2.85186 9.8715 2.83135 9.84294C2.81084 9.81438 2.7998 9.7801 2.7998 9.74494C2.7998 9.70977 2.81084 9.67549 2.83135 9.64693C2.85186 9.61837 2.88082 9.59697 2.91414 9.58574L3.91094 9.25454C4.28539 9.1311 4.62566 8.92153 4.90438 8.64267C5.1831 8.36382 5.3925 8.02345 5.51574 7.64893Z"
                    fill="rgba(255, 255, 255, 0.8)"
                    data-star="2"
                  />
                </svg>
              </div>
              <div
                className="absolute left-11 top-2.5 w-79 flex items-start justify-start duration-200 ease-[cubic-bezier(0.4,0,0.6,1)] pointer-events-none"
                style={{
                  transform: `translateX(${isTextAnimated ? "-30px" : "0"})`,
                }}
              >
                <textarea
                  rows={1}
                  placeholder="Make changes..."
                  className="block m-0! p-0! placeholder:text-[#828298] outline-none min-h-5 w-full transition-opacity duration-200 resize-none whitespace-pre-wrap wrap-break-word overflow-hidden"
                  ref={inputRef}
                  onInput={() => {
                    animateTextState();
                  }}
                  style={{
                    opacity: isClickLocked ? 1 : 0,
                    transitionDelay: isClickLocked ? "200ms" : "0ms",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div
          className="relative border-l border-l-white/10 duration-200 ease-in-out overflow-hidden"
          style={{ width: isMenuOpen ? "240px" : "0" }}
        >
          <Nav />
          <div className="min-w-60 h-full px-4 flex flex-col items-stretch justify-center gap-4">
            <div className="flex flex-col items-stretch gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="displayScale">Scale:</label>
                <label>{displayScale}</label>
              </div>
              <input
                id="displayScale"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={displayScale}
                onChange={(e) => setDisplayScale(parseFloat(e.target.value))}
              />
            </div>
            <div className="flex flex-col items-stretch gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="primaryColor">Primary color:</label>
                <label>{primaryColor}</label>
              </div>
              <div className="w-full h-6 flex items-center justify-center rounded-[6px] overflow-hidden">
                <input
                  className="min-w-[calc(100%+16px)] min-h-10 cursor-pointer"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => {
                    setPrimaryColor(e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="backgroundColor">Background color:</label>
                <label>{bgColor}</label>
              </div>
              <div className="w-full h-6 flex items-center justify-center border border-white/10 rounded-[6px] overflow-hidden">
                <input
                  className="min-w-[calc(100%+16px)] min-h-10 cursor-pointer"
                  type="color"
                  value={bgColor}
                  onChange={(e) => {
                    setBgColor(e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="buttonColor">Inactive color:</label>
                <label>{buttonColor}</label>
              </div>
              <div className="w-full h-6 flex items-center justify-center rounded-[6px] overflow-hidden">
                <input
                  className="min-w-[calc(100%+16px)] min-h-10 cursor-pointer"
                  type="color"
                  value={buttonColor}
                  onChange={(e) => {
                    setButtonColor(e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="colorMode">Invert button color:</label>
              <input
                id="colorMode"
                type="checkbox"
                checked={isColorMode}
                onChange={(e) => setIsColorMode(e.target.checked)}
              />
            </div>
            <div className="flex flex-col items-stretch gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="activeColor">Active color:</label>
                <label>{activeColor}</label>
              </div>
              <div className="w-full h-6 flex items-center justify-center rounded-[6px] overflow-hidden">
                <input
                  className="min-w-[calc(100%+16px)] min-h-10 cursor-pointer"
                  type="color"
                  value={activeColor}
                  onChange={(e) => {
                    setActiveColor(e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="borderColor">Border color:</label>
                <label>{borderColor}</label>
              </div>
              <div className="w-full h-6 flex items-center justify-center rounded-[6px] overflow-hidden">
                <input
                  className="min-w-[calc(100%+16px)] min-h-10 cursor-pointer"
                  type="color"
                  value={borderColor}
                  onChange={(e) => {
                    setBorderColor(e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="borderWidth">Border width:</label>
                <label>{borderWidth}px</label>
              </div>
              <input
                id="borderWidth"
                type="range"
                min="0"
                max="10"
                step="1"
                value={borderWidth}
                onChange={(e) => {
                  setBorderWidth(Number(e.target.value));
                }}
              />
            </div>
          </div>
        </div>
        <svg
          className="absolute top-4 right-4 opacity-70 hover:opacity-100 duration-200 ease-in-out cursor-pointer"
          style={{ transform: `rotateZ(${isMenuOpen ? -180 : 0}deg)` }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.1504 16.15L6.70039 12.7C6.50039 12.5 6.40039 12.2667 6.40039 12C6.40039 11.7333 6.50039 11.5 6.70039 11.3L10.1504 7.85C10.3171 7.68334 10.5004 7.64167 10.7004 7.725C10.9004 7.80834 11.0004 7.96667 11.0004 8.2V15.8C11.0004 16.0333 10.9004 16.1917 10.7004 16.275C10.5004 16.3583 10.3171 16.3167 10.1504 16.15ZM13.0004 20V4C13.0004 3.71667 13.0964 3.47934 13.2884 3.288C13.4804 3.09667 13.7177 3.00067 14.0004 3C14.2831 2.99934 14.5207 3.09534 14.7134 3.288C14.9061 3.48067 15.0017 3.718 15.0004 4V20C15.0004 20.2833 14.9044 20.521 14.7124 20.713C14.5204 20.905 14.2831 21.0007 14.0004 21C13.7177 20.9993 13.4804 20.9033 13.2884 20.712C13.0964 20.5207 13.0004 20.2833 13.0004 20Z"
            fill="white"
          />
        </svg>
      </div>
    </main>
  );
}
