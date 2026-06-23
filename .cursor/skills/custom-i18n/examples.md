# i18n Examples — Beaverr

## Basic screen

```jsx
// app/(onboarding)/welcome.jsx
import { useI18n } from '../../lib/i18n';

export default function WelcomeScreen() {
  const { t } = useI18n();

  return (
    <>
      <Text>{t('onboarding.welcome.title')}</Text>
      <Text>{t('onboarding.welcome.subtitle')}</Text>
      <Button title={t('onboarding.welcome.cta')} />
    </>
  );
}
```

## Shared common keys

```jsx
<Button title={t('common.continue')} />
<Button title={t('common.back')} />
<Text>{t('common.skip')}</Text>
```

## Interpolation

**JSON** (`lib/locales/en.json`):

```json
"onboarding": {
  "progress": "{{percent}}% complete",
  "household": {
    "childDetails": {
      "title": "Child {{n}} — a couple of quick details"
    }
  }
}
```

**Component:**

```jsx
<Text>{t('onboarding.progress', { percent: Math.round(pct) })}</Text>
<Text>{t('onboarding.household.childDetails.title', { n: childIndex + 1 })}</Text>
<Text>{t('onboarding.occupation.partnerTitle', { name: partnerName })}</Text>
```

## Validation errors

```jsx
const [validationError, setValidationError] = useState('');

// on failed validation:
setValidationError(t('onboarding.household.type.validation'));

// render:
{validationError ? <Text className="text-red-500">{validationError}</Text> : null}
```

## Language switcher (existing pattern)

```jsx
// components/HamburgerMenu.jsx
const { t, locale, setLocale } = useI18n();

const languages = [
  { code: 'en', label: 'English' },
  { code: 'cs', label: 'Čeština' },
];

<Pressable onPress={() => setLocale('cs')}>
  <Text>{t('settings.language')}</Text>
</Pressable>
```

## Adding keys for a new form field

**1. en.json**

```json
"onboarding": {
  "myScreen": {
    "title": "What's your favourite colour?",
    "helper": "Purely for fun — skip if you like.",
    "colourLabel": "Colour",
    "colourPlaceholder": "e.g. Blue",
    "validation": "Please pick a colour"
  }
}
```

**2. cs.json** (same path, Czech values)

```json
"onboarding": {
  "myScreen": {
    "title": "Jaká je vaše oblíbená barva?",
    "helper": "Jen pro zábavu — klidně přeskočte.",
    "colourLabel": "Barva",
    "colourPlaceholder": "např. Modrá",
    "validation": "Prosím vyberte barvu"
  }
}
```

**3. Component**

```jsx
const { t } = useI18n();

<Text>{t('onboarding.myScreen.title')}</Text>
<Text>{t('onboarding.myScreen.helper')}</Text>
<Input placeholder={t('onboarding.myScreen.colourPlaceholder')} />
```

## Unit test for new interpolation key

```js
// __tests__/lib/i18n.test.js
test('interpolates vehicle label', () => {
  const result = translate('en', 'onboarding.transport.q7a.vehicleLabel', {
    n: 1,
    total: 2,
    category: 'Passenger',
  });
  expect(result).toBe('Vehicle 1 of 2 — Passenger');
});
```

## Standalone t() — tests/utilities only

```js
import { t, translate } from '../lib/i18n';

// Always English — do NOT use in UI components
const label = t('common.continue');

// Explicit locale — preferred for non-React code
const csLabel = translate('cs', 'common.continue');
```
