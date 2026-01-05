import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { fetchPlayoffGames } from '../services/playoffGames';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowLeft, Lock, Unlock, BarChart3, Settings } from 'lucide-react';
import MatchupCard from './MatchupCard';
import superBowlLogo from '../assets/Super_Bowl_LX-brandlogos.net-x6RMa/super_bowl_lx-logo_brandlogos.net_3b9vb.png';

export default function Bracket() {
  const { roomId } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [playoffGames, setPlayoffGames] = useState(null);
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomCreator, setRoomCreator] = useState(null);
  const [gameResults, setGameResults] = useState({});

  useEffect(() => {
    loadData();
    
    // Auto-refresh only game data, not bracket picks
    const interval = setInterval(() => {
      refreshGameData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [roomId, user]);

  const refreshGameData = async () => {
    const gamesData = await fetchPlayoffGames();
    if (gamesData) {
      setPlayoffGames(gamesData);
    }
    await loadGameResults();
  };

  const loadData = async () => {
    const gamesData = await fetchPlayoffGames();
    if (gamesData) {
      setPlayoffGames(gamesData);
    }
    await loadBracket();
    await loadRoomCreator();
    await loadGameResults();
    setLoading(false);
  };

  const loadGameResults = async () => {
    const resultsDoc = await getDoc(doc(db, 'gameResults', roomId));
    if (resultsDoc.exists()) {
      setGameResults(resultsDoc.data().results || {});
    }
  };

  const loadRoomCreator = async () => {
    const roomDoc = await getDoc(doc(db, 'rooms', roomId));
    if (roomDoc.exists()) {
      setRoomCreator(roomDoc.data().createdBy);
    }
  };

  const loadBracket = async () => {
    const bracketRef = doc(db, 'brackets', `${roomId}_${user.uid}`);
    const bracketDoc = await getDoc(bracketRef);
    if (bracketDoc.exists()) {
      setBracket(bracketDoc.data());
    }
  };

  const saveBracket = async (picks, submitted = false) => {
    const bracketRef = doc(db, 'brackets', `${roomId}_${user.uid}`);
    const data = { 
      userId: user.uid, 
      roomId, 
      picks, 
      submitted,
      submittedAt: submitted ? new Date() : null 
    };
    await setDoc(bracketRef, data);
    setBracket(data);
  };

  const handlePickWinner = (matchupId, team) => {
    if (bracket?.submitted) return;
    if (!team || !team.id) return;
    
    const newPicks = { ...(bracket?.picks || {}), [matchupId]: team.id };
    saveBracket(newPicks, false);
  };

  const handleSubmitBracket = async () => {
    if (!bracket?.picks || Object.keys(bracket.picks).length === 0) {
      alert('Please make at least one pick before submitting');
      return;
    }
    
    // Collect all required matchup IDs
    const requiredMatchups = [
      // Wild Card (6 games total)
      ...afcWildCard.map(g => g.id),
      ...nfcWildCard.map(g => g.id),
      // Divisional (4 games total)
      ...afcDivisional.map(g => g.id),
      ...nfcDivisional.map(g => g.id),
      // Conference Championships (2 games)
      afcChampionship.id,
      nfcChampionship.id,
      // Super Bowl (1 game)
      superBowl.id
    ];
    
    // Check which matchups are missing picks
    const missingPicks = requiredMatchups.filter(matchupId => !bracket.picks[matchupId]);
    
    if (missingPicks.length > 0) {
      alert(`Please complete your bracket! You're missing ${missingPicks.length} pick(s).\n\nYou must pick a winner for every game in all rounds including the Super Bowl.`);
      return;
    }
    
    await saveBracket(bracket.picks, true);
  };

  const handleResetAllBrackets = async () => {
    if (!window.confirm('Are you sure you want to reset ALL brackets in this room? This cannot be undone.')) return;
    
    try {
      const q = query(collection(db, 'brackets'), where('roomId', '==', roomId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        alert('No brackets to reset.');
        return;
      }
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      
      await batch.commit();
      setBracket(null);
      alert(`Successfully reset ${snapshot.docs.length} bracket(s)!`);
      window.location.reload();
    } catch (error) {
      console.error('Error resetting brackets:', error);
      alert(`Error resetting brackets: ${error.message}`);
    }
  };

  const LombardiLogo = () => (
    <div className="relative w-40 h-40 flex items-center justify-center group pointer-events-none">
      <motion.div 
        animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl"
      />
      <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
        <path d="M50 10 L65 40 L50 100 L35 40 Z" fill="url(#silverGrad)" />
        <path d="M50 10 L55 35 L45 35 Z" fill="#fff" opacity="0.5" />
        <ellipse cx="50" cy="15" rx="15" ry="8" fill="url(#silverGrad)" />
        <defs>
          <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d1d5db" />
            <stop offset="50%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-12">
        <span className="text-6xl font-black italic tracking-tighter text-white/90">LX</span>
        <span className="text-[10px] font-bold tracking-[0.6em] text-blue-400 mt-[-5px]">2026</span>
      </div>
    </div>
  );

  if (loading || !playoffGames) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-white text-xl">Loading bracket...</div>
      </div>
    );
  }

  const isLocked = bracket?.submitted === true;
  const isRoomCreator = roomCreator === user.uid;

  // Helper to get user's pick for a matchup
  const getUserPick = (matchupId, game) => {
    const pickedTeamId = bracket?.picks?.[matchupId];
    if (!pickedTeamId) return null;
    
    // Check if picked team matches either team in the game
    if (game?.team1?.id === pickedTeamId) return game.team1;
    if (game?.team2?.id === pickedTeamId) return game.team2;
    
    return null;
  };

  // Helper to add user picks to game data and include actual ESPN matchup + winner
  const addPickToGame = (game) => {
    if (!game || !game.id) return game;
    
    // Get user's pick
    const userWinner = getUserPick(game.id, game);
    
    // Get actual ESPN winner (if game is completed)
    let espnWinnerId = null;
    if (game.isCompleted && game.winner) {
      espnWinnerId = game.winner; // This is the team ID from ESPN
    }
    
    // Store actual ESPN teams and winner separately
    return {
      ...game,
      actualTeam1: game.team1, // Actual ESPN team
      actualTeam2: game.team2, // Actual ESPN team
      espnWinner: espnWinnerId, // Actual ESPN winner ID
      winner: userWinner // User's pick
    };
  };

  // Get games by round and conference with fallbacks and user picks
  const afcWildCard = (playoffGames?.wildCard?.filter(g => g?.conference === 'AFC') || []).map(addPickToGame);
  const nfcWildCard = (playoffGames?.wildCard?.filter(g => g?.conference === 'NFC') || []).map(addPickToGame);
  
  // Build divisional matchups from Wild Card winners (NFL re-seeding rules)
  const buildDivisionalMatchups = (wildCardGames, conference) => {
    const espnGames = playoffGames?.divisional?.filter(g => g?.conference === conference) || [];
    
    // If ESPN has real matchups (not TBD), use those
    if (espnGames.length > 0 && espnGames[0].team1 && espnGames[0].team2) {
      return espnGames.map(addPickToGame);
    }
    
    // Otherwise, build from user's Wild Card picks
    const wcWinners = wildCardGames
      .map(g => g.winner)
      .filter(Boolean)
      .sort((a, b) => (a.seed || 99) - (b.seed || 99));
    
    // Hardcoded #1 seeds
    const byeTeam = conference === 'AFC' ? {
      id: '7',
      name: 'Broncos',
      city: 'Denver',
      abbreviation: 'DEN',
      seed: 1,
      conference: 'AFC',
      color: '#FB4F14'
    } : {
      id: '26',
      name: 'Seahawks',
      city: 'Seattle',
      abbreviation: 'SEA',
      seed: 1,
      conference: 'NFC',
      color: '#002244'
    };
    
    // NFL Re-seeding: #1 plays lowest seed, next matchup is remaining two teams
    const game1 = {
      id: `${conference.toLowerCase()}-div-0`,
      team1: byeTeam,
      team2: wcWinners[2] || null, // Lowest seed
      conference,
      isInProgress: false,
      isCompleted: false,
      statusDetail: 'Game Not Started'
    };
    
    const game2 = {
      id: `${conference.toLowerCase()}-div-1`,
      team1: wcWinners[0] || null, // Highest WC winner
      team2: wcWinners[1] || null, // Middle WC winner
      conference,
      isInProgress: false,
      isCompleted: false,
      statusDetail: 'Game Not Started'
    };
    
    return [addPickToGame(game1), addPickToGame(game2)];
  };
  
  const afcDivisional = buildDivisionalMatchups(afcWildCard, 'AFC');
  const nfcDivisional = buildDivisionalMatchups(nfcWildCard, 'NFC');
  
  // Extract #1 seeds (bye teams) from divisional matchups
  const afcByeTeam = afcDivisional[0]?.team1 || null;
  const nfcByeTeam = nfcDivisional[0]?.team1 || null;
  
  // Build conference championships from divisional winners
  const buildConferenceChampionship = (divisionalGames, conference) => {
    const espnGame = playoffGames?.conference?.find(g => g?.conference === conference);
    
    // If ESPN has real matchup (not TBD), use it
    if (espnGame && espnGame.team1 && espnGame.team2) {
      return addPickToGame(espnGame);
    }
    
    // Otherwise, build from user's divisional picks
    const divWinners = divisionalGames.map(g => g.winner).filter(Boolean);
    
    const game = {
      id: `${conference.toLowerCase()}-conf`,
      team1: divWinners[0] || null,
      team2: divWinners[1] || null,
      conference,
      isInProgress: false,
      isCompleted: false,
      statusDetail: 'Game Not Started'
    };
    
    return addPickToGame(game);
  };
  
  const afcChampionship = buildConferenceChampionship(afcDivisional, 'AFC');
  const nfcChampionship = buildConferenceChampionship(nfcDivisional, 'NFC');
  
  // Build Super Bowl from conference champions
  const espnSuperBowl = playoffGames?.superBowl?.[0];
  
  // Check if ESPN has REAL teams (not placeholder AFC/NFC teams with IDs 31/32)
  const hasEspnSuperBowl = espnSuperBowl && 
                           espnSuperBowl.team1 && 
                           espnSuperBowl.team2 &&
                           espnSuperBowl.team1.id !== '31' && 
                           espnSuperBowl.team1.id !== '32' &&
                           espnSuperBowl.team2.id !== '31' && 
                           espnSuperBowl.team2.id !== '32';
  
  // Get conference winners
  const afcWinner = afcChampionship?.winner;
  const nfcWinner = nfcChampionship?.winner;
  
  console.log('AFC Championship winner:', afcWinner);
  console.log('NFC Championship winner:', nfcWinner);
  console.log('Has ESPN Super Bowl:', hasEspnSuperBowl);
  
  // Create Super Bowl matchup
  const superBowlBase = {
    id: 'super-bowl',
    team1: hasEspnSuperBowl ? espnSuperBowl.team1 : afcWinner,
    team2: hasEspnSuperBowl ? espnSuperBowl.team2 : nfcWinner,
    conference: 'SB',
    isInProgress: hasEspnSuperBowl ? espnSuperBowl.isInProgress : false,
    isCompleted: hasEspnSuperBowl ? espnSuperBowl.isCompleted : false,
    statusDetail: hasEspnSuperBowl ? espnSuperBowl.statusDetail : 'Game Not Started',
    homeScore: hasEspnSuperBowl ? espnSuperBowl.homeScore : null,
    awayScore: hasEspnSuperBowl ? espnSuperBowl.awayScore : null,
    winner: null
  };
  
  console.log('Super Bowl base:', superBowlBase);
  
  const superBowl = addPickToGame(superBowlBase);
  console.log('Super Bowl after addPickToGame:', superBowl);

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#020617] text-slate-100 relative selection:bg-blue-500/30">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent_60%)] pointer-events-none opacity-40"></div>

      <header className="flex-shrink-0 flex items-center justify-between px-3 lg:px-10 py-3 lg:h-[70px] bg-slate-950/60 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="flex items-center space-x-2 lg:space-x-5">
          <button onClick={() => navigate('/rooms')} className="text-slate-400 hover:text-white transition p-2 lg:p-0">
            <ArrowLeft className="w-7 h-7 lg:w-6 lg:h-6" />
          </button>
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-tr from-red-600 via-slate-100 to-blue-600 p-[2px]">
            <div className="bg-slate-950 w-full h-full rounded-[10px] flex items-center justify-center text-white text-[12px] lg:text-[14px] font-black italic">NFL</div>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg lg:text-2xl font-black uppercase tracking-tighter text-white leading-none">Mixin it up Family Bracket</h1>
            <p className="text-[8px] lg:text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-1 opacity-60">Professional Playoff Simulator</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 lg:space-x-6">
          <button
            onClick={() => navigate(`/leaderboard/${roomId}`)}
            className="flex flex-col lg:flex-row items-center gap-0.5 lg:gap-2 px-2 lg:px-4 py-2 lg:py-2 bg-yellow-600/20 border border-yellow-600/30 text-yellow-400 rounded-lg hover:bg-yellow-600/30 transition"
          >
            <BarChart3 className="w-6 h-6 lg:w-4 lg:h-4" />
            <span className="text-[9px] lg:text-xs font-bold uppercase tracking-wider">Board</span>
          </button>
          
          {isAdmin && (
            <button
              onClick={() => navigate(`/game-results/${roomId}`)}
              className="hidden lg:flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition text-xs font-bold uppercase tracking-wider"
            >
              <Settings className="w-4 h-4" /> Game Results
            </button>
          )}
          
          <div className="hidden lg:flex items-center space-x-8 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
            <div className="flex items-center space-x-2.5"><div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-lg shadow-red-600/30"></div><span>AFC Bracket</span></div>
            <div className="flex items-center space-x-2.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-lg shadow-blue-600/30"></div><span>NFC Bracket</span></div>
          </div>
          
          {isAdmin && isRoomCreator && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleResetAllBrackets}
              className="hidden lg:flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition text-xs font-bold uppercase tracking-wider"
            >
              <Unlock className="w-4 h-4" /> Reset All Brackets
            </motion.button>
          )}
          
          {!isLocked && bracket?.picks && Object.keys(bracket.picks).length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmitBracket}
              className="flex flex-col lg:flex-row items-center gap-0.5 lg:gap-2 px-2 lg:px-6 py-2 lg:py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition font-bold uppercase tracking-wider shadow-xl"
            >
              <Lock className="w-6 h-6 lg:w-4 lg:h-4" />
              <span className="text-[9px] lg:text-sm">Submit</span>
            </motion.button>
          )}
          
          {isLocked && (
            <div className="flex flex-col lg:flex-row items-center gap-0.5 lg:gap-2 px-2 lg:px-4 py-2 lg:py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 font-bold">
              <Lock className="w-6 h-6 lg:w-4 lg:h-4" />
              <span className="text-[9px] lg:text-xs uppercase">Done</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-2 lg:p-4 relative overflow-x-auto">
        {/* Desktop View - Hidden on Mobile */}
        <div className="hidden lg:flex items-center justify-between w-full h-full max-w-[1900px] gap-2 lg:gap-4 xl:gap-6 scale-90 lg:scale-95 xl:scale-100">
          
          {/* AFC: Left Side */}
          <div className="flex items-center gap-2 lg:gap-4 xl:gap-6 flex-grow justify-start">
            {/* Wild Card */}
            <div className="flex flex-col space-y-3 lg:space-y-4">
              <span className="text-center text-[8px] lg:text-[9px] font-black uppercase tracking-[0.5em] text-red-500/60 mb-1">Wild Card</span>
              {afcWildCard.map(m => (
                <MatchupCard key={m.id} matchup={m} onPickWinner={handlePickWinner} isLocked={isLocked} />
              ))}
              <div className="w-40 lg:w-48 h-[70px] lg:h-[80px] rounded-xl border border-dashed border-white/10 bg-slate-900/10 flex items-center justify-center space-x-3 opacity-30">
                <div className="w-6 h-6 lg:w-7 lg:h-7 rounded bg-slate-800 flex items-center justify-center font-bold text-[10px] lg:text-[11px] text-white/50">1</div>
                <div className="text-left overflow-hidden">
                  <div className="text-[8px] lg:text-[9px] font-black text-slate-500 uppercase tracking-widest">AFC BYE</div>
                  <div className="font-bold text-[12px] lg:text-[14px] text-slate-400 truncate uppercase">
                    {afcByeTeam ? `${afcByeTeam.city} ${afcByeTeam.name}` : 'TBD'}
                  </div>
                </div>
              </div>
            </div>

            {/* Divisional */}
            <div className="flex flex-col space-y-16 lg:space-y-20">
              <span className="text-center text-[8px] lg:text-[9px] font-black uppercase tracking-[0.5em] text-red-500/60 mb-1">Divisional</span>
              {afcDivisional.map(m => (
                <MatchupCard key={m.id} matchup={m} onPickWinner={handlePickWinner} isLocked={isLocked} />
              ))}
            </div>

            {/* Conference Championship */}
            <div className="flex flex-col">
              <span className="text-center text-[8px] lg:text-[9px] font-black uppercase tracking-[0.5em] text-red-500/60 mb-1">Conference</span>
              <MatchupCard matchup={afcChampionship} onPickWinner={handlePickWinner} isLocked={isLocked} />
            </div>
          </div>

          {/* CENTER: The Grand Stage */}
          <div className="flex flex-col items-center flex-shrink-0 px-2 lg:px-4 py-4 lg:py-6 relative">
            <div className="relative w-28 h-28 lg:w-36 lg:h-36 flex items-center justify-center mb-2">
              <motion.div 
                animate={{ opacity: [0.05, 0.15, 0.05] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-yellow-600/10 rounded-full blur-2xl"
              />
              <img 
                src={superBowlLogo} 
                alt="Super Bowl LX" 
                className="w-full h-full object-contain opacity-80 drop-shadow-[0_0_15px_rgba(202,138,4,0.3)]"
              />
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600/20 via-blue-500/20 to-red-600/20 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-1000"></div>
              <MatchupCard matchup={superBowl} onPickWinner={handlePickWinner} isLocked={isLocked} />
            </div>

            <div className="h-[80px] lg:h-[100px] mt-4 lg:mt-6 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {superBowl.winner ? (
                  <motion.div 
                    key="celebration"
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center relative"
                  >
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                      className="text-amber-500 font-black text-[10px] lg:text-[12px] uppercase tracking-[0.8em] mb-2"
                    >
                      Super Bowl Winner
                    </motion.div>
                    <div className="text-3xl lg:text-5xl xl:text-6xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] leading-none">
                      {superBowl.winner.name}
                    </div>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: 120 }}
                      className="h-[2px] lg:h-[3px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-4 lg:mt-6 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.8)]"
                    />
                  </motion.div>
                ) : (
                  <motion.div 
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center opacity-40"
                  >
                    <div className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.8em] italic">Pick Your Champion</div>
                    <div className="w-24 lg:w-32 h-[1px] bg-slate-800 mt-3 lg:mt-4"></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* NFC: Right Side */}
          <div className="flex flex-row-reverse items-center gap-2 lg:gap-4 xl:gap-6 flex-grow justify-start">
            {/* Wild Card */}
            <div className="flex flex-col space-y-3 lg:space-y-4">
              <span className="text-center text-[8px] lg:text-[9px] font-black uppercase tracking-[0.5em] text-blue-500/60 mb-1">Wild Card</span>
              {nfcWildCard.map(m => (
                <MatchupCard key={m.id} matchup={m} onPickWinner={handlePickWinner} isLocked={isLocked} />
              ))}
              <div className="w-40 lg:w-48 h-[70px] lg:h-[80px] rounded-xl border border-dashed border-white/10 bg-slate-900/10 flex items-center justify-center space-x-3 opacity-30">
                <div className="w-6 h-6 lg:w-7 lg:h-7 rounded bg-slate-800 flex items-center justify-center font-bold text-[10px] lg:text-[11px] text-white/50">1</div>
                <div className="text-left overflow-hidden">
                  <div className="text-[8px] lg:text-[9px] font-black text-slate-500 uppercase tracking-widest">NFC BYE</div>
                  <div className="font-bold text-[12px] lg:text-[14px] text-slate-400 truncate uppercase">
                    {nfcByeTeam ? `${nfcByeTeam.city} ${nfcByeTeam.name}` : 'TBD'}
                  </div>
                </div>
              </div>
            </div>

            {/* Divisional */}
            <div className="flex flex-col space-y-16 lg:space-y-20">
              <span className="text-center text-[8px] lg:text-[9px] font-black uppercase tracking-[0.5em] text-blue-500/60 mb-1">Divisional</span>
              {nfcDivisional.map(m => (
                <MatchupCard key={m.id} matchup={m} onPickWinner={handlePickWinner} isLocked={isLocked} />
              ))}
            </div>

            {/* Conference Championship */}
            <div className="flex flex-col">
              <span className="text-center text-[8px] lg:text-[9px] font-black uppercase tracking-[0.5em] text-blue-500/60 mb-1">Conference</span>
              <MatchupCard matchup={nfcChampionship} onPickWinner={handlePickWinner} isLocked={isLocked} />
            </div>
          </div>
        </div>

        {/* Mobile View - Single Scrolling Page */}
        <div className="lg:hidden w-full">
          <div className="max-w-2xl mx-auto p-4 space-y-10 pb-20">
            
            {/* Wild Card Round */}
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-white uppercase mb-2">Wild Card Round</h2>
                <p className="text-sm text-slate-400">First Round of Playoffs</p>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="inline-block px-8 py-2 bg-red-500/20 border-2 border-red-500/40 rounded-xl">
                      <span className="text-base font-black text-red-500 uppercase tracking-wider">AFC</span>
                    </div>
                  </div>
                  <div className="space-y-4 flex flex-col items-center">
                    {afcWildCard.map(m => (
                      <div key={m.id} className="w-[220px]">
                        <MatchupCard matchup={m} onPickWinner={handlePickWinner} isLocked={isLocked} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg w-[220px] mx-auto">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-500/30 flex items-center justify-center">
                        <span className="font-black text-sm text-red-500">1</span>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-red-500/80 font-bold uppercase">First Round Bye</div>
                        <div className="text-base font-black text-white uppercase">
                          {afcByeTeam ? `${afcByeTeam.city} ${afcByeTeam.name}` : 'TBD'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="inline-block px-8 py-2 bg-blue-500/20 border-2 border-blue-500/40 rounded-xl">
                      <span className="text-base font-black text-blue-500 uppercase tracking-wider">NFC</span>
                    </div>
                  </div>
                  <div className="space-y-4 flex flex-col items-center">
                    {nfcWildCard.map(m => (
                      <div key={m.id} className="w-[220px]">
                        <MatchupCard matchup={m} onPickWinner={handlePickWinner} isLocked={isLocked} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg w-[220px] mx-auto">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/30 flex items-center justify-center">
                        <span className="font-black text-sm text-blue-500">1</span>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-blue-500/80 font-bold uppercase">First Round Bye</div>
                        <div className="text-base font-black text-white uppercase">
                          {nfcByeTeam ? `${nfcByeTeam.city} ${nfcByeTeam.name}` : 'TBD'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center py-4">
              <div className="flex-grow h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
              <div className="mx-6 text-slate-600 text-2xl">↓</div>
              <div className="flex-grow h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
            </div>

            {/* Divisional Round */}
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-white uppercase mb-2">Divisional Round</h2>
                <p className="text-sm text-slate-400">Top seeds enter the bracket</p>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="inline-block px-8 py-2 bg-red-500/20 border-2 border-red-500/40 rounded-xl">
                      <span className="text-base font-black text-red-500 uppercase tracking-wider">AFC</span>
                    </div>
                  </div>
                  <div className="space-y-4 flex flex-col items-center">
                    {afcDivisional.map(m => (
                      <div key={m.id} className="w-[220px]">
                        <MatchupCard matchup={m} onPickWinner={handlePickWinner} isLocked={isLocked} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="inline-block px-8 py-2 bg-blue-500/20 border-2 border-blue-500/40 rounded-xl">
                      <span className="text-base font-black text-blue-500 uppercase tracking-wider">NFC</span>
                    </div>
                  </div>
                  <div className="space-y-4 flex flex-col items-center">
                    {nfcDivisional.map(m => (
                      <div key={m.id} className="w-[220px]">
                        <MatchupCard matchup={m} onPickWinner={handlePickWinner} isLocked={isLocked} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center py-4">
              <div className="flex-grow h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
              <div className="mx-6 text-slate-600 text-2xl">↓</div>
              <div className="flex-grow h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
            </div>

            {/* Conference Championships */}
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-white uppercase mb-2">Conference Championships</h2>
                <p className="text-sm text-slate-400">Battle for Super Bowl berth</p>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="inline-block px-6 py-2 bg-red-500/20 border-2 border-red-500/40 rounded-xl">
                      <span className="text-sm font-black text-red-500 uppercase tracking-wider">AFC Championship</span>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-[220px]">
                      <MatchupCard matchup={afcChampionship} onPickWinner={handlePickWinner} isLocked={isLocked} />
                    </div>
                  </div>
                  {afcChampionship.winner && (
                    <div className="mt-4 text-center p-4 bg-red-500/10 rounded-lg border border-red-500/30 w-[220px] mx-auto">
                      <div className="text-xs text-red-500 font-bold uppercase mb-1">AFC Champion</div>
                      <div className="text-xl font-black text-white">{afcChampionship.winner.name}</div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="inline-block px-6 py-2 bg-blue-500/20 border-2 border-blue-500/40 rounded-xl">
                      <span className="text-sm font-black text-blue-500 uppercase tracking-wider">NFC Championship</span>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-[220px]">
                      <MatchupCard matchup={nfcChampionship} onPickWinner={handlePickWinner} isLocked={isLocked} />
                    </div>
                  </div>
                  {nfcChampionship.winner && (
                    <div className="mt-4 text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/30 w-[220px] mx-auto">
                      <div className="text-xs text-blue-500 font-bold uppercase mb-1">NFC Champion</div>
                      <div className="text-xl font-black text-white">{nfcChampionship.winner.name}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center py-4">
              <div className="flex-grow h-px bg-gradient-to-r from-transparent via-yellow-700 to-transparent"></div>
              <div className="mx-6 text-yellow-600 text-2xl">↓</div>
              <div className="flex-grow h-px bg-gradient-to-r from-transparent via-yellow-700 to-transparent"></div>
            </div>

            {/* Super Bowl */}
            <div>
              <div className="text-center mb-8">
                <div className="relative w-40 h-40 mx-auto mb-4">
                  <motion.div 
                    animate={{ opacity: [0.05, 0.15, 0.05] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 bg-yellow-600/10 rounded-full blur-2xl"
                  />
                  <img src={superBowlLogo} alt="Super Bowl LX" className="w-full h-full object-contain opacity-80" />
                </div>
                <h2 className="text-4xl font-black text-yellow-500 uppercase mb-2">Super Bowl LX</h2>
                <p className="text-sm text-slate-400">Championship Game</p>
              </div>
              <div className="flex justify-center">
                <div className="w-[220px]">
                  <MatchupCard matchup={superBowl} onPickWinner={handlePickWinner} isLocked={isLocked} />
                </div>
              </div>
              {superBowl.winner && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8 text-center p-8 bg-gradient-to-b from-yellow-500/20 to-yellow-600/10 rounded-2xl border-2 border-yellow-500/40 max-w-md mx-auto"
                >
                  <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                  <div className="text-yellow-500 font-black text-sm uppercase tracking-widest mb-2">Super Bowl Champion</div>
                  <div className="text-4xl font-black text-white italic uppercase">{superBowl.winner.name}</div>
                </motion.div>
              )}
            </div>

            {/* Mobile Submit Button */}
            {!isLocked && bracket?.picks && Object.keys(bracket.picks).length > 0 && (
              <div className="mt-8 pb-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmitBracket}
                  className="w-full max-w-md mx-auto flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition font-bold uppercase tracking-wider shadow-2xl text-lg"
                >
                  <Lock className="w-5 h-5" />
                  Submit Bracket
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="h-[50px] flex items-center justify-center px-10 bg-slate-950/40 border-t border-white/5 text-[9px] font-bold text-slate-500 uppercase tracking-widest relative z-50">
        <div className="flex items-center space-x-12 opacity-40">
          <span>NFL Re-seeding Active: #1 hosts highest numeric seed</span>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
          <span>Predict Super Bowl LX Live</span>
        </div>
      </footer>
    </div>
  );
}
