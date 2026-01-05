// Service to fetch playoff games from ESPN API
import { fetchPlayoffSeeds } from './playoffSeeds';

const ESPN_PLAYOFF_API = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=3';

export const fetchPlayoffGames = async () => {
  try {
    // Fetch playoff seeds first
    const seedMap = await fetchPlayoffSeeds();
    
    // Fetch all playoff weeks
    const weeks = await Promise.all([
      fetch(`${ESPN_PLAYOFF_API}&week=1`).then(r => r.json()).catch(() => ({ events: [] })),
      fetch(`${ESPN_PLAYOFF_API}&week=2`).then(r => r.json()).catch(() => ({ events: [] })),
      fetch(`${ESPN_PLAYOFF_API}&week=3`).then(r => r.json()).catch(() => ({ events: [] })),
      fetch(`${ESPN_PLAYOFF_API}&week=4`).then(r => r.json()).catch(() => ({ events: [] }))
    ]);

    return {
      wildCard: parseWeekGames(weeks[0], 'wc', 1, seedMap),
      divisional: parseWeekGames(weeks[1], 'div', 2, seedMap),
      conference: parseWeekGames(weeks[2], 'conf', 3, seedMap),
      superBowl: parseWeekGames(weeks[3], 'sb', 4, seedMap)
    };
  } catch (error) {
    console.error('Error fetching playoff games:', error);
    // Return empty structure instead of null
    return {
      wildCard: [],
      divisional: [],
      conference: [],
      superBowl: []
    };
  }
};

const parseWeekGames = (weekData, roundPrefix, weekNumber, seedMap) => {
  const events = weekData?.events || [];
  
  // Separate AFC and NFC games
  const afcGames = [];
  const nfcGames = [];
  
  events.forEach((event, index) => {
    const competition = event.competitions?.[0];
    if (!competition) return;

    const competitors = competition.competitors || [];
    const homeTeam = competitors.find(c => c.homeAway === 'home');
    const awayTeam = competitors.find(c => c.homeAway === 'away');
    const status = competition.status;

    const isTBD = homeTeam?.team?.id === '-1' || awayTeam?.team?.id === '-1';

    // Determine conference from team data
    let conference = 'UNKNOWN';
    if (weekNumber === 4) {
      conference = 'SB';
    } else if (!isTBD && homeTeam?.team) {
      // Use abbreviation first, then team ID
      conference = getConferenceFromAbbreviation(homeTeam.team.abbreviation);
      if (conference === 'UNKNOWN') {
        conference = getConferenceFromTeamId(homeTeam.team.id);
      }
    }

    const gameData = {
      id: `${conference.toLowerCase()}-${roundPrefix}-${conference === 'AFC' ? afcGames.length : conference === 'NFC' ? nfcGames.length : 0}`,
      espnId: event.id,
      team1: isTBD ? null : parseTeam(homeTeam, true, seedMap),
      team2: isTBD ? null : parseTeam(awayTeam, false, seedMap),
      status: status?.type?.description || 'Scheduled',
      statusDetail: status?.type?.shortDetail || 'Game Not Started',
      isCompleted: status?.type?.completed || false,
      isInProgress: status?.type?.state === 'in',
      winner: getWinner(homeTeam, awayTeam, status),
      conference,
      date: event.date,
      isTBD,
      homeScore: isTBD ? null : parseInt(homeTeam?.score) || 0,
      awayScore: isTBD ? null : parseInt(awayTeam?.score) || 0
    };

    if (conference === 'AFC') {
      afcGames.push(gameData);
    } else if (conference === 'NFC') {
      nfcGames.push(gameData);
    }
  });

  // For Super Bowl, return single game
  if (weekNumber === 4 && events.length > 0) {
    const event = events[0];
    const competition = event.competitions?.[0];
    const competitors = competition?.competitors || [];
    const homeTeam = competitors.find(c => c.homeAway === 'home');
    const awayTeam = competitors.find(c => c.homeAway === 'away');
    const status = competition?.status;
    const isTBD = homeTeam?.team?.id === '-1' || awayTeam?.team?.id === '-1';

    return [{
      id: 'super-bowl',
      espnId: event.id,
      team1: isTBD ? null : parseTeam(homeTeam, true, seedMap),
      team2: isTBD ? null : parseTeam(awayTeam, false, seedMap),
      status: status?.type?.description || 'Scheduled',
      statusDetail: status?.type?.shortDetail || 'Game Not Started',
      isCompleted: status?.type?.completed || false,
      isInProgress: status?.type?.state === 'in',
      winner: getWinner(homeTeam, awayTeam, status),
      conference: 'SB',
      date: event.date,
      isTBD,
      homeScore: isTBD ? null : parseInt(homeTeam?.score) || 0,
      awayScore: isTBD ? null : parseInt(awayTeam?.score) || 0
    }];
  }

  return [...afcGames, ...nfcGames];
};

