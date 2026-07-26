import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Calendar, Clock, UserRound } from "lucide-react";
import { websiteApi, type WebsiteBlog } from "../lib/api";
import { blogPosts } from "./highgrade/data";
import { Card, LeadGeneration, Reveal, SEO } from "./highgrade/shared";

const fallbackImage = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85";
const fallbackPost = blogPosts[0];

const formatDate = (value = "") => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Highgrade Guide";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const staticToBlog = (slug?: string): WebsiteBlog => {
  const post = blogPosts.find((item) => item.slug === slug) || fallbackPost;
  return {
    id: post.slug,
    slug: post.slug,
    title: post.title,
    category: post.category,
    excerpt: post.excerpt,
    body: post.sections.map((section) => `${section.heading}\n${section.body}`).join("\n\n"),
    imageUrl: post.image,
    createdAt: post.date,
  };
};

const bodySections = (body = "") => {
  const blocks = body.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  if (!blocks.length) return [];
  return blocks.map((block, index) => {
    const [first, ...rest] = block.split("\n").map((item) => item.trim()).filter(Boolean);
    if (rest.length) return { heading: first, body: rest.join(" ") };
    return { heading: index === 0 ? "Coach note" : "Practical tip", body: first };
  });
};

const BlogDetailPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<WebsiteBlog>(() => staticToBlog(slug));
  const [related, setRelated] = useState<WebsiteBlog[]>([]);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    websiteApi.blog(slug)
      .then((data) => {
        if (!alive) return;
        setPost(data.blog);
        setRelated(data.related || []);
      })
      .catch(() => {
        if (!alive) return;
        setPost(staticToBlog(slug));
        setRelated(blogPosts.filter((item) => item.slug !== slug).slice(0, 3).map((item) => staticToBlog(item.slug)));
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  const sections = useMemo(() => bodySections(post.body), [post.body]);
  const image = post.imageUrl || post.image || fallbackImage;

  return (
    <>
      <SEO title={post.title} description={post.excerpt} />
      <article>
        <section className="bg-white px-4 pt-20 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <Link to="/blog" className="text-sm font-medium text-amber-600">Back to Blog</Link>
              <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-amber-600" /> {formatDate(post.createdAt)}</span>
                <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4 text-amber-600" /> 5 min read</span>
                <span className="inline-flex items-center gap-2"><UserRound className="h-4 w-4 text-amber-600" /> Manoj Coach</span>
              </div>
              <p className="mt-6 inline-flex rounded-full border border-amber-200 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-amber-600">
                {post.category || "Fitness"}
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-medium leading-tight text-amber-900 md:text-6xl">{post.title}</h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">{post.excerpt}</p>
            </Reveal>
            <Reveal delay={120}>
              <img src={image} alt={post.title} className="mt-10 h-[360px] w-full rounded-3xl object-contain shadow-sm md:h-[520px]" />
            </Reveal>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-10">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_320px]">
            <Reveal>
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-10">
                <p className="text-lg leading-9 text-slate-700">
                  At Highgrade Fitness, advice is practical: simple enough to use today and strong enough to support long-term progress.
                </p>
                {sections.map((section) => (
                  <section key={`${section.heading}-${section.body.slice(0, 12)}`} className="mt-10">
                    <h2 className="text-2xl font-medium text-amber-900">{section.heading}</h2>
                    <p className="mt-4 text-base leading-8 text-slate-600">{section.body}</p>
                  </section>
                ))}
                <div className="mt-10 rounded-2xl bg-amber-50 p-6">
                  <h2 className="text-2xl font-medium text-amber-900">Want a plan that fits your life?</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Book a free consultation and Highgrade admin will help you choose the right training, nutrition, and accountability system.
                  </p>
                  <Link to="/booking" className="mt-5 inline-flex rounded-full bg-amber-600 px-6 py-3 text-sm font-medium text-white">
                    Contact a Fitness Expert
                  </Link>
                </div>
              </div>
            </Reveal>
            <aside className="space-y-5">
              <Reveal delay={100}>
                <Card>
                  <h2 className="text-xl font-medium">Related Articles</h2>
                  <div className="mt-5 space-y-4">
                    {related.map((item) => (
                      <Link key={item.slug} to={`/blog/${item.slug}`} className="block border-t border-slate-100 pt-4">
                        <p className="text-sm font-medium leading-6 text-amber-900">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                      </Link>
                    ))}
                  </div>
                </Card>
              </Reveal>
              <Reveal delay={160}>
                <Card>
                  <h2 className="text-xl font-medium">Need Coach Support?</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Get a simple plan for training, nutrition, supplements, and consistency from Highgrade Fitness.
                  </p>
                  <Link to="/booking" className="mt-5 block rounded-full border border-amber-600 px-5 py-3 text-center text-sm font-medium text-amber-900">
                    Book Consultation
                  </Link>
                </Card>
              </Reveal>
            </aside>
          </div>
        </section>
      </article>
      <LeadGeneration />
    </>
  );
};

export default BlogDetailPage;
