const { Buffer } = require("buffer");
const assert = require("assert");

function createHttpClient(headers) {
  const httpClient = async ({ url, body, method }) => {
    const options = {
      body: body ? JSON.stringify(body) : undefined,
      headers,
      method: method ?? "GET",
    };
    const response = await fetch(url, options);
    return response.json();
  };

  return httpClient;
}

async function getSession(httpClient, fromLanguage, learningLanguage) {
  assert(httpClient, "'httpClient' is required");
  assert(fromLanguage, "'fromLanguage' is required");
  assert(learningLanguage, "'learningLanguage' is required");

  const session = await httpClient({
    url: "https://www.duolingo.com/2017-06-30/sessions",
    method: "POST",
    body: {
      challengeTypes: [
        "assist",
        "characterIntro",
        "characterMatch",
        "characterPuzzle",
        "characterSelect",
        "characterTrace",
        "characterWrite",
        "completeReverseTranslation",
        "definition",
        "dialogue",
        "extendedMatch",
        "extendedListenMatch",
        "form",
        "freeResponse",
        "gapFill",
        "judge",
        "listen",
        "listenComplete",
        "listenMatch",
        "match",
        "name",
        "listenComprehension",
        "listenIsolation",
        "listenSpeak",
        "listenTap",
        "orderTapComplete",
        "partialListen",
        "partialReverseTranslate",
        "patternTapComplete",
        "radioBinary",
        "radioImageSelect",
        "radioListenMatch",
        "radioListenRecognize",
        "radioSelect",
        "readComprehension",
        "reverseAssist",
        "sameDifferent",
        "select",
        "selectPronunciation",
        "selectTranscription",
        "svgPuzzle",
        "syllableTap",
        "syllableListenTap",
        "speak",
        "tapCloze",
        "tapClozeTable",
        "tapComplete",
        "tapCompleteTable",
        "tapDescribe",
        "translate",
        "transliterate",
        "transliterationAssist",
        "typeCloze",
        "typeClozeTable",
        "typeComplete",
        "typeCompleteTable",
        "writeComprehension",
      ],
      fromLanguage,
      isFinalLevel: false,
      isV2: true,
      juicy: true,
      learningLanguage,
      smartTipsVersion: 2,
      type: "GLOBAL_PRACTICE",
    },
  });

  return session;
}

async function getXpGain(httpClient, session) {
  assert(httpClient, "'httpClient' is required");
  assert(session, "'session' is required");

  const { xpGain } = await httpClient({
    url: `https://www.duolingo.com/2017-06-30/sessions/${session.id}`,
    method: "PUT",
    body: {
      ...session,
      heartsLeft: 0,
      startTime: (+new Date() - 60000) / 1000,
      enableBonusPoints: false,
      endTime: +new Date() / 1000,
      failed: false,
      maxInLessonStreak: 9,
      shouldLearnThings: true,
    },
  });

  return xpGain;
}

async function run() {
  try {
    assert(
      process.env.DUOLINGO_JWT,
      "'Environment variable 'DUOLINGO_JWT' is required"
    );

    const LESSONS = process.env.LESSONS ? Number(process.env.LESSONS) : 1;
    const DUOLINGO_JWT = process.env.DUOLINGO_JWT;

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DUOLINGO_JWT}`,
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    };

    const { sub } = JSON.parse(
      Buffer.from(DUOLINGO_JWT.split(".")[1], "base64").toString()
    );

    const httpClient = createHttpClient(headers);

    const { fromLanguage, learningLanguage } = await httpClient({
      url: `https://www.duolingo.com/2017-06-30/users/${sub}?fields=fromLanguage,learningLanguage`,
    });

    let xp = 0;

    for (let i = 0; i < LESSONS; i++) {
      const session = await getSession(
        httpClient,
        fromLanguage,
        learningLanguage
      );
      const xpGain = await getXpGain(httpClient, session);
      xp += xpGain;
    }

    console.log(`🎉 You won ${xp} XP`);
  } catch (error) {
    console.error("❌ Something went wrong", error);
    if (error instanceof Error) {
      console.error(error.message);
    }
  }
}

run();
