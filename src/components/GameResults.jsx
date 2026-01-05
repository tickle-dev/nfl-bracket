import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { fetchPlayoffGames } from '../services/playoffGames';
import { ArrowLeft, Check, RefreshCw, Radio } from 'lucide-react';

export default function GameResults() {
  const { roomId } = useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [playoffGames, setPlayoffGames] = useState(null);
  const [results, setResults] = useState({});
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
    const gamesData = await fetchPlayoffGames();
    setPlayoffGames(gamesData);

    const roomDoc = await getDoc(doc(db, 'rooms', roomId));
    if (roomDoc.exists()) {
      setRoomCode(roomDoc.data().code);
    }

    const resultsDoc = await getDoc(doc(db, 'gameResults', roomId));
    if (resultsDoc.exists()) {
      setResults(resultsDoc.data().results || {});
    }

    setLoading(false);
    
    // Auto-sync completed games
    if (gamesData) {
      autoSyncCompletedGames(gamesData, resultsDoc.exists() ? resultsDoc.data().results || {} : {});
    }
  };

  const handleSyncGames = async () => {
    setSyncing(true);
    try {
      const gamesData = await fetchPlayoffGames();
      setPlayoffGames(gamesData);
      
      // Auto-sync completed games
      if (gamesData) {
        await autoSyncCompletedGames(gamesData, results);
      }
    } catch (error) {
      console.error('Error syncing games:', error);
    } finally {
      setSyncing(false);
    }
  };

  const autoSyncCompletedGames = async (gamesData, currentResults) => {
    const newResults = { ...currentResults };
    let hasChanges = false;

    // Process all rounds
    const allGames = [
      ...(gamesData.wildCard || []),
      ...(gamesData.divisional || []),
      ...(gamesData.conference || []),
      ...(gamesData.superBowl || [])
    ];

    allGames.forEach(game => {
      // Only auto-sync if game is completed and has a winner, and we haven't manually set a result
      if (game.isCompleted && game.winner && !currentResults[game.id]) {
        newResults[game.id] = game.winner;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      await saveResults(newResults);
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

  const renderMatchup = (game) => {
    if (!game || (!game.team1 && !game.team2)) {
      return (
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-xl p-4 opacity-50">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Game Not Available</div>
          <div className="text-sm text-slate-600">Waiting for previous round results...</div>
        </div>
      );
    }

    const winner = results[game.id];
    
    return (
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {game.team1?.abbreviation || 'TBD'} vs {game.team2?.abbreviation || 'TBD'}
          </div>
          {game.isInProgress && (
            <div className="flex items-center gap-2 text-xs text-red-500 font-bold">
              <Radio className="w-3 h-3 animate-pulse" />
              LIVE
            </div>
          )}
          {game.isCompleted && (
            <div className="text-xs text-green-500 font-bold">FINAL</div>
          )}
        </div>
        <div className="space-y-2">
          {[game.team1, game.team2].map(team => team && (
            <button
              key={team.id}
              onClick={() => winner === team.id ? clearWinner(game.id) : setWinner(game.id, team.id)}
              className={`w-full p-3 rounded-lg border-2 transition-all flex items-center justify-between ${
                winner === team.id
                  ? 'border-green-500 bg-green-500/20'
                  : winner && winner !== team.id
                  ? 'border-red-500/50 bg-red-500/10 opacity-50'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: team.color }}
                >
                  {team.seed}
                </div>
                <span className="font-bold text-white">{team.city} {team.name}</span>
              </div>
              <div className="flex items-center gap-3">
                {(game.isInProgress || game.isCompleted) && (
                  <span className="text-xl font-black text-white">
                    {team.isHome ? game.homeScore : game.awayScore}
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

  if (loading || !playoffGames) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const afcWildCard = playoffGames.wildCard?.filter(g => g.conference === 'AFC') || [];
  const nfcWildCard = playoffGames.wildCard?.filter(g => g.conference === 'NFC') || [];
  const afcDivisional = playoffGames.divisional?.filter(g => g.conference === 'AFC') || [];
  const nfcDivisional = playoffGames.divisional?.filter(g => g.conference === 'NFC') || [];
  const afcConference = playoffGames.conference?.find(g => g.conference === 'AFC');
  const nfcConference = playoffGames.conference?.find(g => g.conference === 'NFC');
  const superBowl = playoffGames.superBowl?.[0];

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent_60%)] pointer-events-none opacity-40"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(`/bracket/${roomId}`)} className="text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-grow">
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Game Results</h1>
            <p className="text-slate-400">Room: {roomCode} - Auto-syncs completed games, click to override</p>
          </div>
          <button
            onClick={() => handleSyncGames()}
            disabled={syncing}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-500/30 transition font-bold uppercase tracking-wider disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* AFC */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-red-500 uppercase tracking-wider">AFC</h2>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Wild Card</h3>
              <div className="space-y-3">
                {afcWildCard.map(game => (
                  <div key={game.id}>{renderMatchup(game)}</div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">Divisional</h3>
              <div className="space-y-3">
                {afcDivisional.map(game => (
                  <div key={game.id}>{renderMatchup(game)}</div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">Conference Championship</h3>
              {renderMatchup(afcConference)}
            </div>
          </div>

          {/* NFC */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-blue-500 uppercase tracking-wider">NFC</h2>
            
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Wild Card</h3>
              <div className="space-y-3">
                {nfcWildCard.map(game => (
                  <div key={game.id}>{renderMatchup(game)}</div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">Divisional</h3>
              <div className="space-y-3">
                {nfcDivisional.map(game => (
                  <div key={game.id}>{renderMatchup(game)}</div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-3">Conference Championship</h3>
              {renderMatchup(nfcConference)}
            </div>
          </div>
        </div>

        {/* Super Bowl */}
        <div className="mt-8 max-w-md mx-auto">
          <h2 className="text-2xl font-black text-yellow-600/90 uppercase tracking-wider mb-4 text-center">Super Bowl LX</h2>
          {renderMatchup(superBowl)}
        </div>
      </div>
    </div>
  );
}
