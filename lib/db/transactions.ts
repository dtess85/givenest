import { sql } from "./index";

export interface Transaction {
  id: string;
  charity_id: string;
  amount: number;
  property_address?: string;
  property_city?: string;
  closing_date?: string;
  agent_name?: string;
  agent_share_consent: boolean;
  client_name?: string;
  client_share_consent: boolean;
  notes?: string;
  created_at: string;
}

export async function getTransactionsByCharityId(charityId: string): Promise<Transaction[]> {
  const { rows } = await sql`
    SELECT * FROM transactions WHERE charity_id = ${charityId} ORDER BY closing_date DESC, created_at DESC
  `;
  return rows as Transaction[];
}

export async function createTransaction(data: Omit<Transaction, "id" | "created_at">): Promise<Transaction> {
  const { rows } = await sql`
    INSERT INTO transactions (
      charity_id, amount, property_address, property_city, closing_date,
      agent_name, agent_share_consent, client_name, client_share_consent, notes
    ) VALUES (
      ${data.charity_id}, ${data.amount}, ${data.property_address ?? null},
      ${data.property_city ?? null}, ${data.closing_date ?? null},
      ${data.agent_name ?? null}, ${data.agent_share_consent},
      ${data.client_name ?? null}, ${data.client_share_consent}, ${data.notes ?? null}
    ) RETURNING *
  `;
  return rows[0] as Transaction;
}

export async function deleteTransaction(id: string): Promise<void> {
  await sql`DELETE FROM transactions WHERE id = ${id}`;
}
