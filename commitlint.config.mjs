export default {
  parserPreset: {
    parserOpts: {
      headerPattern: /^\[BHB-(\d+)\]\s+(.+)$/,
      headerCorrespondence: ["ticket", "subject"],
    },
  },
  rules: {
    "header-match-pattern": [2, "always"],
    "subject-empty": [2, "never"],
  },
  plugins: [
    {
      rules: {
        "header-match-pattern": ({ header }) => {
          const pattern = /^\[BHB-\d+\]\s+.+$/;
          return [
            pattern.test(header),
            'Commit message must match "[BHB-XX] text." (e.g. [BHB-42] Add login page.)',
          ];
        },
        "subject-empty": ({ subject }) => [
          Boolean(subject && subject.trim().length > 0),
          "Commit subject is required after the ticket.",
        ],
      },
    },
  ],
};
