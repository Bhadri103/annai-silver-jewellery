import React, { useState, useRef, useEffect } from 'react';

// On Tap Beer Images
 
// On Tap Images
import speedLager from '../../image/On-tap/3 SPEED LAGER.webp';
import belgianMoon from '../../image/On-tap/BELGIAN MOON.jpg';
import blondeLager from '../../image/On-tap/BLONDE LAGER.webp';
import cloud9Beer from '../../image/On-tap/CLOUD_S BEER.png';
import coorsOriginal from '../../image/On-tap/COORS ORIGINAL.jpeg'; 
import creemoreIPA from '../../image/On-tap/CREEMORE IPA.png';
import guinness from '../../image/On-tap/guinness.jpg';
import heineken from '../../image/On-tap/Heineken.jpg';
import millerLite from '../../image/On-tap/Miller-Lite.png';
import molsonCanadian from '../../image/On-tap/molson-canadian.png';
import rickardsRed from '../../image/On-tap/rickards red.png';
import somersbyCider from '../../image/On-tap/SOMERSBY CIDER.png';
import stellaArtois from '../../image/On-tap/stella_artois.png';
import strongbowCider from '../../image/On-tap/STRONGBOW CIDER.png';
import coorsLight from '../../image/On-tap/coors-light.png';

// Import cocktail images
import cocktail1 from '../../image/cocktails/1.jpg';
import cocktail2 from '../../image/cocktails/2.jpg';
import cocktail3 from'../../image/cocktails/3.jpg';
import cocktail4 from '../../image/cocktails/4.jpg';
import cocktail5 from '../../image/cocktails/5.jpg';
import cocktail6 from '../../image/cocktails/6.jpg';
import cocktail7 from '../../image/cocktails/7.jpg';
import cocktail8 from '../../image/cocktails/8.jpg';
import cocktail9 from '../../image/cocktails/9.jpg';
import cocktail10 from '../../image/cocktails/10.jpg';
import cocktail11 from'../../image/cocktails/11.jpg';
import cocktail12 from'../../image/cocktails/12.jpg';
import cocktail13 from '../../image/cocktails/13.jpg';
import cocktail14 from '../../image/cocktails/14.jpg';
import cocktail15 from '../../image/cocktails/15.jpg';
import cocktail16 from '../../image/cocktails/16.jpg';

interface DrinkItem {
  image: string;
  name: string;
  type: string;
  category: string;
}

const WhatsOnTapSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const beerSectionRef = useRef<HTMLDivElement>(null);
  const cocktailSectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isBeerVisible, setIsBeerVisible] = useState(false);
  const [isCocktailVisible, setIsCocktailVisible] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const beers = React.useMemo<DrinkItem[]>(() => [
    { image: speedLager, name: "3 Speed Lager", type: "Lager", category: "Beer" },
    { image: belgianMoon, name: "Belgian Moon", type: "Wheat Ale", category: "Beer" },
    { image: blondeLager, name: "Blonde Lager", type: "Lager", category: "Beer" },
    { image: cloud9Beer, name: "Cloud 9 Beer", type: "House Beer", category: "Beer" },
    { image: coorsOriginal, name: "Coors Original", type: "Lager", category: "Beer" },
    { image: coorsLight, name: "Coors Light", type: "Light Lager", category: "Beer" },
    { image: creemoreIPA, name: "Creemore IPA", type: "IPA", category: "Beer" },
    { image: guinness, name: "Guinness", type: "Stout", category: "Beer" },
    { image: heineken, name: "Heineken", type: "Pilsner", category: "Beer" },
    { image: millerLite, name: "Miller Lite", type: "Light Lager", category: "Beer" },
    { image: molsonCanadian, name: "Molson Canadian", type: "Lager", category: "Beer" },
    { image: rickardsRed, name: "Rickard's Red", type: "Red Ale", category: "Beer" },
    { image: somersbyCider, name: "Somersby Cider", type: "Cider", category: "Beer" },
    { image: stellaArtois, name: "Stella Artois", type: "Lager", category: "Beer" },
    { image: strongbowCider, name: "Strongbow Cider", type: "Cider", category: "Beer" },
  ], []);

  const cocktails = React.useMemo<DrinkItem[]>(() => [
    { image: cocktail1, name: "Cloud Nine Sunset", type: "Signature", category: "Cocktail" },
    { image: cocktail2, name: "Ajax Mule", type: "Signature", category: "Cocktail" },
    { image: cocktail3, name: "Electric Avenue", type: "Signature", category: "Cocktail" },
    { image: cocktail4, name: "Smoke & Mirrors", type: "Signature", category: "Cocktail" },
    { image: cocktail5, name: "Paradise Found", type: "Tropical", category: "Cocktail" },
    { image: cocktail6, name: "Red Carpet", type: "Signature", category: "Cocktail" },
    { image: cocktail7, name: "Old Fashioned", type: "Classic", category: "Cocktail" },
    { image: cocktail8, name: "Manhattan", type: "Classic", category: "Cocktail" },
    { image: cocktail9, name: "Margarita", type: "Classic", category: "Cocktail" },
    { image: cocktail10, name: "Mojito", type: "Classic", category: "Cocktail" },
    { image: cocktail11, name: "Martini", type: "Classic", category: "Cocktail" },
    { image: cocktail12, name: "Negroni", type: "Classic", category: "Cocktail" },
    { image: cocktail13, name: "Cosmopolitan", type: "Classic", category: "Cocktail" },
    { image: cocktail14, name: "Whiskey Sour", type: "Classic", category: "Cocktail" },
    { image: cocktail15, name: "PiÃ±a Colada", type: "Tropical", category: "Cocktail" },
    { image: cocktail16, name: "Mai Tai", type: "Tropical", category: "Cocktail" },
  ], []);

  // Preload images
  useEffect(() => {
    const allImages = [...beers, ...cocktails].map(drink => drink.image);
    
    allImages.forEach(src => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setLoadedImages(prev => new Set([...prev, src]));
      };
    });
  }, [beers, cocktails]);

  // Main section observer
  useEffect(() => {
    const mainRef = sectionRef.current;
    if (!mainRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(mainRef);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Beer section observer
  useEffect(() => {
    const beerRef = beerSectionRef.current;
    if (!beerRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsBeerVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(beerRef);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Cocktail section observer
  useEffect(() => {
    const cocktailRef = cocktailSectionRef.current;
    if (!cocktailRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsCocktailVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(cocktailRef);

    return () => {
      observer.disconnect();
    };
  }, []);

 const renderDrinkCard = (drink: DrinkItem, index: number, isVisible: boolean) => {
  const isLoaded = loadedImages.has(drink.image);
  
  return (
    <div 
      key={index} 
      className={`group cursor-pointer transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${index * 0.05}s` }}
    >
      <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border-2 sm:border-3 border-amber-600 h-48 sm:h-52 md:h-56 transform transition-all duration-500 hover:scale-105 hover:border-amber-500 hover:shadow-2xl hover:shadow-amber-900/50 bg-gray-900">
        {/* Loading placeholder */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-amber-900 animate-pulse flex items-center justify-center">
            <div className="text-gray-600 text-sm">Loading...</div>
          </div>
        )}
        
        <img 
          src={drink.image} 
          alt={drink.name}
          loading="lazy"
          className={`w-full h-full object-contain transform group-hover:scale-110 transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => {
            setLoadedImages(prev => new Set([...prev, drink.image]));
          }}
        />
      </div>
      
      {/* Name and type below the image */}
      <div className="mt-3 text-center">
        <h3 className="text-white text-sm sm:text-base md:text-lg font-bold mb-1 group-hover:text-amber-400 transition-colors duration-300">
          {drink.name}
        </h3>
        {/* <p className="text-gray-300 text-xs sm:text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {drink.type}
        </p> */}
      </div>
    </div>
  );
};

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-neutral-900 to-amber-900">
      <div className="max-w-7xl mx-auto"> 
        <div className="text-center mb-12 md:mb-16">
          <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 md:mb-4 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            What's On <span className="text-amber-600">Tap & In Your Glass</span>
          </h2>
          <p className={`text-sm sm:text-base md:text-lg text-gray-400 max-w-3xl mx-auto mb-6 md:mb-8 px-4 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            Discover Our Selection of Draft Beers & Handcrafted Cocktails
          </p>
          <div className={`flex items-center justify-center gap-1 sm:gap-2 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
            {[...Array(10)].map((_, i) => (   
              <div 
                key={i} 
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-600 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
        </div> 
        <div ref={beerSectionRef} className="mb-16 md:mb-20">
          <div className="text-center mb-8 md:mb-10">
            <h3 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 transition-all duration-1000 ${isBeerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <span className="text-amber-600">On Tap</span> Beers
            </h3> 
            <div className={`w-24 h-1 bg-amber-600 mx-auto rounded-full transition-all duration-1000 delay-200 ${isBeerVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
            {beers.map((beer, index) => renderDrinkCard(beer, index, isBeerVisible))}
          </div>
        </div> 
        <div ref={cocktailSectionRef} className="mb-12 md:mb-16">
          <div className="text-center mb-8 md:mb-10">
            <h3 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 transition-all duration-1000 ${isCocktailVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
           Handcrafted <span className="text-amber-600">Cocktails</span>
            </h3> 
            <div className={`w-24 h-1 bg-amber-600 mx-auto rounded-full transition-all duration-1000 delay-200 ${isCocktailVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
            {cocktails.map((cocktail, index) => renderDrinkCard(cocktail, index, isCocktailVisible))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 px-4 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* <a 
            href="/menu/drinks"
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-lg font-bold transition-all transform hover:scale-105 hover:shadow-2xl shadow-lg shadow-amber-900/50 active:scale-95"
          >
            View Full Drinks Menu
          </a> */}
          <a
            href="https://cloudnine.restropilot.com/restaurant/cloud-nine"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-amber-800 hover:bg-amber-700 text-white px-8 py-3 rounded-lg font-bold transition-all transform hover:scale-105 border border-amber-700 active:scale-95"
          >Order Online
          </a>
        </div>
      </div>
    </section>
  );
};

export default WhatsOnTapSection;
