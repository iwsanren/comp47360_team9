import React, { ReactNode } from "react";

import Slider from "react-slick";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface SlideProps {
  children: ReactNode;
}

const Slide = ({ children }: SlideProps) => {
  const settings = {
    infinite: false,
    arrows: false,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 1,
    variableWidth: true,
    swipeToSlide: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          variableWidth: false,
        }
      },
    ]
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
