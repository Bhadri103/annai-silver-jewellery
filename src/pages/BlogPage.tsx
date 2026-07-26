import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { websiteApi, type WebsiteBlog } from "../lib/api";
import { Card, PageHero, Reveal, SEO } from "./highgrade/shared";
import { blogPosts } from "./highgrade/data";

type BlogCard = {
  slug: string;
  title: string;
  author: string;
  date: string;
  time: string;
  category: string;
  image: string;
  excerpt: string;
};

const fallbackPosts: BlogCard[] = blogPosts.map((post) => ({
  slug: post.slug,
  title: post.title,
  author: post.author,
  date: post.date,
  time: post.time,
  category: post.category,
  image: post.image,
  excerpt: post.excerpt,
}));

const formatDate = (value = "") => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Highgrade Guide";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const mapApiBlog = (post: WebsiteBlog): BlogCard => ({
  slug: post.slug,
  title: post.title,
  author: "Manoj Coach",
  date: formatDate(post.createdAt),
  time: "5 min read",
  category: post.category || "Fitness",
  image: post.imageUrl || post.image || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85",
  excerpt: post.excerpt,
});

const BlogPage = () => {
  const [posts, setPosts] = useState<BlogCard[]>(fallbackPosts);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    websiteApi.blogs("page=1&limit=80")
      .then((data) => {
        if (!alive) return;
        const nextPosts = (data.blogs || []).map(mapApiBlog);
        if (nextPosts.length) setPosts(nextPosts);
      })
      .catch(() => {
        if (alive) setPosts(fallbackPosts);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(posts.map((post) => post.category).filter(Boolean)))], [posts]);
  const filteredPosts = category === "All" ? posts : posts.filter((post) => post.category === category);

  return (
    <>
      <SEO title="Blog" description="Highgrade Fitness blog: fat loss, nutrition, workout guides, mobility, and injury prevention." />
      <PageHero title="Fitness Blog" text="Useful articles for diet, training, recovery, supplements, and stronger daily habits." />
      <section className="px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex gap-3 overflow-x-auto pb-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-full border px-5 py-2 text-sm font-semibold transition ${
                  category === item ? "border-amber-600 bg-amber-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:text-amber-600"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          {loading && <p className="mb-5 text-sm text-slate-500">Loading latest blog posts...</p>}
          <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {filteredPosts.map((post, index) => (
              <Reveal key={post.slug} delay={index * 45}>
                <Card className="h-full overflow-hidden p-0">
                  <Link to={`/blog/${post.slug}`} className="group block">
                    <div className="relative h-56 overflow-hidden bg-amber-700">
                      <img src={post.image} alt={post.title} className="h-full w-full object-contain transition duration-500 group-hover:scale-105" />
                      <div className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-600 shadow-sm">{post.category}</div>
                    </div>
                  </Link>
                  <div className="p-6">
                    <div className="mb-4 flex flex-wrap gap-4 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-amber-600" /> {post.date}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-amber-600" /> {post.time}</span>
                      <span className="inline-flex items-center gap-1"><UserRound className="h-3.5 w-3.5 text-amber-600" /> {post.author}</span>
                    </div>
                    <Link to={`/blog/${post.slug}`} className="group">
                      <h3 className="text-xl font-medium leading-7 text-amber-900 transition group-hover:text-amber-600">{post.title}</h3>
                    </Link>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{post.excerpt}</p>
                    <Link to={`/blog/${post.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-amber-600">
                      Read More <span className="h-px w-8 bg-amber-600" />
                    </Link>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default BlogPage;
