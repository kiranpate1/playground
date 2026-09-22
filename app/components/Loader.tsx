"use client";

import { useEffect, useRef } from "react";

const STATE_DURATION_MS = 1_050;
const TRANSITION_DURATION_MS = 280;
type LoadingState = 1 | 2 | 3 | 4 | 5;
type LoaderState = LoadingState | "completion";

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
  shape1Width: 38,
  shape1Height: 38,
  shape1X: 0,
  shape1Y: 0,
  shape2Scale: 1,
  shape3Scale: 1,
  shape4Scale: 1,
  knob1Width: 28,
  knob1Height: 28,
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

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const mix = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;
const easeIn = (progress: number) => progress * progress;
const easeOut = (progress: number) => 1 - (1 - progress) * (1 - progress);
const easeInOut = (progress: number) =>
  progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;

function alternatingProgress(elapsedMs: number, durationMs: number) {
  const progress = (elapsedMs % durationMs) / durationMs;
  return Math.floor(elapsedMs / durationMs) % 2 === 0 ? progress : 1 - progress;
}

function getTargetPose(state: LoaderState, localMs: number): Pose {
  const horizontal = alternatingProgress(localMs, 550);
  const vertical = alternatingProgress(localMs, 450);
  const horizontalKnob =
    horizontal <= 0.5
      ? {
          width: mix(28, 36, easeIn(horizontal / 0.5)),
          x: mix(0, 32, easeIn(horizontal / 0.5)),
        }
      : {
          width: mix(36, 28, easeOut((horizontal - 0.5) / 0.5)),
          x: mix(32, 42, easeOut((horizontal - 0.5) / 0.5)),
        };
  const verticalKnob =
    vertical <= 0.5
      ? {
          height: mix(28, 56, easeIn(vertical / 0.5)),
          y: mix(0, 11, easeIn(vertical / 0.5)),
        }
      : {
          height: mix(56, 28, easeOut((vertical - 0.5) / 0.5)),
          y: mix(11, 42, easeOut((vertical - 0.5) / 0.5)),
        };

  if (state === 1)
    return {
      ...INITIAL_POSE,
      shape1Width: 80,
      shape2Scale: 0,
      shape3Scale: 0,
      knob1Width: horizontalKnob.width,
      knob1X: horizontalKnob.x,
      knob4Opacity: 0,
    };
  if (state === 2)
    return {
      ...INITIAL_POSE,
      shape1Height: 80,
      shape1X: 21,
      shape2Scale: 0,
      shape3Scale: 0,
      shape4Scale: 0,
      knob1Height: verticalKnob.height,
      knob1Y: verticalKnob.y,
    };
  if (state === 3)
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
      knob1Rotate: (-270 * localMs) / STATE_DURATION_MS,
    };
  if (state === 4)
    return {
      ...INITIAL_POSE,
      parentRotate: -90,
      shape1Width: 80,
      shape2Scale: 0,
      shape3Scale: 0,
      knob1Width: horizontalKnob.width,
      knob1X: horizontalKnob.x,
      knob4Opacity: 0,
    };
  if (state === "completion")
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
    };

  const segment = Math.floor((localMs % 1_000) / 250);
  const progress = (localMs % 250) / 250;
  const [knob1X, knob1Y] =
    segment === 0
      ? [mix(0, 42, progress), 0]
      : segment === 1
        ? [42, mix(0, 42, progress)]
        : segment === 2
          ? [mix(42, 0, progress), 42]
          : [0, mix(42, 0, progress)];
  return { ...INITIAL_POSE, parentRotate: 90, knob1X, knob1Y, testOpacity: 1 };
}

function applyPose(element: HTMLDivElement, pose: Pose) {
  POSE_VARIABLES.forEach(([key, variable]) =>
    element.style.setProperty(variable, String(pose[key])),
  );
}

type LoaderProps = {
  bgColor: string;
  buttonColor: string;
  completionMode: boolean;
  invertIcon: boolean;
  isCompleted: boolean;
  run: number;
  stateColors: string[];
};

