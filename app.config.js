import Constants from 'expo-constants';

Constants.expoConfig.extra.OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || ''

module.exports = ({ config }) => {
    return {
        ...config,
        name: "MeetingNotes",
        slug: "MeetingNotes",
        extra: {
            ...config.extra,
            OPENAI_API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY || ''
        }
    };
};