import { Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface StatsCardsProps {
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  isLoading?: boolean;
}

export function StatsCards({ stats, isLoading = false }: StatsCardsProps) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gray-100 p-2">
            <Clock className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-semibold">
              {isLoading ? "-" : stats.total}
            </div>
            <div className="text-muted-foreground text-xs sm:text-sm">
              Total Laporan
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-amber-100 p-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-semibold">
              {isLoading ? "-" : stats.pending}
            </div>
            <div className="text-muted-foreground text-xs sm:text-sm">Menunggu</div>
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-green-100 p-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-semibold">
              {isLoading ? "-" : stats.approved}
            </div>
            <div className="text-muted-foreground text-xs sm:text-sm">Disetujui</div>
          </div>
        </div>
      </div>
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-red-100 p-2">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-semibold">
              {isLoading ? "-" : stats.rejected}
            </div>
            <div className="text-muted-foreground text-xs sm:text-sm">Ditolak</div>
          </div>
        </div>
      </div>
    </div>
  );
}
