import { Button, Card, CardContent, Text } from "@/components/ui";
import PermissionTable from "@/features/permission/components/PermissionTable";
import { Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";

const page = () => {
  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="flex justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="">
              <Text as="h1" className="text-xl font-bold">
                Quản lý nhóm quyền
              </Text>
              <Text as="p" className="text-sm text-muted-foreground">
                Quản lý nhóm quyền của merchant
              </Text>
            </div>
          </div>
          <Link href="/permissions/new">
            <Button leftIcon={<Plus />}>Thêm mới nhóm quyền</Button>
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-3">
          <PermissionTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default page;
