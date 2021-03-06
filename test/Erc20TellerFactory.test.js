const {
  BN,
  expectEvent,
  shouldFail,
  constants,
  balance,
  send,
  ether,
} = require('openzeppelin-test-helpers');

const toBytes = web3.utils.utf8ToHex;
const {padRight} = web3.utils;
const { wad, ray } = require('./fixedPoint');

const ManagingDirector = artifacts.require('ManagingDirector');
const Erc20TellerFactory = artifacts.require('Erc20TellerFactory');
const ERC20Mock = artifacts.require('ERC20Mock');

contract('Erc20TellerFactory', function([
  _,
  adminRole,
  brokerRole,
  daiAddress,
]) {
  const collateralType = toBytes('DAI');
  beforeEach(async function() {
    this.daiToken = await ERC20Mock.new(daiAddress, 100 * 10 ** 6);

    this.managingDirector = await ManagingDirector.new(
      toBytes('inverse'),
      adminRole
    );
    this.erc20TellerFactory = await Erc20TellerFactory.new(adminRole);
  });
  describe('#makeErc20Teller', function() {
    it('reverts if not called by an admin', async function() {
      shouldFail.reverting(
        this.erc20TellerFactory.makeErc20Teller(
          collateralType,
          this.daiToken.address,
          this.managingDirector.address,
          adminRole
        )
      );
    });
    it('adds a new token', async function() {
      const { logs } = await this.erc20TellerFactory.makeErc20Teller(
        collateralType,
        this.daiToken.address,
        this.managingDirector.address,
        adminRole,
        { from: adminRole }
      );
      expectEvent.inLogs(logs, 'NewErc20Teller', {
        collateralType: padRight(collateralType, 64),
        collateralToken: this.daiToken.address,
      });
    });
  });
  describe('#verify', function() {
    it('should check if a token contract exists', async function() {
      await this.erc20TellerFactory.makeErc20Teller(
        collateralType,
        this.daiToken.address,
        this.managingDirector.address,
        adminRole,
        { from: adminRole }
      );
      const tokenAddress = await this.erc20TellerFactory.erc20Tellers(0);
      (await this.erc20TellerFactory.verify(tokenAddress)).should.be.true;
    });
  });
});
