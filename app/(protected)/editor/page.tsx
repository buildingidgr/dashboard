import { Toaster } from 'sonner';
import { PlateEditor } from '@/components/editor/plate-editor';
import { SettingsProvider } from '@/components/editor/settings';

export default function Page() {
  return (
    <div className="relative h-full" data-registry="plate">
      <SettingsProvider>
        <div className="h-full">
          <PlateEditor />
        </div>
      </SettingsProvider>
      <Toaster />
    </div>
  );
}
