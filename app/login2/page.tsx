"use client";

import {
  act,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import LoadInLogo from "./LoadInLogo";
import HoverGlow from "./HoverGlow";

const INITIAL_FADE_DELAY_MS = 300;

export default function LoginPage() {
  const [isActive, setIsActive] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isResent, setIsResent] = useState(false);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastText, setToastText] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);
  const spinnerPathRef = useRef<SVGPathElement>(null);
  const spinnerAngleRef = useRef(0);
  const blurElmsRef = useRef<HTMLElement[]>([]);

  // Stable callback ref: collects each element once, in render order.
  const addBlurElm = useCallback((element: HTMLElement | null) => {
    if (element && !blurElmsRef.current.includes(element)) {
      blurElmsRef.current.push(element);
    }
  }, []);
  const [email, setEmail] = useState("");
  const [whichHovered, setWhichHovered] = useState("");
  const [lastHovered, setLastHovered] = useState<"twitter" | "slack">("slack");
  const isIndicatorLoaded = isLoaded && !isResent;
  const [activeColor, setActiveColor] = useState("#FF9748");

  function handleSend() {
    const input = emailInputRef.current;
    if (!input?.reportValidity()) {
      return;
    }

    setEmail(input.value);
    setIsSent(true);
  }

  function handleResend() {
    setIsResent(true);
  }

  useEffect(() => {
    if (!isSent || (isLoaded && !isResent)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (email === "error@mail.com") {
        const input = emailInputRef.current;
        if (input) {
          input.style.borderColor = "#e04826";
          setTimeout(() => {
            input.style.borderColor = "";
          }, 2010);
        }
        setToastText("Error, please try again.");
        setIsSent(false);
      } else {
        setIsLoaded(true);
        setIsResent(false);
        setToastText("Email sent!");
      }
      setIsToastVisible(true);
    }, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [isLoaded, isResent, isSent]);

  useEffect(() => {
    if (!toastText || !isToastVisible) {
      return;
    }

    const timeoutId = window.setTimeout(() => setIsToastVisible(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [toastText, isToastVisible]);

  const logoReflectionRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    // The empty keyframe resolves to each element's current inline/CSS values.
    const animations = blurElmsRef.current.map((element, index) =>
      element.animate([{ opacity: 0 }, {}], {
        duration: 600,
        delay: INITIAL_FADE_DELAY_MS + index * 80,
        easing: "cubic-bezier(0.8, 0, 0.2, 1)",
        fill: "backwards",
      }),
    );

    const logoReflectionExpand = logoReflectionRef.current?.animate(
      [{ width: "5%" }, { width: "70%" }],
      {
        duration: 1000,
        easing: "cubic-bezier(0, 0.5, 1, 0.5)",
        fill: "forwards",
      },
    );

    const timeoutId = window.setTimeout(() => {
      (animations.forEach((animation) => animation.cancel()),
        logoReflectionExpand);
    }, 2000);
    return () => {
      window.clearTimeout(timeoutId);
      animations.forEach((animation) => animation.cancel());
    };
  }, []);

  useLayoutEffect(() => {
    const spinnerPath = spinnerPathRef.current;
    if (!spinnerPath || !isSent) {
      return;
    }

    const startAngle = spinnerAngleRef.current;

    if (!isLoaded || isResent) {
      const animation = spinnerPath.animate(
        [
          { transform: `rotate(${startAngle}deg)` },
          { transform: `rotate(${startAngle + 360}deg)` },
        ],
        { duration: 1000, iterations: Infinity, easing: "linear" },
      );
      const dashAnimation =
        isLoaded && isResent
          ? spinnerPath.animate(
              [{ strokeDasharray: "38 12" }, { strokeDasharray: "5 45" }],
              { duration: 800, easing: "cubic-bezier(.36,.53,.73,1)" },
            )
          : undefined;

      return () => {
        const elapsedMs = Number(animation.currentTime ?? 0);
        spinnerAngleRef.current =
          startAngle + ((elapsedMs % 1000) / 1000) * 360;
        animation.cancel();
        dashAnimation?.cancel();
      };
    }

    const remainingDegrees = (135 - (startAngle % 360) + 360) % 360;
    const animation = spinnerPath.animate(
      [
        {
          transform: `rotate(${startAngle}deg)`,
          strokeDasharray: "5 45",
          strokeDashoffset: "-50",
        },
        {
          transform: `rotate(${startAngle + remainingDegrees}deg)`,
          strokeDasharray: "38 12",
          strokeDashoffset: "-50",
        },
      ],
      {
        duration: 800,
        easing: "cubic-bezier(.36,.53,.73,1)",
        fill: "forwards",
      },
    );

    return () => {
      const transform = new DOMMatrixReadOnly(
        window.getComputedStyle(spinnerPath).transform,
      );
      spinnerAngleRef.current =
        (Math.atan2(transform.b, transform.a) * 180) / Math.PI;
      animation.cancel();
    };
  }, [isLoaded, isResent, isSent]);

  return (
    <main className="min-h-screen w-full bg-[var(--neutral-900)]">
      <div className="absolute inset-[0_0_64px_0] flex items-center justify-center">
        <div className="w-full max-w-[432px] flex flex-col items-center gap-10">
          <LoadInLogo size={40} onActiveColorChange={setActiveColor} />
          <div
            className="group relative w-full duration-400 ease-[cubic-bezier(0.8,0,0.2,1)]"
            style={{ height: isSent ? "210px" : "319px" }}
          >
            <div className="absolute inset-0 bg-[color-mix(in_srgb,_var(--neutral-850)_50%,var(--neutral-800))] rounded-[40px] overflow-hidden">
              <div
                className="absolute inset-[-140px_auto_auto_50%] -translate-x-1/2 w-40 h-40 group-hover:h-50 rounded-[50%] blur-[50px] opacity-30 group-hover:opacity-35 duration-200"
                style={{
                  backgroundColor: `color-mix(in srgb, ${activeColor} 20%, var(--neutral-300))`,
                }}
              ></div>
              <div className="absolute inset-px bg-[var(--neutral-850)] rounded-[39px] shadow-[inset_0_0_80px_20px_color-mix(in_oklab,var(--neutral-900)_100%,transparent)] group-hover:shadow-[inset_0_0_40px_20px_color-mix(in_oklab,var(--neutral-900)_0%,transparent)] duration-200">
                <div
                  className="absolute inset-[-140px_auto_auto_50%] -translate-x-1/2 w-70 h-40 group-hover:h-50 rounded-[50%] blur-[50px] opacity-10 group-hover:opacity-15 duration-200"
                  style={{ backgroundColor: activeColor }}
                  ref={logoReflectionRef}
                ></div>
              </div>
            </div>
            <div className="absolute inset-0 px-12 pt-10 pb-12 flex flex-col items-stretch gap-10">
              {/* <div className="fade-in absolute z-1 inset-[0_40px_0_40px] bg-[linear-gradient(to_bottom,transparent_5%,var(--neutral-850)_33%)]"></div> */}
              <h2
                className={`${isSent ? (isLoaded ? "opacity-100" : "opacity-0 pointer-events-none") : "opacity-100"} font-macan text-2xl font-medium leading-[100%] tracking-[-0.02em] text-white text-center duration-100`}
                ref={addBlurElm}
              >
                {isLoaded ? "Check your email" : "Welcome, let’s get started."}
              </h2>
              <p
                className={`absolute inset-[80px_16px_auto_16px] ${isLoaded ? "opacity-100" : "opacity-0 pointer-events-none"} font-macan text-sm leading-[120%] tracking-[0.01em] text-[var(--neutral-400)] text-center text-pretty duration-200`}
              >
                A magic link has been sent to{" "}
                <span className="text-[var(--neutral-200)]">{email}</span>{" "}
                <br />
                Please check spam too!
              </p>
              <div className="w-full flex flex-col items-center gap-6">
                <button
                  className={`w-full h-12 ${isSent ? "opacity-0 pointer-events-none duration-100" : "opacity-100 hover:bg-[var(--neutral-50)]! cursor-pointer duration-200 delay-150"} flex items-center justify-center gap-2 rounded-[14px] bg-[var(--neutral-150)] text-[var(--neutral-900)]`}
                  ref={addBlurElm}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M9 0C4.0275 0 0 4.0275 0 9C0 12.9825 2.57625 16.3462 6.15375 17.5387C6.60375 17.6175 6.7725 17.3475 6.7725 17.1112C6.7725 16.8975 6.76125 16.1887 6.76125 15.435C4.5 15.8512 3.915 14.8837 3.735 14.3775C3.63375 14.1187 3.195 13.32 2.8125 13.1062C2.4975 12.9375 2.0475 12.5212 2.80125 12.51C3.51 12.4987 4.01625 13.1625 4.185 13.4325C4.995 14.7937 6.28875 14.4112 6.80625 14.175C6.885 13.59 7.12125 13.1962 7.38 12.9712C5.3775 12.7462 3.285 11.97 3.285 8.5275C3.285 7.54875 3.63375 6.73875 4.2075 6.10875C4.1175 5.88375 3.8025 4.96125 4.2975 3.72375C4.2975 3.72375 5.05125 3.4875 6.7725 4.64625C7.4925 4.44375 8.2575 4.3425 9.0225 4.3425C9.7875 4.3425 10.5525 4.44375 11.2725 4.64625C12.9937 3.47625 13.7475 3.72375 13.7475 3.72375C14.2425 4.96125 13.9275 5.88375 13.8375 6.10875C14.4113 6.73875 14.76 7.5375 14.76 8.5275C14.76 11.9812 12.6562 12.7462 10.6537 12.9712C10.98 13.2525 11.2613 13.7925 11.2613 14.6362C11.2613 15.84 11.25 16.8075 11.25 17.1112C11.25 17.3475 11.4187 17.6287 11.8687 17.5387C13.6554 16.9355 15.2079 15.7873 16.3077 14.2555C17.4076 12.7238 17.9995 10.8857 18 9C18 4.0275 13.9725 0 9 0Z"
                      fill="currentColor"
                    />
                  </svg>
                  <p className="font-macan text-[16px] leading-[120%] tracking-[0.01em] font-semibold">
                    Login with Github
                  </p>
                </button>
                <p
                  className={`font-macan text-[16px] leading-[120%] tracking-[0.02em] font-bold text-[var(--neutral-500)] duration-100 ${isSent && "pointer-events-none"}`}
                  style={{
                    opacity: isSent ? "0" : "1",
                  }}
                  ref={addBlurElm}
                >
                  or
                </p>
                <div
                  className={`relative w-full ${isLoaded ? "opacity-0 duration-200" : "opacity-100 duration-400"} ease-[cubic-bezier(0.8,0,0.2,1)] ${isSent && "pointer-events-none"}`}
                  style={{
                    transform: `translateY(${isSent ? "-180px" : "0"})`,
                  }}
                  ref={addBlurElm}
                >
                  <HoverGlow
                    color="color-mix(in oklab, var(--neutral-800) 40%, transparent)"
                    className="inset-[2px] rounded-[14px]"
                  />
                  <input
                    ref={emailInputRef}
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    className={`relative w-full h-13 pl-3.5 flex items-center justify-center gap-2 rounded-[14px] border-2 ${isSent ? "border-[color-mix(in_oklab,var(--neutral-700)_50%,transparent)]" : "border-[var(--neutral-800)] hover:border-[var(--neutral-700)] focus:border-[var(--neutral-300)]"} outline-none font-macan text-[16px] leading-[120%] tracking-[0.01em] font-medium placeholder:text-[var(--neutral-400)] focus:placeholder:text-[var(--neutral-600)] duration-100`}
                    style={{
                      color: isSent
                        ? "var(--neutral-700)"
                        : "var(--neutral-100)",
                    }}
                    onChange={(event) =>
                      setIsActive(event.currentTarget.checkValidity())
                    }
                  />
                  <button
                    className={`absolute inset-[5px_5px_5px_auto] aspect-square flex items-center justify-center rounded-[10px] duration-200 ${isSent ? "cursor-auto pointer-events-none" : isActive && "cursor-pointer hover:bg-[var(--neutral-50)]!"}`}
                    style={{
                      backgroundColor:
                        isActive && !isSent
                          ? "var(--neutral-150)"
                          : "color-mix(in oklab, var(--neutral-700) 50%, transparent)",
                    }}
                    onClick={handleSend}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14.5 7L19.5 12L14.5 17M19.5 12H4.5"
                        stroke="var(--neutral-850)"
                        strokeWidth="2.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                <button
                  className={`absolute left-1/2 -translate-x-1/2 bottom-9 ${isSent ? (isLoaded && !isResent ? "opacity-100 hover:opacity-80! cursor-pointer pointer-events-auto delay-0!" : "opacity-100 pointer-events-none") : "opacity-0 pointer-events-none"} flex items-center gap-2 text-[var(--neutral-100)] duration-200 delay-100`}
                  style={{
                    opacity: isSent ? "1" : "0",
                  }}
                  onClick={handleResend}
                >
                  <svg
                    className="duration-200 origin-right"
                    style={{
                      transform: `scale(${isIndicatorLoaded ? 0.8 : 1})`,
                    }}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      className="duration-400"
                      opacity={isIndicatorLoaded ? "0" : "0.2"}
                      d="M12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20Z"
                      stroke="var(--neutral-100)"
                      strokeWidth="2.5"
                    />
                    <path
                      ref={spinnerPathRef}
                      className="[transform-box:fill-box] origin-center"
                      d="M12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4Z"
                      stroke="var(--neutral-100)"
                      strokeWidth="2.5"
                      strokeDasharray={isIndicatorLoaded ? "38 12" : "5 45"}
                      strokeDashoffset="-50"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      className={`transition-[stroke-dashoffset] duration-200 ease-out ${isIndicatorLoaded ? "delay-800" : ""}`}
                      d="M14.5 8H19"
                      stroke="var(--neutral-100)"
                      strokeWidth="2.5"
                      strokeDasharray="4.5"
                      strokeDashoffset={isIndicatorLoaded ? "0" : "-4.5"}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      className={`transition-[stroke-dashoffset] duration-200 ease-out ${isIndicatorLoaded ? "delay-800" : ""}`}
                      d="M19 3.5V8"
                      stroke="var(--neutral-100)"
                      strokeWidth="2.5"
                      strokeDasharray="4.5"
                      strokeDashoffset={isIndicatorLoaded ? "0" : "-4.5"}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p
                    className="font-macan text-[16px] leading-[120%] tracking-[0.01em] font-semibold whitespace-nowrap duration-200 ease-in-out"
                    style={{
                      width: isIndicatorLoaded
                        ? 90.71
                        : isResent
                          ? 126.45
                          : 107.46,
                    }}
                  >
                    {isIndicatorLoaded
                      ? "Resend link"
                      : isResent
                        ? "Resending link..."
                        : "Sending link..."}
                  </p>
                </button>
              </div>
              <div
                className={`absolute left-1/2 -translate-x-1/2 -translate-y-2 -bottom-16 h-8 px-2.5 flex items-center justify-center bg-[var(--neutral-850)] rounded-lg duration-200 ${isToastVisible ? "opacity-100 translate-y-0!" : "opacity-0 pointer-events-none"}`}
                aria-live="polite"
              >
                <p className="font-macan text-sm leading-[120%] tracking-[0.01em] text-[var(--neutral-400)] text-center">
                  {toastText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute inset-[auto_0_0_0] h-16 flex items-start justify-center">
        <div
          className="relative h-12 pl-3.5 pr-4 py-3.5 pb-3.75 flex items-center gap-3.5 bg-[var(--neutral-850)] rounded-2xl overflow-hidden"
          onMouseOut={() => setWhichHovered("")}
        >
          <div className="absolute inset-[0_-25%_0_-15%] flex items-center">
            <div
              className="w-4/7 aspect-3/2 bg-[radial-gradient(ellipse_at_center,var(--neutral-800)_33%,var(--neutral-850)_67%)] duration-200 ease-in-out"
              style={{
                opacity: whichHovered !== "" ? 0.5 : 0,
                transform:
                  whichHovered !== ""
                    ? whichHovered === "twitter"
                      ? "translateX(0%) scale(1)"
                      : whichHovered === "slack"
                        ? "translateX(75%) scale(1)"
                        : "translateX(0%) scale(1)"
                    : "translateX(0%) scale(0)",
                transformOrigin:
                  lastHovered === "twitter" ? "10% 50%" : "150% 50%",
              }}
            ></div>
          </div>
          <div
            className="relative flex items-center gap-1.5 text-[var(--neutral-400)] hover:text-[var(--neutral-50)] duration-200 cursor-pointer"
            onMouseOver={() => {
              setWhichHovered("twitter");
              setLastHovered("twitter");
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.14 1.4751H14.3486L9.52465 7.0029L15.2 14.5251H10.7567L7.27645 9.9621L3.29395 14.5251H1.08445L6.24415 8.6121L0.800049 1.4751H5.35675L8.50225 5.6448L12.14 1.4751ZM11.366 13.2003H12.59L4.69075 2.7306H3.37855L11.366 13.2003Z"
                fill="currentColor"
              />
            </svg>
            <p className="font-macan text-[16px] leading-[120%] tracking-[0.01em] font-semibold">
              Follow
            </p>
          </div>
          <div className="relative w-0 h-5">
            <div className="absolute -inset-0.25 bg-[var(--neutral-800)] rounded-[1px]"></div>
          </div>
          <div
            className="relative flex items-center gap-1.5 text-[var(--neutral-400)] hover:text-[var(--neutral-50)] duration-200 cursor-pointer"
            onMouseOver={() => {
              setWhichHovered("slack");
              setLastHovered("slack");
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.04396 0.666748C5.65498 0.666836 5.28196 0.821445 5.00697 1.09656C4.73198 1.37168 4.57754 1.74476 4.57763 2.13375C4.57771 2.52273 4.73232 2.89575 5.00744 3.17074C5.28255 3.44573 5.65564 3.60017 6.04463 3.60008H7.51129V2.13341C7.51129 1.74443 7.35677 1.37138 7.08172 1.09632C6.80666 0.821271 6.43361 0.666748 6.04463 0.666748M6.04463 4.57808H2.13329C1.74431 4.57808 1.37126 4.7326 1.0962 5.00766C0.821149 5.28271 0.666626 5.65576 0.666626 6.04475C0.666626 6.43373 0.821149 6.80678 1.0962 7.08184C1.37126 7.35689 1.74431 7.51142 2.13329 7.51142H6.04396C6.43294 7.51142 6.806 7.35689 7.08105 7.08184C7.3561 6.80678 7.51063 6.43373 7.51063 6.04475C7.51063 5.65576 7.3561 5.28271 7.08105 5.00766C6.806 4.7326 6.43294 4.57808 6.04396 4.57808M15.3333 6.04408C15.3333 5.6551 15.1788 5.28204 14.9037 5.00699C14.6287 4.73194 14.2556 4.57741 13.8666 4.57741C13.4776 4.57741 13.1046 4.73194 12.8295 5.00699C12.5545 5.28204 12.4 5.6551 12.4 6.04408V7.51075H13.8666C14.2556 7.51075 14.6287 7.35622 14.9037 7.08117C15.1788 6.80612 15.3333 6.43307 15.3333 6.04408ZM11.422 6.04408V2.13341C11.422 1.74443 11.2674 1.37138 10.9924 1.09632C10.7173 0.821271 10.3443 0.666748 9.95529 0.666748C9.56631 0.666748 9.19326 0.821271 8.9182 1.09632C8.64315 1.37138 8.48863 1.74443 8.48863 2.13341V6.04408C8.48863 6.43307 8.64315 6.80612 8.9182 7.08117C9.19326 7.35622 9.56631 7.51075 9.95529 7.51075C10.3443 7.51075 10.7173 7.35622 10.9924 7.08117C11.2674 6.80612 11.422 6.43307 11.422 6.04408ZM9.95529 15.3334C10.3443 15.3334 10.7173 15.1789 10.9924 14.9038C11.2674 14.6288 11.422 14.2557 11.422 13.8667C11.422 13.4778 11.2674 13.1047 10.9924 12.8297C10.7173 12.5546 10.3443 12.4001 9.95529 12.4001H8.48863V13.8667C8.48863 14.2557 8.64315 14.6288 8.9182 14.9038C9.19326 15.1789 9.56631 15.3334 9.95529 15.3334ZM9.95529 11.4214H13.8666C14.2556 11.4214 14.6287 11.2669 14.9037 10.9918C15.1788 10.7168 15.3333 10.3437 15.3333 9.95475C15.3333 9.56576 15.1788 9.19271 14.9037 8.91766C14.6287 8.6426 14.2556 8.48808 13.8666 8.48808H9.95596C9.56698 8.48799 9.19389 8.64243 8.91877 8.91742C8.64366 9.19241 8.48905 9.56543 8.48896 9.95442C8.48887 10.3434 8.64331 10.7165 8.9183 10.9916C9.19329 11.2667 9.56631 11.4213 9.95529 11.4214ZM0.666626 9.95541C0.666626 10.3444 0.821149 10.7175 1.0962 10.9925C1.37126 11.2676 1.74431 11.4221 2.13329 11.4221C2.52228 11.4221 2.89533 11.2676 3.17038 10.9925C3.44544 10.7175 3.59996 10.3444 3.59996 9.95541V8.48875H2.13329C1.74431 8.48875 1.37126 8.64327 1.0962 8.91833C0.821149 9.19338 0.666626 9.56643 0.666626 9.95541ZM4.57796 9.95541V13.8661C4.57787 14.2551 4.73231 14.6282 5.0073 14.9033C5.28229 15.1784 5.65531 15.333 6.04429 15.3331C6.43328 15.3332 6.80636 15.1787 7.08148 14.9037C7.3566 14.6287 7.5112 14.2557 7.51129 13.8667V9.95608C7.51138 9.5671 7.35694 9.19401 7.08195 8.91889C6.80696 8.64378 6.43394 8.48917 6.04496 8.48908C5.65598 8.48899 5.28289 8.64343 5.00777 8.91842C4.73266 9.19341 4.57805 9.56643 4.57796 9.95541Z"
                fill="currentColor"
              />
            </svg>

            <p className="font-macan text-[16px] leading-[120%] tracking-[0.01em] font-semibold">
              Join
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
