import React from 'react';
import { Box, Flex, Skeleton, SimpleGrid, VStack, Heading, Button } from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';

/**
 * Skeleton loading for AdminIssues page
 */
function AdminIssuesSkeleton() {
  return (
    <Box maxW="1200px" mx="auto" p={{ base: 3, md: 6 }} bg="gray.50" minH="100vh">
      {/* Header Skeleton */}
      <Flex align="center" justify="space-between" mb={4}>
        <Flex align="center" flex="1">
          <Skeleton height="40px" width="40px" borderRadius="md" mr={2} />
          <Skeleton height="32px" width="300px" />
        </Flex>
      </Flex>

      {/* Stat Cards Skeleton */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
        {[1, 2].map((i) => (
          <Box key={i} p={4} bg="white" borderRadius="lg" boxShadow="sm">
            <Skeleton height="20px" width="150px" mb={2} />
            <Skeleton height="40px" width="80px" />
          </Box>
        ))}
      </SimpleGrid>

      {/* Layout Skeleton */}
      <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
        {/* Sidebar Skeleton */}
        <Box
          width={{ base: '100%', md: '300px' }}
          bg="white"
          p={4}
          borderRadius="lg"
          boxShadow="sm"
        >
          <Heading as="h2" size="sm" mb={3} color="blue.600">
            รายชื่อสถานที่
          </Heading>
          <VStack align="stretch" spacing={3}>
            {[1, 2, 3, 4].map((i) => (
              <Box key={i} p={3} bg="gray.50" borderRadius="md" boxShadow="sm">
                <Skeleton height="20px" width="150px" />
              </Box>
            ))}
          </VStack>
          <Button mt={4} leftIcon={<RepeatIcon />} colorScheme="blue" size="sm" isDisabled>
            รีเฟรชทั้งหมด
          </Button>
        </Box>

        {/* Main Content Skeleton */}
        <Box flex="1" bg="white" p={4} borderRadius="lg" boxShadow="sm">
          <Flex align="center" justify="space-between" mb={4}>
            <Skeleton height="20px" width="200px" />
            <Skeleton height="32px" width="80px" />
          </Flex>
          <Flex mb={4} gap={3}>
            <Skeleton height="40px" flex="1" borderRadius="md" />
            <Skeleton height="40px" width="200px" borderRadius="md" />
          </Flex>
          {[1, 2, 3].map((i) => (
            <Box key={i} p={3} bg="white" borderRadius="md" boxShadow="sm" mb={3}>
              <Flex direction={{ base: 'column', md: 'row' }} gap={3} align="center">
                <Skeleton height="100px" width="120px" borderRadius="md" />
                <Box flex="1">
                  <Skeleton height="20px" width="70%" mb={2} />
                  <Skeleton height="16px" width="90%" />
                </Box>
              </Flex>
            </Box>
          ))}
        </Box>
      </Flex>
    </Box>
  );
}

export default AdminIssuesSkeleton;
