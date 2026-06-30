export default function ServerDownPage() {
  return (
    <div className="min-h-screen bg-[#1C1C1A] flex flex-col items-center justify-center py-8 px-4 text-center">
      <span className="icon text-[48px] text-[#E24B4A] mb-5">
        cloud_off
      </span>
      <h1 className="m-0 mb-3 font-serif text-[26px] text-[#EAF3DE]">Server Unreachable</h1>
      <p className="m-0 font-sans text-sm text-[#888780] max-w-[360px] leading-[1.6]">
        The Catoolu server isn't responding. Check your connection or try again in a moment.
      </p>
      <p className="m-0 mt-5 text-xs text-[#3A3A37] font-sans">
        Reconnecting automatically…
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="m-0 mt-5 py-2 px-[18px] font-sans text-[13px] text-[#EAF3DE] bg-transparent border border-[#4A4A45] rounded-lg cursor-pointer"
      >
        Try again
      </button>
    </div>
  );
}
