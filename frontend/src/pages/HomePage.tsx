import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMenuItemList, getCategoryList } from '../api';
import { useCart } from '../contexts/CartContext';
import type { MenuItem, Category } from '../types';
import HomeHero from '../components/HomeHero';
import HomeFeatured from '../components/HomeFeatured';
import HomeCategories from '../components/HomeCategories';
import HomeAbout from '../components/HomeAbout';
import HomeCta from '../components/HomeCta';
import { Alert } from '../components/ui';

export default function HomePage() {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [menuItems, cats] = await Promise.all([
          getMenuItemList(),
          getCategoryList(),
        ]);
        if (!active) return;
        const available = (Array.isArray(menuItems) ? menuItems : []).filter(
          (m: MenuItem) => m.is_available
        );
        setItems(available.slice(0, 8));
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (err) {
        if (active) {
          setFeedback({ tone: 'danger', text: 'Could not load the menu right now.' });
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleAddToCart = (item: MenuItem) => {
    try {
      addItem(item, 1);
      setFeedback({ tone: 'success', text: `Added ${item.name} to cart` });
      window.setTimeout(() => setFeedback(null), 2000);
    } catch (err) {
      setFeedback({ tone: 'danger', text: 'Could not add that item to your cart.' });
    }
  };

  const handleBrowse = () => {
    navigate('/menu-items');
  };

  return (
    <div className="ds-stack-lg">
      {feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}
      <HomeHero heroImage="/img/brand/hero.jpg" />
      <HomeFeatured items={items} loading={loading} onAddToCart={handleAddToCart} />
      <HomeCategories categories={categories} />
      <HomeAbout />
      <HomeCta onBrowse={handleBrowse} />
    </div>
  );
}