import { ConnectingPipe } from './connecting.pipe';

describe('ConnectingPipe', () => {
  it('create an instance', () => {
    const pipe = new ConnectingPipe();
    expect(pipe).toBeTruthy();
  });
});
