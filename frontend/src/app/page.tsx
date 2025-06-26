'use client'

import Image from 'next/image'
import manhattan from '@/assets/images/manhattan.jpg'
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
      <nav className="absolute top-0 left-0 w-full bg-[#00b386] flex justify-between items-center px-6 py-3 z-10" style={{ zIndex: 99 }}>
        <div className="text-white font-bold text-lg">🌐 LUNA</div>
        <Link href="/map" className="text-white font-semibold relative z-30">
          Map
        </Link>
      </nav>

      {/* Centered Content */}
      <div className="relative z-10 flex flex-col items-start justify-center h-full px-[100px] space-y-6">
        <Heading>Manhattan My Way</Heading>
        <h1 className="text-white font-bold text-[60px] leading-[90px]">
          Manhattan My Way
        </h1>
        <h3 className="text-white font-bold text-[30px] leading-[45px] max-w-[880px]">
          Smarter routes. Greener choices. Manhattan, your way.
        </h3>
        <Link
          href="/map"
          className="mt-4 bg-[#00b386] hover:bg-[#009c73] text-white font-semibold px-6 py-3 rounded shadow-md transition flex items-center gap-2"
        >
          Explore Manhattan →
        </Link>
      </div>
    </main>
  )
}
