import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { fetchPlayoffTeams } from '../services/nflData';
import { syncGameResults } from '../services/espnApi';
import { ArrowLeft, Check, RefreshCw, Radio } from 'lucide-react';

export default function GameResults() {
  const { roomId } = useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [results, setResults] = useState({});
  const [liveScores, setLiveScores] = useState({});
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/rooms');
      return;
    }
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      handleSyncGames();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [roomId, isAdmin]);

  const loadData = async () => {
    const teamsData = await fetchPlayoffTeams();
    setTeams(teamsData);

    const roomDoc = await getDoc(doc(db, 'rooms', roomId));
    if (roomDoc.exists()) {
      setRoomCode(roomDoc.data().code);
    }

    const resultsDoc = await getDoc(doc(db, 'gameResults', roomId));
    if (resultsDoc.exists()) {
      setResults(resultsDoc.data().results || {});
    }

    setLoading(false);
    
    // Auto-sync on load
    handleSyncGames(teamsData);
  };

  const handleSyncGames = async (teamsData = teams) => {
    setSyncing(true);
    try {
      const { gameResults, liveScores: scores } = await syncGameResults(roomId, teamsData, results);
      
      // Update live scores
      setLiveScores(scores);
      
      // Auto-save completed games
      if (Object.keys(gameResults).length > 0) {
        const newResults = { ...results, ...gameResults };
        await saveResults(newResults);
      }
    } catch (error) {
      console.error('Error syncing games:', error);
    } finally {
      setSyncing(false);
    }
  };

  const saveResults = async (newResults) => {
    await setDoc(doc(db, 'gameResults', roomId), { results: newResults });
    setResults(newResults);
  };

  const setWinner = (matchId, teamId) => {
    const newResults = { ...results, [matchId]: teamId };
    saveResults(newResults);
  };

  const clearWinner = (matchId) => {
    const newResults = { ...results };
    delete newResults[matchId];
    saveResults(newResults);
  };

  const renderMatchup = (matchId, team1, team2, label) => {
    const winner = results[matchId];
    const liveScore = liveScores[matchId];
    
    return (
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</div>
          {liveScore?.isInProgress && (
            <div className="flex items-center gap-2 text-xs text-red-500 font-bold">
              <Radio className="w-3 h-3 animate-pulse" />
              LIVE - Q{liveScore.period} {liveScore.clock}
            </div>
          )}
          {liveScore?.isCompleted && (
            <div className="text-xs text-green-500 font-bold">FINAL</div>
          )}
        </div>
        <div className="space-y-2">
          {[team1, team2].map(team => team && (
            <button
              key={team.id}
              onClick={() => winner === team.id ? clearWinner(matchId) : setWinner(matchId, team.id)}
              className={`w-full p-3 rounded-lg border-2 transition-all flex items-center justify-between ${
                winner === team.id
                  ? 'border-green-500 bg-green-500/20'
                  : winner && winner !== team.id
                  ? 'border-red-500/50 bg-red-500/10 opacity-50'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-white">
                  {team.seed}
                </div>
                <span className="font-bold text-white">{team.name}</span>
              </div>
              <div className="flex items-center gap-3">
                {liveScore && (
                  <span className="text-xl font-black text-white">
                    {liveScore.homeTeam.id === team.id ? liveScore.homeTeam.score : liveScore.awayTeam.score}
                  </span>
                )}
                {winner === team.id && <Check className="w-5 h-5 text-green-500" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const afcTeams = teams.filter(t => t.conference === 'AFC');
  const nfcTeams = teams.filter(t => t.conference === 'NFC');

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent_60%)] pointer-events-none opacity-40"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/rooms')} className="text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-grow">
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Game Results</h1>
            <p className="text-slate-400">Room: {roomCode} - Click to manually set winners</p>
          </div>
          <button
            onClick={() => handleSyncGames()}
            disabled={syncing}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-500/30 transition font-bold uppercase tracking-wider disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Live Scores'}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* AFC */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-red-500 uppercase tracking-wider">AFC</h2>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Wild Card</h3>
              <div className="space-y-3">
                {renderMatchup('afc-wc-0', afcTeams[1], afcTeams[6], `#${afcTeams[1]?.seed} vs #${afcTeams[6]?.seed}`)}
                {renderMatchup('afc-wc-1', afcTeams[2], afcTeams[5], `#${afcTeams[2]?.seed} vs #${afcTeams[5]?.seed}`)}
                {renderMatchup('afc-wc-2', afcTeams[3], afcTeams[4], `#${afcTeams[3]?.seed} vs #${afcTeams[4]?.seed}`)}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">Divisional</h3>
              <div className="space-y-3">
                {renderMatchup('afc-div-0', afcTeams[0], null, `#1 ${afcTeams[0]?.name} vs Winner`)}
                {renderMatchup('afc-div-1', null, null, 'Winner vs Winner')}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">Conference Championship</h3>
              {renderMatchup('afc-conf', null, null, 'AFC Championship')}
            </div>
          </div>

          {/* NFC */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-blue-500 uppercase tracking-wider">NFC</h2>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Wild Card</h3>
              <div className="space-y-3">
                {renderMatchup('nfc-wc-0', nfcTeams[1], nfcTeams[6], `#${nfcTeams[1]?.seed} vs #${nfcTeams[6]?.seed}`)}
                {renderMatchup('nfc-wc-1', nfcTeams[2], nfcTeams[5], `#${nfcTeams[2]?.seed} vs #${nfcTeams[5]?.seed}`)}
                {renderMatchup('nfc-wc-2', nfcTeams[3], nfcTeams[4], `#${nfcTeams[3]?.seed} vs #${nfcTeams[4]?.seed}`)}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">Divisional</h3>
              <div className="space-y-3">
                {renderMatchup('nfc-div-0', nfcTeams[0], null, `#1 ${nfcTeams[0]?.name} vs Winner`)}
                {renderMatchup('nfc-div-1', null, null, 'Winner vs Winner')}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">Conference Championship</h3>
              {renderMatchup('nfc-conf', null, null, 'NFC Championship')}
            </div>
          </div>
        </div>

        {/* Super Bowl */}
        <div className="mt-8 max-w-md mx-auto">
          <h2 className="text-2xl font-black text-yellow-600/90 uppercase tracking-wider mb-4 text-center">Super Bowl LX</h2>
          {renderMatchup('super-bowl', null, null, 'Championship Game')}
        </div>
      </div>
    </div>
  );
}
