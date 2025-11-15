type HeroSectionProps = {
  title?: string
  subtitle?: string
}

export function HeroSection({ title = 'Title', subtitle = 'Subtitle' }: HeroSectionProps) {
  return (
    <section className="flex w-full flex-col items-center gap-2 bg-[#F5F5F5] px-16 py-40">
      <h1 className="text-center text-7xl font-bold leading-[1.2] tracking-[-0.03em] text-[#1E1E1E]">
        {title}
      </h1>
      <p className="text-center text-3xl font-normal leading-[1.2] text-[#757575]">
        {subtitle}
      </p>
    </section>
  )
}

