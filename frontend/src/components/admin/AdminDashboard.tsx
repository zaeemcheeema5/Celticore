import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldAlert, BarChart3, Database, Award, ClipboardCheck, MessageSquare, Plus, Trash2, CheckCircle2, XCircle, Star, ShoppingBag, Layers, Edit2, Upload, Eye, UserPlus, Key } from 'lucide-react';
import { dashboardService } from '../../api/dashboard';
import { productsService } from '../../api/products';
import { reviewsService } from '../../api/reviews';
import { couponsService } from '../../api/coupons';
import { contactService } from '../../api/contact';
import { nutritionService } from '../../api/nutrition';
import { ordersService } from '../../api/orders';
import { settingsService } from '../../api/settings';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../api/client';
import { Product, Category, Review, Coupon, ContactMessage, NutritionRequest, DashboardStats, Order } from '../../types';
import { toast } from 'sonner';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onCatalogChange?: () => void;
}

type TabType = 'stats' | 'orders' | 'products' | 'categories' | 'reviews' | 'coupons' | 'contact' | 'nutrition' | 'admins';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose, onCatalogChange }) => {
  if (!isOpen) return null;

  const { user } = useAuth();
  const isMainAdmin = user?.role === 'main_admin';

  const [activeTab, setActiveTab] = useState<TabType>('stats');
  
  // Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [nutrition, setNutrition] = useState<NutritionRequest[]>([]);
  
  // Form States (Products)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodId, setProdId] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodSubtitle, setProdSubtitle] = useState('');
  const [prodBrand, setProdBrand] = useState('CeltiCore');
  const [prodPrice, setProdPrice] = useState('');
  const [prodOrigPrice, setProdOrigPrice] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodBadge, setProdBadge] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodStock, setProdStock] = useState('100');
  const [prodLowStock, setProdLowStock] = useState('10');
  const [prodIsActive, setProdIsActive] = useState(true);
  
  // Flavours (Dynamic tags)
  const [flavoursList, setFlavoursList] = useState<string[]>(['Chocolate', 'Vanilla']);
  const [newFlavour, setNewFlavour] = useState('');
  const [uploadingProdImg, setUploadingProdImg] = useState(false);

  // Form States (Categories)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catTagline, setCatTagline] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catAccentColor, setCatAccentColor] = useState('#22c55e');
  const [catEffect, setCatEffect] = useState('energy');
  const [catImage, setCatImage] = useState('');
  const [catCardImage, setCatCardImage] = useState('');
  const [uploadingCatImg, setUploadingCatImg] = useState(false);
  const [uploadingCatCardImg, setUploadingCatCardImg] = useState(false);

  // Form States (Coupons)
  const [couponCode, setCouponCode] = useState('');
  const [couponPercent, setCouponPercent] = useState('10');

  // Form States (Admin / Credentials)
  const [users, setUsers] = useState<any[]>([]);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [createUsername, setCreateUsername] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');

  // Load Admin Data depending on active tab
  const loadData = async () => {
    try {
      if (activeTab === 'stats') {
        const data = await dashboardService.getStats();
        setStats(data);
      } else if (activeTab === 'orders') {
        const data = await ordersService.getAllOrders();
        setOrders(data.sort((a, b) => b.id - a.id));
      } else if (activeTab === 'admins') {
        const data = await settingsService.getUsers();
        if (data.success) {
          setUsers(data.users);
        }
      } else if (activeTab === 'products') {
        const prods = await productsService.getProducts();
        setProducts(prods);
        const cats = await productsService.getCategories();
        setCategories(cats);
        if (cats.length > 0 && !prodCategory) {
          setProdCategory(cats[0].id);
        }
      } else if (activeTab === 'categories') {
        const cats = await productsService.getCategories();
        setCategories(cats);
      } else if (activeTab === 'reviews') {
        const data = await reviewsService.getAllReviews();
        setReviews(data);
      } else if (activeTab === 'coupons') {
        const data = await couponsService.getCoupons();
        setCoupons(data);
      } else if (activeTab === 'contact') {
        const data = await contactService.getAllMessages();
        setMessages(data);
      } else if (activeTab === 'nutrition') {
        const data = await nutritionService.getAllRequests();
        setNutrition(data);
      }
    } catch (err: any) {
      console.error("Failed to load admin data", err);
      toast.error("Failed to load data: " + err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Product Actions
  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingProdImg(true);
    try {
      const res = await productsService.uploadProductImage(formData);
      if (res.success) {
        setProdImage(res.image);
        toast.success("Image uploaded successfully.");
      } else {
        toast.error("Failed to upload image.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image.");
    } finally {
      setUploadingProdImg(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice || !prodImage || !prodDesc) {
      toast.error("Please fill in all mandatory product details.");
      return;
    }

    try {
      const productPayload = {
        id: editingProduct ? editingProduct.id : (prodId || prodName.toLowerCase().replace(/\s+/g, '-')),
        name: prodName,
        subtitle: prodSubtitle,
        brand: prodBrand,
        category: prodCategory,
        price: parseFloat(prodPrice),
        originalPrice: prodOrigPrice ? parseFloat(prodOrigPrice) : undefined,
        image: prodImage,
        description: prodDesc,
        badge: prodBadge || undefined,
        flavours: flavoursList,
        stockQuantity: parseInt(prodStock) || 0,
        lowStockThreshold: parseInt(prodLowStock) || 5,
        isActive: prodIsActive
      };

      if (editingProduct) {
        await productsService.updateProduct(editingProduct.id, productPayload);
        toast.success(`Product "${prodName}" updated successfully!`);
      } else {
        await productsService.addProduct(productPayload);
        toast.success(`Product "${prodName}" added successfully!`);
      }

      // Reset Form & states
      setEditingProduct(null);
      setProdId('');
      setProdName('');
      setProdSubtitle('');
      setProdBrand('CeltiCore');
      setProdPrice('');
      setProdOrigPrice('');
      setProdImage('');
      setProdBadge('');
      setProdDesc('');
      setProdStock('100');
      setProdLowStock('10');
      setProdIsActive(true);
      setFlavoursList(['Chocolate', 'Vanilla']);
      
      // Reload products list
      const data = await productsService.getProducts();
      setProducts(data);
      onCatalogChange?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    }
  };

  const handleEditProductClick = (p: Product) => {
    setEditingProduct(p);
    setProdId(p.id);
    setProdName(p.name);
    setProdSubtitle(p.subtitle || '');
    setProdBrand(p.brand || 'CeltiCore');
    setProdPrice(p.price.toString());
    setProdOrigPrice((p.originalPrice || '').toString());
    setProdImage(p.image);
    setProdCategory(p.category || '');
    setProdBadge(p.badge || '');
    setProdDesc(p.description);
    setProdStock((p.stockQuantity ?? 100).toString());
    setProdLowStock((p.lowStockThreshold ?? 10).toString());
    setProdIsActive(p.isActive === undefined ? true : (!!p.isActive));
    setFlavoursList(p.flavours || []);
  };

  const handleCancelEditProduct = () => {
    setEditingProduct(null);
    setProdId('');
    setProdName('');
    setProdSubtitle('');
    setProdBrand('CeltiCore');
    setProdPrice('');
    setProdOrigPrice('');
    setProdImage('');
    setProdBadge('');
    setProdDesc('');
    setProdStock('100');
    setProdLowStock('10');
    setProdIsActive(true);
    setFlavoursList(['Chocolate', 'Vanilla']);
  };

  const handleDeleteProduct = async (id: string | number) => {
    try {
      await productsService.deleteProduct(id);
      toast.success("Product deleted.");
      setProducts(prev => prev.filter(p => p.id !== id));
      onCatalogChange?.();
      if (editingProduct && editingProduct.id === id) {
        handleCancelEditProduct();
      }
    } catch (err: any) {
      toast.error("Failed to delete product: " + err.message);
    }
  };

  // Category Actions
  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCard: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    if (isCard) setUploadingCatCardImg(true);
    else setUploadingCatImg(true);

    try {
      const res = await productsService.uploadCategoryImage(formData);
      if (res.success) {
        if (isCard) setCatCardImage(res.image);
        else setCatImage(res.image);
        toast.success("Category image uploaded successfully.");
      } else {
        toast.error("Failed to upload image.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image.");
    } finally {
      if (isCard) setUploadingCatCardImg(false);
      else setUploadingCatImg(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug || !catDescription) {
      toast.error("Please fill in all mandatory category details.");
      return;
    }

    try {
      const categoryPayload = {
        name: catName,
        slug: catSlug,
        tagline: catTagline,
        description: catDescription,
        accentColor: catAccentColor,
        effect: catEffect,
        image: catImage,
        cardImage: catCardImage
      };

      if (editingCategory) {
        await productsService.updateCategory(editingCategory.id, categoryPayload);
        toast.success(`Category "${catName}" updated successfully!`);
      } else {
        await productsService.addCategory(categoryPayload);
        toast.success(`Category "${catName}" created successfully!`);
      }

      // Reset Form & states
      setEditingCategory(null);
      setCatName('');
      setCatSlug('');
      setCatTagline('');
      setCatDescription('');
      setCatAccentColor('#22c55e');
      setCatEffect('energy');
      setCatImage('');
      setCatCardImage('');

      // Reload category list
      const data = await productsService.getCategories();
      setCategories(data);
      onCatalogChange?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to save category");
    }
  };

  const handleEditCategoryClick = (c: Category) => {
    setEditingCategory(c);
    setCatName(c.name);
    setCatSlug(c.slug);
    setCatTagline(c.tagline || '');
    setCatDescription(c.description);
    setCatAccentColor(c.accent_color || c.accentColor || '#22c55e');
    setCatEffect(c.effect || 'energy');
    setCatImage(c.image || '');
    setCatCardImage(c.card_image || c.cardImage || '');
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatSlug('');
    setCatTagline('');
    setCatDescription('');
    setCatAccentColor('#22c55e');
    setCatEffect('energy');
    setCatImage('');
    setCatCardImage('');
  };

  const handleDeleteCategory = async (id: string | number) => {
    try {
      await productsService.deleteCategory(id);
      toast.success("Category deleted.");
      setCategories(prev => prev.filter(c => c.id !== id));
      onCatalogChange?.();
      if (editingCategory && editingCategory.id === id) {
        handleCancelEditCategory();
      }
    } catch (err: any) {
      toast.error("Failed to delete category: " + err.message);
    }
  };

  const handleSaveNutritionNotes = async (id: number, admin_notes: string) => {
    try {
      await nutritionService.addNotes(id, admin_notes);
      toast.success("Nutrition notes saved successfully.");
      setNutrition(prev => prev.map(n => n.id === id ? { ...n, admin_notes } : n));
    } catch (err: any) {
      toast.error("Failed to save notes: " + err.message);
    }
  };

  // Review Actions
  const handleApproveReview = async (id: number) => {
    try {
      await reviewsService.approveReview(id);
      toast.success("Review approved.");
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    } catch (err: any) {
      toast.error("Failed to approve review: " + err.message);
    }
  };

  const handleRejectReview = async (id: number) => {
    try {
      await reviewsService.rejectReview(id);
      toast.success("Review rejected.");
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    } catch (err: any) {
      toast.error("Failed to reject review: " + err.message);
    }
  };

  const handleDeleteReview = async (id: number) => {
    try {
      await reviewsService.deleteReview(id);
      toast.success("Review deleted.");
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      toast.error("Failed to delete review: " + err.message);
    }
  };

  // Coupon Actions
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      await couponsService.createCoupon({
        code: couponCode.toUpperCase(),
        discount_type: "percentage",
        discount_value: parseInt(couponPercent),
        expiry_date: null
      });
      toast.success("Coupon code created.");
      setCouponCode('');
      // Reload
      const data = await couponsService.getCoupons();
      setCoupons(data);
    } catch (err: any) {
      toast.error("Failed to create coupon: " + err.message);
    }
  };

  const handleDeleteCoupon = async (id: number | string) => {
    try {
      await couponsService.deleteCoupon(id);
      toast.success("Coupon deleted.");
      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      toast.error("Failed to delete coupon: " + err.message);
    }
  };

  // Contact Message Actions
  const handleMarkMessageRead = async (id: number) => {
    try {
      await contactService.markAsRead(id);
      toast.success("Marked as read.");
      setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
    } catch (err: any) {
      toast.error("Error: " + err.message);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    try {
      await contactService.deleteMessage(id);
      toast.success("Message deleted.");
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      toast.error("Error: " + err.message);
    }
  };

  // Nutrition Actions
  const handleUpdateNutritionStatus = async (id: number, status: 'pending' | 'completed' | 'cancelled') => {
    try {
      await nutritionService.updateStatus(id, status);
      toast.success("Nutrition status updated to " + status);
      setNutrition(prev => prev.map(n => n.id === id ? { ...n, status } : n));
    } catch (err: any) {
      toast.error("Error: " + err.message);
    }
  };

  const handleUpdateOrderStatus = async (id: number | string, status: any) => {
    try {
      await ordersService.updateOrder(id, { status });
      toast.success("Order status updated to " + status);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    } catch (err: any) {
      toast.error("Error updating order: " + err.message);
    }
  };

  const handleCreateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createUsername.trim() || !createEmail.trim() || !createPassword.trim()) {
      toast.error("All fields are required to create an admin profile.");
      return;
    }
    try {
      const res = await settingsService.createAdminProfile({
        username: createUsername.trim(),
        email: createEmail.trim(),
        password: createPassword.trim()
      });
      if (res.success) {
        toast.success(res.message || "Admin profile created.");
        setCreateUsername('');
        setCreateEmail('');
        setCreatePassword('');
        // Reload users list
        const usersRes = await settingsService.getUsers();
        if (usersRes.success) {
          setUsers(usersRes.users);
        }
      }
    } catch (err: any) {
      toast.error("Failed to create admin profile: " + (err.message || err.error || err));
    }
  };

  const handleDeleteUser = async (id: number | string) => {
    if (!window.confirm("Are you sure you want to delete this user? This action is permanent.")) return;
    try {
      const res = await settingsService.deleteUser(id);
      if (res.success) {
        toast.success(res.message || "User deleted successfully.");
        setUsers(prev => prev.filter(u => u.id !== id));
      }
    } catch (err: any) {
      toast.error("Failed to delete user: " + (err.message || err.error || err));
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUsername.trim() && !newAdminEmail.trim() && !newAdminPassword.trim()) {
      toast.error("Please enter at least one field to update.");
      return;
    }
    try {
      const payload: any = {};
      if (newAdminUsername.trim()) payload.username = newAdminUsername.trim();
      if (newAdminEmail.trim()) payload.email = newAdminEmail.trim();
      if (newAdminPassword.trim()) payload.password = newAdminPassword.trim();

      const res = await settingsService.updateAdminCredentials(payload);
      if (res.success) {
        toast.success(res.message || "Credentials updated successfully.");
        setNewAdminUsername('');
        setNewAdminEmail('');
        setNewAdminPassword('');
        // Reload users list
        const usersRes = await settingsService.getUsers();
        if (usersRes.success) {
          setUsers(usersRes.users);
        }
      }
    } catch (err: any) {
      toast.error("Failed to update credentials: " + (err.message || err.error || err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto bg-black/90 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-5xl sm:rounded border border-white/10 bg-[#090909] text-white flex flex-col md:flex-row h-screen sm:h-[85vh] overflow-hidden"
        style={{ boxShadow: "0 0 50px rgba(16,185,129,0.15)" }}
      >
        {/* Sidebar Navigation */}
        <div className="w-full md:w-56 bg-[#0c0c0c] border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-between shrink-0 p-3 md:p-4">
          <div className="md:space-y-6">
            <div className="flex items-center justify-between md:justify-start gap-2 text-emerald-400 mb-2 md:mb-0">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} />
                <span className="text-sm font-black uppercase tracking-wider" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Admin Control</span>
              </div>
              <button
                onClick={onClose}
                className="md:hidden p-1.5 text-white/40 hover:text-white rounded hover:bg-white/5 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav Tabs */}
            <div className="flex md:flex-col gap-1 text-xs overflow-x-auto md:overflow-visible scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0 pb-1 md:pb-0">
              {(
                [
                  { id: 'stats', label: 'Dashboard Stats', icon: BarChart3 },
                  { id: 'orders', label: 'Order Manager', icon: ShoppingBag },
                  { id: 'products', label: 'Product Manager', icon: Database },
                  { id: 'categories', label: 'Category Manager', icon: Layers },
                  { id: 'reviews', label: 'Review Moderation', icon: MessageSquare },
                  { id: 'coupons', label: 'Coupon Codes', icon: Award },
                  { id: 'nutrition', label: 'Nutrition Requests', icon: ClipboardCheck },
                  { id: 'contact', label: 'Customer Queries', icon: MessageSquare },
                  { id: 'admins', label: 'Admins & Users', icon: ShieldAlert },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 md:gap-2.5 px-3 py-2.5 text-left rounded-sm font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 md:shrink md:whitespace-normal ${
                    activeTab === tab.id
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/10'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="hidden md:block w-full py-2.5 text-center text-xs font-black uppercase border border-white/10 hover:border-white/30 text-white/50 hover:text-white transition-all cursor-pointer"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Close Dashboard
          </button>
        </div>

        {/* Content Panel */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#070707] flex flex-col">
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/5 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-xl font-black uppercase tracking-wider text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              {activeTab === 'stats' && 'Sales & Store Statistics'}
              {activeTab === 'orders' && 'Customer Order Management'}
              {activeTab === 'products' && 'Product Sourcing / Uploads'}
              {activeTab === 'categories' && 'Category Management Console'}
              {activeTab === 'reviews' && 'Reviews Moderation Portal'}
              {activeTab === 'coupons' && 'Discount Coupon Generator'}
              {activeTab === 'nutrition' && 'Nutrition Consulting Submissions'}
              {activeTab === 'contact' && 'Contact Box Messages'}
            </h2>
          </div>

          {/* TAB CONTENT: STATS */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 border border-white/5 rounded">
                  <p className="text-[10px] uppercase text-white/40 font-bold tracking-wider">Total Sales Revenue</p>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    €{stats.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-white/5 border border-white/5 rounded">
                  <p className="text-[10px] uppercase text-white/40 font-bold tracking-wider">Orders Processed</p>
                  <p className="text-2xl sm:text-3xl font-black text-white mt-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {stats.totalOrders}
                  </p>
                </div>
                <div className="p-4 bg-white/5 border border-white/5 rounded">
                  <p className="text-[10px] uppercase text-white/40 font-bold tracking-wider">Pending Reviews</p>
                  <p className="text-2xl sm:text-3xl font-black text-amber-500 mt-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {stats.pendingReviews}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 border border-white/5 rounded">
                  <p className="text-xs font-bold text-white mb-2">Awaiting Action</p>
                  <ul className="text-xs space-y-2 text-white/60">
                    <li className="flex justify-between">
                      <span>Nutrition Plans Requesting Review</span>
                      <span className="font-semibold text-emerald-400">{stats.pendingNutrition}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Unread Customer Queries</span>
                      <span className="font-semibold text-emerald-400">{stats.unreadMessages}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: PRODUCTS (PRODUCT MANAGER) */}
          {activeTab === 'products' && (
            <div className="space-y-8 flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
              {/* Product Upload/Edit Form */}
              <form onSubmit={handleAddProduct} className="w-full lg:w-96 flex flex-col gap-3 shrink-0 p-4 border border-white/5 bg-[#090909] text-xs overflow-y-auto">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-white uppercase tracking-wider">
                    {editingProduct ? 'Edit Product' : 'Add Custom Product'}
                  </h3>
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={handleCancelEditProduct}
                      className="px-2 py-0.5 text-[10px] uppercase font-bold border border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10 cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                {!editingProduct && (
                  <div>
                    <label className="block text-[9px] uppercase text-white/40 mb-1">Product ID (Unique, e.g. protein-001)</label>
                    <input
                      type="text" placeholder="Auto-generated if empty"
                      value={prodId} onChange={e => setProdId(e.target.value)}
                      className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-[9px] uppercase text-white/40 mb-1">Product Name *</label>
                  <input
                    type="text" required placeholder="e.g. Apex Casein"
                    value={prodName} onChange={e => setProdName(e.target.value)}
                    className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase text-white/40 mb-1">Subtitle / Slogan</label>
                  <input
                    type="text" placeholder="e.g. Slow Release Night Matrix"
                    value={prodSubtitle} onChange={e => setProdSubtitle(e.target.value)}
                    className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] uppercase text-white/40 mb-1">Brand</label>
                    <input
                      type="text" placeholder="CeltiCore"
                      value={prodBrand} onChange={e => setProdBrand(e.target.value)}
                      className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase text-white/40 mb-1">Category *</label>
                    <select
                      value={prodCategory} onChange={e => setProdCategory(e.target.value)}
                      className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] uppercase text-white/40 mb-1">Price (€) *</label>
                    <input
                      type="number" step="0.01" required placeholder="39.99"
                      value={prodPrice} onChange={e => setProdPrice(e.target.value)}
                      className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase text-white/40 mb-1">Original Price (€)</label>
                    <input
                      type="number" step="0.01" placeholder="49.99"
                      value={prodOrigPrice} onChange={e => setProdOrigPrice(e.target.value)}
                      className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] uppercase text-white/40 mb-1">Product Image File</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text" required placeholder="/uploads/products/..."
                      value={prodImage} onChange={e => setProdImage(e.target.value)}
                      className="flex-1 px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                    />
                    <label className="px-3 py-2 bg-emerald-500 text-black font-bold uppercase cursor-pointer hover:bg-emerald-400 flex items-center gap-1">
                      <Upload size={12} />
                      {uploadingProdImg ? '...' : 'Upload'}
                      <input
                        type="file" accept="image/*"
                        onChange={handleProductImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {prodImage && (
                    <div className="mt-1.5 bg-black/40 border border-white/10 p-1 w-20 h-20 flex items-center justify-center">
                      <img
                        src={prodImage.startsWith('http') ? prodImage : `${API_URL}${prodImage}`}
                        alt="Product Preview"
                        className="max-w-full max-h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[9px] uppercase text-white/40 mb-1">Flavour Variants</label>
                  <div className="flex gap-1.5 mb-1.5 flex-wrap">
                    {flavoursList.map((flavour, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 border border-white/10 bg-white/5 text-[10px] text-white">
                        {flavour}
                        <button
                          type="button"
                          onClick={() => setFlavoursList(prev => prev.filter((_, i) => i !== idx))}
                          className="hover:text-red-400 ml-0.5 cursor-pointer text-white/40 text-[9px]"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {flavoursList.length === 0 && <span className="text-[10px] text-white/30 italic">No flavours added (Unflavoured)</span>}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text" placeholder="Add flavour (e.g. Mint Chocolate)"
                      value={newFlavour} onChange={e => setNewFlavour(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newFlavour.trim()) {
                            setFlavoursList(prev => [...prev, newFlavour.trim()]);
                            setNewFlavour('');
                          }
                        }
                      }}
                      className="flex-1 px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newFlavour.trim()) {
                          setFlavoursList(prev => [...prev, newFlavour.trim()]);
                          setNewFlavour('');
                        }
                      }}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] uppercase text-white/40 mb-1">Promo Badge</label>
                    <select
                      value={prodBadge} onChange={e => setProdBadge(e.target.value)}
                      className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                    >
                      <option value="">None</option>
                      <option value="Best Seller">Best Seller</option>
                      <option value="New">New</option>
                      <option value="Sale">Sale</option>
                      <option value="Popular">Popular</option>
                      <option value="Limited Edition">Limited Edition</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase text-white/40 mb-1">Stock Quantity</label>
                    <input
                      type="number" placeholder="100"
                      value={prodStock} onChange={e => setProdStock(e.target.value)}
                      className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 items-center">
                  <div>
                    <label className="block text-[9px] uppercase text-white/40 mb-1">Low Stock Threshold</label>
                    <input
                      type="number" placeholder="10"
                      value={prodLowStock} onChange={e => setProdLowStock(e.target.value)}
                      className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-4 pl-1">
                    <input
                      type="checkbox" id="prodActive"
                      checked={prodIsActive} onChange={e => setProdIsActive(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="prodActive" className="text-[10px] uppercase text-white/60 font-bold cursor-pointer">Active Visibility</label>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] uppercase text-white/40 mb-1">Description *</label>
                  <textarea
                    rows={3} required placeholder="Product ingredients and benefit descriptions..."
                    value={prodDesc} onChange={e => setProdDesc(e.target.value)}
                    className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 text-black font-black uppercase tracking-wider hover:bg-emerald-400 mt-2 cursor-pointer"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {editingProduct ? 'Update Product' : 'Upload Product'}
                </button>
              </form>

              {/* Product list */}
              <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1">
                <h3 className="font-bold text-xs uppercase tracking-wider text-white mb-2">Current Catalog ({products.length})</h3>
                {products.length === 0 ? (
                  <p className="text-xs text-white/30 italic">No products found.</p>
                ) : (
                  products.map((p) => {
                    const isLowStock = (p.stockQuantity ?? 0) <= (p.lowStockThreshold ?? 5);
                    const isActive = p.isActive === undefined ? true : !!p.isActive;
                    return (
                      <div key={p.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 text-xs">
                        <img src={p.image} alt={p.name} className="w-10 h-10 object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white truncate">{p.name}</span>
                            {p.brand && <span className="text-[9px] text-white/40 uppercase bg-white/5 px-1 border border-white/10">{p.brand}</span>}
                            {p.badge && <span className="text-[9px] text-black bg-yellow-400 font-bold px-1">{p.badge}</span>}
                          </div>
                          <p className="text-[10px] text-white/40 uppercase mt-0.5">
                            {p.category} · €{p.price.toFixed(2)} {p.originalPrice && <span className="line-through text-white/20">€{p.originalPrice.toFixed(2)}</span>}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-[9px]">
                            <span className={isLowStock ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                              Stock: {p.stockQuantity ?? 0}
                            </span>
                            <span className={isActive ? 'text-green-500' : 'text-red-500/70 font-bold'}>
                              {isActive ? 'Active' : 'Hidden'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditProductClick(p)}
                            className="p-1.5 text-white/50 hover:text-emerald-400 cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 text-white/30 hover:text-red-400 cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: CATEGORIES (CATEGORY MANAGER) */}
          {activeTab === 'categories' && (
            <div className="space-y-8 flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
              {/* Category Upload/Edit Form */}
              <form onSubmit={handleAddCategory} className="w-full lg:w-96 flex flex-col gap-3 shrink-0 p-4 border border-white/5 bg-[#090909] text-xs overflow-y-auto">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-white uppercase tracking-wider">
                    {editingCategory ? 'Edit Category' : 'Create New Category'}
                  </h3>
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={handleCancelEditCategory}
                      className="px-2 py-0.5 text-[10px] uppercase font-bold border border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10 cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[9px] uppercase text-white/40 mb-1">Category Name *</label>
                  <input
                    type="text" required placeholder="e.g. Proteins"
                    value={catName} onChange={e => {
                      setCatName(e.target.value);
                      if (!editingCategory) {
                        setCatSlug(e.target.value.toLowerCase().trim().replace(/\s+/g, '-'));
                      }
                    }}
                    className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase text-white/40 mb-1">Category Slug * (API id / URL path)</label>
                  <input
                    type="text" required placeholder="e.g. protein"
                    disabled={!!editingCategory}
                    value={catSlug} onChange={e => setCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase text-white/40 mb-1">Tagline / Slogan</label>
                  <input
                    type="text" placeholder="e.g. Build Strength Every Day"
                    value={catTagline} onChange={e => setCatTagline(e.target.value)}
                    className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] uppercase text-white/40 mb-1">Accent Color</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={catAccentColor} onChange={e => setCatAccentColor(e.target.value)}
                        className="w-8 h-8 bg-transparent border-0 cursor-pointer rounded-full p-0 overflow-hidden"
                      />
                      <input
                        type="text" placeholder="#22c55e"
                        value={catAccentColor} onChange={e => setCatAccentColor(e.target.value)}
                        className="flex-1 px-2 py-1.5 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none uppercase"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase text-white/40 mb-1">Animation Effect</label>
                    <select
                      value={catEffect} onChange={e => setCatEffect(e.target.value)}
                      className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                    >
                      <option value="energy">Energy Radial</option>
                      <option value="strength">Strength Glow</option>
                      <option value="lightning">Lightning Polyline</option>
                      <option value="ripple">Water Ripple</option>
                      <option value="solar">Solar Flare</option>
                      <option value="calm">Calm Wave</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] uppercase text-white/40 mb-1">Category Image (Main)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text" placeholder="/uploads/categories/..."
                      value={catImage} onChange={e => setCatImage(e.target.value)}
                      className="flex-1 px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                    />
                    <label className="px-3 py-2 bg-emerald-500 text-black font-bold uppercase cursor-pointer hover:bg-emerald-400 flex items-center gap-1">
                      <Upload size={12} />
                      {uploadingCatImg ? '...' : 'Upload'}
                      <input
                        type="file" accept="image/*"
                        onChange={(e) => handleCategoryImageUpload(e, false)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {catImage && (
                    <div className="mt-1.5 bg-black/40 border border-white/10 p-1 w-20 h-20 flex items-center justify-center">
                      <img
                        src={catImage.startsWith('http') ? catImage : `${API_URL}${catImage}`}
                        alt="Category Preview"
                        className="max-w-full max-h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[9px] uppercase text-white/40 mb-1">Card Background Image (Wide)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text" placeholder="/uploads/categories/...card.png"
                      value={catCardImage} onChange={e => setCatCardImage(e.target.value)}
                      className="flex-1 px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                    />
                    <label className="px-3 py-2 bg-emerald-500 text-black font-bold uppercase cursor-pointer hover:bg-emerald-400 flex items-center gap-1">
                      <Upload size={12} />
                      {uploadingCatCardImg ? '...' : 'Upload'}
                      <input
                        type="file" accept="image/*"
                        onChange={(e) => handleCategoryImageUpload(e, true)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {catCardImage && (
                    <div className="mt-1.5 bg-black/40 border border-white/10 p-1 w-32 h-16 flex items-center justify-center">
                      <img
                        src={catCardImage.startsWith('http') ? catCardImage : `${API_URL}${catCardImage}`}
                        alt="Category Card Preview"
                        className="max-w-full max-h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[9px] uppercase text-white/40 mb-1">Description *</label>
                  <textarea
                    rows={3} required placeholder="Describe category collection highlights..."
                    value={catDescription} onChange={e => setCatDescription(e.target.value)}
                    className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 text-black font-black uppercase tracking-wider hover:bg-emerald-400 mt-2 cursor-pointer"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </form>

              {/* Category list */}
              <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1">
                <h3 className="font-bold text-xs uppercase tracking-wider text-white mb-2">Category Configurations ({categories.length})</h3>
                {categories.length === 0 ? (
                  <p className="text-xs text-white/30 italic">No categories found in database.</p>
                ) : (
                  categories.map((c) => {
                    const cardImg = c.card_image || c.cardImage || c.image || "";
                    const accent = c.accent_color || c.accentColor || "#10b981";
                    return (
                      <div key={c.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 text-xs">
                        <img src={cardImg || "/placeholder.png"} alt={c.name} className="w-16 h-10 object-cover shrink-0 bg-black/40 border border-white/5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white truncate">{c.name}</span>
                            <span className="text-[9px] px-1 bg-white/5 border border-white/10 uppercase text-white/50">{c.slug}</span>
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: accent }} title={`Accent Color: ${accent}`} />
                          </div>
                          <p className="text-[10px] text-white/40 uppercase mt-0.5 truncate">{c.tagline || 'No tagline'}</p>
                          <p className="text-[9px] text-emerald-400 uppercase mt-0.5">Effect: <span className="font-bold">{c.effect || 'none'}</span></p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditCategoryClick(c)}
                            className="p-1.5 text-white/50 hover:text-emerald-400 cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(c.id)}
                            className="p-1.5 text-white/30 hover:text-red-400 cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-4 flex-1 overflow-y-auto min-h-0 pr-1">
              {reviews.length === 0 ? (
                <p className="text-xs text-white/30 italic">No reviews logged in database.</p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{rev.username}</span>
                        <span className="text-[10px] text-white/30">on Product ID: {rev.product_id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                          rev.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                          rev.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/25' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                        }`}>
                          {rev.status}
                        </span>
                      </div>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(star => (
                          <Star key={star} size={10} fill={star <= rev.rating ? "#D4AF37" : "none"} stroke={star <= rev.rating ? "#D4AF37" : "white"} opacity={star <= rev.rating ? 1 : 0.2} />
                        ))}
                      </div>
                      <p className="text-white/60 leading-relaxed max-w-xl">{rev.comment}</p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {rev.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveReview(rev.id)}
                            className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded cursor-pointer"
                            title="Approve Review"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            onClick={() => handleRejectReview(rev.id)}
                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded cursor-pointer"
                            title="Reject Review"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="p-1.5 text-white/30 hover:text-red-400 cursor-pointer"
                        title="Delete Review"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB CONTENT: COUPONS */}
          {activeTab === 'coupons' && (
            <div className="space-y-6 flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
              <form onSubmit={handleAddCoupon} className="w-full lg:w-72 p-4 border border-white/5 bg-[#090909] text-xs shrink-0 flex flex-col gap-3">
                <h3 className="font-bold text-white uppercase tracking-wider mb-1">Create Coupon Code</h3>
                <div>
                  <label className="block text-[9px] uppercase text-white/40 mb-1">Coupon Code</label>
                  <input
                    type="text" required placeholder="e.g. FIT25"
                    value={couponCode} onChange={e => setCouponCode(e.target.value)}
                    className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase text-white/40 mb-1">Discount Percent (%)</label>
                  <select
                    value={couponPercent} onChange={e => setCouponPercent(e.target.value)}
                    className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                  >
                    {[5,10,15,20,25,30,40,50].map(p => <option key={p} value={p}>{p}% Off</option>)}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-500 text-black font-black uppercase tracking-wider hover:bg-emerald-400 mt-1 cursor-pointer"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  Generate Coupon
                </button>
              </form>

              <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1">
                <h3 className="font-bold text-xs uppercase tracking-wider text-white mb-2">Available Coupons ({coupons.length})</h3>
                {coupons.length === 0 ? (
                  <p className="text-xs text-white/30 italic">No coupons created.</p>
                ) : (
                  coupons.map((c) => (
                    <div key={c.id} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 text-xs">
                      <div>
                        <span className="font-black text-white px-2 py-0.5 bg-white/10 mr-2 tracking-widest">{c.code}</span>
                        <span className="text-emerald-400 font-bold">
                          {c.discount_type === 'percentage'
                            ? `${c.discount_value}% OFF`
                            : `Rs. ${c.discount_value} OFF`}
                        </span>
                      </div>
                      <button onClick={() => handleDeleteCoupon(c.id)} className="text-white/30 hover:text-red-400 p-1 cursor-pointer"><Trash2 size={13} /></button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: NUTRITION REQUESTS */}
          {activeTab === 'nutrition' && (
            <div className="space-y-4 flex-1 overflow-y-auto min-h-0 pr-1">
              {nutrition.length === 0 ? (
                <p className="text-xs text-white/30 italic">No nutrition consultations requested.</p>
              ) : (
                nutrition.map((req) => (
                  <div key={req.id} className="p-4 bg-white/5 border border-white/5 rounded space-y-3 text-xs">
                    <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-white/5">
                      <div>
                        <span className="font-bold text-white">{req.name}</span>
                        <span className="text-white/40 ml-2">({req.email})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={req.status}
                          onChange={(e) => handleUpdateNutritionStatus(req.id, e.target.value as any)}
                          className="bg-black border border-white/10 px-2 py-1 text-xs text-white outline-none"
                        >
                          <option value="pending">Pending Review</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-black/30 rounded border border-white/5">
                      <div>
                        <p className="text-[9px] uppercase text-white/40 font-bold mb-0.5">Phone</p>
                        <p className="text-white font-semibold">{req.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase text-white/40 font-bold mb-0.5">Age / Gender</p>
                        <p className="text-white font-semibold">{req.age || 'N/A'} yrs / {req.gender || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase text-white/40 font-bold mb-0.5">Weight / Height</p>
                        <p className="text-white font-semibold">{req.weight || 'N/A'} kg / {req.height || 'N/A'} cm</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase text-white/40 font-bold mb-0.5">Diet Preference</p>
                        <p className="text-emerald-400 font-semibold">{req.diet_preference || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase text-white/40 font-bold mb-0.5">Fitness Goal</p>
                        <p className="text-emerald-400 font-semibold">{req.goal || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase text-white/40 font-bold mb-0.5">Activity Level</p>
                        <p className="text-white font-semibold">{req.activity_level || 'N/A'}</p>
                      </div>
                      <div className="col-span-2 sm:col-span-2">
                        <p className="text-[9px] uppercase text-white/40 font-bold mb-0.5">Medical Conditions</p>
                        <p className="text-red-400/90 whitespace-pre-wrap">{req.medical_conditions || 'None stated'}</p>
                      </div>
                    </div>

                    {req.notes && (
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase text-white/40 font-bold">Customer Additional Notes</p>
                        <p className="text-white/70 leading-relaxed font-light whitespace-pre-wrap">{req.notes}</p>
                      </div>
                    )}

                    <div className="pt-2">
                      <label className="block text-[10px] uppercase text-white/40 font-bold mb-1">Advisor Notes (Admin Only)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          key={`${req.id}-${req.admin_notes}`}
                          defaultValue={req.admin_notes || ''}
                          onBlur={(e) => handleSaveNutritionNotes(req.id, e.target.value)}
                          placeholder="e.g. Recommended Whey + Creatine cycle plan..."
                          className="flex-1 px-3 py-1.5 text-xs text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                        />
                        <button
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            handleSaveNutritionNotes(req.id, input.value);
                          }}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                        >
                          Save Notes
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB CONTENT: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4 flex-1 overflow-y-auto min-h-0 pr-1">
              {orders.length === 0 ? (
                <p className="text-xs text-white/30 italic">No orders found in database.</p>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="p-4 bg-white/5 border border-white/5 rounded space-y-4 text-xs">
                    <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-white/5">
                      <div>
                        <span className="font-bold text-white">Order ID: #{order.id}</span>
                        <span className="text-white/40 ml-2">({new Date(order.createdAt).toLocaleDateString()})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                          order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                          order.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/25' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                        }`}>
                          {order.status}
                        </span>
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as any)}
                          className="bg-black border border-white/10 px-2 py-1 text-xs text-white outline-none rounded-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Customer Details */}
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase text-white/40 font-bold">Customer & Shipping Details</p>
                        <p className="text-white font-semibold">{order.customerName}</p>
                        <p className="text-white/60">{order.customerEmail}</p>
                        <p className="text-white/60">{order.address}, {order.city}, {order.postalCode}, {order.country}</p>
                        <div className="flex items-center gap-2 pt-1 text-[10px]">
                          <span className="text-white/40">Payment:</span>
                          <span className="text-emerald-400 uppercase font-semibold">
                            {order.paymentMethod === 'gpay' ? 'Google Pay' : order.paymentMethod === 'applepay' ? 'Apple Pay' : 'Credit Card'}
                          </span>
                          <span className="text-white/30">·</span>
                          <span className={`uppercase font-semibold ${
                            order.paymentStatus === 'paid' ? 'text-emerald-400' :
                            order.paymentStatus === 'unpaid' ? 'text-red-400' :
                            'text-amber-400'
                          }`}>{order.paymentStatus || 'pending'}</span>
                        </div>
                        {order.stripePaymentIntentId && (
                          <p className="text-[8px] text-white/30 truncate mt-1">Stripe TxID: {order.stripePaymentIntentId}</p>
                        )}
                      </div>

                      {/* Items List */}
                      <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4">
                        <p className="text-[9px] uppercase text-white/40 font-bold mb-1">Items Ordered</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-white/70">
                              <span>{item.name} ({item.flavour}) x{item.quantity}</span>
                              <span className="font-semibold text-white">€{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between border-t border-white/5 pt-1.5 mt-2 font-bold text-white text-xs">
                          <span>Grand Total</span>
                          <span className="text-emerald-400">€{order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB CONTENT: CONTACT BOX */}
          {activeTab === 'contact' && (
            <div className="space-y-4 flex-1 overflow-y-auto min-h-0 pr-1">
              {messages.length === 0 ? (
                <p className="text-xs text-white/30 italic">No customer contact messages found.</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="p-4 bg-white/5 border border-white/5 rounded space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{msg.name}</span>
                          <span className="text-[10px] text-white/35">({msg.email})</span>
                          {!msg.read && (
                            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[8px] uppercase font-bold rounded-full">New</span>
                          )}
                        </div>
                        <p className="text-emerald-400 font-semibold mt-0.5">{msg.subject}</p>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {!msg.read && (
                          <button
                            onClick={() => handleMarkMessageRead(msg.id)}
                            className="text-[10px] uppercase font-bold text-emerald-400 hover:text-emerald-300 px-2 py-1 cursor-pointer"
                          >
                            Mark Read
                          </button>
                        )}
                        <button onClick={() => handleDeleteMessage(msg.id)} className="text-white/20 hover:text-red-400 p-1 cursor-pointer"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <p className="text-white/60 leading-relaxed font-light">{msg.message}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB CONTENT: ADMIN & CREDENTIALS */}
          {activeTab === 'admins' && (
            <div className="space-y-6 flex-1 overflow-y-auto min-h-0 pr-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Section 1: Change Personal Credentials */}
                <div className="p-4 bg-white/5 border border-white/5 rounded space-y-4">
                  <h3 className="font-black text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    <Key size={14} /> Update Credentials
                  </h3>
                  <p className="text-[10px] text-white/50">
                    {isMainAdmin 
                      ? "Change the master administrator credentials. This updates settings store parameters and database records."
                      : "Change your personal administrator username, email, or password."
                    }
                  </p>
                  <form onSubmit={handleUpdateCredentials} className="space-y-3">
                    <div>
                      <label className="block text-[9px] uppercase text-white/40 mb-1">New Username</label>
                      <input
                        type="text"
                        placeholder="Leave blank to keep current"
                        value={newAdminUsername}
                        onChange={e => setNewAdminUsername(e.target.value)}
                        className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase text-white/40 mb-1">New Email</label>
                      <input
                        type="email"
                        placeholder="Leave blank to keep current"
                        value={newAdminEmail}
                        onChange={e => setNewAdminEmail(e.target.value)}
                        className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase text-white/40 mb-1">New Password</label>
                      <input
                        type="password"
                        placeholder="Leave blank to keep current"
                        value={newAdminPassword}
                        onChange={e => setNewAdminPassword(e.target.value)}
                        className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-500 text-black font-black uppercase tracking-wider hover:bg-emerald-400 cursor-pointer"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                    >
                      Update Credentials
                    </button>
                  </form>
                </div>

                {/* Section 2: Create Admin Profile (Main Admin Only) */}
                <div className="p-4 bg-white/5 border border-white/5 rounded space-y-4">
                  <h3 className="font-black text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    <UserPlus size={14} /> Create Admin Profile
                  </h3>
                  {isMainAdmin ? (
                    <>
                      <p className="text-[10px] text-white/50">
                        Create a separate, full administrator profile. They will have access to all management features except creating/deleting other admins.
                      </p>
                      <form onSubmit={handleCreateAdminProfile} className="space-y-3">
                        <div>
                          <label className="block text-[9px] uppercase text-white/40 mb-1">Username *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. secondary_admin"
                            value={createUsername}
                            onChange={e => setCreateUsername(e.target.value)}
                            className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase text-white/40 mb-1">Email *</label>
                          <input
                            type="email"
                            required
                            placeholder="e.g. admin2@celticore.com"
                            value={createEmail}
                            onChange={e => setCreateEmail(e.target.value)}
                            className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase text-white/40 mb-1">Password *</label>
                          <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={createPassword}
                            onChange={e => setCreatePassword(e.target.value)}
                            className="w-full px-3 py-2 text-white bg-black border border-white/10 focus:border-emerald-500 outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2 bg-emerald-500 text-black font-black uppercase tracking-wider hover:bg-emerald-400 cursor-pointer"
                          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                        >
                          Create Admin Account
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 border border-white/5 bg-black/20 text-center p-4">
                      <ShieldAlert size={28} className="text-white/30 mb-2" />
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Access Restricted</p>
                      <p className="text-[9px] text-white/30 mt-1 max-w-[200px]">
                        Only the master administrator is authorized to provision secondary administrative profiles.
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* Section 3: Registered Users & Admins Directory */}
              <div className="p-4 bg-white/5 border border-white/5 rounded space-y-4">
                <h3 className="font-black text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  <Database size={14} /> Registered Accounts Directory ({users.length})
                </h3>
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <table className="w-full min-w-[560px] text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] uppercase text-white/40">
                        <th className="py-2 pr-4 font-bold">Username</th>
                        <th className="py-2 pr-4 font-bold">Email Address</th>
                        <th className="py-2 pr-4 font-bold">Role</th>
                        <th className="py-2 pr-4 font-bold">Date Registered</th>
                        <th className="py-2 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((u) => {
                        const isTargetMainAdmin = u.role === 'main_admin';
                        const isTargetAdmin = u.role === 'admin';
                        // Determine if logged-in user can delete this target
                        // Rule: Main admin can delete other admins & customers. Secondary admins can only delete customers.
                        let canDelete = false;
                        if (!isTargetMainAdmin) {
                          if (isTargetAdmin) {
                            canDelete = isMainAdmin;
                          } else {
                            // Customer
                            canDelete = true;
                          }
                        }

                        return (
                          <tr key={u.id} className="hover:bg-white/5 transition-all text-white/80">
                            <td className="py-2.5 pr-4 font-semibold text-white">{u.username}</td>
                            <td className="py-2.5 pr-4">{u.email}</td>
                            <td className="py-2.5 pr-4">
                              <span className={`px-2 py-0.5 text-[9px] uppercase font-black tracking-wider ${
                                isTargetMainAdmin ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                isTargetAdmin ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {isTargetMainAdmin ? 'Master Admin' : isTargetAdmin ? 'Admin' : 'Customer'}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 text-white/40">{new Date(u.createdAt || u.created_at).toLocaleDateString()}</td>
                            <td className="py-2.5 text-right">
                              {canDelete ? (
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="text-white/30 hover:text-red-400 transition-all p-1 cursor-pointer"
                                  title="Delete Account"
                                >
                                  <Trash2 size={13} />
                                </button>
                              ) : (
                                <span className="text-[9px] text-white/20 italic">Protected</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};