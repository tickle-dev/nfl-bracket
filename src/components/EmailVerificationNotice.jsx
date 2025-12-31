import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';
import { Mail, AlertCircle } from 'lucide-react';

export default function EmailVerificationNotice() {
  const { user, logout } = useAuth();
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');

  const resendVerification = async () => {
    setResending(true);
    setMessage('');
    try {
      await sendEmailVerification(auth.currentUser);
      setMessage('Verification email sent! Please check your inbox.');
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
              <p>Click the verification link in the email to activate your account. You may need to check your spam folder.</p>
            </div>
          </div>
        </div>

        {message && (
          <div className={`border rounded-lg p-3 mb-4 ${
            message.includes('sent') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <p className="text-sm">{message}</p>
          </div>
        )}
        
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
