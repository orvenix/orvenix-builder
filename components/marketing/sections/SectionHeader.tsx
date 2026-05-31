interface SectionHeaderProps {
  tag?: string;
  title: React.ReactNode;
  description?: string;
  center?: boolean;
}

export function SectionHeader({ tag, title, description, center }: SectionHeaderProps) {
  return (
    <div className={`mk-section-header ${center ? 'text-center' : ''}`}>
      {tag && (
        <p className={`mk-section-tag ${center ? 'justify-center' : ''}`}>
          {tag}
        </p>
      )}
      <h2 className={`mk-section-title ${center ? 'mx-auto' : ''}`}>
        {title}
      </h2>
      {description && (
        <p className={`mk-section-desc ${center ? 'mx-auto' : ''} max-w-xl`}>
          {description}
        </p>
      )}
    </div>
  );
}
