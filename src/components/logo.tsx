import Image from "next/image";
import Link from "next/link";

export function Logo({ href = "/", size = 32 }: { href?: string; size?: number }) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <Image src="/logo.png" alt="Longevity" width={size} height={size} className="rounded-full" />
      <span className="font-display text-[17px] font-semibold tracking-tight text-navy">
        Longevity
      </span>
    </Link>
  );
}
