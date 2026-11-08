import { Button } from '../components/ui';
import { Icon } from '../components/icons';

interface MenuManagementPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function MenuManagementPagination({
  currentPage,
  totalPages,
  onPageChange,
}: MenuManagementPaginationProps) {
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="ds-pagination">
      <Button
        variant="ghost"
        onClick={handlePrevious}
        disabled={currentPage <= 1}
        aria-label="Previous page of menu items"
      >
        <Icon name="chevron-left" size={16} />
        Previous
      </Button>
      <span className="ds-muted">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="ghost"
        onClick={handleNext}
        disabled={currentPage >= totalPages}
        aria-label="Next page of menu items"
      >
        Next
        <Icon name="chevron-right" size={16} />
      </Button>
    </div>
  );
}