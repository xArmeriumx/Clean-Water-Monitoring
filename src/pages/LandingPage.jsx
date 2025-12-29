import React, { useMemo, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Container,
  Flex,
  SimpleGrid,
  Icon,
  Image,
  HStack,
  Divider,
  useColorModeValue,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaWater, FaMapLocationDot, FaClock, FaChartLine, FaDroplet } from 'react-icons/fa6'; // เปลี่ยน FaMapMarkedAlt เป็น FaMapLocationDot
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

/** ===== Hook สำหรับตรวจสอบการตั้งค่า prefers-reduced-motion ===== */
function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = () => setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

const LandingPage = () => {
  const navigate = useNavigate();

  // กำหนดสีพื้นหลังและสีตัวอักษร
  const bgColor = useColorModeValue('#F7FAFC', '#E2E8F0');
  const textColor = useColorModeValue('gray.900', 'gray.200');
  const accentColor = '#2c75b9';
  const gradientBg = `linear-gradient(135deg, ${accentColor} 0%, #4a9ce8 100%)`;

  // ตรวจสอบ breakpoints และ prefers-reduced-motion
  const isMobile = useBreakpointValue({ base: true, md: false });
  const prefersReducedMotion = usePrefersReducedMotion();
  const disableAnimations = isMobile || prefersReducedMotion;

  // ตั้งค่า Carousel (react-slick) ด้วย useMemo เพื่อคำนวณเฉพาะเมื่อ isMobile เปลี่ยนแปลง
  const carouselSettings = useMemo(() => {
    const baseSettings = {
      dots: true,
      infinite: true,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: true,
      autoplay: true,
      autoplaySpeed: 3000,
      pauseOnHover: true,
    };
    return isMobile
      ? { ...baseSettings, arrows: false, dots: true }
      : baseSettings;
  }, [isMobile]);

  // รายการภาพที่ใช้ใน Carousel
  const images = useMemo(
    () => [
      '/Pic-800x450.webp', // LCP image (ไม่ใช้ lazy load)
      '/Pic2-800x450.webp',
      '/Pic5-800x450.webp',
    ],
    []
  );

  // Handler สำหรับเข้าสู่ระบบ
  const handleLogin = () => {
    navigate('/appforuser');
  };

  return (
    <>
      {/* SEO & Head */}
      <Helmet>
        <title>Clean Water Monitoring - ระบบ IoT ตรวจวัดคุณภาพน้ำ | IoT CS-KMUTNB</title>
        <meta
          name="description"
          content="IoT CS-KMUTNB Project : ระบบตรวจวัดคุณภาพน้ำอัจฉริยะผ่าน LINE LIFF ติดตามผลเรียลไทม์ด้วยเทคโนโลยี IoT พร้อมแดชบอร์ดและแผนที่จุดบริการน้ำสะอาดจาก CS-KMUTNB"
        />
        <meta
          name="keywords"
          content="IoT KMUTNB, water quality monitoring, clean water, LINE LIFF, ระบบตรวจวัดน้ำ, คุณภาพน้ำ, แดชบอร์ด, แผนที่เรียลไทม์, CS-KMUTNB, Smart Water Monitoring, IoT project KMUTNB, Environmental Monitoring, real-time sensor data, water sensor monitoring, CS-KMUTNB project"
        />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="CS-KMUTNB" />
        <link
          rel="preload"
          as="image"
          href="/Pic-800x450.webp"
          type="image/webp"
        />
        <meta
          property="og:title"
          content="Clean Water Monitoring - ระบบตรวจวัดคุณภาพน้ำ | IoT CS-KMUTNB"
        />
        <meta
          property="og:description"
          content="IoT KMUTNB: ระบบตรวจวัดคุณภาพน้ำเรียลไทม์ด้วยเทคโนโลยี IoT จาก CS-KMUTNB พร้อมแดชบอร์ดและแผนที่จุดบริการน้ำสะอาด"
        />
        <meta
          property="og:image"
          content="https://cleanwatermonitoring.com/logo.png"
        />
        <meta property="og:url" content="https://cleanwatermonitoring.com" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="IoT KMUTNB | Clean Water Monitoring - ระบบตรวจวัดคุณภาพน้ำ"
        />
        <meta
          name="twitter:description"
          content="IoT KMUTNB: ระบบตรวจวัดคุณภาพน้ำผ่าน LINE LIFF ติดตามผลเรียลไทม์ด้วย IoT จาก CS-KMUTNB พร้อมแดชบอร์ดและแผนที่"
        />
        <meta
          name="twitter:image"
          content="https://cleanwatermonitoring.com/logo.png"
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Project",
            "name": "Clean Water Monitoring",
            "url": "https://cleanwatermonitoring.com",
            "logo": "https://cleanwatermonitoring.com/logo.png",
            "description":
              "IoT KMUTNB: ระบบตรวจวัดคุณภาพน้ำอัจฉริยะผ่าน LINE LIFF ติดตามผลเรียลไทม์ด้วยเทคโนโลยี IoT พร้อมแดชบอร์ดและแผนที่จุดบริการน้ำสะอาดจาก CS-KMUTNB",
            "creator": {
              "@type": "Organization",
              "name": "CS-KMUTNB",
              "url": "https://www.kmutnb.ac.th",
            },
            "keywords": "IoT KMUTNB, water quality monitoring, clean water, LINE LIFF, real-time monitoring",
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "email": "s6404062610405@email.kmutnb.ac.th",
            },
          })}
        </script>
        <link rel="canonical" href="https://cleanwatermonitoring.com" />
      </Helmet>

      <Box as="main" bg={bgColor} minH="100vh" position="relative" overflow="hidden">
        {/* Decorative Background */}
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
          as="header"
          bgGradient="linear(to-r, #f7fcff, #ebf8ff)"// เพิ่มพื้นหลังแบบไล่เฉดโทนน้ำเงินอ่อน
          boxShadow="sm"
          py={{ base: 3, md: 4 }}
          px={{ base: 4, md: 6 }}
          position="sticky"
          top={0}
          zIndex={10}
          justify="space-between"
          align="center"
          overflow="hidden"
        >
          {/* เพิ่มไอคอนหยดน้ำเป็นพื้นหลังตกแต่ง */}
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
          <HStack spacing={{ base: 2, md: 3 }} zIndex={1}>
            <Box position="relative">
              <Image
                src="/logo.png"
                alt="Logo"
                boxSize={{ base: '40px', md: '50px' }} // เพิ่มขนาดโลโก้
                borderRadius="full"
                border="2px solid"
                borderColor="blue.400" // เพิ่มกรอบสีน้ำเงินอ่อน
                _hover={{
                  transform: disableAnimations ? 'none' : 'scale(1.1)', // เพิ่มการเคลื่อนไหว
                  transition: 'transform 0.3s',
                }}
              />
            </Box>
            <VStack align="start" spacing={0}>
              <Text
                fontSize={{ base: 'lg', md: 'xl' }}
                fontWeight="bold"
                bgGradient="linear(to-r, blue.800, blue.600)" // ใช้สีไล่เฉดเหมือนหัวข้ออื่น
                bgClip="text"
              >
                Clean Water Monitoring
              </Text>
              <Text
                fontSize={{ base: 'xs', md: 'sm' }}
                color="blue.600" // ใช้สีน้ำเงินเพื่อสื่อถึงน้ำ
                fontWeight="medium"
              >
                IoT Monitoring Project
              </Text>
            </VStack>
          </HStack>
          <Button
            colorScheme="blue"
            bg={accentColor}
            color="white"
            _hover={{ bg: '#2B6CB0', transform: 'scale(1.05)' }}
            _active={{ bg: '#2A4365' }}
            size={{ base: 'sm', md: 'md' }}
            borderRadius="full"
            onClick={handleLogin}
          >
            เข้าสู่ระบบผ่าน LINE
          </Button>
        </Flex>

        {/* Main Hero Content */}
        <Container maxW="container.xl" py={{ base: 8, md: 16 }} position="relative" zIndex={1}>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            align="center"
            justify="space-between"
            minH={{ base: 'auto', md: '70vh' }}
          >
            {/* Left: Text Content */}
            <VStack
              spacing={{ base: 4, md: 8 }}
              align={{ base: 'center', md: 'flex-start' }}
              textAlign={{ base: 'center', md: 'left' }}
              maxW={{ base: '100%', md: '40%' }}
            >
              <Heading
                as="h1"
                size={{ base: 'lg', md: '2xl', lg: '3xl' }}
                fontWeight="extrabold"
                color={textColor}
                bgGradient="linear(to-r, blue.700, blue.500)"
                bgClip="text"
              >
                ตรวจวัดคุณภาพน้ำอัจฉริยะ
              </Heading>
              <Text fontSize={{ base: 'sm', md: 'md', lg: 'lg' }} color="gray.600">
                ระบบตรวจวัดคุณภาพน้ำทันสมัยผ่าน LINE LIFF ติดตามผลแบบเรียลไทม์
                โดยใช้เทคโนโลยี IoT พร้อมแดชบอร์ดที่ใช้งานง่าย
                และแผนที่จุดบริการน้ำสะอาด
              </Text>
              <Button
                colorScheme="blue"
                size={{ base: 'md', md: 'lg' }}
                bg={accentColor}
                color="white"
                _hover={{ bg: '#2B6CB0', transform: 'scale(1.05)' }}
                _active={{ bg: '#2A4365' }}
                borderRadius="full"
                onClick={handleLogin}
              >
                เริ่มต้นใช้งานทันที
              </Button>
            </VStack>

            {/* Right: Carousel (react-slick) */}
            <Box maxW={{ base: '100%', md: '55%' }} mt={{ base: 6, md: 0 }} w="100%">
              <Slider
                {...carouselSettings}
                aria-label="Image Carousel"
                role="region"
                aria-roledescription="carousel"
                aria-live="off"
              >
                {images.map((image, index) => {
                  const isLCP = index === 0;
                  return (
                    <Box key={index} px={{ base: 1, md: 2 }}>
                      <picture>
                        <source
                          srcSet={`
                            ${image.replace('800x450', '200x112')} 200w,
                            ${image.replace('800x450', '400x225')} 400w,
                            ${image} 800w
                          `}
                          type="image/webp"
                        />
                        <Image
                          src={image.replace('.webp', '.png')}
                          srcSet={`
                            ${image.replace('800x450', '200x112').replace('.webp', '.png')} 200w,
                            ${image.replace('800x450', '400x225').replace('.webp', '.png')} 400w,
                            ${image.replace('.webp', '.png')} 800w
                          `}
                          sizes="(max-width: 400px) 200px, (max-width: 800px) 400px, 800px"
                          alt={`ภาพตัวอย่างระบบตรวจวัดน้ำ - สไลด์ที่ ${index + 1}`}
                          width={800}
                          height={450}
                          style={{ aspectRatio: '16/9' }}
                          borderRadius="xl"
                          boxShadow="md"
                          maxW="100%"
                          h={{ base: '200px', md: '300px', lg: '450px' }}
                          objectFit="cover"
                          loading={isLCP ? undefined : 'lazy'}
                          _hover={{
                            transform: disableAnimations ? 'none' : 'scale(1.02)',
                            transition: 'all 0.3s',
                          }}
                        />
                      </picture>
                    </Box>
                  );
                })}
              </Slider>
            </Box>
          </Flex>

          {/* Features Section */}
          <Box mt={{ base: 8, md: 16 }}>
            <Heading
              as="h2"
              size={{ base: 'md', md: 'lg' }}
              textAlign="center"
              color={textColor}
              mb={{ base: 6, md: 8 }}
              bgGradient="linear(to-r, blue.700, blue.500)"
              bgClip="text"
            >
              ทำไมต้องเลือก Clean Water Monitoring?
            </Heading>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={{ base: 4, md: 6 }}>
              <Box
                bg="white"
                p={{ base: 4, md: 6 }}
                borderRadius="xl"
                boxShadow="sm"
                textAlign="center"
                _hover={{
                  transform: disableAnimations ? 'none' : 'translateY(-5px)',
                  boxShadow: 'md',
                }}
                transition="all 0.3s"
              >
                <Icon as={FaWater} w={{ base: 8, md: 10 }} h={{ base: 8, md: 10 }} color={accentColor} mb={4} />
                <Text fontWeight="bold" fontSize={{ base: 'md', md: 'lg' }} color={textColor}>
                  ตรวจวัดแม่นยำ
                </Text>
                <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.600" mt={2}>
                  เซ็นเซอร์ให้ผลลัพธ์ที่เชื่อถือได้
                </Text>
              </Box>
              <Box
                bg="white"
                p={{ base: 4, md: 6 }}
                borderRadius="xl"
                boxShadow="sm"
                textAlign="center"
                _hover={{
                  transform: disableAnimations ? 'none' : 'translateY(-5px)',
                  boxShadow: 'md',
                }}
                transition="all 0.3s"
              >
                <Icon as={FaChartLine} w={{ base: 8, md: 10 }} h={{ base: 8, md: 10 }} color={accentColor} mb={4} />
                <Text fontWeight="bold" fontSize={{ base: 'md', md: 'lg' }} color={textColor}>
                  แดชบอร์ดเรียลไทม์
                </Text>
                <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.600" mt={2}>
                  ติดตามข้อมูลน้ำแบบเรียลไทม์
                </Text>
              </Box>
              <Box
                bg="white"
                p={{ base: 4, md: 6 }}
                borderRadius="xl"
                boxShadow="sm"
                textAlign="center"
                _hover={{
                  transform: disableAnimations ? 'none' : 'translateY(-5px)',
                  boxShadow: 'md',
                }}
                transition="all 0.3s"
              >
                <Icon as={FaMapLocationDot} w={{ base: 8, md: 10 }} h={{ base: 8, md: 10 }} color={accentColor} mb={4} /> {/* เปลี่ยนจาก FaMapMarkedAlt */}
                <Text fontWeight="bold" fontSize={{ base: 'md', md: 'lg' }} color={textColor}>
                  แผนที่จุดบริการ
                </Text>
                <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.600" mt={2}>
                  ค้นหาจุดบริการน้ำสะอาดใกล้คุณ
                </Text>
              </Box>
              <Box
                bg="white"
                p={{ base: 4, md: 6 }}
                borderRadius="xl"
                boxShadow="sm"
                textAlign="center"
                _hover={{
                  transform: disableAnimations ? 'none' : 'translateY(-5px)',
                  boxShadow: 'md',
                }}
                transition="all 0.3s"
              >
                <Icon as={FaClock} w={{ base: 8, md: 10 }} h={{ base: 8, md: 10 }} color={accentColor} mb={4} />
                <Text fontWeight="bold" fontSize={{ base: 'md', md: 'lg' }} color={textColor}>
                  รวดเร็วทันใจ
                </Text>
                <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.600" mt={2}>
                  ผลลัพธ์ทันทีผ่าน LINE Official Account
                </Text>
              </Box>
            </SimpleGrid>
          </Box>

          {/* CTA Section */}
          <Box mt={{ base: 8, md: 16 }} textAlign="center">
            <Divider mb={{ base: 6, md: 8 }} />
            <Heading
              as="h2"
              size={{ base: 'md', md: 'lg' }}
              color={textColor}
              mb={4}
              bgGradient="linear(to-r, blue.700, blue.500)"
              bgClip="text"
            >
              พร้อมดูแลคุณภาพน้ำของคุณแล้วหรือยัง?
            </Heading>
            <Text fontSize={{ base: 'sm', md: 'lg' }} color="gray.600" mb={6}>
              เข้าร่วมกับผู้ใช้ที่ไว้วางใจ Clean Water Monitoring
            </Text>
            <Button
              colorScheme="blue"
              size={{ base: 'md', md: 'lg' }}
              bg={accentColor}
              color="white"
              _hover={{ bg: '#2B6CB0', transform: 'scale(1.05)' }}
              _active={{ bg: '#2A4365' }}
              borderRadius="full"
              onClick={handleLogin}
            >
              เริ่มต้นใช้งาน
            </Button>
          </Box>
        </Container>

        {/* Footer */}
        <Box
          as="footer"
          textAlign="center"
          py={{ base: 3, md: 4 }}
          bg="white"
          borderTop="1px solid"
          borderColor="gray.200"
          mt={{ base: 8, md: 10 }}
        >
          <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.700" textAlign="center">
            © {new Date().getFullYear()} Clean Water Monitoring | CS-KMUTNB , All rights reserved
          </Text>
          <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.700" textAlign="center">
            King Mongkut’s University of Technology North Bangkok (KMUTNB)
          </Text>
        </Box>
      </Box>
    </>
  );
};

export default LandingPage;