import React from 'react';
import type { Category } from '../types';
import { Section } from '../components/ui';
type InputProps = { children?: React.ReactNode; className?: string; [prop: string]: unknown };
function Input({ children, className }: InputProps) { return <div className={className}>{children}</div>; }
import { Icon } from '../components/icons';

interface MenuManagementFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
}

export default function MenuManagementFilters({
  search,
  onSearchChange,
  categories,
  activeCategory,
  onCategoryChange,
  sort,
  onSortChange,
}: MenuManagementFiltersProps) {
  return (
    <Section tight>
      <div className="ds-filters">
        <div className="ds-field">
          <label className="ds-label" htmlFor="menu-mgmt-search">
            Search
          </label>
          <div className="ds-cluster" style={{ alignItems: 'center' }}>
            <Icon name="search" size={18} />
            <Input
              id="menu-mgmt-search"
              type="text"
              placeholder="Search dishes by name..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor="menu-mgmt-category">
            Category
          </label>
          <select
            id="menu-mgmt-category"
            className="input"
            value={activeCategory}
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
          <label className="ds-label" htmlFor="menu-mgmt-sort">
            Sort by
          </label>
          <select
            id="menu-mgmt-sort"
            className="input"
            value={sort}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onSortChange(e.target.value)}
          >
            <option value="name">Name (A-Z)</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="-created_at">Newest first</option>
          </select>
        </div>
      </div>
    </Section>
  );
}