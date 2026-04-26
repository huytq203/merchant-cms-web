import { ColumnDef } from "@tanstack/react-table";
import { User } from "../types/type";
import { Text } from "@/components/ui";
import { SubMerchantDetailModal } from "../components/SubMerchantDetailModal";
import { Badge } from "@/components/ui/badge/Badge";
import { UserStatus } from "../constants/User.constant";

export const getUserColumns = (): ColumnDef<User>[] => {
    return [
        {
            accessorKey: "name",
            header: "Tên",
            cell: ({ row }) => {
                const user = row.original;
                return <div className="flex flex-col space-y-1">
                    <Text className="text-sm font-medium">{user.name}</Text>
                    <Text className="text-xs text-muted-foreground">{user.email}</Text>
                </div>
            }
        },
        {
            accessorKey: "permissionGroupName",
            header: "Số điện thoại",
        },

        {
            accessorKey: "assignedSubMerchants",
            header: "Phạm vi Sub Merchant",
            meta:{align:"center"},
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <SubMerchantDetailModal
                        merchantIds={user.assignedSubMerchants}
                        userName={user.name}
                    />
                );
            }
        },

        {
            accessorKey: "createdAt",
            header: "Ngày tạo",
        },
        {
            accessorKey: "status",
            header: "Trạng thái",
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <Badge variant={user.status === UserStatus.ACTIVE ? "soft-primary" : "soft-danger"}>
                        {user.status === UserStatus.ACTIVE ? "Hoạt động" : "Khóa"}
                    </Badge>
                );
            }
        },
    ];
}