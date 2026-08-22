import React, { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Flex,
  Grid,
  Progress,
  Select,
  Spinner,
  Tag,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import Card from "components/card/Card.js";
import LineChart from "components/charts/LineChart";
import { useSearch } from "contexts/SearchContext";
import { RiArrowUpSFill } from "react-icons/ri";

const apiBaseUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function KPIStatCard({ item, tone }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const subTextColor = useColorModeValue("secondaryGray.600", "whiteAlpha.700");
  const cardBg = useColorModeValue("white", "navy.700");
  const borderColor = useColorModeValue("secondaryGray.100", "whiteAlpha.100");

  const value = item?.status === "ok"
    ? item?.unit === "%"
      ? `${Number(item?.value || 0).toFixed(1)}%`
      : `${Number(item?.value || 0).toFixed(item?.unit === "hours" ? 2 : 0)}${item?.unit === "hours" ? " h" : ""}`
    : "Unavailable";

  const details = item?.status === "ok"
    ? item?.metric === "application_conversion_rate"
      ? `${item?.accepted_applications || 0} accepted from ${item?.total_applications || 0} applications`
      : item?.metric === "average_processing_time"
        ? `${item?.sample_size || 0} decided applications`
        : item?.metric === "position_fill_rate"
          ? `${item?.filled_jobs || 0} filled positions out of ${item?.total_jobs || 0}`
          : `${item?.withdrawn_applications || 0} withdrawn from ${item?.total_applications || 0}`
    : `Missing: ${(item?.required_fields || []).join(', ')}`;

  const trendTone = Number(item?.value || 0) >= 0 ? 'green.500' : 'red.500';

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
            Recruitment KPI
          </Text>
          <Text color={textColor} fontSize='lg' fontWeight='800' lineHeight='1.15' mt='6px'>
            {item?.title}
          </Text>
          <Text color={subTextColor} fontSize='sm' mt='6px'>
            {item?.description}
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
        <Text color='secondaryGray.600' fontSize='sm' fontWeight='500'>
          {item?.unit || ''}
        </Text>
      </Flex>

      <Text color={subTextColor} fontSize='sm' mb='12px'>
        {details}
      </Text>

      {item?.status === 'ok' && typeof item?.value === 'number' ? (
        <Box>
          <Flex justify='space-between' mb='6px'>
            <Text color={subTextColor} fontSize='xs' fontWeight='700' textTransform='uppercase'>
              Snapshot
            </Text>
            <Flex align='center' color={trendTone}>
              <RiArrowUpSFill />
              <Text fontSize='xs' fontWeight='700'>
                Live
              </Text>
            </Flex>
          </Flex>
          <Progress
            value={item?.unit === '%' ? Number(item.value) : Math.min(100, Number(item.value) * 10)}
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
      ) : null}
    </Box>
  );
}

