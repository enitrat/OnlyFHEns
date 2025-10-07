// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {
    IConfidentialFungibleToken
} from "@openzeppelin/confidential-contracts/interfaces/IConfidentialFungibleToken.sol";

/// @title Encrypted Tip Contract using a Confidential Token
/// @notice Accepts confidential tips in an encrypted token and lets creators withdraw privately.
/// @dev Integrates with OpenZeppelin ConfidentialFungibleToken and FHEVM encrypted types.
contract OnlyFHEn is SepoliaConfig {
    // --------------------------------------------------------------------------
    // Storage
    // --------------------------------------------------------------------------
    /// @notice Encrypted balances per creator (credited tips)
    mapping(address creatorAddress => euint64 encryptedBalance) private _balances;
    /// @notice Creator registration flag
    mapping(address creatorAddress => bool isRegistered) public isRegistered;
    /// @notice Confidential token used for payments
    IConfidentialFungibleToken public immutable TOKEN;
    /// @notice Contract owner (can assist with ACL reinit)
    address public immutable OWNER;

    // --------------------------------------------------------------------------
    // Events
    // --------------------------------------------------------------------------
    /// @notice Emitted when a creator registers
    event CreatorRegistered(address indexed creator);
    /// @notice Emitted after a tip is credited to a creator
    event TipReceived(address indexed supporter, address indexed creator);
    /// @notice Emitted when a creator withdraws; amount is encrypted
    event WithdrawRequested(address indexed creator, euint64 amount);

    // --------------------------------------------------------------------------
    // Modifiers
    // --------------------------------------------------------------------------
    // no external roles required

    // --------------------------------------------------------------------------
    // Constructor & Admin
    // --------------------------------------------------------------------------
    constructor(address confidentialToken) {
        TOKEN = IConfidentialFungibleToken(confidentialToken);
        OWNER = msg.sender;
    }

    // --------------------------------------------------------------------------
    // Creator lifecycle
    // --------------------------------------------------------------------------
    /// @notice Register caller as a creator with an initialized encrypted balance and ACL.
    /// @dev Initializes balance to 0 and grants ACL to the contract and the creator.
    function registerCreator() external {
        require(!isRegistered[msg.sender], "OnlyFHEn: already registered");
        isRegistered[msg.sender] = true;

        // Initialize encrypted balance to zero and set ACL for contract and creator.
        _balances[msg.sender] = FHE.asEuint64(0);
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);

        emit CreatorRegistered(msg.sender);
    }

    /// @notice Re-grant ACL for a creator's ciphertext to the contract and the creator.
    /// @dev Useful for recovering from accidental ACL loss patterns.
    /// @param creator The creator address whose balance ACL is re-established.
    function reinit(address creator) external {
        require(msg.sender == creator || msg.sender == OWNER, "OnlyFHEn: not authorized");
        require(isRegistered[creator], "OnlyFHEn: creator not registered");
        euint64 bal = _balances[creator];
        FHE.allowThis(bal);
        FHE.allow(bal, creator);
    }

    // --------------------------------------------------------------------------
    // Views
    // --------------------------------------------------------------------------
    /// @notice Returns the encrypted balance of a creator.
    /// @dev Caller must have decrypt rights via SDK; ACL is granted to creator.
    function getEncryptedBalance(address creator) external view returns (euint64) {
        return _balances[creator];
    }

    // --------------------------------------------------------------------------
    // Tips
    // --------------------------------------------------------------------------
    /// @notice Tip a creator with an encrypted amount using confidential tokens.
    /// @dev Uses confidentialTransferFrom to move tokens from supporter to this contract.
    /// @param creator The creator to tip (must be registered).
    /// @param inputAmount Encrypted tip amount handle from relayer SDK.
    /// @param inputProof ZK proof linking handle to this contract and sender.
    function tipCreator(address creator, externalEuint64 inputAmount, bytes calldata inputProof) external {
        // Checks
        require(isRegistered[creator], "OnlyFHEn: creator not registered");

        // Effects

        // Get and verify user amount
        euint64 eAmount = FHE.fromExternal(inputAmount, inputProof);

        // Transfer the confidential token to the contract.
        euint64 balanceBefore = TOKEN.confidentialBalanceOf(address(this));
        FHE.allowTransient(eAmount, address(TOKEN));
        TOKEN.confidentialTransferFrom(msg.sender, address(this), eAmount);
        euint64 balanceAfter = TOKEN.confidentialBalanceOf(address(this));
        euint64 sentBalance = FHE.sub(balanceAfter, balanceBefore);

        // Update the creator's balance
        _balances[creator] = FHE.add(_balances[creator], sentBalance);

        // Re-authorize the updated ciphertext for future use.
        FHE.allowThis(_balances[creator]);
        FHE.allow(_balances[creator], creator);

        emit TipReceived(msg.sender, creator);
    }

    // --------------------------------------------------------------------------
    // Withdrawals (confidential tokens)
    // --------------------------------------------------------------------------
    /// @notice Creator requests a withdrawal of an encrypted amount.
    /// @dev Transfers min(requested, credited) to the creator using confidentialTransfer.
    /// @param encryptedAmount Encrypted requested amount handle from relayer SDK.
    /// @param inputProof ZK proof linking handle to this contract and sender.
    function requestWithdraw(externalEuint64 encryptedAmount, bytes calldata inputProof) external {
        require(isRegistered[msg.sender], "OnlyFHEn: creator not registered");

        // Get the creator's encrypted balance
        euint64 req = FHE.fromExternal(encryptedAmount, inputProof);
        euint64 avail = _balances[msg.sender];
        euint64 maxSend = FHE.min(avail, req);
        FHE.allowTransient(maxSend, address(TOKEN));

        // Reset the creator's balance
        _balances[msg.sender] = FHE.sub(_balances[msg.sender], maxSend);
        FHE.allowThis(_balances[msg.sender]);
        FHE.allow(_balances[msg.sender], msg.sender);

        // Send the tokens to the creator (up to maxSend)
        TOKEN.confidentialTransfer(msg.sender, maxSend);
        emit WithdrawRequested(msg.sender, maxSend);
    }
}
