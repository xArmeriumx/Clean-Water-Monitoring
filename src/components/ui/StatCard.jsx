import React from 'react';
import { Box, Text } from '@chakra-ui/react';

/**
 * Reusable stat card component for dashboard metrics
 * @param {string} value - The main value to display
 * @param {string} label - Description label below value
 * @param {string} borderColor - Left border accent color (e.g., "blue.500")
 * @param {string} valueColor - Value text color (e.g., "blue.600")
 * @param {function} onClick - Optional click handler
 */
function StatCard({ value, label, borderColor = 'blue.500', valueColor = 'blue.600', onClick }) {
  return (
    <Box
      flex="1"
      minW={{ base: '150px', md: '200px' }}
      p={4}
      bg="white"
      borderRadius="lg"
      boxShadow="sm"
      borderLeft="4px solid"
      borderColor={borderColor}
      textAlign="center"
      cursor={onClick ? 'pointer' : 'default'}
      transition="all 0.3s"
      _hover={{ transform: 'translateY(-5px)', boxShadow: 'md' }}
      onClick={onClick}
    >
      <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color={valueColor}>
        {value}
      </Text>
      <Text fontSize="sm" color="gray.600">
        {label}
      </Text>
    </Box>
  );
}

export default StatCard;
