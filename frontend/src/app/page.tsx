'use client'

import Image from 'next/image'
import Link from "next/link";
import manhattan from '@/assets/images/manhattan.jpg'
import Header from '@/components/Header'

// https://overpass-api.de/api/interpreter?data=%5Bout%3Ajson%5D%3B%0Aarea%5B%22name%22%3D%22New%20York%22%5D%5B%22boundary%22%3D%22administrative%22%5D-%3E.a%3B%0A%28%0A%20%20node%5B%22amenity%22%3D%22charging_station%22%5D%28area.a%29%3B%0A%20%20way%5B%22amenity%22%3D%22charging_station%22%5D%28area.a%29%3B%0A%20%20relation%5B%22amenity%22%3D%22charging_station%22%5D%28area.a%29%3B%0A%29%3B%0Aout%20body%3B%0A%3E%3B%0Aout%20skel%20qt%3B
// https://overpass-api.de/api/interpreter?data=%5Bout%3Ajson%5D%3B%0Aarea%5Bname%3D%22Manhattan%22%5D%5Bboundary%3Dadministrative%5D-%3E.a%3B%0A%28%0A%20%20way%5B%22leisure%22%3D%22park%22%5D%28area.a%29%3B%0A%20%20relation%5B%22leisure%22%3D%22park%22%5D%28area.a%29%3B%0A%29%3B%0Aout%20body%3B%0A%3E%3B%0Aout%20skel%20qt%3B

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