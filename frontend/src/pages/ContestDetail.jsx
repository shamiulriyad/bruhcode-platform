import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { contestAPI, userAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import ContestCard from '../components/ContestCard';

export default function ContestDetail(){
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    contestAPI.getById(id)
      .then((res) => setContest(res.data))
      .catch((err) => {
        setError('Failed to load contest details');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const saveContest = async (contestId) => {
    try {
      if (!isAuthenticated) {
        toast.error('Please sign in to save contests');
        return;
      }
      await userAPI.addContest(contestId, 'Interested');
      toast.success('Contest saved');
    } catch (err) {
      toast.error(err?.response?.data || 'Failed to save contest');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!contest) return <div className="p-6">Contest not found</div>;

  return (
    <div className="home-shell app-main w-full px-4 py-8">
      <div className="home-toolbar" style={{ maxWidth: '1200px', margin: '0 auto 24px' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'#f0f0f0', letterSpacing:-0.5 }}>{contest.name}</h1>
          <p style={{ fontSize:13, color:'#555', marginTop:6 }}>Details and quick actions for this contest.</p>
        </div>
        <div />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <ContestCard contest={{
          id: contest.id,
          name: contest.name,
          platform: contest.platform,
          startTime: contest.startTime,
          duration: contest.duration,
          url: contest.url
        }} onBookmark={saveContest} compact={false} />

        {/* Additional details below the card */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-slate-400">Start Time</div>
              <div className="text-lg text-white">{new Date(contest.startTime).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Duration</div>
              <div className="text-lg text-white">{contest.duration} minutes</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Platform</div>
              <div className="text-lg text-white">{contest.platform}</div>
            </div>
          </div>

          <div className="mt-6 text-sm text-slate-300">
            <strong>Contest URL: </strong>
            <a href={contest.url} target="_blank" rel="noreferrer" className="text-sky-400 hover:text-sky-300">Open contest page</a>
          </div>
        </div>
      </div>
    </div>
  );
}
