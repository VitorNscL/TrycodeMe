export function computePrimaryRank(user: {
  active_hours: number;
  lessons_completed: number;
  exercises_completed: number;
}) {
  if (user.active_hours >= 100) return 'Veterano';
  if (user.lessons_completed >= 20 && user.exercises_completed >= 30) return 'Elite';
  if (user.lessons_completed >= 10) return 'Explorador';
  if (user.lessons_completed >= 3) return 'Aprendiz';
  return 'Iniciante';
}
