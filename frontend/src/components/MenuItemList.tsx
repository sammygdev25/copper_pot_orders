import type { MenuItem } from '../types';
import { Button, Media, Badge } from '../components/ui';
import { Icon } from '../components/icons';

interface MenuItemListProps {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
}

export default function MenuItemList({ items, onEdit, onDelete }: MenuItemListProps) {
  const list = Array.isArray(items) ? items : [];

  if (list.length === 0) {
    return (
      <div className="ds-empty">
        <Icon name="package" size={32} />
        <p>No dishes yet. Add your first dish to the Copper Pot Kitchen menu.</p>
      </div>
    );
  }

  return (
    <div className="ds-table-wrap">
      <table className="ds-table">
        <thead>
          <tr>
            <th>Dish</th>
            <th>Category</th>
            <th>Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="ds-cluster" style={{ alignItems: 'center' }}>
                  <Media
                    src={item.image || ''}
                    alt={item.name}
                    ratio="square"
                  />
                  <div className="ds-stack" style={{ gap: 0 }}>
                    <strong>{item.name}</strong>
                    <span className="ds-small ds-muted">{item.description}</span>
                  </div>
                </div>
              </td>
              <td>{item.category || '—'}</td>
              <td>
                <strong>${Number(item.price).toFixed(2)}</strong>
              </td>
              <td>
                <Badge tone={item.is_available ? 'success' : 'danger'}>
                  {item.is_available ? 'Available' : 'Unavailable'}
                </Badge>
              </td>
              <td>
                <div className="ds-cluster">
                  <Button variant="secondary" size="md" onClick={() => onEdit(item)}>
                    <Icon name="edit" size={16} />
                    Edit
                  </Button>
                  <Button variant="danger" size="md" onClick={() => onDelete(item.id)}>
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
