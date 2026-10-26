import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { membersApi } from '../lib/api.js';

const MEMBERS_KEY = ['members'];

export function useMembers() {
  return useQuery({
    queryKey: MEMBERS_KEY,
    queryFn: ({ signal }) => membersApi.list({ signal }),
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: membersApi.create,
    onSuccess: (member) => {
      queryClient.setQueryData(MEMBERS_KEY, (current = []) => [member, ...current]);
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: membersApi.update,
    onSuccess: (member) => {
      queryClient.setQueryData(MEMBERS_KEY, (current = []) =>
        current.map((item) => (item.id === member.id ? member : item)),
      );
    },
  });
}

/** Removes the member from the list immediately and puts it back if the request fails. */
export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: membersApi.remove,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: MEMBERS_KEY });
      const previous = queryClient.getQueryData(MEMBERS_KEY);
      queryClient.setQueryData(MEMBERS_KEY, (current = []) => current.filter((item) => item.id !== id));
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(MEMBERS_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: MEMBERS_KEY }),
  });
}
