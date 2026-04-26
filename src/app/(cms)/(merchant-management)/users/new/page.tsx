'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import FormUserComponent from '@/features/users/components/FormUser'
import { useCreateUser } from '@/features/users/hooks/use-create-user'
import type { FormUserValues } from '@/features/users/schemas/form-user.schema'

const Page = () => {
  const router = useRouter()
  const { mutateAsync: createUser, isPending } = useCreateUser()

  const handleSubmit = async (data: FormUserValues) => {
    try {
      await createUser(data)
      router.push('/users')
    } catch (error) {
      console.error('Failed to create user:', error)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý Nhân viên</h1>
        <p className="text-muted-foreground">Thêm mới nhân viên vào hệ thống</p>
      </div>
      <FormUserComponent
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isLoading={isPending}
      />
    </div>
  )
}

export default Page