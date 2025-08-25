import React, { useEffect, useState } from 'react';
import Marquee from 'react-fast-marquee';
import config from '../../config';

interface Announcement {
  id: number;
  message: string;
}

const AnnouncementMarquee: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await config.axios.get('announcements');
        setAnnouncements(response.data);
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
        setError('Failed to load announcements.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  if (loading) {
    return null; // Or a loading spinner if preferred
  }

  if (error) {
    return <div className="bg-red-500 text-white text-center py-2">{error}</div>;
  }

  if (announcements.length === 0) {
    return null; // No active announcements to display
  }

  return (
    <div className="relative w-full bg-primary-dark text-white py-2 bg-black">
      <Marquee gradient={false} speed={50} autoFill={true} >
        {announcements.map((announcement, index) => (
          <span key={`${announcement.id}-${index}`} className="mx-10 text-sm font-medium flex items-center">
            <img src="/balogo2.png" alt="Logo" className="h-5 w-6 mr-2 rounded-full bg-white p-1" />
            {announcement.message}
          </span>
        ))}
      </Marquee>
    </div>
  );
};

export default AnnouncementMarquee;
