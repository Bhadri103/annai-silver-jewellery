import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";
import WhatsAppButton from "./components/WhatsAppButton";
import ScrollToTop from "./components/ScrollToTop";
import SiteMotion from "./components/SiteMotion";
import ShortScrollbar from "./components/ShortScrollbar";
import AuthPage from "./pages/AuthPage";
import BookingPage from "./pages/BookingPage";
import HomePage from "./pages/HomePage";
import UserProfilePage, { UserChangePasswordPage, UserOrderDetailsPage, UserOrdersPage, UserWishlistPage } from "./pages/MemberAccountPage";
import PaymentStatusPage from "./pages/PaymentStatusPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CollectionPage from "./pages/CollectionPage";
import SupplementCartPage from "./pages/SupplementCartPage";
import SupplementCheckoutPage from "./pages/SupplementCheckoutPage";
import AdminPage from "./pages/AdminPage";

if (window.location.hash.startsWith("#/")) {
  window.history.replaceState(null, "", window.location.hash.slice(1));
}

const AppContent = () => {
  const location = useLocation();
  if (location.pathname.startsWith("/admin")) {
    return <><ScrollToTop /><Routes><Route path="/admin/*" element={<AdminPage />} /></Routes></>;
  }
  return <>
    <ScrollToTop />
    <SiteMotion pageKey={location.pathname} />
    <ShortScrollbar />
    <div className="min-h-screen bg-white text-amber-900">
      <Header />
      <main className="pt-[124px]">
        <div key={location.pathname} className="site-page-enter">
        <Routes>
          <Route path="/" element={<HomePage />} /><Route path="/collection/:collectionId" element={<CollectionPage />} /><Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<SupplementCartPage />} /><Route path="/checkout" element={<SupplementCheckoutPage />} />
          <Route path="/login" element={<AuthPage initialMode="login" />} /><Route path="/register" element={<AuthPage initialMode="register" />} /><Route path="/forgot-password" element={<AuthPage initialMode="forgot" />} />
          <Route path="/profile" element={<UserProfilePage />} /><Route path="/my-orders" element={<UserOrdersPage />} /><Route path="/my-orders/:id" element={<UserOrderDetailsPage />} /><Route path="/wishlist" element={<UserWishlistPage />} /><Route path="/change-password" element={<UserChangePasswordPage />} /><Route path="/payment-status" element={<PaymentStatusPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  </>;
};
export default function App(){return <Router><AppContent /></Router>;}
