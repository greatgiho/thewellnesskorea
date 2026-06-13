import Image from "next/image"
import type { Path } from "@/lib/paths/paths-data"

type PathCardProps = {
  path: Path
}

export function PathCard({ path }: PathCardProps) {
  return (
    <article
      className="group flex w-full flex-col overflow-hidden rounded-3xl border border-primary/15 bg-card transition-all duration-500 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 lg:w-[360px] lg:shrink-0 lg:snap-start lg:hover:-translate-y-1.5"
    >
      <div className="aspect-[4/5] overflow-hidden">
        <Image
          src={path.image || "/placeholder.svg"}
          alt={path.en}
          width={720}
          height={900}
          loading="lazy"
          className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="font-serif text-3xl font-light text-foreground">{path.ko}</h3>
        <p className="mt-1.5 text-sm font-medium uppercase tracking-wider text-primary">
          {path.en}
        </p>

        <div className="mt-5 space-y-4 border-t border-border pt-5">
          <p className="text-sm font-medium leading-relaxed text-foreground">
            {path.sloganKo}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">{path.enDesc}</p>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary/80">
              주요 프로그램
            </p>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-foreground/85">
              {path.programs.map((program) => (
                <li key={program} className="flex gap-2">
                  <span className="text-primary/60">·</span>
                  <span>{program}</span>
                </li>
              ))}
            </ul>
          </div>

          {path.vibe && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary/80">
                공간 바이브
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {path.vibe}
              </p>
            </div>
          )}

          {path.targetNote && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary/80">
                타깃 특화
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {path.targetNote}
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
