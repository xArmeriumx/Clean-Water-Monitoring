import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Center,
  useToast,
  Skeleton,
  SkeletonText,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';

import { useQuery } from '@tanstack/react-query';
import Sidebar from '../../components/Sidebar';
import SidebarNav from '../../components/SidebarNav';
import { useAuth } from '../../auth/AuthContext';
import { apiGet } from '../../utils/api';

function hasValueChanged(current, previous) {
  return (
    current?.ph !== previous?.ph ||
    current?.tds !== previous?.tds ||
    current?.turbidity !== previous?.turbidity ||
    current?.temp !== previous?.temp
  );
}

async function fetchLocations() {
  const res = await apiGet('/api/locations?detail=full');

  if (!res.ok) {
    throw new Error('Failed to fetch locations');
  }

  return res.json();
}


async function fetchIssuesCount() {
  const res = await apiGet('/api/issues/total');
  if (!res.ok) {
    throw new Error('Failed to fetch issues count');
  }
  return res.json();
}

function Dashboard() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  // state สำหรับเก็บข้อมูลก่อนหน้า (ใช้เปรียบเทียบค่าที่เปลี่ยนแปลง)
  const [previousData, setPreviousData] = useState([]);
  // state สำหรับข้อความค้นหา
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();
  const navigate = useNavigate();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const firstLoad = useRef(true);

  const { user: authUser } = useAuth();

