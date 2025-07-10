'use client'

import Image from 'next/image'
import Link from "next/link";
import manhattan from '@/assets/images/manhattan.jpg'
import { BsArrowRight } from "react-icons/bs";

export default function Home() {
  return (
    <main className="relative h-screen w-full font-roboto">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={manhattan}
          alt="Manhattan Background"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
        <div className="absolute inset-0 bg-black opacity-30 pointer-events-auto" />
      </div>

      {/* Centered Content */}
      <div className="relative z-10 h-full">
        {/* Manhattan My Way - h1 */}
        <h1
          className="text-white font-bold text-[60px] leading-[90px]"
          style={{
            position: 'absolute',
            top: '214px',
            left: '100px',
            width: '517px',
            height: '90px',
            letterSpacing: '0%',
          }}
        >
          Manhattan My Way
        </h1>

        {/* Subheading */}
        <h3
          className="text-white font-bold text-[30px] leading-[45px]"
          style={{
            position: 'absolute',
            top: '304px',
            left: '100px',
            width: '742px',
            height: '45px',
            letterSpacing: '0%',
          }}
        >
          Greener choices. Smarter routes. Manhattan, your way.
        </h3>

        {/* Description */}
        <p
          className="text-white font-bold italic text-[18px] leading-[27px]"
          style={{
            position: 'absolute',
            top: '360px',
            left: '100px',
          }}
        >
          Discover your most efficient and sustainable route.
        </p>

        {/* CTA Button */}
        <Link
          href="/map"
          className="absolute text-white font-semibold bg-[#0FD892] hover:bg-[#0AAC82] px-6 py-2 rounded-sm shadow-md transition flex items-center gap-2"
          style={{
            top: '400px',
            left: '100px',
            width: '233px',
            height: '43px',
            padding: '8px 24px',
          }}
        >
          <span
            style={{
              width: '153px',
              height: '27px',
              fontWeight: 700,
              fontSize: '18px',
              lineHeight: '27px',
              letterSpacing: '0%',
              color: '#FFFFFF',
            }}
          >
            Explore Manhattan
          </span>
          <BsArrowRight
            style={{
              
              top: '1.25px',
              left: '1.5px',
              width: '26',
              height: '22',
              transform: 'rotate(0deg)',
              opacity: 1,
            }}
          />
        </Link>
      </div>
    </main>
  )
}