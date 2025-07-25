const busyLevelLegend = [
  { level: 'Very Low', color: '#B7E4C7' },
  { level: 'Low', color: '#95D5B2' },
  { level: 'Moderate', color: '#FFE066' },
  { level: 'busy', color: '#F77F00' },
  { level: 'Very Busy', color: '#FF4D4D' },
  { level: 'Extremely Busy', color: '#D00000' },
];


const Legend = () => {
    return (
      <div className="absolute right-4 bottom-6 bg-white rounded-sm p-2">
        {busyLevelLegend.map(d => (
          <div className="flex items-center gap-2" key={d.level}>
            <div className="w-4 h-2 rounded-xs" style={{ background: d.color }} />
            <p className="text-xs">{d.level}</p>
          </div>
        ))}
      </div>
    )
}

export default Legend