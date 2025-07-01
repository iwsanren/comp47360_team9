'use client'

import Image from 'next/image'
import Link from "next/link";
import manhattan from '@/assets/images/manhattan.jpg'
import arrow from '@/assets/images/Vector.png'
import Header from '@/components/Header'

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

      {/* Header */}
      <Header />

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
            width: '225px',
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
          <Image
            src={arrow}
            alt="Arrow Icon"
            width={14.000893592834473}
            height={9.001262664794922}
            style={{
              position: 'relative',
              top: '1px',
              left: '1px',
              objectFit: 'contain',
            }}
          />
        </Link>
      </div>
    </main>
  )
}