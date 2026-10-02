
import FormUserComponent from "@/features/users/components/FormUser";

const Page = () => {


  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý Nhân viên</h1>
        <p className="text-muted-foreground">Thêm mới nhân viên vào hệ thống</p>
      </div>
      <FormUserComponent
        mode="new"
      />
    </div>
  );
};

export default Page;
