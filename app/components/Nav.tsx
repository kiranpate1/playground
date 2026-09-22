import { useEffect, useState } from "react";

const pages = [
  { href: "/latency", label: "Latency" },
  { href: "/title", label: "Title" },
  { href: "/prompt", label: "Prompt" },
  { href: "/submitting", label: "Submitting" },
];

export default function Nav() {
  const [activePath, setActivePath] = useState<string>("");

  useEffect(() => {
    setActivePath(window.location.pathname);
    const handleLocationChange = () => {
      setActivePath(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  return (
    <nav className="absolute top-0 left-0 right-6 min-w-54 p-4 flex gap-1 flex-wrap">
      {pages.map((page) => (
        <a
          key={page.href}
          href={page.href}
          className={`border border-white/10 rounded-[8px] px-2 py-1 ${
            activePath === page.href
              ? "bg-white/10 text-white"
              : "text-white/70"
          }`}
        >
          {page.label}
        </a>
      ))}
    </nav>
  );
}
