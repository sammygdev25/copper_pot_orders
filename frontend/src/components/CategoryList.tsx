import type { Category } from '../types';
import { Button } from '../components/ui';
import { Icon } from '../components/icons';

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
}

export default function CategoryList({ categories, onEdit, onDelete }: CategoryListProps) {
  const list = Array.isArray(categories) ? categories : [];

  if (list.length === 0) {
    return (
      <div className="ds-empty">
        <Icon name="tag" size={28} />
        <p className="ds-muted">No categories yet — add one to start organizing the menu.</p>
      </div>
    );
  }

  return (
    <div className="ds-table-wrap">
      <table className="ds-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Items</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {list.map((category) => (
            <tr key={category.id}>
              <td>{category.name}</td>
              <td className="ds-muted ds-small">{category.slug}</td>
              <td>-</td>
              <td>
                <div className="ds-cluster">
                  <Button variant="ghost" size="md" onClick={() => onEdit(category)}>
                    <Icon name="edit" size={16} />
                    Edit
                  </Button>
                  <Button variant="danger" size="md" onClick={() => onDelete(category.id)}>
                    <Icon name="trash" size={16} />
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
