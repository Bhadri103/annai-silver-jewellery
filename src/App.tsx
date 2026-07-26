import { ArrowLeft } from "lucide-react";
import { HashRouter as Router, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";
import AnnaiJewelleryChat from "./components/AnnaiJewelleryChat";
import WhatsAppButton from "./components/WhatsAppButton";
import ScrollToTop from "./components/ScrollToTop";
import SiteMotion from "./components/SiteMotion";
import ShortScrollbar from "./components/ShortScrollbar";
import AboutPage from "./pages/AboutPage";
import AuthPage from "./pages/AuthPage";
import BookingPage from "./pages/BookingPage";
import ContactPage from "./pages/ContactPage";
import HomePage from "./pages/HomePage";
import UserProfilePage, { UserOrderDetailsPage, UserOrdersPage, UserWishlistPage } from "./pages/MemberAccountPage";
import PaymentStatusPage from "./pages/PaymentStatusPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CollectionPage from "./pages/CollectionPage";
import SupplementCartPage from "./pages/SupplementCartPage";
import SupplementCheckoutPage from "./pages/SupplementCheckoutPage";

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const showBackButton = location.pathname !== "/";
  return <>
    <ScrollToTop />
    <SiteMotion pageKey={location.pathname} />
    <ShortScrollbar />
    <div className="min-h-screen bg-white text-amber-900">
      <Header />
      <main className="pt-[82px] lg:pt-[76px]">
        {showBackButton && <div className="site-back-row"><button type="button" onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/")} className="site-back-button inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition sm:h-10 sm:w-10" aria-label="Go back"><ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" /></button></div>}
        <div key={location.pathname} className="site-page-enter">
        <Routes>
          <Route path="/" element={<HomePage />} /><Route path="/about" element={<AboutPage />} /><Route path="/collection/:collectionId" element={<CollectionPage />} /><Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<SupplementCartPage />} /><Route path="/checkout" element={<SupplementCheckoutPage />} />
          <Route path="/login" element={<AuthPage initialMode="login" />} /><Route path="/register" element={<AuthPage initialMode="register" />} /><Route path="/forgot-password" element={<AuthPage initialMode="forgot" />} />
          <Route path="/profile" element={<UserProfilePage />} /><Route path="/my-orders" element={<UserOrdersPage />} /><Route path="/my-orders/:id" element={<UserOrderDetailsPage />} /><Route path="/wishlist" element={<UserWishlistPage />} /><Route path="/payment-status" element={<PaymentStatusPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/contact" element={<ContactPage />} /><Route path="/contact-us" element={<ContactPage />} /><Route path="*" element={<HomePage />} />
        </Routes>
        </div>
      </main>
      <Footer /><AnnaiJewelleryChat /><WhatsAppButton />
    </div>
  </>;
};
export default function App(){return <Router><AppContent /></Router>;}
