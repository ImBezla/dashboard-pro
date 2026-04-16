import '@xyflow/react/dist/style.css';

/** Flow-Editor: volle Höhe, Hintergrund wie der App-Inhalt. */
export default function FlowLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-light dark:bg-[#0c0c0e]">
      {children}
    </div>
  );
}
