import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCategoryList, getMenuItemList } from '../api';
import type { Category, MenuItem } from '../types';
import { useCart } from '../contexts/CartContext';
import MenuItemListHeader from '../components/MenuItemListHeader';
import MenuItemListFilters from '../components/MenuItemListFilters';
import MenuItemListGrid from '../components/MenuItemListGrid';
import MenuItemListPagination from '../components/MenuItemListPagination';

const PAGE_SIZE = 9;

export default function MenuItemListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);

  useEffect(() => {
    getCategoryList()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMenuItemList()
      .then((data) => {
        if (active) setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const paramCategory = searchParams.get('category') || '';
    setCategory(paramCategory);
  }, [searchParams]);

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
    if (value) {
      setSearchParams({ category: value });
    } else {
      setSearchParams({});
    }
  };

  const filteredItems = useMemo(() => {
    let result = items.filter((item) => item.is_available !== false);

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          (item.description || '').toLowerCase().includes(term)
      );
    }

    if (category) {
      result = result.filter((item) => {
        const cat = categories.find((c) => c.slug === category);
        return cat ? item.category === cat.id : true;
      });
    }

    if (sort === 'price_low') {
      result = [...result].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === 'price_high') {
      result = [...result].sort((a, b) => Number(b.price) - Number(a.price));
    } else {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [items, search, category, sort, categories]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

  const pagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, page]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(1);
  };

  const handleAddToCart = (item: MenuItem) => {
    addItem(item, 1);
  };

  return (
    <div className="ds-stack-lg">
      <MenuItemListHeader resultCount={filteredItems.length} loading={loading} />
      <MenuItemListFilters
        categories={categories}
        search={search}
        category={category}
        sort={sort}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onSortChange={handleSortChange}
      />
      <MenuItemListGrid items={pagedItems} loading={loading} onAddToCart={handleAddToCart} />
      <MenuItemListPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}