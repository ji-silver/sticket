import { supabase } from '../../lib/supabase';

interface SaveProfileParams {
  nickname: string;
  favoriteTeamName: string;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
        id,
        nickname,
        favorite_team_id,
        created_at,
        updated_at,
        favorite_team:teams (
          id,
          name,
          short_name,
          sport
        )
      `,
    )
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function saveProfile({
  nickname,
  favoriteTeamName,
}: SaveProfileParams) {
  const trimmedNickname = nickname.trim();
  const normalizedFavoriteTeamName = favoriteTeamName.trim();

  if (trimmedNickname.length < 2 || trimmedNickname.length > 10) {
    throw new Error('닉네임은 2자 이상 10자 이하로 입력해 주세요.');
  }

  if (!normalizedFavoriteTeamName) {
    throw new Error('응원 구단을 선택해 주세요.');
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('로그인 정보를 확인할 수 없습니다.');
  }

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('id')
    .eq('sport', 'baseball')
    .eq('name', normalizedFavoriteTeamName)
    .eq('is_active', true)
    .maybeSingle();

  if (teamError) {
    throw teamError;
  }

  if (!team) {
    throw new Error('선택한 응원 구단을 찾을 수 없습니다.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        nickname: trimmedNickname,
        favorite_team_id: team.id,
      },
      {
        onConflict: 'id',
      },
    )
    .select(
      `
        id,
        nickname,
        favorite_team_id,
        created_at,
        updated_at,
        favorite_team:teams (
          id,
          name,
          short_name,
          sport
        )
      `,
    )
    .single();

  if (profileError) {
    throw profileError;
  }

  return profile;
}
