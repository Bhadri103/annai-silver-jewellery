import { Star } from "lucide-react";
import { FeatureGrid, PageHero, SEO } from "./highgrade/shared";
import SuccessStoriesPage from "./SuccessStoriesPage";

const SocialProofPage = () => (
  <>
    <SEO title="Social Proof" description="Google Reviews, Instagram feed, YouTube videos, transformation counter, members trained, and years in business." />
    <PageHero title="Social Proof" text="Trust-building content that converts visitors into members." />
    <SuccessStoriesPage />
    <FeatureGrid items={["Google Reviews", "Instagram feed", "YouTube videos", "Client transformation counter", "Members trained", "Years in business"]} icon={Star} />
  </>
);

export default SocialProofPage;
