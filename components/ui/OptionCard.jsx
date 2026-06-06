import React from 'react';
import { Pressable, Box, HStack, Text } from '@gluestack-ui/themed';

/**
 * OptionCard - Selectable option card with icon/emoji
 * GlueStack UI version of the onboarding OptionCard component
 * 
 * @param {Object} props
 * @param {string} [props.icon] - Emoji or icon shown left of label
 * @param {string} props.label - Option label text
 * @param {boolean} props.selected - Whether this option is currently selected
 * @param {Function} props.onPress - Press handler
 * 
 * @example
 * <OptionCard
 *   icon="🏠"
 *   label="Own Home"
 *   selected={housingType === 'own'}
 *   onPress={() => setHousingType('own')}
 * />
 */
export function OptionCard({ icon, label, selected, onPress }) {
  return (
    <Pressable onPress={onPress}>
      {({ hovered, pressed }) => (
        <Box
          py="$3.5"
          px="$4.5"
          borderRadius="$lg"
          borderWidth="$1.5"
          borderColor={
            selected
              ? '$primary'
              : hovered
                ? '$accent'
                : '$border'
          }
          bg={
            selected
              ? 'rgba(29,53,87,0.05)'
              : pressed
                ? '$bg'
                : hovered
                  ? 'rgba(26,26,26,0.04)'
                  : '$surface'
          }
          mb="$2.5"
        >
          <HStack space="md" alignItems="center">
            {icon && (
              <Text fontSize="$xl" lineHeight="$xl">
                {icon}
              </Text>
            )}

            <Text
              flex={1}
              fontSize={14.5}
              lineHeight={20}
              color={selected ? '$primary' : '$text'}
              fontWeight={selected ? '$medium' : '$normal'}
            >
              {label}
            </Text>

            {selected && (
              <Box
                w="$5"
                h="$5"
                borderRadius="$full"
                bg="$primary"
                alignItems="center"
                justifyContent="center"
              >
                <Text
                  color="$white"
                  fontSize={11}
                  lineHeight={14}
                  fontWeight="$semibold"
                >
                  ✓
                </Text>
              </Box>
            )}
          </HStack>
        </Box>
      )}
    </Pressable>
  );
}

export default OptionCard;
