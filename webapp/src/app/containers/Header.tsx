import Link from "next/link";
import Image from "next/image";

import g6Icon from "@/assets/images/g6.png";

const pages = [
  { label: 'Map', link: '/map' },
  { label: 'Contact', link: '/contact' },
]

export default function Header() {
  return (
    <nav className="fixed top-0 left-0 w-full bg-[#00674C] flex justify-between items-center px-4 py-2 z-10" style={{ zIndex: 99 }}>
      <Link href="/">
        <div className="text-white font-bold flex items-center relative">
          <Image
            src={g6Icon}
            alt="LUNA Icon"
            width={21}
            height={27}
            className="absolute"
            style={{ top: '1px', left: '1px' }}
          />
          <p className="pl-8 text-lg/[1.5]">LUNA</p>
        </div>
      </Link>
      <div className="flex gap-4 lg:gap-8">
        {pages.map(({ label, link }) => (
          <Link href={link} className="text-white font-semibold relative z-30 hover:underline" key={label}>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}