import { Category } from '@discordx/utilities'
import { ApplicationCommandOptionType, CommandInteraction, EmbedBuilder, User } from 'discord.js'
import { Client } from 'discordx'

import { generalConfig } from '@/configs'
import { Discord, Injectable, Slash, SlashOption } from '@/decorators'
import { Guild } from '@/entities'
import { UnknownReplyError } from '@/errors'
import { Guard, UserPermissions } from '@/guards'
import { Database } from '@/services'
import { getColor, resolveGuild, simpleSuccessEmbed } from '@/utils/functions'

@Discord()
@Injectable()
@Category('Admin')
export default class PrefixCommand {

	constructor(
		private db: Database
	) { }

	@Slash({ name: 'warn', description: 'warn a user' })
	@Guard(
		UserPermissions(['ModerateMembers'])
	)
	async prefix(
		@SlashOption({
			name: 'user',
			type: ApplicationCommandOptionType.User,
			required: true,
		}) User: User,
		@SlashOption({
			name: 'reason',
			type: ApplicationCommandOptionType.String,
			required: true,
		}) Reason: string | undefined,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		const guild = resolveGuild(interaction)
		const guildData = await this.db.get(Guild).findOne({ guildId: guild?.id || '' })

		if (guildData) {
			if (guildData.warnings) {
				const userWarnings = []

				for (const warning of guildData.warnings) {
					if (warning.userId === User.id) {
						userWarnings.push(warning)
					}
				}

				// Push new warning into the warnings array
				guildData.warnings.push({ userId: User.id, reason: Reason, totalWarnings: userWarnings.length + 1 })

				// Save the updated guild data to the mongoDB database
				await this.db.get(Guild).save(guildData.guildId, guildData)

				const embed = new EmbedBuilder()
					.setTitle(`NEW WARNING`)
					.setDescription(`<@${User.id}> has been successfully warned. \nReason: **${Reason}**`)
					.setColor(getColor('primary'))
					.setFooter({ text: 'Powered by DiscBot Team ❤' })
				await interaction.followUp({ embeds: [embed], ephemeral: true })
			} else {
				guildData.warnings = []

				guildData.warnings.push({ userId: User.id, reason: Reason, totalWarnings: 1 })

				await this.db.get(Guild).save(guildData.guildId, guildData)

				const embed = new EmbedBuilder()
					.setTitle(`NEW WARNING`)
					.setDescription(`<:reply_go:1238163161111330878> <@${User.id}> has been successfully warned. \n<:reply1:1238163200596381744> Reason: **${Reason}**`)
					.setColor(getColor('primary'))
					.setFooter({ text: 'Powered by DiscBot Team ❤' })
				await interaction.followUp({ embeds: [embed], ephemeral: true })
			}
		} else {
			throw new UnknownReplyError(interaction)
		}
	}

}
