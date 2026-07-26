import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ExternalLink, Heart, Info, MoreVertical, PlayCircle, Quote, Search, Send, Share2, Star, Trophy } from "lucide-react";
import { Card, Reveal, ReviewStars, SectionTitle } from "./highgrade/shared";
import { websiteApi, type WebsiteTestimonial } from "../lib/api";
import { clean, isName, isRating, maxLength, minLength } from "../lib/validation";
import { googleReviews } from "../data/googleReviews";

const stories = [
  {
    title: "Lost 18 kg in 6 months",
    name: "Arun Kumar",
    text: "The coach adjusted my workouts every month and kept my nutrition simple. I finally stayed consistent.",
    image: "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=700&q=85",
  },
  {
    title: "Built strength after 40",
    name: "Priya Menon",
    text: "The women-friendly batches helped me train confidently. My strength and posture improved fast.",
    image: "https://images.unsplash.com/photo-1609899464726-209befaac5f2?auto=format&fit=crop&w=700&q=85",
  },
  {
    title: "Improved sports performance",
    name: "Rahul S",
    text: "The speed, mobility, and strength sessions made a visible difference in match fitness.",
    image: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=700&q=85",
  },
];

const reviewUrl = "https://www.google.com/search?q=HIGH+GRADE+FITNESS+STUDIO+UNISEX+Google+reviews";
const pageSizeOptions = [12, 24, 48, 96];
const ratingOptions = [5, 4, 3, 2, 1] as const;
const sortOptions = [
  { id: "relevant", label: "Most relevant" },
  { id: "newest", label: "Newest" },
  { id: "highest", label: "Highest" },
  { id: "lowest", label: "Lowest" },
];
const topicChips = [
  { label: "All", value: "", count: "" },
  { label: "diet plan", value: "diet plan", count: "33" },
  { label: "friendly coach", value: "friendly coach", count: "20" },
  { label: "trainer", value: "trainer", count: "87" },
  { label: "workout plan", value: "workout plan", count: "16" },
  { label: "+6", value: "", count: "" },
];

const emptySummary = {
  total: 0,
  average: 0,
  distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<1 | 2 | 3 | 4 | 5, number>,
};

const ratingLabel = (rating: number) => `${rating.toFixed(1).replace(".0", "")} star`;
const cleanReviewText = (text: string) => text.trim();
const localReviewItems: WebsiteTestimonial[] = googleReviews.map((review, index) => ({
  id: review.id || `local-review-${index}`,
  name: review.name,
  role: "Google Review",
  rating: review.rating,
  text: review.text,
  imageUrl: review.avatar,
  source: review.source,
  sourceId: review.id,
  authorMeta: review.meta,
  reviewDate: review.date,
  isVisible: true,
}));

const localReviewStats = (items: WebsiteTestimonial[]) => {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
  items.forEach((item) => {
    const rating = Math.min(Math.max(Math.round(Number(item.rating || 5)), 1), 5) as 1 | 2 | 3 | 4 | 5;
    distribution[rating] += 1;
  });
  const total = items.length;
  const average = total ? Number((items.reduce((sum, item) => sum + Number(item.rating || 0), 0) / total).toFixed(4)) : 0;
  return { total, average, distribution };
};

const localReviewPage = (page: number, limit: number, search: string, rating: string, sort: string) => {
  const term = search.trim().toLowerCase();
  let items = localReviewItems.filter((item) => {
    const matchesSearch = !term || `${item.name} ${item.authorMeta || ""} ${item.text}`.toLowerCase().includes(term);
    const matchesRating = rating === "all" || Math.round(Number(item.rating || 0)) === Number(rating);
    return matchesSearch && matchesRating;
  });
  if (sort === "highest") items = [...items].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  if (sort === "lowest") items = [...items].sort((a, b) => Number(a.rating || 0) - Number(b.rating || 0));
  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const safePage = Math.min(Math.max(page, 1), totalPages);
  return {
    testimonials: items.slice((safePage - 1) * limit, safePage * limit),
    total,
    totalPages,
    stats: localReviewStats(localReviewItems),
  };
};

