// Chakra imports
import {
  Box,
  Flex,
  Text,
  Spinner,
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const apiBaseUrl =
      process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

    fetch(`${apiBaseUrl}/api/kpi/profile-completion`)
      .then((response) => response.json())
      .then((data) => {
        if (isMounted) {
          setCompletionRate(Number(data?.completion_rate || 0));
        }
      })
      .catch(() => {
        if (isMounted) {
          setCompletionRate(0);
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
        width: "50px",
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
        donut: {
          expandOnClick: false,
          donut: {
            labels: {
              show: false,
            },
          },
        },
      },
      fill: {
        colors: ["#22C55E", "#8B5CF6"],
      },
      stroke: {
        colors: ["#FFFFFF"],
        width: 4,
      },
      tooltip: {
        enabled: true,
        theme: "dark",
      },
    }),
    []
  );

  const remainingRate = Math.max(0, 100 - completionRate);

  return (
    <Card p='20px' align='center' direction='column' w='100%' {...rest}>
      <Flex
        px={{ base: "0px", "2xl": "10px" }}
        justifyContent='space-between'
        alignItems='center'
        w='100%'
        mb='8px'>
        <Text color={textColor} fontSize='md' fontWeight='600' mt='4px'>
          Profile completion
        </Text>
        <Text color='secondaryGray.500' fontSize='sm' fontWeight='700'>
          Overview
        </Text>
      </Flex>

      {loading ? (
        <Flex h='210px' w='100%' align='center' justify='center'>
          <Spinner thickness='3px' speed='0.65s' color='brand.500' size='lg' />
        </Flex>
      ) : (
        <PieChart h='100%' w='100%' chartData={chartData} chartOptions={chartOptions} />
      )}
      <Card
        bg={cardColor}
        flexDirection='row'
        boxShadow={cardShadow}
        w='100%'
        p='15px'
        px='20px'
        mt='15px'
        mx='auto'>
        <Flex direction='column' py='5px'>
          <Flex align='center'>
            <Box h='8px' w='8px' bg='brand.500' borderRadius='50%' me='4px' />
            <Text
              fontSize='xs'
              color='secondaryGray.600'
              fontWeight='700'
              mb='5px'>
              Complete profiles
            </Text>
          </Flex>
          <Text fontSize='lg' color={textColor} fontWeight='700'>
            {completionRate.toFixed(1)}%
          </Text>
        </Flex>
        <VSeparator mx={{ base: "60px", xl: "60px", "2xl": "60px" }} />
        <Flex direction='column' py='5px' me='10px'>
          <Flex align='center'>
            <Box h='8px' w='8px' bg='#6AD2FF' borderRadius='50%' me='4px' />
            <Text
              fontSize='xs'
              color='secondaryGray.600'
              fontWeight='700'
              mb='5px'>
              Remaining
            </Text>
          </Flex>
          <Text fontSize='lg' color={textColor} fontWeight='700'>
            {remainingRate.toFixed(1)}%
          </Text>
        </Flex>
      </Card>
    </Card>
  );
}
