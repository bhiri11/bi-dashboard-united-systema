import React, { useEffect, useMemo, useState } from "react";

import {
  Box,
  Flex,
  Grid,
  Progress,
  Spinner,
  Tag,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import Card from "components/card/Card.js";
import LineChart from "components/charts/LineChart";
import { useSearch } from "contexts/SearchContext";

const apiBaseUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function KPIStatCard({ item, tone }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const subTextColor = useColorModeValue("secondaryGray.600", "whiteAlpha.700");
  const cardBg = useColorModeValue("white", "navy.700");
  const borderColor = useColorModeValue("secondaryGray.100", "whiteAlpha.100");

  const isAvailable = item?.status === "ok" || item?.status === "normal" || 
                      item?.status === "low" || item?.status === "high" || 
                      item?.status === "critical" || item?.status === "excellent" ||
                      item?.status === "good" || item?.status === "poor";

  const value = isAvailable
    ? item?.metric_name === "Average Cost per Filled Position"
      ? `${Number(item?.average_cost || 0).toFixed(2)}`
      : item?.metric_name === "Average Cost per Project"
        ? `${Number(item?.average_cost || 0).toFixed(2)}`
      : item?.metric_name === "Remaining Budget"
        ? `${Number(item?.remaining_budget || 0).toFixed(2)}`
      : `${Number(item?.value || 0).toFixed(2)}`
    : "Unavailable";

  const details = isAvailable
    ? item?.metric_name === "Average Cost per Filled Position"
      ? `Based on ${item?.filled_positions || 0} filled positions`
      : item?.metric_name === "Average Cost per Project"
        ? `Across ${item?.project_count || 0} projects`
      : item?.metric_name === "Remaining Budget"
        ? `${item?.spent_percentage || 0}% of budget spent`
      : item?.details || ''
    : `Missing: ${(item?.required_fields || []).join(', ')}`;

  const trendTone = isAvailable
    ? item?.metric_name === "Remaining Budget"
      ? Number(item?.remaining_budget || 0) > 0 ? 'green.500' : 'red.500'
      : 'green.500'
    : 'gray.500';

  const trendIcon = isAvailable ? '↑' : '';

  return (
    <Box
      p='18px'
      borderRadius='22px'
      border='1px solid'
      borderColor={borderColor}
      bg={cardBg}
      boxShadow='0px 16px 36px rgba(112, 144, 176, 0.12)'
      position='relative'
      overflow='hidden'>
      <Box position='absolute' top='0' left='0' right='0' h='4px' bg={tone} />

      <Flex justify='space-between' align='start' gap='12px' mb='14px'>
        <Box>
          <Text color={subTextColor} fontSize='xs' fontWeight='700' textTransform='uppercase' letterSpacing='0.08em'>
            Financial KPI
          </Text>
          <Text color={textColor} fontSize='lg' fontWeight='800' lineHeight='1.15' mt='6px'>
            {item?.metric_name}
          </Text>
          <Text color={subTextColor} fontSize='sm' mt='6px'>
            {item?.period || 'All time'}
          </Text>
        </Box>
        <Tag size='sm' borderRadius='full' bg='brand.50' color='brand.500' fontWeight='700'>
          KPI
        </Tag>
      </Flex>

      <Flex align='baseline' gap='8px' mb='8px'>
        <Text color={textColor} fontSize='34px' fontWeight='800' lineHeight='1'>
          {value}
        </Text>
        {trendIcon && (
          <Text color={trendTone} fontSize='lg' fontWeight='700'>
            {trendIcon}
          </Text>
        )}
      </Flex>

      <Text color={subTextColor} fontSize='sm' mb='12px'>
        {details}
      </Text>

      {isAvailable && item?.metric_name === "Remaining Budget" && (
        <Box>
          <Flex justify='space-between' mb='6px'>
            <Text color={subTextColor} fontSize='xs' fontWeight='700' textTransform='uppercase'>
              Budget Utilization
            </Text>
            <Text color={trendTone} fontSize='xs' fontWeight='700'>
              {item?.spent_percentage || 0}%
            </Text>
          </Flex>
          <Progress
            value={Number(item?.spent_percentage || 0)}
            size='sm'
            borderRadius='full'
            bg='secondaryGray.100'
            sx={{
              '& > div': {
                background: `linear-gradient(90deg, ${tone} 0%, #6AD2FF 100%)`,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}

function CostTrendChart({ item }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const subTextColor = useColorModeValue("secondaryGray.600", "whiteAlpha.700");
  const cardBg = useColorModeValue("white", "navy.700");
  const borderColor = useColorModeValue("secondaryGray.100", "whiteAlpha.100");

  const chartData = useMemo(() => item?.series || [], [item]);

  const chartOptions = useMemo(() => ({
    chart: {
      type: 'line',
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 700,
      },
    },
    colors: ['#4318FF'],
    tooltip: {
      enabled: true,
      theme: 'dark',
      y: {
        formatter: (value) => `${value.toFixed(2)} currency`,
      },
    },
    xaxis: {
      categories: item?.categories || [],
      labels: {
        show: true,
        style: {
          colors: '#A3AED0',
          fontSize: '11px',
          fontWeight: '500',
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      show: true,
      labels: {
        style: {
          colors: '#A3AED0',
          fontSize: '11px',
        },
      },
    },
    grid: {
      borderColor: 'rgba(163, 174, 208, 0.18)',
      show: true,
      strokeDashArray: 5,
    },
    stroke: {
      curve: 'smooth',
      width: 4,
    },
    markers: {
      size: 4,
      colors: ['#4318FF'],
      strokeColors: '#FFFFFF',
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    dataLabels: {
      enabled: false,
    },
    fill: {
      type: 'gradient',
      gradient: {
        type: 'vertical',
        opacityFrom: 0.95,
        opacityTo: 0.55,
        colorStops: [[
          { offset: 0, color: '#4318FF', opacity: 1 },
          { offset: 100, color: '#6AD2FF', opacity: 0.9 },
        ]],
      },
    },
  }), [item]);

  return (
    <Box
      p='20px'
      borderRadius='22px'
      border='1px solid'
      borderColor={borderColor}
      bg={cardBg}
      boxShadow='0px 16px 36px rgba(112, 144, 176, 0.12)'>
      <Flex align='start' justify='space-between' gap='12px' mb='14px' wrap='wrap'>
        <Box>
          <Text color={textColor} fontSize='lg' fontWeight='800' lineHeight='1.15'>
            {item?.metric_name}
          </Text>
          <Text color={subTextColor} fontSize='sm' mt='6px'>
            Monthly cost evolution over {item?.period_months || 12} months
          </Text>
        </Box>
        <Tag size='sm' borderRadius='full' bg='brand.50' color='brand.500' fontWeight='700'>
          Trend
        </Tag>
      </Flex>

      {item?.status === 'ok' || item?.status === 'normal' ? (
        <Box h='300px' mb='8px'>
          <LineChart chartData={chartData} chartOptions={chartOptions} />
        </Box>
      ) : (
        <Flex h='320px' align='center' justify='center' border='1px dashed' borderColor={borderColor} borderRadius='18px'>
          <Text color='orange.400' fontWeight='600'>
            Cost trend data is unavailable.
          </Text>
        </Flex>
      )}
    </Box>
  );
}

export default function FinancialSection({ dateFilter }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const subTextColor = useColorModeValue("secondaryGray.600", "whiteAlpha.700");
  const { searchTerm, selectedCategory } = useSearch();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  // Debounce 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const effectiveSearch = selectedCategory === 'financial' ? debouncedSearch : '';

    const buildUrl = (endpoint) => {
      const params = new URLSearchParams();
      if (dateFilter?.start_date) params.append('start_date', dateFilter.start_date);
      if (dateFilter?.end_date) params.append('end_date', dateFilter.end_date);
      if (effectiveSearch) params.append('search', effectiveSearch);
      const queryString = params.toString();
      return `${apiBaseUrl}${endpoint}${queryString ? '?' + queryString : ''}`;
    };

    const fetchMetrics = async () => {
      try {
        const [costPerPositionRes, costPerProjectRes, monthlyTrendRes, remainingBudgetRes] = await Promise.all([
          fetch(buildUrl('/api/kpi/financial/average-cost-per-filled-position')),
          fetch(buildUrl('/api/kpi/financial/average-cost-per-project')),
          fetch(buildUrl('/api/kpi/financial/monthly-cost-trend')),
          fetch(buildUrl('/api/kpi/financial/remaining-budget')),
        ]);

        const [costPerPositionData, costPerProjectData, monthlyTrendData, remainingBudgetData] = await Promise.all([
          costPerPositionRes.json(),
          costPerProjectRes.json(),
          monthlyTrendRes.json(),
          remainingBudgetRes.json(),
        ]);

        if (isMounted) {
          setItems([
            { ...costPerPositionData, title: 'Average Cost per Filled Position' },
            { ...costPerProjectData, title: 'Average Cost per Project' },
            { ...monthlyTrendData, title: 'Monthly Cost Trend' },
            { ...remainingBudgetData, title: 'Remaining Budget' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching financial metrics:', error);
        if (isMounted) {
          setItems([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMetrics();

    return () => {
      isMounted = false;
    };
  }, [dateFilter?.start_date, dateFilter?.end_date, debouncedSearch, selectedCategory]);

  return (
    <Card p='24px' align='start' direction='column' w='100%' overflow='hidden'>
      <Flex align='center' justify='space-between' gap='12px' w='100%' mb='18px' flexWrap='wrap'>
        <Box>
          <Text color={textColor} fontSize='2xl' fontWeight='800' lineHeight='100%'>
            Financial
          </Text>
          <Text color={subTextColor} fontSize='sm' fontWeight='500' mt='6px'>
            Track project costs, budget utilization, and financial performance metrics.
          </Text>
        </Box>
        <Tag size='sm' borderRadius='full' bg='brand.50' color='brand.500' fontWeight='700'>
          KPI Section
        </Tag>
      </Flex>

      {loading ? (
        <Flex h='340px' w='100%' align='center' justify='center'>
          <Spinner thickness='3px' speed='0.65s' color='brand.500' size='lg' />
        </Flex>
      ) : (
        <Grid templateColumns={{ base: '1fr', xl: 'repeat(12, 1fr)' }} gap='20px' w='100%'>
          <Box gridColumn={{ base: 'auto', xl: 'span 4' }}>
            <KPIStatCard item={{ ...items[0], title: 'Average Cost per Filled Position' }} tone='#4318FF' />
          </Box>
          <Box gridColumn={{ base: 'auto', xl: 'span 4' }}>
            <KPIStatCard item={{ ...items[1], title: 'Average Cost per Project' }} tone='#6AD2FF' />
          </Box>
          <Box gridColumn={{ base: 'auto', xl: 'span 4' }}>
            <KPIStatCard item={{ ...items[3], title: 'Remaining Budget' }} tone='#38B2AC' />
          </Box>
          <Box gridColumn={{ base: 'auto', xl: 'span 12' }}>
            <CostTrendChart item={{ ...items[2], title: 'Monthly Cost Trend' }} />
          </Box>
        </Grid>
      )}
    </Card>
  );
}