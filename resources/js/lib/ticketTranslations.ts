/**
 * Tradução de status de tickets
 */
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'OPEN':
      return 'Aberto';
    case 'IN_PROGRESS':
      return 'Em Progresso';
    case 'IN_REVIEW':
      return 'Em Revisão';
    case 'RESOLVED':
      return 'Resolvido';
    case 'CLOSED':
      return 'Fechado';
    case 'CANCELED':
      return 'Cancelado';
    default:
      return status;
  }
};

/**
 * Tradução de prioridade de tickets
 */
export const getPriorityLabel = (priority: string): string => {
  switch (priority) {
    case 'LOW':
      return 'Baixa';
    case 'MEDIUM':
      return 'Média';
    case 'HIGH':
      return 'Alta';
    case 'URGENT':
      return 'Urgente';
    default:
      return priority;
  }
};
