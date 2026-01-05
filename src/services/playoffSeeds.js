// Service to fetch playoff seeds from ESPN Standings API
const ESPN_STANDINGS_API = 'https://site.web.api.espn.com/apis/v2/sports/football/nfl/standings?region=us&lang=en&contentorigin=espn&season=2025&type=0';

export const fetchPlayoffSeeds = async () => {
  try {
    const response = await fetch(ESPN_STANDINGS_API);
    const data = await response.json();
    
    const seedMap = {};
    
    // Process both AFC and NFC
    data.children?.forEach(conference => {
      conference.standings?.entries?.forEach(entry => {
        const teamId = entry.team?.id;
        const seedStat = entry.stats?.find(s => s.name === 'playoffSeed');
        
        if (teamId && seedStat) {
          seedMap[teamId] = {
            seed: seedStat.value,
            abbreviation: entry.team.abbreviation,
            name: entry.team.name,
            location: entry.team.location,
            displayName: entry.team.displayName
          };
        }
      });
    });
    
    return seedMap;
  } catch (error) {
    console.error('Error fetching playoff seeds:', error);
    return {};
  }
};
