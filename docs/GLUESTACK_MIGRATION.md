# GlueStack UI v3 Migration Guide

This guide explains how to migrate PocketOS from custom components to GlueStack UI v3.

## What is GlueStack UI?

GlueStack UI is a universal component library for React Native and Web that provides:
- **Pre-built, accessible components** (Button, Input, Card, etc.)
- **Customizable theming** that works with your existing design system
- **NativeWind/Tailwind CSS support** for styling
- **Cross-platform compatibility** (iOS, Android, Web)
- **TypeScript support**

## Installation

Already completed! GlueStack UI v3 has been installed:

```bash
npm install @gluestack-ui/themed react-native-svg@13.9.0
```

## Configuration

### 1. GlueStack UI Config (`gluestack-ui.config.js`)

The configuration file has been created with your existing PocketOS color palette:

```javascript
import { config as defaultConfig } from '@gluestack-ui/config';

export const config = {
  ...defaultConfig,
  tokens: {
    colors: {
      bg: '#F4F3EF',
      surface: '#FDFCFA',
      primary: '#1D3557',
      accent: '#E8825A',
      // ... all your existing colors
    },
    // ... spacing, radii, etc.
  },
};
```

### 2. App Layout (`app/_layout.jsx`)

The root layout has been wrapped with `GluestackUIProvider`:

```jsx
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '../gluestack-ui.config';

export default function RootLayout() {
  return (
    <GluestackUIProvider config={config}>
      {/* Your app content */}
    </GluestackUIProvider>
  );
}
```

## Component Migration Examples

### Button Component

**Before (Custom Component):**
```jsx
<Pressable
  onPress={onContinue}
  style={{
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#1D3557',
  }}
>
  <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '500' }}>
    Continue
  </Text>
</Pressable>
```

**After (GlueStack UI):**
```jsx
import { Button, ButtonText } from '@gluestack-ui/themed';

<Button
  size="md"
  variant="solid"
  action="primary"
  onPress={onContinue}
>
  <ButtonText>Continue</ButtonText>
</Button>
```

### Input Component

**Before (Custom LabeledInput):**
```jsx
<View>
  <Text style={{ fontSize: 13, fontWeight: '500', color: '#7A7770' }}>
    Email
  </Text>
  <TextInput
    value={email}
    onChangeText={setEmail}
    placeholder="Enter your email"
    style={{
      backgroundColor: '#FDFCFA',
      borderWidth: 1.5,
      borderColor: '#E4E2DC',
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
    }}
  />
</View>
```

**After (GlueStack UI):**
```jsx
import { 
  FormControl, 
  FormControlLabel, 
  FormControlLabelText,
  Input, 
  InputField 
} from '@gluestack-ui/themed';

<FormControl>
  <FormControlLabel>
    <FormControlLabelText>Email</FormControlLabelText>
  </FormControlLabel>
  <Input>
    <InputField
      value={email}
      onChangeText={setEmail}
      placeholder="Enter your email"
    />
  </Input>
</FormControl>
```

### Card Component

**Before (Custom Card):**
```jsx
<View
  style={{
    backgroundColor: '#FDFCFA',
    borderWidth: 1,
    borderColor: '#E4E2DC',
    borderRadius: 10,
    padding: 20,
  }}
>
  <Text style={{ fontSize: 18, fontWeight: '600' }}>Title</Text>
  <Text style={{ fontSize: 14, color: '#7A7770' }}>Description</Text>
</View>
```

**After (GlueStack UI):**
```jsx
import { 
  Card, 
  Heading, 
  Text 
} from '@gluestack-ui/themed';

<Card size="md" variant="elevated">
  <Heading size="md">Title</Heading>
  <Text size="sm">Description</Text>
</Card>
```

### Option Card (Custom Component Migration)

**Before:**
```jsx
<Pressable
  onPress={onPress}
  style={{
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: selected ? '#1D3557' : '#E4E2DC',
    backgroundColor: selected ? 'rgba(29,53,87,0.05)' : '#FDFCFA',
  }}
>
  <Text>{label}</Text>
</Pressable>
```

**After (Using GlueStack Pressable + Box):**
```jsx
import { Pressable, Box, Text } from '@gluestack-ui/themed';

<Pressable onPress={onPress}>
  <Box
    p="$3.5"
    borderRadius="$lg"
    borderWidth="$1.5"
    borderColor={selected ? "$primary" : "$border"}
    bg={selected ? "$chipActive" : "$surface"}
  >
    <Text>{label}</Text>
  </Box>
</Pressable>
```

