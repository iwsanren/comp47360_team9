'use client'

import Image from 'next/image'
import manhattan from '@/assets/images/manhattan.jpg'
import g6Icon from '@/assets/images/g6.png'
import Link from 'next/link'
import Heading from '@/components/Heading'

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

      {/* Navbar */}
      <nav className="absolute top-0 left-0 w-full bg-[#00674C] flex justify-between items-center px-6 py-3 z-10" style={{ zIndex: 99 }}>
        <div className="text-white font-bold text-lg flex items-center relative">
          {/* Icon */}
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
      <div className="relative z-10 flex flex-col items-start justify-center h-full px-[100px] space-y-6">
        <Heading>Manhattan My Way</Heading> {/* a sample for import comp */}
        <h1 className="text-white font-bold text-[60px] leading-[90px]">
          Manhattan My Way
        </h1>
        <h3 className="text-white font-bold text-[30px] leading-[45px] max-w-[880px]">
          Smarter routes. Greener choices. Manhattan, your way.
        </h3>
        <Link
          href="/map"
          className="mt-4 bg-[#0FD892] text-white font-semibold px-6 py-3 rounded shadow-md transition flex items-center gap-2"
        >
          Explore Manhattan →
        </Link>
      </div>
    </main>
  )
}
