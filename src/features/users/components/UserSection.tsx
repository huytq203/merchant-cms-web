"use client";

import { Card, CardContent } from "@/components/ui";
import React, { useState } from "react";
import UserFilter, { UserFilterValues } from "./UserFilter";
import UserTable from "./UserTable";
import { usePermissions } from "../hooks/use-permissions";
import { useForm } from "react-hook-form";

const EMPTY_FILTER: UserFilterValues = {
  name: "",
  status: "",
  permissionGroupId: "",
};

const UserSection = () => {
  const [filter, setFilter] = useState<UserFilterValues>(EMPTY_FILTER);
  const { data: permissions } = usePermissions();

  const permissionOptions =
    permissions?.data.map((p) => ({
      label: p.name,
      value: String(p.id),
    })) ?? [];

  const { register, handleSubmit, reset, control } = useForm<UserFilterValues>({
    defaultValues: { name: "", status: "", permissionGroupId: "" },
  });

  const handleClear = () => {
    reset({ name: "", status: "", permissionGroupId: "" });
    setFilter(EMPTY_FILTER);
  };
  return (
    <div className="space-y-3">
      <Card>
        <CardContent>
          <UserFilter
            onFilter={setFilter}
            handleClear={handleClear}
            permissionOptions={permissionOptions}
            register={register}
            handleSubmit={handleSubmit}
            reset={reset}
            control={control}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <UserTable filter={filter} />
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSection;
