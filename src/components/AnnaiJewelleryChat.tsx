import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { MapPin, MessageCircle, Phone, Send, Sparkles, X } from "lucide-react";
import botImage from "../assets/logo.png";
import { websiteApi } from "../lib/api";
import { clean, isPhone, limitPhoneDigits, minLength, phoneDigits } from "../lib/validation";

type ChatMessage = {
  id: number;
  from: "bot" | "user";
  text: string;
  actions?: Array<{ label: string; href: string }>;
};

type LeadStep = "idle" | "name" | "phone" | "goal";

const showroomMap = "https://www.google.com/maps/dir//Annai+Sliver+Jewellery,+Shop+No+8,+Old+Bus+Stand,+Padmanabhapuram,+Tamil+Nadu+629175/@8.2073794,77.3040963,1915m/data=!3m1!1e3!4m8!4m7!1m0!1m5!1m1!1s0x3b04f9c3ad0b657f:0x9c9047a12495cad7!2m2!1d77.3202801!2d8.2407514?entry=ttu&g_ep=EgoyMDI2MDcyMi4wIKXMDSoASAFQAw%3D%3D";

const quickAnswers: Record<string, ChatMessage> = {
  collections: {
    id: 0,
    from: "bot",
    text: "Explore our 925 silver ornaments with 24K gold plating, including necklaces, earrings, rings, bracelets, bridal jewellery and antique-inspired designs.",
    actions: [{ label: "Shop all jewellery", href: "/collection/indian-jewellery" }],
  },
  purity: {
    id: 0,
    from: "bot",
    text: "Annai ornaments are crafted with a quality-checked 925 silver base and finished with 24K gold plating. Product pages show the material, finish and care guidance clearly.",
  },
  price: {
    id: 0,
    from: "bot",
    text: "Prices are shown on every product card and detail page. GST or other applicable charges are clearly shown during checkout. Tell me the jewellery type and budget for personal help.",
  },
  delivery: {
    id: 0,
    from: "bot",
    text: "Jewellery orders are securely packed and sent with insured delivery. Standard delivery usually takes 4-7 working days after payment verification.",
  },
  location: {
    id: 0,
    from: "bot",
    text: "Visit Annai Jewellery at Shop No 8, Old Bus Stand, Padmanabhapuram, Tamil Nadu 629175. We are open Monday-Saturday 9 AM-9 PM and closed on Sunday.",
    actions: [{ label: "Showroom directions", href: showroomMap }],
  },
  contact: {
    id: 0,
    from: "bot",
    text: "Call or WhatsApp Annai Jewellery at +91 97512 29418. I can also collect your details for a jewellery consultant callback.",
  },
  payment: {
    id: 0,
    from: "bot",
    text: "Checkout supports ordering through WhatsApp, UPI, Google Pay and QR payment. After paying, upload the screenshot or send it through WhatsApp for verification.",
  },
  orders: {
    id: 0,
    from: "bot",
    text: "Sign in and open My Profile > Orders to view order status and details. For WhatsApp orders, our team will confirm payment and delivery through WhatsApp.",
  },
};

const quickButtons = [
  ["Collections", "collections"],
  ["Material & Plating", "purity"],
  ["Delivery", "delivery"],
  ["Payment", "payment"],
  ["Track Order", "orders"],
  ["Talk to Expert", "lead"],
] as const;

const firstMessage: ChatMessage = {
  id: 1,
  from: "bot",
  text: "Vanakkam! I am Annai Jewellery Assist. I can help with our 925 silver and 24K gold-plated collections, prices, care, delivery, payments and orders.",
};

const detectAnswerKey = (text: string) => {
  const message = text.toLowerCase();
  if (message.includes("price") || message.includes("cost") || message.includes("rate") || message.includes("making charge")) return "price";
  if (message.includes("purity") || message.includes("silver") || message.includes("925") || message.includes("plating") || message.includes("24k") || message.includes("material")) return "purity";
  if (message.includes("delivery") || message.includes("shipping") || message.includes("dispatch") || message.includes("return")) return "delivery";
  if (message.includes("payment") || message.includes("upi") || message.includes("gpay") || message.includes("qr")) return "payment";
  if (message.includes("order") || message.includes("track") || message.includes("status")) return "orders";
  if (message.includes("location") || message.includes("map") || message.includes("address") || message.includes("direction")) return "location";
  if (message.includes("phone") || message.includes("contact") || message.includes("call") || message.includes("whatsapp")) return "contact";
  if (message.includes("collection") || message.includes("necklace") || message.includes("earring") || message.includes("ring") || message.includes("bracelet") || message.includes("jewellery") || message.includes("gold")) return "collections";
  return "";
};

