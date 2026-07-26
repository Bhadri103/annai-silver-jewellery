import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Calendar,
  Check,
  ChevronDown,
  Dumbbell,
  Flame,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  User,
  Users,
} from "lucide-react";
import heroImage from '../assets/hero-right.jpg'
 
const services = [
  {
    title: "Losing Weight",
    text: "Sustainable fat-loss coaching, nutrition structure, and weekly accountability.",
    perks: ["Weight loss support", "Effective cardio workouts", "Personalized diet plans", "Fat burning programs"],
    image:
      "https://images.unsplash.com/photo-1571019613914-85f342c6a11e?auto=format&fit=crop&w=700&q=85",
  },
  {
    title: "Building Muscle",
    text: "Progressive strength programs built to increase lean mass and performance.",
    perks: ["Muscle growth workouts", "Strength training programs", "High protein diet plans", "Supplement guidance"],
    image:
      "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?auto=format&fit=crop&w=700&q=85",
  },
  {
    title: "Training In Home",
    text: "Expert coaching plans for home workouts using minimal equipment.",
    perks: ["No equipment workouts", "Bodyweight exercises", "Home fitness plans", "Flexible schedules"],
    image:
      "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=700&q=85",
  },
  {
    title: "Gym Plan",
    text: "Personalized gym sessions for strength, endurance, and athletic goals.",
    perks: ["Full gym access", "Premium equipment", "Expert coaching", "Custom workout plan"],
    image:
      "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=700&q=85",
  },
];

const plans = [
  {
    name: "Pro Plan",
    price: "99$",
    text: "Build momentum with deeper tracking, videos, and complete programming.",
    perks: ["Workout video library", "Progress tracking", "Nutrition guidelines", "Community access"],
  },
  {
    name: "Custom Plan",
    price: "149$",
    text: "Personal coaching built around your body, schedule, goals, and lifestyle.",
    perks: ["Custom training plan", "Coach check-ins", "Weekly workout updates", "Priority support"],
  },
  {
    name: "Beginner Plan",
    price: "49$",
    text: "Start strong with a simple plan, guided workouts, and weekly goals.",
    perks: ["Starter workouts", "Beginner meal guide", "Basic habit coaching", "Fitness glossary"],
  },
];

const serviceIcons = [Dumbbell, Flame, User, Calendar];

const tools = [
  { icon: Calculator, title: "Calorie Calculator" },
  { icon: Calendar, title: "BMI Calculator" },
  { icon: Dumbbell, title: "Macro Calculator" },
  { icon: Target, title: "Goal Setting Tool" },
  { icon: Flame, title: "Workout Calculator" },
];

const trainers = [
  {
    name: "Sam Cole",
    role: "Personal Trainer",
    image:
      "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=500&q=85",
  },
  {
    name: "Michael Harris",
    role: "Strength Coach",
    image:
      "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=500&q=85",
  },
  {
    name: "John Anderson",
    role: "Boxing Coach",
    image:
      "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=500&q=85",
  },
  {
    name: "Tom Blake",
    role: "Fitness Trainer",
    image:
      "https://images.unsplash.com/photo-1584466977773-e625c37cdd50?auto=format&fit=crop&w=500&q=85",
  },
];

const posts = [
  {
    title: "5 Essential Exercises For Building Muscle",
    image:
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=900&q=85",
  },
  {
    title: "The Ultimate Guide To A Balanced Diet",
    image:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=500&q=85",
  },
  {
    title: "The Benefits Of HIIT Training",
    image:
      "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=500&q=85",
  },
  {
    title: "Home Workouts For Busy People",
    image:
      "https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=500&q=85",
  },
  {
    title: "How To Always Stay Motivated",
    image:
      "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=500&q=85",
  },
];

const faqs = [
  "What is High Grade Fitness and how can it help me reach my fitness goals?",
  "How do I get started with a workout plan?",
  "What is included in the custom plan?",
  "Can I change my plan after signing up?",
  "What kind of support can I expect from my trainer?",
];

const revealBase =
  "transition-all duration-700 ease-out motion-reduce:opacity-100 motion-reduce:translate-y-0";

