import { useEffect, useState } from "react";

export function patientPageSizeForViewport(width, height) {
  if (width < 640) return height < 860 ? 3 : 4;
  if (width < 1280) return height < 820 ? 4 : 6;
  return height < 920 ? 6 : 8;
}

function currentPageSize() {
  if (typeof window === "undefined") return 8;
  return patientPageSizeForViewport(window.innerWidth, window.innerHeight);
}

/** Keeps the directory footer visible without rendering more than eight rows. */
export default function useResponsivePatientPageSize() {
  const [pageSize, setPageSize] = useState(currentPageSize);

  useEffect(() => {
    const updatePageSize = () => {
      const nextPageSize = currentPageSize();
      setPageSize((current) =>
        current === nextPageSize ? current : nextPageSize,
      );
    };

    window.addEventListener("resize", updatePageSize);
    window.addEventListener("orientationchange", updatePageSize);
    updatePageSize();

    return () => {
      window.removeEventListener("resize", updatePageSize);
      window.removeEventListener("orientationchange", updatePageSize);
    };
  }, []);

  return pageSize;
}
