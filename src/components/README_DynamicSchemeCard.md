# DynamicSchemeCard Component

A comprehensive React Native component for displaying gold savings schemes with multilingual support, modal details, and API integration.

## Features

- **Horizontal Slider**: Cards display in a horizontal scrolling slider
- **Auto-Scroll**: Automatically moves to next card every 2 seconds (configurable)
- **Pagination Dots**: Interactive dots showing current position and allowing manual navigation
- **Dynamic Card Layout**: Displays scheme cards with title, description, and action buttons
- **Multilingual Support**: Full English/Tamil language support with automatic text switching
- **Modal Details**: Detailed scheme information in a scrollable modal with dynamic tables
- **API Integration**: Fetches schemes data from API endpoint
- **Responsive Design**: Adapts to different screen sizes with proper styling
- **Theme Integration**: Uses the app's color theme and styling system

## Props

| Prop                 | Type                       | Required | Default | Description                                |
| -------------------- | -------------------------- | -------- | ------- | ------------------------------------------ |
| `onJoinPress`        | `(scheme: Scheme) => void` | No       | -       | Callback when "Join Now" button is pressed |
| `onInfoPress`        | `(scheme: Scheme) => void` | No       | -       | Callback when "Info" button is pressed     |
| `autoScrollInterval` | `number`                   | No       | `2000`  | Auto scroll interval in milliseconds       |
| `showDots`           | `boolean`                  | No       | `true`  | Whether to show pagination dots            |

## Usage

### Basic Usage

```tsx
import DynamicSchemeCard from "../components/DynamicSchemeCard";

const MyComponent = () => {
  return <DynamicSchemeCard />;
};
```

### With Custom Handlers

```tsx
import DynamicSchemeCard from "../components/DynamicSchemeCard";

const MyComponent = () => {
  const handleJoin = (scheme) => {
    console.log("Joining scheme:", scheme.title);
    // Navigate to join screen or show form
  };

  const handleInfo = (scheme) => {
    console.log("Info for scheme:", scheme.title);
    // Additional info handling
  };

  return (
    <DynamicSchemeCard
      onJoinPress={handleJoin}
      onInfoPress={handleInfo}
      autoScrollInterval={3000} // 3 seconds
      showDots={true}
    />
  );
};
```

## Data Structure

The component expects schemes data in the following format:

```typescript
interface Scheme {
  SCHEMEID: number;
  SCHEMENAME: {
    en: string;
    ta: string;
  };
  DESCRIPTION: {
    en: string;
    ta: string;
  };
  table_meta?: {
    headers: {
      en: string[];
      ta: string[];
    };
    rows: Array<Record<string, string>>;
  };
}
```

## API Data

The component fetches schemes data from the `/schemes` API endpoint. The API should return data in the following format:

```json
{
  "data": [
    {
      "SCHEMEID": 1,
      "SCHEMENAME": {
        "en": "Bonus Gold Savings Scheme",
        "ta": "போனசுடன் கூடிய தங்கநகைத் திட்டம்"
      },
      "DESCRIPTION": {
        "en": "Description in English",
        "ta": "Description in Tamil"
      },
      "SCHEMETYPE": "Fixed",
      "DURATION_MONTHS": 15,
      "IMAGE": "https://example.com/image.jpg",
      "ICON": "diamond",
      "table_meta": {
        "headers": {
          "en": ["Column 1", "Column 2"],
          "ta": ["நெடுவரிசை 1", "நெடுவரிசை 2"]
        },
        "rows": [{ "col1": "value1", "col2": "value2" }]
      }
    }
  ]
}
```

## Language Support

The component automatically detects the current language using `@/hooks/useTranslation` and displays appropriate text:

- **English**: Shows English text and labels
- **Tamil**: Shows Tamil text and labels

Language switching is handled automatically when the app's language changes.

## Styling

The component uses the app's theme system with:

- **Colors**: From `COLORS` constant
- **Typography**: Consistent with app's text styles
- **Spacing**: Responsive padding and margins
- **Shadows**: Card elevation and modal shadows
- **Borders**: Rounded corners and subtle borders

## Auto-Scroll Features

- **Configurable Interval**: Set custom auto-scroll timing (default: 2 seconds)
- **Smooth Animation**: Smooth transitions between cards
- **Manual Override**: Users can manually swipe or tap dots to navigate
- **Loop Navigation**: Automatically loops back to first card after last
- **Pause on Interaction**: Auto-scroll pauses when user interacts with slider

## Dependencies

- `react-native`
- `@expo/vector-icons` (for Ionicons)
- `@/hooks/useTranslation` (for translations)
- `../constants/colors` (for theme colors)

## Example Integration

See `src/examples/DynamicSchemeCardExample.tsx` for a complete usage example.

## Customization

You can customize the component by:

1. **Modifying styles**: Update the `styles` object
2. **Adding props**: Extend the component interface
3. **Customizing data**: Update the API endpoint and response handling
4. **API integration**: Modify the API URL and data structure
5. **Language support**: Add more languages by extending the translation system
