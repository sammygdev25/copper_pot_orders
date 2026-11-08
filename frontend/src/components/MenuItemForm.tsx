import React, { useState, useEffect, FormEvent } from 'react';
import { Button } from './ui';
import type { MenuItem, Category } from '../types';

interface MenuItemFormProps {
  item: MenuItem | null;
  categories: Category[];
  onSave: (data: Partial<MenuItem>) => void;
  onCancel: () => void;
}

export default function MenuItemForm({ item, categories, onSave, onCancel }: MenuItemFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setDescription(item.description || '');
      setPrice(item.price != null ? String(item.price) : '');
      setCategory(item.category != null ? String(item.category) : '');
      setIsAvailable(item.is_available !== undefined ? item.is_available : true);
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setCategory(categories.length > 0 ? String(categories[0].id) : '');
      setIsAvailable(true);
    }
  }, [item, categories]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Dish name is required.');
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Enter a valid price.');
      return;
    }
    if (!category) {
      setError('Select a category.');
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        price: Number(parsedPrice || 0),
        category: parseInt(category, 10),
        is_available: isAvailable,
      });
    } catch (err) {
      setError('Could not save this dish. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="ds-form" onSubmit={handleSubmit}>
      {error && <div className="ds-alert" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>{error}</div>}

      <div className="ds-field">
        <label className="ds-label" htmlFor="mi-name">Dish name</label>
        <input
          id="mi-name"
          className="input"
          type="text"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          placeholder="e.g. Braised Short Rib"
          required
        />
      </div>

      <div className="ds-field">
        <label className="ds-label" htmlFor="mi-description">Description</label>
        <textarea
          id="mi-description"
          className="input"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          placeholder="Describe the dish, key ingredients, preparation style..."
          rows={4}
        />
      </div>

      <div className="ds-form-row">
        <div className="ds-field">
          <label className="ds-label" htmlFor="mi-price">Price (USD)</label>
          <input
            id="mi-price"
            className="input"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor="mi-category">Category</label>
          <select
            id="mi-category"
            className="input"
            value={category}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
            required
          >
            <option value="" disabled>Select a category</option>
            {(Array.isArray(categories) ? categories : []).map((cat) => (
              <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="ds-field">
        <label className="ds-label" htmlFor="mi-available">
          <input
            id="mi-available"
            type="checkbox"
            checked={isAvailable}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsAvailable(e.target.checked)}
            style={{ marginRight: 'var(--space-sm)' }}
          />
          Available on the menu
        </label>
        <p className="ds-help">Uncheck to hide this dish from customers without deleting it.</p>
      </div>

      <div className="ds-form-actions">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? 'Saving...' : item ? 'Save changes' : 'Add dish'}
        </Button>
      </div>
    </form>
  );
}
