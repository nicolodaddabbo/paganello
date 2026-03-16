import { useCallback } from 'react';
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

  const isFollowed = useCallback((team: string) => {
    const lower = team.toLowerCase();
    if (myTeam && lower === myTeam.toLowerCase()) return true;
    return followedTeams.some(t => t.toLowerCase() === lower);
  }, [myTeam, followedTeams]);

  // All followed teams including primary
  const allFollowed = myTeam
    ? [myTeam, ...followedTeams.filter(t => t.toLowerCase() !== myTeam.toLowerCase())]
    : followedTeams;

  const hasChosenMode = myTeam !== null || promptDismissed;

  return {
    myTeam, setMyTeam, clearMyTeam,
    followedTeams, toggleFollow, isFollowed, allFollowed,
    hasChosenMode, dismissPrompt: () => setPromptDismissed(true),
  };
}
