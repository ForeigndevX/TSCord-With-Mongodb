import { Entity, EntityRepositoryType, Property } from '@mikro-orm/core'
import { EntityRepository } from '@mikro-orm/sqlite'
import { Array } from 'ts-toolbelt/out/Misc/JSON/_api'

import { CustomBaseEntity } from './BaseEntity'

// ===========================================
// ================= Entity ==================
// ===========================================

@Entity({ customRepository: () => GuildRepository })
export class Guild extends CustomBaseEntity {

	[EntityRepositoryType]?: GuildRepository

	@Property()
	guildId!: string

	@Property({ nullable: true, type: 'string' })
	prefix: string | null

	@Property()
	deleted: boolean = false

	@Property({ type: 'json', nullable: true })
	warnings?: any

	@Property()
	lastInteract: Date = new Date()

}

// ===========================================
// =========== Custom Repository =============
// ===========================================

export class GuildRepository extends EntityRepository<Guild> {

	async save(guildId?: string, changes?: object): Promise<void> {
		const guild = await this.findOne({ guildId })

		if (guild && changes) {
			Object.assign(guild, changes)

			await this.persistAndFlush(guild)
		} else if (guild && !changes) {
			console.warn(`No changes provided for guild: ${guildId}`)
		} else if (!guild && changes) {
			console.warn(`No existing guild found with ID: ${guildId}. Cannot save changes.`)
		}
	}

	async updateLastInteract(guildId?: string): Promise<void> {
		const guild = await this.findOne({ guildId })

		if (guild) {
			guild.lastInteract = new Date()
			await this.flush()
		}
	}

	async getActiveGuilds() {
		return this.find({ deleted: false })
	}

}
