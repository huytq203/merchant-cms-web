import PermissionForm from '@/features/permission/components/PermissionForm';

interface EditPermissionPageProps {
  params: Promise<{ id: string }>;
}

const EditPermissionPage = async ({ params }: EditPermissionPageProps) => {
  const { id } = await params;
  return <PermissionForm mode="edit" id={id} />;
};

export default EditPermissionPage;
