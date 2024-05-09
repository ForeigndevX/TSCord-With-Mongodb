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

	async updateLastInteract(userId?: string): Promise<void> {
		const user = await this.findOne({ userId })

		if (user) {
			user.lastInteract = new Date()
			await this.flush()
		}
	}

}
