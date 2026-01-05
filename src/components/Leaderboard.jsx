import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { ArrowLeft, Trophy, Medal, Award, AlertCircle } from 'lucide-react';

const POINTS = {
  'wc': 1,    // Wild Card
  'div': 2,   // Divisional
  'conf': 3,  // Conference
  'super-bowl': 5  // Super Bowl
};

export default function Leaderboard() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [gameResults, setGameResults] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    loadData();
  }, [roomId]);

  const loadData = async () => {
    try {
      // Check if current user has submitted bracket
      const userBracketDoc = await getDoc(doc(db, 'brackets', `${roomId}_${user.uid}`));
      const userHasSubmitted = userBracketDoc.exists() && userBracketDoc.data().submitted === true;
      setHasSubmitted(userHasSubmitted);

      const roomDoc = await getDoc(doc(db, 'rooms', roomId));
      if (roomDoc.exists()) {
        setRoomCode(roomDoc.data().code);
      }

      // Load game results
      const resultsDoc = await getDoc(doc(db, 'gameResults', roomId));
      const results = resultsDoc.exists() ? resultsDoc.data().results || {} : {};
      setGameResults(results);

      // Load all submitted brackets
      const q = query(collection(db, 'brackets'), where('roomId', '==', roomId), where('submitted', '==', true));
      const snapshot = await getDocs(q);

      const leaderboardData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const bracketData = docSnap.data();
          const userDoc = await getDoc(doc(db, 'users', bracketData.userId));
          const userData = userDoc.exists() ? userDoc.data() : {};

          const points = calculatePoints(bracketData.picks, results);

          return {
            userId: bracketData.userId,
            username: userData.username || userData.email || 'Unknown User',
            points,
            tiebreakerPoints: bracketData.tiebreakerPoints || 0,
            submittedAt: bracketData.submittedAt
          };
        })
      );

      // Sort by points, then by tiebreaker (closest to actual total)
      leaderboardData.sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        // If tied, use tiebreaker - get actual Super Bowl total from results
        const superBowlResult = results['super-bowl'];
        if (superBowlResult && superBowlResult.totalPoints) {
          const aDiff = Math.abs(a.tiebreakerPoints - superBowlResult.totalPoints);
          const bDiff = Math.abs(b.tiebreakerPoints - superBowlResult.totalPoints);
          return aDiff - bDiff; // Closer is better
        }
        return 0;
      });
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePoints = (picks, results) => {
    let total = 0;
    
    Object.entries(picks).forEach(([matchId, teamId]) => {
      if (results[matchId] === teamId) {
        // Determine round and award points
        if (matchId.includes('wc')) total += POINTS.wc;
        else if (matchId.includes('div')) total += POINTS.div;
        else if (matchId.includes('conf')) total += POINTS.conf;
        else if (matchId === 'super-bowl') total += POINTS['super-bowl'];
      }
    });

    return total;
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-white text-xl">Loading leaderboard...</div>
      </div>
    );
  }

  if (!hasSubmitted) {
    return (
      <div className="min-h-screen bg-[#020617] relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent_60%)] pointer-events-none opacity-40"></div>
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate(`/bracket/${roomId}`)} className="text-slate-400 hover:text-white transition">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Leaderboard</h1>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-xl border border-yellow-600/30 rounded-2xl p-12 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-600/90 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">Submit Your Bracket First</h2>
            <p className="text-slate-300 mb-6">You must submit your bracket before viewing the leaderboard.</p>
            <button
              onClick={() => navigate(`/bracket/${roomId}`)}
              className="px-6 py-3 bg-gradient-to-r from-yellow-600/80 to-yellow-700/80 text-white rounded-xl hover:from-yellow-600/90 hover:to-yellow-700/90 transition font-bold uppercase tracking-wider"
            >
              Go to Bracket
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent_60%)] pointer-events-none opacity-40"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(`/bracket/${roomId}`)} className="text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
              <Trophy className="w-10 h-10 text-yellow-600/90" />
              Leaderboard
            </h1>
            <p className="text-slate-400">Room: {roomCode}</p>
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-lg">No submitted brackets yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => {
              const isCurrentUser = entry.userId === user.uid;
              const rank = index + 1;
              
              return (
                <div
                  key={entry.userId}
                  className={`bg-slate-900/40 backdrop-blur-xl border rounded-xl p-6 transition-all ${
                    isCurrentUser 
                      ? 'border-yellow-600/50 bg-yellow-600/5' 
                      : 'border-white/10 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${
                        rank === 1 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white' :
                        rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900' :
                        rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {rank === 1 ? <Trophy className="w-6 h-6" /> :
                         rank === 2 ? <Medal className="w-6 h-6" /> :
                         rank === 3 ? <Award className="w-6 h-6" /> :
                         rank}
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${isCurrentUser ? 'text-yellow-500' : 'text-white'}`}>
                          {entry.username} {isCurrentUser && '(You)'}
                        </h3>
                        <p className="text-sm text-slate-400">
                          Submitted {entry.submittedAt?.toDate().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-yellow-600/90">{entry.points}</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider">Points</div>
                      {entry.tiebreakerPoints > 0 && (
                        <div className="text-xs text-slate-400 mt-1">TB: {entry.tiebreakerPoints}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-3">Point System</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-black text-yellow-600/90">1</div>
              <div className="text-xs text-slate-400 uppercase">Wild Card</div>
            </div>
            <div>
              <div className="text-2xl font-black text-yellow-600/90">2</div>
              <div className="text-xs text-slate-400 uppercase">Divisional</div>
            </div>
            <div>
              <div className="text-2xl font-black text-yellow-600/90">3</div>
              <div className="text-xs text-slate-400 uppercase">Conference</div>
            </div>
            <div>
              <div className="text-2xl font-black text-yellow-600/90">5</div>
              <div className="text-xs text-slate-400 uppercase">Super Bowl</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
