import { BodyParams, Controller, Get, Post, UseBefore } from '@tsed/common'
import { InternalServerError } from '@tsed/exceptions'
import { Required } from '@tsed/schema'

import { DevAuthenticated } from '@/api/middlewares'
import { databaseConfig } from '@/configs'
import { Injectable } from '@/decorators'
import { Database } from '@/services'
import { BaseController } from '@/utils/classes'
import { formatDate, resolveDependencies } from '@/utils/functions'

@Controller('/database')
@UseBefore(
	DevAuthenticated
)
@Injectable()
export class DatabaseController extends BaseController {

	private db: Database

	constructor() {
		super()

		resolveDependencies([Database]).then(([db]) => {
			this.db = db
		})
	}

}
