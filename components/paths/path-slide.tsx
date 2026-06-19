import Image from "next/image"
import type { Path } from "@/lib/paths/paths-data"

type PathSlideProps = {
  path: Path
  index: number
  total: number
}

export function PathSlide({ path, index, total }: PathSlideProps) {
  return (
    <article className="relative h-svh w-full shrink-0 overflow-hidden lg:snap-start lg:snap-always">
      <Image
        src={path.image || "/placeholder.svg"}
        alt={path.en}
        fill
        priority={index === 0}
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/35" />

      <div className="relative flex h-full flex-col justify-end px-6 pb-16 pt-24 lg:px-12 lg:pb-20">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-white/70">
          Five Paths · {String(index + 1).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </p>
        <h3 className="mt-4 font-serif text-5xl font-light text-white sm:text-6xl lg:text-7xl">
          {path.ko}
        </h3>
        <p className="mt-2 text-sm font-medium uppercase tracking-[0.2em] text-white/85">
          {path.en}
        </p>
        <p className="mt-6 max-w-2xl text-pretty text-lg font-light leading-relaxed text-white/90 sm:text-xl">
          {path.enDesc}
        </p>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75">
          {path.sloganKo}
        </p>
      </div>
    </article>
  )
}
