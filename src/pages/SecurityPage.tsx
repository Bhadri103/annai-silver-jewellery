import { Shield } from "lucide-react";
import { FeatureGrid, PageHero, SEO } from "./highgrade/shared";

const SecurityPage = () => (
  <>
    <SEO title="Security & Performance" description="SSL, backups, spam protection, fast hosting, and performance optimization for Highgrade Fitness." />
    <PageHero title="Security & Performance" text="Launch-ready security and performance requirements." />
    <FeatureGrid items={["SSL certificate", "Daily backup", "Spam protection", "Fast hosting", "Performance optimization", "Mobile speed checks"]} icon={Shield} />
  </>
);

export default SecurityPage;
