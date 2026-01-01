import React, { useState, useEffect } from 'react';
import { apiGet, apiDelete } from '../../utils/api';
import {
  Box,
  Heading,
  Text,
  Center,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  Button,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  useToast,
  Badge,
  VStack,
  HStack,
  Input,
  Select,
  useColorModeValue,
  useBreakpointValue,
  Image as ChakraImage,
} from '@chakra-ui/react';
import {
  ArrowBackIcon,
  RepeatIcon,
  CheckCircleIcon,
  WarningIcon,
} from '@chakra-ui/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { motion } from 'framer-motion';

// Reusable Components
import { ConfirmDialog, AdminIssuesSkeleton } from '../../components/ui';

const MotionBox = motion(Box);



// ฟังก์ชันดึงข้อมูลสถานที่และ Issue
async function fetchAllData({ queryKey }) {
  const [_key, token] = queryKey;
  let allIssuesCount = 0;
  const res = await apiGet('/api/locations');
  if (!res.ok) throw new Error('Failed to fetch locations');
  const allLocs = await res.json();

  const locationsWithIssues = await Promise.all(
    allLocs.map(async (loc) => {
      const issuesRes = await apiGet(`/api/locations/${loc.id}/issues`);
      if (!issuesRes.ok) throw new Error('Failed to fetch issues');
      const issues = await issuesRes.json();
      allIssuesCount += issues.length;
      return { ...loc, issues };
    })
  );

  return {
    locations: locationsWithIssues,
    totalIssues: allIssuesCount,
  };
}

async function fetchIssuesByLocation({ locId, token }) {
  const issuesRes = await apiGet(`/api/locations/${locId}/issues`);
  if (!issuesRes.ok) {
    const errText = await issuesRes.text();
    throw new Error(`Failed to fetch issues: ${errText}`);
  }
  return issuesRes.json();
}

