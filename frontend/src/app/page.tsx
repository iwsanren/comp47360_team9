'use client'

import Image from 'next/image'
import manhattan from '@/assets/images/manhattan.jpg'
import g6Icon from '@/assets/images/g6.png'
import Link from 'next/link'
import Heading from '@/components/Heading'

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

      {/* Navbar */}
      <nav
        className="absolute top-0 left-0 w-full bg-[#00674C] flex justify-between items-center px-6 py-3"
        style={{ zIndex: 99 }}
      >
        <div className="text-white font-bold text-lg flex items-center relative">
          <Image
            src={g6Icon}
            alt="LUNA Icon"
            width={21}
            height={27}
            className="absolute"
            style={{ top: '1px', left: '1px' }}
          />
          <span className="pl-8">LUNA</span>
        </div>
        <Link href="/map" className="text-white font-semibold relative z-30">
          Map
        </Link>
      </nav>

      {/* Centered Content */}
      <div className="relative z-10 h-full">
        {/* Heading component */}
        <Heading>Manhattan My Way</Heading>

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
          className="absolute text-white font-semibold bg-[#0FD892] px-6 py-3 rounded shadow-md transition flex items-center gap-2"
          style={{
            top: '410px',
            left: '100px',
          }}
        >
          Explore Manhattan →
        </Link>
      </div>
    </main>
  )
}
