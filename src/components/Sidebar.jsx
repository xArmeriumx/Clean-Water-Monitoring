import React from 'react';
import { Box, Flex, Heading, Image, IconButton, Drawer, DrawerBody, DrawerOverlay, DrawerContent, DrawerCloseButton, useDisclosure, VStack, Text, Icon, useBreakpointValue } from '@chakra-ui/react';
import SidebarNav from './SidebarNav';
import { FiMenu } from 'react-icons/fi'; // Hamburger menu icon
import { FaDroplet } from 'react-icons/fa6'; // Icon for decoration

export default function Sidebar() {
  const logoUrl = '/logo.png'; // ปรับตามที่คุณมี

  // Use Disclosure for Drawer (mobile sidebar)
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Check if it's desktop for hover effects
  const isDesktop = useBreakpointValue({ base: false, md: true });

  return (
    <>
      {/* Hamburger Menu Button for Mobile (visible on small screens) */}
      <IconButton
        icon={<FiMenu />}
        aria-label="Open Sidebar"
        variant="ghost"
        color="blue.300" // ปรับเป็นฟ้าอ่อน
        display={{ base: 'block', md: 'none' }} // แสดงเฉพาะบน mobile (base < md)
        onClick={onOpen}
        position="fixed"
        top="10px"
        left="10px"
        zIndex={1000} // อยู่เหนือเนื้อหาอื่น
      />

      {/* Sidebar for Desktop and Drawer for Mobile */}
      <Box
        w={{ base: 'full', md: '260px' }} // Full width on mobile, 260px on desktop
        bg="white" // เปลี่ยนเป็นสีขาว
        boxShadow="sm" // ใช้เงา sm
        p={{ base: '10px', md: '20px' }} // ลด padding บน mobile
        position={{ base: 'fixed', md: 'fixed' }} // Fixed on both, but managed differently
        top="0"
        left={{ base: isOpen ? '0' : '-100%', md: '0' }} // Slide in/out on mobile
        h="100vh"
        overflowY="auto"
        transition="all 0.3s ease-in-out" // เพิ่มการเปลี่ยนแปลงลื่นไหล
        zIndex={{ base: 999, md: 'auto' }} // Z-index สูงสำหรับ mobile
        transform={{ base: isOpen ? 'translateX(0)' : 'translateX(-100%)', md: 'none' }} // Slide animation on mobile
      >
        {/* Close Button for Mobile (inside Drawer) */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
          <DrawerOverlay />
          <DrawerContent
            bg="white" // เปลี่ยนเป็นสีขาว
            boxShadow="sm" // ใช้เงา sm
          >
            <DrawerCloseButton />
            <DrawerBody p="20px">
              {/* Header (Logo + Title) */}
              <Flex align="center" mb="20px" position="relative">
                {/* เพิ่มไอคอนหยดน้ำเป็นพื้นหลังตกแต่ง */}
                <Icon
                  as={FaDroplet}
                  position="absolute"
                  top="50%"
                  left="30%"
                  transform="translateY(-50%)"
                  w="80px"
                  h="80px"
                  color="blue.100" // ปรับเป็นฟ้าอ่อนลง
                  opacity={0.2}
                  zIndex={0}
                />
                <Image
                  src={logoUrl}
                  alt="Logo"
                  boxSize="40px"
                  borderRadius="full"
                  border="2px solid"
                  borderColor="blue.200" // ปรับเป็นฟ้าอ่อนลง
                  _hover={{
                    transform: isDesktop ? 'scale(1.1)' : 'none', // เพิ่มการขยายเมื่อ hover (เฉพาะ desktop)
                    transition: 'transform 0.3s',
                  }}
                  mr="10px" // รักษา mr="10px" เหมือนโค้ดเดิม
                  zIndex={1}
                />
                <VStack align="start" spacing={0} zIndex={1}>
                  <Heading
                    as="h2"
                    fontSize={{ base: '16px', md: '20px' }} // เพิ่มขนาดบน desktop
                    fontWeight="bold"
                    mb="0"
                    bgGradient="linear(to-r, blue.400, blue.300)" // ปรับเป็นโทนฟ้าอ่อน
                    bgClip="text"
                    lineHeight="normal"
                    _hover={{ bgGradient: 'linear(to-r, blue.300, blue.200)' }} // ปรับ hover ให้อ่อนลง
                    transition="background 0.2s"
                  >
                    Clean Water Monitoring
                  </Heading>
                  <Text
                    fontSize={{ base: 'xs', md: 'sm' }}
                    color="blue.400" // ปรับเป็นฟ้าอ่อน
                    fontWeight="medium"
                  >
                    IoT for Clean Water
                  </Text>
                </VStack>
              </Flex>

              {/* Sidebar Navigation */}
              <SidebarNav />
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Desktop Sidebar (visible on md and up) */}
        <Flex
          display={{ base: 'none', md: 'flex' }} // ซ่อนบน mobile, แสดงบน desktop
          flexDir="column"
          h="full"
        >
          {/* Header (Logo + Title) */}
          <Flex align="center" mb="20px" position="relative">
            {/* เพิ่มไอคอนหยดน้ำเป็นพื้นหลังตกแต่ง */}
            <Icon
              as={FaDroplet}
              position="absolute"
              top="50%"
              left="30%"
              transform="translateY(-50%)"
              w="80px"
              h="80px"
              color="blue.100" // ปรับเป็นฟ้าอ่อนลง
              opacity={0.2}
              zIndex={0}
            />
            <Image
              src={logoUrl}
              alt="Logo"
              boxSize="40px"
              borderRadius="full"
              border="2px solid"
              borderColor="blue.200" // ปรับเป็นฟ้าอ่อนลง
              _hover={{
                transform: isDesktop ? 'scale(1.1)' : 'none', // เพิ่มการขยายเมื่อ hover (เฉพาะ desktop)
                transition: 'transform 0.3s',
              }}
              mr="10px"
              zIndex={1}
            />
            <VStack align="start" spacing={0} zIndex={1}>
              <Heading
                as="h2"
                fontSize="25 px" // เพิ่มขนาดบน desktop
                fontWeight="bold"
                mb="0"
                bgGradient="linear(to-r, blue.400, blue.300)" // ปรับเป็นโทนฟ้าอ่อน
                bgClip="text"
                lineHeight="normal"
                _hover={{ bgGradient: 'linear(to-r, blue.300, blue.200)' }} // ปรับ hover ให้อ่อนลง
                transition="background 0.2s"
              >
                Clean Water Monitoring
              </Heading>
              <Text
                fontSize="sm"
                color="blue.400" // ปรับเป็นฟ้าอ่อน
                fontWeight="medium"
              >
                IoT Monitoring Project
              </Text>
            </VStack>
          </Flex>

          {/* Sidebar Navigation */}
          <SidebarNav />
        </Flex>
      </Box>
    </>
  );
}
