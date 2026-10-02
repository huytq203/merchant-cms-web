"use client";

import FormUserComponent from "@/features/users/components/FormUser";
import { useParams } from "next/navigation";
import { useUserByIdQuery } from "@/features/users/hooks/use-user-query";

const UpdateUser = () => {
  const { id } = useParams();
  const { data: userData } = useUserByIdQuery(id as string);

  if (!id || !userData) return null;
  return (
    <div>
      <FormUserComponent
        mode="update"
        initialData={userData}
      />
    </div>
  );
};

export default UpdateUser;
