interface GenericPreviewProps {
  title: string
  description: string
}

export function GenericPreview({
  title,
  description,
}: GenericPreviewProps) {
  return (
    <section className="bg-white px-10 py-14">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
        <h2 className="text-2xl font-black text-slate-950">{title}</h2>

        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-500">
          {description}
        </p>
      </div>
    </section>
  )
}
