import type { ExempleMouvement } from "@/lib/exemples";

// Poutre : un mouvement par niveau, à la note de départ maximale du niveau.
// Chronologie : on commence par l'entrée, on alterne pivots, acros et sauts (ou séries gymniques, mixtes, acro), la sortie en dernier.
export const EXEMPLES_POUTRE: ExempleMouvement[] = [
  {
    "apparatus": "POUTRE",
    "evolutionId": "A1",
    "titre": "Poutre A1 — mouvement à la note maximale",
    "elements": [
      {
        "code": "5"
      },
      {
        "code": "73"
      },
      {
        "code": "45"
      },
      {
        "code": "146-26"
      },
      {
        "code": "28new"
      },
      {
        "code": "193-26"
      }
    ],
    "confirmations": [
      "P-A1-V1",
      "P-A1-V2",
      "P-A1-V3"
    ],
    "validations": {
      "P-A1-TC-1": [
        "146-26",
        "193-26"
      ],
      "P-A1-TC-2": [
        "45",
        "28new"
      ],
      "P-A1-V1": [
        "73"
      ],
      "P-A1-V2": [
        "28new"
      ],
      "P-A1-V3": [
        "146-26"
      ]
    },
    "remarques": [
      "Entrée en bout de poutre, puis pivot, sauts et acro en alternance, et la sortie en dernier.",
      "« Poutre mousse : 1 ATR (PR) » n'est pas confirmée : trois valorisations sur quatre sont retenues (3 retenues sur 4), ce qui suffit pour la note maximale."
    ]
  },
  {
    "apparatus": "POUTRE",
    "evolutionId": "A2",
    "titre": "Poutre A2 — mouvement à la note maximale",
    "elements": [
      {
        "code": "8"
      },
      {
        "code": "76"
      },
      {
        "code": "44-26"
      },
      {
        "code": "150-26"
      },
      {
        "code": "45"
      },
      {
        "code": "196-26"
      }
    ],
    "confirmations": [
      "P-A2-V1",
      "P-A2-V2",
      "P-A2-V3"
    ],
    "validations": {
      "P-A2-TC-1": [
        "196-26"
      ],
      "P-A2-TC-2": [
        "44-26",
        "45"
      ],
      "P-A2-V1": [
        "76"
      ],
      "P-A2-V2": [
        "44-26"
      ],
      "P-A2-V3": [
        "150-26"
      ]
    },
    "remarques": [
      "Entrée en bout de poutre (écart facial), puis pivot, saut, ATR, saut, et la rondade en dernier.",
      "« Poutre mousse : roue » n'est pas confirmée : trois valorisations sur quatre sont retenues (3 retenues sur 4), ce qui suffit pour la note maximale."
    ]
  },
  {
    "apparatus": "POUTRE",
    "evolutionId": "B1",
    "titre": "Poutre B1 — mouvement à la note maximale",
    "elements": [
      {
        "code": "8"
      },
      {
        "code": "45"
      },
      {
        "code": "82-26"
      },
      {
        "code": "152"
      },
      {
        "code": "49-26"
      },
      {
        "code": "201-26"
      }
    ],
    "confirmations": [
      "P-B1-V1",
      "P-B1-V2",
      "P-B1-V3",
      "P-B1-V4"
    ],
    "validations": {
      "P-B1-TC-1": [
        "152",
        "201-26"
      ],
      "P-B1-TC-2": [
        "45",
        "49-26"
      ],
      "P-B1-V1": [
        "82-26"
      ],
      "P-B1-V2": [
        "49-26"
      ],
      "P-B1-V3": [
        "152"
      ],
      "P-B1-V4": [
        "201-26"
      ]
    },
    "remarques": [
      "Entrée en bout de poutre, puis saut, pivot, acro, saut, et la sortie en dernier.",
      "La sortie compte comme acro en poutre haute pour le tronc commun seulement (FAQ #145) : elle valide en revanche « 1 sortie P3 minimum », et la roue seule valide « 1 acro P2 minimum ».",
      "« Poutre mousse : acro P2 minimum » n'est pas confirmée : quatre valorisations sur cinq sont retenues (4 retenues sur 5)."
    ]
  },
  {
    "apparatus": "POUTRE",
    "evolutionId": "B2",
    "titre": "Poutre B2 — mouvement à la note maximale",
    "elements": [
      {
        "code": "1"
      },
      {
        "code": "104"
      },
      {
        "code": "82-26"
      },
      {
        "code": "52"
      },
      {
        "code": "153-26"
      },
      {
        "code": "49-26"
      },
      {
        "code": "201-26"
      },
      {
        "code": "19new"
      }
    ],
    "confirmations": [
      "P-B2-V1",
      "P-B2-V3",
      "P-B2-V4",
      "P-B2-V5"
    ],
    "validations": {
      "P-B2-TC-1": [
        "153-26",
        "201-26"
      ],
      "P-B2-TC-2": [
        "82-26"
      ],
      "P-B2-TC-3": [
        "104",
        "52",
        "153-26",
        "49-26",
        "201-26"
      ],
      "P-B2-V1": [
        "52",
        "49-26"
      ],
      "P-B2-V3": [
        "153-26"
      ],
      "P-B2-V4": [
        "201-26"
      ],
      "P-B2-V5": [
        "19new"
      ]
    },
    "remarques": [
      "Entrée en bout de poutre, puis maintien, pivot, saut, acro, saut, la sortie, et un acro sur la poutre mousse.",
      "« 2 éléments gymniques P3 minimum dans le mouvement » est validée par le saut en extension ½ tour et le saut antéro-postérieur (P3). « 1 élément acro sur la poutre P3 minimum » par la souplesse arrière : la sortie ne compte que pour le tronc commun (FAQ #145).",
      "« 1 saut avec écart antéro » n'est pas confirmée : le saut antéro-postérieur sert déjà aux deux éléments gymniques. Les quatre autres valorisations suffisent pour la note maximale (4 retenues sur 5)."
    ]
  }
];
