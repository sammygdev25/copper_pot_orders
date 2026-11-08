import React, { useState, useEffect } from 'react';
import { Button } from './ui';
import type { Category } from '../types';

interface CategoryFormProps {
  category: Category | null;
  onSave: (data: Partial<Category>) => void;
  onCancel: () => void;
}

export default function CategoryForm({ category, onSave, onCancel }: CategoryFormProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setSlug(category.slug || '');
    } else {
      setName('');
      setSlug('');
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const payload: Partial<Category> = { name: name.trim() };
      if (slug.trim()) {
        payload.slug = slug.trim();
      }
      await onSave(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="ds-form" onSubmit={handleSubmit}>
      <div className="ds-field">
        <label className="ds-label" htmlFor="category-name">Category name</label>
        <input
          id="category-name"
          className="input"
          type="text"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          placeholder="e.g. Starters, Entrees, Desserts"
          required
        />
      </div>
      <div className="ds-field">
        <label className="ds-label" htmlFor="category-slug">Slug (optional)</label>
        <input
          id="category-slug"
          className="input"
          type="text"
          value={slug}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlug(e.target.value)}
          placeholder="auto-generated if left blank"
        />
        <p className="ds-help">Used in URLs like /menu-items?category=entrees</p>
      </div>
      <div className="ds-form-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Saving...' : category ? 'Save changes' : 'Add category'}
        </Button>
      </div>
    </form>
  );
}