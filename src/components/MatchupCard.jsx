import { motion, AnimatePresence } from 'framer-motion';

export default function MatchupCard({ matchup, onPickWinner, isLocked = false }) {
  const { team1, team2, winner, result, statusDetail, homeScore, awayScore, isInProgress, isCompleted, conference } = matchup;

  const getScoreDisplay = () => {
    if (!team1 || !team2) return 'Game Not Started';
    if (isCompleted && homeScore !== null && awayScore !== null) {
      return `Final: ${team1.isHome ? homeScore : awayScore} - ${team1.isHome ? awayScore : homeScore}`;
    }
    if (isInProgress && homeScore !== null && awayScore !== null) {
      return `Live: ${team1.isHome ? homeScore : awayScore} - ${team1.isHome ? awayScore : homeScore}`;
    }
    return statusDetail || 'Game Not Started';
  };

  const getLiveBorderClass = () => {
    if (!isInProgress) return '';
    if (conference === 'AFC') return 'ring-2 ring-red-500 shadow-lg shadow-red-500/50';
    if (conference === 'NFC') return 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/50';
    if (conference === 'SB') return 'ring-2 ring-yellow-500 shadow-lg shadow-yellow-500/50';
    return ''; // Default: no border if conference unknown
  };

  const renderTeam = (team, isSecond) => {
    if (!team) {
      return (
        <div className={`h-9 lg:h-11 flex items-center px-3 lg:px-4 bg-slate-900/30 italic text-slate-600 rounded-${isSecond ? 'b' : 't'}-xl border-x border-slate-800/40 ${isSecond ? 'border-b' : 'border-t'}`}>
          <span className="text-[8px] lg:text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">TBD</span>
        </div>
      );
    }

    const isWinner = winner?.id === team.id;
    const isLoser = winner && winner.id !== team.id;
    const canClick = !isLocked && team;
    const isCorrectPick = result && winner?.id === result;
    const isIncorrectPick = result && winner && winner.id !== result;

    return (
      <motion.button
        whileHover={canClick ? { backgroundColor: 'rgba(30, 41, 59, 0.9)', x: 2 } : {}}
        whileTap={canClick ? { scale: 0.98 } : {}}
        onClick={() => canClick && onPickWinner(matchup.id, team)}
        disabled={!canClick}
        className={`w-full h-9 lg:h-11 px-3 lg:px-4 flex items-center justify-between transition-all relative overflow-hidden
          ${isSecond ? 'rounded-b-xl' : 'rounded-t-xl'} 
          ${isWinner && isCorrectPick ? 'bg-green-900/40 ring-1 ring-inset ring-green-400/50' : 
            isWinner && isIncorrectPick ? 'bg-red-900/40 ring-1 ring-inset ring-red-400/50' :
            isWinner ? 'bg-slate-800/80 ring-1 ring-inset ring-blue-400/30' : 'bg-slate-900/60'} 
          ${isLoser ? 'opacity-20 grayscale' : 'opacity-100'}
          ${!canClick ? 'cursor-not-allowed' : 'cursor-pointer'}
          border-x border-slate-800/50 ${isSecond ? 'border-b' : 'border-t'}`}
      >
        {isWinner && (
          <motion.div 
            layoutId={`winner-glow-${matchup.id}`}
            className={`absolute inset-0 pointer-events-none ${
              isCorrectPick ? 'bg-gradient-to-r from-green-500/20 to-transparent' :
              isIncorrectPick ? 'bg-gradient-to-r from-red-500/20 to-transparent' :
              'bg-gradient-to-r from-blue-500/10 to-transparent'
            }`}
          />
        )}
        
        <div className="flex items-center space-x-2 lg:space-x-3 z-10">
          <div 
            className="w-5 h-5 lg:w-6 lg:h-6 rounded flex items-center justify-center font-bold text-[9px] lg:text-[10px] text-white shadow-lg border border-white/10" 
            style={{ backgroundColor: team.color }}
          >
            {team.seed}
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[7px] lg:text-[8px] text-slate-500 font-bold uppercase tracking-wider">{team.city}</span>
            <span className="font-bold text-[11px] lg:text-[13px] text-slate-100 uppercase tracking-tight">{team.name}</span>
          </div>
        </div>

        <AnimatePresence>
          {isWinner && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className={isCorrectPick ? 'text-green-400' : isIncorrectPick ? 'text-red-400' : 'text-blue-400'}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 lg:w-4 lg:h-4">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  };

  return (
    <div className={`w-40 lg:w-48 flex-shrink-0 relative group transition-all duration-500 ${!team1 || !team2 ? 'opacity-50' : 'opacity-100'}`}>
      {/* Score/Status Display */}
      <div className="text-center mb-1">
        <span className={`text-[8px] lg:text-[9px] font-bold uppercase tracking-wider ${
          isCompleted ? 'text-green-400' : 
          isInProgress ? 'text-yellow-400' : 
          'text-slate-500'
        }`}>
          {getScoreDisplay()}
        </span>
      </div>
      
      <div className={`shadow-2xl rounded-xl overflow-hidden flex flex-col border border-white/5 bg-slate-900/20 backdrop-blur-sm ${getLiveBorderClass()}`}>
        {renderTeam(team1, false)}
        {renderTeam(team2, true)}
      </div>
    </div>
  );
}
