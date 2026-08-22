import { TransactionType, TRANSACTION_TYPE_OPTIONS } from "./types";

export function getTransactionSign(type: TransactionType): 1 | -1 {
  const match = TRANSACTION_TYPE_OPTIONS.find((option) => option.value === type);
  return (match?.sign ?? 1) as 1 | -1;
}