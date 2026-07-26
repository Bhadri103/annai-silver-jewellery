import { Camera, Dumbbell, Image, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import heroImag from '../../assets/hero-right.jpg'
import academyLogoDark from '../../assets/program-logos/highgrade-academy-black-theme.png'
import img1 from '../../assets/program-logos/highgrade-personal-training-studio/img-1.jpeg'
import academyLogoLight from '../../assets/program-logos/highgrade-academy-white-theme.png'
import moveLogoDark from '../../assets/program-logos/highgrade-move-black-theme.png'
import moveLogoLight from '../../assets/program-logos/highgrade-move-white-theme.png'
import personalTrainingLogoDark from '../../assets/program-logos/highgrade-personal-training-black-theme.png'
import personalTrainingLogoLight from '../../assets/program-logos/highgrade-personal-training-white-theme.png'
import supplementLogoDark from '../../assets/program-logos/highgrade-supplement-black-theme.png'
import supplementLogoLight from '../../assets/program-logos/highgrade-supplement-white-theme.png'
import womenLogoDark from '../../assets/program-logos/highgrade-women-black-theme.png'
import womenLogoLight from '../../assets/program-logos/highgrade-women-white-theme.png'
export const heroImage =
 heroImag;

export const gymImage =
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85";

export const highgradePrograms = [
  {
    slug: "highgrade-personal-training-studio",
    title: " Personal Training Studio",
    intro: "Exclusive Private and Semi-Private Coaching in a Premium Studio.",
    image: "https://images.unsplash.com/photo-1571019613914-85f342c6a11e?auto=format&fit=crop&w=1400&q=85",
    logoLight: personalTrainingLogoLight,
    logoDark: personalTrainingLogoDark,
    trainer: "Manoj",
    trainerRole: "Head personal trainer",
    trainerPhoto:img1,
    enquiryTitle: "Enquire for Personal Training",
    features: ["Private coaching with Manoj", "Posture and movement screen", "Custom weekly workout", "Monthly body review"],
    detailTitle: "Train with Manoj",
    detailText: "Get a one-to-one plan built around your exact goal, current fitness level, injury history, work timing, and target date. Manoj guides your form, progression, nutrition basics, and weekly accountability.",
    highlights: ["One coach handles your plan", "Workout log updated every session", "Diet guidance based on your routine"],
    schedule: ["45-60 minute private session", "3 or 4 days per week", "Progress review every 30 days"],
    stats: [["Private coaching", "1 : 1 Personal Training"], ["Semi-Private coaching", "Small Group Individual Training"],],
    pagePhotos: [
      "https://images.unsplash.com/photo-1571019613914-85f342c6a11e?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1605296867424-35fc25c9212a?auto=format&fit=crop&w=900&q=85",
    ],
    process: ["Assessment and movement screen", "Goal-based workout map", "Weekly coaching and form correction", "Monthly measurements and plan update"],
  },
  {
    slug: "highgrade-women",
    title: "Exclusive For Women",
    intro: "Women-focused fitness in a comfortable environment with certified lady trainers.",
    image: "https://images.unsplash.com/photo-1609899464726-209befaac5f2?auto=format&fit=crop&w=1400&q=85",
    logoLight: womenLogoLight,
    logoDark: womenLogoDark,
    trainer: "Shebani",
    trainerRole: "Women's fitness trainer",
    trainerPhoto: "https://images.unsplash.com/photo-1609899464726-209befaac5f2?auto=format&fit=crop&w=800&q=85",
    enquiryTitle: "Enquire for Women's Training",
    features: ["Training by Shebani", "Women-friendly batches", "Fat-loss support", "Core and strength work", "Flexible morning/evening slots"],
    detailTitle: "Women's fitness training by Shebani",
    detailText: "Highgrade Women is a supportive women-focused training space in Nagercoil for fat loss, strength, stamina, confidence, and better daily energy. Shebani guides members with safe form, suitable intensity, practical food habits, and consistent progress check-ins.",
    highlights: ["Beginner-safe strength training", "Core, glutes, mobility, and cardio mix", "Simple meal habit support"],
    schedule: ["Guided group training", "Morning and evening batches", "Weekly trainer check-in"],
    stats: [["Women", "Focused batches"], ["3 days", "Starter routine"], ["Weekly", "Coach check-in"]],
    pagePhotos: [
      "https://images.unsplash.com/photo-1599058918144-1ffabb6ab9a0?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1571019613914-85f342c6a11e?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=85",
    ],
    process: ["Goal and routine discussion", "Strength basics with safe form", "Cardio and core conditioning", "Habit coaching for food and recovery"],
  },
  {
    slug: "highgrade-move",
    title: "Our Power House",
    intro: "Move better, get stronger and improve your everyday performance.",
    image: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=1400&q=85",
    logoLight: moveLogoLight,
    logoDark: moveLogoDark,
    trainer: "Manoj",
    trainerRole: "Functional and cross fit coach",
    trainerPhoto: "https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit=crop&w=800&q=85",
    enquiryTitle: "Enquire for Highgrade Move",
    features: ["Cross fit conditioning", "Functional circuits", "Mobility drills", "Core stability", "Strength endurance"],
    detailTitle: "Cross fit inspired functional training",
    detailText: "Highgrade Move is built for members who want athletic conditioning, better stamina, mobility, strength endurance, and energetic daily movement through cross fit style circuits.",
    highlights: ["Functional movement sessions", "Better flexibility, speed, and balance", "Conditioning for everyday performance"],
    schedule: ["40-50 minute sessions", "3 days per week", "Can be added to gym membership"],
    stats: [["40-50 min", "Session length"], ["Cross fit", "Training style"], ["3x", "Weekly option"]],
    pagePhotos: [
      "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=900&q=85",
    ],
    process: ["Movement screen", "Cross fit warm-up", "Functional strength circuits", "Conditioning finisher and recovery"],
  },
  {
    slug: "highgrade-supplement",
    title: "Our Supplement Store",
    intro: "Trusted sports nutrition to support your training, recovery, and performance.",
    image: "https://img.magnific.com/free-photo/protein-gym_23-2151980072.jpg?semt=ais_hybrid&w=740&q=80",
    logoLight: supplementLogoLight,
    logoDark: supplementLogoDark,
    features: ["Whey protein", "Creatine", "Pre-workout", "Recovery stack"],
    enquiryTitle: "Supplement Enquiry",
    detailTitle: "Shop Highgrade Supplements",
    detailText: "Buy products with filters, cart, login-gated checkout, pickup or delivery, coupon, and PhonePe payment.",
    highlights: ["No unnecessary product pushing", "Usage guidance included", "Beginner-friendly product selection"],
    schedule: ["In-studio purchase support", "Monthly stack review", "Diet plus supplement guidance"],
    stats: [["12+", "Shop products"], ["Coach", "Usage guidance"], ["Nagercoil", "Pickup support"]],
    pagePhotos: [
      "https://images.unsplash.com/photo-1622484211148-1552f25ce607?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1612532275214-e4ca76d0e4d1?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=900&q=85",
    ],
    process: ["Pick your goal", "Filter by product type", "Login before checkout", "Pay with PhonePe and pickup"],
    location: "Highgrade Sports & Supplements, Nagercoil",
    products: [
      { name: "Whey Protein", price: "Rs. 2,499", note: "Daily protein support", features: ["24g protein", "Easy mixing", "Lean muscle support"] },
      { name: "Creatine", price: "Rs. 899", note: "Strength and power", features: ["Daily 3-5g use", "Training performance", "Simple routine"] },
      { name: "Fat Loss Stack", price: "Rs. 1,499", note: "Habit support pack", features: ["Green tea", "L-carnitine", "Coach usage guide"] },
    ],
    shopProducts: [
      { id: "whey-elite", name: "Highgrade Whey Elite", category: "Protein", goal: "Muscle Gain", price: 2499, rating: 4.8, stock: 18, flavor: "Chocolate", image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=700&q=85", badge: "Best Seller" },
      { id: "isolate", name: "Lean Isolate Protein", category: "Protein", goal: "Fat Loss", price: 3299, rating: 4.7, stock: 11, flavor: "Vanilla", image: "https://images.unsplash.com/photo-1622484211148-1552f25ce607?auto=format&fit=crop&w=700&q=85", badge: "Lean Choice" },
      { id: "creatine", name: "Creatine Monohydrate", category: "Strength", goal: "Strength", price: 899, rating: 4.9, stock: 26, flavor: "Unflavoured", image: "https://images.unsplash.com/photo-1612532275214-e4ca76d0e4d1?auto=format&fit=crop&w=700&q=85", badge: "Coach Pick" },
      { id: "preworkout", name: "Pre Workout Rush", category: "Performance", goal: "Energy", price: 1599, rating: 4.5, stock: 9, flavor: "Berry", image: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=700&q=85", badge: "Energy" },
      { id: "bcaa", name: "Recovery BCAA", category: "Recovery", goal: "Recovery", price: 1199, rating: 4.4, stock: 14, flavor: "Lemon", image: "https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?auto=format&fit=crop&w=700&q=85", badge: "Hydration" },
      { id: "omega", name: "Omega Recovery Caps", category: "Wellness", goal: "Recovery", price: 799, rating: 4.6, stock: 21, flavor: "Capsule", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=700&q=85", badge: "Daily Use" },
    ],
  },
  {
    slug: "highgrade-academy",
    title: "Educational Programs",
    intro: "Professional fitness education with practical learning and career-focused certification.",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=85",
    logoLight: academyLogoLight,
    logoDark: academyLogoDark,
    trainer: "Manoj",
    trainerRole: "Academy mentor",
    trainerPhoto: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=85",
    enquiryTitle: "Enquire for Highgrade Academy",
    features: ["Trainer education by Manoj", "Fitness workshops", "Form basics", "Nutrition sessions", "Client handling basics"],
    detailTitle: "Learn from Manoj to become a better trainer",
    detailText: "Highgrade Academy is for beginners, fitness lovers, and future trainers who want to understand exercise form, programming, nutrition fundamentals, gym discipline, and client coaching.",
    highlights: ["Weekend learning sessions", "Manoj-led practical demos", "Useful for students and future trainers"],
    schedule: ["Weekend workshops", "Short certificate sessions", "Practical floor learning"],
    stats: [["Weekend", "Workshops"], ["Practical", "Floor learning"], ["Coach", "Led sessions"]],
    pagePhotos: [
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=85",
    ],
    process: ["Theory session", "Exercise demo", "Programming basics", "Certificate and next steps"],
  },
];

export const programData = [
  ...highgradePrograms,
  {
    slug: "general-fitness",
    title: "General Fitness",
    intro: "Build stamina, mobility, and everyday strength with a balanced training plan.",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=85",
    features: ["Full-body workouts", "Mobility routines", "Beginner-friendly coaching", "Monthly progress checks"],
  },
  {
    slug: "fat-loss",
    title: "Fat Loss",
    intro: "Structured training and nutrition habits for sustainable fat loss.",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=85",
    features: ["Cardio and resistance mix", "Calorie guidance", "Weekly measurements", "Habit coaching"],
  },
  {
    slug: "muscle-building",
    title: "Muscle Building",
    intro: "Progressive strength plans designed to add lean muscle and improve shape.",
    image: "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?auto=format&fit=crop&w=900&q=85",
    features: ["Hypertrophy blocks", "Protein targets", "Form correction", "Load progression"],
  },
  {
    slug: "strength-training",
    title: "Strength Training",
    intro: "Get stronger in the core lifts with safe coaching and measurable progress.",
    image: "https://images.unsplash.com/photo-1581009137042-c552e485697a?auto=format&fit=crop&w=900&q=85",
    features: ["Squat, press, deadlift", "Technique reviews", "Strength testing", "Recovery planning"],
  },
  {
    slug: "personal-training",
    title: "Personal Training",
    intro: "One-to-one coaching built around your exact goals, history, and schedule.",
    image: "https://images.unsplash.com/photo-1571019613914-85f342c6a11e?auto=format&fit=crop&w=900&q=85",
    features: ["Private sessions", "Custom plans", "Nutrition support", "Priority scheduling"],
  },
  {
    slug: "womens-fitness",
    title: "Women's Fitness",
    intro: "Supportive coaching for strength, confidence, fitness, and long-term health.",
    image: "https://images.unsplash.com/photo-1609899464726-209befaac5f2?auto=format&fit=crop&w=900&q=85",
    features: ["Women-only batches", "Strength foundations", "Fat-loss support", "Flexible timing"],
  },
  {
    slug: "senior-fitness",
    title: "Senior Fitness",
    intro: "Low-impact training focused on mobility, balance, strength, and confidence.",
    image: "https://images.unsplash.com/photo-1579126038374-6064e9370f0f?auto=format&fit=crop&w=900&q=85",
    features: ["Joint-friendly training", "Balance drills", "Mobility routines", "Careful progression"],
  },
  {
    slug: "sports-performance",
    title: "Sports Performance",
    intro: "Speed, power, conditioning, and injury-resilience for athletes.",
    image: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=900&q=85",
    features: ["Power training", "Agility drills", "Conditioning", "Performance testing"],
  },
  {
    slug: "online-coaching",
    title: "Online Coaching",
    intro: "Train from anywhere with expert plans, check-ins, and accountability.",
    image: "https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=900&q=85",
    features: ["Remote plans", "Video guidance", "Weekly check-ins", "Progress dashboard"],
  },
];

export const trainers = [
   
  
  {
    name: "Manoj",
    role: "Strength & Muscle Building Coach",
    qualification: "Certified Personal Trainer (ACE)",
    experience: "7+ Years",
    specializations: [
      "Muscle Gain",
      "Body Recomposition",
      "Strength Training",
      "Nutrition Guidance"
    ],
    image:
      "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=600&q=85",
  },
  {
    name: "Shebani",
    role: "Women's Fitness & Performance Coach",
    qualification: "NSCA-CSCS",
    experience: "8+ Years",
    specializations: [
      "Women's Fitness",
      "Weight Loss",
      "Mobility Training",
      "Functional Strength"
    ],
    image:
      "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=600&q=85",
  },
 
   
];

export const blogPosts = [
  {
    slug: "smart-cheat-meals-without-losing-progress",
    title: "How to Enjoy a Cheat Meal Without Losing Progress",
    author: "Manoj Coach",
    date: "April 13, 2026",
    time: "8:00 am",
    category: "Nutrition",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=85",
    excerpt: "One meal does not ruin your results. The real problem is showing up hungry, unplanned, and then trying to punish yourself the next day.",
    sections: [
      {
        heading: "Plan the meal before it happens",
        body: "If you know dinner is going to be heavier, log or estimate it early. Then build the rest of your day around protein, vegetables, fruit, and water. That keeps the meal enjoyable without turning the whole day into guesswork.",
      },
      {
        heading: "Do not turn one meal into a weekend",
        body: "A planned meal is part of the process. The issue starts when guilt turns into an all-or-nothing mindset. Eat the meal, enjoy it, and return to your normal plan at the next meal.",
      },
      {
        heading: "What to do after",
        body: "No detox, no punishment cardio, and no starving the next day. Drink water, get your steps in, strength train as planned, and keep your weekly routine consistent.",
      },
    ],
  },
  {
    slug: "protein-for-weight-loss-and-strength",
    title: "Why Protein Is the Missing Piece in Your Weight Loss Plan",
    author: "Manoj Coach",
    date: "April 13, 2026",
    time: "10:30 am",
    category: "Nutrition",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1400&q=85",
    excerpt: "Protein supports fullness, muscle repair, and better body composition. Most people trying to lose weight simply do not get enough.",
    sections: [
      {
        heading: "Protein makes dieting easier",
        body: "A higher-protein meal usually keeps you full longer than a meal built mostly from refined carbs or snacks. That means fewer cravings and fewer unplanned bites through the day.",
      },
      {
        heading: "It protects muscle while losing fat",
        body: "Fat loss is not just about seeing the scale drop. You want to preserve strength and shape. Protein plus strength training helps your body keep the muscle you worked for.",
      },
      {
        heading: "Simple daily targets",
        body: "Start with protein at every main meal: eggs, curd, paneer, fish, chicken, dal, tofu, or whey. A coach can help set the right target for your body weight and goal.",
      },
    ],
  },
  {
    slug: "beginner-strength-training-after-40",
    title: "The Beginner's Guide to Strength Training After 40",
    author: "Manoj Coach",
    date: "April 9, 2026",
    time: "7:45 am",
    category: "Strength",
    image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1400&q=85",
    excerpt: "You do not need to get fit before joining the gym. Strength training is how you start getting fit safely and confidently.",
    sections: [
      {
        heading: "Start with movements, not ego",
        body: "Your first goal is to learn good movement patterns: squat, hinge, push, pull, carry, and brace. Load comes later, after your body understands the basics.",
      },
      {
        heading: "Two to three days is enough",
        body: "Beginners can make excellent progress with two or three focused strength sessions per week. Recovery matters more after 40, so smart scheduling beats random intensity.",
      },
      {
        heading: "Measure progress clearly",
        body: "Track attendance, form quality, weights used, energy, waist measurements, and photos. These show progress even when the scale moves slowly.",
      },
    ],
  },
  {
    slug: "sleep-and-fat-loss-after-40",
    title: "Do Not Sleep on Sleep: Why 7 Hours Can Unlock Fat Loss",
    author: "Manoj Coach",
    date: "April 6, 2026",
    time: "9:00 am",
    category: "Recovery",
    image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1400&q=85",
    excerpt: "If training and nutrition are in place but progress is stuck, sleep may be the missing recovery habit.",
    sections: [
      {
        heading: "Poor sleep increases hunger",
        body: "When sleep is low, cravings feel louder and decision-making gets weaker. You may not need a stricter diet. You may need a better night routine.",
      },
      {
        heading: "Recovery happens outside the workout",
        body: "Strength training creates the signal. Sleep helps your body adapt to that signal. Without enough rest, workouts feel harder and progress feels slower.",
      },
      {
        heading: "A simple sleep reset",
        body: "Keep a consistent bedtime, reduce screens late, finish heavy meals earlier, and make the room dark and cool. Small sleep upgrades compound quickly.",
      },
    ],
  },
  {
    slug: "weight-loss-myths-after-40",
    title: "5 Weight Loss Myths Adults Over 40 Should Stop Believing",
    author: "Manoj Coach",
    date: "April 2, 2026",
    time: "8:15 am",
    category: "Fat Loss",
    image: "https://images.unsplash.com/photo-1571019613576-2b22c76fd955?auto=format&fit=crop&w=1400&q=85",
    excerpt: "Your metabolism did not quit. Most people just need better strength training, protein, steps, sleep, and consistency.",
    sections: [
      {
        heading: "Myth 1: You need extreme cardio",
        body: "Cardio can help, but strength training is the foundation for a stronger, leaner body. Combine lifting, steps, and nutrition instead of chasing exhaustion.",
      },
      {
        heading: "Myth 2: Carbs are the enemy",
        body: "Carbs are fuel. The right amount depends on your goal, activity, and total calories. Most people need structure, not fear.",
      },
      {
        heading: "Myth 3: Progress must be fast",
        body: "The best result is the one you can keep. Slow, measurable progress builds habits that survive busy weeks, festivals, travel, and real life.",
      },
    ],
  },
  {
    slug: "balance-is-usually-strength",
    title: "Is Poor Balance Really a Balance Problem?",
    author: "Manoj Coach",
    date: "March 30, 2026",
    time: "11:00 am",
    category: "Mobility",
    image: "https://images.unsplash.com/photo-1579126038374-6064e9370f0f?auto=format&fit=crop&w=1400&q=85",
    excerpt: "Balance often improves when the legs, hips, feet, and core get stronger through safe progressive training.",
    sections: [
      {
        heading: "Strength creates stability",
        body: "If your legs and hips are weak, your body has fewer options when you stumble or change direction. Strength gives your balance system better support.",
      },
      {
        heading: "Train the whole system",
        body: "Useful balance training includes split squats, step-ups, carries, hip strength, ankle mobility, and controlled core work. It is not just standing on one leg.",
      },
      {
        heading: "Start safely",
        body: "Older adults should progress carefully with coach supervision. The goal is confidence, not risky circus exercises.",
      },
    ],
  },
  {
    slug: "truth-about-detoxes",
    title: "The Truth About Detoxes and Why Your Body Already Has One",
    author: "Manoj Coach",
    date: "March 26, 2026",
    time: "8:40 am",
    category: "Nutrition",
    image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1400&q=85",
    excerpt: "You do not need a cleanse to restart your health. Your liver, kidneys, digestion, and daily habits already do the real work.",
    sections: [
      {
        heading: "Detox products overpromise",
        body: "Most detox plans work by making you eat very little for a short time. That can reduce scale weight temporarily, but it does not teach lasting habits.",
      },
      {
        heading: "Support your built-in system",
        body: "Eat enough protein, include vegetables and fiber, drink water, sleep well, and move daily. These basics support the organs that already handle detoxification.",
      },
      {
        heading: "Choose habits over resets",
        body: "If you feel bloated or stuck, return to simple meals and consistent training. A stable routine beats another dramatic reset.",
      },
    ],
  },
  {
    slug: "easy-daily-calorie-formula",
    title: "The Easy Way to Estimate Your Daily Calories",
    author: "Manoj Coach",
    date: "March 23, 2026",
    time: "9:20 am",
    category: "Calculators",
    image: "https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=1400&q=85",
    excerpt: "Calories do not need to feel mysterious. A simple estimate gives you a starting point, then results tell you how to adjust.",
    sections: [
      {
        heading: "Start with a realistic estimate",
        body: "Use a calorie calculator as a starting point, not a permanent rule. Your body weight, steps, training, sleep, and consistency will tell the full story.",
      },
      {
        heading: "Track the trend",
        body: "One day of weight data means very little. Look at weekly averages, waist changes, photos, energy, and gym performance.",
      },
      {
        heading: "Adjust slowly",
        body: "If nothing changes for two to three weeks, adjust calories, steps, or training volume. Big cuts usually create big rebounds.",
      },
    ],
  },
  {
    slug: "strength-training-for-recreational-athletes",
    title: "Why Strength Training Helps Recreational Athletes Over 40",
    author: "Manoj Coach",
    date: "March 19, 2026",
    time: "7:30 am",
    category: "Performance",
    image: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=1400&q=85",
    excerpt: "Whether you play cricket, badminton, running events, football, or weekend sports, strength training keeps you powerful and resilient.",
    sections: [
      {
        heading: "Sport alone is not enough",
        body: "Playing your sport builds skill, but it may not build balanced strength. A smart gym plan fills the gaps that sport practice misses.",
      },
      {
        heading: "Build power and durability",
        body: "Training the legs, hips, core, upper back, and grip can improve performance while reducing the aches that appear after intense games.",
      },
      {
        heading: "Train around the season",
        body: "Your program should match your sport schedule. Hard training days and game days need to be planned so recovery stays strong.",
      },
    ],
  },
  {
    slug: "alcohol-and-fat-loss",
    title: "Alcohol and Fat Loss: Can You Still Drink and Lose Weight?",
    author: "Manoj Coach",
    date: "March 16, 2026",
    time: "6:30 pm",
    category: "Fat Loss",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1400&q=85",
    excerpt: "You can make progress without being perfect, but alcohol needs planning because it affects calories, sleep, hunger, and training quality.",
    sections: [
      {
        heading: "The issue is not only calories",
        body: "Alcohol can make food choices harder, reduce sleep quality, and lower next-day energy. That is why one drink often becomes a full weekend of missed habits.",
      },
      {
        heading: "Set boundaries before you go out",
        body: "Choose how many drinks you will have, eat protein before going out, drink water between rounds, and avoid turning late-night snacks into the main event.",
      },
      {
        heading: "Return to normal quickly",
        body: "Do not punish yourself the next day. Hydrate, walk, eat normal meals, and get back to training. Consistency is stronger than guilt.",
      },
    ],
  },
];

export const faqs = [
  ["What are the membership fees?", "Fees depend on duration and coaching level. Monthly plans start at Rs. 1,499."],
  ["Is parking available?", "Yes, parking support is available near the facility."],
  ["Do you provide diet plans?", "Yes. Nutrition guidance is included in selected plans and personal training."],
  ["What is the age limit?", "We train teens, adults, women, seniors, and athletes with age-appropriate plans."],
  ["Is personal training available?", "Yes. One-to-one personal training is available with custom schedules."],
  ["What is the cancellation policy?", "Membership terms are explained before joining. Plan changes can be discussed with the team."],
];

export const planRows = [
  ["Access to gym floor", true, true, true, true],
  ["Trainer guidance", true, true, true, true],
  ["Nutrition support", false, true, true, true],
  ["Progress review", false, true, true, true],
  ["Personal training discount", false, false, true, true],
  ["Priority scheduling", false, false, false, true],
] as const;

export const plans = [
  {
    name: "Monthly",
    price: "Rs. 1,499",
    note: "Flexible starter access",
    image: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=900&q=85",
    features: ["Gym floor access", "Starter workout plan", "Trainer guidance", "Batch access"],
  },
  {
    name: "Quarterly",
    price: "Rs. 3,999",
    note: "Best for habit building",
    image: "https://images.unsplash.com/photo-1581009137042-c552e485697a?auto=format&fit=crop&w=900&q=85",
    features: ["Everything in Monthly", "Progress review", "Nutrition support", "Habit coaching"],
  },
  {
    name: "Half-yearly",
    price: "Rs. 7,499",
    note: "More savings and consistency",
    image: "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?auto=format&fit=crop&w=900&q=85",
    features: ["Everything in Quarterly", "Personal training discount", "Body composition review", "Priority check-ins"],
  },
  {
    name: "Annual",
    price: "Rs. 13,999",
    note: "Best value for committed members",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=85",
    features: ["Everything in Half-yearly", "Priority scheduling", "Transformation tracking", "Exclusive workshops"],
  },
];

export const galleryItems: Array<{ type: string; icon: LucideIcon; image: string }> = [
  { type: "Gym Photos", icon: Image, image: gymImage },
  { type: "Equipment", icon: Dumbbell, image: "https://images.unsplash.com/photo-1637666062717-1c6bcfa4a4df?auto=format&fit=crop&w=700&q=85" },
  { type: "Workout Videos", icon: Video, image: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=700&q=85" },
  { type: "Facility Tour", icon: Camera, image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=700&q=85" },
];
