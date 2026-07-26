import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, Loader2, Lock, Mail, Phone, UserRound } from "lucide-react";
import logo from "../assets/logo.png";
import heroEditorial from "../assets/jewellery/hero-editorial.png";
import { websiteApi, type WebsiteUser } from "../lib/api";
import { clean, isEmail, isName, isPhone, limitPhoneDigits, maxLength, minLength, phoneDigits } from "../lib/validation";
import { SEO } from "../components/JewelleryUI";

type AuthMode = "login" | "register" | "forgot";
type FormErrors = Record<string, string>;

const userTokenKey = "annai_user_token";
const userProfileKey = "annai_user_profile";

const saveUserSession = (user: WebsiteUser) => {
  localStorage.setItem(userTokenKey, user.token);
  localStorage.setItem(userProfileKey, JSON.stringify(user));
  window.dispatchEvent(new Event("annai-user-session"));
};

const Input = ({
  icon,
  error,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: ReactNode; error?: string }) => (
  <label className="block">
    <div className={`flex items-center gap-2.5 rounded-xl border bg-white px-3 py-2 transition focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10 sm:px-4 sm:py-2.5 ${error ? "border-amber-500" : "border-slate-200"} ${className}`}>
      <span className="text-amber-600">{icon}</span>
      <input {...props} aria-invalid={Boolean(error)} className="w-full bg-transparent text-sm text-amber-900 outline-none placeholder:text-slate-400" />
    </div>
    {error && <p className="mt-1.5 text-xs font-medium text-amber-600">{error}</p>}
  </label>
);

