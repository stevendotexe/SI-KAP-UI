"use client";

interface StudentJournalCardProps {
  studentId: number;
  studentName: string;
  studentSchool: string | null;
  totalSubmitted: number;
  expectedDays: number;
  pending: number;
  approved: number;
  rejected: number;
  onClick?: () => void;
}

export default function StudentJournalCard({
  studentName,
  studentSchool,
  totalSubmitted,
  expectedDays,
  pending,
  approved,
  rejected,
  onClick,
}: StudentJournalCardProps) {
  const completionRate = expectedDays > 0 ? Math.round((totalSubmitted / expectedDays) * 100) : 0;

  // Get initials for avatar
  const initials = studentName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border shadow-sm p-4 hover:border-red-200 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-red-600 transition-colors">
            {studentName}
          </h3>
          <p className="text-sm text-muted-foreground truncate">{studentSchool || "Sekolah tidak diketahui"}</p>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">{totalSubmitted}/{expectedDays} hari terisi</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all"
                style={{ width: `${Math.min(100, completionRate)}%` }}
              />
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {pending > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-700">
                {pending} menunggu
              </span>
            )}
            {approved > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-700">
                {approved} disetujui
              </span>
            )}
            {rejected > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-700">
                {rejected} ditolak
              </span>
            )}
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="flex-shrink-0 text-gray-400 group-hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
