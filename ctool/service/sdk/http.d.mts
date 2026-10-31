import type {ModelsApi} from "../../contracts/xhub";
export function createHostClientFromEnv(env:NodeJS.ProcessEnv):{models:ModelsApi;close():Promise<void>};
