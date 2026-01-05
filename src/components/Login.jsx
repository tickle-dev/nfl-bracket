import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { LogIn, Mail, AlertCircle, CheckCircle } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = location.state?.from || '/rooms';
  const isVerified = searchParams.get('verified') === 'true';

  useEffect(() => {
    if (isVerified) {
      setIsLogin(true);
    }
  }, [isVerified]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setVerificationSent(false);
    
    if (!isLogin) {
      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        return;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }
    
    try {
      if (isLogin) {
        await login(email, password);
        navigate(from, { replace: true });
      } else {
        await signup(email, password, username);
        setVerificationSent(true);
      }
    } catch (err) {
      if (err.message === 'EMAIL_NOT_VERIFIED') {
        setError('Please verify your email before signing in. Check your inbox and spam folder.');
      } else {
        setError(err.message);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent_60%)] pointer-events-none opacity-40"></div>
      
      <div className="relative z-10 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-red-600 via-slate-100 to-blue-600 p-[2px]">
            <div className="bg-slate-950 w-full h-full rounded-[14px] flex items-center justify-center text-white text-2xl font-black italic">NFL</div>
          </div>
        </div>
        <h1 className="text-3xl font-black text-center mb-2 text-white uppercase tracking-tight">Mixin it up Family Bracket</h1>
        <p className="text-center text-slate-400 mb-6 text-sm">{isLogin ? 'Sign in to continue' : 'Create your account'}</p>
        
        {isVerified && (
          <div className="bg-green-500/10 border-2 border-green-500/30 rounded-lg p-4 mb-4 flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-green-400 font-bold text-base mb-1">✓ Email Verified!</h4>
              <p className="text-green-200 text-sm">Your email has been verified. Please sign in to continue.</p>
            </div>
          </div>
        )}
        
        {verificationSent ? (
          <div className="space-y-4">
            <div className="bg-green-500/10 border-2 border-green-500/30 rounded-lg p-6 text-center">
              <Mail className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-green-400 mb-2">Verification Email Sent!</h3>
              <p className="text-slate-300 mb-4">Please check your email and click the verification link to activate your account. After verifying, sign in to continue.</p>
              <button
                onClick={() => {
                  setVerificationSent(false);
                  setIsLogin(true);
                }}
                className="text-green-400 font-semibold hover:underline"
              >
                Back to Sign In
              </button>
              {from !== '/rooms' && (
                <p className="text-xs text-slate-400 mt-4">You'll be redirected to join the room after signing in.</p>
              )}
            </div>
            
            {/* Prominent Spam Warning */}
            <div className="bg-yellow-500/10 border-2 border-yellow-500/50 rounded-lg p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-yellow-400 font-bold text-base mb-1">⚠️ CHECK YOUR SPAM FOLDER!</h4>
                  <p className="text-yellow-200 text-sm">
                    The verification email may be in your spam or junk folder. Please check there if you don't see it in your inbox within a few minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={!isLogin}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={!isLogin}
                  />
                </div>
              )}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-bold uppercase tracking-wide"
              >
                {isLogin ? 'Sign In' : 'Sign Up'}
              </button>
            </form>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-900/60 text-slate-400">Or continue with</span>
              </div>
            </div>
            
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white/10 border border-white/20 text-white py-3 rounded-lg hover:bg-white/20 transition font-semibold"
            >
              <Mail className="w-5 h-5" />
              Google
            </button>
            
            <p className="text-center mt-4 text-sm text-slate-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-blue-400 font-semibold hover:underline">
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
