import React from "react";

type Props = {
  title: string;
  value?: string | number;
  subtitle?: string;
  children?: React.ReactNode;
};

export default function StatisticCard({ title, value, subtitle, children }: Props) {
  return (
    <div className="bg-card rounded-lg border p-4 shadow-sm w-full h-fit">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{title}</div>
          {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
        </div>
        <div className="text-lg font-semibold">{value ?? "-"}</div>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}