import { describe, expect, it } from 'vitest'
import { getAllEntityFileContent } from './getAllEntityFileContent.js'
import { getByIdEntityFileContent } from './getByIdEntityFileContent.js'
import { getCreateEntityFileContent } from './getCreateEntityFileContent.js'
import { getDeleteEntityFileContent } from './getDeleteEntityFileContent.js'
import { getUpdateEntityFileContent } from './getUpdateEntityFileContent.js'

describe('Client generation SDK version differences', () => {
	describe('getAllEntityFileContent', () => {
		it('SDK V1 uses string table name', () => {
			const result = getAllEntityFileContent('surrealdb', 'user', 'user', 1)
			expect(result).toContain('db.select<User>("user")')
			expect(result).not.toContain('Table')
		})

		it('SDK V2 uses new Table()', () => {
			const result = getAllEntityFileContent('surrealdb', 'user', 'user', 2)
			expect(result).toContain('new Table("user")')
			expect(result).toContain('import { type Surreal, Table }')
		})
	})

	describe('getCreateEntityFileContent', () => {
		it('SDK V1 uses string table name with second arg', () => {
			const result = getCreateEntityFileContent('surrealdb', 'user', 'user', 1)
			expect(result).toContain('db.create<UserCreate>("user", payload)')
			expect(result).not.toContain('Table')
		})

		it('SDK V2 uses Table + .content()', () => {
			const result = getCreateEntityFileContent('surrealdb', 'user', 'user', 2)
			expect(result).toContain('new Table("user")').and.toContain('.content(payload)')
			expect(result).toContain('import { type Surreal, Table }')
		})
	})

	describe('getUpdateEntityFileContent', () => {
		it('SDK V1 uses db.merge()', () => {
			const result = getUpdateEntityFileContent('surrealdb', 'user', 1)
			expect(result).toContain('db.merge<User>(id, payload)')
		})

		it('SDK V2 uses db.update().merge()', () => {
			const result = getUpdateEntityFileContent('surrealdb', 'user', 2)
			expect(result).toContain('db.update<User>(id).merge(payload)')
			expect(result).not.toContain('db.merge')
		})
	})

	describe('getDeleteEntityFileContent', () => {
		it('SDK V1 generates delete with RecordId', () => {
			const result = getDeleteEntityFileContent('surrealdb', 'user', 1)
			expect(result).toContain('db.delete<User>(id)')
		})

		it('SDK V2 generates delete with RecordId (same pattern)', () => {
			const result = getDeleteEntityFileContent('surrealdb', 'user', 2)
			expect(result).toContain('db.delete<User>(id)')
		})
	})

	describe('getByIdEntityFileContent', () => {
		it('SDK V1 generates query-based getById', () => {
			const result = getByIdEntityFileContent('surrealdb', 'user', 1)
			expect(result).toContain('db.query')
			expect(result).toContain('result[0]')
		})

		it('SDK V2 generates query-based getById (same pattern)', () => {
			const result = getByIdEntityFileContent('surrealdb', 'user', 2)
			expect(result).toContain('db.query')
			expect(result).toContain('result[0]')
		})
	})

	describe('default sdkVersion is 1', () => {
		it('getAllEntityFileContent defaults to V1', () => {
			const withDefault = getAllEntityFileContent('surrealdb', 'user', 'user')
			const withExplicit = getAllEntityFileContent('surrealdb', 'user', 'user', 1)
			expect(withDefault).toBe(withExplicit)
		})

		it('getCreateEntityFileContent defaults to V1', () => {
			const withDefault = getCreateEntityFileContent('surrealdb', 'user', 'user')
			const withExplicit = getCreateEntityFileContent('surrealdb', 'user', 'user', 1)
			expect(withDefault).toBe(withExplicit)
		})
	})
})
