// ESPN API service for fetching live NFL game data
const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

export const fetchNFLScoreboard = async () => {
  try {
    const response = await fetch(`${ESPN_API_BASE}/scoreboard`);
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('Error fetching NFL scoreboard:', error);
    return [];
  }
};

export const parseGameData = (games, teams) => {
  const gameResults = {};
  const liveScores = {};

  games.forEach(game => {
    const competition = game.competitions?.[0];
    if (!competition) return;

    const competitors = competition.competitors;
    const status = competition.status;
    const isCompleted = status.type.completed;
    const isInProgress = status.type.state === 'in';

    // Get team info
    const homeTeam = competitors.find(c => c.homeAway === 'home');
    const awayTeam = competitors.find(c => c.homeAway === 'away');

    if (!homeTeam || !awayTeam) return;

    // Match ESPN team names to our team IDs
    const homeTeamData = findTeamByName(teams, homeTeam.team.displayName);
    const awayTeamData = findTeamByName(teams, awayTeam.team.displayName);

    if (!homeTeamData || !awayTeamData) return;

    // Determine matchup ID based on teams
    const matchupId = findMatchupId(homeTeamData, awayTeamData);
    if (!matchupId) return;

    // Store live score data
    liveScores[matchupId] = {
      homeTeam: {
        id: homeTeamData.id,
        name: homeTeamData.name,
        score: parseInt(homeTeam.score) || 0
      },
      awayTeam: {
        id: awayTeamData.id,
        name: awayTeamData.name,
        score: parseInt(awayTeam.score) || 0
      },
      status: status.type.description,
      isCompleted,
      isInProgress,
      period: status.period || 0,
      clock: status.displayClock || ''
    };

    // If game is completed, set the winner
    if (isCompleted) {
      const homeScore = parseInt(homeTeam.score) || 0;
      const awayScore = parseInt(awayTeam.score) || 0;
      const winnerId = homeScore > awayScore ? homeTeamData.id : awayTeamData.id;
      gameResults[matchupId] = winnerId;
    }
  });

  return { gameResults, liveScores };
};

const findTeamByName = (teams, espnName) => {
  // Try exact match first
  let team = teams.find(t => 
    espnName.includes(t.city) && espnName.includes(t.name)
  );
  
  // Try partial matches
  if (!team) {
    team = teams.find(t => espnName.includes(t.name));
  }
  
  return team;
};

const findMatchupId = (team1, team2) => {
  // This is a simplified version - you'd need to map based on actual playoff structure
  // For now, we'll use a naming convention based on seeds
  const seeds = [team1.seed, team2.seed].sort((a, b) => a - b);
  const conf = team1.conference.toLowerCase();
  
  // Wild Card matchups
  if (seeds[0] === 2 && seeds[1] === 7) return `${conf}-wc-0`;
  if (seeds[0] === 3 && seeds[1] === 6) return `${conf}-wc-1`;
  if (seeds[0] === 4 && seeds[1] === 5) return `${conf}-wc-2`;
  
  // Divisional and beyond would need more complex logic
  // based on actual bracket progression
  
  return null;
};

export const syncGameResults = async (roomId, teams, currentResults) => {
  const games = await fetchNFLScoreboard();
  const { gameResults, liveScores } = parseGameData(games, teams);
  
  return { gameResults, liveScores };
};
