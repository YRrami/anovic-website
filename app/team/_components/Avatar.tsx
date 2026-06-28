import Image from "next/image";
import { initials } from "../_lib/data";

export default function Avatar({
  name,
  src,
  size = 44,
}: {
  name: string | null | undefined;
  src?: string | null;
  size?: number;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name ? `${name} profile picture` : "Profile picture"}
        width={size}
        height={size}
        className="shrink-0 rounded-full border-2 border-gray-200 object-cover"
      />
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-100 text-sm font-black text-gray-800"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
