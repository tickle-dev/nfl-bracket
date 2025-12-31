import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';

const NFL_TEAMS = [
  { id: 'chiefs', name: 'Chiefs', city: 'Kansas City', conference: 'AFC', color: '#E31837' },
  { id: 'bills', name: 'Bills', city: 'Buffalo', conference: 'AFC', color: '#00338D' },
  { id: 'ravens', name: 'Ravens', city: 'Baltimore', conference: 'AFC', color: '#241773' },
  { id: 'texans', name: 'Texans', city: 'Houston', conference: 'AFC', color: '#03202F' },
  { id: 'steelers', name: 'Steelers', city: 'Pittsburgh', conference: 'AFC', color: '#FFB612' },
  { id: 'chargers', name: 'Chargers', city: 'Los Angeles', conference: 'AFC', color: '#0080C6' },
  { id: 'broncos', name: 'Broncos', city: 'Denver', conference: 'AFC', color: '#FB4F14' },
  { id: 'eagles', name: 'Eagles', city: 'Philadelphia', conference: 'NFC', color: '#004C54' },
  { id: 'lions', name: 'Lions', city: 'Detroit', conference: 'NFC', color: '#0076B6' },
  { id: 'rams', name: 'Rams', city: 'Los Angeles', conference: 'NFC', color: '#003594' },
  { id: 'buccaneers', name: 'Buccaneers', city: 'Tampa Bay', conference: 'NFC', color: '#D50A0A' },
  { id: 'vikings', name: 'Vikings', city: 'Minnesota', conference: 'NFC', color: '#4F2683' },
  { id: 'packers', name: 'Packers', city: 'Green Bay', conference: 'NFC', color: '#203731' },
  { id: 'commanders', name: 'Commanders', city: 'Washington', conference: 'NFC', color: '#5A1414' },
];

export default function PlayoffConfig() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [afcTeams, setAfcTeams] = useState(Array(7).fill(null));
  const [nfcTeams, setNfcTeams] = useState(Array(7).fill(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/rooms');
      return;
    }
    loadConfig();
  }, [isAdmin]);

  const loadConfig = async () => {
    const configDoc = await getDoc(doc(db, 'config', 'playoffs'));
    if (configDoc.exists()) {
      const data = configDoc.data();
      setAfcTeams(data.afcTeams || Array(7).fill(null));
      setNfcTeams(data.nfcTeams || Array(7).fill(null));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'config', 'playoffs'), {
        afcTeams,
        nfcTeams,
        updatedAt: new Date()
      });
      alert('Playoff configuration saved!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const setTeam = (conference, seed, teamId) => {
    const team = NFL_TEAMS.find(t => t.id === teamId);
    if (!team) return;

    const teamWithSeed = { ...team, seed: seed + 1 };
    
    if (conference === 'AFC') {
      const newTeams = [...afcTeams];
      newTeams[seed] = teamWithSeed;
      setAfcTeams(newTeams);
    } else {
      const newTeams = [...nfcTeams];
      newTeams[seed] = teamWithSeed;
      setNfcTeams(newTeams);
    }
  };

  const renderSeedSelector = (conference, seed) => {
    const teams = conference === 'AFC' ? afcTeams : nfcTeams;
    const selectedTeam = teams[seed];
    const availableTeams = NFL_TEAMS.filter(t => 
      t.conference === conference && 
      !teams.some(selected => selected?.id === t.id)
    );

    return (
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-xl p-4">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Seed #{seed + 1}
        </div>
        <select
          value={selectedTeam?.id || ''}
          onChange={(e) => setTeam(conference, seed, e.target.value)}
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select Team</option>
          {availableTeams.map(team => (
            <option key={team.id} value={team.id}>
              {team.city} {team.name}
            </option>
          ))}
          {selectedTeam && (
            <option value={selectedTeam.id}>
              {selectedTeam.city} {selectedTeam.name}
            </option>
          )}
        </select>
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

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent_60%)] pointer-events-none opacity-40"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/rooms')} className="text-slate-400 hover:text-white transition">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Playoff Configuration</h1>
              <p className="text-slate-400">Set the 14 playoff teams and their seeds</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl hover:bg-green-500/30 transition font-bold uppercase tracking-wider disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* AFC */}
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-red-500 uppercase tracking-wider">AFC Playoff Teams</h2>
            {[0, 1, 2, 3, 4, 5, 6].map(seed => renderSeedSelector('AFC', seed))}
          </div>

          {/* NFC */}
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-blue-500 uppercase tracking-wider">NFC Playoff Teams</h2>
            {[0, 1, 2, 3, 4, 5, 6].map(seed => renderSeedSelector('NFC', seed))}
          </div>
        </div>
      </div>
    </div>
  );
}
