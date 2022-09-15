import { FilterWithNoPidsPipe } from './filter-with-no-pids/filter-with-no-pids.pipe';

describe('FilterWithNoPidsPipe', () => {
  it('create an instance', () => {
    const pipe = new FilterWithNoPidsPipe();
    expect(pipe).toBeTruthy();
  });
});
