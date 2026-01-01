import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiGet, apiPost, apiDelete, apiFetch } from '../../utils/api';
import {
  Box,
  Flex,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogContent,
  IconButton,
  useBreakpointValue,
  useToast,
  Skeleton,
  Select,
  RadioGroup,
  Radio,
  Stack,
} from '@chakra-ui/react';
import { ArrowBackIcon, EditIcon, DeleteIcon, RepeatIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

// ------ แผนที่ ------
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

// ------ เพิ่ม Component สำหรับเลือกพิกัด ------
function LocationSelector({ currentLocation, setCurrentLocation }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setCurrentLocation({
        ...currentLocation,
        coordinates: `${lat.toFixed(6)},${lng.toFixed(6)}`,
      });
    },
  });
  return null;
}

function Manage() {
  const navigate = useNavigate();
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { user } = useAuth();
  const token = user?.token || '';

  const [locations, setLocations] = useState([]);
  const [unlinkedDevices, setUnlinkedDevices] = useState([]);
  const [currentLocation, setCurrentLocation] = useState({ id: null, name: '', coordinates: '', deviceID: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeviceLoading, setIsDeviceLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [deviceInputMethod, setDeviceInputMethod] = useState('dropdown');
  const [manualDeviceID, setManualDeviceID] = useState('');

  const { isOpen: isLocationModalOpen, onOpen: onOpenLocationModal, onClose: onCloseLocationModal } = useDisclosure();
  const { isOpen: isDeleteDialogOpen, onOpen: onOpenDeleteDialog, onClose: onCloseDeleteDialog } = useDisclosure();
  const { isOpen: isCsvModalOpen, onOpen: onOpenCsvModal, onClose: onCloseCsvModal } = useDisclosure();

  const [locationToDelete, setLocationToDelete] = useState(null);
  const cancelRef = useRef();

  const fetchLocations = useCallback(async () => {
    try {
      const res = await apiGet('/api/locations?includeClientID=true');

      if (!res.ok) {
        throw new Error('ไม่สามารถดึงข้อมูลสถานที่ได้');
      }

      const data = await res.json();
      setLocations(data);
    } catch (error) {
      console.error('Fetch locations error:', error.message);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถดึงข้อมูลสถานที่ได้',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  }, [toast]);

  const fetchUnlinkedDevices = useCallback(async () => {
    try {
      setIsDeviceLoading(true);

      const res = await apiGet('/api/devices/unlinked');

      if (!res.ok) {
        throw new Error('ไม่สามารถดึงข้อมูลอุปกรณ์ที่ยังไม่เชื่อมโยงได้');
      }

      const data = await res.json();
      setUnlinkedDevices(data || []);
    } catch (error) {
      console.error('Fetch unlinked devices error:', error.message);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถดึงข้อมูลอุปกรณ์ที่ยังไม่เชื่อมโยงได้',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      setUnlinkedDevices([]);
    } finally {
      setIsDeviceLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const loadData = async () => {
      setIsPageLoading(true);
      try {
        await fetchLocations();
      } finally {
        setIsPageLoading(false);
      }
    };
    loadData();
  }, [fetchLocations]);

  const openAddLocationModal = useCallback(() => {
    setCurrentLocation({ id: null, name: '', coordinates: '', deviceID: '' });
    setSelectedFile(null);
    setDeviceInputMethod('dropdown');
    setManualDeviceID('');
    setUnlinkedDevices([]);
    onOpenLocationModal();
  }, [onOpenLocationModal]);

  const handleLocationEdit = useCallback((location) => {
    setCurrentLocation(location);
    setSelectedFile(null);
    if (location.deviceID) {
      setDeviceInputMethod('dropdown');
      setManualDeviceID(location.deviceID);
    } else {
      setDeviceInputMethod('dropdown');
      setManualDeviceID('');
    }
    setUnlinkedDevices([]);
    onOpenLocationModal();
  }, [onOpenLocationModal]);

  const handleDeleteClick = useCallback((location) => {
    setLocationToDelete(location);
    onOpenDeleteDialog();
  }, [onOpenDeleteDialog]);

  const handleLocationDeleteConfirm = useCallback(async () => {
    if (!locationToDelete) return;
    setIsSubmitting(true);

    try {
      if (locationToDelete.deviceID && user.role === 'admin') {
        const res = await apiPost('/api/device/unlink', {
          deviceID: locationToDelete.deviceID,
          locationID: locationToDelete.id,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'ไม่สามารถยกเลิกการเชื่อมโยงอุปกรณ์ได้');
        }
      }

      const res = await apiDelete(`/api/locations/${locationToDelete.id}`);

      if (!res.ok) {
        throw new Error('ไม่สามารถลบสถานที่ได้');
      }

      setLocations((prev) => prev.filter((loc) => loc.id !== locationToDelete.id));
      await fetchUnlinkedDevices();

      toast({
        title: 'สำเร็จ',
        description: 'ลบสถานที่เรียบร้อย',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });

    } catch (error) {
      console.error('Error deleting location:', error.message);
      toast({
        title: 'ข้อผิดพลาด',
        description: error.message || 'ไม่สามารถลบสถานที่ได้',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsSubmitting(false);
      onCloseDeleteDialog();
      setLocationToDelete(null);
    }
  }, [locationToDelete, user.role, toast, fetchUnlinkedDevices, onCloseDeleteDialog]);

  const handleFileChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }, []);

  const handleCsvFileChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  }, []);

  const uploadLocationImage = useCallback(async (locationId) => {
    if (!selectedFile || !locationId) return null;

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const res = await apiFetch(`/api/locations/${locationId}/uploadImage`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('ไม่สามารถอัปโหลดรูปภาพได้');
      }

      const data = await res.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Upload image error:', error.message);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถอัปโหลดรูปภาพได้',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return null;
    }
  }, [selectedFile, toast]);

  const uploadCsvData = useCallback(async () => {
    if (!csvFile || !selectedLocationId) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'กรุณาเลือกสถานที่และไฟล์ CSV',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('csvFile', csvFile);

      const res = await apiFetch(`/api/locations/${selectedLocationId}/uploadCsv`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'ไม่สามารถอัปโหลด CSV ได้');
      }

      toast({
        title: 'สำเร็จ',
        description: 'อัปโหลดข้อมูล CSV สำเร็จ',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });

    } catch (error) {
      console.error('CSV Upload error:', error.message);
      toast({
        title: 'ข้อผิดพลาด',
        description: error.message || 'ไม่สามารถอัปโหลด CSV ได้',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsSubmitting(false);
      onCloseCsvModal();
      setCsvFile(null);
      setSelectedLocationId('');
    }
  }, [csvFile, selectedLocationId, toast, onCloseCsvModal]);

  const isFormComplete = useCallback(() => {
    if (!currentLocation.name.trim() || !currentLocation.coordinates.trim()) {
      return false;
    }
    if (user.role === 'admin') {
      if (deviceInputMethod === 'manual' && !manualDeviceID.trim()) {
        return false;
      }
      if (deviceInputMethod === 'dropdown' && !currentLocation.deviceID.trim()) {
        return false;
      }
    }
    return true;
  }, [currentLocation.name, currentLocation.coordinates, currentLocation.deviceID, user.role, deviceInputMethod, manualDeviceID]);

  const handleLocationSave = useCallback(async () => {
    if (!isFormComplete()) {
      toast({ title: 'ข้อผิดพลาด', description: 'กรุณากรอกข้อมูลให้ครบถ้วน', status: 'error', duration: 2000 });
      return;
    }

    const finalDeviceID =
      deviceInputMethod === 'manual' && manualDeviceID ? manualDeviceID : currentLocation.deviceID;

    if (user.role === 'admin' && finalDeviceID && deviceInputMethod !== 'manual') {
      const originalLocation = locations.find((loc) => loc.id === currentLocation.id);
      const isUnlinked = Array.isArray(unlinkedDevices) && unlinkedDevices.some((device) => device.deviceID === finalDeviceID);
      const isOriginalDevice = originalLocation && originalLocation.deviceID === finalDeviceID;
      if (!isUnlinked && !isOriginalDevice) {
        toast({ title: 'ข้อผิดพลาด', description: 'DeviceID นี้ถูกเชื่อมโยงแล้วหรือไม่สามารถใช้ได้', status: 'error', duration: 2000 });
        return;
      }
    }

    const duplicate = locations.find(
      (loc) =>
        loc.id !== currentLocation.id &&
        (loc.name.trim() === currentLocation.name.trim() || (loc.deviceID && loc.deviceID === finalDeviceID))
    );
    if (duplicate) {
      const msg =
        duplicate.name.trim() === currentLocation.name.trim()
          ? 'ชื่อสถานที่นี้มีอยู่แล้ว'
          : 'DeviceID นี้ถูกใช้ไปแล้ว';
      toast({ title: 'ข้อผิดพลาด', description: msg, status: 'error', duration: 2000 });
      return;
    }

    setIsSubmitting(true);
    try {
      let updatedLoc;
      const url = currentLocation.id ? `/api/locations/${currentLocation.id}` : '/api/locations';
      const method = currentLocation.id ? 'PUT' : 'POST';

      if (currentLocation.id) {
        const originalLocation = locations.find((loc) => loc.id === currentLocation.id);
        if (originalLocation?.deviceID && originalLocation.deviceID !== finalDeviceID) {
          const unlinkRes = await apiPost('/api/device/unlink', {
            deviceID: originalLocation.deviceID,
            locationID: currentLocation.id,
          });

          if (!unlinkRes.ok) {
            const errorData = await unlinkRes.json();
            throw new Error(errorData.error || 'ไม่สามารถยกเลิกการเชื่อมโยงอุปกรณ์เดิมได้');
          }
        }
      }

      const locationRes = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: currentLocation.name,
          coordinates: currentLocation.coordinates,
          deviceID: finalDeviceID || null,
        }),
      });

      if (!locationRes.ok) {
        const errorData = await locationRes.json();
        throw new Error(errorData.error || 'ไม่สามารถบันทึกสถานที่ได้');
      }
      updatedLoc = await locationRes.json();

      if (selectedFile) {
        const imageUrl = await uploadLocationImage(updatedLoc.id);
        if (imageUrl) updatedLoc = { ...updatedLoc, imageUrl };
      }

      await fetchUnlinkedDevices();

      setLocations((prev) =>
        currentLocation.id
          ? prev.map((loc) => (loc.id === updatedLoc.id ? updatedLoc : loc))
          : [...prev, updatedLoc]
      );

      toast({ title: 'สำเร็จ', description: `สถานที่ ${currentLocation.id ? 'แก้ไข' : 'เพิ่ม'} เรียบร้อย`, status: 'success', duration: 1000 });
    } catch (error) {
      toast({ title: 'ข้อผิดพลาด', description: error.message || 'ไม่สามารถบันทึกสถานที่ได้', status: 'error', duration: 2000 });
    } finally {
      setIsSubmitting(false);
      onCloseLocationModal();
      setCurrentLocation({ id: null, name: '', coordinates: '', deviceID: '' });
      setDeviceInputMethod('dropdown');
      setManualDeviceID('');
      setSelectedFile(null);
    }
  }, [
    currentLocation,
    selectedFile,
    toast,
    onCloseLocationModal,
    uploadLocationImage,
    locations,
    unlinkedDevices,
    user.role,
    fetchUnlinkedDevices,
    manualDeviceID,
    deviceInputMethod,
    isFormComplete,
  ]);

  if (isPageLoading) {
    return (
      <Box flex="1" bg="gray.50" minH="100vh" px={{ base: 4, md: 6 }} py={{ base: 6, md: 8 }}>
        <Flex align="center" mb={6}>
          <Skeleton height="40px" width="40px" borderRadius="md" mr={3} />
          <Skeleton height="32px" width="200px" />
        </Flex>
        <Flex gap={4} mb={8} flexWrap="wrap">
          <Box flex="1" minW={{ base: '150px', md: '200px' }} p={4} bg="white" borderRadius="lg" boxShadow="sm">
            <Skeleton height="40px" width="60px" mx="auto" mb={2} />
            <Skeleton height="16px" width="120px" mx="auto" />
          </Box>
        </Flex>
        <Box bg="white" p={4} borderRadius="lg" boxShadow="sm">
          <Tabs variant="soft-rounded" colorScheme="blue">
            <TabList mb={4}>
              <Tab>
                <Skeleton height="20px" width="80px" />
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel p={0}>
                <Box mb={4}>
                  <Skeleton height="36px" width="120px" borderRadius="md" />
                </Box>
                <Box overflowX="auto">
                  <Table variant="simple" size="md">
                    <Thead bg="gray.100">
                      <Tr>
                        {['ID', 'ชื่อสถานที่', 'พิกัด', user.role === 'admin' && 'DeviceID', 'การกระทำ'].filter(Boolean).map((header, index) => (
                          <Th key={index}>
                            <Skeleton height="20px" width="80px" />
                          </Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {Array(3).fill().map((_, rowIndex) => (
                        <Tr key={rowIndex}>
                          {Array(user.role === 'admin' ? 5 : 4).fill().map((_, colIndex) => (
                            <Td key={colIndex}>
                              <Skeleton height="20px" width={colIndex === (user.role === 'admin' ? 4 : 3) ? "80px" : "100px"} />
                            </Td>
                          ))}
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Box>
    );
  }

  return (
    <Box flex="1" bg="gray.50" minH="100vh" px={{ base: 4, md: 6 }} py={{ base: 6, md: 8 }}>
      <Flex align="center" mb={6}>
        <IconButton
          icon={<ArrowBackIcon />}
          variant="ghost"
          color="gray.700"
          size="lg"
          onClick={() => navigate(-1)}
          aria-label="Go Back"
          _hover={{ bg: 'gray.200' }}
          mr={3}
        />
        <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color="gray.800">
          จัดการข้อมูล
        </Text>
      </Flex>

      <Flex gap={4} mb={8} flexWrap="wrap">
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
            {locations.length}
          </Text>
          <Text fontSize="sm" color="gray.600">
            สถานที่ทั้งหมด
          </Text>
        </Box>
      </Flex>

      <Box bg="white" p={4} borderRadius="lg" boxShadow="sm">
        <Tabs variant="soft-rounded" colorScheme="blue">
          <TabList mb={4}>
            <Tab fontSize={{ base: 'sm', md: 'md' }} _selected={{ bg: 'blue.500', color: 'white' }}>
              สถานที่
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel p={0}>
              <Box mb={4}>
                <HStack spacing={4}>
                  <Button
                    colorScheme="teal"
                    size={{ base: 'md', md: 'md' }}
                    onClick={openAddLocationModal}
                    isDisabled={isSubmitting}
                    px={6}
                  >
                    เพิ่มสถานที่
                  </Button>
                  <Button
                    colorScheme="blue"
                    size={{ base: 'md', md: 'md' }}
                    onClick={onOpenCsvModal}
                    isDisabled={isSubmitting}
                    px={6}
                  >
                    อัปโหลดข้อมูลย้อนหลัง
                  </Button>
                </HStack>
              </Box>
              <Box overflowX="auto">
                <Table variant="simple" size="md">
                  <Thead bg="gray.100">
                    <Tr>
                      <Th color="gray.700">ID</Th>
                      <Th color="gray.700">ชื่อสถานที่</Th>
                      <Th color="gray.700">พิกัด</Th>
                      {user.role === 'admin' && <Th color="gray.700">DeviceID</Th>}
                      <Th color="gray.700">การกระทำ</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {locations.map((loc) => (
                      <Tr key={loc.id} _hover={{ bg: 'gray.50' }}>
                        <Td>{loc.id}</Td>
                        <Td>{loc.name}</Td>
                        <Td>{loc.coordinates}</Td>
                        {user.role === 'admin' && <Td>{loc.deviceID || '-'}</Td>}
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              icon={<EditIcon />}
                              colorScheme="teal"
                              size="sm"
                              onClick={() => handleLocationEdit(loc)}
                              isDisabled={isSubmitting}
                              aria-label="Edit"
                            />
                            <IconButton
                              icon={<DeleteIcon />}
                              colorScheme="red"
                              size="sm"
                              onClick={() => handleDeleteClick(loc)}
                              isDisabled={isSubmitting}
                              aria-label="Delete"
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      {/* Modal เพิ่ม/แก้ไขสถานที่ */}
      <Modal isOpen={isLocationModalOpen} onClose={onCloseLocationModal} size={{ base: 'full', md: 'md' }}>
        <ModalOverlay />
        <ModalContent borderRadius="lg">
          <ModalHeader fontSize="lg" fontWeight="bold" color="gray.800">
            {currentLocation.id ? 'แก้ไขสถานที่' : 'เพิ่มสถานที่'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4} isRequired>
              <FormLabel fontSize="sm" color="gray.600">ชื่อสถานที่</FormLabel>
              <Input
                value={currentLocation.name}
                onChange={(e) => setCurrentLocation({ ...currentLocation, name: e.target.value })}
                size="md"
                variant="outline"
                borderRadius="md"
                disabled={isSubmitting}
              />
            </FormControl>

            {/* ✅ แผนที่สำหรับเลือกพิกัด */}
            <FormControl mb={4} isRequired>
              <FormLabel fontSize="sm" color="gray.600">เลือกพิกัดบนแผนที่</FormLabel>
              <Box height="300px" width="100%" border="1px solid #CBD5E0" borderRadius="md" overflow="hidden">
                <MapContainer
                  center={currentLocation.coordinates
                    ? currentLocation.coordinates.split(',').map(Number)
                    : [13.7563, 100.5018]} // Default Bangkok
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© <a href=\"http://osm.org/copyright\">OpenStreetMap</a> contributors'
                  />
                  <LocationSelector
                    currentLocation={currentLocation}
                    setCurrentLocation={setCurrentLocation}
                  />
                  {currentLocation.coordinates && (
                    <Marker
                      position={currentLocation.coordinates.split(',').map(Number)}
                    />
                  )}
                </MapContainer>
              </Box>
              {currentLocation.coordinates && (
                <Text fontSize="sm" mt={2} color="gray.500">
                  พิกัดที่เลือก: {currentLocation.coordinates}
                </Text>
              )}
            </FormControl>

            {user.role === 'admin' && (
              <>
                <FormControl mb={4}>
                  <FormLabel fontSize="sm" color="gray.600">วิธีเลือก DeviceID</FormLabel>
                  <RadioGroup
                    onChange={(value) => {
                      setDeviceInputMethod(value);
                      if (value === 'manual') {
                        setManualDeviceID(currentLocation.deviceID || '');
                        setCurrentLocation({ ...currentLocation, deviceID: '' });
                      } else if (value === 'dropdown') {
                        setManualDeviceID('');
                      }
                    }}
                    value={deviceInputMethod}
                  >
                    <Stack direction="row" spacing={4}>
                      <Radio value="dropdown">เลือกจากรายการ</Radio>
                      <Radio value="manual">กรอก DeviceID เอง</Radio>
                    </Stack>
                  </RadioGroup>
                </FormControl>

                {deviceInputMethod === 'dropdown' && (
                  <FormControl mb={4} isRequired>
                    <FormLabel fontSize="sm" color="gray.600">DeviceID</FormLabel>
                    <HStack>
                      <Select
                        value={currentLocation.deviceID || ''}
                        onChange={(e) => setCurrentLocation({ ...currentLocation, deviceID: e.target.value })}
                        size="md"
                        variant="outline"
                        borderRadius="md"
                        disabled={isSubmitting}
                        placeholder="เลือก DeviceID"
                      >
                        {[...(currentLocation.deviceID && !unlinkedDevices.some(d => d.deviceID === currentLocation.deviceID)
                          ? [{ deviceID: currentLocation.deviceID }]
                          : []),
                          ...(Array.isArray(unlinkedDevices) ? unlinkedDevices : []),
                        ].map((device) => (
                          <option key={device.deviceID} value={device.deviceID}>
                            {device.deviceID}
                          </option>
                        ))}
                      </Select>
                      <IconButton
                        colorScheme="blue"
                        size="md"
                        onClick={fetchUnlinkedDevices}
                        aria-label="Refresh DeviceID List"
                        title="รีเฟรชรายการ DeviceID"
                        isDisabled={isDeviceLoading || isSubmitting}
                      >
                        <motion.div
                          animate={isDeviceLoading ? { rotate: 360 } : { rotate: 0 }}
                          transition={isDeviceLoading ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
                        >
                          <RepeatIcon />
                        </motion.div>
                      </IconButton>
                    </HStack>
                  </FormControl>
                )}

                {deviceInputMethod === 'manual' && (
                  <FormControl mb={4} isRequired>
                    <FormLabel fontSize="sm" color="gray.600">กรอก DeviceID</FormLabel>
                    <Input
                      value={manualDeviceID}
                      onChange={(e) => setManualDeviceID(e.target.value)}
                      size="md"
                      variant="outline"
                      borderRadius="md"
                      disabled={isSubmitting}
                      placeholder="เช่น DEV12345"
                    />
                  </FormControl>
                )}
              </>
            )}

            <FormControl>
              <FormLabel fontSize="sm" color="gray.600">รูปสถานที่</FormLabel>
              <Input
                type="file"
                onChange={handleFileChange}
                size="md"
                variant="outline"
                borderRadius="md"
                p={1}
                disabled={isSubmitting}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="teal"
              size="md"
              onClick={handleLocationSave}
              isLoading={isSubmitting}
              isDisabled={!isFormComplete()}
              mr={3}
            >
              บันทึก
            </Button>
            <Button variant="outline" size="md" onClick={onCloseLocationModal} isDisabled={isSubmitting}>
              ยกเลิก
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>



      {/* Modal อัปโหลด CSV */}
      <Modal isOpen={isCsvModalOpen} onClose={onCloseCsvModal} size={{ base: 'full', md: 'md' }}>
        <ModalOverlay />
        <ModalContent borderRadius="lg">
          <ModalHeader fontSize="lg" fontWeight="bold" color="gray.800">
            อัปโหลดข้อมูลย้อนหลัง
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel fontSize="sm" color="gray.600">เลือกสถานที่</FormLabel>
              <Select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                placeholder="เลือกสถานที่"
                size="md"
                variant="outline"
                borderRadius="md"
                disabled={isSubmitting}
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm" color="gray.600">ไฟล์ CSV</FormLabel>
              <Input
                type="file"
                accept=".csv"
                onChange={handleCsvFileChange}
                size="md"
                variant="outline"
                borderRadius="md"
                p={1}
                disabled={isSubmitting}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" size="md" onClick={uploadCsvData} isLoading={isSubmitting} mr={3}>
              อัปโหลด
            </Button>
            <Button variant="outline" size="md" onClick={onCloseCsvModal} isDisabled={isSubmitting}>
              ยกเลิก
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal ยืนยันการลบ */}
      <AlertDialog isOpen={isDeleteDialogOpen} leastDestructiveRef={cancelRef} onClose={onCloseDeleteDialog}>
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="lg" bg="white">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="gray.800">
              ยืนยันการลบ
            </AlertDialogHeader>
            <AlertDialogBody fontSize="md" color="gray.600">
              คุณต้องการลบสถานที่นี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} size="md" onClick={onCloseDeleteDialog} isDisabled={isSubmitting}>
                ยกเลิก
              </Button>
              <Button colorScheme="red" size="md" onClick={handleLocationDeleteConfirm} ml={3} isLoading={isSubmitting}>
                ลบ
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}

export default Manage;
