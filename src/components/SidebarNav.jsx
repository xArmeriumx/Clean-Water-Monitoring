// SidebarNav.js
import React from 'react';
import { Box, VStack, Text, useColorModeValue } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  FaTachometerAlt,
  FaFileAlt,
  FaMap,
  FaCog,
  FaExclamationTriangle,
  FaUpload,
  FaUsers,
  FaSignOutAlt,
} from 'react-icons/fa';

export default function SidebarNav() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // All possible menu items with their icons
  const allMenus = [
    { label: 'Dashboard', icon: FaTachometerAlt, to: '/' },
    { label: 'Report',    icon: FaFileAlt,       to: '/report' },
    { label: 'Mapping',   icon: FaMap,           to: '/mapping' },
    { label: 'Manage',    icon: FaCog,           to: '/manage' },
    { label: 'Issues',    icon: FaExclamationTriangle, to: '/adminissues' },
    { label: 'Labupload', icon: FaUpload,        to: '/labupload' },
    { label: 'Users Management',     icon: FaUsers,         to: '/usermanagement' },
    { label: 'Sign Out',  icon: FaSignOutAlt,    to: '/logout' },
  ];

  // If labstaff, only show these five
  const menus =
    user?.role === 'labstaff'
      ? allMenus.filter((m) =>
          ['Dashboard', 'Report', 'Mapping', 'Labupload', 'Sign Out'].includes(m.label)
        )
      : allMenus;

  // styling colors
  const activeBg = '#007bff';
  const activeColor = 'white';
  const inactiveColor = useColorModeValue('gray.600', 'gray.300');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');

  return (
    <Box w="full" bg={useColorModeValue('white', 'gray.800')} p={0}>
      <VStack spacing={2} align="stretch">
        {menus.map(({ label, icon: Icon, to }) => (
          <Box
            key={label}
            as="button"
            display="flex"
            alignItems="center"
            p={3}
            borderRadius="md"
            bg={label === 'Dashboard' ? activeBg : undefined}
            color={label === 'Dashboard' ? activeColor : inactiveColor}
            _hover={{
              bg: label === 'Dashboard' ? '#0056b3' : hoverBg,
              color: label === 'Dashboard' ? activeColor : 'blue.500',
            }}
            onClick={() => navigate(to)}
            cursor="pointer"
            fontWeight="medium"
            fontSize={{ base: 'sm', md: 'md' }}
          >
            {Icon && <Icon style={{ marginRight: 8, fontSize: '1.1em' }} />}
            <Text>{label}</Text>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
