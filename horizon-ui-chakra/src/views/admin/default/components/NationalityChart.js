import React, { useEffect, useMemo, useState } from "react";

import {
  Box,
  Flex,
  Progress,
  Spinner,
  Tag,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import Card from "components/card/Card.js";
import BarChart from "components/charts/BarChart";

export default function NationalityChart({ dateFilter, ...rest }) {

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const subTextColor = useColorModeValue("secondaryGray.600", "whiteAlpha.700");
  const cardBg = useColorModeValue("white", "navy.700");
  const borderColor = useColorModeValue("secondaryGray.100", "whiteAlpha.100");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [series, setSeries] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const apiBaseUrl =
      process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

    const params = new URLSearchParams();

    if (dateFilter?.start_date && dateFilter?.end_date) {
      params.append("start_date", dateFilter.start_date);
      params.append("end_date", dateFilter.end_date);
    }

    fetch(
      `${apiBaseUrl}/api/kpi/nationality-breakdown${
        params.toString() ? `?${params.toString()}` : ""
      }`
    )
      .then((response) => response.json())
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setItems(Array.isArray(data?.items) ? data.items : []);
        setCategories(Array.isArray(data?.categories) ? data.categories : []);
        setSeries(Array.isArray(data?.series) ? data.series : []);
        setTotalUsers(Number(data?.total_users || 0));
      })
      .catch(() => {
        if (isMounted) {
          setItems([]);
          setCategories([]);
          setSeries([]);
          setTotalUsers(0);
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
  }, [dateFilter?.start_date, dateFilter?.end_date]);

  // Percentage of the filtered period's total users, rounded to 1 decimal
  // (e.g. 64/239 -> "26.8", 100/400 -> "27"). Returns null if total is unknown.
  const formatPercent = (peopleCount) => {
    if (!totalUsers) {
      return null;
    }

    return `${Math.round((peopleCount / totalUsers) * 1000) / 10}`;
  };

  const chartData = useMemo(() => series, [series]);

  const chartOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        toolbar: { show: false },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
      },
      tooltip: {
        enabled: true,
        theme: "dark",
        style: {
          fontSize: "12px",
          fontFamily: undefined,
        },
        x: {
          formatter: function (val) {
            return val;
          },
        },
        y: {
          formatter: function (val) {
            const percent = totalUsers
              ? Math.round((val / totalUsers) * 1000) / 10
              : null;
            return percent !== null && !Number.isNaN(percent)
              ? `${val} talents (${percent}%)`
              : `${val} talents`;
          },
        },
      },
      xaxis: {
        categories,
        labels: {
          show: true,
          style: {
            colors: "#A3AED0",
            fontSize: "11px",
            fontWeight: "500",
          },
          rotate: -45,
          trim: true,
          maxHeight: 60,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        show: false,
        labels: { show: false },
      },
      grid: {
        borderColor: "rgba(163, 174, 208, 0.18)",
        show: true,
        strokeDashArray: 5,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
      },
      fill: {
        type: "gradient",
        gradient: {
          type: "vertical",
          shadeIntensity: 1,
          opacityFrom: 0.9,
          opacityTo: 0.5,
          colorStops: [
            [
              { offset: 0, color: "#4318FF", opacity: 1 },
              { offset: 100, color: "#6AD2FF", opacity: 0.9 },
            ],
          ],
        },
      },
      dataLabels: { enabled: false },
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: "50%",
          distributed: false,
        },
      },
      states: {
        hover: {
          filter: {
            type: "lighten",
            value: 0.15,
          },
        },
      },
    }),
    [categories, totalUsers]
  );

  const topItem = items[0];
  const maxPeople = useMemo(() => {
    if (!items.length) {
      return 0;
    }

    return Math.max(...items.map((item) => Number(item.people_count || 0)));
  }, [items]);

  return (
    <Card p='24px' align='start' direction='column' w='100%' {...rest}>
      <Flex align='center' justify='space-between' w='100%' mb='16px'>
        <Box>
          <Text color={textColor} fontSize='lg' fontWeight='700' lineHeight='100%'>
            Talent by Nationality
          </Text>
          <Text color={subTextColor} fontSize='xs' fontWeight='500' mt='4px'>
            Geographic distribution of candidates
          </Text>
        </Box>
        <Tag size='sm' borderRadius='full' bg='brand.50' color='brand.500' fontWeight='700'>
          KPI 4
        </Tag>
      </Flex>

      <Flex justify='space-between' align='center' px='2px' mb='12px'>
        <Flex flexDirection='column' align='start'>
          <Flex align='baseline' gap='8px'>
            <Text color={textColor} fontSize='38px' fontWeight='700' lineHeight='100%'>
              {loading ? "--" : totalUsers}
            </Text>
            <Text color='secondaryGray.600' fontSize='sm' fontWeight='500'>
              total talents
            </Text>
          </Flex>
          <Text color={subTextColor} fontSize='xs' fontWeight='500' mt='4px'>
            {loading ? "Loading nationality breakdown..." : "Top nationalities with others grouped"}
          </Text>
        </Flex>
      </Flex>

      {loading ? (
        <Flex h='240px' w='100%' align='center' justify='center'>
          <Spinner thickness='3px' speed='0.65s' color='brand.500' size='lg' />
        </Flex>
      ) : (
        <Box h='240px' mt='auto' mb='20px'>
          <BarChart chartData={chartData} chartOptions={chartOptions} />
        </Box>
      )}

      <Flex
        w='100%'
        mt='16px'
        pt='14px'
        borderTop='1px solid'
        borderColor={borderColor}
        justify='space-between'
        align='center'>
        <Box>
          <Text color='secondaryGray.600' fontSize='xs' fontWeight='700' textTransform='uppercase' letterSpacing='0.08em'>
            Leading Origin
          </Text>
          <Text color={textColor} fontSize='sm' fontWeight='700' mt='3px' noOfLines={1}>
            {topItem ? topItem.nationality : "No data"}
          </Text>
        </Box>
        <Flex align='center' gap='8px'>
          <Box w='8px' h='8px' bg='brand.500' borderRadius='50%' />
          <Text color={textColor} fontSize='lg' fontWeight='700'>
            {topItem ? topItem.people_count : 0}
          </Text>
          {topItem && formatPercent(Number(topItem.people_count || 0)) && (
            <Text color={subTextColor} fontSize='xs' fontWeight='500'>
              ({formatPercent(Number(topItem.people_count || 0))}%)
            </Text>
          )}
        </Flex>
      </Flex>

      <Flex direction='column' w='100%' gap='10px' mt='16px'>
        {items.slice(0, 5).map((item) => {
          const peopleCount = Number(item.people_count || 0);
          const progressValue = maxPeople ? (peopleCount / maxPeople) * 100 : 0;

          return (
            <Flex
              key={item.nationality}
              align='center'
              gap='12px'
              p='10px 14px'
              borderRadius='12px'
              border='1px solid'
              borderColor={borderColor}
              bg={cardBg}
              _hover={{
                bg: 'secondaryGray.50',
              }}
              transition='all 0.2s ease'>
              <Text color={textColor} fontSize='sm' fontWeight='600' minW='60px' noOfLines={1}>
                {item.nationality}
              </Text>
              <Box flex='1'>
                <Progress
                  value={progressValue}
                  size='sm'
                  borderRadius='full'
                  bg='secondaryGray.100'
                  sx={{
                    '& > div': {
                      background: 'linear-gradient(90deg, #4318FF 0%, #6AD2FF 100%)',
                    },
                  }}
                />
              </Box>
              <Flex align='center' gap='4px'>
                <Text color={textColor} fontSize='sm' fontWeight='700' minW='30px' textAlign='right'>
                  {peopleCount}
                </Text>
                {formatPercent(peopleCount) && (
                  <Text
                    color='secondaryGray.600'
                    fontSize='xs'
                    fontWeight='500'
                    whiteSpace='nowrap'>
                    ({formatPercent(peopleCount)}%)
                  </Text>
                )}
              </Flex>
            </Flex>
          );
        })}
      </Flex>
    </Card>
  );
}