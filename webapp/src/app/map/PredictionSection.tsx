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

  return (
    <div className='flex gap-4 mb-4'>
      <Select onChange={setDate} label="Date" options={dates} value={date} />
      {date && <Select onChange={setHour} label="Time" options={timeGroups[date]} value={hour} />}
    </div>
  );
};

export default PredictionSection;
