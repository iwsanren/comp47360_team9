import { useState, useEffect } from "react";
import { authenticatedFetch } from './useAuth';

interface FetchDataProps {
  url: string;
  body?: any;
  method?: string
}

const useFetchData = ({ url, body, method }: FetchDataProps) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>();

  useEffect(() => {
    if (!url) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await authenticatedFetch(url, {
            method: method || 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        
        const json = await res.json();
        
        if (res.ok) {
          setData(json);
        } else {
          throw new Error(json.error || 'Request failed');
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, body, method]);

  return { data, loading, error };
}

export default useFetchData