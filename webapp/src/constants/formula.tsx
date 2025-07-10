export const CARBON_EMISSIONS_WEIGHT = (value: number) => {
    // 0.4 kg per mile
    const miles = value * 0.000621372 // convert to miles
    return Math.round(miles * 0.4 * 10) / 10
}