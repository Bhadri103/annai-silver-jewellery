import React, { useMemo, useRef, useState } from "react";
import { Activity, Apple, Droplets, Flame, Gauge, Ruler, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Reveal, SEO } from "./highgrade/shared";

const numberFields = [
  ["Height", "cm"],
  ["Weight", "kg"],
  ["Age", "years"],
  ["Waist", "cm"],
  ["Neck", "cm"],
  ["Hip", "cm"],
] as const;

const CalculatorsPage = () => {
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [waist, setWaist] = useState(82);
  const [neck, setNeck] = useState(38);
  const [hip, setHip] = useState(96);
  const [error, setError] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);

  const setters = [setHeight, setWeight, setAge, setWaist, setNeck, setHip];
  const values = [height, weight, age, waist, neck, hip];
  const bmi = useMemo(() => weight / Math.pow(height / 100, 2), [height, weight]);
  const bmr = useMemo(() => Math.round(10 * weight + 6.25 * height - 5 * age + 5), [age, height, weight]);
  const calories = Math.round(bmr * 1.45);
  const water = (weight * 0.035).toFixed(1);
  const bodyFat = useMemo(() => {
    const safeHeight = Math.max(height, 1);
    const safeNeck = Math.max(neck, 1);
    const safeWaist = Math.max(waist, 1);
    if (gender === "male") {
      return 495 / (1.0324 - 0.19077 * Math.log10(safeWaist - safeNeck) + 0.15456 * Math.log10(safeHeight)) - 450;
    }
    return 495 / (1.29579 - 0.35004 * Math.log10(safeWaist + hip - safeNeck) + 0.221 * Math.log10(safeHeight)) - 450;
  }, [gender, height, hip, neck, waist]);

  const resultCards = [
    { label: "BMI", value: bmi.toFixed(1), unit: "score", icon: Gauge, note: "Body mass index" },
    { label: "BMR", value: bmr.toString(), unit: "kcal", icon: Flame, note: "Resting burn" },
    { label: "Calories", value: calories.toString(), unit: "kcal", icon: Apple, note: "Daily estimate" },
    { label: "Water", value: water, unit: "L/day", icon: Droplets, note: "Hydration target" },
    { label: "Body Fat", value: Number.isFinite(bodyFat) ? bodyFat.toFixed(1) : "0.0", unit: "%", icon: Ruler, note: "Measurement estimate" },
  ];

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const [currentHeight, currentWeight, currentAge, currentWaist, currentNeck, currentHip] = values;
    if (currentHeight < 90 || currentHeight > 240) return setError("Height must be between 90 and 240 cm.");
    if (currentWeight < 25 || currentWeight > 250) return setError("Weight must be between 25 and 250 kg.");
    if (currentAge < 10 || currentAge > 90) return setError("Age must be between 10 and 90 years.");
    if (currentWaist <= currentNeck) return setError("Waist must be greater than neck measurement.");
    if (gender === "female" && currentHip <= currentNeck) return setError("Hip must be greater than neck measurement.");
    setError("");
    if (window.matchMedia("(max-width: 767px)").matches) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <SEO title="Transformation Calculator" description="BMI, body fat, calorie, BMR, and water intake calculators by Highgrade Fitness." />
      <section className="relative overflow-hidden bg-white px-4 pb-14 pt-32 sm:px-6 lg:px-10">
        <div className="absolute inset-x-0 top-0 h-[440px] bg-[radial-gradient(circle_at_78%_18%,rgba(184,135,44,0.1),transparent_32%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1fr_0.82fr]">
          <Reveal>
            <p className="mb-4 inline-flex rounded-full bg-amber-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-amber-600">Highgrade Tools</p>
            <h1 className="max-w-3xl text-4xl font-medium leading-tight text-amber-900 md:text-6xl">Transformation Calculator</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600">
              Calculate BMI, BMR, calories, water intake, and estimated body fat in one place. Use it as a starting point, then let a coach fine-tune your plan.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <div className="relative overflow-hidden rounded-[2rem] bg-amber-700">
              <img src="https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=1100&q=85" alt="Fitness calculator dashboard" className="h-80 w-full object-contain opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="text-sm uppercase tracking-[0.22em] text-amber-200">Plan smarter</p>
                <h2 className="mt-2 text-2xl font-medium">Numbers that support real coaching.</h2>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <Reveal>
            <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-amber-600">Inputs</p>
                  <h2 className="mt-2 text-2xl font-medium text-amber-900">Enter your details</h2>
                </div>
                <Activity className="h-8 w-8 text-amber-600" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {numberFields.map(([label, unit], index) => (
                  <label key={label} className="block text-sm font-medium text-slate-600">
                    {label}
                    <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-amber-500">
                      <input
                        type="number"
                        min={label === "Height" ? 90 : label === "Weight" ? 25 : label === "Age" ? 10 : 20}
                        max={label === "Height" ? 240 : label === "Weight" ? 250 : label === "Age" ? 90 : 220}
                        value={values[index]}
                        onChange={(event) => setters[index](Number(event.target.value))}
                        className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm outline-none"
                      />
                      <span className="text-xs text-slate-400">{unit}</span>
                    </div>
                  </label>
                ))}
              </div>
              <div className="calculator-segment mt-5 grid grid-cols-2 gap-2 rounded-2xl p-1">
                {(["male", "female"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setGender(option)}
                    className={`calculator-segment-option rounded-xl py-3 text-sm capitalize transition ${gender === option ? "is-active" : ""}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {error && <p className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</p>}
              <p className="mt-5 text-xs leading-6 text-slate-500">Body fat uses a measurement-based estimate. For accuracy, book an in-person assessment with a coach.</p>
              <button type="submit" className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-amber-600/20 transition hover:bg-amber-700">
                Show My Results
              </button>
            </form>
          </Reveal>

          <Reveal delay={100}>
            <div ref={resultsRef} className="scroll-mt-24 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm lg:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-amber-600">Results</p>
                  <h2 className="mt-2 text-2xl font-medium text-amber-900">Your transformation snapshot</h2>
                </div>
                <Target className="h-8 w-8 text-amber-600" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {resultCards.map(({ label, value, unit, icon: Icon, note }) => (
                  <div key={label} className="calculator-result-card rounded-2xl p-5">
                    <Icon className="mb-4 h-6 w-6 text-amber-600" />
                    <p className="calculator-result-label text-sm">{label}</p>
                    <p className="calculator-result-value mt-2 text-3xl font-medium">{value} <span className="text-sm">{unit}</span></p>
                    <p className="calculator-result-note mt-2 text-xs">{note}</p>
                  </div>
                ))}
              </div>
              <div className="calculator-plan-card mt-6 rounded-2xl p-5">
                <h3 className="text-lg font-medium">Turn these numbers into a plan</h3>
                <p className="mt-2 text-sm leading-7">
                  Your calculator result is the baseline. Highgrade coaches turn it into weekly training, nutrition targets, progress reviews, and accountability.
                </p>
                <Link to="/booking" className="mt-4 inline-flex rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white">Book Free Assessment</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
};

export default CalculatorsPage;
