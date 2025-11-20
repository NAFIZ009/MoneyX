/**
 * Expense categories with icons
 */
export const EXPENSE_CATEGORIES = [
    { value: 'food', label: 'Food & Dining', icon: '🍽️', color: '#FF6B6B' },
    { value: 'transport', label: 'Transportation', icon: '🚗', color: '#4ECDC4' },
    { value: 'groceries', label: 'Groceries', icon: '🛒', color: '#95E1D3' },
    { value: 'shopping', label: 'Shopping', icon: '👕', color: '#F38181' },
    { value: 'healthcare', label: 'Healthcare', icon: '💊', color: '#AA96DA' },
    { value: 'entertainment', label: 'Entertainment', icon: '🎮', color: '#FCBAD3' },
    { value: 'education', label: 'Education', icon: '📚', color: '#A8D8EA' },
    { value: 'mobile', label: 'Mobile Recharge', icon: '📱', color: '#FFCCBC' },
    { value: 'household', label: 'Household', icon: '🏠', color: '#B0BEC5' },
    { value: 'personal', label: 'Personal Care', icon: '✨', color: '#E1BEE7' },
    { value: 'gifts', label: 'Gifts & Charity', icon: '🎁', color: '#F8BBD0' },
    { value: 'others', label: 'Others', icon: '💰', color: '#C5CAE9' },
  ];
  
  /**
   * Get category by value
   */
  export function getCategoryByValue(value) {
    return EXPENSE_CATEGORIES.find(cat => cat.value === value) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
  }
  
  /**
   * Get category label
   */
  export function getCategoryLabel(value) {
    const category = getCategoryByValue(value);
    return category.label;
  }
  
  /**
   * Get category icon
   */
  export function getCategoryIcon(value) {
    const category = getCategoryByValue(value);
    return category.icon;
  }
  
  /**
   * Get category color
   */
  export function getCategoryColor(value) {
    const category = getCategoryByValue(value);
    return category.color;
  }