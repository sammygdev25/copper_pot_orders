import React from 'react';
import type { Category } from '../types';

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onSelect: (slug: string) => void;
}

export default function CategoryTabs({ categories, activeCategory, onSelect }: CategoryTabsProps) {
  const items = Array.isArray(categories) ? categories : [];

  return (
    <div className="ds-cluster" role="tablist" aria-label="Menu categories">
      <button
        type="button"
        role="tab"
        aria-selected={activeCategory === ''}
        className={`btn ${activeCategory === '' ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => onSelect('')}
      >
        All Dishes
      </button>
      {items.map((category) => (
        <button
          key={category.id}
          type="button"
          role="tab"
          aria-selected={activeCategory === category.slug}
          className={`btn ${activeCategory === category.slug ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onSelect(category.slug)}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}