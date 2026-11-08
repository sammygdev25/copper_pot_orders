import type { Category } from '../types';
import { Section } from '../components/ui';
import { Icon } from '../components/icons';

interface MenuItemListFiltersProps {
  categories: Category[];
  search: string;
  category: string;
  sort: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

export default function MenuItemListFilters({
  categories,
  search,
  category,
  sort,
  onSearchChange,
  onCategoryChange,
  onSortChange,
}: MenuItemListFiltersProps) {
  return (
    <Section tight>
      <div className="ds-filters">
        <div className="ds-field">
          <label className="ds-label" htmlFor="menu-search">
            Search
          </label>
          <div className="ds-cluster">
            <Icon name="search" size={18} />
            <input
              id="menu-search"
              className="input"
              type="text"
              placeholder="Search the menu for a dish..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor="menu-category">
            Category
          </label>
          <select
            id="menu-category"
            className="input"
            value={category}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onCategoryChange(e.target.value)}
          >
            <option value="">All categories</option>
            {(Array.isArray(categories) ? categories : []).map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor="menu-sort">
            Sort by
          </label>
          <select
            id="menu-sort"
            className="input"
            value={sort}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onSortChange(e.target.value)}
          >
            <option value="name">Name (A-Z)</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="newest">Newest first</option>
          </select>
        </div>
      </div>
    </Section>
  );
}