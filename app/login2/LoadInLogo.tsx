"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

const STATE_DURATION_MS = 1050;
const SPEED_FACTOR = 1.3;
const TRANSITION_DURATION_MS = 280;
const SHAPE_SIZE = 38;
const KNOB_SIZE = 28;
const BASE_SIZE = 80;
const INITIAL_FREEZE_MS = 350;
const STATE5_SEGMENT_DURATION_MS = 250;
const DEFAULT_ACTIVE_COLOR = "var(--neutral-100)";
const STATE5_COLORS = ["#35C6FF", "#B5F349", "#FFC61A", "#FF9748"];
const STATES = [1, 2, 3, 4, 5];
const STATE1_PHASE_1_DURATION_MS = 620;
const STATE1_PHASE_2_DURATION_MS = 430;
const STATE1_PHASE_1_ROTATE_DEG = -90;
const STATE1_PHASE_2_ROTATE_DEG = -360;
const CASE1_START_WIDTH_PX = 40;
const CASE1_END_WIDTH_PX = 177;

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

function cubicBezier(
  progress: number,
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
) {
  const x = clamp(progress, 0, 1);
  const sample = (t: number, a: number, b: number) => {
    const inv = 1 - t;
    return 3 * inv * inv * t * a + 3 * inv * t * t * b + t * t * t;
  };
  let low = 0;
  let high = 1;
  let mid = x;

  for (let index = 0; index < 12; index += 1) {
    mid = (low + high) / 2;
    const sampleX = sample(mid, p1x, p2x);

    if (Math.abs(sampleX - x) < 0.0001) {
      break;
    }

    if (sampleX < x) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return sample(mid, p1y, p2y);
}

function getAlternatingProgress(elapsedMs: number, durationMs: number) {
  const iteration = Math.floor(elapsedMs / durationMs);
  const progress = (elapsedMs % durationMs) / durationMs;

  return iteration % 2 === 0 ? progress : 1 - progress;
}

function getKnob1State1(localMs: number) {
  const progress = getAlternatingProgress(localMs, 550);

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
  const progress = getAlternatingProgress(localMs, 550);

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

function getState5SegmentIndex(localMs: number) {
  const loopMs = localMs % (STATE5_SEGMENT_DURATION_MS * 4);

  return Math.floor(loopMs / STATE5_SEGMENT_DURATION_MS);
}

function getKnob1State5(localMs: number) {
  const segmentIndex = getState5SegmentIndex(localMs);
  const segmentProgress =
    (localMs % STATE5_SEGMENT_DURATION_MS) / STATE5_SEGMENT_DURATION_MS;

  switch (segmentIndex) {
    case 0:
      return { x: 0, y: mix(0, 42, segmentProgress) };
    case 1:
      return { x: mix(0, 42, segmentProgress), y: 42 };
    case 2:
      return { x: 42, y: mix(42, 0, segmentProgress) };
    default:
      return { x: mix(42, 0, segmentProgress), y: 0 };
  }
}

function getTargetPose(state: number, localMs: number): Pose {
  switch (state) {
    case 1: {
      let knob1Rotate: number;

      if (localMs <= STATE1_PHASE_1_DURATION_MS) {
        const progress = cubicBezier(
          localMs / STATE1_PHASE_1_DURATION_MS,
          0.19,
          0,
          0.82,
          0.68,
        );
        knob1Rotate = mix(0, STATE1_PHASE_1_ROTATE_DEG, progress);
      } else {
        const progress = cubicBezier(
          (localMs - STATE1_PHASE_1_DURATION_MS) / STATE1_PHASE_2_DURATION_MS,
          0.16,
          0.33,
          0.63,
          0.82,
        );
        knob1Rotate = mix(
          STATE1_PHASE_1_ROTATE_DEG,
          STATE1_PHASE_2_ROTATE_DEG,
          progress,
        );
      }

      return {
        ...INITIAL_POSE,
        parentRotate: 90,
        shape1Width: 80,
        shape1Height: 80,
        shape2Scale: 0,
        shape3Scale: 0,
        shape4Scale: 0,
        knob1Width: 20,
        knob1Height: 70,
        knob1X: 25,
        knob1Rotate,
      };
    }
    case 2: {
      const knob = getKnob1State5(localMs);

      return {
        ...INITIAL_POSE,
        parentRotate: -90,
        knob1X: knob.x,
        knob1Y: knob.y,
        testOpacity: 1,
      };
    }
    case 3: {
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
    case 4: {
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
    case 5:
      return {
        ...INITIAL_POSE,
        parentRotate: 90,
        shape1Height: 80,
        shape3Scale: 0,
        shape4Scale: 0,
      };
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
    testOpacity: mix(from.testOpacity, to.testOpacity, progress),
  };
}

function applyPose(element: HTMLDivElement, pose: Pose) {
  for (const [key, variable] of POSE_VARIABLES) {
    element.style.setProperty(variable, `${pose[key]}`);
  }
}

type LoadInLogoProps = {
  size?: number;
  onActiveColorChange?: (color: string) => void;
};

export default function LoadInLogo({
  size = BASE_SIZE,
  onActiveColorChange,
}: LoadInLogoProps) {
  const boxOpacity = 0;
  const isLooped = false;
  const rootRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<SVGSVGElement>(null);
  const onActiveColorChangeRef = useRef(onActiveColorChange);

  useEffect(() => {
    onActiveColorChangeRef.current = onActiveColorChange;
  }, [onActiveColorChange]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const wrapper = wrapperRef.current;
    const wordmarkPaths = wordmarkRef.current
      ? Array.from(wordmarkRef.current.querySelectorAll("path"))
      : [];

    if (!root || !wrapper) {
      return;
    }

    const totalTimelineMs = STATES.length * STATE_DURATION_MS;
    const startTime = performance.now();
    let frameId = 0;
    let currentState = STATES[0];
    let transitionStartTimeline = 0;
    let transitionFrom = INITIAL_POSE;
    let lastPose = INITIAL_POSE;
    let isTransitioning = false;
    let activeColor = DEFAULT_ACTIVE_COLOR;

    // Scoped to the logo so it doesn't leak to the rest of the page.
    wrapper.style.setProperty("--active", activeColor);
    onActiveColorChangeRef.current?.(activeColor);

    const renderAtTimeline = (timelineMs: number) => {
      const stateIndex = Math.floor(timelineMs / STATE_DURATION_MS);
      const nextState = STATES[Math.min(stateIndex, STATES.length - 1)];
      const localMs = timelineMs - stateIndex * STATE_DURATION_MS;

      const nextColor =
        nextState === 1 ? DEFAULT_ACTIVE_COLOR : STATE5_COLORS[nextState - 2];

      if (nextColor !== activeColor) {
        activeColor = nextColor;
        wrapper.style.setProperty("--active", activeColor);
        onActiveColorChangeRef.current?.(activeColor);
      }

      if (wordmarkRef.current) {
        const stateProgress = localMs / STATE_DURATION_MS;
        let skewX = 0;
        let strokeWidth = 2.45;

        if (nextState === 3) {
          if (stateProgress <= 0.1) {
            skewX = 0;
          } else if (stateProgress <= 0.4) {
            skewX = mix(0, -20, easeInOut((stateProgress - 0.1) / 0.3));
          } else if (stateProgress <= 0.7) {
            skewX = -20;
          } else {
            skewX = mix(-20, 0, easeInOut((stateProgress - 0.7) / 0.3));
          }
        }

        if (nextState === 4) {
          if (stateProgress <= 0.3) {
            strokeWidth = mix(2.45, 0, easeInOut(stateProgress / 0.3));
          } else if (stateProgress <= 0.5) {
            strokeWidth = 0;
          } else if (stateProgress <= 0.8) {
            strokeWidth = mix(0, 2.45, easeInOut((stateProgress - 0.5) / 0.3));
          }
        }

        wordmarkRef.current.style.transform = `skewX(${skewX}deg)`;
        const strokeWidthPx = `${strokeWidth.toFixed(2)}px`;
        for (const path of wordmarkPaths) {
          path.style.strokeWidth = strokeWidthPx;
        }
      }

      {
        const stateProgress = localMs / STATE_DURATION_MS;
        const stageWidth =
          !isLooped && nextState === 1
            ? mix(
                CASE1_START_WIDTH_PX,
                CASE1_END_WIDTH_PX,
                cubicBezier(stateProgress, 0.8, 0, 0.4, 1),
              )
            : CASE1_END_WIDTH_PX;

        wrapper.style.width = `${stageWidth.toFixed(2)}px`;
      }

      if (nextState !== currentState) {
        currentState = nextState;
        transitionStartTimeline = timelineMs;
        transitionFrom = lastPose;
        isTransitioning = true;
      }

      const targetPose = getTargetPose(nextState, localMs);
      targetPose.knob1Rotate = alignEquivalentAngle(
        targetPose.knob1Rotate,
        lastPose.knob1Rotate,
      );

      const transitionProgress = clamp(
        (timelineMs - transitionStartTimeline) / TRANSITION_DURATION_MS,
        0,
        1,
      );
      const visiblePose = isTransitioning
        ? interpolatePose(
            transitionFrom,
            targetPose,
            easeInOut(transitionProgress),
          )
        : targetPose;

      applyPose(root, visiblePose);
      lastPose = visiblePose;
    };

    const tick = (now: number) => {
      const elapsedMs = Math.max(0, now - startTime - INITIAL_FREEZE_MS);
      const rawTimelineMs = elapsedMs * SPEED_FACTOR;

      renderAtTimeline(Math.min(rawTimelineMs, totalTimelineMs - 0.001));

      if (rawTimelineMs >= totalTimelineMs) {
        return;
      }

      frameId = requestAnimationFrame(tick);
    };

    renderAtTimeline(0);
    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative flex items-center justify-center"
      style={{
        gap: `${1.25 * (size / BASE_SIZE)}rem`,
        width: isLooped ? CASE1_END_WIDTH_PX : CASE1_START_WIDTH_PX,
        height: size,
      }}
    >
      {" "}
      <div
        className="absolute z-1 -left-34 h-[120%] bg-[var(--neutral-900)]"
        style={{ width: CASE1_END_WIDTH_PX }}
      ></div>
      <div
        className="absolute z-2 left-0"
        style={{ width: size, height: size }}
      >
        <div
          className="box absolute top-0 left-0 w-20 h-20 origin-top-left flex items-center justify-center [corner-shape:superellipse(1.5)]"
          style={{
            transform: `scale(${(size / BASE_SIZE) * 0.92}) translateY(7%)`,
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
                borderRadius: 19,
                borderColor:
                  boxOpacity > 0.5 ? "var(--neutral-900)" : "var(--active)",
              }}
            ></div>
            <div
              className="test absolute z-3 top-0 right-0 w-9.5 h-9.5 border-5"
              style={{
                borderRadius: 19,
                borderColor:
                  boxOpacity > 0.5 ? "var(--neutral-900)" : "var(--active)",
              }}
            ></div>
            <div
              className="test absolute z-3 bottom-0 right-0 w-9.5 h-9.5 border-5"
              style={{
                borderRadius: 19,
                borderColor:
                  boxOpacity > 0.5 ? "var(--neutral-900)" : "var(--active)",
              }}
            ></div>
            <div
              className="test absolute z-3 bottom-0 left-0 w-9.5 h-9.5 border-5"
              style={{
                borderRadius: 19,
                borderColor:
                  boxOpacity > 0.5 ? "var(--neutral-900)" : "var(--active)",
              }}
            ></div>

            <div className="relative z-2 w-9.5 h-9.5">
              <div
                className="shape-1 p-1.25 origin-[25%_25%]"
                style={{
                  borderRadius: 40,
                  backgroundColor:
                    boxOpacity > 0.5 ? "var(--neutral-900)" : "var(--active)",
                }}
              >
                <div
                  className="relative knob-1"
                  style={{
                    borderRadius: 14,
                    backgroundColor:
                      boxOpacity > 0.5 ? "var(--active)" : "var(--neutral-900)",
                  }}
                ></div>
              </div>
            </div>
            <div className="relative z-1 w-9.5 h-9.5">
              <div
                className="shape-2 w-full h-full p-1.25 origin-[75%_25%]"
                style={{
                  borderRadius: 19,
                  backgroundColor:
                    boxOpacity > 0.5 ? "var(--neutral-900)" : "var(--active)",
                }}
              >
                {/* <div className="knob-2 w-7 h-7 rounded-[14px] bg-(--active)"></div> */}
              </div>
            </div>
            <div className="relative z-1 w-9.5 h-9.5">
              <div
                className="shape-3 w-full h-full p-1.25 origin-[25%_75%]"
                style={{
                  borderRadius: 19,
                  backgroundColor:
                    boxOpacity > 0.5 ? "var(--neutral-900)" : "var(--active)",
                }}
              >
                {/* <div className="knob-3 w-7 h-7 rounded-[14px] bg-(--active)"></div> */}
              </div>
            </div>
            <div className="relative z-1 w-9.5 h-9.5">
              <div
                className="shape-4 w-full h-full p-1.25 origin-[75%_75%]"
                style={{
                  borderRadius: 19,
                  backgroundColor:
                    boxOpacity > 0.5 ? "var(--neutral-900)" : "var(--active)",
                }}
              >
                {/* <div className="knob-4 w-7 h-7 rounded-[14px] bg-(--active)"></div> */}
              </div>
            </div>
          </div>
        </div>
      </div>
      <svg
        className="wordmark absolute right-0 aspect-[127/40] origin-bottom-left"
        style={{ height: size }}
        viewBox="-1 -1 233 74"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        ref={wordmarkRef}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M107.559 0V60.9307L107.553 61.6621C107.541 62.3966 107.513 63.1405 107.468 63.8936L107.467 63.916L107.466 63.9375C107.436 64.9171 107.347 66.0302 107.194 67.2793L106.985 68.9961L108.712 68.9033C109.872 68.8406 111.001 68.7765 112.097 68.7139L112.134 68.7119C112.747 68.6608 113.366 68.62 113.989 68.5879V69.666H102.9C102.821 69.1833 102.754 68.7329 102.704 68.3145C102.658 67.9174 102.616 67.5279 102.578 67.1465L102.176 62.793L99.9707 65.1504C98.2971 66.9393 96.2358 68.4113 93.7666 69.5596C91.3448 70.6551 88.6413 71.2148 85.6338 71.2148C81.9459 71.2148 78.681 70.2972 75.7988 68.4814C72.9156 66.6649 70.6156 64.0739 68.9072 60.6572C67.2126 57.268 66.3379 53.2125 66.3379 48.4453L66.3496 47.5107C66.4691 42.8741 67.4847 38.7897 69.3623 35.2275L69.3643 35.2236C71.378 31.3739 74.129 28.3792 77.6221 26.207C81.0964 24.0465 85.0674 22.9531 89.5771 22.9531L90.3252 22.9648C92.0668 23.0227 93.7858 23.2829 95.4844 23.7461C97.4881 24.2926 99.0279 24.8821 100.143 25.4951L102.292 26.6768V11.0352C102.292 10.0489 102.307 9.09439 102.338 8.17285C102.368 7.27464 102.444 6.1965 102.567 4.93359L102.727 3.29883L101.085 3.34375C100.197 3.36775 99.3168 3.4097 98.4453 3.46973L97.5771 3.53516C96.9834 3.56906 96.3801 3.60091 95.7676 3.63477V2.56934C99.2386 2.51439 101.833 2.2521 103.392 1.7002C104.729 1.22646 105.877 0.670573 106.76 0H107.559ZM90.1875 23.8076C86.6924 23.8076 83.5888 24.8426 80.9424 26.9287C78.3152 28.9684 76.3573 31.8053 75.0293 35.3574L75.0254 35.3691C73.7277 38.9297 73.1804 43.0184 73.3418 47.6035C73.4713 51.6684 74.1183 55.3299 75.3076 58.5674C76.5027 61.8206 78.2269 64.4568 80.5186 66.4014L80.5273 66.4082C82.9112 68.4005 85.7999 69.374 89.1074 69.374L89.5586 69.3662C91.8126 69.2873 94.0304 68.6177 96.1982 67.4062L96.2061 67.4023L96.2129 67.3984C98.4905 66.0921 100.417 64.4563 101.978 62.4893L102.312 62.0674L102.291 61.5303C102.26 60.7563 102.229 59.9503 102.198 59.1143V56.335L102.294 27.916L101.716 27.4795C100.045 26.2178 98.2121 25.2929 96.2266 24.7109C94.2767 24.1083 92.262 23.8077 90.1875 23.8076Z"
          fill="var(--active)"
          strokeWidth="2.45"
          stroke="var(--active)"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M158.939 60.9307L158.934 61.6621C158.922 62.3961 158.893 63.1399 158.848 63.8936L158.847 63.916L158.846 63.9375C158.816 64.9171 158.727 66.0302 158.574 67.2793L158.365 68.9961L160.092 68.9033C161.277 68.8393 162.404 68.7666 163.394 68.7666C165.03 68.7666 166.84 68.7177 168.05 68.5527L168.071 68.5498L168.093 68.5459C168.628 68.4561 169.213 68.3622 169.716 68.124C170.315 67.8401 170.689 67.4173 171.013 66.9854C172.093 65.5895 172.109 64.3871 172.228 62.7236V62.7217C172.356 60.8965 172.419 58.8277 172.419 56.5186V11.0352C172.419 10.0489 172.434 9.09439 172.465 8.17285C172.487 7.5119 172.543 6.74631 172.635 5.87305L172.634 5.87207L172.927 3.29883L171.259 3.34375C170.087 3.37542 168.929 3.43767 167.786 3.53223C167.161 3.56698 166.53 3.60105 165.895 3.63574V2.56934C169.371 2.51434 171.976 2.25164 173.557 1.70312C174.92 1.23021 176.088 0.674293 176.979 0H177.829L177.921 60.9326C177.921 62.1908 177.89 63.2999 177.83 64.2627C177.772 65.1597 177.641 66.1293 177.433 67.1709L177.062 69.0195L178.945 68.9023C179.931 68.8407 180.917 68.7945 181.903 68.7637L181.946 68.7617C182.455 68.7309 182.959 68.704 183.459 68.6807V69.666H154.28C154.2 69.1829 154.134 68.7326 154.084 68.3145C153.992 67.5178 153.917 66.7531 153.855 66.0205L153.584 62.7637L151.352 65.1504C149.678 66.9393 147.616 68.4112 145.146 69.5596C142.725 70.6551 140.021 71.2148 137.014 71.2148C133.326 71.2148 130.061 70.2972 127.179 68.4814C124.295 66.6649 121.995 64.0739 120.287 60.6572C118.593 57.268 117.718 53.2125 117.718 48.4453L117.729 47.5107C117.849 42.8741 118.865 38.7897 120.742 35.2275L120.744 35.2236C122.758 31.374 125.509 28.3792 129.002 26.207C132.476 24.0465 136.447 22.9531 140.957 22.9531L141.705 22.9648C143.447 23.0226 145.167 23.2828 146.865 23.7461C148.869 24.2925 150.409 24.8821 151.523 25.4951L153.672 26.6768V11.0352C153.672 10.0489 153.687 9.09439 153.718 8.17285C153.748 7.27464 153.824 6.1965 153.947 4.93359L154.106 3.29883L152.465 3.34375C151.577 3.36775 150.697 3.4097 149.825 3.46973L148.957 3.53516C148.363 3.56906 147.76 3.60091 147.147 3.63477V2.56934C150.619 2.51439 153.213 2.2521 154.771 1.7002C156.109 1.22645 157.257 0.670573 158.14 0H158.939V60.9307ZM141.567 23.8076C138.072 23.8076 134.969 24.8426 132.322 26.9287C129.695 28.9684 127.737 31.8053 126.409 35.3574L126.405 35.3691C125.107 38.9299 124.561 43.0187 124.723 47.6035C124.852 51.6681 125.498 55.3297 126.688 58.5674C127.883 61.8206 129.607 64.4568 131.898 66.4014L131.907 66.4082C134.291 68.4005 137.18 69.374 140.487 69.374L140.938 69.3662C143.193 69.2873 145.41 68.6177 147.578 67.4062L147.586 67.4023L147.593 67.3984C149.87 66.0921 151.797 64.4563 153.357 62.4893L153.692 62.0674L153.671 61.5303C153.64 60.7563 153.609 59.9503 153.578 59.1143V56.335L153.674 27.916L153.096 27.4795C151.425 26.2178 149.592 25.2929 147.606 24.7109C145.657 24.1083 143.642 23.8076 141.567 23.8076Z"
          fill="var(--active)"
          strokeWidth="2.45"
          stroke="var(--active)"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M213.217 22.9619C216.316 23.0477 219.128 23.7751 221.675 25.1299L221.683 25.1338L221.69 25.1387C224.388 26.53 226.55 28.6621 228.175 31.5928L228.18 31.6006L228.184 31.6074C229.637 34.1575 230.476 37.3819 230.638 41.3389L196.832 41.9033L196.826 43.3232C196.794 50.8221 198.035 57.007 200.668 61.7725L200.674 61.7832C203.465 66.738 208.052 69.1865 214.142 69.1865C217.365 69.1865 220.616 68.3705 223.88 66.7881L223.885 66.7852C226.627 65.4413 228.878 63.7938 230.593 61.8242L230.731 61.9404C229.241 63.9613 227.528 65.6118 225.592 66.9033C223.298 68.4227 220.946 69.5127 218.537 70.1885L218.532 70.1904C216.101 70.8806 213.874 71.2148 211.842 71.2148C207.927 71.2148 204.398 70.3591 201.228 68.6631L200.599 68.3125C197.308 66.358 194.691 63.6014 192.746 60.0059C190.816 56.438 189.822 52.1782 189.822 47.1777L189.833 46.3789C189.944 42.4031 190.89 38.7053 192.663 35.2676C194.585 31.5713 197.251 28.5971 200.674 26.3252L200.673 26.3242C204.073 24.0878 208.03 22.9531 212.593 22.9531L213.217 22.9619ZM212.687 23.8076C208.628 23.8076 205.167 25.0168 202.424 27.5107L202.166 27.75C199.529 30.2622 197.908 34.117 197.125 39.0654L196.86 40.7422H224.51V39.292C224.51 37.0118 224.188 34.7978 223.541 32.6553L223.407 32.2275C222.648 29.8502 221.404 27.8556 219.662 26.291C217.839 24.594 215.462 23.8076 212.687 23.8076Z"
          fill="var(--active)"
          strokeWidth="2.45"
          stroke="var(--active)"
        />
        <path
          d="M41.7305 5.25684L42.1191 19.207H41.8857C41.7453 15.9636 41.1116 13.2836 39.8613 11.2959C38.5126 9.07093 36.6445 7.52716 34.2715 6.75391C32.0843 6.00212 29.7011 5.67085 27.1426 5.7373L20.1025 5.9248C17.5886 5.99109 15.421 6.58464 14.1094 8.12207L14.1074 8.125C12.9798 9.45398 12.4053 11.1696 12.2646 13.1377C12.1365 14.932 12.0732 16.9548 12.0732 19.2021V37.166L31.8027 37.2773L31.1445 28.9141H32.3496V46.291H32.1631C32.0481 44.0473 31.6433 42.1852 30.8057 40.8701C29.7617 39.1999 28.117 38.253 26.0811 37.9512C24.2616 37.6816 21.9669 37.6227 19.2295 37.75H19.2266L12.0732 38.0986V59.6631C12.0732 61.3672 12.0416 62.8451 11.9805 64.0986L11.9795 64.1152V64.1328C11.9488 65.3611 11.8878 66.3466 11.8008 67.1006L11.6074 68.7793L13.2959 68.7158C14.9545 68.6532 16.5979 68.5909 18.2256 68.5283L18.2393 68.5273L18.2539 68.5264C19.3696 68.462 20.4856 68.4134 21.6016 68.3789V69.666H0V69.2607C1.91045 69.0234 3.5291 68.4249 4.56934 67.2363L4.56836 67.2354C5.73883 65.9023 6.3208 64.189 6.42773 62.2285C6.55471 60.4399 6.61816 58.4101 6.61816 56.1426V14.6025C6.61817 13.3137 6.63286 12.1032 6.66309 10.9707C6.72479 9.79831 6.80118 8.74047 6.89258 7.7959L7.05078 6.16211L5.41016 6.20703C4.22668 6.23902 3.04299 6.30247 1.85938 6.39844H1.85645C1.24278 6.44958 0.623653 6.49445 0 6.53613V5.25684H41.7305Z"
          fill="var(--active)"
          strokeWidth="2.45"
          stroke="var(--active)"
        />
        <path
          d="M56.9658 23.5625V60.9307L56.9541 62.7295C56.9464 63.2922 56.9352 63.8188 56.9199 64.3096C56.8911 65.204 56.7895 66.1707 56.6113 67.21L56.3008 69.0166L58.1309 68.9023C59.1166 68.8407 60.1028 68.7945 61.0889 68.7637L61.1318 68.7617C61.6405 68.7309 62.1451 68.704 62.6455 68.6807V69.666H45.9258V69.6123C46.9759 69.4743 47.928 69.1702 48.7314 68.6445C49.9389 67.8544 50.6572 66.667 50.9238 65.2314L50.9229 65.2305C51.384 62.9137 51.6045 59.9999 51.6045 56.5186V34.5986C51.6045 33.6285 51.6359 32.6905 51.6963 31.7852C51.727 31.3252 51.7652 30.8206 51.8115 30.2725L51.8105 30.2715L52.123 26.8623L50.4912 26.9062C49.6031 26.9303 48.7231 26.9722 47.8516 27.0322L46.9834 27.0977C46.3896 27.1316 45.7867 27.1641 45.1748 27.1982V26.1318C48.645 26.077 51.2395 25.8155 52.7979 25.2637C54.1361 24.7897 55.2839 24.2331 56.166 23.5625H56.9658Z"
          fill="var(--active)"
          strokeWidth="2.45"
          stroke="var(--active)"
        />
        <path
          d="M53.8154 2.58203C54.8593 2.58203 55.6812 2.95738 56.3789 3.76758L56.3857 3.77637L56.3936 3.78418C57.1441 4.62862 57.5292 5.64117 57.5293 6.9043C57.5293 8.06411 57.1798 8.99659 56.4863 9.77734L56.3428 9.93066C55.5192 10.7784 54.6621 11.1338 53.7217 11.1338C52.8248 11.1337 52.0032 10.7887 51.209 9.94629C50.4468 9.13764 50.0557 8.15468 50.0557 6.9043C50.0558 5.66737 50.4545 4.66612 51.2559 3.81738C52.0911 2.93305 52.9307 2.58215 53.8154 2.58203Z"
          fill="var(--active)"
          strokeWidth="2.45"
          stroke="var(--active)"
        />
      </svg>
    </div>
  );
}
