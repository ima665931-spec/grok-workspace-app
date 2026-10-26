export function TapStage() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="text-6xl">👆</div>
      <p className="text-xl">Tap to earn!</p>
      <button className="px-8 py-4 bg-yellow-500 text-black font-bold rounded-full text-lg active:scale-95 transition">
        TAP
      </button>
    </div>
  );
}
