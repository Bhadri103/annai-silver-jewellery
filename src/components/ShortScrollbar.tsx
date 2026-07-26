import { useEffect, useRef, useState } from "react";

export default function ShortScrollbar() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumbTop, setThumbTop] = useState(0);
  const thumbHeight = 150;

  useEffect(() => {
    const update = () => {
      const track = trackRef.current;
      if (!track) return;
      const scrollRange = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const travel = Math.max(track.clientHeight - thumbHeight, 0);
      setThumbTop((window.scrollY / scrollRange) * travel);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const startDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const startY = event.clientY;
    const startTop = thumbTop;
    const move = (moveEvent: PointerEvent) => {
      const track = trackRef.current;
      if (!track) return;
      const travel = Math.max(track.clientHeight - thumbHeight, 1);
      const nextTop = Math.min(Math.max(startTop + moveEvent.clientY - startY, 0), travel);
      const scrollRange = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
      window.scrollTo({ top: (nextTop / travel) * scrollRange, behavior: "auto" });
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  return (
    <div ref={trackRef} className="annai-short-scrollbar fixed bottom-[72px] right-1 top-[82px] z-[70] hidden w-[5px] rounded-full bg-amber-100/70 lg:block" aria-hidden="true">
      <button type="button" tabIndex={-1} onPointerDown={startDrag} className="absolute left-0 w-[5px] cursor-grab rounded-full bg-[#D4AF37] shadow-sm active:cursor-grabbing" style={{ height: thumbHeight, transform: `translateY(${thumbTop}px)` }} />
    </div>
  );
}
