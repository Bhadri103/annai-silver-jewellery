import { MembershipPlans, PageHero, SEO } from "./highgrade/shared";

const MembershipPage = () => (
  <>
    <SEO title="Membership Plans" description="Monthly, quarterly, half-yearly, and annual Highgrade Fitness membership plans." />
    <PageHero title="Membership Plans" text="Compare memberships and join the plan that fits your training consistency." />
    <MembershipPlans />
  </>
);

export default MembershipPage;
