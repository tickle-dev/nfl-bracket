import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs, doc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Users, Plus, LogOut, Trophy, ArrowRight, Trash2, Eye, Settings, Share2, HelpCircle } from 'lucide-react';
import Tutorial from './Tutorial';

export default function RoomSelection() {
  const [roomCode, setRoomCode] = useState('');
  const [userRooms, setUserRooms] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const { user, logout, isAdmin, username, isFirstLogin, markTutorialSeen } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadUserRooms();
    
    // Auto-show tutorial for first-time users
    if (isFirstLogin) {
      setShowTutorial(true);
    }
    
    // Check if there's a join parameter in the URL
    const joinCode = searchParams.get('join');
    if (joinCode) {
      setRoomCode(joinCode.toUpperCase());
      // Auto-submit after a brief delay to allow state to update
      setTimeout(() => {
        autoJoinRoom(joinCode.toUpperCase());
      }, 100);
    }
  }, [user, searchParams, isFirstLogin]);

  const loadUserRooms = async () => {
    const q = query(collection(db, 'userRooms'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    const roomsData = [];
    
    for (const docSnap of snapshot.docs) {
      const roomData = docSnap.data();
      const roomDoc = await getDoc(doc(db, 'rooms', roomData.roomId));
      if (roomDoc.exists()) {
        roomsData.push({
          id: docSnap.id,
          ...roomData,
          isCreator: roomDoc.data().createdBy === user.uid
        });
      }
    }
    
    setUserRooms(roomsData);
  };

  const shareRoom = (roomCode) => {
    const shareUrl = `${window.location.origin}/rooms?join=${roomCode}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join my NFL Bracket Room',
        text: `Join my NFL playoff bracket room with code: ${roomCode}`,
        url: shareUrl
      }).catch(() => {
        copyToClipboard(shareUrl, roomCode);
      });
    } else {
      copyToClipboard(shareUrl, roomCode);
    }
  };

  const copyToClipboard = (url, roomCode) => {
    navigator.clipboard.writeText(url).then(() => {
      alert(`Room link copied! Share this link or use code: ${roomCode}`);
    }).catch(() => {
      alert(`Share this link: ${url}\n\nOr use room code: ${roomCode}`);
    });
  };

  const createRoom = async () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomRef = await addDoc(collection(db, 'rooms'), { 
      code, 
      createdAt: new Date(),
      createdBy: user.uid 
    });
    await addDoc(collection(db, 'userRooms'), { userId: user.uid, roomId: roomRef.id, roomCode: code });
    navigate(`/bracket/${roomRef.id}`);
  };

  const joinRoom = async (e) => {
    e.preventDefault();
    await autoJoinRoom(roomCode);
  };

  const autoJoinRoom = async (code) => {
    const q = query(collection(db, 'rooms'), where('code', '==', code.toUpperCase()));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const roomId = snapshot.docs[0].id;
      
      // Check if user is already in this room
      const existingRoom = query(
        collection(db, 'userRooms'), 
        where('userId', '==', user.uid),
        where('roomId', '==', roomId)
      );
      const existingSnapshot = await getDocs(existingRoom);
      
      if (existingSnapshot.empty) {
        await addDoc(collection(db, 'userRooms'), { userId: user.uid, roomId, roomCode: code.toUpperCase() });
      }
      
      navigate(`/bracket/${roomId}`);
    } else {
      alert('Room not found. Please check the code and try again.');
    }
  };

  const deleteRoom = async (roomId, roomCode) => {
    if (!window.confirm(`Are you sure you want to delete room ${roomCode}? This will delete all brackets in this room and cannot be undone.`)) return;
    
    try {
      console.log('Starting room deletion for:', roomId);
      
      // Delete all brackets in the room
      console.log('Fetching brackets...');
      const bracketsQuery = query(collection(db, 'brackets'), where('roomId', '==', roomId));
      const bracketsSnapshot = await getDocs(bracketsQuery);
      console.log('Found brackets:', bracketsSnapshot.docs.length);
      
      // Delete all userRooms entries
      console.log('Fetching userRooms...');
      const userRoomsQuery = query(collection(db, 'userRooms'), where('roomId', '==', roomId));
      const userRoomsSnapshot = await getDocs(userRoomsQuery);
      console.log('Found userRooms:', userRoomsSnapshot.docs.length);
      
      const batch = writeBatch(db);
      
      console.log('Adding brackets to batch delete...');
      bracketsSnapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      
      console.log('Adding userRooms to batch delete...');
      userRoomsSnapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      
      // Delete the room itself
      console.log('Adding room to batch delete...');
      batch.delete(doc(db, 'rooms', roomId));
      
      console.log('Committing batch...');
      await batch.commit();
      
      console.log('Room deleted successfully!');
      alert('Room deleted successfully!');
      loadUserRooms();
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      alert(`Error deleting room: ${error.message}\n\nCheck console for details.`);
    }
  };

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    markTutorialSeen();
  };

  const hasNoRooms = userRooms.length === 0;

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent_60%)] pointer-events-none opacity-40"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-slate-100 to-blue-600 p-[2px] transition-transform duration-500">
              <div className="bg-[#020617] w-full h-full rounded-[10px] flex items-center justify-center text-white text-[14px] font-black italic">NFL</div>
            </div>
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">Mixin it up Family Bracket</h1>
              <p className="text-blue-200 text-sm">Welcome back, {username || 'User'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowTutorial(true)} 
              className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-blue-200 px-6 py-3 rounded-xl hover:bg-blue-500/30 transition-all duration-300 shadow-lg hover:shadow-blue-500/20"
              title="How to Use"
            >
              <HelpCircle className="w-4 h-4" /> Tutorial
            </button>
            {isAdmin && (
              <button 
                onClick={() => navigate('/admin/playoff-config')} 
                className="flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-blue-200 px-6 py-3 rounded-xl hover:bg-blue-500/30 transition-all duration-300 shadow-lg hover:shadow-blue-500/20"
              >
                <Settings className="w-4 h-4" /> Playoff Config
              </button>
            )}
            <button 
              onClick={logout} 
              className="flex items-center gap-2 bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-200 px-6 py-3 rounded-xl hover:bg-red-500/30 transition-all duration-300 shadow-lg hover:shadow-red-500/20"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        {hasNoRooms ? (
          // Prominent Join Room for new users
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-2xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-600/80 to-yellow-700/80 rounded-2xl mb-6 shadow-lg shadow-yellow-600/10">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl font-bold text-white mb-3">Join a Room</h2>
                <p className="text-slate-300 text-lg">Enter a room code to get started with your bracket predictions</p>
              </div>
              
              <form onSubmit={joinRoom} className="space-y-6">
                <div>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    className="w-full px-6 py-5 bg-slate-800/50 backdrop-blur-sm border-2 border-slate-700/50 rounded-xl text-white placeholder-slate-400 text-center text-2xl font-bold tracking-widest focus:ring-4 focus:ring-yellow-600/30 focus:border-yellow-600/50 transition-all duration-300"
                    maxLength="6"
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-yellow-600/80 to-yellow-700/80 text-white py-5 rounded-xl hover:from-yellow-600/90 hover:to-yellow-700/90 transition-all duration-300 font-bold text-lg shadow-xl shadow-yellow-600/10 hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-3"
                >
                  Join Room <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              {isAdmin && (
                <div className="mt-8 pt-8 border-t border-white/10">
                  <p className="text-center text-slate-400 text-sm mb-4">Or create a new room as admin</p>
                  <button 
                    onClick={createRoom} 
                    className="w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-white py-4 rounded-xl hover:bg-slate-700/50 transition-all duration-300 font-semibold flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Create New Room
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Grid layout for users with rooms
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Join Room Card */}
              <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-yellow-600/80 to-yellow-700/80 p-3 rounded-xl shadow-lg shadow-yellow-600/10">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Join Room</h2>
                </div>
                <form onSubmit={joinRoom} className="space-y-4">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    className="w-full px-4 py-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl text-white placeholder-slate-400 text-center font-bold tracking-wider focus:ring-2 focus:ring-yellow-600/30 focus:border-yellow-600/50 transition-all"
                    maxLength="6"
                    required
                  />
                  <button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-yellow-600/80 to-yellow-700/80 text-white py-3 rounded-xl hover:from-yellow-600/90 hover:to-yellow-700/90 transition-all duration-300 font-semibold shadow-lg shadow-yellow-600/10 hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    Join <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Create Room Card (Admin Only) */}
              {isAdmin && (
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-br from-yellow-600/80 to-yellow-700/80 p-3 rounded-xl shadow-lg shadow-yellow-600/10">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Create Room</h2>
                  </div>
                  <p className="text-slate-300 mb-6">Start a new bracket room and share the code with friends</p>
                  <button 
                    onClick={createRoom} 
                    className="w-full bg-gradient-to-r from-yellow-600/80 to-yellow-700/80 text-white py-3 rounded-xl hover:from-yellow-600/90 hover:to-yellow-700/90 transition-all duration-300 font-semibold shadow-lg shadow-yellow-600/10 hover:shadow-xl"
                  >
                    Create New Room
                  </button>
                </div>
              )}
            </div>

            {/* My Rooms */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Trophy className="w-6 h-6 text-yellow-600/90" />
                My Rooms
              </h2>
              <div className="grid gap-4">
                {userRooms.map(room => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between p-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl hover:bg-slate-800/50 transition-all duration-300 hover:shadow-lg"
                  >
                    <button
                      onClick={() => navigate(`/bracket/${room.roomId}`)}
                      className="flex items-center gap-4 flex-grow text-left"
                    >
                      <div className="bg-gradient-to-br from-yellow-600/80 to-yellow-700/80 px-4 py-2 rounded-lg shadow-lg shadow-yellow-600/10">
                        <span className="text-white font-bold text-lg tracking-wider">{room.roomCode}</span>
                      </div>
                      <span className="text-white font-semibold text-lg">Room {room.roomCode}</span>
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); shareRoom(room.roomCode); }}
                        className="p-2 bg-green-500/20 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition text-green-400"
                        title="Share Room"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/admin/brackets/${room.roomId}`); }}
                            className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition text-blue-400"
                            title="View Submitted Brackets (Admin)"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteRoom(room.roomId, room.roomCode); }}
                            className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition text-red-400"
                            title="Delete Room (Admin)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <ArrowRight className="w-5 h-5 text-yellow-600/70" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <Tutorial isOpen={showTutorial} onClose={handleCloseTutorial} />

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
