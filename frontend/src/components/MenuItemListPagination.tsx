import { Button } from '../components/ui';
import { Icon } from '../components/icons';

interface MenuItemListPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function MenuItemListPagination({ page, totalPages, onPageChange }: MenuItemListPaginationProps) {
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  return (
    <div className="ds-pagination">
      <Button
        variant="ghost"
        onClick={handlePrevious}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <Icon name="chevron-left" size={16} />
        Previous
      </Button>
      <span className="ds-muted">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="ghost"
        onClick={handleNext}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        Next
        <Icon name="chevron-right" size={16} />
      </Button>
    </div>
  );
}