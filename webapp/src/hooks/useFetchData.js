import { useState, useEffect } from "react";

const useFetchData = (url, body, method) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(url, {
            method: method || 'POST',
            headers: {
                'Content-Type': 'application/json', // to call sever the body is in JSON format.
            },
            body: JSON.stringify(body),
        });
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
}

export default useFetchData