// pages/_app.js
//
// Top-level app wrapper. Wraps every page in AuthProvider so `useAuth()`
// works anywhere, and imports the global Tailwind stylesheet.

import '../styles/globals.css';
import { AuthProvider } from '../contexts/AuthContext';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
