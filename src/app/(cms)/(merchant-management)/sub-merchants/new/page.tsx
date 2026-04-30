import { NewSubMerchantForm } from '@/features/sub-merchants/components/NewSubMerchantForm';

const NewSubMerchantPage = () => {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Thiết lập Sub-merchant mới</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Vui lòng hoàn thành các bước để khởi tạo merchant.
        </p>
      </div>
      <NewSubMerchantForm />
    </div>
  );
};

export default NewSubMerchantPage;
