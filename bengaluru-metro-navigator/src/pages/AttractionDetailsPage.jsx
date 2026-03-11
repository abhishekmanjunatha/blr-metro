import { AttractionDetails } from '../components/attractions';
import { useMetroData, useDocumentHead } from '../hooks';
import { LoadingPage } from '../components/common/LoadingSpinner';
import { useParams } from 'react-router-dom';

export default function AttractionDetailsPage() {
  const { isLoading } = useMetroData();
  const { id } = useParams();
  const attractionName = id ? id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';

  useDocumentHead({
    title: attractionName ? `${attractionName} — Near Bengaluru Metro Station` : 'Attraction Details',
    description: attractionName ? `${attractionName} near Bengaluru Namma Metro — how to reach by metro, walking distance, timings and reviews.` : 'Explore attractions near Bengaluru Metro stations.',
    path: `/attractions/${id || ''}`,
  });

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <AttractionDetails />
    </div>
  );
}
