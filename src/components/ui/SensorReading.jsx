import React from 'react';
import { Box, Text, Badge } from '@chakra-ui/react';

/**
 * Get water quality status based on sensor value
 * @param {string} label - Sensor label (pH, TDS, Turbidity, Temperature)
 * @param {number} value - Sensor value
 * @returns {object} { status: string, color: string }
 */
export function getWaterQualityStatus(label, value) {
  if (value === undefined || value === null || value === 'N/A') {
    return { status: 'ไม่มีข้อมูล', color: 'gray' };
  }

  const numValue = parseFloat(value);
  
  switch (label.toLowerCase()) {
    case 'ph':
      if (numValue >= 6.5 && numValue <= 8.5) return { status: 'ปกติ', color: 'green' };
      if (numValue < 6.5) return { status: 'เป็นกรด', color: 'red' };
      return { status: 'เป็นด่าง', color: 'orange' };
    
    case 'tds':
      if (numValue <= 500) return { status: 'ดี', color: 'green' };
      if (numValue <= 1000) return { status: 'ปานกลาง', color: 'yellow' };
      return { status: 'สูง', color: 'red' };
    
    case 'turbidity':
      if (numValue <= 5) return { status: 'ใส', color: 'green' };
      if (numValue <= 10) return { status: 'ขุ่นเล็กน้อย', color: 'yellow' };
      return { status: 'ขุ่น', color: 'red' };
    
    case 'temperature':
      if (numValue >= 20 && numValue <= 30) return { status: 'ปกติ', color: 'green' };
      if (numValue < 20) return { status: 'เย็น', color: 'blue' };
      return { status: 'ร้อน', color: 'orange' };
    
    default:
      return { status: '-', color: 'gray' };
  }
}

/**
 * Sensor reading display component
 * @param {string} label - Sensor label
 * @param {number|string} value - Sensor value
 * @param {string} unit - Unit of measurement
 * @param {boolean} showStatus - Whether to show quality status badge
 */
function SensorReading({ label, value, unit = '', showStatus = false }) {
  const displayValue = value ?? 'N/A';
  const quality = getWaterQualityStatus(label, value);

  return (
    <Box
      p={3}
      bg="gray.50"
      borderRadius="md"
      textAlign="center"
      minW="80px"
    >
      <Text fontSize="xs" color="gray.600" mb={1}>
        {label}
      </Text>
      <Text fontSize="lg" fontWeight="bold" color="gray.800">
        {displayValue}
        {unit && <Text as="span" fontSize="xs" color="gray.500" ml={1}>{unit}</Text>}
      </Text>
      {showStatus && value !== 'N/A' && value !== undefined && (
        <Badge colorScheme={quality.color} mt={1} fontSize="xs">
          {quality.status}
        </Badge>
      )}
    </Box>
  );
}

export default SensorReading;
