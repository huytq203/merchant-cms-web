"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button/Button";
import { Form } from "@/components/ui/form/Form";
import { Card } from "@/components/ui/card/Card";
import { usePermissions } from "../hooks/use-permissions";
import { useSubMerchants } from "../hooks/use-sub-merchants";
import {
  formUserSchema,
  type FormUserValues,
} from "../schemas/form-user.schema";
import { User } from "../types/type";
import { UserFormFields } from "./UserFormFields";
import { SubMerchantScopeRadio } from "./SubMerchantScopeRadio";
import { SubMerchantSelection } from "./SubMerchantSelection";
import { useHandleAddUser, useHandleUpdateUser } from "../hooks/use-handle";

interface FormUserProps {
  mode?: "new" | "update";
  onSubmit?: (data: FormUserValues) => Promise<void> | void;
  onCancel?: () => void;
  initialData?: User;
  isLoading?: boolean;
}

const FormUser: React.FC<FormUserProps> = ({
  mode,
  onCancel,
  initialData,
}) => {
  const router = useRouter();
  const [searchKeyword, setSearchKeyword] = useState("");
  const isUpdateMode = mode === "update";

  const form = useForm<FormUserValues>({
    resolver: zodResolver(formUserSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      email: initialData?.email ?? "",
      phone: initialData?.phone ?? "",
      permissionGroupId: initialData?.permissionGroupId ?? "",
      subMerchantScope:
        (initialData?.subMerchantScope as "all" | "specific") ?? "all",
      assignedSubMerchantsIds: initialData?.assignedSubMerchantsIds ?? [],
    },
  });

  const selectedScope = form.watch("subMerchantScope");
  const { data: permissionsData, isLoading: isPermissionsLoading } =
    usePermissions();
  const { data: subMerchantsData, isLoading: isSubMerchantsLoading } =
    useSubMerchants({ keyword: searchKeyword });

  const permissionOptions = useMemo(() => {
    return (permissionsData?.data || []).map((perm) => ({
      label: perm.name,
      value: perm.id as string,
    }));
  }, [permissionsData]);

  const subMerchants = useMemo(() => {
    return subMerchantsData?.data || [];
  }, [subMerchantsData]);

  const { mutate: addMutate, isPending: isAdding } = useHandleAddUser();
  const { mutate: updateMutate, isPending: isUpdating } = useHandleUpdateUser(
    initialData?.id || "",
  );

  const isSubmitting = isAdding || isUpdating;

  const handleSubmit = async (data: FormUserValues) => {
    if (isUpdateMode) {
      updateMutate(data, {
        onSuccess: () => {
          router.push("/users");
          router.refresh();
        },
      });
    } else {
      addMutate(data, {
        onSuccess: () => {
          router.push("/users");
          router.refresh();
        },
      });
    }
  };


  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        email: initialData.email,
        phone: initialData.phone,
        permissionGroupId: initialData.permissionGroupId,
        subMerchantScope: initialData.subMerchantScope,
        assignedSubMerchantsIds: initialData.assignedSubMerchantsIds,
      });
    }
  }, [initialData, form]);


  return (
    <Card className="w-full p-6">
      <h2 className="text-lg font-semibold mb-6">
        {isUpdateMode ? "Cập nhật" : "Thêm mới"} nhân viên
      </h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <UserFormFields
            control={form.control}
            permissionOptions={permissionOptions}
            isPermissionsLoading={isPermissionsLoading}
          />

          <SubMerchantScopeRadio
            control={form.control}
            subMerchants={subMerchants}
            setValue={form.setValue}
          />

          {selectedScope === "specific" && (
            <SubMerchantSelection
              control={form.control}
              subMerchants={subMerchants}
              isLoading={isSubMerchantsLoading}
              searchKeyword={searchKeyword}
              onSearchChange={setSearchKeyword}
            />
          )}

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="solid"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {isUpdateMode ? "Cập nhật" : "Tạo"} nhân viên
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
};

export default FormUser;
