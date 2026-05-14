import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  visible: boolean;
}

export default function LoadingOverlay({ visible }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Loader2 className="w-10 h-10 text-brand-text animate-spin" />
    </div>
  );
}
