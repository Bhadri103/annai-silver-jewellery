import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => (
  <a
    href="https://wa.me/919751229418?text=Hello%20Annai%20Jewellery%2C%20I%20would%20like%20to%20know%20more%20about%20your%20jewellery."
    target="_blank"
    rel="noreferrer"
    aria-label="Message Annai Jewellery on WhatsApp"
    className="fixed bottom-[76px] right-4 z-[70] flex items-center gap-2 rounded-full bg-[#25D366] px-3.5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,211,102,0.35)] transition hover:-translate-y-1 hover:bg-[#20bd5a] sm:bottom-6 sm:right-6 sm:px-5"
  >
    <MessageCircle className="h-5 w-5 fill-white/20" />
    <span className="hidden sm:inline">WhatsApp Us</span>
  </a>
);

export default WhatsAppButton;
