# Constants Directory

This directory contains all the centralized constants for the Digi Gold Savings Expo Mobile App.

## Files

### `colors.js`
The main color system file that exports all colors organized by category:
- `COLORS` - Main export with all colors
- `PRIMARY_COLORS` - Brand colors (primary, secondary, gold, silver)
- `TEXT_COLORS` - Text color variations
- `BACKGROUND_COLORS` - Background color variations
- `STATUS_COLORS` - Status-based colors (success, error, warning)
- `COMPONENT_COLORS` - Component-specific colors
- `GRADIENT_COLORS` - Gradient color arrays
- And more...

### `theme.js`
The base theme configuration that defines all color values and other theme properties.

### `colors.d.ts`
TypeScript type definitions for all color constants.

### `index.ts`
Central export file for easy importing of all constants.

### `ColorExample.tsx`
Example component demonstrating how to use the color system.

### `ColorTest.tsx`
Test component to verify all colors are working correctly.

### `COLOR_USAGE_GUIDE.md`
Comprehensive guide on how to use the color system.

## Usage

### Basic Import
```typescript
import COLORS from '@/constants/colors';
// or
import { COLORS } from '@/constants/colors';
```

### Named Imports
```typescript
import { 
  PRIMARY_COLORS, 
  TEXT_COLORS, 
  STATUS_COLORS 
} from '@/constants/colors';
```

### From Index
```typescript
import { COLORS, theme } from '@/constants';
```

## Color Categories

1. **Primary Colors** - Brand colors (primary, secondary, gold, silver)
2. **Text Colors** - Text color variations for different contexts
3. **Background Colors** - Background colors for different UI elements
4. **Status Colors** - Colors for different states (success, error, warning)
5. **Component Colors** - Colors specific to UI components
6. **Border Colors** - Border color variations
7. **Shadow Colors** - Shadow color options
8. **Gradient Colors** - Predefined gradient color arrays

## Benefits

- **Centralized Management** - All colors defined in one place
- **Type Safety** - Full TypeScript support with IntelliSense
- **Consistency** - Ensures consistent color usage across the app
- **Maintainability** - Easy to update colors globally
- **Theme Support** - Foundation for future theme switching

## Adding New Colors

1. Add the color to `theme.js`
2. Export it from `colors.js`
3. Add TypeScript types to `colors.d.ts`
4. Update documentation if needed

## Testing

Use `ColorTest.tsx` to verify that all colors are working correctly. This component displays all available colors and their values.
