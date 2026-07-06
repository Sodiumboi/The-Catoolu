import { Link } from 'react-router-dom';
import logo from '../assets/vault-logo.png';

// Shown in place of the character creation wizard while the creation engine
// is taken offline (see config/features.js → CREATION_ENGINE_ENABLED).
// Dhole's House import remains the working path for adding characters.
export default function CreationUnavailablePage() {
  return (
    <div className="min-h-screen bg-(--bg-page) flex flex-col items-center justify-center py-8 px-4 text-center">
      <img
        src={logo}
        alt="The Catoolu"
        className="w-[72px] h-[72px] object-contain mb-6 opacity-70"
      />
      <h1 className="m-0 mb-3 font-serif text-[28px] text-(--text-primary)">Character Creation</h1>
      <p className="m-0 mb-2 font-sans text-[15px] text-(--text-secondary) max-w-[400px] leading-[1.6]">
        We're rebuilding the character creation engine from the ground up. In
        the meantime, you can import a character from Dhole's House.
      </p>
      <Link
        to="/dashboard"
        className="btn-primary mt-6 no-underline"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
