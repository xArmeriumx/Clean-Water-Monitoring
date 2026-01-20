import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChakraProvider,
  Box,
  Flex,
  Text,
  Center,
  useToast,
  Skeleton,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthContext";
import { apiGet } from "../../utils/api";

// Reusable Components
import { AdminLayout } from "../../components/layout";
import { StatCard, LocationCard } from "../../components/ui";

function hasValueChanged(current, previous) {
  return (
    current?.ph !== previous?.ph ||
    current?.tds !== previous?.tds ||
    current?.turbidity !== previous?.turbidity ||
    current?.temp !== previous?.temp
  );
}

async function fetchLocations() {
  const res = await apiGet("/api/locations?detail=full");
  if (!res.ok) throw new Error("Failed to fetch locations");
  return res.json();
}

async function fetchIssuesCount() {
  const res = await apiGet("/api/issues/total");
  if (!res.ok) throw new Error("Failed to fetch issues count");
  return res.json();
}

function Dashboard() {
  const [previousData, setPreviousData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const toast = useToast();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const {
    data: locationsData,
    isLoading: isLocLoading,
    isError: isLocError,
    error: locError,
  } = useQuery({
    queryKey: ["locations"],
    queryFn: fetchLocations,
    refetchInterval: 10000, // รีเฟรชทุก 10 วินาที
    staleTime: 5000, // ข้อมูลถือว่า fresh 5 วินาที
    enabled: true,
  });

  const {
    data: issuesData,
    isLoading: isIssuesLoading,
    isError: isIssuesError,
    error: issuesError,
  } = useQuery({
    queryKey: ["issuesCount"],
    queryFn: fetchIssuesCount,
    refetchInterval: 30000, // issues ไม่ต้องบ่อย
    staleTime: 10000,
    enabled: true,
  });

  const loading = isLocLoading || isIssuesLoading;
  const error = isLocError || isIssuesError ? locError || issuesError : null;

  const formattedData = useMemo(() => {
    if (!locationsData) return [];
    return locationsData.map((loc) => {
      const s = loc.sensors || {};
      return {
        id: loc.id,
        location: loc.name,
        ph: s.ph ?? "N/A",
        tds: s.tds ?? "N/A",
        turbidity: s.turbidity ?? "N/A",
        temp: s.temperature ?? "N/A",
        lastUpdate: s.timestamp
          ? new Date(s.timestamp).toLocaleString("th-TH")
          : "N/A",
      };
    });
  }, [locationsData]);

  useEffect(() => {
    if (formattedData.length > 0) {
      setPreviousData(formattedData);
    }
  }, [formattedData]);

  const issuesCount = issuesData?.total || 0;

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: String(error),
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    }
  }, [error, toast]);

  const filteredLocations = useMemo(() => {
    return formattedData.filter((item) =>
      item.location.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [formattedData, searchTerm]);

  // Loading State
  if (loading) {
    return (
      <AdminLayout title="Dashboard" searchValue="" onSearchChange={() => {}}>
        <Flex gap={4} mt={6} flexWrap="wrap">
          {Array(3)
            .fill()
            .map((_, i) => (
              <Box
                key={i}
                flex="1"
                minW={{ base: "150px", md: "200px" }}
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
        <Box mt={6}>
          <Skeleton height="24px" width="150px" mb={4} />
          {Array(3)
            .fill()
            .map((_, i) => (
              <Box
                key={i}
                bg="white"
                borderRadius="lg"
                boxShadow="sm"
                p={4}
                mb={3}
              >
                <Skeleton height="24px" width="200px" mb={3} />
                <Skeleton height="60px" />
              </Box>
            ))}
        </Box>
      </AdminLayout>
    );
  }

  // Error State
  if (error) {
    return (
      <ChakraProvider>
        <Center minH="100vh" bg="gray.50">
          <Text color="red.500" fontSize="lg">
            เกิดข้อผิดพลาดในการโหลดข้อมูล
          </Text>
        </Center>
      </ChakraProvider>
    );
  }

  return (
    <AdminLayout
      title="Dashboard"
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
    >
      {/* Stats Cards */}
      <Flex gap={4} mt={6} flexWrap="wrap">
        <StatCard
          value={filteredLocations.length}
          label="จุดให้บริการการตรวจวัด"
          borderColor="blue.500"
          valueColor="blue.600"
        />
        <StatCard
          value={issuesCount}
          label="เรื่องแจ้งจากผู้ใช้"
          borderColor="orange.500"
          valueColor="orange.600"
          onClick={() => navigate("/adminissues")}
        />
        <StatCard
          value={12}
          label="ผู้ใช้งานทั้งหมด"
          borderColor="purple.500"
          valueColor="purple.600"
        />
      </Flex>

      {/* Locations List */}
      <Box mt={6}>
        <Text fontSize="lg" fontWeight="bold" color="gray.800" mb={4}>
          จุดให้บริการ
        </Text>
        {filteredLocations.map((item, index) => {
          const prev = previousData.find((p) => p.id === item.id);
          const rowChanged = prev ? hasValueChanged(item, prev) : false;

          return (
            <LocationCard
              key={item.id}
              index={index + 1}
              name={item.location}
              lastUpdate={item.lastUpdate}
              sensors={{
                ph: item.ph,
                tds: item.tds,
                turbidity: item.turbidity,
                temp: item.temp,
              }}
              highlighted={rowChanged}
              onClick={() => navigate(`/servicedetail/${item.id}`)}
            />
          );
        })}
      </Box>
    </AdminLayout>
  );
}

export default Dashboard;
