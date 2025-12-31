import axios from 'axios';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const FALLBACK_TEAMS = [
  { id: 1, name: 'Chiefs', city: 'Kansas City', seed: 1, conference: 'AFC', color: '#E31837' },
  { id: 2, name: 'Bills', city: 'Buffalo', seed: 2, conference: 'AFC', color: '#00338D' },
  { id: 3, name: 'Ravens', city: 'Baltimore', seed: 3, conference: 'AFC', color: '#241773' },
  { id: 4, name: 'Texans', city: 'Houston', seed: 4, conference: 'AFC', color: '#03202F' },
  { id: 5, name: 'Steelers', city: 'Pittsburgh', seed: 5, conference: 'AFC', color: '#FFB612' },
  { id: 6, name: 'Chargers', city: 'Los Angeles', seed: 6, conference: 'AFC', color: '#0080C6' },
  { id: 7, name: 'Broncos', city: 'Denver', seed: 7, conference: 'AFC', color: '#FB4F14' },
  { id: 8, name: 'Lions', city: 'Detroit', seed: 1, conference: 'NFC', color: '#0076B6' },
  { id: 9, name: 'Eagles', city: 'Philadelphia', seed: 2, conference: 'NFC', color: '#004C54' },
  { id: 10, name: 'Rams', city: 'Los Angeles', seed: 3, conference: 'NFC', color: '#003594' },
  { id: 11, name: 'Buccaneers', city: 'Tampa Bay', seed: 4, conference: 'NFC', color: '#D50A0A' },
  { id: 12, name: 'Vikings', city: 'Minnesota', seed: 5, conference: 'NFC', color: '#4F2683' },
  { id: 13, name: 'Commanders', city: 'Washington', seed: 6, conference: 'NFC', color: '#5A1414' },
  { id: 14, name: 'Packers', city: 'Green Bay', seed: 7, conference: 'NFC', color: '#203731' }
];

export const fetchPlayoffTeams = async () => {
  try {
    const configDoc = await getDoc(doc(db, 'config', 'playoffs'));
    
    if (configDoc.exists()) {
      const data = configDoc.data();
      const afcTeams = data.afcTeams || [];
      const nfcTeams = data.nfcTeams || [];
      const configuredTeams = [...afcTeams, ...nfcTeams].filter(Boolean);
      
      if (configuredTeams.length === 14) {
        return configuredTeams;
      }
    }
    
    return FALLBACK_TEAMS;
  } catch (error) {
    console.error('Error fetching playoff teams:', error);
    return FALLBACK_TEAMS;
  }
};

export const fetchGameResults = async () => {
  // Mock game results - replace with actual API call
  // Format: { matchId: winnerId }
  return {
    'wildcard_0': null, // Game not finished
    'wildcard_1': 2,    // Bills won
    // Add more as games complete
  };
};

// Future: Implement ESPN API scraping
export const scrapeESPNData = async () => {
  try {
    // ESPN doesn't have a public API, would need to use their hidden endpoints
    // Example: https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard
    const response = await axios.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching ESPN data:', error);
    return null;
  }
};
