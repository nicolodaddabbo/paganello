import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '../utils/localStorage';

export function useMyTeam() {
  const [myTeam, setMyTeam] = useLocalStorage<string | null>('paganello-my-team', null);
  const [followedTeams, setFollowedTeams] = useLocalStorage<string[]>('paganello-followed', []);
  const [promptDismissed, setPromptDismissed] = useLocalStorage<boolean>('paganello-prompt-dismissed', false);

  const clearMyTeam = () => {
    setMyTeam(null);
    setPromptDismissed(false);
  };

  const toggleFollow = useCallback((team: string) => {
    setFollowedTeams(prev =>
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    );
  }, [setFollowedTeams]);

  const allFollowed = useMemo(() => {
    if (!myTeam) return followedTeams;
    const myLower = myTeam.toLowerCase();
    return [myTeam, ...followedTeams.filter(t => t.toLowerCase() !== myLower)];
  }, [myTeam, followedTeams]);

  const followedSet = useMemo(() => {
    return new Set(allFollowed.map(t => t.toLowerCase()));
  }, [allFollowed]);

  const isFollowed = useCallback((team: string) => {
    return followedSet.has(team.toLowerCase());
  }, [followedSet]);

  const hasChosenMode = myTeam !== null || promptDismissed;

  return {
    myTeam, setMyTeam, clearMyTeam,
    followedTeams, toggleFollow, isFollowed, allFollowed,
    hasChosenMode, dismissPrompt: () => setPromptDismissed(true),
  };
}
