import { useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';

export default function AdminChecker() {
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const checkAndSetAdmin = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('Current user data:', userData);
          console.log('isAdmin from context:', isAdmin);
          
          // If user should be admin but isn't marked in Firestore
          if (isAdmin && !userData.isAdmin) {
            console.log('Setting admin status in Firestore...');
            await updateDoc(doc(db, 'users', user.uid), {
              isAdmin: true
            });
            console.log('Admin status updated! Please refresh the page.');
            alert('Admin status has been set. Please refresh the page.');
          }
        } else {
          console.log('User document does not exist in Firestore');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAndSetAdmin();
  }, [user, isAdmin]);

  return null;
}
