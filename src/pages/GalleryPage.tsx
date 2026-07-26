import { useEffect, useState } from "react";
import { Camera, Dumbbell, Image, PlayCircle, Rotate3D, Video } from "lucide-react";
import { Card, PageHero, Reveal, SEO, SectionTitle } from "./highgrade/shared";
import { galleryItems } from "./highgrade/data";
import { websiteApi, type WebsiteGalleryItem } from "../lib/api";

const iconByType = {
  image: Image,
  video: Video,
  tour: Camera,
};

const fallbackGallery: WebsiteGalleryItem[] = galleryItems.map((item, index) => ({
  id: `fallback-${index}`,
  title: item.type,
  category: item.type,
  mediaType: item.type.toLowerCase().includes("video") ? "video" : item.type.toLowerCase().includes("tour") ? "tour" : "image",
  imageUrl: item.image,
  description: "",
  sortOrder: index + 1,
}));

const GalleryPage = () => {
  const [items, setItems] = useState<WebsiteGalleryItem[]>(fallbackGallery);

  useEffect(() => {
    websiteApi.gallery()
      .then((data) => {
        if (data.galleryItems?.length) setItems(data.galleryItems);
      })
      .catch(() => setItems(fallbackGallery));
  }, []);

  const tourItems = items.filter((item) => item.mediaType === "tour");
  const videoItems = items.filter((item) => item.mediaType === "video");

  return (
    <>
      <SEO title="Gallery" description="Highgrade Fitness gym photos, equipment, workout videos, and facility tour." />
      <PageHero title="Gallery & Facility Tour" text="Explore gym photos, equipment, workout videos, and the facility tour." />
      <section className="px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-4">
          {items.map((item, index) => {
            const Icon = item.category.toLowerCase().includes("equipment") ? Dumbbell : iconByType[item.mediaType] || Image;
            return (
              <Reveal key={item.id} delay={index * 80}>
                <Card className="overflow-hidden p-0">
                  <img src={item.imageUrl} alt={item.title} className="h-52 w-full object-contain transition hover:scale-105" />
                  <div className="p-5">
                    <Icon className="mb-3 h-6 w-6 text-amber-600" />
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-600">{item.category}</p>
                    <h3 className="mt-2 font-medium">{item.title}</h3>
                    {item.description && <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>}
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>
        <div className="mx-auto mt-12 max-w-7xl">
          <SectionTitle title="Virtual tour and workout videos" text="A premium gallery section for 360 facility walkthroughs, coaching clips, and equipment previews." />
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal>
              <Card className="min-h-64 bg-amber-700 text-white">
                <Rotate3D className="mb-5 h-9 w-9 text-amber-500" />
                <h2 className="text-2xl font-medium">{tourItems[0]?.title || "360 virtual gym tour"}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">{tourItems[0]?.description || "Embed a 360 walkthrough here so visitors can inspect the facility before booking a consultation."}</p>
              </Card>
            </Reveal>
            <Reveal delay={100}>
              <Card className="min-h-64">
                <PlayCircle className="mb-5 h-9 w-9 text-amber-600" />
                <h2 className="text-2xl font-medium">{videoItems[0]?.title || "Workout video collection"}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{videoItems[0]?.description || "Show form tips, class energy, trainer introductions, and transformation reels in a fast-loading layout."}</p>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
};

export default GalleryPage;
