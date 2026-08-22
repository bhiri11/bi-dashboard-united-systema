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

  const topItem = items[0];

  return (
    <Card p='20px' align='start' direction='column' w='100%' {...rest}>
      <Flex align='center' justify='space-between' w='100%' mb='14px'>
        <Box>
          <Text color={textColor} fontSize='xl' fontWeight='700' lineHeight='100%'>
            Top 5 Job Offers
          </Text>
          <Text color={subTextColor} fontSize='sm' fontWeight='500' mt='6px'>
            Job title, company and number of applications
          </Text>
        </Box>
        <Tag size='sm' borderRadius='full' bg='brand.50' color='brand.500' fontWeight='700'>
          KPI 2
        </Tag>
      </Flex>

      {loading ? (
        <Flex h='260px' w='100%' align='center' justify='center'>
          <Spinner thickness='3px' speed='0.65s' color='brand.500' size='lg' />
        </Flex>
      ) : items.length ? (
        <Flex direction='column' w='100%' gap='16px'>
          {items.map((item, index) => {
            const applicationsCount = Number(item.applications_count || 0);
            const progressValue = maxApplications
              ? (applicationsCount / maxApplications) * 100
              : 0;

            return (
              <Box
                key={`${item.job_id}-${index}`}
                p='14px'
                borderRadius='20px'
                border='1px solid'
                borderColor={borderColor}
                bg={cardBg}
                boxShadow={rowShadow}>
                <Flex justify='space-between' align='flex-start' gap='12px' mb='10px'>
                  <Flex align='flex-start' gap='12px'>
                    <Flex
                      minW='34px'
                      h='34px'
                      borderRadius='12px'
                      align='center'
                      justify='center'
                      bg={index === 0 ? 'brand.500' : 'secondaryGray.200'}
                      color={index === 0 ? 'white' : textColor}
                      fontWeight='700'>
                      {index + 1}
                    </Flex>

                    <Box>
                      <Text color={textColor} fontSize='md' fontWeight='700' lineHeight='1.3'>
                        {item.job_title}
                      </Text>
                      <Text color={subTextColor} fontSize='sm' fontWeight='500' mt='2px'>
                        {item.company_name}
                      </Text>
                    </Box>
                  </Flex>

                  <Badge
                    borderRadius='full'
                    px='10px'
                    py='5px'
                    colorScheme='purple'
                    variant='subtle'
                    fontSize='xs'>
                    {applicationsCount} applications
                  </Badge>
                </Flex>

                <Progress
                  value={progressValue}
                  size='sm'
                  borderRadius='full'
                  bg='secondaryGray.100'
                  sx={{
                    '& > div': {
                      background:
                        'linear-gradient(90deg, #4318FF 0%, #6AD2FF 100%)',
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
          h='260px'
          w='100%'
          border='1px dashed'
          borderColor={borderColor}
          borderRadius='20px'>
          <Text color={textColor} fontSize='md' fontWeight='700'>
            No offers yet
          </Text>
          <Text color={subTextColor} fontSize='sm' mt='4px'>
            Applications will appear here once jobs receive responses.
          </Text>
        </Flex>
      )}

      {topItem ? (
        <Flex
          w='100%'
          mt='16px'
          pt='14px'
          borderTop='1px solid'
          borderColor={borderColor}
          justify='space-between'
          align='center'>
          <Box>
            <Text
              color={subTextColor}
              fontSize='xs'
              fontWeight='700'
              textTransform='uppercase'
              letterSpacing='0.08em'>
              Leader
            </Text>
            <Text color={textColor} fontSize='sm' fontWeight='700' mt='3px'>
              {topItem.job_title} / {topItem.company_name}
            </Text>
          </Box>
          <Text color={textColor} fontSize='lg' fontWeight='700'>
            {topItem.applications_count}
          </Text>
        </Flex>
      ) : null}
    </Card>
  );
}
