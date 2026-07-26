import { BarChart3, FileText, Image, LineChart, UserPlus, Users } from "lucide-react";
import { Card, PageHero, Reveal, SEO, SectionTitle } from "./highgrade/shared";

const adminItems = [
  [UserPlus, "Manage enquiries", "Capture forms, calls, WhatsApp leads, and booking source."],
  [Users, "Membership management", "Track plans, renewals, payments, and attendance."],
  [FileText, "Blog editor", "Publish SEO content for local search growth."],
  [Image, "Gallery management", "Update gym photos, tour media, and transformation images."],
  [LineChart, "Analytics dashboard", "See visits, conversions, leads, and plan demand."],
  [BarChart3, "Lead tracking", "Follow every prospect from first contact to joining."],
];

const AdminDashboardPage = () => (
  <>
    <SEO title="Admin Dashboard" description="Admin dashboard mockup for enquiries, memberships, blog, gallery, analytics, and lead tracking." />
    <PageHero title="Admin Dashboard" text="Management tools for enquiries, memberships, content, analytics, and leads." />
    <section className="px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionTitle title="Admin control center" text="Everything needed to manage leads, content, memberships, and growth from one backend." />
        <div className="grid gap-6 md:grid-cols-3">
          {adminItems.map(([Icon, title, text], index) => (
            <Reveal key={title as string} delay={index * 60}>
              <Card>
                <Icon className="mb-4 h-7 w-7 text-amber-600" />
                <h3 className="font-medium">{title as string}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text as string}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default AdminDashboardPage;
