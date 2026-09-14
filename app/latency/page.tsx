"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Archivo,
  DM_Mono,
  DM_Sans,
  Fira_Code,
  Geist,
  Inter,
  JetBrains_Mono,
  Lato,
  Manrope,
  Nunito,
  Open_Sans,
  Outfit,
  Plus_Jakarta_Sans,
  Raleway,
  Roboto,
  Rubik,
  Sora,
  Space_Grotesk,
  Source_Code_Pro,
  Syne,
  Urbanist,
  Work_Sans,
} from "next/font/google";
import Nav from "../components/Nav";

let STATE_DURATION_MS = 1050;
let SPEED_FACTOR = 1;
const TRANSITION_DURATION_MS = 280;
const SHAPE_SIZE = 38;
const KNOB_SIZE = 28;

const geist = Geist({ subsets: ["latin"] });
const inter = Inter({ subsets: ["latin"] });
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"] });
const openSans = Open_Sans({ subsets: ["latin"] });
const lato = Lato({ subsets: ["latin"], weight: ["400", "700"] });
const nunito = Nunito({ subsets: ["latin"] });
const raleway = Raleway({ subsets: ["latin"] });
const workSans = Work_Sans({ subsets: ["latin"] });
const manrope = Manrope({ subsets: ["latin"] });
const dmSans = DM_Sans({ subsets: ["latin"] });
const outfit = Outfit({ subsets: ["latin"] });
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });
const urbanist = Urbanist({ subsets: ["latin"] });
const rubik = Rubik({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });
const sora = Sora({ subsets: ["latin"] });
const syne = Syne({ subsets: ["latin"] });
const archivo = Archivo({ subsets: ["latin"] });

const firaCode = Fira_Code({ subsets: ["latin"] });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"] });
const sourceCodePro = Source_Code_Pro({ subsets: ["latin"] });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"] });

type FontOption = {
  id: string;
  label: string;
  group: "sans" | "mono";
  className: string;
};

const FONT_OPTIONS: FontOption[] = [
  {
    id: "geist",
    label: "Geist (Default)",
    group: "sans",
    className: geist.className,
  },
  { id: "inter", label: "Inter", group: "sans", className: inter.className },
  { id: "roboto", label: "Roboto", group: "sans", className: roboto.className },
  {
    id: "open-sans",
    label: "Open Sans",
    group: "sans",
    className: openSans.className,
  },
  { id: "lato", label: "Lato", group: "sans", className: lato.className },
  { id: "nunito", label: "Nunito", group: "sans", className: nunito.className },
  {
    id: "raleway",
    label: "Raleway",
    group: "sans",
    className: raleway.className,
  },
  {
    id: "work-sans",
    label: "Work Sans",
    group: "sans",
    className: workSans.className,
  },
  {
    id: "manrope",
    label: "Manrope",
    group: "sans",
    className: manrope.className,
  },
  {
    id: "dm-sans",
    label: "DM Sans",
    group: "sans",
    className: dmSans.className,
  },
  { id: "outfit", label: "Outfit", group: "sans", className: outfit.className },
  {
    id: "plus-jakarta-sans",
    label: "Plus Jakarta Sans",
    group: "sans",
    className: plusJakartaSans.className,
  },
  {
    id: "urbanist",
    label: "Urbanist",
    group: "sans",
    className: urbanist.className,
  },
  { id: "rubik", label: "Rubik", group: "sans", className: rubik.className },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    group: "sans",
    className: spaceGrotesk.className,
  },
  { id: "sora", label: "Sora", group: "sans", className: sora.className },
  { id: "syne", label: "Syne", group: "sans", className: syne.className },
  {
    id: "archivo",
    label: "Archivo",
    group: "sans",
    className: archivo.className,
  },
  {
    id: "fira-code",
    label: "Fira Code",
    group: "mono",
    className: firaCode.className,
  },
  {
    id: "jetbrains-mono",
    label: "JetBrains Mono",
    group: "mono",
    className: jetBrainsMono.className,
  },
  {
    id: "source-code-pro",
    label: "Source Code Pro",
    group: "mono",
    className: sourceCodePro.className,
  },
  {
    id: "dm-mono",
    label: "DM Mono",
    group: "mono",
    className: dmMono.className,
  },
];

