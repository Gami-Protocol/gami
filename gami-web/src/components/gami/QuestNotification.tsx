import { useEffect, useState } from 'react';

export function QuestNotification() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex cursor-pointer items-center gap-4 bg-black p-4 neo-border shadow-brutal-purple transition-all duration-500"
      onClick={() => setVisible(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && setVisible(false)}
    >
      <div className="gami-gradient flex h-10 w-10 items-center justify-center text-xl font-bold">!</div>
      <div>
        <p className="font-display text-xs font-bold uppercase text-gami-accent">New Quest Available</p>
        <p className="text-sm font-medium">Verify your wallet to earn 250 $GAMI</p>
      </div>
      <button type="button" className="ml-2 text-gray-500 hover:text-white" onClick={() => setVisible(false)}>
        ✕
      </button>
    </div>
  );
}