const SuccessStoriesPage = () => {
  const [reviews, setReviews] = useState<WebsiteTestimonial[]>([]);
  const [reviewQuery, setReviewQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [pageSize, setPageSize] = useState(24);
  const [sort, setSort] = useState("relevant");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [reviewSummary, setReviewSummary] = useState(emptySummary);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [reviewErrors, setReviewErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: "", rating: 5, text: "" });

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize), sort });
    if (reviewQuery.trim()) params.set("search", reviewQuery.trim());
    if (ratingFilter !== "all") params.set("rating", ratingFilter);
    setLoading(true);
    websiteApi.testimonials(params.toString())
      .then((data) => {
        setReviews(data.testimonials || []);
        setTotal(Number(data.total || 0));
        setTotalPages(Math.max(Number(data.totalPages || 1), 1));
        if (data.stats) setReviewSummary(data.stats);
      })
      .catch(() => {
        const fallback = localReviewPage(page, pageSize, reviewQuery, ratingFilter, sort);
        setReviews(fallback.testimonials);
        setTotal(fallback.total);
        setTotalPages(fallback.totalPages);
        setReviewSummary(fallback.stats);
        setStatus("Showing saved Google reviews while the live review API reconnects.");
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, ratingFilter, reviewQuery, sort]);

  const reviewStats = useMemo(() => {
    const written = reviews.filter((review) => {
      const text = cleanReviewText(review.text || "");
      return text && text !== "Rating-only Google review.";
    }).length;
    return { written };
  }, [reviews]);

  const updateQuery = (value: string) => {
    setReviewQuery(value);
    setPage(1);
  };

  const updateRating = (value: string) => {
    setRatingFilter(value);
    setPage(1);
  };

  const updatePageSize = (value: string) => {
    setPageSize(Number(value));
    setPage(1);
  };

  const updateSort = (value: string) => {
    setSort(value);
    setPage(1);
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!isName(reviewForm.name)) nextErrors.name = "Enter a valid name.";
    if (!isRating(reviewForm.rating)) nextErrors.rating = "Choose a rating between 1 and 5.";
    if (!minLength(reviewForm.text, 12)) nextErrors.text = "Write at least 12 characters for the review.";
    else if (!maxLength(reviewForm.text, 1200)) nextErrors.text = "Review must be 1200 characters or less.";
    setReviewErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    setStatus("Publishing review...");
    try {
      await websiteApi.createTestimonial({
        name: clean(reviewForm.name),
        role: "Highgrade Client",
        rating: reviewForm.rating,
        text: clean(reviewForm.text),
      });
      setReviewForm({ name: "", rating: 5, text: "" });
      setReviewErrors({});
      setPage(1);
      setReviewQuery("");
      setRatingFilter("all");
      setSort("newest");
      setStatus("Review added. Thank you for sharing your Highgrade experience.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to add review.");
    } finally {
      setSubmitting(false);
    }
  };

  const maxRatingCount = Math.max(...ratingOptions.map((rating) => reviewSummary.distribution[rating]), 1);

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionTitle kicker="Social Proof" title="Success stories and Google reviews" text="Client transformations, website reviews, and saved Google reviews loaded from the Highgrade database." />
        <div className="grid gap-6 md:grid-cols-3">
          {stories.map((story, index) => (
            <Reveal key={story.title} delay={index * 80}>
              <Card className="overflow-hidden p-0">
                <div className="relative">
                  <img src={story.image} alt={`${story.name} transformation`} className="h-56 w-full object-contain" />
                  <div className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-600 shadow-sm">Before / After</div>
                </div>
                <div className="p-5">
                  <Trophy className="mb-4 h-7 w-7 text-amber-600" />
                  <h3 className="font-medium">{story.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{story.name}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{story.text}</p>
                  <ReviewStars />
                </div>
              </Card>
            </Reveal>
          ))}
        </div>

        <div id="write-review" className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <Reveal>
            <Card className="h-full">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600 text-white">
                <Quote className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-medium">Add your review</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">Share your Highgrade experience directly on the website. Your review is saved in the admin panel.</p>
              <form onSubmit={submitReview} className="mt-6 grid gap-3">
                <div><input required minLength={2} maxLength={80} pattern="[A-Za-z][A-Za-z .'-]{1,79}" value={reviewForm.name} onChange={(event) => { setReviewForm((current) => ({ ...current, name: event.target.value })); setReviewErrors((current) => ({ ...current, name: "" })); }} placeholder="Your name" className={`w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500 ${reviewErrors.name ? "border-amber-500" : ""}`} />{reviewErrors.name && <p className="mt-1 text-xs text-amber-600">{reviewErrors.name}</p>}</div>
                <div className="flex flex-wrap gap-2">
                  {ratingOptions.map((rating) => (
                    <button key={rating} type="button" onClick={() => setReviewForm((current) => ({ ...current, rating }))} className={`inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-medium ${reviewForm.rating === rating ? "border-amber-600 bg-amber-600 text-white" : "border-slate-200 text-slate-700"}`}>
                      {rating} <Star className="h-4 w-4 fill-current" />
                    </button>
                  ))}
                </div>
                {reviewErrors.rating && <p className="text-xs text-amber-600">{reviewErrors.rating}</p>}
                <div><textarea required minLength={12} maxLength={1200} value={reviewForm.text} onChange={(event) => { setReviewForm((current) => ({ ...current, text: event.target.value })); setReviewErrors((current) => ({ ...current, text: "" })); }} placeholder="Write your review" className={`min-h-32 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500 ${reviewErrors.text ? "border-amber-500" : ""}`} />{reviewErrors.text && <p className="mt-1 text-xs text-amber-600">{reviewErrors.text}</p>}</div>
                <button disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70">
                  <Send className="h-4 w-4" /> {submitting ? "Submitting..." : "Submit Review"}
                </button>
                {status && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-slate-700">{status}</p>}
              </form>
            </Card>
          </Reveal>

          <Reveal delay={100}>
            <Card className="h-full">
              <Quote className="mb-5 h-8 w-8 text-amber-600" />
              <h3 className="text-xl font-medium">Write on Google</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">The saved Google reviews are stored in the database. New clients can also open Google directly to leave a fresh public review.</p>
              <ReviewStars />
              <a href={reviewUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-3 text-sm font-medium text-white">
                Open Google Reviews <ExternalLink className="h-4 w-4" />
              </a>
            </Card>
          </Reveal>
        </div>

        <Card className="review-card mt-8">
            <div className="review-divider flex flex-col gap-4 border-b border-slate-100 pb-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h3 className="text-2xl font-medium">Reviews</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">Google-style review tools using Highgrade theme colors.</p>
              </div>
              <a href="#write-review" className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700">Write a review</a>
            </div>

            <div className="review-divider grid gap-8 border-b border-slate-100 py-6 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-center">
              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-lg font-medium text-amber-900">Google review summary <Info className="h-4 w-4 text-slate-400" /></h4>
                {ratingOptions.map((rating) => {
                  const count = reviewSummary.distribution[rating] || 0;
                  const width = `${Math.max((count / maxRatingCount) * 100, count ? 4 : 0)}%`;
                  return (
                    <button key={rating} onClick={() => updateRating(String(rating))} className="grid w-full grid-cols-[18px_minmax(0,1fr)_38px] items-center gap-3 text-left text-sm text-slate-600">
                      <span>{rating}</span>
                      <span className="h-2.5 overflow-hidden rounded-full bg-slate-200"><span className="block h-full rounded-full bg-amber-600" style={{ width }} /></span>
                      <span className="text-right text-xs text-slate-500">{count}</span>
                    </button>
                  );
                })}
              </div>
              <div className="text-left lg:text-center">
                <p className="text-6xl font-light leading-none text-slate-700">{reviewSummary.average.toFixed(1)}</p>
                <div className="mt-4 flex gap-1 text-amber-500 lg:justify-center">
                  {Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`h-5 w-5 ${index < Math.round(reviewSummary.average) ? "fill-current" : "text-slate-200"}`} />)}
                </div>
                <p className="mt-2 text-sm text-slate-500">{reviewSummary.total || total} reviews</p>
              </div>
            </div>

            <div className="review-divider border-b border-slate-100 py-5">
              <div className="scrollbar-hide -mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1">
                {topicChips.map((chip) => (
                  <button key={chip.label} onClick={() => updateQuery(chip.value)} className={`shrink-0 whitespace-nowrap rounded-full border px-5 py-2.5 text-sm font-semibold transition ${(chip.label === "All" ? reviewQuery === "" : reviewQuery === chip.value && chip.value !== "") ? "border-amber-600 bg-amber-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-amber-200 hover:text-amber-600"}`}>
                    {chip.label}{chip.count && <span className="ml-2 font-normal opacity-75">{chip.count}</span>}
                  </button>
                ))}
              </div>
              <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_150px_150px]">
                <label className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500" />
                  <input value={reviewQuery} onChange={(event) => updateQuery(event.target.value)} placeholder="Search reviews..." className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-amber-500" />
                </label>
                <select value={ratingFilter} onChange={(event) => updateRating(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-amber-500">
                  <option value="all">All ratings</option>
                  {ratingOptions.map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
                </select>
                <select value={pageSize} onChange={(event) => updatePageSize(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-amber-500">
                  {pageSizeOptions.map((size) => <option key={size} value={size}>{size} per page</option>)}
                </select>
              </div>
            </div>

            <div className="py-5">
              <p className="text-sm font-medium text-slate-500">Sort by</p>
              <div className="scrollbar-hide -mx-1 mt-3 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1">
                {sortOptions.map((option) => (
                  <button key={option.id} onClick={() => updateSort(option.id)} className={`shrink-0 whitespace-nowrap rounded-full border px-5 py-2.5 text-sm font-semibold transition ${sort === option.id ? "border-amber-600 bg-amber-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-amber-200 hover:text-amber-600"}`}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="review-list divide-y divide-slate-100">
              {reviews.map((review) => {
                const text = cleanReviewText(review.text || "");
                const isRatingOnly = !text || text === "Rating-only Google review.";
                const rating = Number(review.rating || 5);
                return (
                  <article key={review.id} className="py-6">
                    <div className="flex items-start gap-3">
                      {review.imageUrl ? (
                        <img src={review.imageUrl} alt={review.name} className="h-12 w-12 rounded-full object-contain" loading="lazy" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-sm font-semibold text-amber-600">{review.name.slice(0, 1)}</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-amber-900">{review.name}</p>
                        <p className="truncate text-xs text-slate-500">{review.authorMeta || review.role || "Highgrade Client"}</p>
                      </div>
                      <button className="rounded-full p-2 text-slate-400 transition hover:bg-slate-50 hover:text-amber-600" aria-label={`More options for ${review.name}`}>
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-amber-500" aria-label={ratingLabel(rating)}>
                      {Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`h-4 w-4 ${index < Math.round(rating) ? "fill-current" : "text-slate-200"}`} />)}
                      <span className="text-sm text-slate-500">{review.reviewDate || review.createdAt || review.source || "Review"}</span>
                      {review.source === "Website" && <span className="rounded-md border border-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-600">NEW</span>}
                    </div>
                    <p className="mt-4 max-w-5xl text-sm leading-7 text-slate-700">{isRatingOnly ? "Rating-only review." : text}</p>
                    <div className="mt-5 flex items-center gap-6 text-sm text-slate-500">
                      <button className="inline-flex items-center gap-2 transition hover:text-amber-600"><Heart className="h-5 w-5" /> Hover to react</button>
                      <button className="inline-flex items-center gap-2 transition hover:text-amber-600"><Share2 className="h-5 w-5" /> Share</button>
                    </div>
                  </article>
                );
              })}
            </div>

            {loading && <div className="mt-8 rounded-2xl border border-slate-100 p-8 text-center text-sm text-slate-500">Loading reviews...</div>}
            {!loading && reviews.length === 0 && <div className="mt-8 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No reviews match this filter.</div>}

            <div className="review-divider mt-8 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">Showing {reviews.length ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, total)} of {total}. {reviewStats.written} written on this page.</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">Page {page} of {totalPages}</span>
                <button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
              </div>
            </div>
        </Card>

        <Card className="mt-8 flex h-full flex-col justify-between bg-amber-700 text-white">
            <div>
              <PlayCircle className="mb-5 h-10 w-10 text-amber-500" />
              <h3 className="text-2xl font-medium">Video testimonial library</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">Add YouTube, Instagram Reels, or uploaded member interviews here. The design is ready for embedded video proof.</p>
            </div>
            <button className="mt-8 w-fit rounded-full bg-white px-5 py-3 text-sm font-medium text-amber-900">Watch Stories</button>
        </Card>
      </div>
    </section>
  );
};

export default SuccessStoriesPage;