export default function Loader({
  bgColor,
  buttonColor,
  completionMode,
  invertIcon,
  isCompleted,
  run,
  stateColors,
}: LoaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastPoseRef = useRef(INITIAL_POSE);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frameId = 0;
    const startTime = performance.now();
    let state: LoadingState = 1;
    let transitionStart = startTime;
    let previousPose = INITIAL_POSE;
    let lastPose = INITIAL_POSE;
    applyPose(root, INITIAL_POSE);
    lastPoseRef.current = INITIAL_POSE;

    const tick = (now: number) => {
      const elapsedMs = now - startTime;
      const nextState = ((Math.floor(elapsedMs / STATE_DURATION_MS) % 5) +
        1) as LoadingState;
      if (nextState !== state) {
        state = nextState;
        transitionStart = now;
        previousPose = lastPose;
      }
      const targetPose = getTargetPose(
        nextState,
        elapsedMs % STATE_DURATION_MS,
      );
      targetPose.knob1Rotate +=
        Math.round((lastPose.knob1Rotate - targetPose.knob1Rotate) / 360) * 360;
      const progress = easeInOut(
        clamp((now - transitionStart) / TRANSITION_DURATION_MS, 0, 1),
      );
      const pose = Object.fromEntries(
        Object.keys(INITIAL_POSE).map((key) => [
          key,
          mix(
            previousPose[key as keyof Pose],
            targetPose[key as keyof Pose],
            progress,
          ),
        ]),
      ) as Pose;
      applyPose(root, pose);
      lastPose = pose;
      lastPoseRef.current = pose;
      frameId = requestAnimationFrame(tick);
      animationFrameRef.current = frameId;
    };

    frameId = requestAnimationFrame(tick);
    animationFrameRef.current = frameId;
    return () => cancelAnimationFrame(frameId);
  }, [run]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !isCompleted) {
      return;
    }

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const startPose = lastPoseRef.current;
    const completionPose = getTargetPose("completion", 0);
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = clamp((now - startTime) / TRANSITION_DURATION_MS, 0, 1);
      const pose = Object.fromEntries(
        Object.keys(INITIAL_POSE).map((key) => [
          key,
          mix(
            startPose[key as keyof Pose],
            completionPose[key as keyof Pose],
            easeInOut(progress),
          ),
        ]),
      ) as Pose;

      applyPose(root, pose);
      lastPoseRef.current = pose;

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      animationFrameRef.current = null;
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCompleted]);

  return (
    <div
      className="min-w-26.5 min-h-26.5 flex items-center justify-center [corner-shape:superellipse(1.5)] overflow-hidden duration-200"
      style={{
        borderRadius: 40,
        backgroundColor: invertIcon
          ? isCompleted
            ? completionMode
              ? stateColors[0]
              : stateColors[1]
            : "white"
          : "transparent",
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
            borderColor: invertIcon
              ? bgColor
              : isCompleted
                ? completionMode
                  ? stateColors[0]
                  : stateColors[1]
                : "white",
          }}
        ></div>
        <div
          className="test absolute z-3 top-0 right-0 w-9.5 h-9.5 border-5"
          style={{
            borderRadius: 19,
            borderColor: invertIcon
              ? bgColor
              : isCompleted
                ? completionMode
                  ? stateColors[0]
                  : stateColors[1]
                : "white",
          }}
        ></div>
        <div
          className="test absolute z-3 bottom-0 right-0 w-9.5 h-9.5 border-5"
          style={{
            borderRadius: 19,
            borderColor: invertIcon
              ? bgColor
              : isCompleted
                ? completionMode
                  ? stateColors[0]
                  : stateColors[1]
                : "white",
          }}
        ></div>
        <div
          className="test absolute z-3 bottom-0 left-0 w-9.5 h-9.5 border-5"
          style={{
            borderRadius: 19,
            borderColor: invertIcon
              ? bgColor
              : isCompleted
                ? completionMode
                  ? stateColors[0]
                  : stateColors[1]
                : "white",
          }}
        ></div>
        <div className="relative z-2 w-9.5 h-9.5">
          <div
            className="shape-1 p-1.25 origin-[25%_25%]"
            style={{
              borderRadius: 40,
              backgroundColor: invertIcon
                ? bgColor
                : isCompleted
                  ? completionMode
                    ? stateColors[0]
                    : stateColors[1]
                  : "white",
            }}
          >
            <div
              className="relative knob-1"
              style={{
                borderRadius: 14,
                backgroundColor: invertIcon
                  ? isCompleted
                    ? completionMode
                      ? stateColors[0]
                      : stateColors[1]
                    : "white"
                  : buttonColor,
                opacity: isCompleted ? 0 : 1,
                transition: `opacity 20ms`,
              }}
            ></div>
          </div>
        </div>
        <div className="relative z-1 w-9.5 h-9.5">
          <div
            className="shape-2 w-full h-full p-1.25 origin-[75%_25%]"
            style={{
              borderRadius: 19,
              backgroundColor: invertIcon
                ? bgColor
                : isCompleted
                  ? completionMode
                    ? stateColors[0]
                    : stateColors[1]
                  : "white",
            }}
          ></div>
        </div>
        <div className="relative z-1 w-9.5 h-9.5">
          <div
            className="shape-3 w-full h-full p-1.25 origin-[25%_75%]"
            style={{
              borderRadius: 19,
              backgroundColor: invertIcon
                ? bgColor
                : isCompleted
                  ? completionMode
                    ? stateColors[0]
                    : stateColors[1]
                  : "white",
            }}
          ></div>
        </div>
        <div className="relative z-1 w-9.5 h-9.5">
          <div
            className="shape-4 w-full h-full p-1.25 origin-[75%_75%]"
            style={{
              borderRadius: 19,
              backgroundColor: invertIcon
                ? bgColor
                : isCompleted
                  ? completionMode
                    ? stateColors[0]
                    : stateColors[1]
                  : "white",
            }}
          ></div>
        </div>
      </div>

      <svg
        className="absolute z-2 top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2"
        style={{
          opacity: isCompleted ? 1 : 0,
        }}
        width="56"
        height="56"
        viewBox="0 0 10 10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1.97998 5.02L4.22 7L7.96998 3"
          stroke={invertIcon ? bgColor : buttonColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            opacity: completionMode ? 1 : 0,
            strokeDasharray: "10",
            strokeDashoffset: isCompleted ? "0" : "10",
            transition: `stroke-dashoffset 500ms 150ms`,
          }}
        />

        <path
          d="M5 8V7.99M5 5.02V2"
          stroke={invertIcon ? bgColor : buttonColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            opacity: completionMode ? 0 : 1,
            strokeDasharray: "10",
            strokeDashoffset: isCompleted ? "0" : "10",
            transition: `stroke-dashoffset 500ms 150ms`,
          }}
        />
      </svg>
    </div>
  );
}
