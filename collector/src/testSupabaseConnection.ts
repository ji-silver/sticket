import { supabaseAdmin } from './supabaseAdmin.ts';

async function main() {
  const { count, error } = await supabaseAdmin.from('games').select('*', {
    count: 'exact',
    head: true,
  });

  if (error) {
    throw new Error(`games 테이블 조회 실패: ${error.message}`);
  }

  console.log('Supabase 연결 성공');
  console.log(`현재 저장된 경기 수: ${count ?? 0}`);
}

main().catch(error => {
  console.error('Supabase 연결 실패:', error);
  process.exitCode = 1;
});
