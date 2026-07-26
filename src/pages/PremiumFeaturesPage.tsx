import { Bot, Calendar, MessageCircle, Radio, Rotate3D, Share2 } from "lucide-react";
import { Card, PageHero, Reveal, SEO, SectionTitle } from "./highgrade/shared";

const premiumItems = [
  [Rotate3D, "Virtual gym tour (360)", "Let visitors inspect the facility from home."],
  [MessageCircle, "Live chat", "Capture questions before visitors leave."],
  [Bot, "AI chatbot", "Answer FAQs, prices, timings, and program guidance."],
  [Radio, "WhatsApp click-to-chat", "Move serious leads into instant conversation."],
  [Calendar, "Event registration", "Run challenges, workshops, and community events."],
  [Share2, "Referral system", "Reward members for bringing friends."],
];

const PremiumFeaturesPage = () => (
  <>
    <SEO title="Premium Features" description="Virtual gym tour, live chat, AI chatbot, WhatsApp, event registration, and referral system." />
    <PageHero title="Premium Features" text="Advanced features that can be enabled as Highgrade Fitness grows." />
    <section className="px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionTitle title="Premium growth tools" text="Advanced conversion, support, and community features for the next stage." />
        <div className="grid gap-6 md:grid-cols-3">
          {premiumItems.map(([Icon, title, text], index) => (
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

export default PremiumFeaturesPage;
