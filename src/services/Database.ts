import fs from 'node:fs'

import { EntityName, MikroORM, Options } from '@mikro-orm/core'
import fastFolderSizeSync from 'fast-folder-size/sync'
import { backup, restore } from 'saveqlite'
import { delay, inject } from 'tsyringe'

import { databaseConfig, mikroORMConfig } from '@/configs'
import { Schedule, Service } from '@/decorators'
import * as entities from '@/entities'
import { env } from '@/env'
import { Logger, PluginsManager, Store } from '@/services'
import { resolveDependency } from '@/utils/functions'

@Service()
export class Database {

	private _orm: MikroORM<DatabaseDriver>

	constructor(
		@inject(delay(() => Store)) private store: Store,
        @inject(delay(() => Logger)) private logger: Logger
	) {}

	async initialize() {
		const pluginsManager = await resolveDependency(PluginsManager)

		// get config
		const config = mikroORMConfig[env.NODE_ENV || 'development'] as Options<DatabaseDriver>

		// defines entities into the config
		config.entities = [...Object.values(entities), ...pluginsManager.getEntities()]

		// initialize the ORM using the configuration exported in `mikro-orm.config.ts`
		this._orm = await MikroORM.init(config)

		const shouldMigrate = !this.store.get('botHasBeenReloaded')
		if (shouldMigrate) {
			const migrator = this._orm.getMigrator()

			// create migration if no one is present in the migrations folder
			const pendingMigrations = await migrator.getPendingMigrations()
			const executedMigrations = await migrator.getExecutedMigrations()
			if (pendingMigrations.length === 0 && executedMigrations.length === 0)
				await migrator.createInitialMigration()

			// migrate to the latest migration
			await this._orm.getMigrator().up()
		}
	}

	async refreshConnection() {
		await this._orm.close()
		this._orm = await MikroORM.init()
	}

	get orm(): MikroORM<DatabaseDriver> {
		return this._orm
	}

	get em(): DatabaseEntityManager {
		return this._orm.em
	}

	/**
	 * Shorthand to get custom and natives repositories
	 * @param entity Entity of the custom repository to get
	 */
	get<T extends object>(entity: EntityName<T>) {
		return this._orm.em.getRepository(entity)
	}

	/**
	 * Create a snapshot of the database each day at 00:00
	 */

	/**
	 * Restore the SQLite database from a snapshot file.
	 * @param snapshotName name of the snapshot to restore
	 * @returns true if the snapshot has been restored, false otherwise
	 */

	getBackupList(): string[] | null {
		const backupPath = databaseConfig.backup.path
		if (!backupPath) {
			this.logger.log('Backup path not set, couldn\'t get list of backups', 'error')

			return null
		}

		const files = fs.readdirSync(backupPath)
		const backupList = files.filter(file => file.startsWith('snapshot'))

		return backupList
	}

	isSQLiteDatabase(): boolean {
		const type = mikroORMConfig[env.NODE_ENV]!.type

		if (type)
			return ['sqlite', 'better-sqlite'].includes(type)
		else return false
	}

}
