const labelClass = "mb-1.5 block text-xs font-medium text-slate-600";
export default function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}
