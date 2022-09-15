import { ErrorMsgPipe } from './error-msg.pipe';

describe('ErrorMsgPipe', () => {
  it('create an instance', () => {
    const pipe = new ErrorMsgPipe();
    expect(pipe).toBeTruthy();
  });
});
