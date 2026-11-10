// Loads a private image (needs the auth token) as an object URL; frees it after.
import { useEffect, useState } from "react";
import { fetchPrivateImage } from "../../lib/api.js";

export default function usePrivateImage(path) {
  const [state, setState] = useState({ url: null, loading: !!path, error: false });
  useEffect(() => {
    if (!path) { setState({ url: null, loading: false, error: false }); return undefined; }
    let alive = true; let made = null;
    setState({ url: null, loading: true, error: false });
    fetchPrivateImage(path)
      .then((u) => { made = u; if (alive) setState({ url: u, loading: false, error: false }); else URL.revokeObjectURL(u); })
      .catch(() => alive && setState({ url: null, loading: false, error: true }));
    return () => { alive = false; if (made) URL.revokeObjectURL(made); };
  }, [path]);
  return state;
}
