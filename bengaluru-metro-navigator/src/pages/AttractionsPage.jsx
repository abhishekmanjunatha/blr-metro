import { AttractionExplorer } from '../components/attractions';
import { useMetroData } from '../hooks';
import { LoadingPage } from '../components/common/LoadingSpinner';

export default function AttractionsPage() {
  const { isLoading } = useMetroData();

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <AttractionExplorer />
    </div>
  );
}
