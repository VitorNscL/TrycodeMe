import { useCallback, useEffect, useState } from 'react';

export function useFetch<T>(callback: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await callback();
      setData(result);
      return result;
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Erro inesperado.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    callback()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) setError(err?.response?.data?.message || err?.message || 'Erro inesperado.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, deps);

  return { data, loading, error, refetch: execute };
}
