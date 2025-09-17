const { useFunctions, useDB } = require("@zibot/zihooks");

module.exports.data = {
	name: "volume",
	description: "Chỉnh sửa âm lượng nhạc",
	category: "musix",
	type: 1, // slash commad
	options: [
		{
			name: "vol",
			description: "Nhập âm lượng",
			required: true,
			type: 4,
			min_value: 0,
			max_value: 100,
		},
	],
	integration_types: [0],
	contexts: [0],
};

/**
 * @param { object } command - object command
 * @param { import ("discord.js").CommandInteraction } command.interaction - interaction
 * @param { import ('../../lang/vi.js') } command.lang
 * @param {import("ziplayer").Player} command.player - player
 */

module.exports.execute = async ({ interaction, lang, player }) => {
	await interaction.deferReply({ withResponse: true });
	const volume = interaction.options.getInteger("vol");
	if (!player?.connection) return interaction.editReply({ content: lang.music.NoPlaying });
	player.setVolume(Math.floor(volume));
	await interaction.deleteReply().catch((e) => {});
	const DataBase = useDB();
	if (DataBase) {
		await DataBase.ZiUser.updateOne({ userID: interaction.user.id }, { $set: { volume: volume }, $upsert: true });
	}
	const player_func = useFunctions().get("player_func");
	if (!player_func) return;
	const res = await player_func.execute({ player });
	return player.userdata.mess.edit(res);
};
