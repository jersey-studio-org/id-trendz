// POLISH UPDATE - Created FiltersBar component with color swatches, style filter, and search
import { useState, useEffect } from 'react';
import { debounce } from '../utils/debounce';

export default function FiltersBar({ 
  products = [], 
  onFilterChange,
  availableColors = [],
  availableStyles = []
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');

  // Debounced search handler
  const debouncedSearch = debounce((query) => {
    applyFilters(query, selectedColor, selectedStyle);
  }, 300);

  useEffect(() => {
    applyFilters(searchQuery, selectedColor, selectedStyle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColor, selectedStyle]);

  const applyFilters = (query, color, style) => {
    let filtered = [...products];

    // Search filter
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(p => {
        const title = (p.title || p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        return title.includes(lowerQuery) || desc.includes(lowerQuery);
      });
    }

    // Color filter
    if (color) {
      filtered = filtered.filter(p => {
        const colors = p.colors || [];
        return colors.includes(color);
      });
    }

    // Style filter (based on description or tags if available)
    if (style) {
      filtered = filtered.filter(p => {
        const desc = (p.description || '').toLowerCase();
        const title = (p.title || p.name || '').toLowerCase();
        return desc.includes(style.toLowerCase()) || title.includes(style.toLowerCase());
      });
    }

    onFilterChange(filtered);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyFilters(searchQuery, selectedColor, selectedStyle);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedColor('');
    setSelectedStyle('');
    onFilterChange(products);
  };

  const hasActiveFilters = searchQuery || selectedColor || selectedStyle;

  return (
    <div className="filters-bar">
      <div className="filters-left">
        {/* Color Swatches */}
        {availableColors.length > 0 && (
          <div className="color-filters">
            {availableColors.map(color => (
              <button
                key={color}
                className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  const newColor = selectedColor === color ? '' : color;
                  setSelectedColor(newColor);
                  applyFilters(searchQuery, newColor, selectedStyle);
                }}
                aria-label={`Filter by color ${color}`}
                title={color}
              />
            ))}
          </div>
        )}

        {/* Style Dropdown */}
        {availableStyles.length > 0 && (
          <select
            className="style-filter"
            value={selectedStyle}
            onChange={(e) => {
              setSelectedStyle(e.target.value);
              applyFilters(searchQuery, selectedColor, e.target.value);
            }}
            aria-label="Filter by style"
          >
            <option value="">All Styles</option>
            {availableStyles.map(style => (
              <option key={style} value={style}>{style}</option>
            ))}
          </select>
        )}
      </div>

      <div className="filters-right">
        {/* Search Input */}
        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search jerseys, colors, styles..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              debouncedSearch(e.target.value);
            }}
            onKeyPress={handleSearchKeyPress}
            aria-label="Search products"
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => {
                setSearchQuery('');
                applyFilters('', selectedColor, selectedStyle);
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Clear Button */}
        {hasActiveFilters && (
          <button className="button-secondary" onClick={handleClear}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

