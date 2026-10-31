import {format} from "sql-formatter";
const TYPE_STR = ["String","Integer","Long","Timestamp"];
const convertParam = (params: string) => {
    if (params) {
        const tempList = params.split(',', -1)
        // 因为参数中可能存在逗号，例如json数据，为此采取的方案是先分割，后合并的策略
        // 分割后是不包含,的，检查串是否为null或者)结尾，如果是则认为是正常的参数，如果不是则认为是分割后的串的一部分
        // 举例{"goodsService":[],"goodsSpecs":{"id":"db6c56a224a788c5a7458017731c9255","imageFileId":"16925e7fc297452a984d4b3e2e9e6e40"}}(String),
        // null, null, 1(Integer),1(Integer)
        // paramStrList 为合并后的实际参数列表
        const paramStrList:string[] = []
        let paramIndex = 0
        // 标记是否在合并中
        let combining = false
        tempList.forEach((x) => {
            // 对null值采用endsWith的原因是因为有前置空格，直接判断endWith比去掉空格处理更方便
            // 遇到null值直接作为参数
            if (x.endsWith('null')) {
              paramStrList.push(x)
              paramIndex ++
            } else if (x.endsWith(')')) {
                // 前面的串处在合并过程中，遇到了）结尾的情况，说明合并结束
                if (combining) {
                    paramStrList[paramIndex] += ',' + x
                    combining = false
                } else {
                    paramStrList.push(x)
                }
                paramIndex ++
            } else {
                const tempStr = paramStrList[paramIndex]
                if (!tempStr) {
                  paramStrList.push(x)
                  combining= true
                } else {
                  paramStrList[paramIndex] +=  ',' + x
                }
            }
        })
        return paramStrList.map(x => {
            const valueEndIndex = x.lastIndexOf('(')
            if (valueEndIndex < 0) {
                // 直接将整个串作为值，类型为其他
                return {value: x, type: null}
            }
            // 从串中截取出值，并对前后空格进行清除
            let value = x.substring(0, valueEndIndex)
            value = value.trim();
            // 对数据中的'进行转义，mybatis输出的参数中的'是不进行转义的
            value = value.replaceAll("'", "''")
            // 从串中截取出类型，并进行前后空格清除
            let typeEndIndex = x.lastIndexOf(')')
            if (typeEndIndex < 0) {
                typeEndIndex = x.length
            }
            let type = x.substring(valueEndIndex + 1, typeEndIndex)
            type = type.trim()
            return {value, type}
        })
    } else {
        return []
    }
}

/**
 * 根据参数类型格式化参数值
 */
const formatParamValue = (param: { value: string, type: string | null }) => {
    switch (param.type) {
        case TYPE_STR[0]: // String
            return ' \'' + param.value + '\''
        case TYPE_STR[1]: // Integer
        case TYPE_STR[2]: // Long
            return param.value
        case TYPE_STR[3]: // Timestamp
            return 'Timestamp \'' + param.value + '\''
        default: // 其他类型直接拼接原始值
            return param.value
    }
}

/**
 * 检测 SQL 是否使用具名参数（:name 或 #{name} 格式）
 */
/**
 * 将参数字符串解析为具名参数 Map
 * 格式：name=value(type),age=value(type)
 */
const convertNamedParam = (params: string): Map<string, { value: string, type: string | null }> => {
    const result = new Map<string, { value: string, type: string | null }>()
    if (!params) return result

    // 按逗号分割，处理值中包含逗号的情况（与 convertParam 类似的合并策略）
    const tempList = params.split(',', -1)
    const paramStrList: string[] = []
    let paramIndex = 0
    let combining = false

    tempList.forEach((x) => {
        if (x.endsWith('null') && x.includes('=')) {
            paramStrList.push(x)
            paramIndex++
        } else if (x.endsWith(')')) {
            if (combining) {
                paramStrList[paramIndex] += ',' + x
                combining = false
            } else {
                paramStrList.push(x)
            }
            paramIndex++
        } else {
            const tempStr = paramStrList[paramIndex]
            if (!tempStr) {
                paramStrList.push(x)
                combining = true
            } else {
                paramStrList[paramIndex] += ',' + x
            }
        }
    })

    paramStrList.forEach(item => {
        const eqIndex = item.indexOf('=')
        if (eqIndex < 0) return
        const name = item.substring(0, eqIndex).trim()
        const rest = item.substring(eqIndex + 1)

        const valueEndIndex = rest.lastIndexOf('(')
        if (valueEndIndex < 0) {
            result.set(name, { value: rest.trim(), type: null })
            return
        }
        let value = rest.substring(0, valueEndIndex).trim()
        value = value.replaceAll("'", "''")
        const typeEndIndex = rest.lastIndexOf(')')
        const type = rest.substring(valueEndIndex + 1, typeEndIndex < 0 ? rest.length : typeEndIndex).trim()
        result.set(name, { value, type })
    })

    return result
}


export const fillSql = (input: string, params: string) => {
    const values: Record<string,string> = Object.create(null);
    convertParam(params).forEach((param,index)=>{values[String(index)]=formatParamValue(param);});
    for (const [name,param] of convertNamedParam(params)) values[name]=formatParamValue(param);
    const checked = new Proxy(values,{get(target,key){if(typeof key!=='string'||!Object.hasOwn(target,key))throw new Error("Missing SQL parameter");return target[key];}});
    return format(input,{params:checked,paramTypes:{positional:true,named:[":"],custom:[{regex:"#\\{\\w+\\}",key:v=>v.slice(2,-1)}]}});
};
