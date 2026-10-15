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
  },
  {
    "apparatus": "POUTRE",
    "evolutionId": "B3",
    "titre": "Poutre B3 — mouvement à la note maximale",
    "elements": [
      {
        "code": "1"
      },
      {
        "code": "5new"
      },
      {
        "code": "82-26"
      },
      {
        "code": "152"
      },
      {
        "code": "62",
        "serie": "GYMNIQUE"
      },
      {
        "code": "57",
        "serie": "GYMNIQUE"
      },
      {
        "code": "153+-26"
      },
      {
        "code": "199-26"
      }
    ],
    "confirmations": [
      "P-B3-V1",
      "P-B3-V2",
      "P-B3-V3",
      "P-B3-V5"
    ],
    "validations": {
      "P-B3-TC-1": [
        "5new",
        "152",
        "153+-26",
        "199-26"
      ],
      "P-B3-TC-2": [
        "82-26"
      ],
      "P-B3-TC-3": [
        "82-26",
        "62",
        "57",
        "153+-26"
      ],
      "P-B3-V1": [
        "62",
        "57"
      ],
      "P-B3-V2": [
        "62"
      ],
      "P-B3-V3": [
        "153+-26"
      ]
    },
    "remarques": [
      "Entrée en bout de poutre, saut droit, pivot, roue, grand jeté cosaque (saut enjambé + saut de cosaque), souplesse arrière « + », et la sortie en dernier.",
      "Le grand jeté cosaque est une série gymnique : elle valide « 1 LG ou LM », et son saut enjambé valide aussi « 1 saut avec écart antéro » (les éléments d'une série peuvent valider deux valorisations : information de l'entraîneur, à confirmer officiellement).",
      "« 1 acro sur la poutre P4 minimum » est validée par la souplesse arrière « + » (P4) : la sortie ne compte que pour le tronc commun (FAQ #145). « Poutre mousse : acro P4 minimum » est confirmée à la main (aucun élément de poutre mousse dans ce mouvement).",
      "« 1 sortie avec liaison acro » n'est pas confirmée : les quatre autres valorisations suffisent pour la note maximale (4 retenues sur 5)."
    ]
  },
  {
    "apparatus": "POUTRE",
    "evolutionId": "C1",
    "titre": "Poutre C1 — mouvement à la note maximale",
    "elements": [
      {
        "code": "19"
      },
      {
        "code": "82-26"
      },
      {
        "code": "152+",
        "serie": "ACRO"
      },
      {
        "code": "152",
        "serie": "ACRO"
      },
      {
        "code": "62",
        "serie": "MIXTE"
      },
      {
        "code": "159-26",
        "serie": "MIXTE"
      },
      {
        "code": "52"
      },
      {
        "code": "153+-26"
      },
      {
        "code": "199-26"
      }
    ],
    "confirmations": [
      "P-C1-V1",
      "P-C1-V2",
      "P-C1-V3",
      "P-C1-V5"
    ],
    "validations": {
      "P-C1-TC-1": [
        "152+",
        "152",
        "159-26",
        "153+-26",
        "199-26"
      ],
      "P-C1-TC-2": [
        "82-26"
      ],
      "P-C1-TC-3": [
        "19"
      ],
      "P-C1-V1": [
        "62",
        "159-26"
      ],
      "P-C1-V2": [
        "52"
      ],
      "P-C1-V3": [
        "152+",
        "152"
      ],
      "P-C1-V5": [
        "153+-26",
        "199-26"
      ]
    },
    "remarques": [
      "Entrée à l'ATR, pivot, série acro (roue « + » puis roue), série mixte (saut enjambé, souplesse avant), saut en extension, souplesse arrière « + » puis la sortie en dernier.",
      "« 1 LG ou LM dont 2 P3 minimum » est validée par la série mixte (saut enjambé P4 et souplesse avant P4), « 1 LA sur poutre » par la série acro (roue « + » et roue), « 1 saut avec 1 rotation à 180° » par le saut en extension ½ tour, « 1 sortie avec liaison acro » par la souplesse arrière « + » suivie du salto arrière groupé : chaque valorisation a ses propres éléments (FAQ #214, #45).",
      "« 1 élément acro P5 minimum sur la poutre » et « Poutre mousse : 1 LA dont 1 élément avec envol » ne sont pas confirmées : les quatre autres valorisations suffisent pour la note maximale (4 retenues sur 6)."
    ]
  },
  {
    "apparatus": "POUTRE",
    "evolutionId": "C2",
    "titre": "Poutre C2 — mouvement à la note maximale",
    "elements": [
      {
        "code": "1"
      },
      {
        "code": "82-26"
      },
      {
        "code": "67",
        "serie": "GYMNIQUE"
      },
      {
        "code": "63",
        "serie": "GYMNIQUE"
      },
      {
        "code": "153+-26",
        "serie": "ACRO"
      },
      {
        "code": "187-26",
        "serie": "ACRO"
      },
      {
        "code": "61"
      },
      {
        "code": "166-26"
      },
      {
        "code": "202-26"
      }
    ],
    "confirmations": [
      "P-C2-V1",
      "P-C2-V2",
      "P-C2-V3",
      "P-C2-V4"
    ],
    "validations": {
      "P-C2-TC-1": [
        "153+-26",
        "187-26",
        "166-26",
        "202-26"
      ],
      "P-C2-TC-2": [
        "82-26"
      ],
      "P-C2-TC-3": [
        "63"
      ],
      "P-C2-V1": [
        "67",
        "63"
      ],
      "P-C2-V2": [
        "61"
      ],
      "P-C2-V3": [
        "153+-26",
        "187-26"
      ],
      "P-C2-V4": [
        "166-26"
      ]
    },
    "remarques": [
      "Entrée en bout de poutre, pivot, série gymnique (saut enjambé avec changement de jambes, saut antéropostérieur ½ tour), série acro (souplesse arrière « + », salto arrière groupé), saut groupé ½ tour, flic-flac, et la sortie en dernier.",
      "« 1 élément P6 » du tronc commun est validé par le saut antéropostérieur avec ½ tour (P6).",
      "« 1 LG ou LM dont 2 P4 minimum » est validée par la série gymnique, « 1 LA dont 1 élément avec envol » par la série acro (le salto), « 1 acro avec envol sur la poutre » par le flic-flac (P5) : la sortie ne compte que pour le tronc commun (FAQ #145). « 1 saut avec 1 rotation à 180° » est validée par le saut groupé ½ tour.",
      "« 1 sortie avec liaison acro dont un élément P4 minimum » et « Poutre mousse : 1 LA de 2 éléments dont 1 salto » ne sont pas confirmées : les quatre autres valorisations suffisent pour la note maximale (4 retenues sur 6)."
    ]
  },
  {
    "apparatus": "POUTRE",
    "evolutionId": "C3",
    "titre": "Poutre C3 — mouvement à la note maximale",
    "elements": [
      {
        "code": "1"
      },
      {
        "code": "82-26"
      },
      {
        "code": "168+-26",
        "serie": "ACRO"
      },
      {
        "code": "192-26",
        "serie": "ACRO"
      },
      {
        "code": "62",
        "serie": "GYMNIQUE"
      },
      {
        "code": "32new",
        "serie": "GYMNIQUE"
      },
      {
        "code": "164+"
      },
      {
        "code": "210-26"
      }
    ],
    "confirmations": [
      "P-C3-V1",
      "P-C3-V3",
      "P-C3-V4",
      "P-C3-V5"
    ],
    "validations": {
      "P-C3-TC-1": [
        "168+-26",
        "192-26",
        "164+",
        "210-26"
      ],
      "P-C3-TC-2": [
        "82-26"
      ],
      "P-C3-TC-3": [
        "192-26"
      ],
      "P-C3-V1": [
        "62",
        "32new"
      ],
      "P-C3-V3": [
        "168+-26",
        "192-26"
      ],
      "P-C3-V4": [
        "192-26"
      ],
      "P-C3-V5": [
        "164+",
        "210-26"
      ]
    },
    "remarques": [
      "Entrée en bout de poutre, pivot, série acro (flic-flac « + », salto arrière tendu pieds décalés), série gymnique (saut enjambé, cosaque changement), rondade « + », et la sortie en dernier.",
      "« 1 élément P7 » du tronc commun est validé par le salto arrière tendu pieds décalés (P7). « 1 LG ou LM dont 2 P4 minimum » est validée par la série gymnique, « 1 sortie avec liaison acro dont 1 élément P5 minimum » par la rondade « + » suivie de la sortie (P5).",
      "Le salto arrière tendu pieds décalés (P7) valide à la fois « 1 LA de 2 éléments dont 1 salto » (comme élément de la série acro) et « 1 salto sur poutre P6 minimum » : les éléments d'une série peuvent valider deux valorisations (information de l'entraîneur, à confirmer officiellement).",
      "« 1 saut écart avec 1 rotation à 180° » et « Poutre mousse : 1 LA de 2 éléments avec envol dont 1 salto » ne sont pas confirmées : les quatre autres valorisations suffisent pour la note maximale (4 retenues sur 6)."
    ]
  }
];
