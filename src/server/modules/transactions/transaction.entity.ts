"server-only"
import type { Transaction } from "@prisma/client";

export interface TransactionResponse {
    id: string;
    code: string;
    cardType: string;
    cardNumber: string;
    cardHolderName: string;
    amount: number;
    currency: string;
    fee: number;
    netAmount: number;
    subMerchantId: string;
    subMerchantName: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    createdAt: string;
    status: string;
    description: string;
    referenceCode: string;
    paymentMethod: string;
    bankCode: string;
    responseCode: string;
    responseMessage: string;
}

export function toTransactionResponse(transaction: Transaction): TransactionResponse {
    return {
        id: transaction.id,
        code: transaction.code,
        cardType: transaction.cardType,
        cardNumber: transaction.cardNumber,
        cardHolderName: transaction.cardHolderName,
        amount: Number(transaction.amount),
        currency: transaction.currency,
        fee: transaction.fee,
        netAmount: Number(transaction.netAmount),
        subMerchantId: transaction.subMerchantId,
        subMerchantName: transaction.subMerchantName,
        customerId: transaction.customerId,
        customerName: transaction.customerName,
        customerPhone: transaction.customerPhone || '',
        createdAt: transaction.createdAt.toISOString(),
        status: transaction.status,
        description: transaction.description || '',
        referenceCode: transaction.referenceCode || '',
        paymentMethod: transaction.paymentMethod || '',
        bankCode: transaction.bankCode || '',
        responseCode: transaction.responseCode || '',
        responseMessage: transaction.responseMessage || '',
    };
}