"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/Dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs/Tabs";
import { ProfileTab } from "./ProfileTab";
import { SecurityTab } from "./SecurityTab";
import type { SessionUser } from "@/types/auth";

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: SessionUser;
}

export function AccountDialog({
  open,
  onOpenChange,
  user,
}: AccountDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl space-y-3">
        <DialogHeader>
          <DialogTitle>Cài đặt tài khoản</DialogTitle>
        </DialogHeader>
          <Tabs defaultValue="profile" className="mt-1">
            <TabsList>
              <TabsTrigger value="profile">Thông tin cá nhân</TabsTrigger>
              <TabsTrigger value="security">Bảo mật &amp; Mật khẩu</TabsTrigger>
            </TabsList>

            <div className="mt-5">
              <TabsContent value="profile">
                <ProfileTab user={user} />
              </TabsContent>
              <TabsContent value="security">
                <SecurityTab />
              </TabsContent>
            </div>
          </Tabs>
      </DialogContent>
    </Dialog>
  );
}