const parseTeam = (competitor, isHome, seedMap) => {
  if (!competitor || competitor.id === '-1') return null;

  const team = competitor.team;
  const teamId = team.id;
  const seedData = seedMap?.[teamId];
  const confFromId = getConferenceFromTeamId(teamId);
  const confFromAbbr = getConferenceFromAbbreviation(team.abbreviation);
  
  return {
    id: teamId,
    name: team.name || team.displayName,
    city: team.location,
    abbreviation: team.abbreviation,
    displayName: team.displayName,
    score: parseInt(competitor.score) || 0,
    seed: seedData?.seed || getSeedFromRecord(competitor),
    conference: confFromAbbr !== 'UNKNOWN' ? confFromAbbr : confFromId,
    color: getTeamColor(team.abbreviation),
    isHome
  };
};

const getWinner = (homeTeam, awayTeam, status) => {
  if (!status?.type?.completed) return null;
  
  const homeScore = parseInt(homeTeam?.score) || 0;
  const awayScore = parseInt(awayTeam?.score) || 0;
  
  if (homeScore > awayScore) return homeTeam?.team?.id;
  if (awayScore > homeScore) return awayTeam?.team?.id;
  return null;
};

const getSeedFromRecord = (competitor) => {
  // ESPN includes seed in the record or curatedRank
  const seed = competitor.curatedRank?.current || 
               competitor.rank || 
               parseInt(competitor.team?.displayName?.match(/\((\d+)\)/)?.[1]) || 
               null;
  return seed;
};

const getConferenceFromTeamId = (teamId) => {
  // AFC team IDs based on ESPN's system
  const afcTeamIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '33', '34'];
  // NFC team IDs
  const nfcTeamIds = ['13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'];
  
  const idStr = String(teamId);
  if (afcTeamIds.includes(idStr)) return 'AFC';
  if (nfcTeamIds.includes(idStr)) return 'NFC';
  
  // Fallback: try to determine by team abbreviation if we have it
  return 'UNKNOWN';
};

const getConferenceFromAbbreviation = (abbreviation) => {
  const afcTeams = ['KC', 'BUF', 'BAL', 'HOU', 'PIT', 'LAC', 'DEN', 'MIA', 'CIN', 'CLE', 'LV', 'IND', 'TEN', 'JAX', 'NE'];
  const nfcTeams = ['DET', 'PHI', 'LAR', 'TB', 'MIN', 'WAS', 'GB', 'SF', 'DAL', 'SEA', 'ATL', 'NO', 'CAR', 'ARI', 'CHI', 'NYG'];
  
  if (afcTeams.includes(abbreviation)) return 'AFC';
  if (nfcTeams.includes(abbreviation)) return 'NFC';
  return 'UNKNOWN';
};

const getTeamColor = (abbreviation) => {
  const colors = {
    'KC': '#E31837', 'BUF': '#00338D', 'BAL': '#241773', 'HOU': '#03202F',
    'PIT': '#FFB612', 'LAC': '#0080C6', 'DEN': '#FB4F14', 'MIA': '#008E97',
    'CIN': '#FB4F14', 'CLE': '#FF3C00', 'LV': '#000000', 'IND': '#002C5F',
    'TEN': '#0C2340', 'JAX': '#006778', 'NE': '#002244',
    'DET': '#0076B6', 'PHI': '#004C54', 'LAR': '#003594', 'TB': '#D50A0A',
    'MIN': '#4F2683', 'WAS': '#5A1414', 'GB': '#203731', 'SF': '#AA0000',
    'DAL': '#041E42', 'SEA': '#002244', 'ATL': '#A71930', 'NO': '#D3BC8D',
    'CAR': '#0085CA', 'ARI': '#97233F', 'CHI': '#0B162A', 'NYG': '#0B2265', 'NYJ': '#125740'
  };
  return colors[abbreviation] || '#64748b';
};