function AdminIssues() {
  const [searchParams] = useSearchParams();
  const locationIdQuery = searchParams.get('locationId'); // เก็บไว้สำหรับรองรับ query parameter (ถ้ามี)
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const token = user?.token || '';
  const queryClient = useQueryClient();
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const headingSize = useBreakpointValue({ base: 'md', md: 'xl' });
  const textSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const badgeSize = useBreakpointValue({ base: 'xs', md: 'sm' });
  const buttonSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const statNumberSize = useBreakpointValue({ base: 'xl', md: '2xl' });

  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [confirmIssue, setConfirmIssue] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // State สำหรับการเลือกสถานที่ใน Sidebar
  const [selectedLocationId, setSelectedLocationId] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminIssues', token],
    queryFn: fetchAllData,
    refetchOnWindowFocus: false,
  });

  const locations = data?.locations || [];
  const totalIssues = data?.totalIssues || 0;

  // เมื่อโหลดข้อมูลเสร็จแล้ว ถ้ายังไม่มีสถานที่ที่เลือก ให้ตั้งค่าเป็นสถานที่แรก
  useEffect(() => {
    if (!selectedLocationId && locations.length > 0) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId]);

  // Mutation สำหรับตั้งสถานะ Issue เป็นสำเร็จ (ลบ Issue)
  const deleteIssueMutation = useMutation({
    mutationFn: async ({ locId, issueKey }) => {
      const res = await apiDelete(`/api/locations/${locId}/issues/${issueKey}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to remove issue: ${errorText || res.statusText}`);
      }
      return { locId, issueKey };
    },
    onSuccess: ({ locId, issueKey }) => {
      queryClient.setQueryData(['adminIssues', token], (oldData) => {
        if (!oldData) return oldData;
        const newLocations = oldData.locations.map((loc) => {
          if (loc.id === locId) {
            return { ...loc, issues: loc.issues.filter((issue) => issue.issueKey !== issueKey) };
          }
          return loc;
        });
        return { ...oldData, locations: newLocations, totalIssues: oldData.totalIssues - 1 };
      });
      toast({
        title: 'สำเร็จ',
        description: 'ตั้งสถานะปัญหาเป็นสำเร็จแล้ว',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      onDetailClose();
      onConfirmClose();
    },
    onError: (err) => {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: `ไม่สามารถลบปัญหาได้: ${err.message}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    },
  });

  // ฟังก์ชัน refresh ข้อมูลทั้งหมดและ refresh เฉพาะสถานที่ที่เลือก
  const refreshAllIssues = async () => {
    try {
      const newLocations = await Promise.all(
        locations.map(async (loc) => {
          const newIssues = await fetchIssuesByLocation({ locId: loc.id, token });
          return { ...loc, issues: newIssues };
        })
      );
      const newTotalIssues = newLocations.reduce((total, loc) => total + (loc.issues?.length || 0), 0);
      queryClient.setQueryData(['adminIssues', token], {
        locations: newLocations,
        totalIssues: newTotalIssues,
      });
      toast({
        title: 'สำเร็จ',
        description: 'รีเฟรชข้อมูลทั้งหมดแล้ว',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: `ไม่สามารถรีเฟรชข้อมูลได้: ${err.message}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const refreshIssuesForLocation = async (locId) => {
    try {
      const newIssues = await fetchIssuesByLocation({ locId, token });
      queryClient.setQueryData(['adminIssues', token], (oldData) => {
        if (!oldData) return oldData;
        let oldTotal = oldData.totalIssues;
        const newLocations = oldData.locations.map((loc) => {
          if (loc.id === locId) {
            oldTotal = oldTotal - (loc.issues?.length || 0) + newIssues.length;
            return { ...loc, issues: newIssues };
          }
          return loc;
        });
        return { ...oldData, locations: newLocations, totalIssues: oldTotal };
      });
      toast({
        title: 'สำเร็จ',
        description: 'รีเฟรชข้อมูลเรียบร้อย',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: `ไม่สามารถรีเฟรชข้อมูลได้: ${err.message}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleIssueDone = (locId, issueKey) => {
    if (!locId || !issueKey || !token) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ข้อมูลไม่ครบถ้วนหรือไม่มี token',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setConfirmIssue({ locId, issueKey });
    onConfirmOpen();
  };

  const confirmIssueDone = () => {
    if (confirmIssue) {
      deleteIssueMutation.mutate({ locId: confirmIssue.locId, issueKey: confirmIssue.issueKey });
    }
  };

  const handleImageClick = (imgUrl) => {
    setSelectedImage(imgUrl);
    onImageOpen();
  };

  const handleDetailClick = (issue, locId) => {
    setSelectedIssue({ ...issue, locationId: locId });
    onDetailOpen();
  };

  // ฟังก์ชันกรองรายการ Issue ตามค้นหาและสถานะ
  const filteredIssues = (issues) => {
    return issues?.filter((issue) => {
      const matchesSearch = issue.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            issue.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
      return matchesSearch && matchesStatus;
    }) || [];
  };

  if (isLoading) {
    return <AdminIssuesSkeleton />;
  }
  if (error) {
    return (
      <Center minH="100vh" bg="gray.50">
        <Text color="red.500" fontSize={textSize}>
          {error.message || 'ไม่สามารถโหลดข้อมูลได้'}
        </Text>
      </Center>
    );
  }
  if (!locations.length) {
    return (
      <Center minH="100vh" bg="gray.50">
        <Text color="red.500" fontSize={textSize}>
          ไม่มีข้อมูลสถานที่
        </Text>
      </Center>
    );
  }

  const selectedLocation = locations.find((loc) => loc.id === selectedLocationId);

  return (
    <Box maxW="1200px" mx="auto" p={{ base: 3, md: 6 }} bg="gray.50" minH="100vh">
      {/* Header */}
      <Flex align="center" mb={4} justify="space-between">
        <Flex align="center" flex="1">
          <IconButton
            icon={<ArrowBackIcon />}
            variant="ghost"
            color="gray.700"
            size={buttonSize}
            onClick={() => navigate(-1)}
            aria-label="Go Back"
            _hover={{ bg: 'gray.200' }}
            mr={2}
          />
          <Heading as="h1" size={headingSize} color="gray.800">
            ระบบจัดการการแจ้งปัญหา (Admin)
          </Heading>
        </Flex>
      </Flex>

      {/* Stat Cards */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
        <Stat p={4} bg="white" borderRadius="lg" boxShadow="sm" borderLeft="4px solid" borderColor="blue.500">
          <StatLabel fontSize={textSize} color="gray.600">จำนวนสถานที่ทั้งหมด</StatLabel>
          <StatNumber fontSize={statNumberSize} color="blue.600">{locations.length}</StatNumber>
        </Stat>
        <Stat p={4} bg="white" borderRadius="lg" boxShadow="sm" borderLeft="4px solid" borderColor="orange.500">
          <StatLabel fontSize={textSize} color="gray.600">จำนวนเรื่องแจ้งทั้งหมด</StatLabel>
          <StatNumber fontSize={statNumberSize} color="orange.600">{totalIssues}</StatNumber>
        </Stat>
      </SimpleGrid>

      {/* Layout 2 คอลัมน์ */}
      <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
        {/* Sidebar: รายชื่อสถานที่ */}
        <Box
          width={{ base: '100%', md: '300px' }}
          bg="white"
          p={4}
          borderRadius="lg"
          boxShadow="sm"
          borderRight="1px solid"
          borderColor="gray.200"
        >
          <Heading as="h2" size="sm" mb={3} color="blue.600">
            รายชื่อสถานที่
          </Heading>
          <VStack align="stretch" spacing={3}>
            {locations.map((loc) => {
              const issueCount = loc.issues?.length || 0;
              return (
                <Box
                  key={loc.id}
                  p={3}
                  bg={selectedLocation && selectedLocation.id === loc.id ? 'blue.50' : 'gray.50'}
                  borderRadius="md"
                  boxShadow="sm"
                  cursor="pointer"
                  onClick={() => setSelectedLocationId(loc.id)}
                  _hover={{ bg: 'blue.100' }}
                >
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="semibold" color="blue.700">{loc.name}</Text>
                    {issueCount > 0 && (
                      <Badge colorScheme="red" borderRadius="full" px={2}>
                        {issueCount}
                      </Badge>
                    )}
                  </Flex>
                </Box>
              );
            })}
          </VStack>
          <Button mt={4} leftIcon={<RepeatIcon />} colorScheme="blue" size={buttonSize} onClick={refreshAllIssues}>
            รีเฟรชทั้งหมด
          </Button>
        </Box>
        {/* Main Content: แสดง Issue ของสถานที่ที่เลือก */}
        <Box flex="1" bg="white" p={4} borderRadius="lg" boxShadow="sm">
          {selectedLocation ? (
            <>
              <Flex align="center" justify="space-between" mb={4}>
                <HStack spacing={3}>
                  <Text fontWeight="bold" color="blue.600">{selectedLocation.name}</Text>
                  <Badge colorScheme="red">{selectedLocation.issues?.length || 0} เรื่องแจ้ง</Badge>
                </HStack>
                <Button
                  leftIcon={<RepeatIcon />}
                  colorScheme="blue"
                  size={buttonSize}
                  onClick={() => refreshIssuesForLocation(selectedLocation.id)}
                >
                  รีเฟรช
                </Button>
              </Flex>
              <Flex mb={4} gap={3}>
                <Input
                  placeholder="ค้นหาเรื่องแจ้ง (หัวข้อหรือรายละเอียด)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg="white"
                  borderRadius="md"
                  fontSize={textSize}
                  _focus={{ borderColor: 'blue.500' }}
                />
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  bg="white"
                  borderRadius="md"
                  fontSize={textSize}
                  _focus={{ borderColor: 'blue.500' }}
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="pending">รอแก้ไข</option>
                  <option value="resolved">สำเร็จ</option>
                </Select>
              </Flex>
              {filteredIssues(selectedLocation.issues).length > 0 ? (
                <VStack spacing={3} align="stretch" overflowY="auto">
                  {filteredIssues(selectedLocation.issues).map((issue) => (
                    <Box
                      key={issue.issueKey}
                      p={3}
                      bg="white"
                      borderRadius="md"
                      boxShadow="sm"
                      _hover={{ bg: 'gray.50', boxShadow: 'md' }}
                      onClick={() => handleDetailClick(issue, selectedLocation.id)}
                      cursor="pointer"
                    >
                      <Flex direction={{ base: 'column', md: 'row' }} gap={3} align="center">
                        {issue.imageUrl && (
                          <ChakraImage
                            src={issue.imageUrl}
                            alt="Issue"
                            maxW={{ base: '80px', md: '120px' }}
                            maxH={{ base: '80px', md: '100px' }}
                            objectFit="cover"
                            borderRadius="md"
                            border="1px solid"
                            borderColor="gray.200"
                          />
                        )}
                        <Box flex="1">
                          <Flex align="center" mb={1} flexWrap="wrap" gap={2}>
                            <WarningIcon color="orange.400" mr={2} />
                            <Text fontWeight="bold" fontSize={textSize} color="blue.600">
                              {issue.subject || '-'}
                            </Text>
                            {issue.status === 'pending' && (
                              <Badge colorScheme="orange" fontSize={badgeSize}>รอแก้ไข</Badge>
                            )}
                          </Flex>
                          <Text fontSize={textSize} color="gray.600" noOfLines={2}>
                            {issue.description || '-'}
                          </Text>
                          <Text fontSize={badgeSize} color="gray.500" mt={1}>
                            เวลา: {issue.timestamp ? new Date(issue.timestamp).toLocaleString('th-TH') : '-'}
                          </Text>
                        </Box>
                        <Button
                          size={buttonSize}
                          colorScheme="blue"
                          leftIcon={<CheckCircleIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIssueDone(selectedLocation.id, issue.issueKey);
                          }}
                          isDisabled={deleteIssueMutation.isLoading}
                          isLoading={deleteIssueMutation.isLoading}
                        >
                          สำเร็จ
                        </Button>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Center>
                  <Text color="gray.500" fontSize={textSize} p={2}>
                    ไม่มีเรื่องแจ้งในสถานที่นี้
                  </Text>
                </Center>
              )}
            </>
          ) : (
            <Center>
              <Text color="gray.500" fontSize={textSize}>
                กรุณาเลือกสถานที่จากด้านซ้าย
              </Text>
            </Center>
          )}
        </Box>
      </Flex>

      {/* Modal สำหรับแสดงรูปภาพ */}
      <Modal isOpen={isImageOpen} onClose={onImageClose} isCentered size={{ base: 'full', md: '4xl' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent
          maxW={{ base: '100%', md: '900px' }}
          maxH={{ base: '100vh', md: '90vh' }}
          borderRadius="lg"
          bg={bgColor}
        >
          <ModalHeader fontSize={textSize} color="blue.600" py={3}>
            แสดงรูปภาพ
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody display="flex" justifyContent="center" alignItems="center">
            {selectedImage && (
              <ChakraImage
                src={selectedImage}
                alt="Preview"
                maxW="100%"
                maxH={{ base: 'calc(100vh - 150px)', md: '70vh' }}
                objectFit="contain"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button size={buttonSize} onClick={onImageClose} colorScheme="blue" px={{ base: 4, md: 6 }}>
              ปิด
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal สำหรับแสดงรายละเอียด Issue */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} isCentered size={{ base: 'full', md: 'xl' }} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxW={{ base: '100%', md: '700px' }} borderRadius="lg" bg={bgColor}>
          <ModalHeader fontSize={textSize} color="blue.600" py={3}>
            รายละเอียดการแจ้งปัญหา
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p={4}>
            {selectedIssue && (
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontWeight="semibold" color="gray.700" fontSize={textSize}>
                    หัวข้อ:
                  </Text>
                  <Text color={textColor} fontSize={textSize}>
                    {selectedIssue.subject || '-'}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold" color="gray.700" fontSize={textSize}>
                    รายละเอียด:
                  </Text>
                  <Text color={textColor} whiteSpace="pre-wrap" fontSize={textSize}>
                    {selectedIssue.description || '-'}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold" color="gray.700" fontSize={textSize}>
                    เวลา:
                  </Text>
                  <Text color={textColor} fontSize={textSize}>
                    {selectedIssue.timestamp ? new Date(selectedIssue.timestamp).toLocaleString('th-TH') : '-'}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold" color="gray.700" fontSize={textSize}>
                    Issue ID:
                  </Text>
                  <Text color={textColor} fontSize={textSize}>
                    {selectedIssue.issueId || '-'}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold" color="gray.700" fontSize={textSize}>
                    ผู้แจ้ง:
                  </Text>
                  <Text color={textColor} fontSize={textSize}>
                    {selectedIssue.reporterName || '-'}{' '}
                    {selectedIssue.reporterId ? `(ID: ${selectedIssue.reporterId})` : ''}
                  </Text>
                </Box>
                {selectedIssue.imageUrl && (
                  <Box>
                    <Text fontWeight="semibold" color="gray.700" mb={2} fontSize={textSize}>
                      รูปภาพ:
                    </Text>
                    <ChakraImage
                      src={selectedIssue.imageUrl}
                      alt="Issue"
                      maxW="100%"
                      maxH={{ base: '200px', md: '350px' }}
                      objectFit="contain"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="gray.200"
                      cursor="pointer"
                      onClick={() => {
                        setSelectedImage(selectedIssue.imageUrl);
                        onDetailClose();
                        onImageOpen();
                      }}
                    />
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter gap={3}>
            {selectedIssue && (
              <Button
                size={buttonSize}
                colorScheme="blue"
                leftIcon={<CheckCircleIcon />}
                onClick={() => handleIssueDone(selectedIssue.locationId, selectedIssue.issueKey)}
                isDisabled={deleteIssueMutation.isLoading}
                isLoading={deleteIssueMutation.isLoading}
                px={{ base: 4, md: 6 }}
              >
                สำเร็จ
              </Button>
            )}
            <Button size={buttonSize} onClick={onDetailClose} colorScheme="gray" variant="outline" px={{ base: 4, md: 6 }}>
              ปิด
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={onConfirmClose}
        onConfirm={confirmIssueDone}
        title="ยืนยันการดำเนินการ"
        message='คุณต้องการตั้งสถานะปัญหานี้เป็น "สำเร็จ" หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้'
        confirmText="ยืนยัน"
        cancelText="ยกเลิก"
        isLoading={deleteIssueMutation.isLoading}
      />
    </Box>
  );
}

export default AdminIssues;
