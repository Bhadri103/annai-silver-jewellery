import { Clock, Dumbbell, Users } from "lucide-react";
import { Card, PageHero, Reveal, SEO, SectionTitle } from "./highgrade/shared";

const timings = [
  ["Morning Batch", "5:30 AM - 8:30 AM"],
  ["Women's Timing", "10:00 AM - 12:00 PM"],
  ["Evening Batch", "5:00 PM - 9:00 PM"],
  ["Personal Training", "By appointment"],
  ["Senior Fitness", "4:00 PM - 5:00 PM"],
  ["Sunday", "Consultations only"],
];

const TimetablePage = () => (
  <>
    <SEO title="Timetable" description="Highgrade Fitness batch timings, personal training schedule, and women's timings." />
    <PageHero title="Timetable" text="Batch timings, personal training schedule, and dedicated women's timings." />
    <section className="px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
        {timings.map(([title, time], index) => (
          <Reveal key={title} delay={index * 60}>
            <Card>
              <Clock className="mb-4 h-6 w-6 text-amber-600" />
              <h3 className="font-medium">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{time}</p>
            </Card>
          </Reveal>
        ))}
      </div>
      <div className="mx-auto mt-12 max-w-7xl">
        <SectionTitle title="Weekly schedule overview" text="Clear batches for general training, personal training, and women-only sessions." />
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {["Time", "Mon - Fri", "Saturday", "Best For"].map((head) => <th key={head} className="p-4 font-medium">{head}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ["5:30 AM - 8:30 AM", "General fitness + strength", "Conditioning", "Working professionals"],
                ["10:00 AM - 12:00 PM", "Women's fitness", "Women-only open gym", "Women beginners"],
                ["4:00 PM - 5:00 PM", "Senior fitness", "Mobility clinic", "Seniors"],
                ["5:00 PM - 9:00 PM", "Fat loss + muscle building", "Personal training", "All members"],
              ].map((row) => (
                <tr key={row[0]} className="border-t border-slate-100">
                  {row.map((cell) => <td key={cell} className="p-4 text-slate-600">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card><Dumbbell className="mb-3 h-6 w-6 text-amber-600" /><h3 className="font-medium">Personal training schedule</h3><p className="mt-2 text-sm text-slate-600">Booked by appointment with coach availability and member goal matching.</p></Card>
          <Card><Users className="mb-3 h-6 w-6 text-amber-600" /><h3 className="font-medium">Women’s timings</h3><p className="mt-2 text-sm text-slate-600">Dedicated support windows for women who prefer focused batches.</p></Card>
        </div>
      </div>
    </section>
  </>
);

export default TimetablePage;
