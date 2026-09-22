"use client";

import { interpolate } from "flubber";
import { useEffect, useState, useRef, type MouseEvent } from "react";
import Nav from "../components/Nav";
import Loader from "../components/Loader";

const SHAPE_GROWTH_PER_LINE_PX = 32;
const SHAPE_MORPH_DURATION_MS = 300;
const SVG_PATH_NUMBER_PATTERN = /-?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?/gi;
const DEFAULT_STATE5_ACTIVE_COLORS = ["#B5F349", "#FF9748"];

function easeInOut(progress: number) {
  const controlPoint1 = [0.65, 0] as const;
  const controlPoint2 = [0.35, 1] as const;
  let lowerBound = 0;
  let upperBound = 1;

  for (let iteration = 0; iteration < 12; iteration += 1) {
    const parameter = (lowerBound + upperBound) / 2;
    const inverseParameter = 1 - parameter;
    const x =
      3 * inverseParameter ** 2 * parameter * controlPoint1[0] +
      3 * inverseParameter * parameter ** 2 * controlPoint2[0] +
      parameter ** 3;

    if (x < progress) {
      lowerBound = parameter;
    } else {
      upperBound = parameter;
    }
  }

  const parameter = (lowerBound + upperBound) / 2;
  const inverseParameter = 1 - parameter;

  return (
    3 * inverseParameter ** 2 * parameter * controlPoint1[1] +
    3 * inverseParameter * parameter ** 2 * controlPoint2[1] +
    parameter ** 3
  );
}

function interpolateMatchingPathCommands(
  startPath: string,
  targetPath: string,
) {
  const startValues = (startPath.match(SVG_PATH_NUMBER_PATTERN) ?? []).map(
    Number,
  );
  const targetValues = (targetPath.match(SVG_PATH_NUMBER_PATTERN) ?? []).map(
    Number,
  );
  const hasMatchingCommands =
    startPath.replace(SVG_PATH_NUMBER_PATTERN, "#").replace(/\s+/g, "") ===
    targetPath.replace(SVG_PATH_NUMBER_PATTERN, "#").replace(/\s+/g, "");

  if (!hasMatchingCommands || startValues.length !== targetValues.length) {
    return interpolate(startPath, targetPath);
  }

  return (progress: number) => {
    let valueIndex = 0;

    return startPath.replace(SVG_PATH_NUMBER_PATTERN, (startValue) => {
      const value =
        Number(startValue) +
        (targetValues[valueIndex] - Number(startValue)) * progress;
      valueIndex += 1;

      return String(Number(value.toFixed(4)));
    });
  };
}

