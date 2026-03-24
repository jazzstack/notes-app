import { Icons } from '@notes-app/ui';

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  allTags: string[];
  sortBy: 'title' | 'updatedAt' | 'createdAt';
  onSortChange: (sort: 'title' | 'updatedAt' | 'createdAt') => void;
}

export function SearchFilter({
  searchQuery,
  onSearchChange,
  selectedTags,
  onTagToggle,
  allTags,
  sortBy,
  onSortChange,
}: SearchFilterProps) {
  return (
    <div className="search-filter">
      <div className="search-filter-row">
        <div className="search-input-wrapper">
          <Icons.Search className="search-input-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              <Icons.X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>

        <select
          className="sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as 'title' | 'updatedAt' | 'createdAt')}
        >
          <option value="updatedAt">Last Modified</option>
          <option value="createdAt">Created</option>
          <option value="title">Title</option>
        </select>
      </div>

      {allTags.length > 0 && (
        <div className="tags-filter">
          <div className="tags-filter-label">Filter by tags:</div>
          <div className="tags-filter-list">
            {allTags.map((tag) => (
              <button
                key={tag}
                className={`tag-filter-btn ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => onTagToggle(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
