import { DateTime } from 'luxon';
import { useEffect, useMemo, useState } from 'react';

import Button from '@/components/Button';
import InputSlider from '@/components/InputSilder';
import generateHourlyGroups from '@/utils/generateHourlyGroups';
import fetchData from '@/utils/fetchData';
import getNextHourInNY from '@/utils/getNextHourInNY';

interface PredictionSectionProps {
  map: mapboxgl.Map | null;
  busynessLayerSetting: any;
}

function animateBusyness(oldData, newData, duration = 1000) {
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const interpolated = {
      ...newData,
      features: newData.features.map((f, i) => {
        const oldVal = oldData.features[i].properties.busyness;
        const newVal = f.properties.busyness;
        const currentVal = oldVal + (newVal - oldVal) * progress;

        return {
          ...f,
          properties: {
            ...f.properties,
            busyness: currentVal,
          },
        };
      }),
    };

    map.getSource("busyness").setData(interpolated);

    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}


const key = 'busyness-prediction'
const zone = "America/New_York"; 

const PredictionSection = ({ map, busynessLayerSetting }: PredictionSectionProps) => {
  const [timestamp, setTime] = useState(getNextHourInNY());
  const [date, setDate] = useState(0)
  const [hour, setHour] = useState(0)
  const [isLoading, setIsLoading] = useState<boolean>()
  const timeGroups = generateHourlyGroups()
  const [label, times] = useMemo(() => timeGroups[date], [timeGroups, date])
  useEffect(() => {
    setHour(0)
  }, [date])
  useEffect(() => {
    const ManhattanTime = DateTime.fromFormat(`${label} ${times[hour]}`, 'M/d HH:mm', { zone }).toUTC().toSeconds();
    setTime(ManhattanTime)
  }, [label, times, hour])
  const handleShowPrediction = async () => {
    if (!map) return
    setIsLoading(true)
    const predictionBusyness = await fetchData(`/api/manhattan?timestamp=${timestamp}`)
    const source = map.getSource(key)
    if (predictionBusyness && source && 'setData' in source) {
      // predictionBusyness.features.forEach((feature: any) => map.setPaintProperty(`${key}-layer`, "fill-color", feature.properties.busyness))    
      source.setData(predictionBusyness);
    } else {
      map.addSource(key, {
        type: "geojson",
        data: predictionBusyness,
      });

      map.addLayer({
        id: `${key}-layer`,
        source: key,
        ...busynessLayerSetting
      });
    }
    setIsLoading(false)
  }
  return (
    <div className='flex flex-col gap-12'>
      <InputSlider
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
      />
      <div>
        <Button
          isDisabled={isLoading}
          onClick={handleShowPrediction}
        >Get Prediction</Button>
      </div>
    </div>
  );
};

export default PredictionSection;
