'use client'

import Image from 'next/image'
import Link from "next/link";
import { BsArrowRight } from "react-icons/bs";

import bg from '@/assets/images/bg.png'
import bg_mobile from '@/assets/images/bg_mobile.png'
import Heading from '@/components/Heading';
import Button from '@/components/Button';
import Text from '@/components/Text';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function Home() {
  const isMobile = useIsMobile()
  return (
    <main className="relative flex flex-col justify-center h-screen w-full font-roboto">
      {/* Background image */}
      <div className="absolute left-0 top-0 right-0 bottom-0">
        <Image
          src={isMobile ? bg_mobile : bg}
          alt="Manhattan Background"
          fill
          style={{ objectFit: isMobile ? 'unset' : 'cover' }}
          priority
        />
      </div>

      {/* Centered Content */}
      <div className="container absolute flex flex-col gap-4 text-white lg:gap-0 lg:top-[214px] lg:left-[100px] z-10">
        {/* Manhattan My Way - h1 */}
        <Heading className="drop-shadow-lg">
          Manhattan My Way
        </Heading>

        {/* Subheading */}
        <Heading className="drop-shadow-lg" level={3}>
          Greener choices. Smarter routes. Prediction. Manhattan, your way.
        </Heading>

        {/* Description */}
        <p className="font-bold italic text-[18px] leading-[27px] drop-shadow-lg">
          Discover your most efficient and sustainable route.
        </p>

        {/* CTA Button */}
        <Link
          href="/map"
          className="mt-4"
        >
          <Button>
            <div className="flex items-center gap-2">
              <Text.Bold
              >
                Explore Manhattan
              </Text.Bold>
              <BsArrowRight
                style={{
                  top: '1.25px',
                  left: '1.5px',
                  width: '26',
                  height: '22',
                }}
              />
            </div>
          </Button>
        </Link>
      </div>
    </main>
  )
}