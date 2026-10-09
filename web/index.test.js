const {createHash} = require('node:crypto');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {fileURLToPath, pathToFileURL} = require('node:url');

const pageURL = pathToFileURL(join(__dirname, 'index.html'));
const html = readFileSync(pageURL, 'utf8');
const iconHref = html.match(/<link\s+rel="icon"\s+href="([^"]+)"/)[1];
const iconURL = new URL(iconHref, pageURL);
const icon = readFileSync(fileURLToPath(iconURL));

test('탭 아이콘이 공통 브랜드 로고와 일치한다', () => {
  const selectedLogo = readFileSync(
    join(__dirname, '../src/assets/brand/logo.png'),
  );

  expect(icon.equals(selectedLogo)).toBe(true);
});

test('아이콘이 바뀌면 브라우저가 새 파일을 읽도록 캐시 버전이 일치한다', () => {
  // 파일 내용으로 버전을 확인해 이미지 교체 후 주소 갱신을 빠뜨리는 경우를 잡는다.
  const version = createHash('sha256').update(icon).digest('hex').slice(0, 12);

  expect(iconURL.searchParams.get('v')).toBe(version);
});
