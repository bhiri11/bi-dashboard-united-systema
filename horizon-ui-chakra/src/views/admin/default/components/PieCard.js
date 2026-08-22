// Chakra imports
import {
  Box,
  Flex,
  Text,
  Spinner,
  Tag,
  useColorModeValue,
} from "@chakra-ui/react";
// Custom components
import Card from "components/card/Card.js";
import PieChart from "components/charts/PieChart";
import { VSeparator } from "components/separator/Separator";
import React, { useEffect, useMemo, useState } from "react";

export default function Conversion(props) {
  const { ...rest } = props;

  // Chakra Color Mode
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const cardColor = useColorModeValue("white", "navy.700");
  const cardShadow = useColorModeValue(
    "0px 18px 40px rgba(112, 144, 176, 0.12)",
    "unset"
  );
  const [completionRate, setCompletionRate] = useState(0);
  const [completeProfiles, setCompleteProfiles] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const apiBaseUrl =
      process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

    fetch(`${apiBaseUrl}/api/kpi/profile-completion`)
      .then((response) => response.json())
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setCompletionRate(Number(data?.completion_rate || 0));
        setCompleteProfiles(Number(data?.complete_profiles || 0));
        setTotalUsers(Number(data?.total_users || 0));
      })
      .catch(() => {
        if (isMounted) {
          setCompletionRate(0);
          setCompleteProfiles(0);
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
  }, []);

  const chartData = useMemo(
    () => [completionRate, Math.max(0, 100 - completionRate)],
    [completionRate]
  );

  const chartOptions = useMemo(
    () => ({
      labels: ["Complete profiles", "Remaining"],
      colors: ["#22C55E", "#8B5CF6"],
      chart: {
        type: "donut",
        width: "50px",
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
      states: {
        hover: {
          filter: {
            type: "none",
          },
        },
      },
      legend: {
        show: false,
      },
      dataLabels: {
        enabled: false,
      },
      hover: { mode: null },
      plotOptions: {
        pie: {
          donut: {
            size: "75%",
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: "11px",
                fontWeight: 600,
                color: "#A3AED0",
                offsetY: -10,
              },
              value: {
                show: true,
                fontSize: "24px",
                fontWeight: 700,
                color: textColor,
                offsetY: 5,
                formatter: function (val) {
                  return val + "%";
                },
              },
              total: {
                show: true,
                label: "Completion",
                fontSize: "12px",
                fontWeight: 600,
                color: "#A3AED0",
                formatter: function (w) {
                  return Math.round(w.globals.series[0] / (w.globals.series[0] + w.globals.series[1]) * 100) + "%";
                },
              },
            },
          },
        },
      },
      fill: {
        colors: ["#22C55E", "#8B5CF6"],
        type: "solid",
      },
      stroke: {
        colors: ["transparent"],
        width: 0,
      },
      tooltip: {
        enabled: true,
        theme: "dark",
        style: {
          fontSize: "12px",
        },
        y: {
          formatter: function (val) {
            return val + "%";
          },
        },
      },
    }),
    [textColor]
  );

  const remainingRate = Math.max(0, 100 - completionRate);

  return (
    <Card p='24px' align='center' direction='column' w='100%' {...rest}>
      <Flex
        px={{ base: "0px", "2xl": "10px" }}
        justifyContent='space-between'
        alignItems='center'
        w='100%'
        mb='12px'>
        <Box>
          <Text color={textColor} fontSize='lg' fontWeight='700' lineHeight='100%'>
            Profile Completion
          </Text>
          <Text color='secondaryGray.500' fontSize='xs' fontWeight='500' mt='4px'>
            Candidate profile status
          </Text>
        </Box>
        <Tag size='sm' borderRadius='full' bg='brand.50' color='brand.500' fontWeight='700'>
          KPI 1
        </Tag>
      </Flex>

      {loading ? (
        <Flex h='240px' w='100%' align='center' justify='center'>
          <Spinner thickness='3px' speed='0.65s' color='brand.500' size='lg' />
        </Flex>
      ) : (
        <PieChart h='100%' w='100%' chartData={chartData} chartOptions={chartOptions} />
      )}

      <Flex
        w='100%'
        mt='20px'
        pt='16px'
        borderTop='1px solid'
        borderColor='secondaryGray.100'
        justify='space-between'
        align='center'>
        <Box>
          <Text color='secondaryGray.600' fontSize='xs' fontWeight='700' textTransform='uppercase' letterSpacing='0.08em'>
            Total Users
          </Text>
          <Text color={textColor} fontSize='sm' fontWeight='700' mt='3px'>
            {totalUsers} registered
          </Text>
        </Box>
        <Box textAlign='end'>
          <Text color='secondaryGray.600' fontSize='xs' fontWeight='700' textTransform='uppercase' letterSpacing='0.08em'>
            Complete
          </Text>
          <Text color={textColor} fontSize='sm' fontWeight='700' mt='3px'>
            {completeProfiles} profiles
          </Text>
        </Box>
      </Flex>
    </Card>
  );
}
