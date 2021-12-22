import { Anchor } from './classes/transactions/anchor'
import { LTO } from './LTO';
import { PublicNode } from './classes/publicNode';
import { getPositionOfLineAndCharacter, moveSyntheticComments } from 'typescript';
import { type } from 'os';
import { typeOf } from 'ts-utils';
import { __awaiter } from 'tslib';
import base58 from './libs/base58';
import { Transfer } from './classes/transactions/transfer';
import crypto from "./utils/crypto";
import convert from './utils/convert';
import { data } from '@lto-network/lto-transactions';
import { Association } from './classes/transactions/association';


const phrase = 'cool strike recall mother true topic road bright nature dilemma glide shift return mesh strategy';
const phrase2 = 'cage afford gym kitchen price physical grid impulse tumble uncover deliver bounce dance display vintage';
let account = new LTO('T').createAccountFromExistingPhrase(phrase);
let third = new LTO('T').createAccountFromExistingPhrase(phrase2);

let node = new PublicNode('https://testnet.lto.network');

let transaction = new Transfer(third.address, 100000000);
//let transaction = new Association(third.address, 1, 'rlgeorgljergljerlkgej');
transaction.signWith(account);

//transaction.sponsorWith(account);
async function my(){
    let ret = await transaction.broadcastTo(node);
    console.log(ret)
}
my();




//console.log(third.address);
//console.log(account.address);
//let decoded = base58.decode(third.address)
//console.log(base58.encode(decoded));
//let attachment = 'fkwjfskjfhsekfljwlekjwelkrjwlrekj'
//let tipo = 4
let version = 2
console.log(base58.encode(Uint8Array.from([version])))