export default function SubmittingPage() {
  const shapePathRef = useRef<SVGPathElement | null>(null);
  const shapeStrokePathRef = useRef<SVGPathElement | null>(null);
  const shapeTransformRef = useRef<HTMLDivElement | null>(null);
  const shapeGlowRef = useRef<HTMLDivElement | null>(null);
  const shapeMorphAnimationFrameRef = useRef<number | null>(null);
  const shapeGlowAnimationFrameRef = useRef<number | null>(null);
  const shapeTranslateYRef = useRef(0);
  const isShapeExpandedRef = useRef(false);
  const [shapeExtraHeight, setShapeExtraHeight] = useState(0);
  const [isShapeExpanded, setIsShapeExpanded] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [progress, setProgress] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [totalLoadTimeMs, setTotalLoadTimeMs] = useState(8_000);
  const [loadRun, setLoadRun] = useState(0);

  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [displayScale, setDisplayScale] = useState(1);

  const [bgColor, setBgColor] = useState("#15151E");
  const [buttonColor, setButtonColor] = useState("#2e2e38");
  const [activeColor, setActiveColor] = useState("#ffffff");
  const [borderWidth, setBorderWidth] = useState(1);
  const [borderColor, setBorderColor] = useState("#53535f");
  const [title, setTitle] = useState("Submitting PR");
  const [steps, setSteps] = useState([
    "Reviewing the changes",
    "Cleaning the code",
    "Creating a PR",
    "Finishing up",
  ]);
  const [stepsLength, setStepsLength] = useState(steps.length);
  const [completionMode, setCompletionMode] = useState(true);
  const [stateColors, setStateColors] = useState<string[]>(
    DEFAULT_STATE5_ACTIVE_COLORS,
  );
  const [invertIcon, setInvertIcon] = useState(false);

  function formatPathNumber(value: number) {
    return Number(value.toFixed(4));
  }

  const getPhaseOnePath = () => {
    const y = formatPathNumber(shapeExtraHeight - 1);
    return `M0 ${27.5 + y}C0 ${18.5 + y} 0 ${14 + y} 1.68642 ${10.3929 + y}C3.47487 ${6.55751 + y} 6.55747 ${3.47492 + y} 10.3928 ${1.68646 + y}C14 ${0 + y} 18.673 ${0 + y} 28 ${0 + y}H322C331.327 ${0 + y} 336 ${0 + y} 339.607 ${1.68646 + y}C343.442 ${3.47492 + y} 346.525 ${6.55751 + y} 348.314 ${10.3929 + y}C350 ${14 + y} 350 ${18.5 + y} 350 ${27.5 + y}L350 ${28.5 + y}C350 ${37.5 + y} 349.939 ${42.1219 + y} 348.314 ${45.6071 + y}C346.525 ${49.4425 + y} 343.442 ${52.5251 + y} 339.607 ${54.3135 + y}C336 ${56 + y} 331.327 ${56 + y} 322 ${56 + y}H28C18.673 ${56 + y} 14 ${56 + y} 10.3928 ${54.3135 + y}C6.55747 ${52.5251 + y} 3.47487 ${49.4425 + y} 1.68642 ${45.6071 + y}C0.061093 ${42.1216 + y} 0 ${37.5 + y} 0 ${27.5 + y}Z`;
  };

  const getPhaseTwoPath = () => {
    const y28p5 = formatPathNumber(28.5 + shapeExtraHeight);
    const y37p5 = formatPathNumber(37.5 + shapeExtraHeight);
    const y42p1219 = formatPathNumber(42.1219 + shapeExtraHeight);
    const y45p6071 = formatPathNumber(45.6071 + shapeExtraHeight);
    const y49p4425 = formatPathNumber(49.4425 + shapeExtraHeight);
    const y52p5251 = formatPathNumber(52.5251 + shapeExtraHeight);
    const y54p3135 = formatPathNumber(54.3135 + shapeExtraHeight);
    const y56 = formatPathNumber(56 + shapeExtraHeight);

    return `M0 27.5C0 18.5 0 14 1.68642 10.3929C3.47487 6.55751 6.55747 3.47492 10.3928 1.68646C14 0 18.673 0 28 0H322C331.327 0 336 0 339.607 1.68646C343.442 3.47492 346.525 6.55751 348.314 10.3929C350 14 350 18.5 350 27.5L350 ${y28p5}C350 ${y37p5} 349.939 ${y42p1219} 348.314 ${y45p6071}C346.525 ${y49p4425} 343.442 ${y52p5251} 339.607 ${y54p3135}C336 ${y56} 331.327 ${y56} 322 ${y56}H28C18.673 ${y56} 14 ${y56} 10.3928 ${y54p3135}C6.55747 ${y52p5251} 3.47487 ${y49p4425} 1.68642 ${y45p6071}C0.061093 ${y42p1219} 0 ${y37p5} 0 ${y28p5}L0 27.5Z`;
  };

  const phases = [
    "M0 27.5C0 18.5 0 14 1.68642 10.3929C3.47487 6.55751 6.55747 3.47492 10.3928 1.68646C14 0 18.673 0 28 0H322C331.327 0 336 0 339.607 1.68646C343.442 3.47492 346.525 6.55751 348.314 10.3929C350 14 350 18.5 350 27.5L350 28.5C350 37.5 349.939 42.1219 348.314 45.6071C346.525 49.4425 343.442 52.5251 339.607 54.3135C336 56 331.327 56 322 56H28C18.673 56 14 56 10.3928 54.3135C6.55747 52.5251 3.47487 49.4425 1.68642 45.6071C0.061093 42.1216 0 37.5 0 27.5L0 27.5Z",
    getPhaseTwoPath(),
  ];

  useEffect(() => {
    setShapeExtraHeight(stepsLength * SHAPE_GROWTH_PER_LINE_PX + 2);
  }, [stepsLength]);

  useEffect(() => {
    setActiveStep(Math.min(stepsLength, Math.max(1, Math.ceil(progress))));
  }, [progress, stepsLength]);

  useEffect(() => {
    if (progress < stepsLength) {
      setIsCompleted(false);
      return;
    }

    const completionTimeoutId = setTimeout(() => {
      setIsCompleted(true);
    }, 1_000);

    return () => clearTimeout(completionTimeoutId);
  }, [progress, stepsLength]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let currentProgress = 1;
    const loadStartTime = performance.now();

    setProgress(currentProgress);

    const advanceProgress = () => {
      const elapsedTimeMs = performance.now() - loadStartTime;
      const remainingTimeMs = Math.max(0, totalLoadTimeMs - elapsedTimeMs);

      if (remainingTimeMs === 0) {
        setProgress(stepsLength);
        return;
      }

      const increment = 0.08 + Math.random() * 0.32;
      const elapsedRatio = elapsedTimeMs / totalLoadTimeMs;
      const maximumProgress =
        1 +
        (stepsLength - 1) *
          Math.min(1, 0.82 * Math.sqrt(elapsedRatio) + 0.18 * elapsedRatio);
      currentProgress = Math.min(
        stepsLength,
        maximumProgress,
        currentProgress + increment,
      );
      setProgress(currentProgress);

      if (currentProgress < stepsLength) {
        const delayMs = Math.min(remainingTimeMs, 140 + Math.random() * 420);
        timeoutId = setTimeout(advanceProgress, delayMs);
      }
    };

    timeoutId = setTimeout(advanceProgress, 200 + Math.random() * 350);

    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [stepsLength, totalLoadTimeMs, loadRun]);

  useEffect(() => {
    return () => {
      if (shapeMorphAnimationFrameRef.current !== null) {
        cancelAnimationFrame(shapeMorphAnimationFrameRef.current);
      }

      if (shapeGlowAnimationFrameRef.current !== null) {
        cancelAnimationFrame(shapeGlowAnimationFrameRef.current);
      }
    };
  }, []);

  const animateShapeGlow = (event: MouseEvent<HTMLDivElement>) => {
    const glow = shapeGlowRef.current;
    if (!glow || isShapeExpandedRef.current) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const originX = ((event.clientX - rect.left) / rect.width) * 100;
    const originY = ((event.clientY - rect.top) / rect.height) * 100;

    if (shapeGlowAnimationFrameRef.current !== null) {
      cancelAnimationFrame(shapeGlowAnimationFrameRef.current);
    }

    glow.style.transition = "none";
    glow.style.transformOrigin = `${originX}% ${originY}%`;
    glow.style.transform = "scale(0.4)";
    glow.style.opacity = "0";
    void glow.offsetHeight;

    shapeGlowAnimationFrameRef.current = requestAnimationFrame(() => {
      glow.style.transition = "transform 0.35s ease-out, opacity 0.2s ease-out";
      glow.style.transform = "scale(1)";
      glow.style.opacity = "1";
      shapeGlowAnimationFrameRef.current = null;
    });
  };

  const resetShapeGlow = () => {
    const glow = shapeGlowRef.current;
    if (!glow) {
      return;
    }

    glow.style.transition = "opacity 0.1s ease-out";
    glow.style.opacity = "0";
    // glow.style.transform = "scale(0.4)";
  };

  const animateShape = () => {
    const shapePaths = [
      shapePathRef.current,
      shapeStrokePathRef.current,
    ].filter((path): path is SVGPathElement => path !== null);
    if (shapePaths.length === 0) {
      return;
    }

    if (shapeMorphAnimationFrameRef.current !== null) {
      cancelAnimationFrame(shapeMorphAnimationFrameRef.current);
    }

    const nextIsShapeExpanded = !isShapeExpandedRef.current;
    isShapeExpandedRef.current = nextIsShapeExpanded;
    setIsShapeExpanded(nextIsShapeExpanded);

    if (nextIsShapeExpanded) {
      resetShapeGlow();
    }

    const targetPath = nextIsShapeExpanded ? phases[1] : phases[0];
    const startTranslateY = shapeTranslateYRef.current;
    const targetTranslateY = nextIsShapeExpanded ? -shapeExtraHeight : 0;
    const pathInterpolators = shapePaths.map((path) =>
      interpolateMatchingPathCommands(
        path.getAttribute("d") ?? phases[0],
        targetPath,
      ),
    );
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / SHAPE_MORPH_DURATION_MS, 1);
      const easedProgress = easeInOut(progress);
      shapePaths.forEach((path, index) => {
        path.setAttribute("d", pathInterpolators[index](easedProgress));
      });
      const translateY =
        startTranslateY + (targetTranslateY - startTranslateY) * easedProgress;
      shapeTranslateYRef.current = translateY;
      if (shapeTransformRef.current) {
        shapeTransformRef.current.style.transform = `translateY(${translateY}px)`;
      }

      if (progress < 1) {
        shapeMorphAnimationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      shapeMorphAnimationFrameRef.current = null;
    };

    shapeMorphAnimationFrameRef.current = requestAnimationFrame(tick);
  };

  const restartAnimation = () => {
    if (shapeMorphAnimationFrameRef.current !== null) {
      cancelAnimationFrame(shapeMorphAnimationFrameRef.current);
      shapeMorphAnimationFrameRef.current = null;
    }

    // shapeTranslateYRef.current = 0;
    // shapeTransformRef.current?.style.setProperty(
    //   "transform",
    //   "translateY(0px)",
    // );
    // shapePathRef.current?.setAttribute("d", phases[0]);
    // shapeStrokePathRef.current?.setAttribute("d", phases[0]);
    // isShapeExpandedRef.current = false;
    // setIsShapeExpanded(false);
    setIsCompleted(false);
    setProgress(1);
    setActiveStep(1);
    setLoadRun((currentRun) => currentRun + 1);
  };

  const updateTotalLoadTime = (nextLoadTimeMs: number) => {
    setTotalLoadTimeMs(nextLoadTimeMs);
    setIsCompleted(false);
    setProgress(1);
    setActiveStep(1);
    setLoadRun((currentRun) => currentRun + 1);
  };

  return (
    <main className="min-h-screen w-full" style={{ backgroundColor: bgColor }}>
      <div className="absolute inset-0 flex items-stretch">
        <div
          className="flex-1 flex items-center justify-center"
          style={{ transform: `scale(${displayScale})` }}
          // onMouseDown={handleBackgroundPointerDown}
        >
          <div
            className="relative w-87.5 h-14 cursor-pointer"
            onClick={animateShape}
            onMouseEnter={animateShapeGlow}
            onMouseLeave={resetShapeGlow}
          >
            <div
              ref={shapeTransformRef}
              className="absolute -translate-x-1/2 pointer-events-none"
              style={{
                inset: `${-borderWidth}px auto auto 50%`,
                transform: "translateY(0px)",
              }}
            >
              <svg
                width={350 + borderWidth * 2}
                height={56 + borderWidth * 2 + shapeExtraHeight}
                viewBox={`${-borderWidth} ${-borderWidth} ${350 + borderWidth * 2} ${56 + borderWidth * 2 + shapeExtraHeight}`}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  ref={shapePathRef}
                  d={phases[0]}
                  fill={
                    isShapeExpanded
                      ? buttonColor
                      : `color-mix(in srgb, ${buttonColor} 50%, ${bgColor} 50%)`
                  }
                  stroke={
                    isCompleted
                      ? completionMode
                        ? stateColors[0]
                        : stateColors[1]
                      : `color-mix(in srgb,${borderColor} 50%, ${bgColor} 50%)`
                  }
                  strokeWidth={borderWidth}
                  style={{
                    transition: `stroke 0s ${SHAPE_MORPH_DURATION_MS}ms, fill ${SHAPE_MORPH_DURATION_MS}ms`,
                  }}
                />
                <path
                  ref={shapeStrokePathRef}
                  d={phases[0]}
                  stroke={
                    isCompleted
                      ? completionMode
                        ? stateColors[0]
                        : stateColors[1]
                      : "white"
                  }
                  strokeWidth={borderWidth}
                  strokeDasharray={isShapeExpanded ? 1037 : 781}
                  strokeDashoffset={
                    isShapeExpanded
                      ? `${progress >= stepsLength ? (isCompleted ? 2074 : 1164) : 1037}`
                      : `${isCompleted ? 0 : 781 - (781 * (progress - 1)) / stepsLength}`
                  }
                  strokeLinecap="round"
                  style={{
                    transition: `stroke-dasharray ${SHAPE_MORPH_DURATION_MS + 50}ms ease-out, stroke-dashoffset ${SHAPE_MORPH_DURATION_MS + 50}ms ease-out`,
                  }}
                />
              </svg>
              <div
                className="absolute top-7 origin-top rounded-[1px]"
                style={{
                  backgroundColor: isCompleted
                    ? completionMode
                      ? stateColors[0]
                      : stateColors[1]
                    : "white",
                  borderRadius: borderWidth / 2,
                  left: borderWidth / 2,
                  width: borderWidth,
                  transform: `scaleY(${isShapeExpanded ? (1 / stepsLength) * progress : 0})`,
                  height: `${stepsLength * SHAPE_GROWTH_PER_LINE_PX}px`,
                  transition: `transform ${SHAPE_MORPH_DURATION_MS}ms cubic-bezier(.65,0,.35,1)`,
                }}
              ></div>
            </div>
            <div className="absolute inset-[0.5px] rounded-[20px] overflow-hidden pointer-events-none">
              <div
                ref={shapeGlowRef}
                className="absolute -inset-8 rounded-full opacity-0 blur-lg"
                style={{
                  backgroundColor: buttonColor,
                  transform: "scale(0.4)",
                  transitionDelay: isShapeExpanded ? `200ms` : "0ms",
                }}
              ></div>
            </div>
            <div
              className="absolute px-5 py-4 inset-[auto_0_0_0] flex flex-col gap-2 justify-end items-stretch mask-[linear-gradient(to_top,transparent_2px,white_12px),linear-gradient(to_bottom,transparent_2px,white_12px)]"
              style={{
                pointerEvents: isShapeExpanded ? "auto" : "none",
                maxHeight: isShapeExpanded ? "188px" : "56px",
                transition: `max-height ${SHAPE_MORPH_DURATION_MS}ms cubic-bezier(.65,0,.35,1)`,
              }}
            >
              <div
                className="absolute bottom-2 right-1.5 w-10 h-10 flex items-center justify-center"
                style={{
                  transform: `translateY(${isShapeExpanded ? -stepsLength * SHAPE_GROWTH_PER_LINE_PX + activeStep * SHAPE_GROWTH_PER_LINE_PX : 0}px) scale(${progress === stepsLength ? 0.25 : 0.25})`,
                  transition: `transform ${SHAPE_MORPH_DURATION_MS}ms cubic-bezier(.65,0,.35,1), background-color 200ms`,
                }}
              >
                <Loader
                  bgColor={bgColor}
                  buttonColor={buttonColor}
                  completionMode={completionMode}
                  invertIcon={invertIcon}
                  isCompleted={isCompleted}
                  run={loadRun}
                  stateColors={stateColors}
                />
              </div>
              <div
                className="flex flex-col gap-2 justify-stretch"
                style={{
                  transform: `translateY(calc(${isShapeExpanded ? 0 : SHAPE_GROWTH_PER_LINE_PX * stepsLength - SHAPE_GROWTH_PER_LINE_PX * activeStep}px + 1px))`,
                  transition: `transform ${SHAPE_MORPH_DURATION_MS}ms cubic-bezier(.65,0,.35,1)`,
                }}
              >
                <p
                  className="text-[16px] font-bold duration-200"
                  style={{
                    opacity: isShapeExpanded ? 1 : 0,
                    transitionDelay: `${isShapeExpanded ? Math.abs(activeStep) * 67 : (stepsLength - 1 - Math.abs(activeStep)) * 50}ms`,
                  }}
                >
                  {title}
                </p>
                {steps.map((step, i) => (
                  <div
                    className="relative"
                    style={{
                      color:
                        i == activeStep - 1
                          ? isCompleted
                            ? completionMode
                              ? stateColors[0]
                              : stateColors[1]
                            : "rgba(255, 255, 255, 0.75)"
                          : "rgba(255, 255, 255, 0.4)",
                      opacity: isShapeExpanded || i == activeStep - 1 ? 1 : 0,
                      transition: `opacity 200ms ${isShapeExpanded ? Math.abs(activeStep - 1 - i) * 67 : (stepsLength - 1 - Math.abs(activeStep - 1 - i)) * 50}ms, color 200ms 0ms`,
                      // filter: `blur(${isShapeExpanded || i == activeStep - 1 ? 0 : 4}px)`,
                    }}
                    key={i}
                  >
                    <p
                      className="relative text-[16px] duration-200"
                      key={i}
                      style={{
                        opacity: i == stepsLength - 1 && isCompleted ? 0 : 1,
                      }}
                    >
                      {step}
                      <span
                        className="dot-1 inline-block"
                        style={{
                          opacity: isShapeExpanded || isCompleted ? 0 : 1,
                        }}
                      >
                        .
                      </span>
                      <span
                        className="dot-2 inline-block"
                        style={{
                          opacity: isShapeExpanded || isCompleted ? 0 : 1,
                        }}
                      >
                        .
                      </span>
                      <span
                        className="dot-3 inline-block"
                        style={{
                          opacity: isShapeExpanded || isCompleted ? 0 : 1,
                        }}
                      >
                        .
                      </span>
                    </p>
                    <p
                      className="absolute top-0 left-0 duration-200"
                      style={{
                        opacity: i == stepsLength - 1 && isCompleted ? 1 : 0,
                      }}
                    >
                      {completionMode ? `Finished` : `Error`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div
          className="relative border-l border-l-white/10 duration-200 cubic-bezier(.65,0,.35,1) overflow-hidden"
          style={{ width: isMenuOpen ? "240px" : "0" }}
        >
          <Nav />
          <div className="min-w-60 h-full px-4 flex flex-col items-stretch justify-center gap-4">
            <div className="flex flex-col items-stretch gap-1">
              <button
                className="w-8 h-6 flex items-center justify-center bg-white rounded-md cursor-pointer"
                onClick={restartAnimation}
              >
                <svg
                  role="button"
                  aria-label="Replay"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8.07227 1.7207C8.8738 1.7208 9.65077 1.87165 10.3994 2.17383C11.0408 2.43278 11.6225 2.78395 12.1426 3.22559L12.9121 2.46289C13.0255 2.34473 13.1678 2.25471 13.3379 2.2207C13.5104 2.18644 13.6795 2.21575 13.833 2.2793L13.8389 2.28223C13.9883 2.34745 14.1224 2.44709 14.2168 2.58984C14.3113 2.73296 14.3506 2.89512 14.3506 3.05859V6.5166C14.3506 6.74642 14.2622 6.95044 14.1016 7.11133C13.9408 7.27209 13.7365 7.36013 13.5068 7.36035H10.0479C9.88294 7.3603 9.7195 7.32055 9.57617 7.22363C9.43433 7.12747 9.33577 6.9918 9.27148 6.8418L9.22949 6.72461C9.19489 6.60507 9.18466 6.47817 9.21094 6.34863C9.2459 6.17645 9.33819 6.03306 9.45703 5.91797L10.249 5.125C9.61647 4.63803 8.89435 4.39663 8.07227 4.39648C7.58411 4.39648 7.1198 4.4913 6.67773 4.68066C6.23023 4.87245 5.84728 5.13032 5.52539 5.45215C5.2035 5.77404 4.94573 6.15695 4.75391 6.60449C4.56442 7.04668 4.46973 7.51071 4.46973 7.99902C4.46976 8.48731 4.56441 8.95139 4.75391 9.39355C4.94572 9.84099 5.20356 10.2241 5.52539 10.5459C5.84722 10.8676 6.23035 11.1247 6.67773 11.3164C7.11985 11.5058 7.58405 11.6016 8.07227 11.6016C8.63128 11.6015 9.15747 11.479 9.6543 11.2354C10.0886 11.0222 10.4644 10.7327 10.7812 10.3643L10.9131 10.2021C11.0224 10.0548 11.1819 9.99252 11.3252 9.97461L11.3467 9.97266H11.3682C11.4827 9.97273 11.5968 9.99926 11.6982 10.0596L11.7949 10.1318L11.8027 10.1387L11.8096 10.1455L12.8672 11.2109C12.9484 11.2886 13.0017 11.3832 13.0264 11.4873L13.042 11.6016L13.0361 11.7119C13.0209 11.8203 12.9765 11.9211 12.9072 12.0078L12.9043 12.0117C12.3104 12.7309 11.5887 13.2895 10.7441 13.6846C9.90012 14.0793 9.00801 14.2772 8.07227 14.2773C7.2227 14.2773 6.40838 14.1109 5.63379 13.7783C4.86483 13.448 4.19612 13.0007 3.63281 12.4375C3.06966 11.8743 2.62328 11.2063 2.29297 10.4375C1.96015 9.66275 1.793 8.84879 1.79297 7.99902C1.79297 7.14924 1.96018 6.33532 2.29297 5.56055C2.62333 4.79155 3.0695 4.12289 3.63281 3.55957C4.19612 2.99633 4.86483 2.55005 5.63379 2.21973C6.40844 1.88705 7.22263 1.7207 8.07227 1.7207Z"
                    fill={bgColor}
                  />
                </svg>
              </button>
            </div>
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
                <label htmlFor="totalLoadTimeMs">Loading time:</label>
                <label>{totalLoadTimeMs}ms</label>
              </div>
              <input
                id="totalLoadTimeMs"
                type="range"
                min="0"
                max="20000"
                step="1"
                value={totalLoadTimeMs}
                onChange={(e) => {
                  updateTotalLoadTime(Number(e.target.value));
                }}
              />
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
            <div className="flex flex-col items-stretch gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="completionMode">Success mode:</label>
                <input
                  id="completionMode"
                  type="checkbox"
                  checked={completionMode}
                  onChange={(e) => {
                    setCompletionMode(e.target.checked);
                  }}
                />
              </div>
              <div className="w-full flex flex-col gap-1 overflow-hidden">
                <div className="w-full mb-2 flex items-center gap-1">
                  {stateColors.map((color, index) => (
                    <div
                      className="w-full h-6 flex items-center justify-center rounded-md overflow-hidden"
                      key={index}
                    >
                      <input
                        className="min-w-[calc(100%+16px)] min-h-10 cursor-pointer"
                        type="color"
                        value={color}
                        onChange={(e) => {
                          const nextColors = [...stateColors];
                          nextColors[index] = e.target.value;
                          setStateColors(nextColors);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="invertIcon">Invert icon colors:</label>
                <input
                  id="invertIcon"
                  type="checkbox"
                  checked={invertIcon}
                  onChange={(e) => {
                    setInvertIcon(e.target.checked);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <svg
          className="absolute top-4 right-4 opacity-70 hover:opacity-100 duration-200 cubic-bezier(.65,0,.35,1) cursor-pointer"
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

      <style jsx global>{`
        .dot-1,
        .dot-2,
        .dot-3 {
          animation: bounce 1s ease-in-out infinite;
        }
        .dot-1 {
          animation-delay: 0s;
        }
        .dot-2 {
          animation-delay: 0.1s;
        }
        .dot-3 {
          animation-delay: 0.2s;
        }

        @keyframes bounce {
          0%,
          30% {
            transform: translate(2px, 0);
          }
          50% {
            transform: translate(2px, -3px);
          }
          70%,
          100% {
            transform: translate(2px, 0);
          }
        }
      `}</style>
    </main>
  );
}
