export const addWordAsReactions = async ({ client, word, channel, timestamp }) => {
  try {
    const {
      message: { reactions = [] },
    } = await client.reactions.get({
      channel,
      timestamp,
    });

    const existingReactions = reactions.map((r) => r.name);

    const emojis = word.split("").map((character) => {
      if (character.match(/[a-zA-Z]/)) {
        let attempt = character;
        if (!existingReactions.includes(attempt)) {
          existingReactions.push(attempt);
          return attempt;
        }

        attempt = `alphabet-yellow-${character}`;
        if (!existingReactions.includes(attempt)) {
          existingReactions.push(attempt);
          return attempt;
        }

        attempt = `alphabet-white-${character}`;
        if (!existingReactions.includes(attempt)) {
          existingReactions.push(attempt);
          return attempt;
        }

        return null;
      }
    });

    for (const emoji of emojis) {
      if (emoji) {
        await client.reactions.add({
          name: emoji,
          timestamp,
          channel,
        });

        const DELAY_IN_MS = 700;
        await new Promise((r) => setTimeout(r, DELAY_IN_MS));
      }
    }
  } catch (e) {
    console.log("Couldn't spellmoji:", e);
  }
};

export const initSpellmoji = (app) => {
  app.view("view_spellmoji", async ({ ack, view, client }) => {
    await ack();

    const [channel, timestamp] = view.private_metadata.split("|");
    const word = view.state.values.input_1.word_input.value;

    addWordAsReactions({
      client,
      word,
      channel,
      timestamp,
    });
  });

  app.shortcut("spellmoji", async ({ shortcut, ack, client, logger }) => {
    await ack();

    try {
      const result = await client.views.open({
        trigger_id: shortcut.trigger_id,
        view: {
          // hack to pass the channel and ts through the view to the eventual handler that will need it
          // surely there must be a better way, but I couldn't find it
          private_metadata: `${shortcut.channel.id}|${shortcut.message.ts}`,
          type: "modal",
          callback_id: "view_spellmoji",
          title: {
            type: "plain_text",
            text: "SpellMoji",
          },
          blocks: [
            {
              type: "context",
              elements: [
                {
                  type: "plain_text",
                  text: ":s: :alphabet-yellow-p: :e: :l: :alphabet-white-l: :m: :o: :j: :i:",
                  emoji: true,
                },
              ],
            },
            {
              type: "input",
              block_id: "input_1",
              label: {
                type: "plain_text",
                text: "What do you want to spell with emoji?",
              },
              element: {
                type: "plain_text_input",
                action_id: "word_input",
                multiline: false,
                placeholder: {
                  type: "plain_text",
                  text: " ",
                },
              },
            },
          ],
          submit: {
            type: "plain_text",
            text: "Do it",
          },
        },
      });
      logger.info(result);
    } catch (error) {
      logger.error(error);
    }
  });
};
