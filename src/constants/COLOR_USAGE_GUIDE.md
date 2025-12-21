# Color Usage Guide

This guide explains how to use the centralized color system in the Digi Gold Savings Expo Mobile App.

## Importing Colors

### Default Import (Recommended)
```typescript
import COLORS from '@/constants/colors';
// or
import COLORS from 'src/constants/colors';
```

### Named Imports
```typescript
import { 
  PRIMARY_COLORS, 
  TEXT_COLORS, 
  STATUS_COLORS,
  COMPONENT_COLORS,
  GRADIENT_COLORS 
} from '@/constants/colors';
```

## Color Categories

### 1. Primary Colors
```typescript
COLORS.primary        // #850111 (Main brand color)
COLORS.secondary      // #ffc90c (Secondary brand color)
COLORS.gold           // #ffd700 (Gold accent)
COLORS.silver         // #C0C0C0 (Silver accent)
```

### 2. Text Colors
```typescript
COLORS.text.primary      // #ffffff (White text)
COLORS.text.secondary    // #000000 (Black text)
COLORS.text.dark         // #2e0406 (Dark text)
COLORS.text.success      // #00cc44 (Success text)
COLORS.text.error        // #ff4444 (Error text)
COLORS.text.warning      // #FF9800 (Warning text)
```

### 3. Background Colors
```typescript
COLORS.background.primary    // #ffffff (White background)
COLORS.background.secondary  // #f0f0f0 (Light gray background)
COLORS.background.card       // #FFF8DC (Card background)
COLORS.background.overlay    // rgba(0,0,0,0.7) (Dark overlay)
```

### 4. Status Colors
```typescript
COLORS.status.success    // #4CAF50 (Success state)
COLORS.status.error      // #ff4d4f (Error state)
COLORS.status.warning    // #FF9800 (Warning state)
COLORS.status.active      // #2E7D32 (Active state)
COLORS.status.inactive    // #D32F2F (Inactive state)
```

### 5. Component Colors
```typescript
// Button colors
COLORS.components.button.primary    // #850111 (Primary button)
COLORS.components.button.secondary  // #ffc90c (Secondary button)
COLORS.components.button.success    // #4CAF50 (Success button)
COLORS.components.button.error      // #ff4444 (Error button)

// Card colors
COLORS.components.card.background   // #ffffff (Card background)
COLORS.components.card.border       // #e5e5e5 (Card border)

// Tab colors
COLORS.components.tab.active        // #FFC857 (Active tab)
COLORS.components.tab.inactive      // #888 (Inactive tab)
```

### 6. Border Colors
```typescript
COLORS.border.primary    // #cccccc (Default border)
COLORS.border.light      // #e5e5e5 (Light border)
COLORS.border.white      // #f0f0f0 (White border)
COLORS.border.gold       // #ffd700 (Gold border)
```

### 7. Shadow Colors
```typescript
COLORS.shadow.black      // #000 (Black shadow)
COLORS.shadow.gold       // #ffd700 (Gold shadow)
COLORS.shadow.primary    // #850111 (Primary shadow)
```

### 8. Gradient Colors
```typescript
COLORS.gradients.primary     // ["#850111", "#B8860B", "#DAA520"]
COLORS.gradients.success     // ["#4CAF50", "#45a049", "#3d8b40"]
COLORS.gradients.gold        // ["#ffc90c", "#ffd700"]
```

## Usage Examples

### Basic Styling
```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    borderColor: COLORS.border.primary,
  },
  text: {
    color: COLORS.text.primary,
  },
});
```

### Component Styling
```typescript
const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.components.button.primary,
    borderColor: COLORS.border.gold,
  },
  buttonText: {
    color: COLORS.components.button.white,
  },
});
```

### Conditional Styling
```typescript
const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
      return COLORS.status.success;
    case 'error':
      return COLORS.status.error;
    case 'warning':
      return COLORS.status.warning;
    default:
      return COLORS.text.grey;
  }
};
```

### Linear Gradient
```typescript
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={COLORS.gradients.primary}
  style={styles.gradientContainer}
>
  <Text style={styles.gradientText}>Gradient Text</Text>
</LinearGradient>
```

## Best Practices

### 1. Use Semantic Colors
- Use `COLORS.status.success` instead of hardcoded `#4CAF50`
- Use `COLORS.text.primary` instead of hardcoded `#ffffff`

### 2. Consistent Import Pattern
- Stick to one import pattern throughout your component
- Use `@/constants/colors` for consistency with path mapping

### 3. Color Accessibility
- Ensure sufficient contrast between text and background colors
- Use status colors consistently for user feedback

### 4. Theme Consistency
- All colors are derived from the central theme
- Changes to theme.js will automatically update all components

## Available Color Properties

### Direct Access
- `COLORS.red` - Red color
- `COLORS.green` - Green color
- `COLORS.blue` - Blue color
- `COLORS.gold` - Gold color
- `COLORS.silver` - Silver color

### Nested Access
- `COLORS.background.primary`
- `COLORS.text.primary`
- `COLORS.border.primary`
- `COLORS.shadow.primary`
- `COLORS.status.active`

### Component-Specific
- `COLORS.components.button.primary`
- `COLORS.components.card.background`
- `COLORS.components.tab.active`
- `COLORS.components.icon.primary`

## Troubleshooting

### Common Issues
1. **Import Error**: Ensure the path is correct (`@/constants/colors` or `src/constants/colors`)
2. **Type Error**: Check that you're using the correct property path
3. **Undefined Color**: Verify the color exists in the theme.js file

### Color Not Found
If you need a new color:
1. Add it to `src/constants/theme.js`
2. Export it in `src/constants/colors.js`
3. Add TypeScript declarations in `src/constants/colors.d.ts`

## Migration from Old System

If you're migrating from an old color system:

### Old Way
```typescript
const oldColor = '#850111';
```

### New Way
```typescript
import COLORS from '@/constants/colors';
const newColor = COLORS.primary;
```

### Benefits
- Centralized color management
- Easy theme changes
- Type safety with TypeScript
- Consistent color usage across the app
- Better maintainability
