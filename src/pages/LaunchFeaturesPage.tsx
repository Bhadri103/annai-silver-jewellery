import { Target } from "lucide-react";
import { FeatureGrid, PageHero, SEO } from "./highgrade/shared";

const LaunchFeaturesPage = () => (
  <>
    <SEO title="Launch Features" description="High-priority launch features for Highgrade Fitness professional website." />
    <PageHero title="High-Priority Launch Features" text="The focused first version that helps convert visitors into paying members." />
    <FeatureGrid
      items={[
        "Home",
        "About",
        "Programs",
        "Membership Plans",
        "Trainers",
        "Success Stories",
        "Gallery",
        "Contact + Google Maps",
        "WhatsApp & Call buttons",
        "Enquiry form",
        "Google Reviews",
        "Blog",
        "Mobile-friendly design",
        "Fast loading",
        "SEO optimization",
      ]}
      icon={Target}
    />
  </>
);

export default LaunchFeaturesPage;
