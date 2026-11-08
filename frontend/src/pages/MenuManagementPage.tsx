import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getMenuItemList,
  getCategoryList,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../api';
import type { MenuItem, Category } from '../types';
import { Section, Alert, Button, Cluster } from '../components/ui';
import MenuManagementHeader from '../components/MenuManagementHeader';
import MenuManagementFilters from '../components/MenuManagementFilters';
import MenuManagementGrid from '../components/MenuManagementGrid';
import MenuManagementPagination from '../components/MenuManagementPagination';
import MenuItemForm from '../components/MenuItemForm';
import CategoryForm from '../components/CategoryForm';
import CategoryList from '../components/CategoryList';

type Tab = 'items' | 'categories';

const PAGE_SIZE = 9;

export default function MenuManagementPage() {
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>('items');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sort, setSort] = useState('name-asc');
  const [currentPage, setCurrentPage] = useState(1);

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [itemsRes, catsRes] = await Promise.all([getMenuItemList(), getCategoryList()]);
      setMenuItems(Array.isArray(itemsRes) ? itemsRes : []);
      setCategories(Array.isArray(catsRes) ? catsRes : []);
    } catch (err) {
      setError('Failed to load menu data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeCategory, sort]);

  const filteredItems = useMemo(() => {
    let result = [...menuItems];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (i) => i.name.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q)
      );
    }
    if (activeCategory !== 'all') {
      result = result.filter((i) => String(i.category) === activeCategory);
    }
    switch (sort) {
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        result.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price-desc':
        result.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [menuItems, search, activeCategory, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    (currentPage - 1) * PAGE_SIZE + PAGE_SIZE
  );

  const handleCreateItem = () => {
    setEditingItem(null);
    setShowItemForm(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setShowItemForm(true);
  };

  const handleSaveItem = async (data: Partial<MenuItem>) => {
    setError('');
    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, data);
      } else {
        await createMenuItem(data);
      }
      setShowItemForm(false);
      setEditingItem(null);
      await loadData();
    } catch (err) {
      setError('Could not save this menu item. Check the fields and try again.');
    }
  };

  const handleDeleteItem = async (id: number) => {
    setError('');
    try {
      await deleteMenuItem(id);
      await loadData();
    } catch (err) {
      setError('Could not delete this menu item.');
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleSaveCategory = async (data: Partial<Category>) => {
    setError('');
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
      } else {
        await createCategory(data);
      }
      setShowCategoryForm(false);
      setEditingCategory(null);
      await loadData();
    } catch (err) {
      setError('Could not save this category. Check the name and try again.');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    setError('');
    try {
      await deleteCategory(id);
      await loadData();
    } catch (err) {
      setError('Could not delete this category. It may still have menu items.');
    }
  };

  return (
    <div className="ds-stack-lg">
      <MenuManagementHeader
        itemCount={menuItems.length}
        categoryCount={categories.length}
        loading={loading}
      />

      <Section tight>
        <Cluster gap="sm">
          <Button
            variant={tab === 'items' ? 'primary' : 'ghost'}
            onClick={() => setTab('items')}
          >
            Menu Items
          </Button>
          <Button
            variant={tab === 'categories' ? 'primary' : 'ghost'}
            onClick={() => setTab('categories')}
          >
            Categories
          </Button>
        </Cluster>
      </Section>

      {error && (
        <Section tight>
          <Alert tone="danger">{error}</Alert>
        </Section>
      )}

      {tab === 'items' && (
        <>
          {showItemForm && (
            <Section
              tight
              title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
              subtitle={editingItem ? `Editing ${editingItem.name}` : 'Add a new dish to the Copper Pot Kitchen menu'}
            >
              <MenuItemForm
                item={editingItem}
                categories={categories}
                onSave={handleSaveItem}
                onCancel={() => {
                  setShowItemForm(false);
                  setEditingItem(null);
                }}
              />
            </Section>
          )}

          <MenuManagementFilters
            search={search}
            onSearchChange={setSearch}
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            sort={sort}
            onSortChange={setSort}
          />

          <MenuManagementGrid
            items={pagedItems}
            loading={loading}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            onCreate={handleCreateItem}
          />

          <MenuManagementPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {tab === 'categories' && (
        <>
          {showCategoryForm && (
            <Section
              tight
              title={editingCategory ? 'Edit Category' : 'Add Category'}
              subtitle={editingCategory ? `Editing ${editingCategory.name}` : 'Create a new menu category'}
            >
              <CategoryForm
                category={editingCategory}
                onSave={handleSaveCategory}
                onCancel={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(null);
                }}
              />
            </Section>
          )}

          <Section
            tight
            title="Categories"
            subtitle="Organize the Copper Pot Kitchen menu into sections"
            actions={
              <Button variant="primary" onClick={handleCreateCategory}>
                Add Category
              </Button>
            }
          >
            <CategoryList
              categories={categories}
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}
            />
          </Section>
        </>
      )}
    </div>
  );
}
