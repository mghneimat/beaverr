import {
  useRef,
  useState,
  useEffect,
  useMemo,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Platform } from 'react-native';
import { C, R, S, T, INPUT_FIELD } from '../../constants/onboarding-theme';
import OnboardingPressable from './OnboardingPressable';
import { listRowBg } from './pressableFeedback';
import { elevationShadow } from '../../lib/shadow';
import { useI18n } from '../../lib/i18n';
import { resolveMonthPart } from '../../lib/datePicker';
import { isMobileWebTouch } from '../../lib/isMobileWebTouch';
import DatePartSelectWeb from './DatePartSelectWeb';

const SUGGESTION_LIMIT = 6;
const CHEVRON_SLOT_WIDTH = 32;
const SUGGESTION_ROW_HEIGHT = 44;

function resolveTextInputElement(node) {
  if (!node) return null;
  if (typeof node.setSelectionRange === 'function') return node;
  if (typeof node.getNativeRef === 'function') {
    const native = node.getNativeRef();
    if (native && typeof native.setSelectionRange === 'function') return native;
  }
  return null;
}

function filterOptions(options, query) {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(q) ||
      String(opt.value).startsWith(q),
  );
}

/**
 * Typeable date-part field with inline autocomplete and chevron.
 * Day/year accept digits; month accepts names or numbers.
 */