const AuthPage = ({ initialMode }: { initialMode?: AuthMode }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>(initialMode || (searchParams.get("mode") === "register" ? "register" : "login"));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    otp: "",
    plan: "Website Member",
    goal: "",
  });

  const update = (patch: Partial<typeof form>) => {
    setForm((current) => ({ ...current, ...patch }));
    setErrors({});
    setMessage("");
  };

  const validateRegister = () => {
    const next: FormErrors = {};
    if (!isName(form.name)) next.name = "Enter a valid name.";
    if (!isEmail(form.email) || !clean(form.email)) next.email = "Enter a valid email address.";
    if (!isPhone(form.phone)) next.phone = "Enter a valid 10 digit mobile number.";
    if (!minLength(form.password, 6)) next.password = "Password must be at least 6 characters.";
    else if (!maxLength(form.password, 72)) next.password = "Password must be 72 characters or less.";
    if (form.confirmPassword !== form.password) next.confirmPassword = "Passwords do not match.";
    if (!maxLength(form.goal, 120)) next.goal = "Goal must be 120 characters or less.";
    return next;
  };

  const validatePasswordLogin = () => {
    const next: FormErrors = {};
    if (!clean(form.email)) next.email = "Enter your email or phone number.";
    if (!minLength(form.password, 6)) next.password = "Enter your password.";
    return next;
  };

  const validateOtpEmail = () => {
    const next: FormErrors = {};
    if (!isEmail(form.email) || !clean(form.email)) next.email = "Enter the email used during registration.";
    return next;
  };

  const validateReset = () => {
    const next = validateOtpEmail();
    if (!/^\d{6}$/.test(clean(form.otp))) next.otp = "Enter the 6 digit OTP.";
    if (!minLength(form.password, 6)) next.password = "New password must be at least 6 characters.";
    else if (!maxLength(form.password, 72)) next.password = "Password must be 72 characters or less.";
    if (form.confirmPassword !== form.password) next.confirmPassword = "Passwords do not match.";
    return next;
  };

  const handleSuccess = (user: WebsiteUser, text: string) => {
    saveUserSession(user);
    setMessage(text);
    window.setTimeout(() => navigate("/profile"), 400);
  };

  const submit = async () => {
    const next = mode === "register" ? validateRegister() : mode === "forgot" ? validateOtpEmail() : validatePasswordLogin();
    if (Object.keys(next).length) {
      setErrors(next);
      setMessage(Object.values(next)[0]);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      if (mode === "register") {
        const user = await websiteApi.register({
          name: clean(form.name),
          email: clean(form.email).toLowerCase(),
          phone: phoneDigits(form.phone),
          password: form.password,
          plan: form.plan,
          goal: clean(form.goal),
        });
        handleSuccess(user, "Registration successful. Opening member portal...");
      } else if (mode === "forgot") {
        const data = await websiteApi.forgotPassword({ email: clean(form.email).toLowerCase() });
        setMessage(data.devOtp ? `${data.message} Dev OTP: ${data.devOtp}` : data.message);
      } else {
        if (clean(form.email).toLowerCase() === "bhadri@guvihost.com" && form.password === "bhadri") {
          handleSuccess({ id: "demo-bhadri", name: "Bhadri", email: "bhadri@guvihost.com", phone: "9751229418", plan: "Annai Customer", goal: "Silver jewellery", address: "Padmanabhapuram, Tamil Nadu", token: "demo-bhadri-token" }, "Login successful. Opening your profile...");
          return;
        }
        const user = await websiteApi.login({ loginIdentifier: clean(form.email), password: form.password });
        handleSuccess(user, "Login successful. Opening your profile...");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const next = validateOtpEmail();
    if (!/^\d{6}$/.test(clean(form.otp))) next.otp = "Enter the 6 digit OTP.";
    if (Object.keys(next).length) {
      setErrors(next);
      setMessage(Object.values(next)[0]);
      return;
    }
    setLoading(true);
    try {
      const user = await websiteApi.verifyOtp({ email: clean(form.email).toLowerCase(), otp: clean(form.otp) });
      handleSuccess(user, "OTP verified. Opening member portal...");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    const next = validateReset();
    if (Object.keys(next).length) {
      setErrors(next);
      setMessage(Object.values(next)[0]);
      return;
    }
    setLoading(true);
    try {
      const user = await websiteApi.resetPassword({ email: clean(form.email).toLowerCase(), otp: clean(form.otp), password: form.password });
      handleSuccess(user, "Password reset successful. Opening member portal...");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title={mode === "register" ? "Create Account" : mode === "forgot" ? "Reset Password" : "Customer Login"} description="Login or create your Annai Jewellery customer account." />
      <section className="bg-[#fbf8f1] px-4 pb-7 pt-[92px] text-amber-900 sm:px-6 sm:pb-14 sm:pt-28 lg:px-10">
        <div className="mx-auto grid max-w-sm overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-[0_18px_50px_rgba(130,91,24,0.11)] sm:max-w-md xl:max-w-4xl xl:grid-cols-[0.88fr_1.12fr] xl:rounded-[2rem]">
          <div className="relative h-28 overflow-hidden sm:h-40 xl:block xl:h-auto xl:min-h-[570px]">
            <img src={heroEditorial} alt="Annai Jewellery collection" className="absolute inset-0 h-full w-full object-cover object-center" loading="eager" fetchPriority="high"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent"/>
            <div className="absolute inset-x-0 bottom-0 hidden p-8 text-white xl:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-amber-300">The Annai Privilege</p>
              <h2 className="mt-3 text-3xl font-medium !text-white" style={{color:"#fff"}}>Your jewellery journey, beautifully remembered.</h2>
              <p className="mt-3 text-sm leading-7 !text-white/85" style={{color:"rgba(255,255,255,.88)"}}>Save favourites, manage orders and enjoy a faster, more personal shopping experience.</p>
            </div>
            <div className="absolute inset-x-0 bottom-5 text-center text-white xl:hidden"><p className="text-[8px] font-bold uppercase tracking-[0.25em] text-amber-300">Annai Jewellery</p><h2 className="mt-1 text-base font-medium !text-white sm:text-xl" style={{color:"#fff"}}>Your precious world, saved.</h2></div>
          </div>

          <div className="relative -mt-4 flex min-w-0 items-center justify-center rounded-t-3xl bg-white p-4 pt-5 sm:-mt-6 sm:p-7 sm:pt-7 xl:mt-0 xl:rounded-none xl:p-8">
          <div className="w-full max-w-md">
            <Link to="/" className="mb-2 flex justify-center"><img src={logo} alt="Annai Jewellery" className="h-9 w-auto object-contain sm:h-12" /></Link>
            <div className="mb-3 text-center sm:mb-5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-600 sm:text-[10px]">Annai Customer Account</p>
              <h1 className="mt-1 text-xl font-semibold sm:text-2xl">
                {mode === "register" ? "Create Account" : mode === "forgot" ? "Reset Password" : "Login"}
              </h1>
              <p className="mx-auto mt-1.5 max-w-xs text-xs leading-5 text-slate-500 sm:text-sm">
                {mode === "forgot" ? "Enter your email to securely reset your password." : mode === "register" ? "Save favourites and enjoy a faster checkout." : "Welcome back. Login with your password."}
              </p>
            </div>

            <div className="mx-auto mb-3 flex max-w-[240px] rounded-full border border-amber-100 bg-[#fbf8f1] p-1 sm:mb-5 sm:max-w-[260px]">
              {(["login", "register"] as AuthMode[]).map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setMode(item);
                    setErrors({});
                    setMessage("");
                  }}
                  className={`flex-1 rounded-full px-4 py-2 text-xs font-semibold transition ${mode === item ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:text-amber-600"}`}
                >
                  {item === "login" ? "Login" : "Register"}
                </button>
              ))}
            </div>

            <div className={`grid gap-2.5 sm:gap-3 ${mode === "register" ? "sm:grid-cols-2" : ""}`}>
              {mode === "register" && (
                <Input icon={<UserRound className="h-4 w-4" />} placeholder="Full name" value={form.name} error={errors.name} onChange={(e) => update({ name: e.target.value })} />
              )}
              <Input icon={<Mail className="h-4 w-4" />} placeholder={mode === "login" ? "Email or phone number" : "Email address"} value={form.email} error={errors.email} onChange={(e) => update({ email: e.target.value })} />
              {mode === "register" && (
                <Input icon={<Phone className="h-4 w-4" />} placeholder="Phone number" value={form.phone} error={errors.phone} onChange={(e) => update({ phone: limitPhoneDigits(e.target.value) })} />
              )}
              {(mode === "register" || mode === "forgot" || mode === "login") && (
                <Input icon={<Lock className="h-4 w-4" />} placeholder="Password" type="password" value={form.password} error={errors.password} onChange={(e) => update({ password: e.target.value })} onKeyDown={(e) => e.key === "Enter" && submit()} />
              )}
              {(mode === "register" || mode === "forgot") && (
                <>
                  <Input icon={<Lock className="h-4 w-4" />} placeholder="Confirm password" type="password" value={form.confirmPassword} error={errors.confirmPassword} onChange={(e) => update({ confirmPassword: e.target.value })} />
                  {mode === "register" && <Input icon={<KeyRound className="h-4 w-4" />} placeholder="Jewellery preference" value={form.goal} error={errors.goal} onChange={(e) => update({ goal: e.target.value })} />}
                </>
              )}
              {mode === "forgot" && (
                <Input icon={<KeyRound className="h-5 w-5" />} placeholder="6 digit OTP" inputMode="numeric" maxLength={6} value={form.otp} error={errors.otp} onChange={(e) => update({ otp: e.target.value.replace(/\D/g, "").slice(0, 6) })} onKeyDown={(e) => e.key === "Enter" && verifyOtp()} />
              )}
            </div>

            {message && (
              <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${message.toLowerCase().includes("successful") || message.toLowerCase().includes("sent") || message.toLowerCase().includes("generated") ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                {message}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:mt-5">
              <button
                disabled={loading}
                onClick={submit}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-600 px-6 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-amber-700 disabled:opacity-60 sm:px-7 sm:py-2.5 sm:text-sm"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "register" ? "Create Account" : mode === "forgot" ? "Send Reset OTP" : "Login"}
              </button>
              {mode === "forgot" && (
                <button disabled={loading} onClick={resetPassword} className="rounded-full border border-amber-500 px-5 py-2.5 text-sm font-semibold text-amber-600 transition hover:bg-amber-600 hover:text-white disabled:opacity-60">
                  Reset Password
                </button>
              )}
            </div>

            <p className="mt-4 text-center text-xs text-slate-500 sm:text-sm">
              {mode === "login" ? "New to Annai?" : "Already have an account?"}{" "}
              <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="font-semibold text-amber-600">
                {mode === "login" ? "Create account" : "Login"}
              </button>
            </p>
            {mode === "login" && (
              <p className="mt-2 text-center text-xs sm:text-sm">
                <button onClick={() => { setMode("forgot"); setErrors({}); setMessage(""); }} className="font-semibold text-amber-600">
                  Forgot password?
                </button>
              </p>
            )}
            {mode === "login" && <div className="mt-3 text-center"><button type="button" onClick={() => update({ email: "bhadri@guvihost.com", password: "bhadri" })} className="rounded-full border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2 text-[10px] text-slate-600 sm:px-4 sm:text-[11px]"><strong className="text-amber-700">Use demo</strong> &nbsp; bhadri@guvihost.com / bhadri</button></div>}
            <p className="mt-3 text-center text-xs text-slate-400">
              <Link to="/" className="hover:text-amber-600">Back to website</Link>
            </p>
          </div></div>
        </div>
      </section>
    </>
  );
};

export default AuthPage;
