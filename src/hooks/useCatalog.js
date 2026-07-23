import { useEffect, useState } from "react";
import {
  getBusinessCatalog,
  getGlobalCatalog,
} from "../services/catalogService";
export function useCatalog(code, { business = false } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setLoading(true);
    });
    (business ? getBusinessCatalog : getGlobalCatalog)(code)
      .then((x) => {
        if (active) setItems(x);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [business, code]);
  return { items, loading, error };
}
