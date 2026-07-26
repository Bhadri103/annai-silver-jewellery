import React, { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Search, X, Leaf, Flame } from "lucide-react";

const CloudNineMenu = () => {
  const [activeTab, setActiveTab] = useState("starters");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const tabContainerRef = useRef(null);

  const menuData = {
    starters: {
      title: "Starters & Shareables",
      icon: "ðŸ¤",
      items: [
        {
          name: "Soup of the Day",
          price: "$7.95",
          desc: "Made fresh everyday, served with garlic bread",
          dietary: ["vegetarian"]
        },
        {
          name: "Calamari",
          price: "$14.45",
          desc: "Breaded calamari, jalapeÃ±o, bell peppers with sweet chilli sauce",
          dietary: ["spicy"]
        },
        {
          name: "Bruschetta",
          price: "$11.95",
          desc: "Tomato mix, feta cheese & balsamic glaze",
          dietary: ["vegetarian"]
        },
        {
          name: "Garlic Bread",
          price: "$6.95",
          desc: "Add cheese $2.95, chicken $5.95, bacon $2.45",
          dietary: ["vegan"]
        },
        {
          name: "Quesadilla",
          price: "$11.95",
          desc: "JalapeÃ±o, mixed peppers, green onions, tomato, salsa, mixed cheese. Add: Chicken $4.95, Beef $4.95, Shrimp $6.95, Steak $7.95",
          dietary: ["vegetarian", "spicy"]
        },
        {
          name: "Mussels",
          price: "$17.95",
          desc: "PEI mussels, bacon, onion, bell pepper, tomato with Gorgonzola cream, marinara or white wine sauce",
          dietary: ["gluten-free"]
        },
        {
          name: "Saganaki Cheese",
          price: "$15.95",
          desc: "Traditional hard cheese served with naan",
          dietary: ["vegetarian"]
        },
        {
          name: "Cloud's Spicy Yarl Fries",
          price: "$11.95",
          desc: "Crispy fries, green chilli, red onions, drizzled with ranch",
          dietary: ["vegetarian", "spicy"]
        },
        {
          name: "Coconut Shrimp",
          price: "$14.95",
          desc: "Fried coconut shrimp served with sweet chilli sauce"
        },
        {
          name: "Mozzarella Sticks",
          price: "$12.95",
          desc: "Fried mozzarella sticks served with marinara sauce",
          dietary: ["vegetarian"]
        },
        {
          name: "Boneless Wings & Fries",
          price: "$13.95",
          desc: "With choice of wing sauce"
        },
        {
          name: "Potato Skins",
          price: "$10.45",
          desc: "Bacon, green onions, mixed cheese & sour cream",
          dietary: ["gluten-free"]
        },
        {
          name: "Spinach Cheese Dip",
          price: "$14.95",
          desc: "Spinach, artichoke & mixed cheese dip with nacho & pita",
          dietary: ["vegetarian"]
        },
        {
          name: "Shrimp Skewers",
          price: "$14.95",
          desc: "Tossed with garlic sauce, chef salad and lemon wedge",
          dietary: ["gluten-free"]
        },
        {
          name: "Fish Tacos",
          price: "$14.95",
          desc: "Beer battered fish, coleslaw, feta, salsa, lemon, dill sauce"
        },
        {
          name: "Pierogis",
          price: "$11.95",
          desc: "Cheese and potato pierogis with onion, bacon, mixed cheese",
          dietary: ["vegetarian"]
        },
        {
          name: "Skillet Steak (10oz)",
          price: "$23.95",
          desc: "With mushroom peppercorn sauce, green & crispy onions",
          dietary: ["gluten-free"]
        },
        {
          name: "Cloud's Platter",
          price: "$38.95",
          desc: "Coconut shrimp, calamari, chicken fingers, wings, chicken souvlaki, carrots & celery"
        },
        {
          name: "Cloud's Seafood Platter",
          price: "$39.95",
          desc: "Coconut shrimp, breaded scallops, calamari, shrimp skewers and mussels"
        },
        {
          name: "Cloud's Veggie Platter",
          price: "$31.95",
          desc: "Cheesy garlic bread, potato skins, mozzarella sticks, onion rings, deep fried pickles",
          dietary: ["vegetarian"]
        },
        {
          name: "Cloud's Mixed Platter",
          price: "$35.95",
          desc: "3 items from Cloud's platter & 2 items from vegetarian platter"
        },
        {
          name: "Classic Nachos",
          price: "$14.95",
          desc: "Tortilla chips, mix cheese, jalapeÃ±os, tomatoes, green onions, salsa & sour cream",
          dietary: ["vegetarian", "gluten-free"]
        },
        {
          name: "Irish Nachos",
          price: "$15.95",
          desc: "Waffle fries, mixed cheese, bacon, green onions & sour cream. Add: chicken $5.95, beef $5.95, steak $9.95",
          dietary: ["gluten-free"]
        },
        {
          name: "Fajitas",
          price: "$23.95",
          desc: "Hot plate with bell peppers, onion and your choice: steak, chicken or shrimp. With lettuce, tomato, cheese, salsa, sour cream & tortilla",
          dietary: ["gluten-free"]
        },
      ],
    },
    wings: {
      title: "Wings",
      icon: "ðŸ—",
      items: [
        {
          name: "1 lb Wings",
          price: "$15.95",
          desc: "Served with carrot, celery sticks with ranch or blue cheese dip",
          dietary: ["gluten-free"]
        },
        {
          name: "2 lb Wings",
          price: "$27.95",
          desc: "Served with carrot, celery sticks with ranch or blue cheese dip",
          dietary: ["gluten-free"]
        },
        {
          name: "3 lb Wings",
          price: "$38.95",
          desc: "Served with carrot, celery sticks with ranch or blue cheese dip",
          dietary: ["gluten-free"]
        },
        {
          name: "5 lb Wings",
          price: "$59.95",
          desc: "Served with carrot, celery sticks with ranch or blue cheese dip",
          dietary: ["gluten-free"]
        },
        {
          name: "Domestic Pitcher & 2lb Wings",
          price: "$39.95",
          desc: "Great combo deal!",
          dietary: ["gluten-free"]
        },
      ],
      sauces: [
        { name: "Sweet Thai Chilli", spicy: false },
        { name: "Hot and Honey", spicy: true },
        { name: "Lemon Pepper", spicy: false },
        { name: "Cajun", spicy: true },
        { name: "BBQ", spicy: false },
        { name: "Sweet Mexican", spicy: false },
        { name: "Garlic Parm", spicy: false },
        { name: "Honey Garlic", spicy: false },
        { name: "Korean BBQ", spicy: false },
        { name: "Thai Curry", spicy: true },
        { name: "Buffalo Ranch", spicy: true },
        { name: "Medium", spicy: true },
        { name: "Caribbean Jerk", spicy: true },
        { name: "Hot Sauce", spicy: true },
        { name: "Chili Onion", spicy: true },
        { name: "Cloud's Special Sauce", spicy: false },
      ],
    },
    mains: {
      title: "Mains & Grill",
      icon: "ðŸ–",
      items: [
        {
          name: "10 oz Steak",
          price: "$29.95",
          desc: "Mashed potatoes, seasonal vegetables, with peppercorn & mushroom demi glaze",
          dietary: ["gluten-free"]
        },
        {
          name: "Sesame Salmon & Shrimp",
          price: "$26.95",
          desc: "Sesame crusted salmon, grilled shrimp, rice, seasonal vegetables with lemon butter",
          dietary: ["gluten-free"]
        },
        {
          name: "Souvlaki Dinner",
          price: "Chicken $19.95 | Pork $19.95",
          desc: "Greek salad, potatoes, rice served with tzatziki sauce",
          dietary: ["gluten-free"]
        },
        {
          name: "Cloud's Thai Special",
          price: "$16.95",
          desc: "Red or green Thai curry with coconut milk, sweet peppers, bamboo shoots, carrots, onions, baby corn, bok choy & broccoli with rice. Add: Chicken $18.95, Shrimp $19.95, Steak $23.95",
          dietary: ["vegan", "gluten-free", "spicy"]
        },
        {
          name: "Butter Chicken",
          price: "$19.95",
          desc: "Boneless chicken marinated in tandoori masala creamy sauce with rice, naan & poppadam",
          dietary: ["gluten-free", "spicy"]
        },
        {
          name: "Lamb Shank",
          price: "$28.95",
          desc: "Slow cooked lamb shank with garlic mashed potatoes, steamed vegetables, crispy onions",
          dietary: ["gluten-free"]
        },
        {
          name: "Seafood Bowl",
          price: "$28.95",
          desc: "Salmon, shrimp, lobster tail, scallop, mussels, calamari in tomato sauce & saffron broth with garlic bread",
          dietary: ["gluten-free"]
        },
        {
          name: "Chicken Mushroom Marsala",
          price: "$19.95",
          desc: "Dusted chicken breast pan seared with mushroom white wine cream in marsala wine. With mashed potato and vegetables"
        },
        {
          name: "Stuffed Baked Salmon",
          price: "$25.95",
          desc: "Fresh Atlantic salmon stuffed with roasted red peppers, spinach & goat cheese with linguine pasta & pesto cream sauce"
        },
        {
          name: "Liver and Bacon",
          price: "$18.95",
          desc: "Pan seared liver sautÃ©ed with bacon, mushroom and onions, topped with demi glaze. With mashed potato and vegetables",
          dietary: ["gluten-free"]
        },
        {
          name: "Clouds Chili Chicken",
          price: "$18.95",
          desc: "Crispy chicken in house made sauce with peppers, onions and chilli sauce, served with fried rice. Shrimp $24.95, Steak $25.95",
          dietary: ["spicy"]
        },
        {
          name: "Ribs",
          price: "Half $17.95 | Full $24.95",
          desc: "Ribs smothered in smoked BBQ sauce served with fries & coleslaw",
          dietary: ["gluten-free"]
        },
        {
          name: "Ribs and Wings",
          price: "$23.95",
          desc: "1/2 rack ribs smothered in smoked BBQ sauce, wings with choice of sauce. With coleslaw & fries",
          dietary: ["gluten-free"]
        },
        {
          name: "Jerk Chicken",
          price: "$16.95",
          desc: "Caribbean seasoned chicken served with rice & seasonal vegetables",
          dietary: ["gluten-free", "spicy"]
        },
        {
          name: "Beef Curry",
          price: "$19.95",
          desc: "Slow cooked beef with carrots, celery, onion finished with coconut milk, served with rice",
          dietary: ["gluten-free", "spicy"]
        },
      ],
    },
    salads: {
      title: "Salads",
      icon: "ðŸ¥—",
      items: [
        {
          name: "Caesar Salad",
          price: "M $9.45 | L $13.45",
          desc: "Romaine lettuce, croutons, bacon, parmesan cheese & Caesar dressing"
        },
        {
          name: "Greek Salad",
          price: "M $9.45 | L $13.45",
          desc: "Romaine lettuce, tomatoes, red onions, olives, bell peppers, cucumber, feta cheese",
          dietary: ["vegetarian", "gluten-free"]
        },
        {
          name: "Garden Salad",
          price: "M $8.95 | L $11.95",
          desc: "Mixed greens, bell peppers, red onions, tomatoes, cucumbers with choice of dressing",
          dietary: ["vegan", "gluten-free"]
        },
        {
          name: "Steak & Shrimp Salad",
          price: "$17.95",
          desc: "Steak, shrimp, mixed greens, hazelnut, tomatoes, red onions, avocado, gorgonzola with balsamic",
          dietary: ["gluten-free"]
        },
        {
          name: "Cobb Salad",
          price: "$18.95",
          desc: "Grilled chicken, bacon, red onion, avocado, cucumber, tomato, bell pepper, boiled egg, mixed cheese",
          dietary: ["gluten-free"]
        },
        {
          name: "Beet Salad",
          price: "$16.95",
          desc: "Red pickled beet, pineapple, goat cheese, mixed greens, celery, hazelnuts, cucumber",
          dietary: ["vegetarian", "gluten-free"]
        },
        {
          name: "Chicken Spinach Salad",
          price: "$19.95",
          desc: "Grilled chicken, roasted red pepper, grape, almonds, goat cheese, avocado, spinach, raspberry vinaigrette",
          dietary: ["gluten-free"]
        },
      ],
    },
    sandwiches: {
      title: "Sandwiches & Wraps",
      icon: "ðŸ¥ª",
      items: [
        {
          name: "Clubhouse",
          price: "$17.95",
          desc: "Classic triple decker with grilled chicken, bacon, tomato, lettuce, cheddar cheese, mayo. With fries & garden salad"
        },
        {
          name: "Philly Cheese Steak",
          price: "$17.95",
          desc: "AAA roast beef in gravy with mushrooms, bell peppers, sautÃ©ed onions, swiss cheese. With fries & garden salad"
        },
        {
          name: "Spicy Chicken and Bacon",
          price: "$16.95",
          desc: "Crispy chicken, bacon, buffalo sauce, coleslaw, pickles, garlic aioli, brioche bun. With fries & garden salad",
          dietary: ["spicy"]
        },
        {
          name: "Chicken Parmigiana",
          price: "$15.95",
          desc: "Breaded chicken, tomato sauce, swiss cheese on brioche bun. With fries & garden salad"
        },
        {
          name: "Pulled Pork Sandwich",
          price: "$15.95",
          desc: "Slow cooked pork tenderloin, bacon, pickles, coleslaw & swiss cheese on Vienna bread. With fries & garden salad"
        },
        {
          name: "Veal Sandwich",
          price: "$16.95",
          desc: "Lightly breaded veal, peppers, onions, swiss cheese, tomato sauce. With fries & garden salad"
        },
        {
          name: "Buffalo Chicken Wrap",
          price: "$15.95",
          desc: "Breaded chicken, mixed cheese, lettuce, tomato, bacon, buffalo sauce, ranch. With fries & garden salad",
          dietary: ["spicy"]
        },
        {
          name: "Cloud's Chicken Wrap",
          price: "$15.95",
          desc: "Grilled chicken, sautÃ©ed pepper, onion, mixed green, mix cheese, tomato, avocado. With fries, garden salad & sour cream"
        },
        {
          name: "Garden Wrap",
          price: "$15.95",
          desc: "Bell pepper, mixed green, tomato, goat cheese, avocado, mushroom, roasted garlic, red onion. With fries & garden salad",
          dietary: ["vegetarian"]
        },
        {
          name: "Souvlaki Wrap",
          price: "$16.95",
          desc: "Lettuce, tomato, onion, olives, feta cheese, tzatziki with grilled chicken or pork. With fries & garden salad"
        },
      ],
    },
    burgers: {
      title: "Burgers & Poutines",
      icon: "ðŸ”",
      items: [
        {
          name: "Classic Burger",
          price: "$15.95",
          desc: "Beef burger patty with lettuce, tomato, onion, pickle & mayo. With fries & garden salad"
        },
        {
          name: "Mexican Hamburger",
          price: "$17.95",
          desc: "Beef burger with lettuce, tomato, onion, pickle, crispy bacon, fried jalapeÃ±o, swiss cheese, salsa. With fries & garden salad",
          dietary: ["spicy"]
        },
        {
          name: "Beyond Meat Burger",
          price: "$16.95",
          desc: "Plant-based burger with lettuce, tomato, onion, pickle, guacamole, roasted red pepper, cheddar. With fries & garden salad",
          dietary: ["vegan"]
        },
        {
          name: "Cloud's Special Burger",
          price: "$19.95",
          desc: "Double burger patty, lettuce, tomato, onion, pickle, bacon, jalapeÃ±os, swiss & cheddar. With fries & garden salad",
          dietary: ["spicy"]
        },
        {
          name: "Regular Poutine",
          price: "$11.95",
          desc: "Fresh cut fries topped with fresh cheese curds smothered in gravy",
          dietary: ["vegetarian"]
        },
        {
          name: "Butter Chicken Poutine",
          price: "$15.95",
          desc: "Fresh cut fries topped with fresh cheese curds smothered in butter chicken & sauce",
          dietary: ["spicy"]
        },
        {
          name: "Pulled Pork Poutine",
          price: "$15.95",
          desc: "Fresh cut fries, cheese curds, slow cooked pulled pork, homemade gravy & scallions"
        },
        {
          name: "Hot Burger Poutine",
          price: "$15.95",
          desc: "Burger meat, mushrooms, onion, bacon, cheese curds"
        },
      ],
    },
    pasta: {
      title: "Pasta",
      icon: "ðŸ",
      items: [
        {
          name: "Penne Ricardo Pasta",
          price: "$19.45",
          desc: "Chicken, bacon, tomato, mushroom, parmesan cheese in red wine cream sauce. Served with garlic bread"
        },
        {
          name: "Butternut Squash Ravioli",
          price: "$19.45",
          desc: "Ravioli in melted brown butter & parmesan, topped with fried sage & roasted hazelnuts. Served with garlic bread",
          dietary: ["vegetarian"]
        },
        {
          name: "Crab and Shrimp Macaroni",
          price: "$22.95",
          desc: "Shrimp, crab, spinach, roasted red peppers with white wine cream sauce. Served with garlic bread"
        },
        {
          name: "Pesto Chicken Fettuccine",
          price: "$21.95",
          desc: "Chicken, sun-dried tomato, roasted red peppers, red onion & pesto cream sauce. Served with garlic bread"
        },
        {
          name: "Seafood Linguine",
          price: "$25.95",
          desc: "Mussels, shrimp, salmon, calamari, scallops with marinara sauce. Served with garlic bread"
        },
        {
          name: "Chicken & Shrimp Penne",
          price: "$22.95",
          desc: "Chicken, shrimp, mushroom, bacon, with spicy tomato sauce. Served with garlic bread",
          dietary: ["spicy"]
        },
        {
          name: "Fettuccine Primavera",
          price: "$18.95",
          desc: "Mushroom, sun-dried tomato, bell peppers, broccoli, spinach with rose sauce. Served with garlic bread",
          dietary: ["vegetarian"]
        },
        {
          name: "Lobster & Shrimp Linguine",
          price: "$28.95",
          desc: "Lobster tail, black tiger shrimp, roasted peppers and spinach in spicy tomato sauce. Served with garlic bread",
          dietary: ["spicy"]
        },
        {
          name: "Chicken Parm Pasta",
          price: "$19.45",
          desc: "Breaded fried chicken breast in tomato sauce with swiss cheese. With linguine alfredo. Served with garlic bread"
        },
        {
          name: "Penne Ala Vodka",
          price: "$23.45",
          desc: "Salmon, bacon and mushroom penne in a vodka rose sauce. Served with garlic bread"
        },
        {
          name: "Seafood Risotto",
          price: "$23.95",
          desc: "Black tiger shrimp, calamari, mussels, salmon, in saffron rose sauce, green onions & parmesan. Served with garlic bread"
        },
        {
          name: "Veal Parm Pasta",
          price: "$23.95",
          desc: "Breaded veal in tomato sauce with melted swiss cheese. With linguine alfredo. Served with garlic bread"
        },
      ],
    },
    veganglutenfree: {
      title: "Vegan & Gluten-Free",
      icon: "ðŸŒ±",
      items: [
        {
          name: "Cloud's Thai Special (Vegan)",
          price: "$16.95",
          desc: "Red or green Thai curry with coconut milk, sweet peppers, bamboo shoots, carrots, onions, baby corn, bok choy & broccoli with rice",
          dietary: ["vegan", "gluten-free", "spicy"]
        },
        {
          name: "Garden Salad",
          price: "M $8.95 | L $11.95",
          desc: "Mixed greens, bell peppers, red onions, tomatoes, cucumbers with choice of dressing",
          dietary: ["vegan", "gluten-free"]
        },
        {
          name: "Beyond Meat Burger",
          price: "$16.95",
          desc: "Plant-based burger with lettuce, tomato, onion, pickle, guacamole, roasted red pepper, cheddar. With fries & garden salad",
          dietary: ["vegan"]
        },
        {
          name: "Garden Wrap",
          price: "$15.95",
          desc: "Bell pepper, mixed green, tomato, goat cheese, avocado, mushroom, roasted garlic, red onion. With fries & garden salad",
          dietary: ["vegetarian"]
        },
        {
          name: "Fettuccine Primavera",
          price: "$18.95",
          desc: "Mushroom, sun-dried tomato, bell peppers, broccoli, spinach with rose sauce. Served with garlic bread",
          dietary: ["vegetarian"]
        },
        {
          name: "Greek Salad",
          price: "M $9.45 | L $13.45",
          desc: "Romaine lettuce, tomatoes, red onions, olives, bell peppers, cucumber, feta cheese",
          dietary: ["vegetarian", "gluten-free"]
        },
        {
          name: "Beet Salad",
          price: "$16.95",
          desc: "Red pickled beet, pineapple, goat cheese, mixed greens, celery, hazelnuts, cucumber",
          dietary: ["vegetarian", "gluten-free"]
        },
        {
          name: "Butternut Squash Ravioli",
          price: "$19.45",
          desc: "Ravioli in melted brown butter & parmesan, topped with fried sage & roasted hazelnuts. Served with garlic bread",
          dietary: ["vegetarian"]
        },
      ],
    },
    classics: {
      title: "Classics & Sides",
      icon: "ðŸŸ",
      items: [
        {
          name: "Fish and Chips",
          price: "$14.95",
          desc: "Battered haddock with fries, coleslaw & tartar sauce"
        },
        {
          name: "Chicken Fingers",
          price: "$16.45",
          desc: "Crispy chicken fingers with fries & choice of sauce"
        },
        {
          name: "Onion Rings",
          price: "$8.95",
          desc: "Crispy golden onion rings",
          dietary: ["vegetarian"]
        },
        {
          name: "Truffle Fries",
          price: "$8.95",
          desc: "Hand-cut fries with truffle oil",
          dietary: ["vegan", "gluten-free"]
        },
        {
          name: "Steam Vegs",
          price: "$6.95",
          desc: "Fresh seasonal steamed vegetables",
          dietary: ["vegan", "gluten-free"]
        },
        {
          name: "Coleslaw",
          price: "$4.95",
          desc: "Creamy homemade coleslaw",
          dietary: ["vegetarian", "gluten-free"]
        },
        {
          name: "Tater Tots",
          price: "$7.95",
          desc: "Crispy golden tater tots",
          dietary: ["vegan"]
        },
        {
          name: "Sweet Potato Fries",
          price: "$8.95",
          desc: "Crispy sweet potato fries",
          dietary: ["vegan", "gluten-free"]
        },
        {
          name: "Fries",
          price: "$6.95",
          desc: "Classic golden fries",
          dietary: ["vegan", "gluten-free"]
        },
        {
          name: "Mashed Potatoes",
          price: "$5.95",
          desc: "Creamy mashed potatoes",
          dietary: ["vegetarian", "gluten-free"]
        },
        {
          name: "Waffle Fries",
          price: "$6.95",
          desc: "Crispy waffle-cut fries",
          dietary: ["vegan"]
        },
        {
          name: "Fresh Cut Fries",
          price: "$7.95",
          desc: "Hand-cut fresh fries",
          dietary: ["vegan", "gluten-free"]
        },
      ],
    },
    desserts: {
      title: "Desserts",
      icon: "ðŸ°",
      items: [
        {
          name: "Classic Cheesecake",
          price: "$8.95",
          desc: "Choice of strawberry, chocolate or caramel sauce",
          dietary: ["vegetarian"]
        },
        {
          name: "Ice Cream",
          price: "$6.95",
          desc: "Chocolate or vanilla ice cream topped with strawberry, chocolate or caramel sauce",
          dietary: ["vegetarian", "gluten-free"]
        },
        {
          name: "Brownie Cheese Cake",
          price: "$9.95",
          desc: "Choice of strawberry, chocolate or caramel sauce",
          dietary: ["vegetarian"]
        },
        {
          name: "Chocolate Fudge Brownie",
          price: "$9.95",
          desc: "Topped with choice of vanilla or chocolate ice cream",
          dietary: ["vegetarian"]
        },
      ],
    },
    kids: {
      title: "Kids Menu",
      icon: "ðŸ§’",
      items: [
        {
          name: "Kids Menu",
          price: "$11.95",
          desc: "For children under 12. Includes meal, drink, and choice of dessert"
        },
      ],
      meals: [
        "Pasta (cream/tomato/butter sauce)",
        "Burger with Fries",
        "Chicken Fingers",
        "Boneless Wings & Fries",
        "Macaroni & Cheese",
        "Kids Pizza (naan bread with tomato sauce & mixed cheese)",
      ],
      drinks: ["Milk", "Chocolate Milk", "Apple Juice", "Orange Juice"],
      desserts: [
        "Vanilla Ice Cream",
        "Chocolate Ice Cream",
        "Brownie (add ice cream $1.95)",
      ],
    },
  };

  const tabs = Object.keys(menuData);

  const scrollTabs = (direction) => {
    if (tabContainerRef.current) {
      const scrollAmount = 300;
      tabContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const getAllItems = () => {
    const allItems = [];
    Object.keys(menuData).forEach((category) => {
      menuData[category].items.forEach((item) => {
        allItems.push({
          ...item,
          category,
          categoryTitle: menuData[category].title,
        });
      });
    });
    return allItems;
  };

  const filteredItems = searchQuery
    ? getAllItems().filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.desc &&
            item.desc.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const DietaryIcons = ({ dietary }) => {
    if (!dietary || dietary.length === 0) return null;
    
    return (
      <div className="flex gap-2 mt-2">
        {dietary.includes("vegan") && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-900/30 border border-green-700/50 rounded text-green-400 text-xs font-medium">
            <Leaf size={12} />
            Vegan
          </span>
        )}
        {dietary.includes("vegetarian") && !dietary.includes("vegan") && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-900/30 border border-green-700/50 rounded text-green-400 text-xs font-medium">
            <Leaf size={12} />
            Vegetarian
          </span>
        )}
        {dietary.includes("gluten-free") && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-900/30 border border-amber-700/50 rounded text-amber-400 text-xs font-medium">
            GF
          </span>
        )}
        {dietary.includes("spicy") && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-900/30 border border-amber-700/50 rounded text-amber-400 text-xs font-medium">
            <Flame size={12} />
            Spicy
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 via-neutral-900 to-amber-900">
      {/* Header */}
      <div className="relative w-full overflow-hidden border-b border-amber-900/30">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&h=400&fit=crop"
            alt="Menu Background"
            className="w-full h-full object-contain opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-amber-900 via-amber-800/80 to-amber-900"></div>
        </div>

        <div className="relative text-center py-16 px-4">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
            Our <span className="text-amber-600">Menu</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-6">
            Explore our delicious selection of dishes crafted with passion
          </p>

          <button
            onClick={() => setShowSearch(!showSearch)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg inline-flex items-center gap-2"
          >
            <Search size={20} />
            Search Menu
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="sticky top-0 z-50 bg-amber-800/95 backdrop-blur-md border-b border-amber-900/30 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search for dishes, ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900 text-white pl-12 pr-12 py-3 rounded-lg border border-gray-700 focus:border-amber-600 focus:outline-none"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2 text-sm text-gray-400">
                {filteredItems.length} result
                {filteredItems.length !== 1 ? "s" : ""} found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      {!searchQuery && (
        <div className="sticky top-0 z-50 bg-amber-800/95 backdrop-blur-md border-b border-amber-900/30 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 relative">
            <button
              onClick={() => scrollTabs("left")}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-amber-600 hover:bg-amber-700 text-white p-2 rounded-full shadow-lg transition-all"
            >
              <ChevronLeft size={24} />
            </button>

            <div
              ref={tabContainerRef}
              className="flex overflow-x-hidden gap-1 py-3 px-12 scroll-smooth"
            >
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 px-6 py-3 rounded-lg font-semibold transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab
                      ? "bg-amber-600 text-white shadow-lg shadow-amber-600/50 scale-105"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <span className="mr-2">{menuData[tab].icon}</span>
                  {menuData[tab].title}
                </button>
              ))}
            </div>

            <button
              onClick={() => scrollTabs("right")}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-amber-600 hover:bg-amber-700 text-white p-2 rounded-full shadow-lg transition-all"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Menu Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {searchQuery ? (
          <>
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Search className="text-amber-600" size={40} />
                Search Results
              </h2>
              <div className="h-1 w-24 bg-amber-600 rounded-full"></div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-xl">
                  No items found matching "{searchQuery}"
                </p>
                <p className="text-gray-500 mt-2">
                  Try searching for something else
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredItems.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-900 to-amber-900 border border-gray-800 rounded-xl p-6 hover:border-amber-600/50 hover:shadow-lg hover:shadow-amber-600/20 transition-all duration-300 group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white group-hover:text-amber-500 transition-colors">
                          {item.name}
                        </h3>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                          {item.categoryTitle}
                        </span>
                      </div>
                      {/* <span className="text-amber-600 font-bold text-lg ml-4 flex-shrink-0">
                        {item.price}
                      </span> */}
                    </div>
                    {item.desc && (
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {item.desc}
                      </p>
                    )}
                    <DietaryIcons dietary={item.dietary} />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <span className="text-5xl">{menuData[activeTab].icon}</span>
                {menuData[activeTab].title}
              </h2>
              <div className="h-1 w-24 bg-amber-600 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {menuData[activeTab].items.map((item, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-gray-900 to-amber-900 border border-gray-800 rounded-xl p-6 hover:border-amber-600/50 hover:shadow-lg hover:shadow-amber-600/20 transition-all duration-300 group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-500 transition-colors flex-1">
                      {item.name}
                    </h3>
                    {/* <span className="text-amber-600 font-bold text-lg ml-4 flex-shrink-0">
                      {item.price}
                    </span> */}
                  </div>
                  {item.desc && (
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  )}
                  <DietaryIcons dietary={item.dietary} />
                </div>
              ))}
            </div>

            {/* Wing Sauces */}
            {activeTab === "wings" && menuData.wings.sauces && (
              <div className="mt-8 bg-gradient-to-br from-gray-900 to-amber-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Flame className="text-amber-600" size={28} />
                  Wing Sauce Flavours
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {menuData.wings.sauces.map((sauce, index) => (
                    <div
                      key={index}
                      className="bg-gray-800 rounded-lg px-4 py-3 text-center hover:bg-gray-700 transition-colors"
                    >
                      <span className="text-gray-300 text-sm flex items-center justify-center gap-2">
                        {sauce.spicy && <Flame size={14} className="text-amber-500" />}
                        {sauce.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Kids Menu Extra Info */}
            {activeTab === "kids" && (
              <div className="mt-8 space-y-6">
                <div className="bg-gradient-to-br from-gray-900 to-amber-900 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Meal Options
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {menuData.kids.meals.map((meal, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-gray-300"
                      >
                        <span className="text-amber-600">â€¢</span>
                        {meal}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-gray-900 to-amber-900 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Drinks
                    </h3>
                    <div className="space-y-2">
                      {menuData.kids.drinks.map((drink, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-gray-300"
                        >
                          <span className="text-amber-600">â€¢</span>
                          {drink}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-900 to-amber-900 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-2xl font-bold text-white mb-4">
                      Desserts
                    </h3>
                    <div className="space-y-2">
                      {menuData.kids.desserts.map((dessert, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-gray-300"
                        >
                          <span className="text-amber-600">â€¢</span>
                          {dessert}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Call to Action */}
            <div className="mt-12 text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="https://cloudnine.restropilot.com/restaurant/cloud-nine"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white px-12 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 hover:shadow-2xl shadow-lg shadow-amber-900/50 active:scale-95"
                >
                  Order Online
                </a>
              
              </div>
            </div>
          </>
        )}
      </div>

      {/* Dietary Legend */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="bg-gradient-to-br from-gray-900 to-amber-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Dietary Guide</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Leaf size={16} className="text-green-400" />
              <span className="text-gray-300 text-sm">Vegan / Vegetarian</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-sm font-bold">GF</span>
              <span className="text-gray-300 text-sm">Gluten-Free</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-amber-400" />
              <span className="text-gray-300 text-sm">Spicy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudNineMenu;
