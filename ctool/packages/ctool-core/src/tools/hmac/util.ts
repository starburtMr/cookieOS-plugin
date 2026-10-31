import hmac, {methodType} from "ctool-tools/domains/hmac";
import Text from "@/helper/text";
export * from "ctool-tools/domains/hmac";
export default (type: methodType, input: Text, secret: Text) => hmac(type,input.toUint8Array(),secret.toUint8Array());