## Available GlueStack UI Components

### Layout Components
- `Box` - Flexible container (like View)
- `HStack` - Horizontal stack
- `VStack` - Vertical stack
- `Center` - Centered container
- `Divider` - Separator line

### Form Components
- `Button` + `ButtonText` + `ButtonIcon`
- `Input` + `InputField`
- `FormControl` + `FormControlLabel` + `FormControlLabelText`
- `Checkbox` + `CheckboxIndicator` + `CheckboxLabel`
- `Radio` + `RadioGroup` + `RadioIndicator` + `RadioLabel`
- `Switch`
- `Slider`
- `Select` + `SelectTrigger` + `SelectInput` + `SelectPortal`

### Display Components
- `Card`
- `Badge`
- `Avatar` + `AvatarImage` + `AvatarFallbackText`
- `Image`
- `Icon`

### Typography
- `Heading`
- `Text`

### Feedback Components
- `Alert` + `AlertIcon` + `AlertText`
- `Toast`
- `Spinner`
- `Progress`

### Overlay Components
- `Modal` + `ModalBackdrop` + `ModalContent`
- `Actionsheet`
- `Popover`
- `Tooltip`
- `Menu`

## Styling with GlueStack UI

GlueStack UI supports multiple styling approaches:

### 1. Token-based Props (Recommended)
```jsx
<Box
  p="$4"              // padding from theme tokens
  bg="$primary"       // background color from theme
  borderRadius="$lg"  // border radius from theme
>
  <Text color="$white">Hello</Text>
</Box>
```

### 2. NativeWind Classes (if configured)
```jsx
<Box className="p-4 bg-primary rounded-lg">
  <Text className="text-white">Hello</Text>
</Box>
```

### 3. Style Props
```jsx
<Box
  style={{
    padding: 16,
    backgroundColor: '#1D3557',
    borderRadius: 10,
  }}
>
  <Text>Hello</Text>
</Box>
```

## Migration Strategy

### Phase 1: New Components (Recommended)
Start using GlueStack UI for **new features** while keeping existing components:

```jsx
// New screen using GlueStack UI
import { Box, Button, ButtonText } from '@gluestack-ui/themed';

export default function NewScreen() {
  return (
    <Box flex={1} p="$5">
      <Button>
        <ButtonText>Click Me</ButtonText>
      </Button>
    </Box>
  );
}
```

### Phase 2: Gradual Migration
Migrate existing components one at a time:

1. **Start with simple components** (Button, Text, Box)
2. **Move to form components** (Input, FormControl)
3. **Migrate complex components** (Cards, Modals)
4. **Update onboarding screens** last

### Phase 3: Cleanup
Once migration is complete:
- Remove old custom components
- Remove unused style constants
- Update documentation

## Custom Component Wrappers

You can create wrappers to maintain your existing API:

```jsx
// components/ui/PrimaryButton.jsx
import { Button, ButtonText } from '@gluestack-ui/themed';

export function PrimaryButton({ children, ...props }) {
  return (
    <Button
      size="md"
      variant="solid"
      action="primary"
      {...props}
    >
      <ButtonText>{children}</ButtonText>
    </Button>
  );
}
```

## Theming

Customize the theme in `gluestack-ui.config.js`:

```javascript
export const config = {
  tokens: {
    colors: {
      primary: '#1D3557',
      // Add more colors
    },
    space: {
      pagePadH: 20,
      // Add more spacing
    },
    radii: {
      button: 10,
      // Add more radii
    },
  },
};
```

## Resources

- [GlueStack UI Documentation](https://ui.gluestack.io/)
- [Component Examples](https://ui.gluestack.io/docs/components/overview)
- [Theming Guide](https://ui.gluestack.io/docs/theme/overview)
- [Migration from v2 to v3](https://ui.gluestack.io/docs/migration/migration-guide)

## Next Steps

1. ✅ GlueStack UI installed and configured
2. ✅ Provider added to app layout
3. ✅ Theme configured with PocketOS colors
4. 🔄 Start using GlueStack components in new features
5. 📝 Gradually migrate existing components
6. 🧪 Test on all platforms (iOS, Android, Web)

## Support

If you encounter issues:
1. Check the [GlueStack UI docs](https://ui.gluestack.io/)
2. Review the [GitHub issues](https://github.com/gluestack/gluestack-ui/issues)
3. Ask in the [Discord community](https://discord.gg/gluestack)
