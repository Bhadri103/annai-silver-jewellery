import { useState, type PointerEvent } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
};

export default function ZoomableProductImage({ src, alt, className = "" }: Props) {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [zoomed, setZoomed] = useState(false);
  const [dragging, setDragging] = useState(false);

  const updatePosition = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100));
    const y = Math.min(100, Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100));
    setPosition({ x, y });
  };

  return (
    <div
      className={`product-detail-zoom ${dragging ? "is-dragging" : ""} ${className}`}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setZoomed(true);
        updatePosition(event);
      }}
      onPointerMove={(event) => {
        if (event.pointerType === "mouse" || dragging) updatePosition(event);
      }}
      onPointerLeave={() => {
        setZoomed(false);
        setDragging(false);
      }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
        setZoomed(true);
        updatePosition(event);
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        setDragging(false);
        if (event.pointerType !== "mouse") setZoomed(false);
      }}
      onPointerCancel={() => {
        setDragging(false);
        setZoomed(false);
      }}
      role="img"
      aria-label={`${alt}. Hover or drag to inspect details.`}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={zoomed ? "is-zoomed" : ""}
        style={{ transformOrigin: `${position.x}% ${position.y}%` }}
      />
      <span className="product-zoom-hint">{dragging ? "Drag to inspect" : "Hover to zoom · drag to explore"}</span>
    </div>
  );
}
