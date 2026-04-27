import { Button, Card, CardContent, Text } from "@/components/ui";
import UserSection from "@/features/users/components/UserSection";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import React from "react";

const UsersPage = () => {
  return (
    <div className="space-y-3">
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="">
                <Text as="h2" className="font-semibold text-xl ">
                  Quản lý nhân viên
                </Text>
                <Text as="p" className="text-sm text-muted-foreground">
                  Danh sách nhân viên
                </Text>
              </div>
            </div>
            <Link href={"/users/new"}>
              <Button leftIcon={<Plus className="w-4 h-4" />}>
                Thêm mới nhân viên
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <UserSection />
    </div>
  );
};

export default UsersPage;
