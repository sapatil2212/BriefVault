import { Users } from "lucide-react";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Shared with me" };

export default function SharedPage() {
  return (
    <ComingSoon
      icon={Users}
      title="Shared with me"
      description="Documents your team has shared with you."
    />
  );
}
