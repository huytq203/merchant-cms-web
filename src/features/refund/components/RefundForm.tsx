"use client"
import { Button, Card, CardContent, Drawer, DrawerContent, DrawerHeader, DrawerTitle, Sheet, SheetContent, SheetHeader, SheetTitle, Text } from "@/components/ui";
import React from "react";
import RefundTable from "./RefundTable";
import RefundFilter from "./RefundFilter";
import { Download, Filter } from "lucide-react";

const RefundForm = () => {
    const [open, setOpen] = React.useState(false);
  return (
    <div className="space-y-3">
      {/* <RefundFilter /> */}
      <div className="flex items-center justify-between">
        <div className="">
          <Text as="h1" className="text-2xl font-bold ">
            Quản lý yêu cầu hoàn tiền
          </Text>
          <Text as="p" className="text-sm text-muted-foreground mt-1">
            Kiểm tra, xử lý các yêu cầu hoàn tiền của cửa hàng.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
          >
            Xuất excel
          </Button>
          <Button onClick={() => setOpen(true)} size="sm" leftIcon={<Filter className="h-4 w-4" />}>
            Tìm kiếm nâng cao
          </Button>
        </div>
      </div>
      <Card>
        <CardContent>
          <RefundTable />
        </CardContent>
      </Card>



      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="h-fit">
          <DrawerHeader>
            <DrawerTitle>Tìm kiếm nâng cao</DrawerTitle>
          </DrawerHeader>

          <div className="p-2">
            <RefundFilter />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default RefundForm;
