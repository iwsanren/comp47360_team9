import { useMemo } from "react";

const busyLevelLegend = {
  label: 'Busyness',
  legends: [
    { level: 'Very Low', color: '#B7E4C7' },
    { level: 'Low', color: '#95D5B2' },
    { level: 'Moderate', color: '#FFE066' },
    { level: 'busy', color: '#F77F00' },
    { level: 'Very Busy', color: '#FF4D4D' },
    { level: 'Extremely Busy', color: '#D00000' },
  ]
};

const aqiLegend = {
  label: 'Air quality',
  legends: [
    { level: 'very well', color: '#CCCCFF' },
    { level: 'good', color: '#0000FF' },
    { level: 'Moderate', color: '#00FF00' },
    { level: 'bad', color: '#FFFF00' },
    { level: 'Very worse', color: '#FF0000' },
  ]
};


const Legend = ({ toggles }: any) => {
    const legends = useMemo(() => {
      let setting: any = []
      if (toggles.busyness) {
        setting = setting.concat(busyLevelLegend)
      } 
      if (toggles['air-quality']) {
        setting = setting.concat(aqiLegend)
      }
      return setting
    } ,[toggles])
    return (
      <div className="absolute right-2 top-2 lg:right-4 lg:top-14 bg-white rounded-sm p-2">
        {legends.map((d: any, i: number) => (
          <div className={i ? 'mt-1' : ''} key={i}>
            <p className="mb-1 font-bold">{d.label} level</p>
            {d.legends.map(( legend: any ) => (
              <div className="flex items-center gap-2" key={legend.level}>
                <div className="w-4 h-2 rounded-xs" style={{ background: legend.color }} />
                <p className="text-xs">{legend.level}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
}

export default Legend