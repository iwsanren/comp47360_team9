import { FeatureCollection } from 'geojson';

const fetchData = async (url: string, setData: React.Dispatch<React.SetStateAction<FeatureCollection>>) => {
    try {
        const res = await fetch(url, { method: "POST" });
        const data = await res.json();
        if (data) {
            setData(data);
        } else {
            console.error("Invalid data");
        }
    } catch (error) {
        console.error("Failed to fetch data:", error);
    }
};

export default fetchData