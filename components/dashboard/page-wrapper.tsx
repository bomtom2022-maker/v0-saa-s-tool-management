"use client";

import { usePathname } from "next/navigation";
import { useRef, useEffect, useState } from "react";

export function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      setIsVisible(false);
      // Use requestAnimationFrame to batch the DOM update
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }
  }, [pathname]);

  return (
    <div
      className={isVisible ? "opacity-100" : "opacity-0"}
      style={{ transition: "opacity 100ms ease-in" }}
    >
      {children}
    </div>
  );
}
