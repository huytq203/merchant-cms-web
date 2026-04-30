"use client";

import { Loader2, Search } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form/Form";
import { Input } from "@/components/ui/input/Input";
import { Checkbox } from "@/components/ui/checkbox/Checkbox";
import { Text } from "@/components/ui";
import { FormUserValues } from "../schemas/form-user.schema";

interface SubMerchant {
  id: string;
  name: string;
  contact?: string;
}

interface SubMerchantSelectionProps {
  control: any;
  subMerchants: SubMerchant[];
  isLoading: boolean;
  searchKeyword: string;
  onSearchChange: (value: string) => void;
}

export function SubMerchantSelection({
  control,
  subMerchants,
  isLoading,
  searchKeyword,
  onSearchChange,
}: SubMerchantSelectionProps) {
  return (
    <FormField
      control={control}
      name="assignedSubMerchantsIds"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Chọn Sub-merchant</FormLabel>
          <FormControl>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  icon={<Search className="w-4 h-4" />}
                  placeholder="Tìm kiếm tên hoặc mã Sub-merchant..."
                  value={searchKeyword}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="border rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : subMerchants.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Không tìm thấy Sub-merchant nào
                  </p>
                ) : (
                  subMerchants.map((subMerchant) => (
                    <div
                      key={subMerchant.id}
                      className="flex items-start gap-3"
                    >
                      <Checkbox
                        id={`sub-merchant-${subMerchant.id}`}
                        checked={
                          field.value?.includes(subMerchant.id) || false
                        }
                        onCheckedChange={(checked) => {
                          const current = field.value || [];
                          if (checked) {
                            field.onChange([...current, subMerchant.id]);
                          } else {
                            field.onChange(
                              current.filter((filteredId: string) => filteredId !== subMerchant.id)
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={`sub-merchant-${subMerchant.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <p className="text-sm font-medium">
                          {subMerchant.name}
                        </p>
                        {subMerchant.contact && (
                          <p className="text-xs text-muted-foreground">
                            {subMerchant.contact}
                          </p>
                        )}
                      </label>
                    </div>
                  ))
                )}
              </div>

              {field.value && field.value.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Đã chọn {field.value.length} Sub-merchant
                </p>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
