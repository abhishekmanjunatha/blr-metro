import { AttractionDetails } from '../components/attractions';
import { useMetroData } from '../hooks';
import { LoadingPage } from '../components/common/LoadingSpinner';

export default function AttractionDetailsPage() {
  const { isLoading } = useMetroData();

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <AttractionDetails />
    </div>
  );
}
