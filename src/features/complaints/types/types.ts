export type ComplaintStatus = 'pending' | 'processing' | 'resolved' | 'rejected';
export type ComplaintSource = 'customer' | 'gateway' | 'merchant';

export interface Complaint {
  id: string;
  ticketCode: string;
  transactionId: string | null;
  transactionCode: string | null;
  source: ComplaintSource;
  content: string;
  status: ComplaintStatus;
  deadline: string | null;
  note: string | null;
  lastUpdatedAt: string | null;
  createdAt: string;
}

export interface ComplaintMessage {
  id: string;
  role: 'admin' | 'merchant';
  senderName: string;
  content: string;
  time: string;
}

export interface ComplaintListResponse {
  data: Complaint[];
  pagination: { total: number; page: number; pageSize: number };
}

export type ComplaintListFilter = {
  createdFromDate?: string;
  createdToDate?: string;
  source?: string;
  status?: string;
};
