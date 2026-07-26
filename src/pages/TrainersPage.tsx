import { PageHero, SEO, TrainersPreview } from "./highgrade/shared";

const TrainersPage = () => (
  <>
    <SEO title="Trainers" description="Highgrade Fitness trainers, qualifications, experience, and specializations." />
    <PageHero title="Meet The Trainers" text="Experienced coaches for personal training, fat loss, women's fitness, muscle gain, and performance." />
    <TrainersPreview full />
  </>
);

export default TrainersPage;
