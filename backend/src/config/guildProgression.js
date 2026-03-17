export function getGuildRewards(level) {
  const rewards = [];

  if (level >= 2) rewards.push('Study cache unlocked');
  if (level >= 5) rewards.push('Raid prep bonus');
  if (level >= 8) rewards.push('Guild banner cosmetic');
  if (level >= 10) rewards.push('Elite guild badge');

  return rewards;
}

export function getGuildAchievements(guild) {
  const achievements = [];

  if ((guild.memberCount || 0) >= 5) achievements.push('Squad Formed');
  if ((guild.memberCount || 0) >= 15) achievements.push('Growing Roster');
  if ((guild.xp || 0) >= 1000) achievements.push('First Milestone');
  if ((guild.xp || 0) >= 5000) achievements.push('Raid Veterans');
  if ((guild.level || 1) >= 10) achievements.push('Legendary Guild');

  return achievements;
}

export function enrichGuildProgression(guild) {
  return {
    ...guild,
    rewards: getGuildRewards(guild.level || 1),
    achievements: getGuildAchievements(guild),
  };
}