// ❌ ไม่ต้อง extract token แล้ว
// const token = authUser?.token;

  const {
    data: locationsData,
    isLoading: isLocLoading,
    isError: isLocError,
    error: locError,
  } = useQuery({
    queryKey: ['locations'],   // ❗ ไม่มี token แล้ว
    queryFn: fetchLocations,   // ❗ เรียกตรงๆ
    refetchInterval: 30000,
    staleTime: 10000,
    enabled: true,             // ❗ เปิดเลย เพราะ HttpOnly Token ผูกกับ Browser อยู่แล้ว
  });

  const {
    data: issuesData,
    isLoading: isIssuesLoading,
    isError: isIssuesError,
    error: issuesError,
  } = useQuery({
    queryKey: ['issuesCount'], // ❗ ไม่มี token แล้ว
    queryFn: fetchIssuesCount, // ❗ เรียกตรงๆ
    refetchInterval: 30000,
    staleTime: 10000,
    enabled: true,             // ❗ เปิดได้เลย
  });


  const loading = isLocLoading || isIssuesLoading;
  const error = isLocError || isIssuesError ? (locError || issuesError) : null;

  const formattedData = useMemo(() => {
    if (!locationsData) return [];
    return locationsData.map((loc) => {
      const s = loc.sensors || {};
      return {
        id: loc.id,
        location: loc.name,
        ph: s.ph ?? 'N/A',
        tds: s.tds ?? 'N/A',
        turbidity: s.turbidity ?? 'N/A',
        temp: s.temperature ?? 'N/A',
        lastUpdate: s.timestamp
          ? new Date(s.timestamp).toLocaleString('th-TH')
          : 'N/A',
      };
    });
  }, [locationsData]);

  // อัปเดต previousData ครั้งแรกเมื่อมี formattedData
  useEffect(() => {
    if (formattedData.length > 0) {
      setPreviousData((prev) => {
        if (prev.length === 0) {
          return formattedData;
        }
        return formattedData;
      });
    }
  }, [formattedData]);

  const issuesCount = issuesData?.total || 0;

  const toggleSidebar = () => setSidebarVisible((prev) => !prev);

  const handleRowClick = (id) => navigate(`/servicedetail/${id}`);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: String(error),
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  }, [error, toast]);

  // คัดกรองข้อมูลตามข้อความค้นหา (ค้นหาจากชื่อสถานที่)
  const filteredLocations = useMemo(() => {
    return formattedData.filter((item) =>
      item.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [formattedData, searchTerm]);

  if (loading) {
    return (
      <ChakraProvider>
        <Flex minH="100vh" bg="gray.50">
          {isMobile ? (
            <Drawer placement="left" onClose={toggleSidebar} isOpen={sidebarVisible}>
              <DrawerOverlay />
              <DrawerContent>
                <DrawerCloseButton />
                <DrawerHeader borderBottomWidth="1px">
                  <Flex align="center">
                    <Image src="logo.png" alt="Logo" boxSize="40px" mr="10px" />
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
          ) : (
            <Sidebar />
          )}

          <Box
            flex="1"
            ml={{ base: 0, md: '260px' }}
            pt={{ base: '60px', md: '80px' }}
            px={{ base: 4, md: 6 }}
            pb={6}
          >
            {/* Header Skeleton */}
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
              <Skeleton height="24px" width="150px" />
              <Flex flex="1" justify="center" mx={{ base: 2, md: 4 }}>
                <Skeleton height="40px" width={{ base: '100%', md: '400px' }} borderRadius="md" />
              </Flex>
              <Flex align="center" justify="flex-end" minW="fit-content">
                <Skeleton height="20px" width="100px" mr={2} display={{ base: 'none', md: 'block' }} />
                <Skeleton height="32px" width="32px" borderRadius="full" />
              </Flex>
            </Flex>

            {/* Cards Skeleton */}
            <Flex gap={4} mt={6} flexWrap="wrap">
              {Array(3).fill().map((_, i) => (
                <Box
                  key={i}
                  flex="1"
                  minW={{ base: '150px', md: '200px' }}
                  p={4}
                  bg="white"
                  borderRadius="lg"
                  boxShadow="sm"
                >
                  <Skeleton height="40px" width="60px" mx="auto" mb={2} />
                  <Skeleton height="16px" width="120px" mx="auto" />
                </Box>
              ))}
            </Flex>

            {/* Locations List Skeleton */}
            <Box mt={6}>
              <Skeleton height="24px" width="150px" mb={4} />
              {Array(3).fill().map((_, i) => (
                <Box
                  key={i}
                  bg="white"
                  borderRadius="lg"
                  boxShadow="sm"
                  p={{ base: 3, md: 4 }}
                  mb={3}
                >
                  <Flex justify="space-between" align="center" mb={3}>
                    <Flex align="center">
                      <Skeleton height="24px" width="20px" mr={2} />
                      <Skeleton height="24px" width="150px" />
                    </Flex>
                    <Skeleton height="16px" width="150px" />
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
                    {Array(4).fill().map((_, j) => (
                      <Box key={j} textAlign="center" flex="1" minW={{ base: '80px', md: 'auto' }}>
                        <Skeleton height="14px" width="50px" mb={1} mx="auto" />
                        <Skeleton height="20px" width="40px" mx="auto" />
                      </Box>
                    ))}
                  </Flex>
                </Box>
              ))}
            </Box>
          </Box>
        </Flex>
      </ChakraProvider>
    );
  }

  if (error) {
    return (
      <ChakraProvider>
        <Center minH="100vh" bg="gray.50">
          <Text color="red.500" fontSize="lg">เกิดข้อผิดพลาดในการโหลดข้อมูล</Text>
        </Center>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider>
      <Flex minH="100vh" bg="gray.50">
        {isMobile ? (
          <Drawer placement="left" onClose={toggleSidebar} isOpen={sidebarVisible}>
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton />
              <DrawerHeader borderBottomWidth="1px">
                <Flex align="center">
                  <Image
                    src="logo.png"
                    alt="Logo"
                    boxSize="40px"
                    mr="10px"
                  />
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
        ) : (
          <Sidebar />
        )}

        <Box
          flex="1"
          ml={{ base: 0, md: '260px' }}
          pt={{ base: '60px', md: '80px' }}
          px={{ base: 4, md: 6 }}
          pb={6}
        >
          {/* Header */}
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
            <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold" color="gray.700">
              Dashboard
            </Text>
            {/* ช่องค้นหาที่ถูกผูกกับ state searchTerm */}
            <Flex flex="1" justify="center" mx={{ base: 2, md: 4 }}>
              <Input
                placeholder="ค้นหา..."
                maxW={{ base: '100%', md: '400px' }}
                borderRadius="md"
                size="md"
                bg="gray.100"
                border="none"
                _focus={{ bg: 'white', border: '1px solid', borderColor: 'teal.500' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Flex>
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

          {/* Cards */}
          <Flex gap={4} mt={6} flexWrap="wrap">
            <Box
              flex="1"
              minW={{ base: '150px', md: '200px' }}
              p={4}
              bg="white"
              borderRadius="lg"
              boxShadow="sm"
              borderLeft="4px solid"
              borderColor="blue.500"
              textAlign="center"
              transition="all 0.3s"
              _hover={{ transform: 'translateY(-5px)', boxShadow: 'md' }}
            >
              <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color="blue.600">
                {filteredLocations.length}
              </Text>
              <Text fontSize="sm" color="gray.600">จุดให้บริการการตรวจวัด</Text>
            </Box>
            <Box
              flex="1"
              minW={{ base: '150px', md: '200px' }}
              p={4}
              bg="white"
              borderRadius="lg"
              boxShadow="sm"
              borderLeft="4px solid"
              borderColor="orange.500"
              textAlign="center"
              cursor="pointer"
              transition="all 0.3s"
              _hover={{ transform: 'translateY(-5px)', boxShadow: 'md' }}
              onClick={() => navigate('/adminissues')}
            >
              <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color="orange.600">
                {issuesCount}
              </Text>
              <Text fontSize="sm" color="gray.600">เรื่องแจ้งจากผู้ใช้</Text>
            </Box>
            <Box
              flex="1"
              minW={{ base: '150px', md: '200px' }}
              p={4}
              bg="white"
              borderRadius="lg"
              boxShadow="sm"
              borderLeft="4px solid"
              borderColor="purple.500"
              textAlign="center"
              transition="all 0.3s"
              _hover={{ transform: 'translateY(-5px)', boxShadow: 'md' }}
            >
              <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color="purple.600">
                12
              </Text>
              <Text fontSize="sm" color="gray.600">ผู้ใช้งานทั้งหมด</Text>
            </Box>
          </Flex>

          {/* Locations List */}
          <Box mt={6}>
            <Text fontSize="lg" fontWeight="bold" color="gray.800" mb={4}>
              จุดให้บริการ
            </Text>
            {filteredLocations.map((item, index) => {
              // ใช้ find เพื่อหา previousData ตาม id
              const prev = previousData.find(p => p.id === item.id);
              const rowChanged = prev ? hasValueChanged(item, prev) : false;

              return (
                <Box
                  key={item.id}
                  bg={rowChanged ? 'gray.100' : 'white'}
                  borderRadius="lg"
                  boxShadow="sm"
                  p={{ base: 3, md: 4 }}
                  mb={3}
                  cursor="pointer"
                  _hover={{ bg: 'gray.50', boxShadow: 'md' }}
                  transition="all 0.3s"
                  onClick={() => handleRowClick(item.id)}
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
                        {index + 1}.
                      </Text>
                      <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="semibold" color="gray.800">
                        {item.location}
                      </Text>
                    </Flex>
                    <Text
                      fontSize="sm"
                      color="gray.500"
                      mt={{ base: 2, md: 0 }}
                      textAlign={{ base: 'left', md: 'right' }}
                      w={{ base: '100%', md: 'auto' }}
                    >
                      อัปเดตล่าสุด: {item.lastUpdate}
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
                    <Box textAlign="center" flex="1" minW={{ base: '80px', md: 'auto' }}>
                      <Text fontSize="xs" color="gray.600" mb={1}>
                        ค่า pH
                      </Text>
                      <Text fontSize="md" fontWeight="bold" color="gray.800">
                        {item.ph}
                      </Text>
                    </Box>
                    <Box textAlign="center" flex="1" minW={{ base: '80px', md: 'auto' }}>
                      <Text fontSize="xs" color="gray.600" mb={1}>
                        ค่า TDS/EC
                      </Text>
                      <Text fontSize="md" fontWeight="bold" color="gray.800">
                        {item.tds}
                      </Text>
                    </Box>
                    <Box textAlign="center" flex="1" minW={{ base: '80px', md: 'auto' }}>
                      <Text fontSize="xs" color="gray.600" mb={1}>
                        ค่า Turbidity
                      </Text>
                      <Text fontSize="md" fontWeight="bold" color="gray.800">
                        {item.turbidity}
                      </Text>
                    </Box>
                    <Box textAlign="center" flex="1" minW={{ base: '80px', md: 'auto' }}>
                      <Text fontSize="xs" color="gray.600" mb={1}>
                        ค่า Temp
                      </Text>
                      <Text fontSize="md" fontWeight="bold" color="gray.800">
                        {item.temp}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Flex>
    </ChakraProvider>
  );
}

export default Dashboard;
