'use client'

import React, { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button/Button'
import { Input } from '@/components/ui/input/Input'
import { Select } from '@/components/ui/select/Select'
import { Checkbox } from '@/components/ui/checkbox/Checkbox'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form/Form'
import { Card } from '@/components/ui/card/Card'
import { usePermissions } from '../hooks/use-permissions'
import { useSubMerchants } from '../hooks/use-sub-merchants'
import { formUserSchema, type FormUserValues } from '../schemas/form-user.schema'

interface FormUserProps {
  onSubmit?: (data: FormUserValues) => Promise<void> | void
  onCancel?: () => void
  initialData?: Partial<FormUserValues>
  isLoading?: boolean
}

const FormUser: React.FC<FormUserProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedScope, setSelectedScope] = useState<'all' | 'specific'>(initialData?.subMerchantScope as 'all' | 'specific' || 'all')

  const form = useForm<FormUserValues>({
    resolver: zodResolver(formUserSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      phone: initialData?.phone ?? '',
      email: initialData?.email ?? '',
      permissionGroupId: initialData?.permissionGroupId ?? '',
      subMerchantScope: (initialData?.subMerchantScope as 'all' | 'specific') ?? 'all',
      assignedSubMerchants: initialData?.assignedSubMerchants ?? [],
    },
  })

  const { data: permissionsData, isLoading: isPermissionsLoading } = usePermissions()
  const { data: subMerchantsData, isLoading: isSubMerchantsLoading } = useSubMerchants({
    keyword: searchKeyword,
  })

  const permissionOptions = useMemo(() => {
    return (permissionsData?.data || []).map((perm) => ({
      label: perm.name,
      value: perm.id as string,
    }))
  }, [permissionsData])

  const subMerchants = useMemo(() => {
    return subMerchantsData?.data || []
  }, [subMerchantsData])

  const handleSubmit = async (data: FormUserValues) => {
    const validatedData = {
      ...data,
      subMerchantScope: selectedScope,
    }
    if (onSubmit) {
      await onSubmit(validatedData)
    }
  }

  return (
    <Card className="w-full  p-6">
      <h2 className="text-lg font-semibold mb-6">Thêm mới nhân viên</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Họ và tên + Số điện thoại */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Họ và tên *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nguyễn Văn A"
                      {...field}
                      error={fieldState.error?.message}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Số điện thoại *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0912xxxxxx"
                      {...field}
                      error={fieldState.error?.message}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Email đăng nhập (Tên tài khoản) *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="email@merchant.com"
                    {...field}
                    error={fieldState.error?.message}
                  />
                </FormControl>
                <FormDescription>Mật khẩu khó tạo sẽ được gửi với email này.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nhóm quyền */}
          <FormField
            control={form.control}
            name="permissionGroupId"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Nhóm quyền (Vai trò) *</FormLabel>
                <FormControl>
                  <Select
                    placeholder="-- Chọn nhóm quyền --"
                    options={permissionOptions}
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                    disabled={isPermissionsLoading}
                    emptyText={isPermissionsLoading ? 'Đang tải...' : 'Không có nhóm quyền nào'}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phạm vi quản lý Sub-merchant */}
          <FormField
            control={form.control}
            name="subMerchantScope"
            render={() => (
              <FormItem>
                <FormLabel>Phạm vi quản lý Sub-merchant *</FormLabel>
                <FormControl>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="subMerchantScope"
                        value="all"
                        checked={selectedScope === 'all'}
                        onChange={() => {
                          setSelectedScope('all')
                          form.setValue('subMerchantScope', 'all')
                          form.setValue('assignedSubMerchants', [])
                        }}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm font-medium">Toàn bộ Sub-merchant</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="subMerchantScope"
                        value="specific"
                        checked={selectedScope === 'specific'}
                        onChange={() => {
                          setSelectedScope('specific')
                          form.setValue('subMerchantScope', 'specific')
                        }}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm font-medium">Cấp độ chỉ định</span>
                    </label>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Sub-merchant Selection */}
          {selectedScope === 'specific' && (
            <FormField
              control={form.control}
              name="assignedSubMerchants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chọn Sub-merchant</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Tìm kiếm tên hoặc mã Sub-merchant..."
                          value={searchKeyword}
                          onChange={(e) => setSearchKeyword(e.target.value)}
                          className="pl-9"
                        />
                      </div>

                      {/* Sub-merchant List */}
                      <div className="border rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
                        {isSubMerchantsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : subMerchants.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            Không tìm thấy Sub-merchant nào
                          </p>
                        ) : (
                          subMerchants.map((subMerchant) => (
                            <div key={subMerchant.id} className="flex items-start gap-3">
                              <Checkbox
                                id={`sub-merchant-${subMerchant.id}`}
                                checked={field.value?.includes(subMerchant.id) || false}
                                onCheckedChange={(checked) => {
                                  const current = field.value || []
                                  if (checked) {
                                    field.onChange([...current, subMerchant.id])
                                  } else {
                                    field.onChange(current.filter((id) => id !== subMerchant.id))
                                  }
                                }}
                              />
                              <label
                                htmlFor={`sub-merchant-${subMerchant.id}`}
                                className="flex-1 cursor-pointer"
                              >
                                <p className="text-sm font-medium">{subMerchant.name}</p>
                                <p className="text-xs text-muted-foreground">{subMerchant.contact}</p>
                              </label>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Selected Count */}
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
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isLoading}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="solid"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Tạo nhân viên
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  )
}

export default FormUser
