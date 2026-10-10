export class NicknameAlreadyUsedError extends Error {
  constructor() {
    super('이미 사용 중인 닉네임이에요');
    this.name = 'NicknameAlreadyUsedError';
  }
}
