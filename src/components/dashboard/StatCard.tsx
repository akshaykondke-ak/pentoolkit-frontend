// src/components/dashboard/StatCard.tsx

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subtext?: string;
  bgColor?: string;
}

export default function StatCard({
  icon,
  label,
  value,
  subtext,
  bgColor = 'bg-blue-50',
}: StatCardProps) {
  return (
    <div className={`rounded-lg ${bgColor} p-6 border border-gray-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtext && <p className="mt-1 text-xs text-gray-500">{subtext}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}