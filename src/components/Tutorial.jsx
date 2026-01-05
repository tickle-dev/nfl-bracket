import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Users, Share2, Trophy, BarChart3, CheckCircle } from 'lucide-react';

export default function Tutorial({ isOpen, onClose }) {
  const [currentPage, setCurrentPage] = useState(0);

  // Reset to page 0 when tutorial is opened
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const pages = [
    {
      title: "Welcome to NFL Bracket!",
      icon: Trophy,
      content: (
        <div className="space-y-4">
          <p className="text-slate-300 text-lg">
            Compete with friends by predicting NFL playoff game winners. The more accurate your predictions, the more points you earn!
          </p>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h4 className="text-yellow-600/90 font-bold mb-3 text-lg">Quick Overview:</h4>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600/90 mt-1">•</span>
                <span>Join or create a room with friends</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600/90 mt-1">•</span>
                <span>Pick winners for each playoff game</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600/90 mt-1">•</span>
                <span>Submit your bracket before games start</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600/90 mt-1">•</span>
                <span>Earn points for correct predictions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600/90 mt-1">•</span>
                <span>Compete on the leaderboard!</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Joining a Room",
      icon: Users,
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">
            Rooms let you compete with specific groups of friends. Each room has a unique 6-character code.
          </p>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 space-y-4">
            <div>
              <h4 className="text-yellow-600/90 font-bold mb-2">To Join a Room:</h4>
              <ol className="space-y-2 text-slate-300 list-decimal list-inside">
                <li>Get a room code from a friend</li>
                <li>Enter the code in the "Join Room" box</li>
                <li>Click "Join" to enter the room</li>
                <li>You'll be taken to the bracket page automatically</li>
              </ol>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-yellow-600/20">
              <div className="text-center mb-2">
                <input
                  type="text"
                  value="ABC123"
                  readOnly
                  className="w-48 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-center font-bold tracking-wider"
                />
              </div>
              <p className="text-slate-400 text-sm text-center">Example room code</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Sharing a Room",
      icon: Share2,
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">
            Invite friends to your room by sharing the room code or link.
          </p>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 space-y-4">
            <div>
              <h4 className="text-yellow-600/90 font-bold mb-2">How to Share:</h4>
              <ol className="space-y-2 text-slate-300 list-decimal list-inside">
                <li>Find your room in "My Rooms"</li>
                <li>Click the green share button</li>
                <li>Send the link or code to friends</li>
              </ol>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-green-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-yellow-600/80 to-yellow-700/80 px-3 py-1 rounded-lg">
                  <span className="text-white font-bold tracking-wider">ABC123</span>
                </div>
                <span className="text-white font-semibold">Room ABC123</span>
              </div>
              <button className="p-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Filling Out Your Bracket",
      icon: CheckCircle,
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">
            Pick the winner for each playoff matchup. Your picks automatically advance through the rounds.
          </p>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 space-y-4">
            <div>
              <h4 className="text-yellow-600/90 font-bold mb-2">How to Pick:</h4>
              <ol className="space-y-2 text-slate-300 list-decimal list-inside">
                <li>Click on a team to select them as the winner</li>
                <li>Your pick will highlight in gold</li>
                <li>Winners automatically advance to the next round</li>
                <li>Continue until you've picked a Super Bowl champion</li>
              </ol>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-yellow-600/20">
              <p className="text-slate-400 text-xs mb-3 text-center">Example Matchup:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 border-2 border-yellow-600/50 rounded-lg cursor-pointer">
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold">KC</div>
                  <span className="text-white font-semibold flex-grow">Kansas City Chiefs</span>
                  <span className="text-yellow-600/90 font-bold">#1</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg cursor-pointer opacity-60">
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold">BUF</div>
                  <span className="text-white font-semibold flex-grow">Buffalo Bills</span>
                  <span className="text-slate-400 font-bold">#2</span>
                </div>
              </div>
              <p className="text-slate-400 text-xs mt-3 text-center">Click a team to select them</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Submitting Your Bracket",
      icon: CheckCircle,
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">
            Once you've made all your picks, submit your bracket to lock it in.
          </p>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 space-y-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <h4 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                <span>⚠️</span> Important:
              </h4>
              <ul className="space-y-1 text-slate-300 text-sm">
                <li>• You must complete ALL picks before submitting</li>
                <li>• Once submitted, your bracket is LOCKED</li>
                <li>• You cannot change picks after submission</li>
                <li>• Submit before the first playoff game starts!</li>
              </ul>
            </div>
            <div>
              <h4 className="text-yellow-600/90 font-bold mb-2">To Submit:</h4>
              <ol className="space-y-2 text-slate-300 list-decimal list-inside">
                <li>Complete all matchup picks</li>
                <li>Review your selections</li>
                <li>Click "Submit Bracket" at the top</li>
                <li>Confirm your submission</li>
              </ol>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-green-500/20 text-center">
              <button className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg">
                Submit Bracket
              </button>
              <p className="text-slate-400 text-xs mt-2">Click when ready to lock in picks</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Point System",
      icon: Trophy,
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">
            Earn points for each correct prediction. Later rounds are worth more points!
          </p>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 space-y-3">
            <h4 className="text-yellow-600/90 font-bold mb-3 text-center">Points Per Round:</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                <span className="text-white font-semibold">Wild Card Round</span>
                <span className="text-yellow-600/90 font-bold text-xl">1 pt</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                <span className="text-white font-semibold">Divisional Round</span>
                <span className="text-yellow-600/90 font-bold text-xl">2 pts</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                <span className="text-white font-semibold">Conference Championship</span>
                <span className="text-yellow-600/90 font-bold text-xl">3 pts</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 rounded-lg border-2 border-yellow-600/50">
                <span className="text-white font-bold">Super Bowl</span>
                <span className="text-yellow-600/90 font-bold text-2xl">5 pts</span>
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
              <p className="text-blue-300 text-sm text-center">
                <strong>Maximum possible score: 23 points</strong><br/>
                (6 Wild Card + 4 Divisional + 2 Conference + 1 Super Bowl)
              </p>
            </div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <h4 className="text-orange-300 font-bold mb-2 flex items-center gap-2">
              <span>🎯</span> Tiebreaker:
            </h4>
            <p className="text-orange-200 text-sm">
              If multiple players have the same points, the winner is determined by who predicted closest to the <strong>total points scored in the Super Bowl</strong>. You must enter your tiebreaker prediction when filling out your bracket!
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Viewing the Leaderboard",
      icon: BarChart3,
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">
            Track your performance and see how you stack up against friends!
          </p>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 space-y-4">
            <div>
              <h4 className="text-yellow-600/90 font-bold mb-2">Leaderboard Features:</h4>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600/90 mt-1">•</span>
                  <span>Found at the top of the bracket page</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600/90 mt-1">•</span>
                  <span>See all participants ranked by points</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600/90 mt-1">•</span>
                  <span>View correct picks (green) and incorrect picks (red)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600/90 mt-1">•</span>
                  <span>Updates automatically as games finish</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600/90 mt-1">•</span>
                  <span>Only visible after you submit your bracket</span>
                </li>
              </ul>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-yellow-600/20">
              <p className="text-slate-400 text-xs mb-3 text-center">Example Leaderboard:</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-yellow-600/10 border border-yellow-600/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-600/90 font-bold text-lg">1.</span>
                    <span className="text-white font-semibold">John</span>
                  </div>
                  <span className="text-yellow-600/90 font-bold text-lg">15 pts</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-bold">2.</span>
                    <span className="text-white font-semibold">Sarah</span>
                  </div>
                  <span className="text-slate-300 font-bold">12 pts</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-bold">3.</span>
                    <span className="text-white font-semibold">Mike</span>
                  </div>
                  <span className="text-slate-300 font-bold">10 pts</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-blue-300 font-bold mb-2">💡 Pro Tip:</h4>
            <p className="text-blue-200 text-sm">
              Game results are tracked in real-time on the bracket page. You can see which games have been completed and who won as the playoffs progress!
            </p>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-300 text-center font-semibold">
              🏆 Good luck and may the best bracket win! 🏆
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentPageData = pages[currentPage];
  const Icon = currentPageData.icon;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 border-b border-white/10 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-yellow-600/80 to-yellow-700/80 p-3 rounded-xl shadow-lg">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">{currentPageData.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          {currentPageData.content}
        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-800/50 border-t border-white/10 p-4 sm:p-6 flex items-center justify-between gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm sm:text-base disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex gap-2 items-center flex-shrink-0">
            {pages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentPage
                    ? 'bg-yellow-600/90 w-8'
                    : 'bg-slate-600 hover:bg-slate-500 w-2'
                }`}
              />
            ))}
          </div>

          {currentPage === pages.length - 1 ? (
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-2 bg-gradient-to-r from-yellow-600/80 to-yellow-700/80 rounded-lg text-white text-sm sm:text-base font-semibold hover:from-yellow-600/90 hover:to-yellow-700/90 transition shadow-lg flex-shrink-0"
            >
              Get Started!
            </button>
          ) : (
            <button
              onClick={() => setCurrentPage(prev => Math.min(pages.length - 1, prev + 1))}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-yellow-600/80 to-yellow-700/80 rounded-lg text-white text-sm sm:text-base font-semibold hover:from-yellow-600/90 hover:to-yellow-700/90 transition shadow-lg flex-shrink-0"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
