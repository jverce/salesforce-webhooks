import { expect } from 'chai';
import { describe } from 'mocha';
import * as common from '../../../src/utils/common';

describe('Random name generator', function () {
  it('should generate different names for the same prefix', function () {
    const prefix = 'SomePrefix';
    const first = common.getRandomName(prefix);
    const second = common.getRandomName(prefix);
    expect(first).to.not.equal(second);
  });

  it('should generate a name that contains the prefix', function () {
    const prefix = 'SomePrefix';
    const randomName = common.getRandomName(prefix);
    expect(randomName).to.contain(prefix);
  });

  it('should generate a name that is shorter than 40 characters', function () {
    const prefix = 'SomePrefix';
    const randomName = common.getRandomName(prefix);
    expect(randomName.length).to.be.lte(40);
  });
});
