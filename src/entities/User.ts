import { Entity, EntityRepositoryType, Property } from '@mikro-orm/core'
import { EntityRepository } from '@mikro-orm/sqlite'

import { CustomBaseEntity } from './BaseEntity'

// ===========================================
// ================= Entity ==================
// ===========================================

@Entity({ customRepository: () => UserRepository })
export class User extends CustomBaseEntity {

	[EntityRepositoryType]?: UserRepository

	@Property()
    userId!: string

	@Property()
    lastInteract: Date = new Date()

}

// ===========================================
// =========== Custom Repository =============
// ===========================================

export class UserRepository extends EntityRepository<User> {

	async save(userId?: string, changes?: object): Promise<void> {
		const user = await this.findOne({ userId })

		if (user && changes) {
			Object.assign(user, changes)

			await this.persistAndFlush(user)
		} else if (user && !changes) {
			console.warn(`No changes provided for guild: ${userId}`)
		} else if (!user && changes) {
			console.warn(`No existing guild found with ID: ${userId}. Cannot save changes.`)
		}
	}

	async updateLastInteract(userId?: string): Promise<void> {
		const user = await this.findOne({ userId })

		if (user) {
			user.lastInteract = new Date()
			await this.flush()
		}
	}

}
