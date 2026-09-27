import { dedupeRequest, clearAllCaches } from "../../utils/apiCache";

describe("apiCache & dedupeRequest Suite", () => {
  beforeEach(() => {
    clearAllCaches();
  });

  test("dedupeRequest executes fetcher once for simultaneous calls with the same key", async () => {
    let callCount = 0;
    const slowFetcher = () =>
      new Promise<{ value: string }>((resolve) => {
        callCount++;
        setTimeout(() => resolve({ value: "test-data" }), 20);
      });

    // Fire 3 simultaneous calls with same key
    const [p1, p2, p3] = await Promise.all([
      dedupeRequest("test_key", slowFetcher),
      dedupeRequest("test_key", slowFetcher),
      dedupeRequest("test_key", slowFetcher),
    ]);

    expect(callCount).toBe(1);
    expect(p1).toEqual({ value: "test-data" });
    expect(p2).toEqual({ value: "test-data" });
    expect(p3).toEqual({ value: "test-data" });
  });

  test("dedupeRequest allows a subsequent call after the in-flight request finishes", async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return { timestamp: Date.now() };
    };

    await dedupeRequest("subsequent_key", fetcher);
    expect(callCount).toBe(1);

    await dedupeRequest("subsequent_key", fetcher);
    expect(callCount).toBe(2);
  });

  test("dedupeRequest cleans up key even when fetcher rejects", async () => {
    let callCount = 0;
    const failingFetcher = async () => {
      callCount++;
      throw new Error("Network error");
    };

    await expect(dedupeRequest("fail_key", failingFetcher)).rejects.toThrow("Network error");
    expect(callCount).toBe(1);

    // Next call should be allowed to retry because inFlightRequests was cleared
    await expect(dedupeRequest("fail_key", failingFetcher)).rejects.toThrow("Network error");
    expect(callCount).toBe(2);
  });
});
