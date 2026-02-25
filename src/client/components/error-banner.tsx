import { useEffect } from "preact/hooks";
import { useCrm } from "../context";

export function ErrorBanner() {
  const { error, setError } = useCrm();

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error, setError]);

  if (!error) return null;

  return <div class="error-banner">{error}</div>;
}
