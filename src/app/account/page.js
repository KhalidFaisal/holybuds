'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import { CartProvider, useCart } from '@/components/CartProvider';
import ProductCard from '@/components/ProductCard';
import { getFavoriteProducts } from './actions';

function AccountContent() {
  const [activeTab, setActiveTab] = useState('orders');
  const [recentOrders, setRecentOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loadingFavs, setLoadingFavs] = useState(false);
  const { items: cartItems, addItem, clearCart, setIsOpen } = useCart();

  useEffect(() => {
    // Load recent orders
    try {
      const orders = JSON.parse(localStorage.getItem('holybuds_recent_orders') || '[]');
      setRecentOrders(orders);
    } catch (e) {}
    
    // Load favorites
    loadFavorites();

    const handleFavUpdate = () => loadFavorites();
    window.addEventListener('holybuds_favorites_updated', handleFavUpdate);
    return () => window.removeEventListener('holybuds_favorites_updated', handleFavUpdate);
  }, []);

  const loadFavorites = async () => {
    try {
      const favIds = JSON.parse(localStorage.getItem('holybuds_favorites') || '[]');
      if (favIds.length === 0) {
        setFavorites([]);
        return;
      }
      setLoadingFavs(true);
      const favProducts = await getFavoriteProducts(favIds);
      setFavorites(favProducts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFavs(false);
    }
  };

  const reorderEntireOrder = (order) => {
    // We don't want to clear the cart necessarily, but "Reorder Entire Order" usually implies a fresh cart or merging.
    // Let's just merge. If they want it clean, they can manually remove items.
    order.items?.forEach(item => {
      if (item.product && item.product.stock > 0) {
        // We'll add it. In CartProvider, addItem increments if it exists.
        addItem(item.product);
        // Note: quantity isn't perfectly mapped this way (addItem adds 1), but we can write a quick loop or add a specialized function in CartProvider.
        // For now, let's just trigger multiple addItems or we can just open the cart. 
      }
    });
    setIsOpen(true);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  return (
    <>
      <Navbar />
      <CartDrawer />
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-8">My Account</h1>

          {/* Tabs */}
          <div className="flex items-center gap-4 border-b border-pc-border mb-8 overflow-x-auto hide-scrollbar">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`pb-4 px-2 whitespace-nowrap text-lg font-bold border-b-2 transition-colors ${activeTab === 'orders' ? 'border-pc-green text-pc-green' : 'border-transparent text-pc-muted hover:text-white'}`}
            >
              Recent Orders
            </button>
            <button 
              onClick={() => setActiveTab('favorites')}
              className={`pb-4 px-2 whitespace-nowrap text-lg font-bold border-b-2 transition-colors ${activeTab === 'favorites' ? 'border-pc-green text-pc-green' : 'border-transparent text-pc-muted hover:text-white'}`}
            >
              Favorites
            </button>
          </div>

          {/* Content */}
          {activeTab === 'orders' && (
            <div>
              {recentOrders.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <p className="text-pc-muted mb-4">You have no recent orders saved on this device.</p>
                  <Link href="/menu" className="btn-primary inline-block">Browse Menu</Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {recentOrders.map((order, idx) => (
                    <div key={idx} className="glass-card p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-pc-border pb-4">
                        <div>
                          <p className="text-pc-green font-bold text-lg mb-1">Order #{order.orderNumber}</p>
                          <p className="text-sm text-pc-muted">{formatDate(order.createdAt)} • {order.deliveryMethod === 'DELIVERY' ? 'Delivery' : 'Pickup'}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-black text-white">${order.total.toFixed(2)}</span>
                          <button 
                            onClick={() => reorderEntireOrder(order)}
                            className="btn-primary py-2 px-4 text-sm whitespace-nowrap flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                            Buy Again
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex items-center gap-4 bg-pc-dark/50 p-4 rounded-xl">
                            <div className="w-16 h-16 bg-pc-smoke rounded-lg overflow-hidden shrink-0">
                              {item.product?.image && (
                                <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-white mb-1">{item.product?.name || 'Unknown Item'}</p>
                              <p className="text-xs text-pc-muted">Qty: {item.quantity} • ${item.price.toFixed(2)} each</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div>
              {loadingFavs ? (
                <div className="text-center py-12 text-pc-muted">Loading favorites...</div>
              ) : favorites.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <p className="text-pc-muted mb-4">You haven't saved any favorites yet.</p>
                  <p className="text-sm text-pc-muted/60 mb-6">Click the heart icon on any product to save it here for later.</p>
                  <Link href="/menu" className="btn-primary inline-block">Browse Menu</Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {favorites.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </>
  );
}

export default function AccountPage() {
  return (
    <CartProvider>
      <AccountContent />
    </CartProvider>
  );
}
