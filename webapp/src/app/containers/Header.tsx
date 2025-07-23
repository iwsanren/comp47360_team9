'use client';
import Link from "next/link";
import Image from "next/image";

import Toggle from "@/components/Toggle";
import { useMode } from "@/contexts/ModeProvider";
import g6Icon from "@/assets/images/g6.png";

const pages = [
  { label: 'Map', link: '/map' },
  { label: 'Contact', link: '/contact' },
]

export default function Header() {
  const { mode, toggleMode } = useMode();
  return (
    <nav className={`fixed top-0 left-0 w-full ${mode ? 'bg-blue-800' : 'bg-green-800'} flex justify-between items-center px-4 py-2 z-10`}>
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
      <div className="flex text-white items-center gap-2 lg:gap-4 lg:gap-8">
        {pages.map(({ label, link }) => (
          <Link href={link} className="font-semibold relative z-30 hover:underline" key={label}>
            {label}
          </Link>
        ))}
        <div className="font-semibold flex items-center gap-2">
          <Toggle onClick={toggleMode} isActive={mode}>
            <div className="absolute text-black top-full right-0 translate-y-2 w-[180px] py-1 px-2 text-sm/[21px] bg-white rounded-sm drop-shadow-lg">Click this toggle to switch to {mode ? 'normal' : 'blind'} model.</div>
          </Toggle>
        </div>
      </div>
    </nav>
  );
}