function ProfessionExplorer({ item }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const subTextColor = useColorModeValue("secondaryGray.600", "whiteAlpha.700");
  const cardBg = useColorModeValue("white", "navy.700");
  const borderColor = useColorModeValue("secondaryGray.100", "whiteAlpha.100");

  const professions = useMemo(() => item?.items || [], [item]);
  const [selectedProfession, setSelectedProfession] = useState("");

  useEffect(() => {
    if (!selectedProfession && professions.length) {
      setSelectedProfession(professions[0].profession_name);
    }
  }, [selectedProfession, professions]);

  const selectedItem = useMemo(
    () => professions.find((profession) => profession.profession_name === selectedProfession) || professions[0],
    [professions, selectedProfession]
  );

  const chartData = useMemo(
    () => item?.series || [],
    [item]
  );

  const selectedIndex = useMemo(
    () => professions.findIndex((profession) => profession.profession_name === selectedProfession),
    [professions, selectedProfession]
  );

  const selectedCount = Number(selectedItem?.applications_count || 0);

  const chartOptions = useMemo(
    () => ({
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
          formatter: (value) => `${value} applications`,
        },
      },
      xaxis: {
        categories: item?.labels || [],
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
        enabled: true,
        formatter: (value, opts) => (opts.dataPointIndex === selectedIndex ? `${value}` : ''),
        offsetY: -10,
        style: {
          fontSize: '12px',
          fontWeight: '700',
          colors: ['#4318FF'],
        },
        background: {
          enabled: true,
          borderRadius: 6,
          padding: 6,
          borderWidth: 0,
          opacity: 0.95,
          foreColor: '#FFFFFF',
        },
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
      annotations: {
        points: selectedIndex >= 0 ? [{
          x: professions[selectedIndex]?.profession_name,
          y: selectedCount,
          marker: {
            size: 7,
            fillColor: '#4318FF',
            strokeColor: '#FFFFFF',
            strokeWidth: 3,
          },
          label: {
            borderColor: '#4318FF',
            style: {
              color: '#FFFFFF',
              background: '#4318FF',
              fontSize: '12px',
              fontWeight: 700,
            },
            text: `${selectedCount} apps`,
          },
        }] : [],
      },
    }),
    [item, professions, selectedCount, selectedIndex]
  );

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
            {item?.title}
          </Text>
          <Text color={subTextColor} fontSize='sm' mt='6px'>
            Select a profession to see its application volume instantly.
          </Text>
        </Box>
        <Tag size='sm' borderRadius='full' bg='brand.50' color='brand.500' fontWeight='700'>
          Interactive
        </Tag>
      </Flex>

      {item?.status === 'ok' ? (
        <>
          <Flex align='center' justify='space-between' gap='12px' wrap='wrap' mb='14px'>
            <Select
              value={selectedProfession}
              onChange={(event) => setSelectedProfession(event.target.value)}
              maxW='240px'
              bg='secondaryGray.50'
              border='0'
              fontWeight='600'>
              {professions.map((profession) => (
                <option key={profession.profession_name} value={profession.profession_name}>
                  {profession.profession_name}
                </option>
              ))}
            </Select>

            <Button
              size='sm'
              borderRadius='full'
              variant='ghost'
              colorScheme='brand'
              onClick={() => setSelectedProfession(professions[0]?.profession_name || '')}>
              Reset
            </Button>
          </Flex>

          <Flex
            justify='space-between'
            align='center'
            mb='16px'
            p='14px 16px'
            borderRadius='18px'
            bg='secondaryGray.50'
            wrap='wrap'
            gap='12px'>
            <Box>
              <Text color={subTextColor} fontSize='xs' fontWeight='700' textTransform='uppercase' letterSpacing='0.08em'>
                Selected profession
              </Text>
              <Text color={textColor} fontSize='xl' fontWeight='800' mt='4px'>
                {selectedItem?.profession_name || 'No profession'}
              </Text>
            </Box>
            <Box textAlign='end'>
              <Text color={subTextColor} fontSize='xs' fontWeight='700' textTransform='uppercase' letterSpacing='0.08em'>
                Applications on curve
              </Text>
              <Text color={textColor} fontSize='32px' fontWeight='800' lineHeight='1' mt='4px'>
                {selectedCount}
              </Text>
            </Box>
          </Flex>

          <Box h='300px' mb='8px'>
            <LineChart chartData={chartData} chartOptions={chartOptions} />
          </Box>
        </>
      ) : (
        <Flex h='320px' align='center' justify='center' border='1px dashed' borderColor={borderColor} borderRadius='18px'>
          <Text color='orange.400' fontWeight='600'>
            Applications by profession is unavailable.
          </Text>
        </Flex>
      )}
    </Box>
  );
}

export default function RecruitmentApplicationsSection({ dateFilter }) {
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

    const effectiveSearch = selectedCategory === 'recruitment' ? debouncedSearch : '';

    const params = new URLSearchParams();
    if (dateFilter?.start_date) {
      params.append('start_date', dateFilter.start_date);
    }
    if (dateFilter?.end_date) {
      params.append('end_date', dateFilter.end_date);
    }
    if (effectiveSearch) {
      params.append('search', effectiveSearch);
    }

    const queryString = params.toString();
    const url = `${apiBaseUrl}/api/kpi/recruitment-applications${queryString ? '?' + queryString : ''}`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
          });
        }
        return response.json();
      })
      .then((data) => {
        if (isMounted) {
          setItems(Array.isArray(data?.items) ? data.items : []);
        }
      })
      .catch((err) => {
        console.error("Recruitment KPIs fetch failed:", err.message || err);
        if (isMounted) {
          setItems([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [dateFilter?.start_date, dateFilter?.end_date, debouncedSearch, selectedCategory]);

  return (
    <Card p='24px' align='start' direction='column' w='100%' overflow='hidden'>
      <Flex align='center' justify='space-between' gap='12px' w='100%' mb='18px' flexWrap='wrap'>
        <Box>
          <Text color={textColor} fontSize='2xl' fontWeight='800' lineHeight='100%'>
            Recruitment & Applications
          </Text>
          <Text color={subTextColor} fontSize='sm' fontWeight='500' mt='6px'>
            A compact recruitment overview with the five KPIs arranged for quick review.
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
            <KPIStatCard item={{ ...items[0], title: 'Application Conversion Rate' }} tone='#4318FF' />
          </Box>
          <Box gridColumn={{ base: 'auto', xl: 'span 4' }}>
            <KPIStatCard item={{ ...items[1], title: 'Average Processing Time' }} tone='#6AD2FF' />
          </Box>
          <Box gridColumn={{ base: 'auto', xl: 'span 4' }}>
            <KPIStatCard item={{ ...items[2], title: 'Position Fill Rate' }} tone='#38B2AC' />
          </Box>
          <Box gridColumn={{ base: 'auto', xl: 'span 12' }}>
            <ProfessionExplorer item={{ ...items[3], title: 'Applications by Profession' }} />
          </Box>
          <Box gridColumn={{ base: 'auto', xl: 'span 4' }}>
            <KPIStatCard item={{ ...items[4], title: 'Withdrawal Rate' }} tone='#F56565' />
          </Box>
        </Grid>
      )}
    </Card>
  );
}