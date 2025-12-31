import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { fetchPlayoffTeams } from '../services/nflData';
import { ArrowLeft, Calendar, User, Trash2 } from 'lucide-react';
import MatchupCard from './MatchupCard';
import superBowlLogo from '../assets/Super_Bowl_LX-brandlogos.net-x6RMa/super_bowl_lx-logo_brandlogos.net_3b9vb.png';

export default function AdminBracketView() {
  const { roomId } = useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [brackets, setBrackets] = useState([]);
  const [selectedBracket, setSelectedBracket] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/rooms');
      return;
    }
    loadData();
  }, [roomId, isAdmin]);

  const loadData = async () => {
    const teamsData = await fetchPlayoffTeams();
    setTeams(teamsData);
    
    const roomDoc = await getDoc(doc(db, 'rooms', roomId));
    if (roomDoc.exists()) {
      setRoomCode(roomDoc.data().code);
    }
    
    const q = query(collection(db, 'brackets'), where('roomId', '==', roomId), where('submitted', '==', true));
    const snapshot = await getDocs(q);
    
    const bracketsData = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const bracketData = docSnap.data();
        const userDoc = await getDoc(doc(db, 'users', bracketData.userId));
        const userData = userDoc.exists() ? userDoc.data() : {};
        
        return {
          id: docSnap.id,
          ...bracketData,
          username: userData.username || userData.email || 'Unknown User'
        };
      })
    );
    
    setBrackets(bracketsData.sort((a, b) => b.submittedAt?.toDate() - a.submittedAt?.toDate()));
    setLoading(false);
  };

  const deleteBracket = async (bracketId, username) => {
    if (!window.confirm(`Are you sure you want to delete ${username}'s bracket? This cannot be undone.`)) return;
    
    try {
      await deleteDoc(doc(db, 'brackets', bracketId));
      setBrackets(brackets.filter(b => b.id !== bracketId));
      alert('Bracket deleted successfully!');
    } catch (error) {
      console.error('Error deleting bracket:', error);
      alert(`Error deleting bracket: ${error.message}`);
    }
  };

  const renderBracket = (bracket) => {
    const afcTeams = teams.filter(t => t.conference === 'AFC');
    const nfcTeams = teams.filter(t => t.conference === 'NFC');
    
    const getTeam = (teamId) => teams.find(t => t.id === teamId);
    const getPick = (matchId) => bracket.picks?.[matchId] ? getTeam(bracket.picks[matchId]) : null;

    const afcWildCard = [
      { id: 'afc-wc-0', team1: afcTeams[1], team2: afcTeams[6], winner: getPick('afc-wc-0') },
      { id: 'afc-wc-1', team1: afcTeams[2], team2: afcTeams[5], winner: getPick('afc-wc-1') },
      { id: 'afc-wc-2', team1: afcTeams[3], team2: afcTeams[4], winner: getPick('afc-wc-2') },
    ];

    const nfcWildCard = [
      { id: 'nfc-wc-0', team1: nfcTeams[1], team2: nfcTeams[6], winner: getPick('nfc-wc-0') },
      { id: 'nfc-wc-1', team1: nfcTeams[2], team2: nfcTeams[5], winner: getPick('nfc-wc-1') },
      { id: 'nfc-wc-2', team1: nfcTeams[3], team2: nfcTeams[4], winner: getPick('nfc-wc-2') },
    ];

    const afcWCWinners = afcWildCard.map(m => m.winner).filter(Boolean).sort((a, b) => a.seed - b.seed);
    const nfcWCWinners = nfcWildCard.map(m => m.winner).filter(Boolean).sort((a, b) => a.seed - b.seed);

    const afcDivisional = [
      { id: 'afc-div-0', team1: afcTeams[0], team2: afcWCWinners[2] || null, winner: getPick('afc-div-0') },
      { id: 'afc-div-1', team1: afcWCWinners[0] || null, team2: afcWCWinners[1] || null, winner: getPick('afc-div-1') },
    ];

    const nfcDivisional = [
      { id: 'nfc-div-0', team1: nfcTeams[0], team2: nfcWCWinners[2] || null, winner: getPick('nfc-div-0') },
      { id: 'nfc-div-1', team1: nfcWCWinners[0] || null, team2: nfcWCWinners[1] || null, winner: getPick('nfc-div-1') },
    ];

    const afcDivWinners = afcDivisional.map(m => m.winner).filter(Boolean);
    const nfcDivWinners = nfcDivisional.map(m => m.winner).filter(Boolean);

    const afcChampionship = {
      id: 'afc-conf',
      team1: afcDivWinners[0] || null,
      team2: afcDivWinners[1] || null,
      winner: getPick('afc-conf')
    };

    const nfcChampionship = {
      id: 'nfc-conf',
      team1: nfcDivWinners[0] || null,
      team2: nfcDivWinners[1] || null,
      winner: getPick('nfc-conf')
    };

    const superBowl = {
      id: 'super-bowl',
      team1: afcChampionship.winner || null,
      team2: nfcChampionship.winner || null,
      winner: getPick('super-bowl')
    };

    return (
      <div className="flex items-center justify-between w-full h-full max-w-[1900px] gap-2 lg:gap-4 xl:gap-6 scale-75 lg:scale-85 xl:scale-90">
        <div className="flex items-center gap-2 lg:gap-4 xl:gap-6 flex-grow justify-start">
          <div className="flex flex-col space-y-3 lg:space-y-4">
            <span className="text-center text-[8px] lg:text-[9px] font-black uppercase tracking-[0.5em] text-red-500/60 mb-1">Wild Card</span>
            {afcWildCard.map(m => <MatchupCard key={m.id} matchup={m} isLocked={true} />)}
            <div className="w-40 lg:w-48 h-[70px] lg:h-[80px] rounded-xl border border-dashed border-white/10 bg-slate-900/10 flex items-center justify-center space-x-3 opacity-30">
              <div className="w-6 h-6 lg:w-7 lg:h-7 rounded bg-slate-800 flex items-center justify-center font-bold text-[10px] lg:text-[11px] text-white/50">1</div>
              <div className="text-left overflow-hidden">
                <div className="text-[8px] lg:text-[9px] font-black text-slate-500 uppercase tracking-widest">AFC BYE</div>
                <div className="font-bold text-[12px] lg:text-[14px] text-slate-400 truncate uppercase">{afcTeams[0]?.name}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-16 lg:space-y-20">
            <span className="text-center text-[8px] lg:text-[9px] font-black uppercase tracking-[0.5em] text-red-500/60 mb-1">Divisional</span>
            {afcDivisional.map(m => <MatchupCard key={m.id} matchup={m} isLocked={true} />)}
          </div>

          <div className="flex flex-col">
            <span className="text-center text-[8px] lg:text-[9px] font-black uppercase tracking-[0.5em] text-red-500/60 mb-1">Conference</span>
            <MatchupCard matchup={afcChampionship} isLocked={true} />
          </div>
        </div>

        <div className="flex flex-col items-center flex-shrink-0 px-2 lg:px-4 py-4 lg:py-6">
          <div className="relative w-24 h-24 lg:w-32 lg:h-32 flex items-center justify-center mb-2">
            <img src={superBowlLogo} alt="Super Bowl LX" className="w-full h-full object-contain opacity-80" />
          </div>
          <MatchupCard matchup={superBowl} isLocked={true} />
          {superBowl.winner && (
            <div className="mt-4 text-center">
              <div className="text-amber-500 font-black text-[10px] uppercase tracking-widest mb-1">Super Bowl Winner</div>
              <div className="text-2xl lg:text-4xl font-black text-white italic uppercase">{superBowl.winner.name}</div>
            </div>
          )}
        </div>

        <div className="flex flex-row-reverse items-center gap-2 lg:gap-4 xl:gap-6 flex-grow justify-start">
          <div className="flex flex-col space-y-3 lg:space-y-4">
            <span className="text-center text-[8px] lg:text-[9px] font-black uppercase tracking-[0.5em] text-blue-500/60 mb-1">Wild Card</span>
            {nfcWildCard.map(m => <MatchupCard key={m.id} matchup={m} isLocked={true} />)}
            <div className="w-40 lg:w-48 h-[70px] lg:h-[80px] rounded-xl border border-dashed border-white/10 bg-slate-900/10 flex items-center justify-center space-x-3 opacity-30">
              <div className="w-6 h-6 lg:w-7 lg:h-7 rounded bg-slate-800 flex items-center justify-center font-bold text-[10px] lg:text-[11px] text-white/50">1</div>
              <div className="text-left overflow-hidden">
                <div className="text-[8px] lg:text-[9px] font-black text-slate-500 uppercase tracking-widest">NFC BYE</div>
                <div className="font-bold text-[12px] lg:text-[14px] text-slate-400 truncate uppercase">{nfcTeams[0]?.name}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-16 lg:space-y-20">
            <span className="text-center text-[8px] lg:text-[9px] font-black uppercase tracking-[0.5em] text-blue-500/60 mb-1">Divisional</span>
            {nfcDivisional.map(m => <MatchupCard key={m.id} matchup={m} isLocked={true} />)}
          </div>

          <div className="flex flex-col">
            <span className="text-center text-[8px] lg:text-[9px] font-black uppercase tracking-[0.5em] text-blue-500/60 mb-1">Conference</span>
            <MatchupCard matchup={nfcChampionship} isLocked={true} />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-white text-xl">Loading brackets...</div>
      </div>
    );
  }

  if (selectedBracket) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-[#020617] text-slate-100">
        <header className="h-[70px] flex items-center justify-between px-10 bg-slate-950/60 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center space-x-5">
            <button onClick={() => setSelectedBracket(null)} className="text-slate-400 hover:text-white transition">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white">{selectedBracket.username}'s Bracket</h1>
              <p className="text-xs text-slate-500">Submitted {selectedBracket.submittedAt?.toDate().toLocaleString()}</p>
            </div>
          </div>
        </header>

        <main className="flex-grow flex items-center justify-center p-2 lg:p-4 overflow-x-auto">
          {renderBracket(selectedBracket)}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent_60%)] pointer-events-none opacity-40"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/rooms')} className="text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Submitted Brackets</h1>
            <p className="text-slate-400">Room: {roomCode}</p>
          </div>
        </div>

        {brackets.length === 0 ? (
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-lg">No submitted brackets yet</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {brackets.map(bracket => (
              <div
                key={bracket.id}
                className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedBracket(bracket)}
                    className="flex items-center gap-4 flex-grow text-left"
                  >
                    <div className="bg-gradient-to-br from-yellow-600/80 to-yellow-700/80 p-3 rounded-xl">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{bracket.username}</h3>
                      <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                        <Calendar className="w-4 h-4" />
                        <span>Submitted {bracket.submittedAt?.toDate().toLocaleString()}</span>
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteBracket(bracket.id, bracket.username); }}
                      className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition text-red-400"
                      title="Delete Bracket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ArrowLeft className="w-5 h-5 text-yellow-600/70 rotate-180" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
