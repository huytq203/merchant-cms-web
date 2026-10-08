import type { ReactNode } from "react";
import { Card } from "@/components/ui/card/Card";

interface ResultCardProps {

  children: ReactNode;
  pagination?: ReactNode;
  className?: string;
}

/** Card giữ viền duy nhất; Table bên trong tự bỏ khung ngoài để không lồng hai lớp viền. */
export function ResultCard({  children, pagination, className }: ResultCardProps) {
  return (
    <Card className={`overflow-hidden ${className ?? ""}`} >
        <div className="p-0">{children}</div>
      {pagination ? <div className="p-0">{pagination}</div> : null}
    </Card>
  );
}
