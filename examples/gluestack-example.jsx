/**
 * GlueStack UI Quick Start Example
 * 
 * This file demonstrates how to use GlueStack UI components in PocketOS.
 * Copy and adapt these examples for your screens.
 */

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  Divider,
} from '@gluestack-ui/themed';

// Import custom wrappers
import { PrimaryButton, FormInput, OptionCard } from '../components/ui';

export default function GlueStackExample() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);

  return (
    <Box flex={1} bg="$bg" p="$5">
      <VStack space="lg">
        {/* Header */}
        <Heading size="xl" color="$primary">
          GlueStack UI Example
        </Heading>

        <Text size="md" color="$muted">
          This demonstrates the new component system
        </Text>

        <Divider />

        {/* Form Section */}
        <Card size="md" variant="elevated">
          <VStack space="md">
            <Heading size="md">Form Example</Heading>

            <FormInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              required
            />

            <FormInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              helperText="We'll never share your email"
            />

            <PrimaryButton onPress={() => console.log('Submitted!')}>
              Submit Form
            </PrimaryButton>
          </VStack>
        </Card>

        {/* Option Cards Section */}
        <Card size="md" variant="elevated">
          <VStack space="md">
            <Heading size="md">Select an Option</Heading>

            <OptionCard
              icon="🏠"
              label="Own Home"
              selected={selectedOption === 'own'}
              onPress={() => setSelectedOption('own')}
            />

            <OptionCard
              icon="🏢"
              label="Renting"
              selected={selectedOption === 'rent'}
              onPress={() => setSelectedOption('rent')}
            />

            <OptionCard
              icon="👨‍👩‍👧"
              label="Living with Family"
              selected={selectedOption === 'family'}
              onPress={() => setSelectedOption('family')}
            />
          </VStack>
        </Card>

        {/* Button Variants */}
        <Card size="md" variant="elevated">
          <VStack space="md">
            <Heading size="md">Button Variants</Heading>

            <HStack space="sm" flexWrap="wrap">
              <PrimaryButton variant="primary" size="sm">
                Primary
              </PrimaryButton>

              <PrimaryButton variant="secondary" size="sm">
                Secondary
              </PrimaryButton>

              <PrimaryButton variant="outline" size="sm">
                Outline
              </PrimaryButton>

              <PrimaryButton variant="accent" size="sm">
                Accent
              </PrimaryButton>
            </HStack>
          </VStack>
        </Card>

        {/* Direct GlueStack Components */}
        <Card size="md" variant="elevated">
          <VStack space="md">
            <Heading size="md">Direct GlueStack Components</Heading>

            <Text>
              You can also use GlueStack components directly:
            </Text>

            <Box
              p="$4"
              bg="$primary"
              borderRadius="$lg"
            >
              <Text color="$white" fontWeight="$medium">
                This is a Box with custom styling
              </Text>
            </Box>

            <HStack space="md" justifyContent="space-between">
              <Box flex={1} p="$3" bg="$accent" borderRadius="$md">
                <Text color="$white" textAlign="center">Box 1</Text>
              </Box>
              <Box flex={1} p="$3" bg="$positive" borderRadius="$md">
                <Text color="$white" textAlign="center">Box 2</Text>
              </Box>
            </HStack>
          </VStack>
        </Card>
      </VStack>
    </Box>
  );
}
