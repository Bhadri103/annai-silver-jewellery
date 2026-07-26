import { IndianRupee } from "lucide-react";

type PriceProps = {
  value: string | number;
  className?: string;
  iconClassName?: string;
};

export default function Price({ value, className = "", iconClassName = "h-[0.9em] w-[0.9em]" }: PriceProps) {
  const digits = String(value).replace(/[^\d]/g, "");
  const formatted = digits ? Number(digits).toLocaleString("en-IN") : "0";

  return (
    <span className={`inline-flex items-center ${className}`}>
      <IndianRupee aria-hidden="true" strokeWidth={2.4} className={`shrink-0 ${iconClassName}`} />
      <span>{formatted}</span>
    </span>
  );
}
