import { useEffect } from "react";

const cardSelector = [
  "main article",
  "main .site-card",
  "main .shop-category-card",
  "main [class*='product-card']",
  "main a.group[class*='rounded-']",
  "main div[class*='rounded-'][class*='border']",
].join(",");

export default function SiteMotion({ pageKey }: { pageKey: string }) {
  useEffect(() => {
    const observed = new WeakSet<Element>();
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("site-card-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -10% 0px" },
    );

    const prepare = () => {
      document.querySelectorAll<HTMLElement>(cardSelector).forEach((card, index) => {
        if (observed.has(card)) return;
        observed.add(card);
        card.classList.add("site-card-reveal");
        card.style.setProperty("--card-delay", `${Math.min(index % 4, 3) * 45}ms`);
        revealObserver.observe(card);
      });

      document.querySelectorAll<HTMLImageElement>("main img").forEach((image) => {
        if (image.dataset.eager === "true") return;
        image.loading = "lazy";
        image.decoding = "async";
      });
    };

    const frame = requestAnimationFrame(prepare);
    const mutationObserver = new MutationObserver(prepare);
    mutationObserver.observe(document.querySelector("main") || document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(frame);
      revealObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [pageKey]);

  return null;
}
