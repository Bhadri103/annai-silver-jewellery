import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Camera, CreditCard, Dumbbell, Heart, Lock, LogOut, PackageCheck, UserRound } from "lucide-react";
import { Card, PageHero, Reveal, SEO, SectionTitle } from "./highgrade/shared";

const portalItems = [
  [UserRound, "Profile", "Manage contact details", "/profile"],
  [PackageCheck, "Orders", "Track product purchases", "/my-orders"],
  [Heart, "Wishlist", "Saved supplement products", "/wishlist"],
  [Dumbbell, "Workout plans", "Assigned plans and coach notes"],
  [Camera, "Progress photos", "Monthly transformation tracking"],
  [CreditCard, "Payment history", "Receipts and renewal reminders"],
];

const MemberPortalPage = () => {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("highgrade_user_profile") || "null");
    } catch {
      return null;
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("highgrade_user_token");
    localStorage.removeItem("highgrade_user_profile");
    window.location.href = "/login";
  };

  return (
    <>
      <SEO title="Member Portal" description="Highgrade member portal with login, workout plans, progress photos, attendance, diet plans, and payment history." />
      <PageHero title="Member Portal" text={user ? `Welcome back, ${user.name}. Your member workspace is ready.` : "Login to access workout plans, progress photos, attendance, diet plans, and payment history."} />
      <section className="px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <SectionTitle title={user ? "Member dashboard" : "Member access required"} text={user ? "A clean member portal for retention, coaching, and progress visibility." : "Create an account or login to open your Highgrade member dashboard."} />
            {user ? (
              <button onClick={logout} className="inline-flex items-center gap-2 rounded-full border border-amber-500 px-5 py-2.5 text-sm font-semibold text-amber-600 transition hover:bg-amber-600 hover:text-white">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            ) : (
              <div className="flex gap-3">
                <Link to="/login" className="rounded-full border border-amber-500 px-5 py-2.5 text-sm font-semibold text-amber-600 transition hover:bg-amber-600 hover:text-white">Login</Link>
                <Link to="/register" className="rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-900/20">Register</Link>
              </div>
            )}
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {portalItems.map(([Icon, title, text, href], index) => (
              <Reveal key={title as string} delay={index * 60}>
                <Card className={!user ? "opacity-70" : ""}>
                  <Icon className="mb-4 h-7 w-7 text-amber-600" />
                  <h3 className="font-medium">{title as string}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text as string}</p>
                  {user && href ? (
                    <Link to={href as string} className="mt-5 inline-flex text-sm font-semibold text-amber-600">
                      Open
                    </Link>
                  ) : null}
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default MemberPortalPage;
