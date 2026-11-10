type SectionHeadingProps = {
  index: string;
  label: string;
  title: string;
  description?: string;
};

export function SectionHeading({ index, label, title, description }: SectionHeadingProps) {
  return (
    <div className="mb-10 grid items-start gap-5 border-t border-white/10 pt-9 md:mb-14 md:grid-cols-[minmax(150px,0.32fr)_1fr]">
      <p className="section-kicker"><span className="text-forest-light">{index}</span> / {label}</p>
      <div>
        <h2 className="max-w-3xl font-display text-[clamp(2.25rem,5vw,4.6rem)] font-medium leading-[1.05] tracking-[-0.055em] text-paper">{title}</h2>
        {description && <p className="mt-5 max-w-2xl text-base leading-8 text-slate-400">{description}</p>}
      </div>
    </div>
  );
}
