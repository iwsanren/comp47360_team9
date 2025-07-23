import { DateTime } from 'luxon';
import { useEffect, useMemo, useState } from 'react';
import { Timestamp } from 'next/dist/server/lib/cache-handlers/types';

// import Button from '@/components/Button';
import generateHourlyGroups from '@/utils/generateHourlyGroups';
import Select from '@/components/Select';


interface PredictionSectionProps {
  layerName: string;
  map: mapboxgl.Map | null;
  busynessLayerSetting: any;
  setTime: React.Dispatch<React.SetStateAction<number>>;
  timestamp: Timestamp;
  setFeatureData: React.Dispatch<React.SetStateAction<any>>;
}

const zone = "America/New_York"; 

const PredictionSection = ({
    setTime,
  }: PredictionSectionProps) => {
  const timeGroups = useMemo(() => generateHourlyGroups(), [])
  const [date, setDate] = useState<string | undefined>()
  const [hour, setHour] = useState<string | undefined>()
  const dates = useMemo(() => Object.keys(timeGroups), [timeGroups])
  useEffect(() => {
    setDate(Object.keys(timeGroups)?.[0])
  }, [timeGroups])

  useEffect(() => {
    if (date) {
      setHour(timeGroups?.[date]?.[0])
    }
  }, [timeGroups, date])

  useEffect(() => {
    const ManhattanTime = DateTime.fromFormat(`${date} ${hour}`, 'M/d HH:mm', { zone }).toUTC().toSeconds();
    setTime(ManhattanTime)
  }, [date, hour])

  // const handleShowPrediction = async () => {
  //   if (!map) return;

  //   setIsLoading(true);
  //   try {
  //     const predictedBusyness = await fetchData(`/api/manhattan?timestamp=${timestamp}`);
  //     setFeatureData((prev: any) => ({ ...prev, predictedBusyness }));

  //     const source = map.getSource(layerName);
  //     const layerId = `${layerName}-layer`;

  //     if (predictedBusyness && source && 'setData' in source) {
  //       // If the source exists, update its data
  //       source.setData(predictedBusyness);
  //     } else {
  //       // If source doesn't exist, add it
  //       if (!source) {
  //         map.addSource(layerName, {
  //           type: "geojson",
  //           data: predictedBusyness,
  //         });
  //       }

  //       // If layer already exists, remove it to avoid duplication
  //       if (map.getLayer(layerId)) {
  //         map.removeLayer(layerId);
  //       }

  //       // Add the layer but keep it hidden while loading
  //       map.addLayer({
  //         id: layerId,
  //         source: layerName,
  //         layout: {
  //           visibility: 'none', // Initially hidden during loading
  //         },
  //         ...busynessLayerSetting,
  //       });
  //     }

  //     // Show the layer after data is loaded
  //     map.setLayoutProperty(layerId, 'visibility', 'visible');
  //   } catch (err) {
  //     console.error("Prediction load failed:", err);
  //   } finally {
  //     // Always turn off loading state
  //     setIsLoading(false);
  //   }
  // };
  return (
    <div className='flex gap-4 mb-4'>
      <Select onChange={setDate} label="Date" options={dates} value={date} />
      {date && <Select onChange={setHour} label="Time" options={timeGroups[date]} value={hour} />}
      {/* <InputSlider
        label={label}
        max={timeGroups.length - 1}
        value={date}
        onChange={setDate}
      />
      <InputSlider
        label={times[hour]}
        max={times.length - 1}
        value={hour}
        onChange={setHour}
      /> */}
      {/* <div>
        <Button
          isDisabled={isLoading}
          onClick={handleShowPrediction}
        >Get Prediction</Button>
      </div> */}
    </div>
  );
};

export default PredictionSection;
