const PAGE_SIZE = 50;

export function filterLogsByType(logs, type) {
  return logs.filter(log => log.type === type);
}

export function getInitialLogs(logs, filters) {
  return filterLogs(logs, filters);
}

export function filterLogs(logs, filters) {
  if (!Array.isArray(logs)) return [];
  
  return logs.filter(log => {
    switch (log.type) {
      case 'vote':
        return filters.vote;
      case 'analysis':
        return filters.analyze;
      case 'token_profile':
        return filters.new;
      case 'telegram':
        return filters.news;
      default:
        return true;
    }
  });
}