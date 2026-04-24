import EditPermission from '@/features/permission/components/EditPermission';

interface EditPermissionPageProps {
  params: Promise<{ id: string }>;
}

const EditPermissionPage = async ({ params }: EditPermissionPageProps) => {
  const { id } = await params;
  return (
    <div>
      <EditPermission id={id} />
    </div>
  );
};

export default EditPermissionPage;
