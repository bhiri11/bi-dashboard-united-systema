// Chakra imports
import {
  Badge,
  Box,
  Flex,
  Progress,
  Spinner,
  Tag,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import Card from "components/card/Card.js";
import React, { useEffect, useMemo, useState } from "react";

export default function WeeklyRevenue(props) {
  const { ...rest } = props;

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const subTextColor = useColorModeValue("secondaryGray.600", "whiteAlpha.700");
  const cardBg = useColorModeValue("white", "navy.700");
  const borderColor = useColorModeValue("secondaryGray.100", "whiteAlpha.100");
  const rowShadow = useColorModeValue(
    "0px 10px 25px rgba(112, 144, 176, 0.08)",
    "unset"
  );
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const apiBaseUrl =
      process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

    fetch(`${apiBaseUrl}/api/kpi/top-job-offers`)
      .then((response) => response.json())
      .then((data) => {
        if (isMounted) {
          setItems(Array.isArray(data?.items) ? data.items : []);
        }
      })
      .catch(() => {
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
  }, []);

  const maxApplications = useMemo(() => {
    if (!items.length) {
      return 0;
    }

    return Math.max(...items.map((item) => Number(item.applications_count || 0)));
  }, [items]);

  return (
    <Card p='24px' align='start' direction='column' w='100%' {...rest}>
      <Flex align='center' justify='space-between' w='100%' mb='16px'>
        <Box>
          <Text color={textColor} fontSize='lg' fontWeight='700' lineHeight='100%'>
            Top Job Offers
          </Text>
          <Text color={subTextColor} fontSize='xs' fontWeight='500' mt='4px'>
            Most applied positions this month
          </Text>
        </Box>
        <Tag size='sm' borderRadius='full' bg='brand.50' color='brand.500' fontWeight='700'>
          KPI 2
        </Tag>
      </Flex>

      {loading ? (
        <Flex h='280px' w='100%' align='center' justify='center'>
          <Spinner thickness='3px' speed='0.65s' color='brand.500' size='lg' />
        </Flex>
      ) : items.length ? (
        <Flex direction='column' w='100%' gap='12px'>
          {items.map((item, index) => {
            const applicationsCount = Number(item.applications_count || 0);
            const progressValue = maxApplications
              ? (applicationsCount / maxApplications) * 100
              : 0;

            return (
              <Box
                key={`${item.job_id}-${index}`}
                p='16px'
                borderRadius='16px'
                border='1px solid'
                borderColor={borderColor}
                bg={cardBg}
                boxShadow={rowShadow}
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: '0px 8px 20px rgba(112, 144, 176, 0.12)',
                }}
                transition='all 0.3s ease'>
                <Flex justify='space-between' align='center' gap='12px' mb='12px'>
                  <Flex align='center' gap='12px' flex='1'>
                    <Flex
                      minW='36px'
                      h='36px'
                      borderRadius='10px'
                      align='center'
                      justify='center'
                      bg={index === 0 ? 'brand.500' : 'secondaryGray.200'}
                      color={index === 0 ? 'white' : textColor}
                      fontWeight='700'
                      fontSize='sm'>
                      {index + 1}
                    </Flex>

                    {index === 0 && (
                      <Badge
                        borderRadius='full'
                        px='10px'
                        py='4px'
                        bg='brand.500'
                        color='white'
                        fontWeight='700'
                        fontSize='xs'
                        whiteSpace='nowrap'>
                        🏆 Top pick
                      </Badge>
                    )}

                    <Box flex='1' minW='0'>
                      <Text color={textColor} fontSize='sm' fontWeight='700' lineHeight='1.4' noOfLines={1}>
                        {item.job_title}
                      </Text>
                      <Text color={subTextColor} fontSize='xs' fontWeight='500' mt='2px' noOfLines={1}>
                        {item.company_name}
                      </Text>
                    </Box>
                  </Flex>

                  <Badge
                    borderRadius='full'
                    px='14px'
                    py='6px'
                    bg='brand.50'
                    color='brand.500'
                    fontWeight='700'
                    fontSize='md'
                    whiteSpace='nowrap'>
                    {applicationsCount} apps
                  </Badge>
                </Flex>

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
            );
          })}
        </Flex>
      ) : (
        <Flex
          direction='column'
          align='center'
          justify='center'
          h='280px'
          w='100%'
          border='1px dashed'
          borderColor={borderColor}
          borderRadius='16px'>
          <Text color={textColor} fontSize='md' fontWeight='700'>
            No applications yet
          </Text>
          <Text color={subTextColor} fontSize='sm' mt='4px' textAlign='center' px='4'>
            Applications will appear here once candidates apply to jobs
          </Text>
        </Flex>
      )}
    </Card>
  );
}
