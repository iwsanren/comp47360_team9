// Unit: CO2 in kilograms
// Returns the minimum number of urban trees needed to absorb the given amount of CO2 in one day (rounded up to nearest integer)
const calculateTreesNeededPerDay = (co2_kg: any) => {
  const annualAbsorptionPerTree = 60; // Each urban tree absorbs 60 kg of CO2 per year
  const dailyAbsorptionPerTree = annualAbsorptionPerTree / 365; // Convert to daily absorption
  return Math.ceil(co2_kg / dailyAbsorptionPerTree);
};

export default calculateTreesNeededPerDay
