import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface ReadingPlan {
  id: string;
  planName: string;
  progress: number;
  totalDays: number;
  lastReadTimestamp: number;
  streak: number;
}

export function useReadingPlans() {
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setPlans([]);
      return;
    }

    let isMounted = true;
    const fetchPlans = async () => {
      try {
        const res = await fetch(`/api/user/reading-plans/${user.uid}`);
        const data = await res.json();
        if (data.success && isMounted) {
          setPlans(data.data);
        }
      } catch (e) {
        console.error("Failed to fetch reading plans", e);
      }
    };
    
    fetchPlans();
    return () => { isMounted = false; };
  }, [user]);

  const savePlan = async (plan: ReadingPlan) => {
    if (!user) return;
    try {
      await fetch('/api/user/reading-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, plan })
      });
      setPlans(prev => {
        const existing = prev.findIndex(p => p.id === plan.id);
        if (existing >= 0) {
          const newPlans = [...prev];
          newPlans[existing] = plan;
          return newPlans;
        }
        return [plan, ...prev];
      });
    } catch (e) {
      console.error("Failed to save plan", e);
    }
  };

  const markDayComplete = async (plan: ReadingPlan) => {
    const now = Date.now();
    const lastRead = new Date(plan.lastReadTimestamp);
    const today = new Date(now);
    
    // Calculate streak
    let newStreak = plan.streak;
    if (plan.lastReadTimestamp === 0) {
      newStreak = 1; // first day
    } else {
      const diffTime = Math.abs(today.getTime() - lastRead.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1; // reset streak if missed a day
      }
    }

    const updatedPlan = {
      ...plan,
      progress: Math.min(plan.progress + 1, plan.totalDays),
      lastReadTimestamp: now,
      streak: newStreak
    };

    await savePlan(updatedPlan);

    // If completed, log event
    if (updatedPlan.progress === updatedPlan.totalDays) {
      try {
        await fetch('/api/user/faith-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user.uid, 
            event: {
              id: `event-plan-${plan.id}`,
              eventType: 'plan_completed',
              title: 'Reading Plan Completed',
              description: `Finished ${plan.planName} (${plan.totalDays} Days)`,
              timestamp: Date.now()
            }
          })
        });
      } catch (e) {
        console.error("Failed to log faith event", e);
      }
    }
  };

  return { plans, savePlan, markDayComplete };
}
