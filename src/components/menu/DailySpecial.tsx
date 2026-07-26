import React, { useState, useRef, useEffect } from 'react';

interface Special {
  day: string;
  items: string[];
  image: string;
  gradient: string;
}

const DailySpecialsSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const specials: Special[] = [
    {
      day: "Monday",
      gradient: "from-amber-600 via-amber-500 to-orange-500",
      items: [
        "All Appetizer â€“ 15% Off",
        "All Frozen Cocktails â€“ $8.95"
      ],
      image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600"
    },
    {
      day: "Tuesday",
      gradient: "from-amber-700 via-amber-600 to-amber-500",
      items: [
        "Fajitas â€“ $17.95",
        "Fish Taco â€“ $12.95",
        "All Sangrias â€“ $8.95"
      ],
      image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600"
    },
    {
      day: "Wednesday",
      gradient: "from-orange-600 via-amber-600 to-amber-700",
      items: [
        "Clouds Platter â€“ 15% Off",
        "Skillet Steak â€“ $19.95",
        "Blue Lagoon â€“ $7.95",
        "Senior Discount â€“ 15% Off"
      ],
      image: "https://images.unsplash.com/photo-1558030006-450675393462?w=600"
    },
    {
      day: "Thursday",
      gradient: "from-amber-500 via-amber-600 to-rose-600",
      items: [
        "House Wines â€“ 20% Off",
        "Pastas â€“ 20% Off",
        "Cloud Margarita â€“ $9.95"
      ],
      image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600"
    },
    {
      day: "Friday",
      gradient: "from-rose-600 via-amber-600 to-amber-700",
      items: [
        "Steak And Lobster â€“ $31.95",
        "Henny Dream â€“ $9.95",
        "Fish And Chips â€“ $12.95"
      ],
      image: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600"
    },
    {
      day: "Saturday",
      gradient: "from-amber-800 via-amber-600 to-orange-600",
      items: [
        "Ribs & Wings â€“ $19.95",
        "Fish Bowls â€“ $16.95"
      ],
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600"
    },
    {
      day: "Sunday",
      gradient: "from-orange-500 via-amber-600 to-amber-700",
      items: [
        "1LB Wings And Fries â€“ $11.95",
        "Nachos â€“ $12.95",
        "Bloody Caesar â€“ $6.95",
        "Kids Meal â€“ 30% off"
      ],
      image: "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600"
    },
    {
      day: "Game Day",
      gradient: "from-amber-600 via-orange-600 to-amber-700",
      items: [
        "Pint & Pound â€“ $15.95",
        "Pitcher & 2LBs Wings â€“ $32.95"
      ],
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600"
    },
    {
      day: "Happy Hour",
      gradient: "from-amber-700 via-rose-600 to-amber-600",
      items: [
        "PINT Early Happy Hour â€“ $4.45",
        "Monday â€“ Friday",
        "11:00AM â€“ 5:00PM"
      ],
      image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600"
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px' }
    );

    const section = sectionRef.current;

    if (section) {
      observer.observe(section);
    }

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="bg-gradient-to-b from-amber-900 to-neutral-900 min-h-screen">
      {/* Header with Background Image - Full Width */}
      <div className="relative w-full overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&h=600&fit=crop"
            alt="Daily Specials Background"
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-amber-900 via-amber-800/80 to-amber-900/60"></div>
          <div className="absolute inset-0 bg-amber-800/40"></div>
        </div>

        {/* Content */}
        <div className="relative text-center py-12 px-4 sm:py-20 md:py-24">
          <h2 className={`text-4xl font-bold text-white mb-3 transition-all duration-1000 sm:text-5xl md:text-6xl ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Daily <span className="text-amber-600">Specials</span>
          </h2>
          <p className={`text-base text-gray-300 max-w-3xl mx-auto mb-4 transition-all duration-1000 delay-200 sm:text-lg ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Check Out Our Amazing Daily Deals and Save Big!
          </p>
          <div className={`flex items-center justify-center gap-2 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
            {[...Array(10)].map((_, i) => (
              <div 
                key={i} 
                className="w-2 h-2 bg-amber-600 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Cards Section */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:py-16 md:py-20 sm:px-6 lg:px-8">
        {/* Specials Grid */}
        <div className="grid grid-cols-1 gap-5 mb-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 md:mb-12">
          {specials.map((special, index) => (
            <div 
              key={index} 
              className={`group cursor-pointer transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${index * 0.1}s` }}
            >
              <div className="relative bg-gradient-to-br from-gray-900 to-amber-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl hover:shadow-amber-900/40 transform transition-all duration-500 hover:scale-105 hover:border-amber-500/60 flex flex-col h-full">
                
                {/* Image Section */}
                <div className="relative h-40 overflow-hidden flex-shrink-0 sm:h-36">
                  <img 
                    src={special.image} 
                    alt={special.day}
                    className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-900 via-amber-800/70 to-transparent"></div>
                  
                  {/* Attractive Day Badge with Red/Black Gradient */}
                  <div className="absolute top-3 left-3">
                    <div className={`bg-gradient-to-r ${special.gradient} px-4 py-1 rounded-full shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-amber-600/50`}>
                      <span className="text-white font-bold text-xs uppercase tracking-wider drop-shadow-lg">
                        {special.day}
                      </span>
                    </div>
                  </div>

                  {/* Cloud Nine Logo Badge */}
                  <div className="absolute top-3 right-3 w-10 h-10 bg-amber-800 rounded-full flex items-center justify-center shadow-lg border-2 border-amber-600 group-hover:border-amber-500 transition-colors">
                    <span className="text-amber-600 font-bold text-[8px] leading-tight text-center">CLOUD<br/>NINE</span>
                  </div>
                </div>

                {/* Content - Fixed Height with Flex */}
                <div className="p-5 flex-grow flex flex-col justify-center sm:p-6">
                  <div className="space-y-2.5">
                    {special.items.map((item, itemIndex) => (
                      <div 
                        key={itemIndex}
                        className="flex items-start gap-2.5 text-gray-200 group/item hover:text-white transition-colors"
                      >
                        <span className="text-amber-600 text-lg font-bold mt-0.5 flex-shrink-0">â€¢</span>
                        <span className="text-sm leading-relaxed sm:text-base">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decorative Red Glow Effect */}
                <div className={`absolute -bottom-2 -right-2 w-24 h-24 bg-gradient-to-tl ${special.gradient} opacity-15 blur-2xl rounded-full group-hover:opacity-25 transition-opacity duration-500`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Button */}
        <div className={`flex items-center justify-center px-4 transition-all duration-1000 delay-900 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          



          

            <div className="hidden lg:flex items-center space-x-4">
              <a
                href="https://cloudnine.restropilot.com/restaurant/cloud-nine"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white px-8 py-2 rounded-lg font-bold text-lg transition-all transform hover:scale-105 hover:shadow-2xl shadow-lg shadow-amber-900/50 active:scale-95 sm:w-auto sm:px-12"
              >
                Online Order
              </a>
            </div>


        </div>
      </div>
    </section>
  );
};

export default DailySpecialsSection;
