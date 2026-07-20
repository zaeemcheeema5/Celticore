import React, { useState } from 'react';
import { ShoppingCart, Heart, User, LogOut, Settings, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

import logoImage from '../../assets/logo.jpg';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: any) => void;
  onOpenAuth: () => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAdmin: () => void;
  onOpenNutrition: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenAuth,
  onOpenCart,
  onOpenWishlist,
  onOpenAdmin,
  onOpenNutrition,
}) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistItems } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleNavigate = (page: any) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 lg:px-16 py-4"
      style={{
        background: "linear-gradient(180deg, rgba(5,5,5,0.97) 0%, rgba(5,5,5,0.85) 100%)",
        backdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(16,185,129,0.12)",
      }}
    >
      {/* Brand Logo */}
      <button onClick={() => handleNavigate("home")} className="flex items-center gap-2.5 group cursor-pointer">
        <img
          src={logoImage}
          alt="Celti Core Logo"
          className="w-9 h-9 shrink-0 object-contain rounded-full border border-emerald-500/30"
          style={{ filter: "drop-shadow(0 0 4px rgba(16,185,129,0.3))" }}
        />
        <span
          className="text-[1.1rem] font-black tracking-[0.2em] uppercase"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            background: "linear-gradient(120deg, #ffffff 0%, #10B981 55%, #D4AF37 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Celti Core
        </span>
      </button>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-9">
        <button onClick={() => handleNavigate("home")} className="nav-link">Shop</button>
        <button onClick={onOpenNutrition} className="nav-link">Nutrition Consultation</button>
        <button onClick={() => {
          handleNavigate("home");
          setTimeout(() => {
            document.getElementById('footer-contact')?.scrollIntoView({ behavior: 'smooth' });
          }, 300);
        }} className="nav-link">Contact</button>
      </div>

      {/* Right Side Icons */}
      <div className="flex items-center gap-3">
        {/* Wishlist Icon */}
        <button
          onClick={onOpenWishlist}
          className="relative p-2 text-white/50 hover:text-white transition-colors cursor-pointer"
          title="Wishlist"
        >
          <Heart size={19} className={wishlistItems.length > 0 ? "fill-red-500 text-red-500" : ""} />
          {wishlistItems.length > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full text-[9px] flex items-center justify-center font-black animate-pulse"
              style={{ background: "#EF4444", color: "#fff" }}
            >
              {wishlistItems.length}
            </span>
          )}
        </button>

        {/* Shopping Cart Icon */}
        <button
          onClick={onOpenCart}
          className="relative p-2 text-white/50 hover:text-white transition-colors cursor-pointer"
          title="Cart"
        >
          <ShoppingCart size={19} />
          {cartCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full text-[9px] flex items-center justify-center font-black"
              style={{ background: "#10B981", color: "#000" }}
            >
              {cartCount}
            </span>
          )}
        </button>

        {/* Auth Dropdown or Button */}
        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer border border-emerald-500/25 bg-emerald-500/5 rounded"
            >
              <User size={13} />
              <span className="hidden sm:inline">{user?.name}</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-48 rounded border border-white/10 bg-[#0d0d0d] p-1 shadow-xl z-50"
                onMouseLeave={() => setProfileDropdownOpen(false)}
              >
                {isAdmin && (
                  <button
                    onClick={() => {
                      onOpenAdmin();
                      setProfileDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-white/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <Settings size={14} className="text-emerald-400" />
                    Admin Dashboard
                  </button>
                )}
                <button
                  onClick={() => {
                    logout();
                    setProfileDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 hover:text-red-300 hover:bg-white/5 transition-all cursor-pointer"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="hidden md:inline-flex items-center gap-2 px-5 py-2 text-[0.7rem] font-bold tracking-[0.18em] uppercase transition-all duration-250 cursor-pointer"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              border: "1px solid #10B981",
              color: "#10B981",
              background: "rgba(16,185,129,0.06)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#10B981";
              e.currentTarget.style.color = "#000";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(16,185,129,0.06)";
              e.currentTarget.style.color = "#10B981";
            }}
          >
            Login / Sign Up
          </button>
        )}

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-white/60 hover:text-white transition-colors cursor-pointer"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-[65px] z-40 flex flex-col items-center justify-center gap-6"
          style={{
            background: "rgba(5,5,5,0.98)",
            backdropFilter: "blur(20px)",
            height: "calc(100vh - 65px)",
          }}
        >
          {["protein", "creatine", "eaa-bcaa", "vitamins", "pre-workout", "wellbeing"].map((p) => (
            <button
              key={p}
              onClick={() => handleNavigate(p)}
              className="text-2.5xl font-black tracking-[0.12em] uppercase hover:text-emerald-400 transition-colors text-white cursor-pointer"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {p.replace('-', ' ')}
            </button>
          ))}
          
          <button
            onClick={onOpenNutrition}
            className="text-lg font-black tracking-[0.12em] uppercase text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Nutrition Consultation
          </button>

          {!isAuthenticated && (
            <button
              onClick={() => {
                onOpenAuth();
                setMobileMenuOpen(false);
              }}
              className="mt-4 px-10 py-3 text-sm font-bold tracking-widest uppercase cursor-pointer"
              style={{
                border: "1px solid #10B981",
                color: "#10B981",
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              Login / Sign Up
            </button>
          )}
        </div>
      )}
    </nav>
  );
};
