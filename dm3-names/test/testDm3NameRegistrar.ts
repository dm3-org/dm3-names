import { HardhatEthersProvider } from '@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider';
import type { HardhatEthersHelpers } from '@nomicfoundation/hardhat-ethers/types';
import { expect } from 'chai';
import { Contract, ethers as ethersT } from 'ethers';
import { ethers } from 'hardhat';
import { EthereumProvider } from 'hardhat/types';

type ethersObj = typeof ethersT &
  Omit<HardhatEthersHelpers, 'provider'> & {
    provider: Omit<HardhatEthersProvider, '_hardhatProvider'> & {
      _hardhatProvider: EthereumProvider;
    };
  };

declare module 'hardhat/types/runtime' {
  const ethers: ethersObj;
  interface HardhatRuntimeEnvironment {
    ethers: ethersObj;
  }
}

describe('Dm3 name registrar', () => {
  let target: Contract;
  let aliceSigner: ethers.Signer;
  let bobSigner: ethers.Signer;

  beforeEach(async () => {
    const Dm3NameRegistrarFactory =
      await ethers.getContractFactory('Dm3NameRegistrar');
    const parentNode = ethers.namehash('op.dm3.eth');
    target = await Dm3NameRegistrarFactory.deploy();
    await target.initialize(parentNode);
    aliceSigner = (await ethers.getSigners())[0];
    bobSigner = (await ethers.getSigners())[1];
  });

  describe('register', () => {
    it('can set dm3 name', async () => {
      await target.register('alice');
      await target.connect(bobSigner).register('bob');
      const reverseRecord = `${aliceSigner.address
        .slice(2)
        .toLowerCase()}.addr.reverse`;

      const owner = await target["owner(bytes32)"](ethers.namehash('alice.op.dm3.eth'));
      const name = await target.reverse(ethers.namehash(reverseRecord));

      expect(owner).to.equal(aliceSigner.address);
      expect(name).to.equal('alice');

      const bobReverseRecord = `${bobSigner.address
        .slice(2)
        .toLowerCase()}.addr.reverse`;

      const bobOwner = await target["owner(bytes32)"](ethers.namehash('bob.op.dm3.eth'));
      const bobName = await target.reverse(ethers.namehash(bobReverseRecord));

      expect(bobOwner).to.equal(bobSigner.address);
      expect(bobName).to.equal('bob');
    });
    it('can use addr to retrieve address of node', async () => {
      await target.register('alice');

      const addr = await target.addr(ethers.namehash('alice.op.dm3.eth'));
      expect(addr).to.equal(aliceSigner.address);
    });
    it('can use reverse record to retrieve name of address', async () => {
      await target.register('alice');
      const reverseRecord = `${aliceSigner.address
        .slice(2)
        .toLowerCase()}.addr.reverse`;
      const reverseNode = ethers.namehash(reverseRecord);

      const name = await target.name(reverseNode);
      expect(name).to.equal('alice');
    });
    it('registering a new name overrides the old name', async () => {
      await target.register('alice');
      const reverseRecord = `${aliceSigner.address
        .slice(2)
        .toLowerCase()}.addr.reverse`;

      let owner = await target["owner(bytes32)"](ethers.namehash('alice.op.dm3.eth'));
      let name = await target.reverse(ethers.namehash(reverseRecord));

      expect(owner).to.equal(aliceSigner.address);
      expect(name).to.equal('alice');

      await target.register('bob');

      owner = await target["owner(bytes32)"](ethers.namehash('bob.op.dm3.eth'));
      name = await target.reverse(ethers.namehash(reverseRecord));

      const oldOwner = await target["owner(bytes32)"](ethers.namehash('alice.op.dm3.eth'));

      expect(owner).to.equal(aliceSigner.address);
      expect(name).to.equal('bob');

      expect(oldOwner).to.equal(ethers.ZeroAddress);
    });
    it('cant claim name that has been already registered', async () => {
      await target.register('alice');
      const reverseRecord = `${aliceSigner.address
        .slice(2)
        .toLowerCase()}.addr.reverse`;

      let owner = await target["owner(bytes32)"](ethers.namehash('alice.op.dm3.eth'));
      let name = await target.reverse(ethers.namehash(reverseRecord));

      expect(owner).to.equal(aliceSigner.address);
      expect(name).to.equal('alice');

      try {
        await target.connect(bobSigner).register('alice');
        expect.fail('Should have thrown');
      } catch (e: any) {
        expect(e.message).to.contain('Name already registered');
      }
    });
    it('passing an empty name deletes an existing record', async () => {
      await target.register('alice');
      const reverseRecord = `${aliceSigner.address
        .slice(2)
        .toLowerCase()}.addr.reverse`;

      let owner = await target["owner(bytes32)"](ethers.namehash('alice.op.dm3.eth'));
      let name = await target.reverse(ethers.namehash(reverseRecord));

      expect(owner).to.equal(aliceSigner.address);
      expect(name).to.equal('alice');

      await target.register(ethers.toUtf8Bytes(''));

      owner = await target["owner(bytes32)"](ethers.namehash('alice.op.dm3.eth'));
      name = await target.reverse(ethers.namehash(reverseRecord));

      expect(owner).to.equal(ethers.ZeroAddress);
      expect(name).to.equal('');
    });
  });
  describe('ownerRegister', () => {
    it('only owner', async () => {
      try {
        await target.connect(bobSigner).ownerRegister('alice', aliceSigner.address);
        expect.fail('Should have thrown');
      } catch (e: any) {
        expect(e.message).to.contain('Ownable: caller is not the owner');
      }
    });
    it('owner can register more than one name', async () => {
      await target.ownerRegister('alice', aliceSigner.address);
      await target.ownerRegister('bob', bobSigner.address);

      const aliceOwner = await target["owner(bytes32)"](ethers.namehash('alice.op.dm3.eth'));
      const bobOwner = await target["owner(bytes32)"](ethers.namehash('bob.op.dm3.eth'));
      expect(aliceOwner).to.equal(aliceSigner.address);
      expect(bobOwner).to.equal(bobSigner.address);

      const aliceReverseRecord = `${aliceSigner.address
        .slice(2)
        .toLowerCase()}.addr.reverse`;
      const bobReverseRecord = `${bobSigner.address
        .slice(2)
        .toLowerCase()}.addr.reverse`;

      const aliceName = await target.reverse(
        ethers.namehash(aliceReverseRecord)
      );
      const bobName = await target.reverse(ethers.namehash(bobReverseRecord));
      expect(aliceName).to.equal('alice');
      expect(bobName).to.equal('bob');

    });
    it('owner cant register a name that has been already registered', async () => {
      await target.register('alice');
      try {
        await target.ownerRegister('alice', aliceSigner.address);
        expect.fail('Should have thrown');
      } catch (e: any) {
        expect(e.message).to.contain('Name already registered');
      }
    });
  });

  describe('setText', () => {
    it('can set text record if name has been registered before', async () => {
      await target.register('alice');
      await target.setText(ethers.namehash('alice.op.dm3.eth'), 'key', 'value');
      const value = await target.text(
        ethers.namehash('alice.op.dm3.eth'),
        'key'
      );
      expect(value).to.equal('value');
    });
    it('deletes text record if name has been deleted', async () => {
      await target.register('alice');
      await target.setText(ethers.namehash('alice.op.dm3.eth'), 'key', 'value');
      const value = await target.text(
        ethers.namehash('alice.op.dm3.eth'),
        'key'
      );
      expect(value).to.equal('value');

      await target.register(ethers.toUtf8Bytes(''));
      const oldValue = await target.text(
        ethers.namehash('alice.op.dm3.eth'),
        'key'
      );
      expect(oldValue).to.equal('');
    });

    it('reverts if name has not been registered', async () => {
      try {
        await target.setText(
          ethers.namehash('alice.op.dm3.eth'),
          'key',
          'value'
        );
        expect.fail('Should have thrown');
      } catch (e: any) {
        expect(e.message).to.contain('Name not registered');
      }
    });
    it('reverts if msg.sender is not owner of name', async () => {
      await target.register('alice');
      const other = (await ethers.getSigners())[1];
      try {
        await target
          .connect(other)
          .setText(ethers.namehash('alice.op.dm3.eth'), 'key', 'value');
        expect.fail('Should have thrown');
      } catch (e: any) {
        expect(e.message).to.contain('Only owner');
      }
    });
  });
});