type Pose = {
  parentRotate: number;
  shape1Width: number;
  shape1Height: number;
  shape1X: number;
  shape1Y: number;
  shape2Scale: number;
  shape3Scale: number;
  shape4Scale: number;
  knob1Width: number;
  knob1Height: number;
  knob1X: number;
  knob1Y: number;
  knob1Rotate: number;
  knob4Opacity: number;
  testOpacity: number;
};

const INITIAL_POSE: Pose = {
  parentRotate: 0,
  shape1Width: SHAPE_SIZE,
  shape1Height: SHAPE_SIZE,
  shape1X: 0,
  shape1Y: 0,
  shape2Scale: 1,
  shape3Scale: 1,
  shape4Scale: 1,
  knob1Width: KNOB_SIZE,
  knob1Height: KNOB_SIZE,
  knob1X: 0,
  knob1Y: 0,
  knob1Rotate: 0,
  knob4Opacity: 1,
  testOpacity: 0,
};

const POSE_VARIABLES: [keyof Pose, `--${string}`][] = [
  ["parentRotate", "--parent-rotate"],
  ["shape1Width", "--shape-1-width"],
  ["shape1Height", "--shape-1-height"],
  ["shape1X", "--shape-1-x"],
  ["shape1Y", "--shape-1-y"],
  ["shape2Scale", "--shape-2-scale"],
  ["shape3Scale", "--shape-4-scale"],
  ["shape4Scale", "--shape-3-scale"],
  ["knob1Width", "--knob-1-width"],
  ["knob1Height", "--knob-1-height"],
  ["knob1X", "--knob-1-x"],
  ["knob1Y", "--knob-1-y"],
  ["knob1Rotate", "--knob-1-rotate"],
  ["knob4Opacity", "--knob-3-opacity"],
  ["testOpacity", "--test-opacity"],
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mix(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function alignEquivalentAngle(target: number, reference: number) {
  return target + Math.round((reference - target) / 360) * 360;
}

function easeIn(progress: number) {
  return progress * progress;
}

function easeOut(progress: number) {
  return 1 - (1 - progress) * (1 - progress);
}

function easeInOut(progress: number) {
  if (progress < 0.5) {
    return 2 * progress * progress;
  }

  return 1 - Math.pow(-2 * progress + 2, 2) / 2;
}

function getAlternatingProgress(elapsedMs: number, durationMs: number) {
  const iteration = Math.floor(elapsedMs / durationMs);
  const progress = (elapsedMs % durationMs) / durationMs;

  return iteration % 2 === 0 ? progress : 1 - progress;
}

function getKnob1State1(localMs: number) {
  const progress = getAlternatingProgress(localMs, 550 * SPEED_FACTOR);

  if (progress <= 0.5) {
    const segmentProgress = easeIn(progress / 0.5);

    return {
      width: mix(28, 36, segmentProgress),
      x: mix(0, 32, segmentProgress),
    };
  }

  const segmentProgress = easeOut((progress - 0.5) / 0.5);

  return {
    width: mix(36, 28, segmentProgress),
    x: mix(32, 42, segmentProgress),
  };
}

function getKnob1State2(localMs: number) {
  const progress = getAlternatingProgress(localMs, 450 * SPEED_FACTOR);

  if (progress <= 0.5) {
    const segmentProgress = easeIn(progress / 0.5);

    return {
      height: mix(28, 56, segmentProgress),
      y: mix(0, 11, segmentProgress),
    };
  }

  const segmentProgress = easeOut((progress - 0.5) / 0.5);

  return {
    height: mix(56, 28, segmentProgress),
    y: mix(11, 42, segmentProgress),
  };
}

function getKnob1State5(localMs: number) {
  const segmentDurationMs = 250 * SPEED_FACTOR;
  const fullLoopMs = segmentDurationMs * 4;
  const loopMs = localMs % fullLoopMs;
  const segmentIndex = Math.floor(loopMs / segmentDurationMs);
  const segmentProgress = (loopMs % segmentDurationMs) / segmentDurationMs;

  switch (segmentIndex) {
    case 0:
      return {
        x: mix(0, 42, segmentProgress),
        y: 0,
      };
    case 1:
      return {
        x: 42,
        y: mix(0, 42, segmentProgress),
      };
    case 2:
      return {
        x: mix(42, 0, segmentProgress),
        y: 42,
      };
    default:
      return {
        x: 0,
        y: mix(42, 0, segmentProgress),
      };
  }
}

function getTargetPose(state: number, localMs: number): Pose {
  switch (state) {
    case 1: {
      const knob = getKnob1State1(localMs);

      return {
        ...INITIAL_POSE,
        shape1Width: 80,
        shape2Scale: 0,
        shape3Scale: 0,
        knob1Width: knob.width,
        knob1X: knob.x,
        knob4Opacity: 0,
      };
    }
    case 2: {
      const knob = getKnob1State2(localMs);

      return {
        ...INITIAL_POSE,
        shape1Height: 80,
        shape1X: 21,
        shape2Scale: 0,
        shape3Scale: 0,
        shape4Scale: 0,
        knob1Height: knob.height,
        knob1Y: knob.y,
      };
    }
    case 3:
      return {
        ...INITIAL_POSE,
        parentRotate: -90,
        shape1Width: 80,
        shape1Height: 80,
        shape2Scale: 0,
        shape3Scale: 0,
        shape4Scale: 0,
        knob1Width: 20,
        knob1Height: 70,
        knob1X: 25,
        knob1Rotate:
          -270 * (((localMs / STATE_DURATION_MS) * 1) / SPEED_FACTOR),
      };
    case 4:
      const knob = getKnob1State1(localMs);

      return {
        ...INITIAL_POSE,
        parentRotate: -90,
        shape1Width: 80,
        shape2Scale: 0,
        shape3Scale: 0,
        knob1Width: knob.width,
        knob1X: knob.x,
        knob4Opacity: 0,
      };
    case 5: {
      const knob = getKnob1State5(localMs);

      return {
        ...INITIAL_POSE,
        parentRotate: 90,
        knob1X: knob.x,
        knob1Y: knob.y,
        testOpacity: 1,
      };
    }
    default:
      return INITIAL_POSE;
  }
}

function interpolatePose(from: Pose, to: Pose, progress: number): Pose {
  return {
    parentRotate: mix(from.parentRotate, to.parentRotate, progress),
    shape1Width: mix(from.shape1Width, to.shape1Width, progress),
    shape1Height: mix(from.shape1Height, to.shape1Height, progress),
    shape1X: mix(from.shape1X, to.shape1X, progress),
    shape1Y: mix(from.shape1Y, to.shape1Y, progress),
    shape2Scale: mix(from.shape2Scale, to.shape2Scale, progress),
    shape3Scale: mix(from.shape3Scale, to.shape3Scale, progress),
    shape4Scale: mix(from.shape4Scale, to.shape4Scale, progress),
    knob1Width: mix(from.knob1Width, to.knob1Width, progress),
    knob1Height: mix(from.knob1Height, to.knob1Height, progress),
    knob1X: mix(from.knob1X, to.knob1X, progress),
    knob1Y: mix(from.knob1Y, to.knob1Y, progress),
    knob1Rotate: mix(from.knob1Rotate, to.knob1Rotate, progress),
    knob4Opacity: mix(from.knob4Opacity, to.knob4Opacity, progress),
    testOpacity: to.testOpacity,
  };
}

function applyPose(element: HTMLDivElement, pose: Pose) {
  for (const [key, variable] of POSE_VARIABLES) {
    element.style.setProperty(variable, `${pose[key]}`);
  }
}

export default function Home() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [displayScale, setDisplayScale] = useState(1);
  const [speedFactor, setSpeedFactor] = useState(1);
  const [intervalDuration, setIntervalDuration] = useState(STATE_DURATION_MS);
  const [text, setText] = useState("Building");
  const [boxOpacity, setBoxOpacity] = useState(1);
  const [isColorMode, setIsColorMode] = useState(true);
  const defaultColors = ["#EB8652", "#FFC61A", "#B5F349", "#2BFAFF", "#FF5CB0"];
  const [colors, setColors] = useState<string[]>(defaultColors);
  const isColorModeRef = useRef(isColorMode);
  const colorsRef = useRef(colors);
  const [textBloom, setTextBloom] = useState(0);
  const [selectedFont, setSelectedFont] = useState("geist");
  const [roundedCorners, setRoundedCorners] = useState(1);

  const selectedFontClassName =
    FONT_OPTIONS.find((option) => option.id === selectedFont)?.className ??
    geist.className;

  useEffect(() => {
    SPEED_FACTOR = 1 / speedFactor;
  }, [speedFactor]);

  useEffect(() => {
    STATE_DURATION_MS = intervalDuration;
  }, [intervalDuration]);

  useEffect(() => {
    isColorModeRef.current = isColorMode;
  }, [isColorMode]);

  useEffect(() => {
    colorsRef.current = colors;
  }, [colors]);

  useLayoutEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    let frameId = 0;
    const startTime = performance.now();
    let currentState = 1;
    let transitionFromState = 1;
    let transitionToState = 1;
    let transitionStartTime = startTime;
    let transitionFrom = INITIAL_POSE;
    let lastPose = INITIAL_POSE;

    const updateActiveColor = (state: number) => {
      const activeColor = isColorModeRef.current
        ? colorsRef.current[(state - 1) % colorsRef.current.length]
        : "#ffffff";

      document.documentElement.style.setProperty("--active", activeColor);
    };

    root.classList.add(`state-${currentState}`);
    updateActiveColor(currentState);

    const tick = (now: number) => {
      const elapsedMs = now - startTime;
      const nextState = (Math.floor(elapsedMs / STATE_DURATION_MS) % 5) + 1;
      const localMs = elapsedMs % STATE_DURATION_MS;

      if (nextState !== currentState) {
        root.classList.remove(`state-${currentState}`);
        root.classList.add(`state-${nextState}`);
        transitionFromState = currentState;
        transitionToState = nextState;
        currentState = nextState;
        transitionStartTime = now;
        transitionFrom = lastPose;
      }

      updateActiveColor(nextState);

      const targetPose = getTargetPose(nextState, localMs);
      targetPose.knob1Rotate = alignEquivalentAngle(
        targetPose.knob1Rotate,
        lastPose.knob1Rotate,
      );
      const transitionProgress = clamp(
        (now - transitionStartTime) / TRANSITION_DURATION_MS,
        0,
        1,
      );
      const visiblePose =
        transitionProgress < 1
          ? interpolatePose(
              transitionFrom,
              targetPose,
              easeInOut(transitionProgress),
            )
          : targetPose;

      if (transitionFromState === 4 && transitionToState === 5) {
        visiblePose.testOpacity =
          transitionProgress < 1
            ? mix(
                transitionFrom.testOpacity,
                targetPose.testOpacity,
                easeInOut(transitionProgress),
              )
            : targetPose.testOpacity;
      } else {
        visiblePose.testOpacity = targetPose.testOpacity;
      }

      applyPose(root, visiblePose);
      lastPose = visiblePose;
      frameId = requestAnimationFrame(tick);
    };

    applyPose(root, INITIAL_POSE);
    frameId = requestAnimationFrame(tick);

    return () => {
      document.documentElement.style.setProperty("--active", "#ffffff");
      root.classList.remove(`state-${currentState}`);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <main className="min-h-screen w-full">
      <div className="absolute inset-0 flex items-stretch">
        <div
          className="flex-1 flex items-center justify-center gap-8"
          style={{ transform: `scale(${displayScale})` }}
        >
          <div
            className="box w-26.5 h-26.5 flex items-center justify-center [corner-shape:superellipse(1.5)] overflow-hidden duration-200"
            style={{
              borderRadius: roundedCorners * 40,
              backgroundColor: `color-mix(in srgb, var(--active) ${boxOpacity * 100}%, transparent)`,
            }}
          >
            <div
              ref={rootRef}
              className="state-parent relative w-20 h-20 grid grid-cols-2 grid-rows-2 gap-1"
            >
              <div
                className="test absolute z-3 top-0 left-0 w-9.5 h-9.5 border-5"
                style={{
                  borderRadius: roundedCorners * 19,
                  borderColor:
                    boxOpacity > 0.5 ? "var(--background)" : "var(--active)",
                }}
              ></div>
              <div
                className="test absolute z-3 top-0 right-0 w-9.5 h-9.5 border-5"
                style={{
                  borderRadius: roundedCorners * 19,
                  borderColor:
                    boxOpacity > 0.5 ? "var(--background)" : "var(--active)",
                }}
              ></div>
              <div
                className="test absolute z-3 bottom-0 right-0 w-9.5 h-9.5 border-5"
                style={{
                  borderRadius: roundedCorners * 19,
                  borderColor:
                    boxOpacity > 0.5 ? "var(--background)" : "var(--active)",
                }}
              ></div>
              <div
                className="test absolute z-3 bottom-0 left-0 w-9.5 h-9.5 border-5"
                style={{
                  borderRadius: roundedCorners * 19,
                  borderColor:
                    boxOpacity > 0.5 ? "var(--background)" : "var(--active)",
                }}
              ></div>

              <div className="relative z-2 w-9.5 h-9.5">
                <div
                  className="shape-1 p-1.25 origin-[25%_25%]"
                  style={{
                    borderRadius: roundedCorners < 1 ? roundedCorners * 19 : 40,
                    backgroundColor:
                      boxOpacity > 0.5 ? "var(--background)" : "var(--active)",
                  }}
                >
                  <div
                    className="relative knob-1"
                    style={{
                      borderRadius: roundedCorners * 14,
                      backgroundColor:
                        boxOpacity > 0.5
                          ? "var(--active)"
                          : "var(--background)",
                    }}
                  ></div>
                </div>
              </div>
              <div className="relative z-1 w-9.5 h-9.5">
                <div
                  className="shape-2 w-full h-full p-1.25 origin-[75%_25%]"
                  style={{
                    borderRadius: roundedCorners * 19,
                    backgroundColor:
                      boxOpacity > 0.5 ? "var(--background)" : "var(--active)",
                  }}
                >
                  {/* <div className="knob-2 w-7 h-7 rounded-[14px] bg-(--active)"></div> */}
                </div>
              </div>
              <div className="relative z-1 w-9.5 h-9.5">
                <div
                  className="shape-3 w-full h-full p-1.25 origin-[25%_75%]"
                  style={{
                    borderRadius: roundedCorners * 19,
                    backgroundColor:
                      boxOpacity > 0.5 ? "var(--background)" : "var(--active)",
                  }}
                >
                  {/* <div className="knob-3 w-7 h-7 rounded-[14px] bg-(--active)"></div> */}
                </div>
              </div>
              <div className="relative z-1 w-9.5 h-9.5">
                <div
                  className="shape-4 w-full h-full p-1.25 origin-[75%_75%]"
                  style={{
                    borderRadius: roundedCorners * 19,
                    backgroundColor:
                      boxOpacity > 0.5 ? "var(--background)" : "var(--active)",
                  }}
                >
                  {/* <div className="knob-4 w-7 h-7 rounded-[14px] bg-(--active)"></div> */}
                </div>
              </div>
            </div>
          </div>
          <h1 className={selectedFontClassName}>
            {text.split("").map((char, index) => (
              <span
                className="text-(--active)"
                style={{
                  transition: `color 0.3s ease ${(index * textBloom) / text.split("").length}s`,
                }}
                key={index}
              >
                {char}
              </span>
            ))}
          </h1>
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
            <div className="flex flex-col items-start gap-1">
              <label htmlFor="text">Text</label>
              <input
                className="border border-white/25 rounded-[8px] px-2 py-1 text-white"
                id="text"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            <div className="flex flex-col items-start gap-1">
              <label htmlFor="font">Font:</label>
              <select
                className="bg-white/10 p-1.25 rounded-[8px]"
                name="font"
                id="font"
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
              >
                <optgroup label="Sans-Serif">
                  {FONT_OPTIONS.filter((option) => option.group === "sans").map(
                    (option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ),
                  )}
                </optgroup>
                <optgroup label="Monospace">
                  {FONT_OPTIONS.filter((option) => option.group === "mono").map(
                    (option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ),
                  )}
                </optgroup>
              </select>
            </div>
            <div className="flex flex-col items-stretch gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="boxOpacity">Box opacity:</label>
                <label>{boxOpacity}</label>
              </div>
              <input
                id="boxOpacity"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={boxOpacity}
                onChange={(e) => setBoxOpacity(parseFloat(e.target.value))}
              />
            </div>
            <div
              className="grid items-start gap-1 duration-200 ease-in-out overflow-hidden"
              style={{
                gridTemplateRows: isColorMode ? "auto 1fr" : "auto 0fr",
              }}
            >
              <div className="flex items-center justify-between">
                <label htmlFor="colorMode">Show colors:</label>
                <input
                  id="colorMode"
                  type="checkbox"
                  checked={isColorMode}
                  onChange={(e) => setIsColorMode(e.target.checked)}
                />
              </div>
              <div className="w-full flex flex-col gap-1 overflow-hidden">
                <div className="w-full mb-2 flex items-center gap-1">
                  {colors.map((color, index) => (
                    <div
                      className="w-full h-6 flex items-center justify-center rounded-[6px] overflow-hidden"
                      key={index}
                    >
                      <input
                        className="min-w-[calc(100%+16px)] min-h-10 cursor-pointer"
                        type="color"
                        value={color}
                        onChange={(e) => {
                          const nextColors = [...colors];
                          nextColors[index] = e.target.value;
                          setColors(nextColors);
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="textBloom">Text bloom:</label>
                  <label>{textBloom}</label>
                </div>
                <input
                  id="textBloom"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={textBloom}
                  onChange={(e) => setTextBloom(parseFloat(e.target.value))}
                />
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="intervalDuration">Interval duration:</label>
                <label>{intervalDuration}ms</label>
              </div>
              <input
                id="intervalDuration"
                type="range"
                min="500"
                max="2000"
                step="100"
                value={intervalDuration}
                onChange={(e) =>
                  setIntervalDuration(parseFloat(e.target.value))
                }
              />
            </div>
            <div className="flex flex-col items-stretch gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="speedFactor">Speed factor:</label>
                <label>{speedFactor}</label>
              </div>
              <input
                id="speedFactor"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={speedFactor}
                onChange={(e) => setSpeedFactor(parseFloat(e.target.value))}
              />
            </div>
            <div className="flex flex-col items-stretch gap-1">
              <div className="flex items-center justify-between">
                <label htmlFor="roundedCorners">Rounded corners:</label>
                <label>{roundedCorners * 100}%</label>
              </div>
              <input
                id="roundedCorners"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={roundedCorners}
                onChange={(e) => setRoundedCorners(parseFloat(e.target.value))}
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
