# Saito Implementation Protocol -- 003 Block Enticement Transactions (BETs)

## Abstract

A *block enticement transaction* (BET) is a special transaction to encourage network nodes to commit themselves to specific blocks at depth *N*, and to impose costs on block publishers who contribute extra blocks at depth *N*. The risk of a BET losing money increases the more likely it is that publishing a block at depth *N* will be redundant; the rational size of a BET at that depth will then decrease, and network nodes will have less incentive to switch to those redundant blocks, contributing to single-block-finality.

| Field   | Value                   |
| ------- | ----------------------- |
| Author  | Matthew Wilson          |
| Status  | Proposed                |
| Type    | Implementation Proposal |
| Created | June 3, 2023           |

## Logic

A BET on a block contains a reference to that block, and functions as follows:

* A BET is only valid at a depth greater than the block it references.
* The paysplit for a BET inherits the consensus value when the BET is in the block immediately following the block at depth *N* that it references, that is, block *N+1*.
* If the BET is validly included but does not reference the previous block, the paysplit in favor of routers is decreased by half to the benefit of miners and stakers.

## Network Incentives

Without an enticement, nodes receiving multiple blocks at once will be largely ambivalent in deciding which to move forward with which can fracture consensus and detract from security and usability. When proposed blocks include a BET with a routing signature, receiving nodes can maximize their reward by committing to blocks with the largest BET.

Since a BET only pays its full routing reward when it is included in the block directly after the block it references, nodes eligible for that reward will prefer that referenced block. If a node receives multiple BETs of varying reward for many distinct blocks at depth *N* and propagates all of them, they are *decreasing* the chance that the BET which rewards them the greatest is eventually accepted. They may still earn routing share from all BETs, but only one will grant the *full routing share*; so nodes are incentivized to only propagate the block with the largest BET in their favor.

In the case of multiple simultaneous blocks with equal BETs, the problem is equivalent to the protocol without any BETs with two added benefits:

1. The amount of blocks at depth *N* being deliberated on will likely be less when BETs are included
2. Extremely disruptive stalemates can be settled by block producers including further BETs on the same block

## Block Publisher Incentives

A BET exploits the fact that block publishers have a financial interest in blocks they produce and allows them to haggle network nodes for acceptance of their block over others. Block publishers compete for the implicit reward of their block being accepted when they BET on it, likely in the form of routing work they have invested in that block.

Block producers punish themselves by sending BETs for their block when they are aware that a block at depth *N* already exists; their BET will remain valid, but can and will likely be included on a fork detached from that tardy producer's block. Network nodes sent blocks with weak BETs can easily filter them. Block producers will want to compete to entice the rest of the network to accept their block, but the longer they wait to publish the less of a BET they can justify risking, further solidifying blocks published earlier and encouraging them to work on the next block instead.

As time passes and block producers are less willing to risk their money publishing at depth *N*, single block finality concretizes. Publishers sensing any remote risk of placing a BET on a late block are better off being first in line for the following block - with one exception: a publisher who stands to gain an outsized reward at depth *N* may be able to justify placing a large enough BET to sway the network to revert at that depth, but positive of this is that it *prioritizes* high paying transactions. Just like with normal routing work, BETs used to attack the network or revert consensus will always suffer a security fee via the paysplit which makes sustained malicious activity infinitely expensive. Producing a chain reverting BET should have the same cost as a similarly malicious fork.

## Malicious Fracturing

A BET imposes cost on nodes using routing work to maliciously split consensus at depth *N*. For every block at some depth a malicious node must pay a competitive BET rate (one which convinces the network to accept their block over honest block publishers) multiplied by the number of blocks they produce at that depth. Doing this continuously already requires spending money on routing work and Golden Tickets - the mitigation BETs uniquely help with is the delay in consensus nodes with enough routing work may impose for free by intermittently producing two or more blocks at once; this attack now has some cost, but is not likely a replacement for more aggressive slashing directly targeted at intentional fracturing.

## Possible Exploits

A block producer who wishes to entice others to accept his block over others but wants to reduce the cost of a BET may produce another spending transaction using the same inputs in an attempt to invalidate the BET. This attacker still must spend Saito on the fees, but since the routing reward for the BET is halved, they may be able to effectively propagate a transaction which only costs them half as much as the BET would have.

The attacker would accomplish this by sending both transactions at the same time. Network nodes must then choose between them. In the case that the BET is paying the normal paysplit to routers, the attacker must use an equally costly fee to compete with that BET - if the BET suffers the router paysplit reduction, then the same inputs competing to beat out the BET pay network nodes half as much.

The real exploit comes when a BET fails. In that case, it is still a valid transaction, but the reward it pays routers is halved. If the attacker propagated a normal transaction with the same inputs they could distribute the same amount of fees to routers at half the cost. Any routing node deciding between a BET and a normal transaction will simply choose the one which rewards the most; and when a failed BET pays 50%, the attacker only needs to spend 51% of the fee on the BET to convince routing nodes to select the transaction which discounts the attackers costs.

## Conclusion

In theory, BETs can offer powerful incentives to discourage the network from producing multiple blocks at depth *N* and can give single blocks some finality as block producers avoid placing BETs necessary to sway the network when it is likely a block at depth *N* already exists.

BETs have the added benefit in that they do not introduce closure; nodes can still earn Saito purely from routing work and later use it to BET on their own blocks without special privilege. Like Bitcoin mining, the cost is entirely upfront and reward comes after. Depending on how the market prices the competitive BET rate for new blocks, it may also be an effective deterrent against malicious fracturing. 