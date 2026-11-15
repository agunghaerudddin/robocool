const cardClass =
  "rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5";

export default function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cardClass}>
      <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-xs text-blue-700">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
