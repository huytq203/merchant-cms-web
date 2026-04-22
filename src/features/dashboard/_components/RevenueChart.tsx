'use client';
import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card/Card';
import { Button } from '@/components/ui/button/Button';
import { Text } from '@/components/ui/typography/Typography';

export default function RevenueChart() {
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Xu hướng doanh thu</CardTitle>
         
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-2">
       
      </CardContent>
    </Card>
  );
}
