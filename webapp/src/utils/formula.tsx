import { round } from "lodash";

const meterToMiles = (value: number) => value * 0.000621372

export const co2Emissions = (value: number) => {
    // generates 0.125 kg per mile
    return round(meterToMiles(value) * 0.270, 1) // use Yellow taxi data 
}

function getTransitTypeCO2Emissions(type: string, value: number) {
  switch (type) {
    case "BUS":
      return round(meterToMiles(value) * 0.177, 1);
    case "SUBWAY":
      return round(meterToMiles(value) * 0.063, 1);
    case "RAIL":
      return round(meterToMiles(value) * 0.161, 1);
    case "GONDOLA_LIFT":
      return round(meterToMiles(value) * 0.048, 1);
    // case "FERRY":
    //   return "";
    // case "CABLE_CAR":
    //   return "";
    // case "FUNICULAR":
    //   return "";
    // case "TRAIN":
    //   return "";
    // case "TRAM":
    //   return "";
    case "OTHER":
      return 0;
    default:
      return 0;
  }
}

export const transitEmissions = (routes: any) => {
    
    const emissions = routes.reduce((res: number[], route: any) => {
        const emission = route.legs[0].steps.reduce((value: number, step: any) => {
            if (step.travel_mode == 'TRANSIT') {
                value = value + getTransitTypeCO2Emissions(step.transit_details.line.vehicle.type, step.distance.value)
            }
            return round(value, 1)
        }, 0)
        // console.log(emission)
        if (res.length < 2) {
            res.push(emission)
            res = res.sort((a,b) => a - b)
        } else {
            if (emission < res[0]) {
                res[0] = emission
            }
            if (emission > res[1]) {
                res[1] = emission
            }
        }
        return res
    }, [])

    return emissions
}