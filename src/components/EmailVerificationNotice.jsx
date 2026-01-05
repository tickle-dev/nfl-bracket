import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';
import { Mail, AlertCircle, RefreshCw } from 'lucide-react';

export default function EmailVerificationNotice() {
  const { user, logout } = useAuth();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check immediately on mount
    const checkImmediately = async () => {
      if (user) {
        await user.reload();
        const refreshedUser = auth.currentUser;
        if (refreshedUser && refreshedUser.emailVerified) {
          window.location.reload();
        }
      }
    };
    checkImmediately();
    
    // Then check every second
    const interval = setInterval(async () => {
      if (user) {
        await user.reload();
        const refreshedUser = auth.currentUser;
        if (refreshedUser && refreshedUser.emailVerified) {
          window.location.reload();
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [user]);

  const checkVerification = async () => {
    setChecking(true);
    setMessage('');
    try {
      await user.reload();
      const refreshedUser = auth.currentUser;
      if (refreshedUser && refreshedUser.emailVerified) {
        window.location.reload();
      } else {
        setMessage('Email not verified yet. Please check your inbox and spam folder.');
      }
    } catch (err) {
      setMessage('Error checking verification status.');
    }
    setChecking(false);
  };

  const resendVerification = async () => {
    setResending(true);
    setMessage('');
    try {
      await sendEmailVerification(user);
      setMessage('Verification email sent! Please check your inbox and spam folder.');
    } catch (err) {
      setMessage('Error sending email. Please try again later.');
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-800 to-orange-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-orange-100 p-4 rounded-full">
            <Mail className="w-12 h-12 text-orange-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">Verify Your Email</h1>
        <p className="text-center text-gray-600 mb-6">
          We sent a verification link to <span className="font-semibold">{user?.email}</span>
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Check your email</p>
              <p>Click the verification link in the email to activate your account. Check your spam folder if needed.</p>
            </div>
          </div>
        </div>

        {message && (
          <div className={`border rounded-lg p-3 mb-4 ${
            message.includes('sent') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <p className="text-sm">{message}</p>
          </div>
        )}
        
        <button
          onClick={checkVerification}
          disabled={checking}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold mb-3 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-5 h-5 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking...' : 'I Verified My Email'}
        </button>
        
        <button
          onClick={resendVerification}
          disabled={resending}
          className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition font-semibold mb-3 disabled:opacity-50"
        >
          {resending ? 'Sending...' : 'Resend Verification Email'}
        </button>
        
        <button
          onClick={logout}
          className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
