export const EXERCISE_TYPES = 
{
    FROM_KNOWN_TO_TARGET: 1,
    FROM_TARGET_TO_KNOWN: 2,
    FILL_IN_THE_BLANKS: 3,
    MATCHING: 4,
    FROM_KNOWN_TO_TARGET_BUCKET: 5
};

export const LEANRING_STATUS = 
{
    NEW: 0,
    DONE: 1
}

export const PLACEHOLDERS = {
    KNOWN_LANGAUGE_PLACEHOLDER: "kkknownnn",
    TARGET_LANGAUGE_PLACEHOLDER: "tttargettt",
    BLANKS: "___"
}

export const EXERCISE_GENERATIONS = 
[
    {
        type: EXERCISE_TYPES.FROM_KNOWN_TO_TARGET, 
        name: "Translate to target language", 
        description:"Generate sentences in the langauge you know to translate to the langauge you are learning.",
        first_data_instructions: "Sentences in the langauge you know, separated by semi-colon(;)",
        second_data_instructions: "Sentences in the langauge you are learning, separated by semi-colon(;)",
        ai_instruction: ""
    },
    {
        type: EXERCISE_TYPES.FROM_TARGET_TO_KNOWN, 
        name: "Translate to known language", 
        description:"Generate sentences in the langauge you are learning to translate to the langauge you know.",
        first_data_instructions: "Sentences in the langauge you are learning, separated by semi-colon(;)",
        second_data_instructions: "Sentences in the langauge you know, separated by semi-colon(;)",
        ai_instruction: ""
    },
    {
        type: EXERCISE_TYPES.FILL_IN_THE_BLANKS, 
        name: "Fill in words", 
        description:"Generate sentences to fill in words in, such as the right prepositions. Use ____ for blanks.",
        first_data_instructions: "Sentences in the langauge you are learning, separated by semi-colon(;), with blanks for words to fill",
        second_data_instructions: "The same sentences with the blanks filled, separated by semi-colon(;)",
        ai_instruction: `I am learning ${PLACEHOLDERS.TARGET_LANGAUGE_PLACEHOLDER} from ${PLACEHOLDERS.KNOWN_LANGAUGE_PLACEHOLDER}. Prepare for me some exercises where I have to fill in the right preposition - use ___ for blanks. Then preapre me a separate list with the full correct answers. In each list, separate each sentence with semi-colon.`
    },
    {
        type: EXERCISE_TYPES.MATCHING, 
        name: "Match words", 
        description:"Match words between two buckets lists: one bucket list will includes words in the langauge you know and the other bucket list will include words in the langauge you are learning.",
        first_data_instructions: "Words in the langauge you know, separated by semi-colon(;)",
        second_data_instructions: "Words in the langauge you are learning, separated by semi-colon(;)",
        ai_instruction: ""
    },
    {
        type: EXERCISE_TYPES.FROM_KNOWN_TO_TARGET_BUCKET, 
        name: "Translate with bucket list", 
        description:"Generate sentences in the langauge you know to translate to the langauge you are learning from a bucket list.",
        first_data_instructions: "Sentences in the langauge you know, separated by semi-colon(;)",
        second_data_instructions: "Sentences in the langauge you are learning, separated by semi-colon(;)",
        ai_instruction: ""
    }
];