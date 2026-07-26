import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => (
  <a
    href="https://wa.me/919751229418?text=Hello%20Annai%20Jewellery%2C%20I%20would%20like%20to%20know%20more%20about%20your%20jewellery."
    target="_blank"
    rel="noreferrer"
    aria-label="Message Annai Jewellery on WhatsApp"
    className="fixed bottom-[76px] right-4 z-[70] grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_rgba(37,211,102,0.35)] transition hover:-translate-y-1 hover:scale-105 hover:bg-[#20bd5a] sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
  >
    <MessageCircle className="h-6 w-6 fill-white/20 sm:h-7 sm:w-7" />
  </a>
);

export default WhatsAppButton;
