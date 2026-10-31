export const formatRows = (json, type = "json", keyed_key = 0) => {
    if (type === "keyed") {
        const keys = Object.keys(json[0])
        const result = Object.create(null)
        for (const item of json) {
            const item_key = keys[keyed_key]
            result[item[item_key]] = item
        }
        return result
    }
    if (type === "row_array") {
        let result = json.map((item) => {
            return Object.values(item)
        })
        if (result.length > 0) {
            result = [
                Object.keys(json[0]),
                ...result
            ]
        }
        return result
    }
    if (type === "column_array") {
        const keys = Object.keys(json[0])
        const result = Object.create(null)
        for (const key of keys) {
            result[key] = json.map((item) => {
                return item[key]
            })
        }
        return result
    }
    return json
}

