import { useMutation } from '@tanstack/react-query';
import { saveProfile } from '../profile.service';

export function useUpdateProfile() {
  return useMutation({
    mutationFn: saveProfile,
  });
}
