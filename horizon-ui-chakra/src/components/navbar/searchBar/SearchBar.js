import React from "react";
import {
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  useColorModeValue,
} from "@chakra-ui/react";
import { SearchIcon, CloseIcon } from "@chakra-ui/icons";

export function SearchBar(props) {
  const { variant, background, children, placeholder, borderRadius, value, onChange, onClear, ...rest } = props;

  const searchIconColor = useColorModeValue("gray.700", "white");
  const inputBg = useColorModeValue("secondaryGray.300", "navy.900");
  const inputText = useColorModeValue("gray.700", "gray.100");

  return (
    <InputGroup w={{ base: "100%", md: "200px" }} {...rest}>
      <InputLeftElement
        children={
          <IconButton
            bg='inherit'
            borderRadius='inherit'
            _hover='none'
            _active={{
              bg: "inherit",
              transform: "none",
              borderColor: "transparent",
            }}
            _focus={{
              boxShadow: "none",
            }}
            icon={
              <SearchIcon color={searchIconColor} w='15px' h='15px' />
            }></IconButton>
        }
      />
      <Input
        variant='search'
        fontSize='sm'
        bg={background ? background : inputBg}
        color={inputText}
        fontWeight='500'
        _placeholder={{ color: "gray.400", fontSize: "14px" }}
        borderRadius={borderRadius ? borderRadius : "30px"}
        placeholder={placeholder ? placeholder : "Search..."}
        value={value || ""}
        onChange={onChange}
        pr={value ? "2.5rem" : undefined}
      />
      {value ? (
        <InputRightElement
          children={
            <IconButton
              aria-label="Clear search"
              size='xs'
              bg='transparent'
              _hover={{ bg: "gray.100" }}
              icon={<CloseIcon w='10px' h='10px' color={searchIconColor} />}
              onClick={onClear}
            />
          }
        />
      ) : null}
    </InputGroup>
  );
}