import React, { useState } from 'react';
import {
  ChakraProvider,
  Box,
  Flex,
  Text,
  Image,
  Input,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  useBreakpointValue,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import Sidebar from '../Sidebar';
import SidebarNav from '../SidebarNav';
import { useAuth } from '../../auth/AuthContext';

/**
 * Admin layout wrapper with sidebar, mobile drawer, and header
 * @param {string} title - Page title shown in header
 * @param {string} searchValue - Controlled search input value
 * @param {function} onSearchChange - Search input change handler
 * @param {boolean} showSearch - Whether to show search input (default: true)
 * @param {React.ReactNode} children - Page content
 */
function AdminLayout({ title, searchValue, onSearchChange, showSearch = true, children }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { user: authUser } = useAuth();

  const toggleSidebar = () => setSidebarVisible((prev) => !prev);

  return (
    <ChakraProvider>
      <Flex minH="100vh" bg="gray.50">
        {/* Sidebar - Desktop */}
        {!isMobile && <Sidebar />}

        {/* Sidebar - Mobile Drawer */}
        {isMobile && (
          <Drawer placement="left" onClose={toggleSidebar} isOpen={sidebarVisible}>
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton />
              <DrawerHeader borderBottomWidth="1px">
                <Flex align="center">
                  <Image src="/logo.png" alt="Logo" boxSize="40px" mr="10px" />
                  <Text fontSize="lg" color="blue.500" fontWeight="bold">
                    Clean Water Monitoring
                  </Text>
                </Flex>
              </DrawerHeader>
              <DrawerBody p={0}>
                <SidebarNav />
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        )}

        {/* Main Content */}
        <Box
          flex="1"
          ml={{ base: 0, md: '260px' }}
          pt={{ base: '60px', md: '80px' }}
          px={{ base: 4, md: 6 }}
          pb={6}
        >
          {/* Fixed Header */}
          <Flex
            position="fixed"
            top="0"
            left={{ base: '0', md: '260px' }}
            right="0"
            bg="white"
            p={{ base: 2, md: 3 }}
            align="center"
            boxShadow="sm"
            zIndex="1000"
            width={{ base: '100%', md: 'calc(100% - 260px)' }}
          >
            {/* Mobile Menu Button */}
            {isMobile && (
              <IconButton
                icon={sidebarVisible ? <CloseIcon /> : <HamburgerIcon />}
                variant="ghost"
                color="gray.700"
                size="lg"
                onClick={toggleSidebar}
                aria-label="Toggle Menu"
                mr={2}
                _hover={{ bg: 'gray.100' }}
              />
            )}

            {/* Title */}
            <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color="gray.700">
              {title}
            </Text>

            {/* Search Input */}
            {showSearch && (
              <Flex flex="1" justify="center" mx={{ base: 2, md: 4 }}>
                <Input
                  placeholder="ค้นหา..."
                  maxW={{ base: '100%', md: '400px' }}
                  borderRadius="md"
                  size="md"
                  bg="gray.100"
                  border="none"
                  _focus={{ bg: 'white', border: '1px solid', borderColor: 'teal.500' }}
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                />
              </Flex>
            )}

            {/* User Profile */}
            <Flex align="center" justify="flex-end" minW="fit-content">
              <Text
                mr={2}
                fontSize="sm"
                color="gray.600"
                display={{ base: 'none', md: 'block' }}
                isTruncated
                maxW={{ base: '100px', md: '150px' }}
              >
                {authUser?.profile?.displayName || 'Admin'}
              </Text>
              <Image
                src={authUser?.profile?.pictureUrl || 'https://via.placeholder.com/40'}
                alt="Profile"
                boxSize={{ base: '28px', md: '32px' }}
                borderRadius="full"
                border="2px solid"
                borderColor="teal.500"
              />
            </Flex>
          </Flex>

          {/* Page Content */}
          {children}
        </Box>
      </Flex>
    </ChakraProvider>
  );
}

export default AdminLayout;
