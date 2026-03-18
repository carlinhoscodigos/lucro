import { useQuery } from '@tanstack/react-query';
import { me } from '../services/auth.service';
import { getToken } from '../services/http';

export function useAuth() {
  const token = getToken();
  const query = useQuery({
    queryKey: ['me'],
    queryFn: me,
    enabled: !!token,
    retry: false,
  });

  return {
    token,
    user: query.data,
    isLoading: token ? query.isLoading : false,
    isError: query.isError,
  };
}

