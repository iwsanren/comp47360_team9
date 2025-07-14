import { FeatureCollection } from 'geojson';
import { authenticatedFetch } from '@/hooks/useAuth';

const fetchData = async (url: string, setData: React.Dispatch<React.SetStateAction<FeatureCollection>>) => {
    try {
        const res = await authenticatedFetch(url, { method: "POST" });
        const data = await res.json();
        
        if (res.ok && data) {
            setData(data);
        } else {
            console.error("Failed to fetch data:", data.error || "Unknown error");
        }
    } catch (error) {
        console.error("Failed to fetch data:", error);
    }
};

export default fetchData