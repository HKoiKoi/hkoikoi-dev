import { vi, type Mock } from "vitest";

// 관리자 Server Action 단위 테스트용 Supabase 쿼리 체인 목.
// 체인의 끝(maybeSingle·single·await·rpc)이 호출될 때마다 results를 순서대로 하나씩 소비한다.

export type DbResult = {
  data?: unknown;
  error?: { code?: string; message: string } | null;
};

export type RecordedCall = {
  table?: string;
  rpc?: string;
  ops: [string, unknown[]][];
};

const CHAIN_METHODS = [
  "select",
  "insert",
  "update",
  "delete",
  "eq",
  "order",
  "limit",
] as const;

export function mockSupabase(createClientMock: Mock, results: DbResult[]) {
  const queue = [...results];
  const next = (): Promise<DbResult> =>
    Promise.resolve(queue.shift() ?? { data: null, error: null });
  const calls: RecordedCall[] = [];

  const from = vi.fn((table: string) => {
    const call: RecordedCall = { table, ops: [] };
    calls.push(call);
    const builder: Record<string, unknown> = {
      maybeSingle: vi.fn(() => next()),
      single: vi.fn(() => next()),
      then: (
        resolve: (value: DbResult) => unknown,
        reject?: (reason: unknown) => unknown,
      ) => next().then(resolve, reject),
    };
    for (const method of CHAIN_METHODS) {
      builder[method] = vi.fn((...args: unknown[]) => {
        call.ops.push([method, args]);
        return builder;
      });
    }
    return builder;
  });

  const rpc = vi.fn((name: string, args: unknown) => {
    calls.push({ rpc: name, ops: [["rpc", [args]]] });
    return next();
  });

  createClientMock.mockResolvedValue({ from, rpc });
  return { from, rpc, calls };
}

/** 기록된 호출에서 연산(insert·update·eq …)의 인자를 찾는다. */
export function findOp(
  call: RecordedCall | undefined,
  name: string,
): unknown[] | undefined {
  return call?.ops.find(([op]) => op === name)?.[1];
}

/** 기록된 호출에서 같은 연산(eq 등)의 인자를 모두 모은다. */
export function allOps(call: RecordedCall | undefined, name: string) {
  return (call?.ops ?? []).filter(([op]) => op === name).map(([, a]) => a);
}
