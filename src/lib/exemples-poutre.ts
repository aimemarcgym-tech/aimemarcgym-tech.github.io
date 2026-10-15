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
  }
];
