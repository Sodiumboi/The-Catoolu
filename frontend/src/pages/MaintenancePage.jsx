import serverFire from '../assets/this-is-fine.png';

export default function MaintenancePage({ message }) {
  return (
    <div className="min-h-screen bg-(--bg-page) flex flex-col items-center justify-center py-8 px-4 text-center">
      <img
        src={serverFire}
        alt=""
        className="w-[180px] h-[180px] object-contain mb-6"
      />
      <h1 className="m-0 mb-3 font-serif text-[28px] text-(--text-primary)">Under Maintenance</h1>
      <p className="m-0 mb-2 font-sans text-[15px] text-(--text-secondary) max-w-[400px] leading-[1.6]">
        {message || 'We are updating The Catoolu. Back soon.'}
      </p>
      <p className="m-0 mt-6 text-xs text-(--text-faint) font-sans">
        You can check back later, Refresh if needed.
      </p>
    </div>
  );
}
