"use client";

import { UseFormSetValue, useWatch } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form/Form";
import { RadioGroup } from "@/components/ui/radio-group/RadioGroup";
import { Radio } from "@/components/ui/radio/Radio";
import { FormUserValues } from "../schemas/form-user.schema";
import { Control } from "react-hook-form";

interface SubMerchantScopeRadioProps {
  control: Control<FormUserValues>;
  subMerchants: Array<{ id: string; name: string }>;
  setValue: UseFormSetValue<FormUserValues>;
}

export function SubMerchantScopeRadio({
  control,
  subMerchants,
  setValue,
}: SubMerchantScopeRadioProps) {
  return (
    <FormField
      control={control}
      name="subMerchantScope"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Phạm vi quản lý Sub-merchant *</FormLabel>
          <FormControl>
            <RadioGroup
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                if (value === "all") {
                  setValue(
                    "assignedSubMerchantsIds",
                    subMerchants.map((m) => m.id),
                  );
                }
              }}
              orientation="vertical"
            >
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="flex items-center  gap-3">
                  <Radio
                    size="sm"
                    value="all"
                    id="scope-all"
                    label="Toàn bộ Sub-merchant"
                  />
                </div>

                <div className="flex items-center  gap-3">
                  <Radio
                    size="sm"
                    value="specific"
                    id="scope-specific"
                    label="Cấp độ chỉ định"
                  />
                </div>
              </div>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
