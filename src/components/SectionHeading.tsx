type SectionHeadingProps = {
  index: string;
  eyebrow: string;
  title: string;
  description?: string;
};

export default function SectionHeading({ index, eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="section-heading" data-reveal>
      <div className="section-index" aria-hidden="true">{index} /</div>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="section-title">{title}</h2>
        {description && <p className="section-subtitle">{description}</p>}
      </div>
    </div>
  );
}
