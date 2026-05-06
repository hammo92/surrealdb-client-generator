import { toUpperCamelCase } from '../helper/toUpperCamelCase.js'

export const getCreateEntityFileContent = (
	lib: string,
	entityName: string,
	tableName: string,
	sdkVersion: 1 | 2 = 1,
) => {
	const entitySchemaName = `${entityName}CreateSchema`
	const entityNameFirstUpper = `${toUpperCamelCase(entityName)}`
	const entityTypeName = `${toUpperCamelCase(entityName)}`
	const entityCreateTypeName = `${toUpperCamelCase(entityName)}Create`

	if (sdkVersion === 2) {
		return `
import { type Surreal, Table } from "${lib}";

import { ${entitySchemaName} } from "../../schema/${entityName}/${entityName}Schema.js";
import type { ${entityTypeName}, ${entityCreateTypeName} } from "../../schema/${entityName}/${entityName}Types.js";

export const create${entityNameFirstUpper} = async function (db: Surreal, ${entityName}: ${entityCreateTypeName}) {
  const payload = ${entitySchemaName}.parse(${entityName});

  return db.create<${entityCreateTypeName}>(new Table("${tableName}")).content(payload);
};
`
	}

	return `
import type { Surreal } from "${lib}";

import { ${entitySchemaName} } from "../../schema/${entityName}/${entityName}Schema.js";
import type { ${entityTypeName}, ${entityCreateTypeName} } from "../../schema/${entityName}/${entityName}Types.js";

export const create${entityNameFirstUpper} = async function (db: Surreal, ${entityName}: ${entityCreateTypeName}) {
  const payload = ${entitySchemaName}.parse(${entityName});

  const result = await db.create<${entityCreateTypeName}>("${tableName}", payload);

  return result[0]
};
`
}
