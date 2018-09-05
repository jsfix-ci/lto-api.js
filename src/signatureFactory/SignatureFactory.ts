import {
  Attachment,
  Base58, Base64,
  Byte,
  ByteProcessor, DataEntries,
  Long,
  Recipient,
  Transfers
} from '../byteProcessor/ByteProcessor';
import {
  IDATA_PROPS, IMASS_TRANSFER_PROPS, ISET_SCRIPT_PROPS
} from './interface';
import {
  ICANCEL_LEASING_PROPS, ILEASE_PROPS,
  ISignatureGenerator,
  ISignatureGeneratorConstructor, ITRANSFER_PROPS,
  TTX_NUMBER_MAP,
  TTX_TYPE_MAP
} from './interface';
import {concatUint8Arrays} from '../utils/concat';
import crypto from '../utils/crypto';
import * as constants from '../constants';


export function generate<T>(fields: Array<ByteProcessor | number>): ISignatureGeneratorConstructor<T> {

  if (!fields || !fields.length) {
    throw new Error('It is not possible to create TransactionClass without fields');
  }

  // Fields of the original data object
  const storedFields: object = Object.create(null);

  // Data bytes or functions returning data bytes via promises
  const byteProviders: Array<Function | Uint8Array> = [];

  fields.forEach(function (field: ByteProcessor) {
    if (field instanceof ByteProcessor) {
      // Remember user data fields
      storedFields[field.name] = field;
      // All user data must be represented as bytes
      byteProviders.push((data) => field.process(data[field.name]));
    } else if (typeof field === 'number') {
      // All static data must be converted to bytes as well
      byteProviders.push(Uint8Array.from([field]));
    } else {
      throw new Error('Invalid field is passed to the createTransactionClass function');
    }
  });

  class SignatureGenerator implements ISignatureGenerator {

    // Array of Uint8Array and promises which return Uint8Array
    private readonly _dataHolders: Array<Uint8Array | Promise<Uint8Array>>;
    // Request data provided by user
    private readonly _rawData: object;

    constructor(hashMap: any = {}) {

      // Save all needed values from user data
      this._rawData = Object.keys(storedFields).reduce((store, key) => {
        store[key] = hashMap[key];
        return store;
      }, {});

      this._dataHolders = byteProviders.map((provider) => {
        if (typeof provider === 'function') {
          // Execute function so that they return promises containing Uint8Array data
          return provider(this._rawData);
        } else {
          // Or just pass Uint8Array data
          return provider;
        }
      });
    }

    public getSignature(privateKey: string): Promise<string> {
      return this.getBytes().then((dataBytes) => {
        return crypto.createSignature(dataBytes, privateKey);
      });
    }

    // Get byte representation of the transaction
    public getBytes(): Promise<Uint8Array> {
      return Promise.all(this._dataHolders).then((multipleDataBytes: Uint8Array[]) => {
        if (multipleDataBytes.length === 1) {
          return multipleDataBytes[0];
        } else {
          return concatUint8Arrays(...multipleDataBytes);
        }
      });
    }

    // Get bytes of an exact field from user data
    public getExactBytes(fieldName: string): Promise<Uint8Array> {

      if (!(fieldName in storedFields)) {
        throw new Error(`There is no field '${fieldName}' in 'RequestDataType class`);
      }

      const byteProcessor = storedFields[fieldName];
      const userData = this._rawData[fieldName];
      return byteProcessor.process(userData);
    }

  }

  return SignatureGenerator;
}

export const TX_NUMBER_MAP: TTX_NUMBER_MAP = Object.create(null);
export const TX_TYPE_MAP: TTX_TYPE_MAP = Object.create(null);

const TRANSFER = generate<ITRANSFER_PROPS>([
  constants.TRANSACTION_TYPE_NUMBER.TRANSFER,
  new Base58('senderPublicKey'),
  new Long('timestamp'),
  new Long('amount'),
  new Long('fee'),
  new Recipient('recipient'),
  new Attachment('attachment')
]);

TX_NUMBER_MAP[constants.TRANSACTION_TYPE_NUMBER.TRANSFER] = TRANSFER;
TX_TYPE_MAP[constants.TRANSACTION_TYPE.TRANSFER] = TRANSFER;

const LEASE = generate<ILEASE_PROPS>([
  constants.TRANSACTION_TYPE_NUMBER.LEASE,
  new Base58('senderPublicKey'),
  new Recipient('recipient'),
  new Long('amount'),
  new Long('fee'),
  new Long('timestamp')
]);

TX_NUMBER_MAP[constants.TRANSACTION_TYPE_NUMBER.LEASE] = LEASE;
TX_TYPE_MAP[constants.TRANSACTION_TYPE.LEASE] = LEASE;

const CANCEL_LEASING = generate<ICANCEL_LEASING_PROPS>([
  constants.TRANSACTION_TYPE_NUMBER.CANCEL_LEASING,
  new Base58('senderPublicKey'),
  new Long('fee'),
  new Long('timestamp'),
  new Base58('transactionId')
]);

TX_NUMBER_MAP[constants.TRANSACTION_TYPE_NUMBER.CANCEL_LEASING] = CANCEL_LEASING;
TX_TYPE_MAP[constants.TRANSACTION_TYPE.CANCEL_LEASING] = CANCEL_LEASING;

const MASS_TRANSFER = generate<IMASS_TRANSFER_PROPS>([
  constants.TRANSACTION_TYPE_NUMBER.MASS_TRANSFER,
  constants.TRANSACTION_TYPE_VERSION.MASS_TRANSFER,
  new Base58('senderPublicKey'),
  new Transfers('transfers'),
  new Long('timestamp'),
  new Long('fee'),
  new Attachment('attachment')
]);

TX_NUMBER_MAP[constants.TRANSACTION_TYPE_NUMBER.MASS_TRANSFER] = MASS_TRANSFER;
TX_TYPE_MAP[constants.TRANSACTION_TYPE.MASS_TRANSFER] = MASS_TRANSFER;

const DATA = generate<IDATA_PROPS>([
  constants.TRANSACTION_TYPE_NUMBER.DATA,
  constants.TRANSACTION_TYPE_VERSION.DATA,
  new Base58('senderPublicKey'),
  new DataEntries('data'),
  new Long('timestamp'),
  new Long('fee')
]);

TX_NUMBER_MAP[constants.TRANSACTION_TYPE_NUMBER.DATA] = DATA;
TX_TYPE_MAP[constants.TRANSACTION_TYPE.DATA] = DATA;

const SET_SCRIPT = generate<ISET_SCRIPT_PROPS>([
  constants.TRANSACTION_TYPE_NUMBER.SET_SCRIPT,
  constants.TRANSACTION_TYPE_VERSION.SET_SCRIPT,
  new Byte('chainId'),
  new Base58('senderPublicKey'),
  constants.SET_SCRIPT_LANG_VERSION,
  new Base64('script'),
  new Long('fee'),
  new Long('timestamp')
]);

TX_NUMBER_MAP[constants.TRANSACTION_TYPE_NUMBER.SET_SCRIPT] = SET_SCRIPT;
TX_TYPE_MAP[constants.TRANSACTION_TYPE.SET_SCRIPT] = SET_SCRIPT;