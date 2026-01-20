import React, { useState, useMemo, useCallback } from "react";
import { apiGet } from "../../utils/api";
import { useParams, useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Box,
  Text,
  Select,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Badge,
  IconButton,
  Button,
  useBreakpointValue,
  Skeleton,
  SkeletonText,
  Input, // Added for Chakra UI date picker
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { useAuth } from "../../auth/AuthContext";
import { useQuery } from "@tanstack/react-query";

// Register Chart.js components
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
);

function createChartData(label, data, labels) {
  return {
    labels: labels || [],
    datasets: [
      {
        label,
        data: data || [],
        borderColor: "#3182CE",
        backgroundColor: "rgba(49, 130, 206, 0.1)",
        pointBackgroundColor: "#3182CE",
        pointBorderColor: "#3182CE",
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
        fill: true,
      },
    ],
  };
}

function chartOptions(isMobile, title, unit) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top", labels: { color: "#2D3748" } },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: (context) =>
            `${context.dataset.label}: ${context.raw} ${unit}`,
        },
      },
      title: {
        display: true,
        text: title,
        color: "#2D3748",
        font: { size: isMobile ? 12 : 14 },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: { size: isMobile ? 10 : 12 },
          color: "#2D3748",
          maxTicksLimit: 7,
          autoSkip: true,
        },
        grid: { display: false },
      },
      y: {
        grid: { drawBorder: true, color: "rgba(200, 200, 200, 0.2)" },
        ticks: {
          font: { size: isMobile ? 10 : 12 },
          color: "#2D3748",
          callback: (value) => `${value} ${unit}`,
        },
        min:
          title.includes("TDS") || title.includes("Turbidity") ? 0 : undefined,
      },
    },
  };
}

function Servicedetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { user } = useAuth();

  const [filterConfig, setFilterConfig] = useState({
    type: "24h",
    startDate: null,
    endDate: null,
    customRange: false,
  });

  // State for time threshold (in minutes)
  const [timeThreshold, setTimeThreshold] = useState(60); // Default: 60 minutes

  const {
    data: locationData,
    isLoading: isLocationLoading,
    error: locationError,
  } = useQuery({
    queryKey: ["location", id],
    queryFn: async () => {
      const res = await apiGet(`/api/locations/${id}`);
      if (!res.ok) throw new Error("Failed to fetch location data");
      return res.json();
    },
    enabled: !!id,
    refetchInterval: 10000, // รีเฟรชทุก 10 วินาที
    staleTime: 0, // ไม่ใช้ cache
    gcTime: 0, // ไม่เก็บ cache
    refetchOnWindowFocus: true,
  });

  const {
    data: logsData,
    isLoading: isLogsLoading,
    error: logsError,
  } = useQuery({
    queryKey: ["logs", id],
    queryFn: async () => {
      const res = await apiGet(`/api/locations/${id}/logs`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
    enabled: !!id,
    refetchInterval: 10000, // รีเฟรชทุก 10 วินาที
    staleTime: 0, // ไม่ใช้ cache
    gcTime: 0, // ไม่เก็บ cache
    refetchOnWindowFocus: true,
  });

  const {
    data: issuesData,
    isLoading: isIssuesLoading,
    error: issuesError,
  } = useQuery({
    queryKey: ["issues", id],
    queryFn: async () => {
      const res = await apiGet(`/api/locations/${id}/issues`);
      if (!res.ok) throw new Error("Failed to fetch issues");
      return res.json();
    },
    enabled: !!id,
    refetchInterval: 30000, // รีเฟรชทุก 30 วินาที
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
  });

  const isLoading = isLocationLoading || isLogsLoading || isIssuesLoading;
  const error = locationError || logsError || issuesError;

  const serviceData = useMemo(() => {
    if (!logsData) return null;
    return {
      data: {
        ph: logsData.map((item) => item.ph ?? null),
        tds: logsData.map((item) => {
          const v = item.tds ?? null;
          return v !== null && v < 0 ? 0 : v;
        }),
        turbidity: logsData.map((item) => {
          const v = item.turbidity ?? null;
          return v !== null && v < 0 ? 0 : v;
        }),
        temp: logsData.map((item) => item.temperature ?? null),
        timestamps: logsData.map((item) => new Date(item.timestamp)),
      },
    };
  }, [logsData]);

  const filterData = useCallback(() => {
    if (!serviceData)
      return {
        data: {
          ph: [],
          tds: [],
          turbidity: [],
          temp: [],
          timestamps: [],
          labels: [],
        },
      };
    const { ph, tds, turbidity, temp, timestamps } = serviceData.data;
    const now = new Date();
    let start, end;
    switch (filterConfig.type) {
      case "24h":
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        end = now;
        break;
      case "1w":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        end = now;
        break;
      case "1m":
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        end = now;
        break;
      case "1y":
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        end = now;
        break;
      case "custom":
        if (!filterConfig.startDate || !filterConfig.endDate)
          return {
            data: {
              ph: [],
              tds: [],
              turbidity: [],
              temp: [],
              timestamps: [],
              labels: [],
            },
          };
        start = filterConfig.startDate;
        end = new Date(filterConfig.endDate);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        start = new Date(0);
        end = now;
    }
    const idxs = timestamps
      .map((t, i) => (t >= start && t <= end ? i : -1))
      .filter((i) => i !== -1);
    return {
      data: {
        ph: idxs.map((i) => ph[i]),
        tds: idxs.map((i) => tds[i]),
        turbidity: idxs.map((i) => turbidity[i]),
        temp: idxs.map((i) => temp[i]),
        timestamps: idxs.map((i) => timestamps[i]),
        labels: idxs.map((i) =>
          timestamps[i].toLocaleString("th-TH", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        ),
      },
    };
  }, [serviceData, filterConfig]);

  const filteredData = filterData();

  const chartConfigs = [
    {
      data: createChartData(
        "pH Levels",
        filteredData.data.ph,
        filteredData.data.labels,
      ),
      title: "pH Levels",
      unit: "",
    },
    {
      data: createChartData(
        "TDS (ppm)",
        filteredData.data.tds,
        filteredData.data.labels,
      ),
      title: "TDS (ppm)",
      unit: "ppm",
    },
    {
      data: createChartData(
        "Turbidity (NTU)",
        filteredData.data.turbidity,
        filteredData.data.labels,
      ),
      title: "Turbidity (NTU)",
      unit: "NTU",
    },
    {
      data: createChartData(
        "Temperature (°C)",
        filteredData.data.temp,
        filteredData.data.labels,
      ),
      title: "Temperature (°C)",
      unit: "°C",
    },
  ];

  const deviceStatus = useMemo(() => {
    const now = new Date();
    const timeThresholdMs = timeThreshold * 60 * 1000; // Convert minutes to milliseconds
    const timestamps = filteredData.data.timestamps;
    const lastTimestamp = timestamps[timestamps.length - 1];
    const isRecent =
      lastTimestamp && now - new Date(lastTimestamp) <= timeThresholdMs;
    return {
      name: "Device",
      status: isRecent ? "Active" : "Offline",
    };
  }, [filteredData, timeThreshold]);

  const issuesCount = issuesData?.length || 0;
  const locationName = locationData?.name || `Location ${id}`;

  const handleViewIssues = () => navigate(`/adminissues?locationId=${id}`);
  const handleFilterChange = (v) =>
    setFilterConfig((fc) => ({
      ...fc,
      type: v,
      customRange: v === "custom",
      ...(v !== "custom" ? { startDate: null, endDate: null } : {}),
    }));

  if (isLoading) {
    return (
      <VStack
        spacing={6}
        p={{ base: 4, md: 6 }}
        align="stretch"
        maxW="1200px"
        mx="auto"
      >
        <HStack justify="space-between" w="full">
          <HStack>
            <Skeleton boxSize="40px" />
            <Skeleton w="200px" h="32px" />
          </HStack>
          <Skeleton w="120px" h="36px" />
        </HStack>
        <Card bg="white" borderRadius="lg" boxShadow="sm">
          <CardHeader>
            <Skeleton w="150px" h="28px" />
          </CardHeader>
          <CardBody>
            <HStack spacing={4} wrap="wrap">
              <HStack>
                <Skeleton w="100px" h="20px" />
                <Skeleton w="60px" h="20px" borderRadius="full" />
              </HStack>
            </HStack>
          </CardBody>
        </Card>
        <Box>
          <Skeleton w="100px" h="20px" mb={2} />
          <Skeleton
            w={{ base: "full", md: "200px" }}
            h="40px"
            borderRadius="md"
          />
        </Box>
        <VStack spacing={4} align="stretch">
          {Array(4)
            .fill()
            .map((_, i) => (
              <Skeleton key={i} h="300px" borderRadius="md" />
            ))}
        </VStack>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack minH="100vh" justify="center" color="red.500">
        <Text fontSize={{ base: "md", md: "lg" }}>Error: {error.message}</Text>
      </VStack>
    );
  }

  return (
    <VStack
      spacing={6}
      p={{ base: 4, md: 6 }}
      align="stretch"
      maxW="1200px"
      mx="auto"
    >
      {/* Header */}
      <HStack justify="space-between" w="full">
        <HStack>
          <IconButton
            icon={<ArrowBackIcon />}
            variant="ghost"
            aria-label="Go Back"
            onClick={() => navigate(-1)}
            size={{ base: "md", md: "lg" }}
          />
          <Heading size={{ base: "lg", md: "xl" }}>{locationName}</Heading>
        </HStack>
        <Button
          colorScheme="red"
          size={{ base: "sm", md: "md" }}
          onClick={handleViewIssues}
        >
          View Issues ({issuesCount})
        </Button>
      </HStack>

      {/* Device Status */}
      <Card bg="white" borderRadius="lg" boxShadow="sm">
        <CardHeader>
          <Heading size={{ base: "md", md: "lg" }}>Device Status</Heading>
        </CardHeader>
        <CardBody>
          <HStack spacing={4} wrap="wrap" align="center">
            <Text>
              Device:{" "}
              <Badge
                colorScheme={deviceStatus.status === "Active" ? "green" : "red"}
              >
                {deviceStatus.status}
              </Badge>
            </Text>
            {/* <Box>
              <Text mb={1}>Check within:</Text>
              <Select
                value={timeThreshold}
                onChange={(e) => setTimeThreshold(Number(e.target.value))}
                maxW="150px"
              >
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={120}>2 Hours</option>
              </Select>
            </Box> */}
          </HStack>
        </CardBody>
      </Card>

      {/* Filter */}
      <Box>
        <Text mb={2}>Filter Data By:</Text>
        <Select
          value={filterConfig.type}
          onChange={(e) => handleFilterChange(e.target.value)}
          maxW="200px"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="1w">Last 1 Week</option>
          <option value="1m">Last 1 Month</option>
          <option value="1y">Last 1 Year</option>
          <option value="custom">Custom Range</option>
        </Select>
        {filterConfig.type === "custom" && (
          <HStack mt={4} spacing={4}>
            <Box>
              <Text mb={1}>Start Date:</Text>
              <Input
                type="date"
                value={
                  filterConfig.startDate
                    ? filterConfig.startDate.toISOString().slice(0, 10)
                    : ""
                }
                onChange={(e) =>
                  setFilterConfig((fc) => ({
                    ...fc,
                    startDate: e.target.value ? new Date(e.target.value) : null,
                  }))
                }
                max={
                  filterConfig.endDate
                    ? filterConfig.endDate.toISOString().slice(0, 10)
                    : undefined
                }
              />
            </Box>
            <Box>
              <Text mb={1}>End Date:</Text>
              <Input
                type="date"
                value={
                  filterConfig.endDate
                    ? filterConfig.endDate.toISOString().slice(0, 10)
                    : ""
                }
                onChange={(e) =>
                  setFilterConfig((fc) => ({
                    ...fc,
                    endDate: e.target.value ? new Date(e.target.value) : null,
                  }))
                }
                min={
                  filterConfig.startDate
                    ? filterConfig.startDate.toISOString().slice(0, 10)
                    : undefined
                }
              />
            </Box>
          </HStack>
        )}
      </Box>

      {/* Graphs */}
      <VStack spacing={6} align="stretch">
        {chartConfigs.map((cfg, idx) => (
          <Card
            key={idx}
            bg="white"
            borderRadius="lg"
            boxShadow="sm"
            w="100%"
            h={{ base: "350px", md: "450px" }}
          >
            <CardHeader>
              <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold">
                {cfg.title}
              </Text>
            </CardHeader>
            <CardBody p={0} h="full">
              <Box h="100%">
                <Line
                  data={cfg.data}
                  options={chartOptions(isMobile, cfg.title, cfg.unit)}
                />
              </Box>
            </CardBody>
          </Card>
        ))}
      </VStack>
    </VStack>
  );
}

export default Servicedetail;
