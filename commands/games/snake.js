const { Snake } = require("discord-gamecord");
const { useFunctions } = require("@zibot/zihooks");

module.exports.data = {
	name: "snake",
	description: "Trò chơi rắn săn mồi",
	type: 1, // slash command
	integration_types: [0],
	contexts: [0, 1],
};
/**
 * @param { object } command - object command
 * @param { import ("discord.js").CommandInteraction } command.interaction - interaction
 * @param { import('../../lang/vi.js') } command.lang - language
 */
module.exports.execute = async ({ interaction, lang }) => {
	const ZiRank = useFunctions().get("ZiRank");
	const Game = new Snake({
		message: interaction,
		isSlashGame: true,
		embed: {
			title: "Rắn săn mồi",
			overTitle: "Trò chơi kết thúc",
			color: "#5865F2",
		},
		emojis: {
			board: "⬛",
			food: "🍎",
			up: "⬆️",
			down: "⬇️",
			left: "⬅️",
			right: "➡️",
		},
		snake: {
			head: "🟢",
			body: "🟩",
			tail: "🟢",
			skull: "💀",
		},
		foods: ["🍎", "🍇", "🍊", "🫐", "🥕", "🥝", "🌽"],
		stopButton: "🟥",
		timeoutTime: 60000,
		playerOnlyMessage: "Only {player} can use these buttons.",
	});

	Game.startGame();
	Game.on("gameOver", async (result) => {
		const CoinADD = result.result === "win" ? 100 : -100;
		await ZiRank.execute({ user: interaction.user, XpADD: 0, CoinADD });
	});
};
