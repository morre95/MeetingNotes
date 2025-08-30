
module.exports = ({ config }) => {

    return {
        ...config,
        expo: {
            name: "MeetingNotes",
            slug: "MeetingNotes",
            extra: {
                ...config.expo.extra,
                OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY
            }
        },
    };
};