const DatePartDropdown = forwardRef(function DatePartDropdown(
  {
    label,
    value,
    displayValue,
    placeholder,
    options,
    onSelect,
    flex = 1,
    inGroup = false,
    partKind = 'day',
    numeric = false,
    maxLength,
    accessibilityLabel,
    onFocusChange,
    numericMin,
    numericMax,
    highlightDefaultValue,
    focusNextRef,
    focusPrevRef,
    invalid = false,
  },
  ref,
) {
  const { t } = useI18n();
  const mobileWeb = isMobileWebTouch();
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const tabbingAwayRef = useRef(false);
  const selectingRef = useRef(false);
  const [focused, setFocused] = useState(false);
  const [listExpanded, setListExpanded] = useState(false);
  const [draft, setDraft] = useState('');
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const focusNextRefStable = useRef(focusNextRef);
  const focusPrevRefStable = useRef(focusPrevRef);
  focusNextRefStable.current = focusNextRef;
  focusPrevRefStable.current = focusPrevRef;
  const keydownCleanupRef = useRef(null);
  const moveFocusRef = useRef(() => {});

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus?.();
      const el = resolveTextInputElement(inputRef.current);
      el?.focus?.();
    },
  }));

  const blurredDisplay = displayValue ?? (value ? String(value) : '');

  useEffect(() => {
    if (!focused) {
      setDraft(blurredDisplay);
    }
  }, [blurredDisplay, focused]);

  const suggestions = useMemo(() => {
    if (!focused) return [];
    const filtered = filterOptions(options, draft);
    if (mobileWeb && !draft.trim() && !listExpanded) return [];
    return draft.trim() ? filtered.slice(0, SUGGESTION_LIMIT) : filtered;
  }, [focused, draft, options, mobileWeb, listExpanded]);

  const panelVisible = suggestions.length > 0;

  useEffect(() => {
    if (!focused || draft.trim() || highlightDefaultValue == null) return;
    const index = suggestions.findIndex(
      (option) => String(option.value) === String(highlightDefaultValue),
    );
    if (index < 0) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, index * SUGGESTION_ROW_HEIGHT - SUGGESTION_ROW_HEIGHT * 2),
        animated: false,
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [focused, draft, suggestions, highlightDefaultValue]);

  const borderColor = focused ? C.accent : (invalid ? C.danger : C.border);

  const shellStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: inGroup ? 'transparent' : C.surface,
    borderWidth: !focused && invalid ? 2 : 1.5,
    borderColor,
    borderRadius: R.pill,
    minHeight: INPUT_FIELD.minHeight,
  };

  const commitDraft = () => {
    const trimmed = draftRef.current.trim();
    const currentOptions = optionsRef.current;
    const select = onSelectRef.current;
    if (!trimmed) {
      select('');
      setDraft('');
      return true;
    }

    const exact = currentOptions.find(
      (o) =>
        String(o.value) === trimmed ||
        o.label.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exact) {
      select(exact.value);
      return true;
    }

    if (partKind === 'month') {
      const monthNum = resolveMonthPart(trimmed, t);
      if (monthNum) {
        select(String(monthNum));
        return true;
      }
    }

    if (numeric) {
      const n = parseInt(trimmed, 10);
      if (!Number.isNaN(n)) {
        const hasRange = numericMin != null && numericMax != null;
        if (hasRange && trimmed.length >= 4 && n >= numericMin && n <= numericMax) {
          select(String(n));
          return true;
        }
        if (currentOptions.some((o) => String(o.value) === String(n))) {
          select(String(n));
          return true;
        }
      }
    }

    setDraft(blurredDisplay);
    return false;
  };

  const finalizeInput = () => {
    if (commitDraft()) return true;
    const trimmed = draftRef.current.trim();
    if (!trimmed) return false;
    const matches = filterOptions(optionsRef.current, trimmed);
    if (matches.length > 0) {
      onSelectRef.current(matches[0].value);
      setDraft(partKind === 'month' ? matches[0].label : matches[0].label);
      return true;
    }
    return false;
  };

  const closeFocus = () => {
    setFocused(false);
    setListExpanded(false);
    onFocusChange?.(false);
  };

  const moveFocus = (shiftKey) => {
    const target = shiftKey ? focusPrevRefStable.current : focusNextRefStable.current;
    if (!target?.current) return;

    tabbingAwayRef.current = true;
    finalizeInput();
    setFocused(false);
    onFocusChange?.(false);
    inputRef.current?.blur?.();

    setTimeout(() => {
      target.current?.focus?.();
      setTimeout(() => {
        tabbingAwayRef.current = false;
      }, 200);
    }, 0);
  };

  moveFocusRef.current = moveFocus;

  const handleSubmitEditing = () => {
    if (focusNextRefStable.current?.current) {
      moveFocus(false);
      return;
    }
    finalizeInput();
    closeFocus();
    inputRef.current?.blur?.();
  };

  const handleSubmitEditingRef = useRef(handleSubmitEditing);
  handleSubmitEditingRef.current = handleSubmitEditing;

  const bindTabKeydown = () => {
    if (Platform.OS !== 'web') return;
    keydownCleanupRef.current?.();
    keydownCleanupRef.current = null;

    const inputEl = resolveTextInputElement(inputRef.current);
    if (!inputEl) return;

    const handler = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        handleSubmitEditingRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const shiftKey = event.shiftKey;
      const targetRef = shiftKey ? focusPrevRefStable.current : focusNextRefStable.current;
      if (!targetRef?.current) return;

      event.preventDefault();
      event.stopPropagation();
      moveFocusRef.current(shiftKey);
    };

    inputEl.addEventListener('keydown', handler);
    keydownCleanupRef.current = () => {
      inputEl.removeEventListener('keydown', handler);
    };
  };

  useEffect(() => () => keydownCleanupRef.current?.(), []);

  const handleChangeText = (text) => {
    if (numeric) {
      setDraft(text.replace(/[^0-9]/g, '').slice(0, maxLength ?? 99));
    } else {
      setDraft(text);
    }
    if (mobileWeb && text.trim()) {
      setListExpanded(true);
    }
  };

  const selectSuggestion = (option) => {
    onSelect(option.value);
    setDraft(partKind === 'month' ? option.label : option.label);
    closeFocus();
    inputRef.current?.blur?.();
  };

  if (Platform.OS === 'web') {
    return (
      <DatePartSelectWeb
        ref={ref}
        partKind={partKind}
        label={label}
        value={value}
        placeholder={placeholder}
        options={options}
        onSelect={onSelect}
        flex={flex}
        inGroup={inGroup}
        invalid={invalid}
        accessibilityLabel={accessibilityLabel}
        onFocusChange={onFocusChange}
      />
    );
  }

  return (
    <View
      style={{ flex, minWidth: 0, zIndex: panelVisible ? 60 : 1 }}
      {...(Platform.OS === 'web' ? { dataSet: { datePart: partKind } } : {})}
    >
      <Text style={{ ...T.fieldLabel, marginBottom: S.labelGap }}>{label}</Text>

      <View style={{ position: 'relative', width: '100%' }}>
        <View style={shellStyle}>
          <TextInput
            ref={inputRef}
            value={draft}
            onChangeText={handleChangeText}
            placeholder={placeholder}
            placeholderTextColor={C.placeholder}
            accessibilityLabel={accessibilityLabel ?? label}
            keyboardType={
              numeric
                ? Platform.OS === 'web'
                  ? 'default'
                  : 'number-pad'
                : 'default'
            }
            inputMode={numeric ? 'numeric' : 'text'}
            maxLength={numeric ? maxLength : undefined}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType={focusNextRef ? 'next' : 'done'}
            blurOnSubmit={false}
            onSubmitEditing={handleSubmitEditing}
            onFocus={() => {
              bindTabKeydown();
              setFocused(true);
              if (mobileWeb) {
                requestAnimationFrame(() => onFocusChange?.(true));
              } else {
                onFocusChange?.(true);
              }
            }}
            onBlur={() => {
              keydownCleanupRef.current?.();
              keydownCleanupRef.current = null;
              const finalize = () => {
                if (tabbingAwayRef.current || selectingRef.current) {
                  selectingRef.current = false;
                  return;
                }
                commitDraft();
                setFocused(false);
                setListExpanded(false);
                onFocusChange?.(false);
              };
              if (mobileWeb) {
                requestAnimationFrame(finalize);
                return;
              }
              setTimeout(finalize, 120);
            }}
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 17,
              fontWeight: '400',
              color: C.text,
              paddingVertical: INPUT_FIELD.paddingVertical,
              paddingLeft: INPUT_FIELD.paddingHorizontal,
              paddingRight: 6,
              backgroundColor: 'transparent',
              borderWidth: 0,
              outlineStyle: 'none',
              outlineWidth: 0,
              ...(Platform.OS === 'web'
                ? { appearance: 'none', WebkitAppearance: 'none', outline: 'none' }
                : null),
            }}
          />
          <Pressable
            onPress={() => {
              if (mobileWeb) {
                setListExpanded((expanded) => !expanded);
              }
              inputRef.current?.focus?.();
            }}
            focusable={false}
            tabIndex={-1}
            accessible={false}
            importantForAccessibility="no"
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
            style={({ pressed }) => ({
              flexShrink: 0,
              width: CHEVRON_SLOT_WIDTH,
              alignSelf: 'stretch',
              alignItems: 'center',
              justifyContent: 'center',
              paddingRight: 6,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 12,
                lineHeight: 14,
                color: C.muted,
                includeFontPadding: false,
                textAlignVertical: 'center',
              }}
            >
              {'▼'}
            </Text>
          </Pressable>
        </View>

        {panelVisible ? (
          <View
            {...(Platform.OS === 'web' ? { tabIndex: -1, accessibilityElementsHidden: true } : {})}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              backgroundColor: C.surface,
              borderRadius: R.card,
              borderWidth: 1,
              borderColor: C.border,
              overflow: 'hidden',
              maxHeight: 220,
              zIndex: 1000,
              elevation: 16,
              ...elevationShadow({ offsetY: 4, blur: 8, opacity: 0.12 }),
            }}
          >
            <ScrollView
              ref={scrollRef}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              style={{ maxHeight: 220, backgroundColor: C.surface }}
            >
              {suggestions.map((option) => {
                const isSelected = String(option.value) === String(value);
                const isDefaultHighlight = !value
                  && highlightDefaultValue != null
                  && String(option.value) === String(highlightDefaultValue);
                const highlighted = isSelected || isDefaultHighlight;
                return (
                  <OnboardingPressable
                    key={option.value}
                    focusable={false}
                    tabIndex={-1}
                    onPressIn={() => {
                      selectingRef.current = true;
                    }}
                    onPress={() => selectSuggestion(option)}
                    style={({ pressed, hovered }) => ({
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      backgroundColor: listRowBg({ pressed, hovered, selected: highlighted }),
                    })}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        color: C.text,
                        fontWeight: highlighted ? '600' : '400',
                      }}
                    >
                      {option.label}
                    </Text>
                  </OnboardingPressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </View>
  );
});

export default DatePartDropdown;
