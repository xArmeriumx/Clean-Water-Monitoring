import React, { useState, useEffect } from 'react';
import { apiGet, apiFetch } from '../../utils/api';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  VStack,
  HStack,
  useToast,
  Spinner,
  Center,
  Text,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Image,
  Icon,
  IconButton,
  Container,
  Skeleton,
} from '@chakra-ui/react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ArrowBackIcon, CloseIcon, AttachmentIcon } from '@chakra-ui/icons';

const ReportIssueContent = ({ locationId }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [locationName, setLocationName] = useState('');
  const [subject, setSubject] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [description, setDescription] = useState('');

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorLocation, setErrorLocation] = useState(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef(null);

  useEffect(() => {
    const fetchLocation = async () => {
      setLoadingLocation(true);
      setErrorLocation(null);
      try {
        const res = await apiGet(`/api/locations/${locationId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch location info');
        }
        const data = await res.json();
        setLocationName(data.name || `Location ${locationId}`);
      } catch (err) {
        setErrorLocation(err.message);
      } finally {
        setLoadingLocation(false);
      }
    };
    fetchLocation();
  }, [locationId, user?.token]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const isFormValid = () => {
    return locationId && subject.trim() && imageFile && description.trim();
  };

  const handleOpenConfirm = () => {
    if (!isFormValid()) {
      toast({
        title: 'กรุณากรอกข้อมูลให้ครบ',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    onOpen();
  };

  const handleConfirmSubmit = async () => {
    onClose();
    setLoadingSubmit(true);

    const formData = new FormData();
    formData.append('subject', subject);
    formData.append('description', description);
    formData.append('image', imageFile);

    try {
      const res = await apiFetch(`/api/locations/${locationId}/issues`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to submit issue');

      toast({
        title: 'ส่งเรื่องสำเร็จ',
        description: 'ระบบได้บันทึกปัญหาของคุณแล้ว',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });

      navigate(-1);
    } catch (err) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (loadingLocation) {
    return (
      <Box minH="100vh" py={6}>
        <Container maxW="lg" px={4}>
          {/* Header Skeleton */}
          <Box position="relative" mb={6}>
            <Skeleton height="40px" width="40px" borderRadius="md" position="absolute" top={-2} left={-4} />
            <Skeleton height="32px" width="120px" mx="auto" />
          </Box>
          {/* Form Skeleton */}
          <Box bg="white" borderRadius="xl" boxShadow="lg" p={6}>
            <VStack spacing={5} align="stretch">
              {/* สถานที่ */}
              <FormControl>
                <Skeleton height="16px" width="60px" mb={2} />
                <Skeleton height="40px" borderRadius="md" />
              </FormControl>
              {/* หัวข้อปัญหา */}
              <FormControl>
                <Skeleton height="16px" width="80px" mb={2} />
                <Skeleton height="40px" borderRadius="md" />
              </FormControl>
              {/* รูปปัญหา */}
              <FormControl>
                <Skeleton height="16px" width="60px" mb={2} />
                <Skeleton height="100px" borderRadius="lg" />
              </FormControl>
              {/* รายละเอียดปัญหา */}
              <FormControl>
                <Skeleton height="16px" width="100px" mb={2} />
                <Skeleton height="100px" borderRadius="md" />
              </FormControl>
              {/* ปุ่ม */}
              <HStack spacing={4}>
                <Skeleton height="48px" flex="1" borderRadius="md" />
                <Skeleton height="48px" flex="1" borderRadius="md" />
              </HStack>
            </VStack>
          </Box>
        </Container>
      </Box>
    );
  }
  if (errorLocation) {
    return (
      <Center minH="100vh">
        <Text color="red.500" fontSize="lg">{errorLocation}</Text>
      </Center>
    );
  }

  return (
    <Box minH="100vh" py={6}>
      <Container maxW="lg" px={4}>
        <Box position="relative" mb={6}>
          <IconButton
            icon={<ArrowBackIcon />}
            variant="ghost"
            size="lg"
            color="gray.700"
            onClick={() => navigate(-1)}
            position="absolute"
            top={-2}
            left={-4}
            _hover={{ bg: 'gray.200' }}
            aria-label="Back"
          />
          <Heading as="h2" size="lg" textAlign="center" color="gray.800">
            แจ้งปัญหา
          </Heading>
        </Box>
        <Box bg="white" borderRadius="xl" boxShadow="lg" p={6} transition="all 0.3s" _hover={{ boxShadow: 'xl' }}>
          <VStack spacing={5} align="stretch">
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                สถานที่
              </FormLabel>
              <Input
                value={locationName}
                isReadOnly
                bg="gray.100"
                borderColor="gray.200"
                focusBorderColor="blue.500"
                borderRadius="md"
                size="md"
                _hover={{ borderColor: 'gray.300' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                หัวข้อปัญหา
              </FormLabel>
              <Input
                placeholder="เช่น น้ำไม่ไหล, ท่อน้ำแตก, ..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                borderColor="gray.200"
                focusBorderColor="blue.500"
                borderRadius="md"
                size="md"
                _hover={{ borderColor: 'gray.300' }}
                transition="border-color 0.2s"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                รูปปัญหา
              </FormLabel>
              <Box
                border="2px dashed"
                borderColor={imageFile ? 'blue.500' : 'gray.300'}
                borderRadius="lg"
                p={4}
                textAlign="center"
                bg={imageFile ? 'blue.50' : 'gray.50'}
                transition="all 0.3s"
                _hover={{ borderColor: 'blue.400', bg: 'blue.100' }}
                position="relative"
              >
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  opacity={0}
                  position="absolute"
                  top={0}
                  left={0}
                  width="100%"
                  height="100%"
                  cursor="pointer"
                  zIndex={2}
                />
                <VStack spacing={2}>
                  <Icon as={AttachmentIcon} boxSize={6} color={imageFile ? 'blue.500' : 'gray.500'} />
                  <Text fontSize="sm" color={imageFile ? 'blue.600' : 'gray.600'} fontWeight="medium">
                    {imageFile ? imageFile.name : 'เลือกไฟล์รูปภาพ (คลิกเพื่อเลือก)'}
                  </Text>
                  {!imageFile && (
                    <Text fontSize="xs" color="gray.500">
                      รองรับไฟล์รูปภาพเท่านั้น (เช่น .jpg, .png)
                    </Text>
                  )}
                </VStack>
              </Box>
              {imagePreview && (
                <Box mt={3} position="relative" maxW="100%">
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    ตัวอย่างรูปภาพ:
                  </Text>
                  <Image
                    src={imagePreview}
                    alt="Image Preview"
                    maxW="100%"
                    maxH="250px"
                    objectFit="cover"
                    borderRadius="lg"
                    boxShadow="md"
                    transition="transform 0.2s"
                    _hover={{ transform: 'scale(1.02)' }}
                  />
                  <IconButton
                    icon={<CloseIcon />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    position="absolute"
                    top={2}
                    right={2}
                    onClick={handleRemoveImage}
                    aria-label="Remove Image"
                    _hover={{ bg: 'red.100' }}
                  />
                </Box>
              )}
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="medium" color="gray.700">
                รายละเอียดปัญหา
              </FormLabel>
              <Textarea
                placeholder="กรอกรายละเอียด"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                borderColor="gray.200"
                focusBorderColor="blue.500"
                borderRadius="md"
                size="md"
                rows={4}
                _hover={{ borderColor: 'gray.300' }}
                transition="border-color 0.2s"
              />
            </FormControl>

            <HStack spacing={4} mt={2}>
              <Button
                colorScheme="blue"
                flex="1"
                onClick={handleOpenConfirm}
                isLoading={loadingSubmit}
                size="lg"
                borderRadius="md"
                _hover={{ bg: 'blue.600' }}
                transition="background-color 0.2s"
              >
                บันทึก
              </Button>
              <Button
                variant="outline"
                colorScheme="gray"
                flex="1"
                onClick={() => navigate(-1)}
                size="lg"
                borderRadius="md"
                _hover={{ bg: 'gray.100' }}
                transition="background-color 0.2s"
              >
                ยกเลิก
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Container>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="xl" bg="white" mx={4} my="auto">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="gray.800">
              ยืนยันการแจ้งปัญหา
            </AlertDialogHeader>

            <AlertDialogBody color="gray.700" fontSize="md">
              คุณต้องการส่งเรื่องแจ้งปัญหานี้ใช่หรือไม่?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={onClose}
                variant="outline"
                colorScheme="gray"
                size="md"
                borderRadius="md"
                _hover={{ bg: 'gray.100' }}
              >
                ยกเลิก
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleConfirmSubmit}
                ml={3}
                isLoading={loadingSubmit}
                size="md"
                borderRadius="md"
                _hover={{ bg: 'blue.600' }}
              >
                ยืนยัน
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

function ReportIssue() {
  const [searchParams] = useSearchParams();
  const locationId = searchParams.get('locationId') || '';

  if (!locationId) {
    return (
      <Center minH="100vh">
        <Text color="red.500" fontSize="lg">ไม่พบ locationId ใน query string</Text>
      </Center>
    );
  }

  return <ReportIssueContent locationId={locationId} />;
}

export default ReportIssue;