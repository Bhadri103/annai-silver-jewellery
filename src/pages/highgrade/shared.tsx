import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Apple,
  ArrowUpRight,
  Calculator,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Droplets,
  Flame,
  Gauge,
  Ruler,
  Star,
  Target,
} from "lucide-react";
import { faqs, gymImage, planRows, plans, programData, trainers } from "./data";
import { websiteApi } from "../../lib/api";
import { clean, isEmail, isName, isPhone, limitPhoneDigits, maxLength, phoneDigits } from "../../lib/validation";

export type MembershipPlan = {
  name: string;
  price?: string;
  note: string;
  image: string;
  features: string[];
  visible?: boolean;
};

const membershipPlansKey = "highgrade_membership_plans";
const membershipPlansVisibleKey = "highgrade_membership_plans_visible";
export const membershipPlansChangedEvent = "highgrade-membership-plans-changed";

export const getStoredMembershipPlans = (): MembershipPlan[] => {
  if (typeof window === "undefined") return plans;
  try {
    const parsed = JSON.parse(localStorage.getItem(membershipPlansKey) || "[]");
    if (Array.isArray(parsed) && parsed.length) {
      return parsed.map((plan) => ({ ...plan, visible: plan.visible !== false }));
    }
  } catch {
    return plans;
  }
  return plans.map((plan) => ({ ...plan, visible: true }));
};

export const saveStoredMembershipPlans = (items: MembershipPlan[]) => {
  localStorage.setItem(membershipPlansKey, JSON.stringify(items));
  window.dispatchEvent(new Event(membershipPlansChangedEvent));
};

export const getMembershipPlansVisible = () => {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(membershipPlansVisibleKey) !== "false";
};

export const saveMembershipPlansVisible = (visible: boolean) => {
  localStorage.setItem(membershipPlansVisibleKey, String(visible));
  window.dispatchEvent(new Event(membershipPlansChangedEvent));
};

export const Reveal = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const SEO = ({ title, description }: { title: string; description: string }) => {
  useEffect(() => {
    document.title = `${title} | Highgrade Fitness Nagercoil`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    const scriptId = "highgrade-schema";
    document.getElementById(scriptId)?.remove();
    const script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "HealthClub",
      name: "Highgrade Fitness",
      address: "Shop No 8, Old Bus Stand, Padmanabhapuram, Tamil Nadu 629175",
      telephone: "+91 97512 29418",
      areaServed: "Padmanabhapuram",
    });
    document.head.appendChild(script);
  }, [description, title]);

  return null;
};

export const PageHero = ({ title, text, image = gymImage }: { title: string; text: string; image?: string }) => (
  <section className="bg-white px-4 pb-14 pt-32 sm:px-6 lg:px-10">
    <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2">
      <Reveal>
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.25em] text-amber-600">Highgrade Fitness</p>
        <h1 className="text-4xl font-medium leading-tight text-amber-900 md:text-5xl">{title}</h1>
        <p className="mt-5 text-sm leading-7 text-slate-600">{text}</p>
      </Reveal>
      <Reveal delay={120}>
        <img src={image} alt={title} className="h-80 w-full rounded-[2rem] object-cover object-center" />
      </Reveal>
    </div>
  </section>
);

