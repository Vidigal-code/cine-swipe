import { randomUUID } from 'crypto';
import { PaginationParams } from '../../shared/pagination/pagination.types';

export function nowIso(): string {
  return new Date().toISOString();
}

export function createUuid(): string {
  return randomUUID();
}

export function toDate(value: string): Date {
  return new Date(value);
}

export function paginateDescendingByCreatedAt<T extends { createdAt: string }>(
  values: T[],
  params: PaginationParams,
): { items: T[]; total: number } {
  const sorted = [...values].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return {
    items: sorted.slice(params.skip, params.skip + params.limit),
    total: sorted.length,
  };
}

export function findByField<T>(
  values: T[],
  selector: (item: T) => string | null | undefined,
  expected: string,
): T | null {
  return values.find((item) => selector(item) === expected) ?? null;
}

export function toPlainRecord(
  value: Record<string, unknown> | undefined | null,
): Record<string, unknown> {
  if (!value) {
    return {};
  }
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}
