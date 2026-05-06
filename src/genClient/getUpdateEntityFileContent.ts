import { toUpperCamelCase } from '../helper/toUpperCamelCase.js'

export const getUpdateEntityFileContent = (lib: string, entityName: string, sdkVersion: 1 | 2 = 1) => {
	const entitySchemaName = `${entityName}Schema`
	const entityNameFirstUpper = `${toUpperCamelCase(entityName)}`

	if (sdkVersion === 2) {
		return `
import { type Surreal, RecordId } from "${lib}";

import { ${entitySchemaName} } from "../../schema/${entityName}/${entityName}Schema.js";
import type { ${entityNameFirstUpper} } from "../../schema/${entityName}/${entityName}Types.js";

export const update${entityNameFirstUpper} = async function (db: Surreal, id: RecordId, ${entityName}: Partial<${entityNameFirstUpper}>) {
  const _key = ${entitySchemaName}.pick({ id: true }).parse({ id });
  const payload = ${entitySchemaName}.omit({ id: true }).partial().parse(${entityName});

  return db.update<${entityNameFirstUpper}>(id).merge(payload);
};
`
	}

	return `
import { type Surreal, RecordId} from "${lib}";

import { ${entitySchemaName} } from "../../schema/${entityName}/${entityName}Schema.js";
import type { ${entityNameFirstUpper} } from "../../schema/${entityName}/${entityName}Types.js";

export const update${entityNameFirstUpper} = async function (db: Surreal, id: RecordId ,${entityName}: Partial<${entityNameFirstUpper}>) {
  const _key = ${entitySchemaName}.pick({ id: true }).parse({ id });
  const payload = ${entitySchemaName}.omit({ id: true }).partial().parse(${entityName});

  return db.merge<${entityNameFirstUpper}>(id, payload);
};
`
}
