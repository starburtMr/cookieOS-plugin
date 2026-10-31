import hash, {methodType} from "ctool-tools/domains/hash";
import Text from "@/helper/text";
export * from "ctool-tools/domains/hash";
export default (type: methodType, input: Text, salt = "", exp = "") => hash(type,input.toUint8Array(),salt,exp,input.encoding());
