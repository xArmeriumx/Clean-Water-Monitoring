import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';

/**
 * Reusable location card showing sensor data
 * @param {string} index - Display index number
 * @param {string} name - Location name
 * @param {string} lastUpdate - Last update timestamp
 * @param {object} sensors - Sensor data { ph, tds, turbidity, temp }
 * @param {boolean} highlighted - Whether to highlight the card
 * @param {function} onClick - Click handler
 */
function LocationCard({ index, name, lastUpdate, sensors = {}, highlighted = false, onClick }) {
  return (
    <Box
      bg={highlighted ? 'gray.100' : 'white'}
      borderRadius="lg"
      boxShadow="sm"
      p={{ base: 3, md: 4 }}
      mb={3}
      cursor="pointer"
      _hover={{ bg: 'gray.50', boxShadow: 'md' }}
      transition="all 0.3s"
      onClick={onClick}
    >
      <Flex
        justify="space-between"
        align="center"
        mb={3}
        flexWrap={{ base: 'wrap', md: 'nowrap' }}
      >
        <Flex align="center">
          <Text
            fontSize={{ base: 'lg', md: 'xl' }}
            fontWeight="bold"
            color="blue.500"
            mr={2}
          >
            {index}.
          </Text>
          <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="semibold" color="gray.800">
            {name}
          </Text>
        </Flex>
        <Text
          fontSize="sm"
          color="gray.500"
          mt={{ base: 2, md: 0 }}
          textAlign={{ base: 'left', md: 'right' }}
          w={{ base: '100%', md: 'auto' }}
        >
          อัปเดตล่าสุด: {lastUpdate}
        </Text>
      </Flex>

      <Flex
        bg="gray.50"
        borderRadius="md"
        p={{ base: 2, md: 3 }}
        justify="space-around"
        align="center"
        flexWrap={{ base: 'wrap', md: 'nowrap' }}
        gap={{ base: 2, md: 0 }}
      >
        <SensorValue label="ค่า pH" value={sensors.ph} />
        <SensorValue label="ค่า TDS/EC" value={sensors.tds} />
        <SensorValue label="ค่า Turbidity" value={sensors.turbidity} />
        <SensorValue label="ค่า Temp" value={sensors.temp} />
      </Flex>
    </Box>
  );
}

function SensorValue({ label, value }) {
  return (
    <Box textAlign="center" flex="1" minW={{ base: '80px', md: 'auto' }}>
      <Text fontSize="xs" color="gray.600" mb={1}>
        {label}
      </Text>
      <Text fontSize="md" fontWeight="bold" color="gray.800">
        {value ?? 'N/A'}
      </Text>
    </Box>
  );
}

export default LocationCard;
