import { FeatureGrid, PageHero, SEO } from "./highgrade/shared";

const SEOFeaturesPage = () => (
  <>
    <SEO title="SEO Features" description="Highgrade Fitness SEO features including local SEO targeting Nagercoil, schema, mobile speed, and meta tags." />
    <PageHero title="SEO Features" text="Built for local search visibility and long-term Google growth." />
    <FeatureGrid items={["Individual pages for every service", "Local SEO targeting Nagercoil", "Fast loading", "Mobile responsive", "Schema markup", "Meta titles and descriptions"]} />
  </>
);

export default SEOFeaturesPage;
