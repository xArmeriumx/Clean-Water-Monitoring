import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Icon } from '@chakra-ui/react';
import {
  Box,
  Input,
  Flex,
  Heading,
  Button,
  VStack,
  Text,
  HStack,
  IconButton,
  Avatar,
  Image,
  Center,
  Skeleton,
  SkeletonText,
  useToast,
  useBreakpointValue,
  useColorModeValue,
} from '@chakra-ui/react';
import { MdList, MdMap } from 'react-icons/md';
import { FaMapLocationDot, FaDroplet } from 'react-icons/fa6';
import { MapContainer, TileLayer, Marker, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { apiGet } from '../../utils/api';

// Skeleton for sidebar loading
const SkeletonLoading = () => (
  <VStack align="stretch" spacing={3}>
    {Array(10)
      .fill()
      .map((_, i) => (
        <Box key={i} p={3} bg="white" borderRadius="xl" boxShadow="sm">
          <HStack spacing={3}>
            <Skeleton height="50px" width="50px" borderRadius="md" />
            <VStack align="start" spacing={1}>
              <Skeleton height="16px" width="150px" />
              <SkeletonText noOfLines={1} width="100px" />
            </VStack>
          </HStack>
        </Box>
      ))}
  </VStack>
);

// Parse coordinates from string to [lat, lng]
const parseCoordinates = (coordStr) => {
  if (!coordStr) return [0, 0];
  const fixed = coordStr.replace(/\//g, ',').replace(/\s+/g, '');
  const parts = fixed.split(',');
  if (parts.length < 2) return [0, 0];
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  return isNaN(lat) || isNaN(lng) ? [0, 0] : [lat, lng];
};

// Simple distance score for comparing closeness
const getSimpleDistanceScore = (lat1, lon1, lat2, lon2) => {
  return Math.abs(lat2 - lat1) + Math.abs(lon2 - lon1);
};

// Open Google Maps directions in new tab
const openDirectionsInGoogleMaps = (lat, lng) => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(url, '_blank');
};

// Custom marker icons
const customIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
const userIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3177/3177361.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

// MapAdjuster adjusts map size and view
const MapAdjuster = React.memo(({ userPosition, locations, isMapView }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (userPosition) {
        map.setView(userPosition, 16);
      } else if (locations.length) {
        const allCoords = locations
          .map((loc) => parseCoordinates(loc.coordinates))
          .filter((coord) => coord[0] !== 0 || coord[1] !== 0);
        if (allCoords.length) {
          const bounds = L.latLngBounds(allCoords);
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
          }
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [userPosition, locations, map, isMapView]);
  return null;
});

// Main Mapping component
function Mapping() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const toastPosition = 'bottom';

  const isMobile = useBreakpointValue({ base: true, md: false });
  const isDesktop = useBreakpointValue({ base: false, md: true });
  const initialMapView = useBreakpointValue({ base: false, md: false }) ?? true;
  const [isMapView, setIsMapView] = useState(initialMapView);

  const [searchTerm, setSearchTerm] = useState('');
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [userPosition, setUserPosition] = useState(null);
  const [hasFetchedLocation, setHasFetchedLocation] = useState(false);

  const textSize = useBreakpointValue({ base: 'xs', md: 'sm' });
  const buttonSize = useBreakpointValue({ base: 'xs', md: 'sm' });
  const sidebarWidth = useBreakpointValue({ base: '100%', md: '400px' });
  const bgColor = useColorModeValue('#F7FAFC', '#E2E8F0');
  const textColor = useColorModeValue('gray.900', 'gray.200');
  const accentColor = '#2c75b9';
  const gradientBg = `linear-gradient(135deg, ${accentColor} 0%, #4a9ce8 100%)`;

  // Navigate to main page on logo click
  const handleLogoClick = useCallback(() => {
    if (user?.role === 'admin' || user?.role === 'labstaff') {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  }, [navigate, user?.role]);

  // Fetch locations from API
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await apiGet('/api/locations');
        
        if (!res.ok) throw new Error('Failed to fetch locations');
        const data = await res.json();
        setLocations(data);
      } catch (error) {
        toast({
          title: 'Error',
          description: error.message || 'Could not load locations',
          status: 'error',
          duration: 2000,
          isClosable: true,
          position: toastPosition,
          containerStyle: {
            background: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            borderRadius: 'md',
            fontSize: 'sm',
          },
        });
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, [toast, user, toastPosition]);

  // Get user geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support geolocation',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: toastPosition,
      });
      return;
    }
    if (!hasFetchedLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPosition([pos.coords.latitude, pos.coords.longitude]);
          setHasFetchedLocation(true);
        },
        () => {
          if (!hasFetchedLocation) {
            toast({
              title: 'Geolocation error',
              description: 'Could not determine your position',
              status: 'warning',
              duration: 2000,
              isClosable: true,
              position: toastPosition,
            });
            setHasFetchedLocation(true);
          }
        },
        { enableHighAccuracy: true }
      );
    }
  }, [toast, toastPosition, hasFetchedLocation]);

  // Scroll to top when initially in Map View on desktop
  useEffect(() => {
    if (isDesktop && initialMapView) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isDesktop, initialMapView]);

  // Filter locations by search term
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) =>
      loc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [locations, searchTerm]);

  // Find closest location using simple distance score
  const closestLocation = useMemo(() => {
    if (!userPosition || !filteredLocations.length) return null;
    return filteredLocations.reduce((prev, curr) => {
      const [prevLat, prevLng] = parseCoordinates(prev.coordinates);
      const [currLat, currLng] = parseCoordinates(curr.coordinates);
      const prevScore = getSimpleDistanceScore(
        userPosition[0],
        userPosition[1],
        prevLat,
        prevLng
      );
      const currScore = getSimpleDistanceScore(
        userPosition[0],
        userPosition[1],
        currLat,
        currLng
      );
      return currScore < prevScore ? curr : prev;
    });
  }, [filteredLocations, userPosition]);

  // Toggle view mode (List vs Map) and scroll to top when switching to Map View
  const toggleViewMode = useCallback(() => {
    setIsMapView((prev) => {
      const newView = !prev;
      if (newView) { // If switching to Map View
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return newView;
    });
  }, []);

  // Default map center (Bangkok)
  const mapCenter = [13.756331, 100.501762];

  return (
    <Box as="main" bg={bgColor} minH="100vh" position="relative" overflow="hidden">
      {/* Background decorations */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        height="500px"
        bg={gradientBg}
        opacity={0.10}
        transform="skewY(-4deg)"
        zIndex={0}
      />
      <Box
        position="absolute"
        top="20%"
        right="10%"
        w="150px"
        h="150px"
        bg="blue.100"
        borderRadius="full"
        opacity={0.2}
        filter="blur(60px)"
        zIndex={0}
      />

      {/* Header */}
      <Flex
        position="fixed"
        top="0"
        left="0"
        right="0"
        bgGradient="linear(to-r, #f7fcff, #ebf8ff)"
        boxShadow="sm"
        py={{ base: 3, md: 4 }}
        px={{ base: 4, md: 6 }}
        zIndex="1000"
        align="center"
        wrap={{ base: 'wrap', md: 'nowrap' }}
        gap={{ base: 2, md: 3 }}
        minH={{ base: '120px', md: '80px' }}
      >
        <Icon
          as={FaDroplet}
          position="absolute"
          top="50%"
          left="10%"
          transform="translateY(-50%)"
          w="80px"
          h="80px"
          color="blue.200"
          opacity={0.2}
          zIndex={0}
        />
        <HStack
          spacing={2}
          onClick={handleLogoClick}
          cursor="pointer"
          flex={{ base: '1 1 100%', md: '0 0 auto' }}
          zIndex={1}
        >
          <Box position="relative">
            <Image
              src="logo.png"
              alt="Logo"
              boxSize={{ base: '40px', md: '50px' }}
              borderRadius="full"
              border="2px solid"
              borderColor="blue.400"
              objectFit="contain"
              fallbackSrc="logo.png"
              _hover={{ transform: 'scale(1.1)', transition: 'transform 0.3s' }}
            />
          </Box>
          <VStack align="start" spacing={0}>
            <Text
              fontSize={{ base: 'lg', md: 'xl' }}
              fontWeight="bold"
              bgGradient="linear(to-r, blue.800, blue.600)"
              bgClip="text"
            >
              Clean Water Monitoring
            </Text>
            <Text fontSize={{ base: 'xs', md: 'sm' }} color="blue.600" fontWeight="medium">
              IoT Monitoring Project
            </Text>
          </VStack>
        </HStack>
        <Heading
          fontSize={{ base: 'lg', md: 'xl' }}
          flex={{ base: '1 1 100%', md: '1' }}
          textAlign={{ base: 'center', md: 'left' }}
          color={textColor}
          bgGradient="linear(to-r, blue.700, blue.500)"
          bgClip="text"
        />
        <HStack
          spacing={3}
          flexShrink={0}
          justify={{ base: 'center', md: 'flex-end' }}
          w={{ base: '100%', md: 'auto' }}
          zIndex={1}
        >
          {!isDesktop && (
            <IconButton
              icon={isMapView ? <Icon as={MdList} boxSize={6} /> : <Icon as={MdMap} boxSize={6} />}
              onClick={toggleViewMode}
              colorScheme="blue"
              variant="outline"
              size={{ base: 'md', md: 'lg' }}
              borderRadius="full"
              _hover={{ bg: 'blue.50', transform: 'scale(1.05)' }}
              transition="all 0.2s"
              aria-label={isMapView ? 'Switch to List View' : 'Switch to Map View'}
            />
          )}
          <Input
            maxW={{ base: '100%', md: '300px' }}
            placeholder="ค้นหาสถานที่..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            bg="white"
            borderColor="gray.200"
            focusBorderColor="blue.500"
            borderRadius="md"
            size={{ base: 'md', md: 'lg' }}
            _hover={{ borderColor: 'blue.300', boxShadow: 'sm' }}
            transition="all 0.2s"
            boxShadow="sm"
          />
          {user?.profile && (
            <HStack spacing={2}>
              <Avatar size={{ base: 'sm', md: 'md' }} src={user.profile.pictureUrl || ''} />
              <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.700" isTruncated maxW="150px">
                {user.profile.displayName}
              </Text>
            </HStack>
          )}
        </HStack>
      </Flex>

      {/* Main Content */}
      <Box
        flex="1"
        mt={{ base: '140px', md: '80px' }}
        overflowY="auto"
        position="relative"
        zIndex={1}
      >
        <Flex
          h={{ base: 'calc(100vh - 140px)', md: 'calc(100vh - 80px)' }}
          direction={{ base: 'column', md: 'row' }}
        >
          {/* Sidebar (List) */}
          {(isDesktop || !isMapView) && (
            <Box
              w={isDesktop ? sidebarWidth : '100%'}
              h={isDesktop ? '100%' : 'auto'}
              overflowY="auto"
              borderRight={isDesktop ? '1px solid' : 'none'}
              borderColor="gray.200"
              p={4}
              bg="transparent"
            >
              {loadingLocations ? (
                <SkeletonLoading />
              ) : filteredLocations.length === 0 ? (
                <Center h="full">
                  <Text color="gray.500" fontSize={{ base: 'md', md: 'lg' }}>
                    ไม่พบสถานที่ที่ตรงกับการค้นหา
                  </Text>
                </Center>
              ) : (
                <VStack align="stretch" spacing={3}>
                  {filteredLocations.map((loc) => {
                    const shortCoords = loc.coordinates
                      ? loc.coordinates
                          .split(',')
                          .map((coord) => parseFloat(coord).toFixed(4))
                          .join(', ')
                      : 'N/A';
                    return (
                      <Box
                        key={loc.id}
                        p={4}
                        bg="white"
                        borderRadius="xl"
                        cursor="pointer"
                        _hover={{ transform: 'translateY(-5px)', boxShadow: 'md' }}
                        onClick={() => navigate(`/mappingdetail/${loc.id}`)}
                        transition="all 0.3s"
                        boxShadow="sm"
                      >
                        <HStack spacing={4}>
                          <Image
                            src={loc.imageUrl || '/Uploads/placeholder.jpg'}
                            alt={loc.name}
                            boxSize="60px"
                            objectFit="cover"
                            borderRadius="md"
                          />
                          <VStack align="start" spacing={1}>
                            <Text
                              fontWeight="bold"
                              fontSize="md"
                              color={textColor}
                              noOfLines={1}
                              bgGradient="linear(to-r, blue.700, blue.500)"
                              bgClip="text"
                            >
                              {loc.name}
                            </Text>
                            <HStack spacing={1} fontSize="sm" color="gray.600">
                              <FaMapLocationDot color={accentColor} />
                              <Text>{shortCoords}</Text>
                            </HStack>
                          </VStack>
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              )}
            </Box>
          )}

          {/* Map View */}
          {(isDesktop || isMapView) && (
            <Box flex="1" position="relative" h="100%">
              {userPosition && closestLocation && (
                <Box
                  position="absolute"
                  top={{ base: '10px', md: '10px' }}
                  right={{ base: '10px', md: '10px' }}
                  bg="white"
                  zIndex="999"
                  m={{ base: 2, md: 4 }}
                  p={{ base: 3, md: 4 }}
                  borderRadius="xl"
                  boxShadow="sm"
                  maxW={{ base: '180px', md: '250px' }}
                  transition="all 0.3s"
                  _hover={{ transform: 'translateY(-5px)', boxShadow: 'md' }}
                >
                  <VStack align="start" spacing={2}>
                    <Text
                      fontSize={textSize}
                      fontWeight="bold"
                      color={textColor}
                      bgGradient="linear(to-r, blue.700, blue.500)"
                      bgClip="text"
                    >
                      สถานที่ที่ใกล้ที่สุด
                    </Text>
                    <Text
                      fontSize={textSize}
                      color="gray.800"
                      fontWeight="medium"
                      bg="blue.50"
                      px={3}
                      py={1}
                      borderRadius="md"
                      transition="background-color 0.2s"
                      _hover={{ bg: 'blue.100' }}
                      noOfLines={1}
                    >
                      {closestLocation.name}
                    </Text>
                    <Button
                      size={buttonSize}
                      colorScheme="blue"
                      bg={accentColor}
                      color="white"
                      mt={1}
                      onClick={() => {
                        const [lat, lng] = parseCoordinates(closestLocation.coordinates);
                        openDirectionsInGoogleMaps(lat, lng);
                      }}
                      borderRadius="full"
                      _hover={{ bg: '#2B6CB0', transform: 'scale(1.05)' }}
                      _active={{ bg: '#2A4365' }}
                      transition="all 0.2s"
                      w="full"
                    >
                      นำทาง
                    </Button>
                  </VStack>
                </Box>
              )}

              <MapContainer
                center={mapCenter}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <MapAdjuster
                  userPosition={userPosition}
                  locations={filteredLocations}
                  isMapView={isMapView}
                />
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="© OpenStreetMap contributors"
                />
                <ZoomControl position="bottomright" />
                {userPosition && (
                  <Marker position={userPosition} icon={userIcon}>
                    <Tooltip direction="top" offset={[0, -15]} opacity={1} permanent>
                      <span>คุณอยู่ตรงนี้</span>
                    </Tooltip>
                  </Marker>
                )}
                {filteredLocations.map((loc) => {
                  const coords = parseCoordinates(loc.coordinates);
                  if (coords[0] || coords[1]) {
                    return (
                      <Marker
                        key={loc.id}
                        position={coords}
                        icon={customIcon}
                        eventHandlers={{ click: () => navigate(`/mappingdetail/${loc.id}`) }}
                      >
                        <Tooltip direction="top" offset={[0, -15]} opacity={1} permanent>
                          <span>{loc.name}</span>
                        </Tooltip>
                      </Marker>
                    );
                  }
                  return null;
                })}
              </MapContainer>
            </Box>
          )}
        </Flex>
      </Box>

      {/* Footer */}
      <Box
        as="footer"
        textAlign="center"
        py={{ base: '3', md: '4' }}
        bg="white"
        borderTop="1px solid"
        borderColor="gray.200"
        mt={{ base: '8', md: '10' }}
      >
        <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.700" textAlign="center">
          © {new Date().getFullYear()} Clean Water Monitoring | CS-KMUTNB, All rights reserved
        </Text>
        <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.700" textAlign="center">
          King Mongkut's University of Technology North Bangkok (KMUTNB)
        </Text>
      </Box>
    </Box>
  );
}

export default Mapping;