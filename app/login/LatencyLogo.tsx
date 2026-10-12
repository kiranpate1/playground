"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

const STATE_DURATION_MS = 1050;
const SPEED_FACTOR = 1;
const TRANSITION_DURATION_MS = 280;
const SHAPE_SIZE = 38;
const KNOB_SIZE = 28;
const BASE_SIZE = 80;
const COLORS = ["#FF9748", "#FFC61A", "#B5F349", "#35C6FF", "#D15CFF"];

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
      return { x: mix(0, 42, segmentProgress), y: 0 };
    case 1:
      return { x: 42, y: mix(0, 42, segmentProgress) };
    case 2:
      return { x: mix(42, 0, segmentProgress), y: 42 };
    default:
      return { x: 0, y: mix(42, 0, segmentProgress) };
  }
}

function getTargetPose(
  state: number,
  localMs: number,
  holdKnobRight = false,
): Pose {
  switch (state) {
    case 1: {
      // At exactly the half-way point the knob is at its rightmost, about to move left.
      const knob = getKnob1State1(
        holdKnobRight ? Math.max(localMs, 550 * SPEED_FACTOR) : localMs,
      );

      return {
        ...INITIAL_POSE,
        shape1Width: 80,
        shape2Scale: 0,
        shape4Scale: 0,
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
        knob1Rotate: -270 * (localMs / STATE_DURATION_MS / SPEED_FACTOR),
      };
    case 4: {
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
    }
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

const REST_POSE = getTargetPose(1, 0, true);

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

type LatencyLogoProps = {
  size?: number;
  isAnimating: boolean;
  onActiveColorChange?: (color: string) => void;
};

export default function LatencyLogo({
  size = BASE_SIZE,
  isAnimating,
  onActiveColorChange,
}: LatencyLogoProps) {
  const boxOpacity = 0;
  const rootRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isAnimatingRef = useRef(isAnimating);
  const onActiveColorChangeRef = useRef(onActiveColorChange);
  const wakeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onActiveColorChangeRef.current = onActiveColorChange;
  }, [onActiveColorChange]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const wrapper = wrapperRef.current;

    if (!root || !wrapper) {
      return;
    }

    let frameId = 0;
    const startTime = performance.now();
    let lastNow = startTime;
    // Only advances while animating, so resuming continues where it paused.
    let virtualElapsedMs = 0;
    let wasAnimating = isAnimatingRef.current;
    // Set after a pause so the first state doesn't snap the knob back from the right.
    let holdKnobRight = !wasAnimating;
    let currentState = 1;
    let transitionFromState = 1;
    let transitionToState = 1;
    let transitionStartTime = startTime;
    let lastPose = wasAnimating ? INITIAL_POSE : REST_POSE;
    let transitionFrom = lastPose;

    // Scoped to the logo so it doesn't leak to the rest of the page.
    wrapper.style.setProperty("--active", COLORS[0]);
    let activeColor = COLORS[0];
    onActiveColorChangeRef.current?.(activeColor);

    const tick = (now: number) => {
      const animating = isAnimatingRef.current;

      if (animating) {
        virtualElapsedMs += now - lastNow;
      }

      lastNow = now;

      if (animating !== wasAnimating) {
        wasAnimating = animating;

        if (!animating) {
          virtualElapsedMs = 0;
          currentState = 1;
          holdKnobRight = true;
        }

        transitionFromState = currentState;
        transitionToState = currentState;
        transitionStartTime = now;
        transitionFrom = lastPose;
      }

      const nextState =
        (Math.floor(virtualElapsedMs / STATE_DURATION_MS) % 5) + 1;
      const localMs = virtualElapsedMs % STATE_DURATION_MS;

      if (nextState !== currentState) {
        holdKnobRight = false;
        transitionFromState = currentState;
        transitionToState = nextState;
        currentState = nextState;
        transitionStartTime = now;
        transitionFrom = lastPose;
      }

      const nextColor =
        COLORS[((animating ? nextState : 1) - 1) % COLORS.length];
      if (nextColor !== activeColor) {
        activeColor = nextColor;
        wrapper.style.setProperty("--active", activeColor);
        onActiveColorChangeRef.current?.(activeColor);
      }

      const targetPose = animating
        ? getTargetPose(nextState, localMs, holdKnobRight)
        : { ...REST_POSE };
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

      if (!animating && transitionProgress >= 1) {
        frameId = 0;
        return;
      }

      frameId = requestAnimationFrame(tick);
    };

    wakeRef.current = () => {
      if (frameId === 0) {
        lastNow = performance.now();
        frameId = requestAnimationFrame(tick);
      }
    };

    applyPose(root, lastPose);
    frameId = requestAnimationFrame(tick);

    return () => {
      wakeRef.current = null;
      cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    isAnimatingRef.current = isAnimating;
    wakeRef.current?.();
  }, [isAnimating]);

  return (
    <div
      ref={wrapperRef}
      className="flex items-center justify-center"
      style={{ gap: `${1.25 * (size / BASE_SIZE)}rem` }}
    >
      <div className="relative shrink-0" style={{ width: size, height: size }}>
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
        className="aspect-[127/40]"
        style={{ height: size }}
        viewBox="0 0 127 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M59.6147 33.667C59.6147 34.2073 59.5979 34.7562 59.5641 35.3135C59.5472 35.8708 59.4968 36.4958 59.4123 37.1882C60.0372 37.1544 60.6454 37.1202 61.2365 37.0865C61.8443 37.0358 62.4606 37.0022 63.0854 36.9853V39.1641H55.6629C55.5616 38.6406 55.4859 38.1675 55.4352 37.7453C55.4099 37.5258 55.3867 37.3106 55.3656 37.0996L55.3082 36.4788C54.3287 37.5258 53.1296 38.3785 51.7111 39.0371C50.2925 39.6788 48.7218 40 46.9992 40C44.8714 40 42.9632 39.468 41.2744 38.4041C39.5856 37.3401 38.2515 35.8284 37.272 33.8693C36.2925 31.9104 35.8026 29.5969 35.8026 26.9286C35.8026 24.1084 36.3766 21.6088 37.525 19.4303C38.6734 17.2348 40.2524 15.5117 42.2621 14.262C44.2718 13.0123 46.5604 12.3878 49.1275 12.3878C50.2758 12.3878 51.4071 12.5398 52.5217 12.8437C53.6362 13.1477 54.5315 13.4852 55.207 13.8567V6.73835C55.207 6.19795 55.2154 5.67436 55.2323 5.16773C55.2492 4.66115 55.2918 4.06174 55.3593 3.36944C54.7345 3.38632 54.1179 3.41997 53.5099 3.47063C52.9188 3.50441 52.3106 3.53805 51.6858 3.57182V1.39352C53.9657 1.39352 55.5111 1.2495 56.3217 0.962395C57.1323 0.675299 57.7321 0.354649 58.1205 0H59.6147V33.667ZM49.4569 14.4143C47.7343 14.4143 46.2309 14.921 44.9474 15.9343C43.664 16.9307 42.6846 18.3323 42.0091 20.1391C41.3505 21.9461 41.063 24.0488 41.1474 26.4469C41.2149 28.5748 41.5529 30.4666 42.1609 32.1216C42.7689 33.7767 43.6304 35.0771 44.745 36.0229C45.8765 36.9685 47.2528 37.4412 48.874 37.4412C50.0224 37.4412 51.1709 37.1205 52.3193 36.4788C53.4676 35.8202 54.4302 35.0011 55.207 34.0217C55.1901 33.5995 55.1733 33.16 55.1564 32.704V31.184L55.207 16.2379C54.3795 15.6131 53.4758 15.1573 52.4964 14.8702C51.517 14.5663 50.5038 14.4143 49.4569 14.4143Z"
          fill="var(--active)"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M87.345 33.667C87.345 34.2073 87.3276 34.7562 87.2939 35.3135C87.277 35.8708 87.2265 36.4958 87.1421 37.1882C87.7669 37.1544 88.4049 37.1132 88.9662 37.1132C89.8483 37.1132 90.7783 37.0865 91.3732 37.0053C92.0145 36.8978 92.1584 36.8579 92.4526 36.4656C92.8748 35.9252 92.8858 35.5245 92.9533 34.5788C93.0209 33.6162 93.0545 32.5185 93.0545 31.2857V6.73835C93.0545 6.19795 93.0629 5.67436 93.0798 5.16773C93.0925 4.78778 93.1246 4.35562 93.1752 3.87119L93.2321 3.36944C92.6073 3.38632 91.9907 3.41996 91.3827 3.47063C90.7747 3.5044 90.1582 3.53805 89.5333 3.57182V1.39352C91.8132 1.39352 93.367 1.24949 94.1945 0.962395C95.0221 0.675295 95.6302 0.354656 96.0186 0H97.5387L97.5893 33.667C97.5893 34.3592 97.5724 34.9755 97.5387 35.5159C97.5049 36.0394 97.4287 36.5971 97.3105 37.1882C97.8508 37.1544 98.3913 37.1292 98.9317 37.1123C99.4889 37.0785 100.038 37.0528 100.578 37.0359V39.1641H83.3931C83.2918 38.6406 83.2156 38.1675 83.1649 37.7453C83.1143 37.3062 83.0722 36.8841 83.0384 36.4788C82.0589 37.5258 80.8594 38.3784 79.4408 39.0371C78.0222 39.6788 76.4515 40 74.729 40C72.6012 40 70.6929 39.468 69.0041 38.4041C67.3153 37.3401 65.9812 35.8284 65.0017 33.8693C64.0222 31.9104 63.5323 29.5969 63.5323 26.9286C63.5323 24.1084 64.1064 21.6088 65.2547 19.4303C66.4031 17.2348 67.9821 15.5117 69.9918 14.262C72.0015 13.0123 74.2902 12.3878 76.8572 12.3878C78.0056 12.3878 79.1373 12.5397 80.2519 12.8437C81.3663 13.1476 82.2613 13.4852 82.9367 13.8567V6.73835C82.9367 6.19795 82.9451 5.67436 82.962 5.16773C82.9789 4.66115 83.0215 4.06174 83.089 3.36944C82.4642 3.38632 81.8476 3.41996 81.2396 3.47063C80.6485 3.5044 80.0404 3.53805 79.4155 3.57182V1.39352C81.6954 1.39352 83.2408 1.2495 84.0514 0.962395C84.8621 0.675295 85.4618 0.354656 85.8503 0H87.345V33.667ZM77.1866 14.4143C75.464 14.4143 73.9607 14.921 72.6772 15.9343C71.3938 16.9307 70.4143 18.3323 69.7388 20.1391C69.0802 21.9461 68.7932 24.0488 68.8776 26.4469C68.9452 28.5748 69.2827 30.4666 69.8906 32.1216C70.4986 33.7767 71.3601 35.0771 72.4748 36.0229C73.6062 36.9685 74.9825 37.4411 76.6037 37.4412C77.7521 37.4412 78.9006 37.1205 80.049 36.4788C81.1973 35.8202 82.1599 35.0011 82.9367 34.0217C82.9198 33.5995 82.903 33.16 82.8861 32.704V31.184L82.9367 16.2379C82.1093 15.6131 81.2055 15.1573 80.2261 14.8702C79.2467 14.5663 78.2335 14.4143 77.1866 14.4143Z"
          fill="var(--active)"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M115.519 12.3878C117.444 12.3878 119.2 12.8099 120.788 13.6543C122.392 14.4818 123.668 15.7482 124.613 17.4538C125.576 19.1426 126.057 21.2794 126.057 23.8633L107.792 24.1674C107.776 28.136 108.434 31.3279 109.768 33.7429C111.119 36.141 113.315 37.34 116.355 37.34C117.959 37.34 119.597 36.9346 121.269 36.1241C122.958 35.2965 124.242 34.2663 125.12 33.0334L126.361 34.0723C125.415 35.5077 124.284 36.6647 122.967 37.5429C121.666 38.4042 120.323 39.0286 118.939 39.4171C117.571 39.8055 116.296 40 115.114 40C112.732 40 110.579 39.4428 108.654 38.3282C106.745 37.1967 105.234 35.6003 104.119 33.5399C103.005 31.4796 102.447 29.0479 102.447 26.2445C102.447 23.8126 102.988 21.5497 104.069 19.4556C105.167 17.3446 106.695 15.6388 108.654 14.3384C110.63 13.038 112.918 12.3878 115.519 12.3878ZM115.57 14.4143C113.543 14.4143 111.871 15.0136 110.554 16.2126C109.236 17.3948 108.366 19.3202 107.944 21.9886H121.168C121.168 20.7558 120.982 19.5651 120.611 18.4167C120.239 17.2515 119.64 16.2974 118.812 15.5543C118.001 14.7944 116.921 14.4143 115.57 14.4143Z"
          fill="var(--active)"
        />
        <path
          d="M24.0657 2.83711L24.3192 11.9314H22.6221C22.6221 9.88808 22.2924 8.343 21.6339 7.29597C20.9921 6.232 20.1222 5.52239 19.0244 5.16773C17.9436 4.79625 16.7529 4.62747 15.4526 4.66124L11.6531 4.76243C10.3697 4.79621 9.48286 5.10013 8.99307 5.67423C8.52022 6.23152 8.25003 6.98326 8.18246 7.92895C8.11491 8.87464 8.08127 9.94709 8.08127 11.1461V20.0632L17.0996 20.1138L16.7449 15.6049H19.0244V26.5486H17.3779C17.3779 25.0118 17.1671 23.9137 16.7449 23.2551C16.3228 22.5796 15.6556 22.1743 14.7437 22.0392C13.8318 21.9041 12.6495 21.8704 11.1972 21.938L8.08127 22.0898V32.9828C8.08127 33.9117 8.06392 34.7223 8.03014 35.4147C8.01326 36.0901 7.9796 36.6474 7.92895 37.0865C8.82403 37.0527 9.71079 37.019 10.589 36.9853C11.4672 36.9346 12.3455 36.901 13.2237 36.8841V39.1641H0V37.4412C1.3004 37.3905 2.18715 37.0951 2.66002 36.5547C3.14973 35.9974 3.41996 35.254 3.47063 34.3252C3.53817 33.3796 3.57182 32.2987 3.57182 31.0828V8.66366C3.57182 7.95437 3.58023 7.2873 3.59712 6.66245C3.63089 6.02081 3.67296 5.43822 3.72361 4.91475C3.09888 4.93164 2.47415 4.96529 1.84942 5.01594C1.24144 5.06661 0.624866 5.10866 0 5.14244V2.83711H24.0657Z"
          fill="var(--active)"
        />
        <path
          d="M32.3098 12.7167V33.667C32.3098 34.3592 32.3014 34.9755 32.2845 35.5159C32.2676 36.0394 32.2082 36.5971 32.1069 37.1882C32.6472 37.1544 33.1877 37.1292 33.7281 37.1123C34.2854 37.0785 34.8347 37.0528 35.3751 37.0359V39.1641H24.7861V37.6188C26.3735 37.6187 27.2772 37.0274 27.4968 35.8453C27.7332 34.6631 27.8509 33.1433 27.8509 31.2857V19.4556C27.8509 18.9152 27.8683 18.3915 27.9021 17.8849C27.919 17.6316 27.94 17.3547 27.9653 17.0548L28.0539 16.0861C27.429 16.103 26.8124 16.1366 26.2044 16.1873C25.6134 16.2211 25.0056 16.2553 24.3808 16.289V14.1102C26.6604 14.1102 28.2056 13.9666 29.0163 13.6796C29.8269 13.3925 30.4266 13.0713 30.8151 12.7167H32.3098Z"
          fill="var(--active)"
        />
        <path
          d="M29.8269 1.39352C30.6206 1.39352 31.2798 1.69734 31.8033 2.30532C32.3436 2.91321 32.6139 3.6478 32.6139 4.50892C32.6139 5.37022 32.3264 6.09666 31.7522 6.68775C31.178 7.27878 30.5193 7.57425 29.7763 7.57425C29.0501 7.5742 28.4082 7.27879 27.8509 6.68775C27.2937 6.09668 27.015 5.37016 27.015 4.50892C27.0151 3.64773 27.3026 2.91324 27.8768 2.30532C28.4509 1.69748 29.1008 1.39359 29.8269 1.39352Z"
          fill="var(--active)"
        />
      </svg>
    </div>
  );
}
