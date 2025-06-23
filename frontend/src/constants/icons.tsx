import {
  FaSun,
  FaMoon,
  FaCloudSun,
  FaCloudMoon,
  FaCloudSunRain,
  FaCloudMoonRain,
  FaSnowflake,
} from 'react-icons/fa6';
import { IoCloudSharp, IoThunderstorm } from 'react-icons/io5';
import { BsCloudsFill, BsCloudRainHeavyFill } from 'react-icons/bs';
import { RiMistFill } from 'react-icons/ri';
import { IconType } from 'react-icons';

export const WEATHER_CONDITION_ICONS: Record<string, IconType> = {
  "01d": FaSun,
  "01n": FaMoon,
  "02d": FaCloudSun,
  "02n": FaCloudMoon,
  "03d": IoCloudSharp,
  "03n": IoCloudSharp,
  "04d": BsCloudsFill,
  "04n": BsCloudsFill,
  "09d": BsCloudRainHeavyFill,
  "09n": BsCloudRainHeavyFill,
  "10d": FaCloudSunRain,
  "10n": FaCloudMoonRain,
  "11d": IoThunderstorm,
  "11n": IoThunderstorm,
  "13d": FaSnowflake,
  "13n": FaSnowflake,
  "50d": RiMistFill,
  "50n": RiMistFill,
};