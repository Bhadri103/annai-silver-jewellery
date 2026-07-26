import { PageHero, ProgramsOverview, SEO } from "./highgrade/shared";

const ProgramsPage = () => (
  <>
    <SEO title="Programs" description="Highgrade Fitness programs for fat loss, muscle building, personal training, women, seniors, sports performance, and online coaching." />
    <PageHero title="Fitness Programs" text="Choose a dedicated page for your goal and see how Highgrade Fitness can help." />
    <ProgramsOverview />
  </>
);

export default ProgramsPage;