const Reveal = ({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`${revealBase} ${
        visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
};

const CountUp = ({
  end,
  prefix = "",
  suffix = "",
  duration = 1400,
}: {
  end: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.45 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;

    let frame = 0;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(end * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [duration, end, started]);

  return (
    <span ref={ref}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
};

const SectionHeading = ({
  eyebrow,
  title,
  highlight,
  text,
}: {
  eyebrow?: string;
  title: string;
  highlight: string;
  text?: string;
}) => (
  <Reveal className="mx-auto mb-10 max-w-3xl text-center">
    {eyebrow && <p className="mb-3 text-xs font-medium uppercase tracking-[0.28em] text-amber-500">{eyebrow}</p>}
    <h2 className="text-3xl font-semibold text-amber-900 md:text-4xl">
      {title} <span className="text-amber-600">{highlight}</span>
    </h2>
    {text && <p className="mt-4 text-sm leading-7 text-slate-500">{text}</p>}
  </Reveal>
);

const HighGradeHome: React.FC = () => {
  const [openFaq, setOpenFaq] = useState(0);
  const [activePlan, setActivePlan] = useState("Custom Plan");
  const [signupStatus, setSignupStatus] = useState("");

  return (
    <div className="min-h-screen overflow-hidden bg-white text-amber-900">
      <section className="relative overflow-hidden bg-white px-4 pb-20 pt-32 sm:px-6 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(#fbf4e6_1px,transparent_1px)] [background-size:22px_22px] opacity-40" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
          <Reveal className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-xs font-medium text-amber-600 shadow-sm">
              <Sparkles className="h-4 w-4" />
              #1 Fitness Platform
            </div>
            <p className="mb-3 text-4xl font-semibold leading-tight text-amber-900 sm:text-5xl">
              Achieve Your
            </p>
            <h1 className="mb-4 text-5xl font-semibold uppercase leading-none tracking-wide text-amber-600 sm:text-6xl md:text-7xl">
              Fitness Goals
            </h1>
            <p className="mb-7 text-3xl font-semibold text-amber-900 sm:text-4xl">
              With High Grade Fitness
            </p>
            <p className="mb-8 max-w-xl text-sm leading-7 text-slate-600">
              Join the High Grade Fitness community and transform your fitness journey.
              Our expert coaches and personalized programs help you build strength,
              burn fat, and stay consistent without guesswork.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                href="#community"
                className="rounded-full bg-amber-600 px-10 py-3 text-center text-sm font-medium text-white shadow-[0_20px_45px_rgba(143,101,31,0.28)] transition hover:-translate-y-1 hover:bg-amber-700"
              >
                Start Your Journey
              </a>
              <a
                href="#programs"
                className="rounded-full border-2 border-amber-500 bg-white px-10 py-3 text-center text-sm font-medium text-amber-900 transition hover:-translate-y-1 hover:bg-amber-600 hover:text-white"
              >
                Explore Programs
              </a>
            </div>
          </Reveal>

          <Reveal delay={120} className="relative mx-auto min-h-[540px] w-full max-w-lg">
            <div className="absolute inset-x-8 bottom-14 h-[410px] rounded-[42%] bg-amber-600 shadow-2xl" />
            <div className="absolute inset-x-4 top-14 h-[430px] rounded-full border border-amber-100" />
            <img
              src={heroImage}
              alt="High Grade Fitness trainer holding dumbbell"
              className="absolute bottom-0 left-1/2 h-[555px] w-[430px] -translate-x-1/2 rounded-b-[45%] object-contain object-top drop-shadow-2xl grayscale-[8%]"
            />
            {[
              { end: 80, label: "Coaches", position: "left-0 top-44" },
              { end: 1300, label: "Positive Reviews", position: "right-0 top-24" },
              { end: 1000, label: "Workout Videos", position: "left-8 bottom-20" },
              { end: 1500, label: "Members", position: "right-0 bottom-24" },
            ].map(({ end, label, position }) => (
              <div
                key={label}
                className={`absolute ${position} rounded-2xl border border-amber-100 bg-white/90 px-7 py-4 text-center shadow-xl backdrop-blur transition hover:-translate-y-1 hover:shadow-2xl`}
              >
                <p className="text-xl font-semibold text-amber-900">
                  <CountUp end={end} prefix="+ " />
                </p>
                <p className="text-[10px] text-slate-500">{label}</p>
              </div>
            ))}
          </Reveal>
        </div>

        <Reveal delay={180} className="relative z-10 mx-auto mt-12 grid max-w-6xl gap-4 text-center sm:grid-cols-2 lg:grid-cols-4">
          {[
            { end: 96, suffix: "%", label: "Client Satisfaction", text: "Members love their results and experience" },
            { end: 5, prefix: "+", label: "Years Of Experience", text: "Trusted transformations and coaching" },
            { end: 800, prefix: "+", label: "Active Members", text: "Join our thriving fitness community" },
            { end: 24, suffix: "/7", label: "Support Available", text: "Expert help whenever you need it" },
          ].map(({ end, prefix, suffix, label, text }) => (
            <div key={label} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <p className="text-3xl font-semibold text-amber-600">
                <CountUp end={end} prefix={prefix} suffix={suffix} />
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">{label}</p>
              <p className="mt-3 text-xs text-slate-500">{text}</p>
            </div>
          ))}
        </Reveal>
      </section>

      <section id="programs" className="bg-white px-4 py-20 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="Our"
            highlight="Services"
            text="Choose the training path that fits your goal, your schedule, and the way you like to move."
          />
          <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service, index) => {
              const ServiceIcon = serviceIcons[index] || Dumbbell;
              return (
              <Reveal key={service.title} delay={index * 90}>
                <article className="group h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-2 hover:border-amber-200 hover:shadow-2xl">
                  <div className="relative h-56 overflow-hidden">
                    <img src={service.image} alt={service.title} className="h-full w-full object-contain transition duration-700 group-hover:scale-110" />
                    <div className="absolute left-5 top-5 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-600 text-white shadow-lg shadow-amber-200">
                      <ServiceIcon className="h-7 w-7" />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="mb-2 text-lg font-semibold uppercase text-amber-900">{service.title}</h3>
                    <p className="mb-5 text-sm leading-6 text-slate-600">{service.text}</p>
                    <ul className="mb-6 space-y-2">
                      {service.perks.map((perk) => (
                        <li key={perk} className="flex items-center gap-2 text-sm text-slate-700">
                          <Check className="h-4 w-4 rounded-full bg-amber-600 p-0.5 text-white" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                    <a href="#pricing" className="inline-flex items-center gap-2 text-sm font-medium text-amber-900 transition hover:text-amber-600">
                      Learn More <span className="text-amber-600">--</span>
                    </a>
                  </div>
                </article>
              </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-white px-4 py-20 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Membership"
            title="Choose Your"
            highlight="Plan"
            text="Every plan includes smart programming, clear guidance, and enough structure to keep you moving."
          />
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {plans.map((plan, index) => {
              const selected = activePlan === plan.name;
              return (
                <Reveal key={plan.name} delay={index * 100}>
                  <button
                    onClick={() => setActivePlan(plan.name)}
                    className={`relative h-full w-full rounded-2xl border p-8 text-left transition hover:-translate-y-2 hover:shadow-2xl ${
                      selected
                        ? "border-amber-500 bg-white shadow-[0_24px_70px_rgba(143,101,31,0.14)]"
                        : "border-slate-200 bg-white shadow-sm"
                    }`}
                  >
                    {selected && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-b-md rounded-t-sm bg-amber-600 px-8 py-1 text-[10px] font-medium uppercase text-white">
                        Most Popular
                      </span>
                    )}
                    <p className="mb-3 text-center text-[10px] font-medium uppercase tracking-[0.25em] text-amber-500">Package</p>
                    <h3 className="mb-4 text-center text-2xl font-semibold uppercase text-amber-900">{plan.name}</h3>
                    <p className="mb-6 text-center text-sm leading-6 text-slate-600">{plan.text}</p>
                    <ul className="mb-8 space-y-3 text-sm text-slate-700">
                      {plan.perks.map((perk) => (
                        <li key={perk} className="flex gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-amber-600 p-0.5 text-amber-600" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                    <p className="mb-7 text-center text-3xl font-semibold text-amber-900">
                      {plan.price} <span className="text-xs font-normal text-slate-500">/ Month</span>
                    </p>
                    <span className={`block rounded-full border py-3 text-center text-sm font-medium ${selected ? "border-amber-600 bg-amber-600 text-white" : "border-amber-600 bg-white text-amber-900"}`}>
                      Choose This Plan
                    </span>
                  </button>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-8 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-amber-900">
              Our Fitness <span className="text-amber-600">Tools</span>
            </h2>
            <div className="flex gap-2">
              <button className="rounded-full border border-slate-200 bg-white p-2 shadow-sm transition hover:bg-amber-600 hover:text-white"><ArrowLeft className="h-4 w-4" /></button>
              <button className="rounded-full border border-slate-200 bg-white p-2 shadow-sm transition hover:bg-amber-600 hover:text-white"><ArrowRight className="h-4 w-4" /></button>
            </div>
          </Reveal>
          <Reveal className="mb-8 text-center text-xs text-slate-500">
            Access tools that help you track food, training, goals, and progress more effectively.
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {tools.map(({ icon: Icon, title }, index) => (
              <Reveal key={title} delay={index * 70}>
                <article className="group rounded-3xl border border-amber-100 bg-white p-6 shadow-sm transition hover:-translate-y-2 hover:border-amber-300 hover:shadow-xl">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition group-hover:bg-amber-600 group-hover:text-white">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-5 text-sm font-semibold uppercase text-slate-900">{title}</h3>
                  <a href="#community" className="text-xs font-medium text-amber-600">Learn More --</a>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            title="What Our"
            highlight="Customers Say"
            text="Real members, real coaching, real progress."
          />
          <div className="grid items-center gap-8 lg:grid-cols-[280px_1fr_220px]">
            <Reveal>
              <img src={heroImage} alt="Satisfied gym member" className="mx-auto h-80 rounded-3xl object-contain object-top shadow-xl" />
            </Reveal>
            <Reveal delay={100}>
              <div className="rounded-3xl bg-white p-8 shadow-xl">
                <div className="mb-3 flex gap-1 text-amber-500">
                  {[...Array(5)].map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-amber-900">Steven Harward</h3>
                <p className="text-sm leading-7 text-slate-600">
                  High Grade Fitness gave me the exact structure I needed. The coaching,
                  workout plan, and nutrition direction helped me stay consistent and
                  finally see measurable progress.
                </p>
              </div>
            </Reveal>
            <Reveal delay={180} className="grid grid-cols-2 gap-4">
              {trainers.slice(1, 3).map((trainer) => (
                <img key={trainer.name} src={trainer.image} alt={trainer.name} className="h-44 rounded-2xl object-contain shadow-lg grayscale transition hover:grayscale-0" />
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      <section id="coaching" className="bg-white px-4 py-20 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-8 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-amber-900">
              Meet Our <span className="text-amber-600">Trainers</span>
            </h2>
            <div className="flex gap-2">
              <button className="rounded-full border border-slate-200 bg-white p-2 shadow-sm transition hover:bg-amber-600 hover:text-white"><ArrowLeft className="h-4 w-4" /></button>
              <button className="rounded-full border border-slate-200 bg-white p-2 shadow-sm transition hover:bg-amber-600 hover:text-white"><ArrowRight className="h-4 w-4" /></button>
            </div>
          </Reveal>
          <Reveal className="mb-8 text-center text-xs text-slate-500">
            Certified coaches who bring structure, accountability, and energy to every plan.
          </Reveal>
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {trainers.map((trainer, index) => (
              <Reveal key={trainer.name} delay={index * 80}>
                <article className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-2 hover:shadow-2xl">
                  <img src={trainer.image} alt={trainer.name} className="h-64 w-full object-contain object-top transition duration-700 group-hover:scale-105" />
                  <div className="p-5">
                    <h3 className="font-semibold text-amber-900">{trainer.name}</h3>
                    <p className="text-xs text-slate-500">{trainer.role}</p>
                    <a href="#community" className="mt-3 inline-block text-xs font-medium text-amber-600">Learn More --</a>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal className="mb-8 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-amber-900">
              High Grade <span className="text-amber-600">Blog Posts</span>
            </h2>
            <div className="flex gap-2">
              <button className="rounded-full border border-slate-200 bg-white p-2 shadow-sm transition hover:bg-amber-600 hover:text-white"><ArrowLeft className="h-4 w-4" /></button>
              <button className="rounded-full border border-slate-200 bg-white p-2 shadow-sm transition hover:bg-amber-600 hover:text-white"><ArrowRight className="h-4 w-4" /></button>
            </div>
          </Reveal>
          <Reveal className="mb-8 text-center text-xs text-slate-500">
            Discover essential tips to maximize workouts and reach your goals faster.
          </Reveal>
          <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
            <Reveal>
              <article className="group relative min-h-[360px] overflow-hidden rounded-3xl shadow-xl">
                <img src={posts[0].image} alt={posts[0].title} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-amber-900 via-amber-800/35 to-transparent" />
                <div className="absolute bottom-0 p-6 text-white">
                  <h3 className="text-xl font-semibold">{posts[0].title}</h3>
                  <p className="mt-3 text-xs text-gray-200">August 14 | Strength Training</p>
                </div>
              </article>
            </Reveal>
            <div className="grid gap-5 sm:grid-cols-2">
              {posts.slice(1).map((post, index) => (
                <Reveal key={post.title} delay={index * 80}>
                  <article className="group relative min-h-[170px] overflow-hidden rounded-3xl shadow-lg">
                    <img src={post.image} alt={post.title} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-900 via-amber-800/45 to-transparent" />
                    <h3 className="absolute bottom-7 left-4 right-4 text-sm font-semibold text-white">{post.title}</h3>
                    <a href="#community" className="absolute bottom-3 right-4 text-[10px] font-medium text-amber-300">Learn More --</a>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="community" className="bg-white px-4 py-20 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <Reveal>
            <h2 className="mb-4 text-3xl font-semibold text-amber-900">
              Join Our <span className="text-amber-600">Fitness Community</span>
            </h2>
            <p className="mb-8 text-sm leading-7 text-slate-600">
              Sign up now to unlock personalized workout plans, expert coaching,
              and a supportive community that keeps you accountable.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                [User, "Personalized Workout Plans"],
                [ShieldCheck, "Expert Coaching"],
                [Users, "Community Support"],
                [Trophy, "Exclusive Resources"],
              ].map(([Icon, title], index) => {
                const ToolIcon = Icon as typeof User;
                return (
                  <Reveal key={title as string} delay={index * 70}>
                    <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                      <ToolIcon className="mb-4 h-7 w-7 text-amber-500" />
                      <h3 className="mb-2 text-sm font-semibold text-amber-600">{title as string}</h3>
                      <p className="text-xs leading-6 text-slate-500">Work with certified trainers and stay focused with clear support.</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <form
              className="rounded-3xl bg-amber-700 p-7 text-white shadow-[0_30px_90px_rgba(15,23,42,0.25)]"
              onSubmit={(event) => {
                event.preventDefault();
                setSignupStatus("Thanks. We will contact you shortly.");
              }}
            >
              <div className="mb-6 flex justify-center gap-10 border-b border-white/10">
                <button type="button" className="border-b-2 border-amber-500 px-4 pb-2 text-amber-400">Sign Up</button>
                <button type="button" className="px-4 pb-2 text-gray-300">Login</button>
              </div>
              <label className="mb-2 block text-xs">Name</label>
              <input required minLength={2} maxLength={80} pattern="[A-Za-z][A-Za-z .'-]{1,79}" className="mb-4 w-full rounded-xl border border-white/20 bg-white px-4 py-3 text-sm text-amber-900 outline-none focus:border-amber-500" placeholder="Enter your name" />
              <label className="mb-2 block text-xs">E-Mail</label>
              <input required type="email" maxLength={120} className="mb-5 w-full rounded-xl border border-white/20 bg-white px-4 py-3 text-sm text-amber-900 outline-none focus:border-amber-500" placeholder="Enter your email" />
              <button type="submit" className="mb-3 w-full rounded-xl bg-amber-600 py-3 text-sm font-medium transition hover:bg-amber-700">Sign Up</button>
              {signupStatus && <p className="mb-3 text-center text-xs text-emerald-300">{signupStatus}</p>}
              <div className="mb-3 text-center text-xs text-gray-400">Or</div>
              <button type="button" className="w-full rounded-xl border border-white/30 py-3 text-sm transition hover:bg-white hover:text-amber-900">Sign Up With Google</button>
            </form>
          </Reveal>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <SectionHeading title="Frequently Asked" highlight="Questions" />
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <Reveal key={faq} delay={index * 55}>
                <button
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                  className="w-full rounded-2xl border border-orange-100 bg-white text-left shadow-sm transition hover:border-amber-200 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-amber-900">
                    {faq}
                    <ChevronDown className={`h-4 w-4 shrink-0 text-orange-500 transition ${openFaq === index ? "rotate-180" : ""}`} />
                  </div>
                  {openFaq === index && (
                    <p className="border-t border-slate-100 px-5 py-4 text-xs leading-6 text-slate-500">
                      High Grade Fitness provides personalized workout plans, expert coaching,
                      and nutritional guidance to help you build muscle, lose weight, and
                      improve confidence with a clear plan.
                    </p>
                  )}
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HighGradeHome;
