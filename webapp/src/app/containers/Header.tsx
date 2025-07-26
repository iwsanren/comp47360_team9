'use client';
import Link from "next/link";
import Image from "next/image";

import Toggle from "@/components/Toggle";
import { useMode } from "@/contexts/ModeProvider";
import g6Icon from "@/assets/images/g6.png";

const pages = [
  { label: 'Map', link: '/map' },
  { label: 'Contact', link: '/contact' },
];

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
        <Toggle onClick={toggleMode} isActive={mode}>
          <div className="absolute font-semibold text-black text-center top-full right-0 translate-y-2 w-[188px] py-1 px-2 text-sm/[1.5] bg-white rounded-sm drop-shadow-lg">
            Switch to {mode ? 'Normal' : 'Color Blind'} Mode
          </div>
        </Toggle>
      </div>
    </nav>
  );
}