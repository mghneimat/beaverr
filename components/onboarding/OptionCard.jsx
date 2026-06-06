import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, R } from '../../constants/onboarding-theme';

/**
 * Selectable option card with optional icon/emoji, label, and subtitle.
 * Standardized to match the blue/navy design system.
 * Reused across household type, occupation, health coverage, budget strategy, etc.
 *
 * @param {Object} props
 * @param {string} [props.icon] - Emoji or icon shown left of label
 * @param {string} props.label - Option label text (required)
 * @param {string} [props.subtitle] - Optional subtitle/description below label
 * @param {boolean} props.selected - Whether this option is currently selected
 * @param {Function} props.onPress - Press handler
 * @param {object} [props.style] - Additional styles on the Pressable
 */
export default function OptionCard({ icon, label, subtitle, selected, onPress, style }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => ([{
        paddingVertical: subtitle ? 16 : 14,
        paddingHorizontal: 18,
        borderRadius: R.input,
        borderWidth: 1.5,
        borderColor: selected
          ? C.primary
          : hovered
            ? C.accent
            : C.border,
        backgroundColor: selected
          ? 'rgba(30,58,95,0.04)'
          : hovered
            ? 'rgba(37,99,235,0.04)'
            : pressed
              ? C.bg
              : C.surface,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
      }, style])}
    >
      {icon ? (
        <Text style={{
          fontSize: 20,
          lineHeight: 24,
          marginRight: 12,
        }}>
          {icon}
        </Text>
      ) : null}

      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 15,
          color: selected ? C.primary : C.text,
          fontWeight: selected ? '600' : '400',
          lineHeight: subtitle ? 20 : 22,
        }}>
          {label}
        </Text>
        {subtitle ? (
          <Text style={{
            fontSize: 13,
            color: C.muted,
            lineHeight: 18,
            marginTop: 2,
          }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {selected ? (
        <View style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: C.accent,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 10,
        }}>
          <Text style={{
            color: '#FFFFFF',
            fontSize: 12,
            lineHeight: 14,
            fontWeight: '700',
          }}>
            {'✓'}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