export const SectionTitle = ({ kicker, title, text }: { kicker?: string; title: string; text?: string }) => (
  <Reveal className="mx-auto mb-10 max-w-3xl text-center">
    {kicker && <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-amber-600">{kicker}</p>}
    <h2 className="text-3xl font-medium text-amber-900 md:text-4xl">{title}</h2>
    {text && <p className="mt-4 text-sm leading-7 text-slate-600">{text}</p>}
  </Reveal>
);

export const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${className}`}>
    {children}
  </div>
);

export const CountUp = ({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.4 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) {
      setValue(0);
      return;
    }
    let frame = 0;
    let start: number | null = null;
    const run = (time: number) => {
      if (start === null) start = time;
      const progress = Math.min((time - start) / 1200, 1);
      setValue(Math.round(end * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(run);
    };
    frame = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame);
  }, [end, visible]);

  return <span ref={ref}>{prefix}{value}{suffix}</span>;
};

export const ProgramsOverview = () => (
  <section className="bg-white px-4 py-16 sm:px-6 lg:px-10">
    <div className="mx-auto max-w-7xl">
      <SectionTitle kicker="Our Services" title="Programs for every fitness goal" text="A quick overview of Highgrade Fitness services." />
      <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
        {programData.filter((program) => ["fat-loss", "muscle-building", "strength-training", "personal-training", "womens-fitness", "senior-fitness"].includes(program.slug)).map((program, index) => (
          <Reveal key={program.slug} delay={index * 45} className="h-full">
            <Link to={`/programs/${program.slug}`} className="group flex h-full min-h-[320px] flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:min-h-[390px]">
              <img src={program.image} alt={program.title} className="h-28 w-full flex-none object-contain transition group-hover:scale-105 sm:h-40 lg:h-48" />
              <div className="flex flex-1 flex-col p-3 sm:p-5">
                {program.logoLight && program.logoDark && (
                  <div className="program-logo-stage mb-3 flex h-14 flex-none items-center justify-center px-1 sm:mb-4 sm:h-20 sm:px-4">
                    <img src={program.logoLight} alt={`${program.title} logo`} className="theme-logo-light max-h-9 w-full object-contain sm:max-h-12" />
                    <img src={program.logoDark} alt={`${program.title} logo`} className="theme-logo-dark max-h-9 w-full object-contain sm:max-h-12" />
                  </div>
                )}
                <h3 className="text-sm font-medium text-amber-900 sm:text-lg">{program.title}</h3>
                <p className="program-overview-copy mt-1 text-xs leading-5 text-slate-600 sm:mt-2 sm:text-sm sm:leading-6">{program.intro}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

export const MembershipPlans = () => {
  const planScrollerRef = useRef<HTMLDivElement>(null);
  const [managedPlans, setManagedPlans] = useState<MembershipPlan[]>(() => getStoredMembershipPlans());
  const [sectionVisible, setSectionVisible] = useState(() => getMembershipPlansVisible());

  useEffect(() => {
    const syncPlans = () => {
      setManagedPlans(getStoredMembershipPlans());
      setSectionVisible(getMembershipPlansVisible());
    };
    window.addEventListener(membershipPlansChangedEvent, syncPlans);
    window.addEventListener("storage", syncPlans);
    return () => {
      window.removeEventListener(membershipPlansChangedEvent, syncPlans);
      window.removeEventListener("storage", syncPlans);
    };
  }, []);

  const scrollPlans = (direction: "left" | "right") => {
    planScrollerRef.current?.scrollBy({
      left: direction === "left" ? -360 : 360,
      behavior: "smooth",
    });
  };
  const visiblePlans = managedPlans.filter((plan) => plan.visible !== false);

  if (!sectionVisible || visiblePlans.length === 0) return null;

  return (
  <section className="bg-white px-4 py-16 sm:px-6 lg:px-10">
    <div className="mx-auto max-w-7xl">
      <SectionTitle kicker="Membership" title="Choose Your Plans" text="Flexible membership options with coaching, progress tracking, and clear upgrade paths." />
      <div className="mb-10 flex flex-wrap items-center justify-center gap-4">
        <Reveal className="rounded-full bg-amber-600 px-6 py-2 text-sm font-medium text-white shadow-sm shadow-amber-100">
          Plans
        </Reveal>
        <Reveal className="flex gap-2">
          <button type="button" onClick={() => scrollPlans("left")} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-amber-900 shadow-sm transition hover:border-amber-500 hover:text-amber-600" aria-label="Scroll plans left">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => scrollPlans("right")} className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-amber-600 text-white shadow-sm transition hover:bg-amber-700" aria-label="Scroll plans right">
            <ChevronRight className="h-5 w-5" />
          </button>
        </Reveal>
      </div>
      <div ref={planScrollerRef} className="flex snap-x gap-7 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visiblePlans.map((plan, index) => (
          <Reveal key={plan.name} delay={index * 70} className="min-w-[300px] max-w-[320px] flex-none snap-start sm:min-w-[330px]">
            <article className={`group relative h-full overflow-hidden rounded-[2rem] border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${plan.name === "Annual" ? "border-amber-500 ring-4 ring-amber-50" : "border-slate-100"}`}>
              {plan.name === "Annual" && (
                <span className="absolute right-5 top-5 z-10 rounded-full bg-amber-600 px-4 py-1.5 text-xs font-medium text-white shadow-lg">
                  Best Value
                </span>
              )}
              <div className="relative m-3 h-56 overflow-hidden rounded-[1.5rem] bg-amber-700">
                <img src={plan.image} alt={`${plan.name} membership plan`} className="h-full w-full object-contain transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-amber-200">Package</p>
                  <h3 className="mt-2 text-2xl font-medium">{plan.name}</h3>
                </div>
              </div>
              <div className="p-6 pt-3">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-amber-600">Contact for package details</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{plan.note}</p>
                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <p key={feature} className="flex items-center gap-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {feature}
                    </p>
                  ))}
                </div>
                <Link
                  to="/contact"
                  className={`mt-7 block rounded-full px-5 py-3 text-center text-sm font-medium transition hover:-translate-y-0.5 ${
                    plan.name === "Annual" ? "bg-amber-600 text-white shadow-lg shadow-amber-100 hover:bg-amber-700" : "border border-slate-200 text-amber-900 hover:border-amber-600 hover:bg-amber-600 hover:text-white"
                  }`}
                >
                  Contact Us
                </Link>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    {/* <Reveal className="mt-10 overflow-x-auto scrollbar-hide rounded-2xl border border-slate-100 shadow-sm">
  <table className="w-full min-w-[720px] text-left text-sm">
    <thead className="bg-white">
      <tr>
        <th className="p-4">Feature</th>
        {plans.map((plan) => (
          <th key={plan.name} className="p-4">
            {plan.name}
          </th>
        ))}
      </tr>
    </thead>

    <tbody>
      {planRows.map(([feature, ...values]) => (
        <tr key={feature.toString()} className="border-t border-slate-100">
          <td className="p-4">{feature}</td>
          {values.map((value, index) => (
            <td key={index} className="p-4">
              {value ? (
                <Check className="h-5 w-5 text-amber-600" />
              ) : (
                "-"
              )}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
</Reveal> */}
    </div>
  </section>
  );
};

const fitnessTools: Array<{ title: string; text: string; icon: LucideIcon; label: string; metric: string }> = [
  { title: "Calorie Calculator", text: "Estimate daily calories for fat loss, maintenance, or muscle gain.", icon: Calculator, label: "Nutrition", metric: "TDEE" },
  { title: "BMI Calculator", text: "Check your body mass index and understand your starting point.", icon: Gauge, label: "Body Check", metric: "BMI" },
  { title: "Body Fat Calculator", text: "Estimate body fat percentage using simple measurements.", icon: Ruler, label: "Composition", metric: "%" },
  { title: "BMR Calculator", text: "Find your baseline calorie burn before activity is added.", icon: Flame, label: "Metabolism", metric: "BMR" },
  { title: "Water Intake Calculator", text: "Set a daily hydration target based on your body weight.", icon: Droplets, label: "Hydration", metric: "Liters" },
  { title: "Macronutrient Calculator", text: "Split calories into protein, carbs, and fats for your goal.", icon: Apple, label: "Meal Plan", metric: "Macros" },
  { title: "Goal Setting Tool", text: "Map your goal, timeline, training days, and check-in rhythm.", icon: Target, label: "Planning", metric: "Goals" },
  { title: "Progress Tracker", text: "Track weight, photos, attendance, measurements, and milestones.", icon: ClipboardCheck, label: "Tracking", metric: "Progress" },
];

export const FitnessToolsSection = () => {
  const toolsScrollerRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState(0);

  const scrollTools = (direction: "left" | "right") => {
    const node = toolsScrollerRef.current;
    if (!node) return;
    const cardWidth = 250;
    const nextIndex =
      direction === "left"
        ? Math.max(activeTool - 1, 0)
        : Math.min(activeTool + 1, fitnessTools.length - 1);

    setActiveTool(nextIndex);
    node.scrollTo({ left: nextIndex * cardWidth, behavior: "smooth" });
  };

  const handleToolsScroll = () => {
    const node = toolsScrollerRef.current;
    if (!node) return;
    setActiveTool(Math.min(Math.round(node.scrollLeft / 250), fitnessTools.length - 1));
  };

  return (
    <section className="fitness-tools-section relative overflow-hidden px-4 py-14 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="relative mb-10 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:items-end sm:gap-6">
          <Reveal>
            <p className="fitness-tools-kicker mb-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.2em]">
              {/* <Sparkles className="h-4 w-4" />  */}
              Smart fitness suite
            </p>
            <h2 className="fitness-tools-heading text-3xl font-medium md:text-4xl">
              Our Fitness <span className="text-amber-600">Tools</span>
            </h2>
          </Reveal>
          <Reveal className="flex flex-col items-end gap-3 justify-self-end">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scrollTools("left")}
                className="fitness-tools-arrow inline-flex h-10 w-10 items-center justify-center rounded-lg transition hover:border-amber-500 hover:text-amber-500"
                aria-label="Previous fitness tools"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollTools("right")}
                className="fitness-tools-arrow inline-flex h-10 w-10 items-center justify-center rounded-lg transition hover:border-amber-500 hover:text-amber-500"
                aria-label="Next fitness tools"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-1">
              {fitnessTools.slice(0, 4).map((tool, index) => (
                <span key={tool.title} className={`fitness-tools-dot h-2 rounded-full transition-all ${index === Math.min(activeTool, 3) ? "is-active w-10" : "w-5"}`} />
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal className="relative">
          <p className="fitness-tools-subtitle mb-7 text-center text-sm leading-7">
            Access a variety of tools to help you reach your fitness goals more effectively.
          </p>
        </Reveal>

        <div
          ref={toolsScrollerRef}
          onScroll={handleToolsScroll}
          className="flex snap-x gap-5 overflow-x-auto overflow-y-hidden px-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden"
        >
          {fitnessTools.map((tool, index) => (
            <Reveal key={tool.title} delay={index * 45} className="h-[360px] min-w-[250px] max-w-[270px] flex-none snap-start md:h-[380px] md:min-w-[280px] md:max-w-[300px]">
              <Link
                to="/calculators"
                className="fitness-tool-card group relative block h-full overflow-hidden rounded-[1.4rem] p-4   transition hover:-translate-y-1 sm:p-5"
              >
                <div className="relative">
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <span className="fitness-tool-label rounded-full px-3 py-1 text-xs font-medium">{tool.label}</span>
                    <span className="text-xs font-medium text-amber-500">0{index + 1}</span>
                  </div>
                  <div className="flex items-start justify-between gap-5">
                    <span className="fitness-tool-icon relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white transition group-hover:rotate-3 group-hover:scale-105">
                      <tool.icon className="h-8 w-8" strokeWidth={1.7} />
                    </span>
                    <span className="fitness-tool-metric rounded-2xl px-3 py-2 text-right">
                      <span className="block text-[10px] uppercase tracking-[0.18em]">Metric</span>
                      <span className="block text-sm font-medium">{tool.metric}</span>
                    </span>
                  </div>
                  <h3 className="fitness-tool-title mt-6 min-h-12 text-xl font-medium uppercase leading-6">
                    {tool.title}
                  </h3>
                  <p className="fitness-tool-text mt-3 min-h-16 text-sm leading-6">{tool.text}</p>
                  <div className="fitness-tool-footer   flex items-center justify-between pt-5">
                    <span className="text-xs uppercase tracking-[0.18em]">Calculator</span>
                    <span className="fitness-tool-link inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition group-hover:bg-amber-600 group-hover:text-white">
                      Learn More <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                  <span className="pointer-events-none absolute -bottom-5 right-0 text-7xl font-medium text-white/[0.03]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export const TrainersPreview = ({ full = false }: { full?: boolean }) => (
  <section className="px-4 py-16 sm:px-6 lg:px-10">
    <div className="mx-auto max-w-7xl">
      <SectionTitle kicker="Coaches" title="Qualified trainers" text="Photos, qualifications, experience, and specializations." />
      <div className="grid gap-6 md:grid-cols-4">
        {trainers.map((trainer, index) => (
          <Reveal key={trainer.name} delay={index * 70}>
            <Card className="overflow-hidden p-0">
              <img src={trainer.image} alt={trainer.name} className="h-64 w-full object-contain object-top" />
              <div className="p-5">
                <h3 className="font-medium">{trainer.name}</h3>
                <p className="text-sm text-amber-600">{trainer.role}</p>
                {full && (
                  <>
                    <p className="mt-3 text-sm text-slate-600">{trainer.qualification}</p>
                    <p className="text-sm text-slate-600">{trainer.experience}</p>
                    <p className="mt-3 text-xs text-slate-500">{trainer.specializations.join(" | ")}</p>
                  </>
                )}
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

export const LeadForm = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    goal: "",
    time: "",
    guide: true,
  });
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateForm = (field: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus("Submitting enquiry...");
    const phone = phoneDigits(form.phone);
    if (!isName(form.name)) {
      setStatus("Enter a valid name.");
      setSubmitting(false);
      return;
    }
    if (!isPhone(phone)) {
      setStatus("Enter a valid 10 digit mobile number.");
      setSubmitting(false);
      return;
    }
    if (!isEmail(form.email)) {
      setStatus("Enter a valid email address or leave it empty.");
      setSubmitting(false);
      return;
    }
    if (!maxLength(form.goal, 160)) {
      setStatus("Goal must be 160 characters or less.");
      setSubmitting(false);
      return;
    }
    try {
      await websiteApi.createEnquiry({
        name: clean(form.name),
        phone,
        email: clean(form.email),
        program: "Free Fitness Assessment",
        source: "Booking page",
        message: `Goal: ${clean(form.goal) || "Not specified"}. Preferred time: ${clean(form.time) || "Not specified"}. Beginner guide: ${form.guide ? "Yes" : "No"}.`,
      });
      setStatus("Enquiry submitted. Highgrade team will contact you soon.");
      setForm({ name: "", phone: "", email: "", goal: "", time: "", guide: true });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to submit enquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Reveal>
      <form onSubmit={handleSubmit} className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="p-6 lg:p-8">
          <h2 className="mb-2 text-2xl font-medium text-amber-900">Free Fitness Assessment</h2>
          <p className="mb-6 text-sm leading-6 text-slate-600">Share your goal and our coach will suggest the right starting plan.</p>
          <input required minLength={2} maxLength={80} pattern="[A-Za-z][A-Za-z .'-]{1,79}" value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="Name" className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500" />
          <input required type="tel" inputMode="numeric" minLength={10} maxLength={10} pattern="[6-9][0-9]{9}" value={form.phone} onChange={(event) => updateForm("phone", limitPhoneDigits(event.target.value))} placeholder="Phone" className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500" />
          <input type="email" maxLength={120} value={form.email} onChange={(event) => updateForm("email", event.target.value)} placeholder="Email" className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500" />
          <input maxLength={160} value={form.goal} onChange={(event) => updateForm("goal", event.target.value)} placeholder="Goal" className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500" />
          <input maxLength={80} value={form.time} onChange={(event) => updateForm("time", event.target.value)} placeholder="Preferred Time" className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500" />
          <label className="mb-4 flex items-start gap-3 text-sm leading-6 text-slate-600">
            <input checked={form.guide} onChange={(event) => updateForm("guide", event.target.checked)} type="checkbox" className="mt-1 accent-amber-600" />
            Send me the beginner guide and weekly fitness newsletter.
          </label>
          <button disabled={submitting} className="w-full rounded-xl bg-amber-600 py-3 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70">
            {submitting ? "Submitting..." : "Submit Enquiry"}
          </button>
          {status && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-slate-700">{status}</p>}
        </div>
      </form>
    </Reveal>
  );
};

export const LeadGeneration = () => (
  <section className="px-4 py-16 sm:px-6 lg:px-10">
    <div className="mx-auto max-w-6xl">
      <LeadForm />
    </div>
  </section>
);

export const FAQPageContent = ({ compact = false }: { compact?: boolean }) => (
  <>
    {!compact && (
      <>
        <SEO title="FAQ" description="Highgrade Fitness frequently asked questions about fees, parking, diet plans, age limits, and cancellation." />
        <PageHero title="Frequently Asked Questions" text="Answers for new members before joining Highgrade Fitness." />
      </>
    )}
    <section className="px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <SectionTitle title="FAQ" text="Common questions about membership, training, and policies." />
        <div className="grid gap-4">
          {faqs.map(([q, a], index) => (
            <Reveal key={q} delay={index * 45}>
              <details className="faq-item group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 p-5 text-sm font-medium text-amber-900">
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">{String(index + 1).padStart(2, "0")}</span>
                    {q}
                  </span>
                  <span className="faq-plus flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-100 text-amber-600 transition group-open:rotate-45">+</span>
                </summary>
                <div className="border-t border-slate-100 px-5 pb-5 pl-[4.5rem]">
                  <p className="pt-4 text-sm leading-7 text-slate-600">{a}</p>
                </div>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  </>
);

export const FeatureGrid = ({ items, icon: Icon = Activity }: { items: string[]; icon?: LucideIcon }) => (
  <section className="px-4 py-16 sm:px-6 lg:px-10">
    <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
      {items.map((item, index) => (
        <Reveal key={item} delay={index * 60}>
          <Card>
            <Icon className="mb-4 h-7 w-7 text-amber-600" />
            <h3 className="font-medium">{item}</h3>
          </Card>
        </Reveal>
      ))}
    </div>
  </section>
);

export const ReviewStars = () => (
  <div className="mt-4 flex text-amber-500">
    {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
  </div>
);
