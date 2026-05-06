import { toUpperCamelCase } from '../helper/toUpperCamelCase.js'

export const getAllEntityFileContent = (lib: string, entityName: string, tableName: string, sdkVersion: 1 | 2 = 1) => {
	const entityNameFirstUpper = `${toUpperCamelCase(entityName)}`
	const entityTypeName = `${toUpperCamelCase(entityName)}`

	if (sdkVersion === 2) {
		return `
import { type Surreal, Table } from "${lib}";

import type { ${entityTypeName} } from "../../schema/${entityName}/${entityName}Types.js";

export const getAll${entityNameFirstUpper}s = async function (db: Surreal) {
  return db.select<${entityTypeName}>(new Table("${tableName}"))
};
`
	}

	return `
import type { Surreal } from "${lib}";

import type { ${entityTypeName} } from "../../schema/${entityName}/${entityName}Types.js";

export const getAll${entityNameFirstUpper}s = async function (db: Surreal) {
  return db.select<${entityTypeName}>("${tableName}")
};
`
}