const messageId = () => Date.now() + Math.floor(Math.random() * 1000);

const AnnaiJewelleryChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([firstMessage]);
  const [input, setInput] = useState("");
  const [leadStep, setLeadStep] = useState<LeadStep>("idle");
  const [lead, setLead] = useState({ name: "", phone: "", goal: "" });
  const [typing, setTyping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ active: false, moved: false, offsetX: 0, offsetY: 0, pointerId: 0 });
  const unread = useMemo(() => (open ? 0 : 1), [open]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing, open]);

  useEffect(() => {
    const clampPosition = () => {
      setPosition((current) => {
        if (!current || !containerRef.current) return current;
        const rect = containerRef.current.getBoundingClientRect();
        const padding = 8;
        return {
          x: Math.min(Math.max(padding, current.x), window.innerWidth - rect.width - padding),
          y: Math.min(Math.max(padding, current.y), window.innerHeight - rect.height - padding),
        };
      });
    };
    window.addEventListener("resize", clampPosition);
    return () => window.removeEventListener("resize", clampPosition);
  }, []);

  const pushMessage = (message: Omit<ChatMessage, "id">) => {
    setMessages((current) => [...current, { ...message, id: messageId() }]);
  };

  const botReply = (message: Omit<ChatMessage, "id">, delay = 420) => {
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      pushMessage(message);
    }, delay);
  };

  const startLeadFlow = (reason = "I can send this to admin. What is your name?") => {
    setLeadStep("name");
    botReply({ from: "bot", text: reason });
  };

  const sendLeadToAdmin = async (payload = lead) => {
    const phone = phoneDigits(payload.phone);
    setSubmitting(true);
    try {
      await websiteApi.createEnquiry({
        name: clean(payload.name),
        phone,
        email: "",
        program: "Annai Jewellery Enquiry",
        source: "Chat Bot",
        message: `Annai Jewellery bot enquiry: ${clean(payload.goal)}`,
      });
      setLeadStep("idle");
      setLead({ name: "", phone: "", goal: "" });
      botReply({ from: "bot", text: "Thank you. Your enquiry has been shared with our jewellery team. A consultant will contact you soon." });
    } catch {
      setLeadStep("idle");
      botReply({
        from: "bot",
        text: "Sorry, I could not send your request right now. Please call or WhatsApp our Annai Jewellery team at +91 97512 29418. Our team will be happy to guide and support you.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeadAnswer = (answer: string) => {
    if (leadStep === "name") {
      if (!minLength(answer, 2)) return botReply({ from: "bot", text: "Please enter your name with at least 2 letters." }, 260);
      setLead((current) => ({ ...current, name: answer }));
      setLeadStep("phone");
      return botReply({ from: "bot", text: `Nice to meet you, ${answer}. What is your 10 digit contact number?` });
    }

    if (leadStep === "phone") {
      const phone = phoneDigits(answer);
      if (!isPhone(phone)) return botReply({ from: "bot", text: "Please share a valid 10 digit phone number." }, 260);
      setLead((current) => ({ ...current, phone }));
      setLeadStep("goal");
      return botReply({ from: "bot", text: "One last question: what jewellery do you need help with? For example, bridal necklace, earrings, 925 silver, gold-plating care, budget or delivery." });
    }

    if (leadStep === "goal") {
      if (!minLength(answer, 3)) return botReply({ from: "bot", text: "Please tell me a little more so admin can help properly." }, 260);
      const nextLead = { ...lead, goal: answer };
      setLead(nextLead);
      return sendLeadToAdmin(nextLead);
    }
  };

  const ask = (text: string) => {
    const question = clean(text);
    if (!question || submitting) return;
    pushMessage({ from: "user", text: question });
    setInput("");

    if (leadStep !== "idle") {
      handleLeadAnswer(question);
      return;
    }

    const key = detectAnswerKey(question);
    if (key) {
      botReply(quickAnswers[key]);
      if (["price", "purity", "collections", "contact"].includes(key)) {
        window.setTimeout(() => startLeadFlow("Would you like help from an Annai jewellery consultant? Please share your name first."), 900);
      }
      return;
    }

    botReply({
      from: "bot",
      text: "Thank you for your message. I am unable to answer that right now. Please call or WhatsApp our Annai Jewellery team at +91 97512 29418, and our team will guide and support you.",
    });
  };

  const handleQuick = (label: string, key: keyof typeof quickAnswers | "lead") => {
    pushMessage({ from: "user", text: label });
    if (key === "lead") {
      startLeadFlow("Certainly. I will collect a few details for our jewellery consultant. What is your name?");
      return;
    }
    botReply(quickAnswers[key]);
  };

  const handleDragStart = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    dragRef.current = {
      active: true,
      moved: false,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag.active || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nextX = event.clientX - drag.offsetX;
    const nextY = event.clientY - drag.offsetY;
    const padding = 8;
    const x = Math.min(Math.max(padding, nextX), window.innerWidth - rect.width - padding);
    const y = Math.min(Math.max(padding, nextY), window.innerHeight - rect.height - padding);
    if (Math.abs(nextX - rect.left) > 3 || Math.abs(nextY - rect.top) > 3) drag.moved = true;
    setPosition({ x, y });
  };

  const handleDragEnd = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (drag.pointerId === event.pointerId) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer capture may already be released by the browser.
      }
    }
    dragRef.current = { ...drag, active: false };
  };

  const handleLauncherClick = () => {
    if (dragRef.current.moved) {
      dragRef.current = { ...dragRef.current, moved: false };
      return;
    }
    setOpen((current) => !current);
  };

  return (
    <div
      ref={containerRef}
      className={`${position ? "fixed z-[60]" : "fixed bottom-[132px] right-4 z-[60] sm:bottom-24 sm:right-6"} chatbot-root`}
      style={position ? { left: position.x, top: position.y } : undefined}
    >
      <section
        className={`chatbot-panel absolute bottom-[calc(100%+0.75rem)] right-0 flex h-[min(78dvh,38rem)] w-[calc(100vw-2rem)] max-w-[24rem] flex-col overflow-hidden rounded-[1.5rem] border shadow-2xl sm:w-[24rem] ${
          open ? "chatbot-panel-open" : "chatbot-panel-closed pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <header className="chatbot-header flex items-center gap-3 border-b p-3">
          <img src={botImage} alt="Annai Jewellery assistant" className="h-14 w-14 shrink-0 rounded-2xl bg-white object-contain p-0.5 shadow-sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Annai Jewellery Assist</p>
            <p className="truncate text-xs text-slate-500">Jewellery guidance, anytime.</p>
          </div>
          <button onClick={() => setOpen(false)} className="chatbot-icon-button" aria-label="Close chat">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="chatbot-scroll flex-1 space-y-3 overflow-y-auto p-3">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.from === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[84%] rounded-2xl px-3 py-2 text-sm leading-6 ${message.from === "user" ? "chatbot-user-bubble" : "chatbot-bot-bubble"}`}>
                <p>{message.text}</p>
                {message.actions && (
                  <div className="mt-2 grid gap-2">
                    {message.actions.map((action) => (
                      <a key={action.href} href={action.href} target="_blank" rel="noreferrer" className="chatbot-action-link inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold">
                        <MapPin className="h-3.5 w-3.5" />
                        {action.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="chatbot-bot-bubble chatbot-typing rounded-2xl px-3 py-3">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          {leadStep === "idle" && (
            <div className="grid grid-cols-2 gap-2">
              {quickButtons.map(([label, key]) => (
                <button key={key} onClick={() => handleQuick(label, key)} className="chatbot-chip rounded-full border px-3 py-2 text-xs font-medium">
                  {label}
                </button>
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <footer className="chatbot-footer border-t p-3">
          <div className="mb-2 grid grid-cols-2 gap-2">
            <a href="tel:+919751229418" className="chatbot-chip flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold">
              <Phone className="h-3.5 w-3.5" /> Call
            </a>
            <a href="https://wa.me/919751229418" target="_blank" rel="noreferrer" className="chatbot-chip flex items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold">
              WhatsApp
            </a>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); ask(input); }} className="flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(leadStep === "phone" ? limitPhoneDigits(event.target.value) : event.target.value)}
              placeholder={leadStep === "phone" ? "Enter contact number..." : leadStep === "name" ? "Enter your name..." : leadStep === "goal" ? "Tell us what jewellery you need..." : "Ask about jewellery..."}
              inputMode={leadStep === "phone" ? "numeric" : "text"}
              className="chatbot-input min-w-0 flex-1"
            />
            <button className="chatbot-send-button" aria-label="Send message" disabled={submitting}>
              {submitting ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </footer>
      </section>

      <button
        onClick={handleLauncherClick}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        className={`chatbot-launcher relative flex items-center gap-3 rounded-full px-3 py-2 shadow-2xl ${open ? "is-open" : ""}`}
        aria-label="Open Annai Jewellery chat"
        title="Drag or click to chat"
      >
        <span className="chatbot-launcher-ring" aria-hidden="true" />
        <span className="relative">
          <img src={botImage} alt="" className="h-12 w-12 rounded-full bg-white object-contain p-1" />
          {unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold text-white">{unread}</span>}
        </span>
        
      
        {!open && <span className="chatbot-floating-hint">help?</span>}
         
      </button>
    </div>
  );
};

export default AnnaiJewelleryChat;
