import React from "react";

import Slider from "react-slick";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";



const Slide = ({ children }) => {

  const settings = {
    // dots: true,
    infinite: false,
    arrows: false,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 1,
    variableWidth: true,
  };
  return (
    <div className="relative">
        <Slider {...settings}>
           {children}
        </Slider>
    </div>
  );
};

export default Slide
