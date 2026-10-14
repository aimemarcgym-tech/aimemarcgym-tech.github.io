import type { ExempleMouvement } from "@/lib/exemples";

// Sol : un mouvement par niveau, construit pour la note de départ maximale (vérifié avec le moteur).
// Chronologie : on alterne lignes d'acros (LAE) et pivots / sauts, le mouvement se termine par un acro.
export const EXEMPLES_SOL: ExempleMouvement[] = [
  {
    "apparatus": "SOL",
    "evolutionId": "A1",
    "titre": "Sol A1 — mouvement à la note maximale (d'après le lien partagé)",
    "elements": [
      {
        "code": "2"
      },
      {
        "code": "4pivot"
      },
      {
        "code": "82new"
      },
      {
        "code": "28"
      },
      {
        "code": "73"
      },
      {
        "code": "146"
      }
    ],
    "confirmations": [
      "A1-V1",
      "A1-V2",
      "A1-V3",
      "A1-V4"
    ],
    "validations": {
      "A1-TC-1": [
        "73"
      ],
      "A1-TC-2": [
        "82new",
        "146"
      ],
      "A1-V1": [
        "2"
      ],
      "A1-V2": [
        "28"
      ],
      "A1-V3": [
        "73"
      ],
      "A1-V4": [
        "82new",
        "146"
      ]
    },
    "remarques": [
      "« 2 acros de sens différents » : roulade arrière (82new, arrière) et roue (146, avant).",
      "« 1 élément P2 » est validé par le grand écart antéro-postérieur (73), distinct de l'ATR (2) et du saut (28)."
    ]
  },
  {
    "apparatus": "SOL",
    "evolutionId": "A2",
    "titre": "Sol A2 — mouvement à la note maximale",
    "elements": [
      {
        "code": "86new"
      },
      {
        "code": "27chat",
        "serie": "GYMNIQUE"
      },
      {
        "code": "28",
        "serie": "GYMNIQUE"
      },
      {
        "code": "2"
      },
      {
        "code": "146",
        "serie": "ACRO"
      },
      {
        "code": "149",
        "serie": "ACRO"
      }
    ],
    "confirmations": [
      "A2-V1",
      "A2-V2",
      "A2-V3",
      "A2-V4"
    ],
    "validations": {
      "A2-TC-1": [
        "27chat",
        "28"
      ],
      "A2-TC-2": [
        "146",
        "149"
      ],
      "A2-V1": [
        "2"
      ],
      "A2-V2": [
        "28"
      ],
      "A2-V3": [
        "146"
      ],
      "A2-V4": [
        "146",
        "149"
      ]
    },
    "remarques": [
      "« Sursaut + fente + roue » : le sursaut et la fente (non codifiés) précèdent la roue (146), qui suit l'ATR départ et retour en fente (2).",
      "« 2 acros de sens différents » : roue (avant) et souplesse arrière (149)."
    ]
  },
  {
    "apparatus": "SOL",
    "evolutionId": "B1",
    "titre": "Sol B1 — mouvement à la note maximale",
    "elements": [
      {
        "code": "9pivot"
      },
      {
        "code": "148",
        "serie": "ACRO"
      },
      {
        "code": "155",
        "serie": "ACRO"
      },
      {
        "code": "128biche",
        "serie": "GYMNIQUE"
      },
      {
        "code": "27chat",
        "serie": "GYMNIQUE"
      },
      {
        "code": "127"
      },
      {
        "code": "154",
        "serie": "ACRO"
      }
    ],
    "confirmations": [
      "B1-V2",
      "B1-V3",
      "B1-V4",
      "B1-V5"
    ],
    "validations": {
      "B1-TC-1": [
        "148",
        "155"
      ],
      "B1-TC-2": [
        "128biche",
        "27chat"
      ],
      "B1-V2": [
        "148",
        "155"
      ],
      "B1-V3": [
        "128biche"
      ],
      "B1-V4": [
        "154"
      ],
      "B1-V5": [
        "154",
        "155"
      ]
    },
    "remarques": [
      "LAE : rondade (148) puis flic-flac (155), le flic-flac est en P3.",
      "« 2 acros de sens différents » : saut de mains (154, avant) et flic-flac (155, arrière). Le sens d'une liaison est celui de son élément de liaison (FAQ #190) : à confirmer.",
      "La valorisation « ATR tenu 2'' départ et retour en fente » n'est pas utilisée : les quatre autres suffisent pour atteindre la note maximale (4 retenues sur 5)."
    ]
  },
  {
    "apparatus": "SOL",
    "evolutionId": "B2",
    "titre": "Sol B2 — mouvement à la note maximale",
    "elements": [
      {
        "code": "9pivot"
      },
      {
        "code": "154",
        "serie": "ACRO"
      },
      {
        "code": "148",
        "serie": "ACRO"
      },
      {
        "code": "128biche",
        "serie": "GYMNIQUE"
      },
      {
        "code": "27chat",
        "serie": "GYMNIQUE"
      },
      {
        "code": "19pivot"
      },
      {
        "code": "148+",
        "serie": "ACRO"
      },
      {
        "code": "169",
        "serie": "ACRO"
      }
    ],
    "confirmations": [
      "B2-V1",
      "B2-V2",
      "B2-V3",
      "B2-V4",
      "B2-V5"
    ],
    "validations": {
      "B2-TC-1": [
        "154",
        "148",
        "148+",
        "169"
      ],
      "B2-TC-2": [
        "148+",
        "169",
        "19pivot"
      ],
      "B2-TC-3": [
        "128biche",
        "27chat"
      ],
      "B2-V1": [
        "154",
        "148"
      ],
      "B2-V2": [
        "148+",
        "169"
      ],
      "B2-V3": [
        "128biche"
      ],
      "B2-V4": [
        "169"
      ],
      "B2-V5": [
        "154",
        "148",
        "148+",
        "169"
      ]
    },
    "remarques": [
      "Deux LAE distinctes : saut de mains-rondade, puis rondade « + »-salto arrière groupé (FAQ #172, #222).",
      "« 2 acros de sens différents dans les LAE » : une liaison vers l'avant (saut de mains-rondade) et une vers l'arrière (rondade-salto). Le sens d'une liaison est celui de son élément de liaison (FAQ #190) : à confirmer."
    ]
  },
  {
    "apparatus": "SOL",
    "evolutionId": "B3",
    "titre": "Sol B3 — mouvement à la note maximale (d'après le lien partagé)",
    "elements": [
      {
        "code": "148+",
        "serie": "ACRO"
      },
      {
        "code": "195+",
        "serie": "ACRO"
      },
      {
        "code": "172",
        "serie": "ACRO"
      },
      {
        "code": "10pivot"
      },
      {
        "code": "51enjambe"
      },
      {
        "code": "44saut"
      },
      {
        "code": "154+",
        "serie": "ACRO"
      },
      {
        "code": "170",
        "serie": "ACRO"
      }
    ],
    "confirmations": [
      "B3-V1",
      "B3-V2",
      "B3-V3",
      "B3-V5"
    ],
    "validations": {
      "B3-TC-1": [
        "51enjambe",
        "44saut"
      ],
      "B3-TC-2": [
        "148+",
        "195+",
        "172",
        "154+",
        "170"
      ],
      "B3-TC-3": [
        "172",
        "51enjambe"
      ],
      "B3-V1": [
        "154+",
        "170"
      ],
      "B3-V2": [
        "148+",
        "195+",
        "172"
      ],
      "B3-V3": [
        "51enjambe"
      ],
      "B3-V5": [
        "195+",
        "154+",
        "170"
      ]
    },
    "remarques": [
      "LAE 1 : rondade « + », flic-flac « + », salto arrière tendu (P5). LAE 2 : saut de mains « + », salto avant groupé ou carpé (appel 2 pieds).",
      "« 1 salto en P5 » n'est pas confirmée : le salto tendu (P5) sert déjà à « 1 LAE dont 1 élément P5 » (un élément ne valide qu'une seule valorisation). Les quatre autres valorisations suffisent pour la note maximale.",
      "« 2 acros de sens différents » : LAE vers l'arrière (rondade-flic-flac-salto) puis LAE vers l'avant (saut de mains-salto avant) : à confirmer."
    ]
  },
  {
    "apparatus": "SOL",
    "evolutionId": "C1",
    "titre": "Sol C1 — mouvement à la note maximale",
    "elements": [
      {
        "code": "17"
      },
      {
        "code": "148",
        "serie": "ACRO"
      },
      {
        "code": "155",
        "serie": "ACRO"
      },
      {
        "code": "172",
        "serie": "ACRO"
      },
      {
        "code": "45enjambe",
        "serie": "GYMNIQUE"
      },
      {
        "code": "13pivot"
      },
      {
        "code": "154",
        "serie": "ACRO"
      },
      {
        "code": "180",
        "serie": "ACRO"
      },
      {
        "code": "128biche",
        "serie": "GYMNIQUE"
      },
      {
        "code": "182",
        "serie": "ACRO"
      }
    ],
    "confirmations": [
      "C1-V1",
      "C1-V2",
      "C1-V3",
      "C1-V4",
      "C1-V5"
    ],
    "validations": {
      "C1-TC-1": [
        "45enjambe",
        "128biche"
      ],
      "C1-TC-2": [
        "148",
        "155",
        "172",
        "154",
        "180"
      ],
      "C1-TC-3": [
        "172",
        "180",
        "182"
      ],
      "C1-V1": [
        "180"
      ],
      "C1-V2": [
        "148",
        "155",
        "172"
      ],
      "C1-V3": [
        "45enjambe"
      ],
      "C1-V4": [
        "182"
      ],
      "C1-V5": [
        "155",
        "154",
        "180"
      ]
    },
    "remarques": [
      "LAE de 3 éléments différents : rondade, flic-flac, salto arrière tendu (P5).",
      "« 1 salto position tendue appel 2 pieds » : salto avant tendu (180) après le saut de mains.",
      "La valorisation « 2 salti liés » n'est pas utilisée : ses salti servent déjà à d'autres valorisations."
    ]
  },
  {
    "apparatus": "SOL",
    "evolutionId": "C2",
    "titre": "Sol C2 — mouvement à la note maximale",
    "elements": [
      {
        "code": "13pivot"
      },
      {
        "code": "148",
        "serie": "ACRO"
      },
      {
        "code": "155",
        "serie": "ACRO"
      },
      {
        "code": "172",
        "serie": "ACRO"
      },
      {
        "code": "54enjambe",
        "serie": "GYMNIQUE"
      },
      {
        "code": "41sissonne",
        "serie": "GYMNIQUE"
      },
      {
        "code": "19pivot"
      },
      {
        "code": "148+",
        "serie": "ACRO"
      },
      {
        "code": "179",
        "serie": "ACRO"
      },
      {
        "code": "128biche",
        "serie": "GYMNIQUE"
      },
      {
        "code": "154",
        "serie": "ACRO"
      },
      {
        "code": "180",
        "serie": "ACRO"
      }
    ],
    "confirmations": [
      "C2-V1",
      "C2-V2",
      "C2-V3",
      "C2-V4",
      "C2-V5"
    ],
    "validations": {
      "C2-TC-1": [
        "54enjambe",
        "41sissonne",
        "128biche"
      ],
      "C2-TC-2": [
        "148",
        "155",
        "172",
        "148+",
        "179",
        "154",
        "180"
      ],
      "C2-TC-3": [
        "179",
        "180"
      ],
      "C2-V1": [
        "179"
      ],
      "C2-V2": [
        "148",
        "155",
        "172"
      ],
      "C2-V3": [
        "54enjambe"
      ],
      "C2-V4": [
        "180"
      ],
      "C2-V5": [
        "155",
        "148+",
        "179",
        "154",
        "180"
      ]
    },
    "remarques": [
      "Trois lignes acro : rondade-flic-flac-salto tendu (LAE de 3 éléments), rondade « + »-salto arrière avec 1 tour, saut de mains-salto avant tendu.",
      "« 1 salto avec rotation longitudinale 360° » : salto arrière avec 1 tour (179).",
      "Mouvement à 12 éléments, le maximum du niveau."
    ]
  },
  {
    "apparatus": "SOL",
    "evolutionId": "C3",
    "titre": "Sol C3 — mouvement à la note maximale",
    "elements": [
      {
        "code": "13pivot"
      },
      {
        "code": "148",
        "serie": "ACRO"
      },
      {
        "code": "155",
        "serie": "ACRO"
      },
      {
        "code": "178",
        "serie": "ACRO"
      },
      {
        "code": "71enjambe",
        "serie": "GYMNIQUE"
      },
      {
        "code": "60enjambe",
        "serie": "GYMNIQUE"
      },
      {
        "code": "19pivot"
      },
      {
        "code": "148+",
        "serie": "ACRO"
      },
      {
        "code": "105",
        "serie": "ACRO"
      },
      {
        "code": "128biche",
        "serie": "GYMNIQUE"
      },
      {
        "code": "154",
        "serie": "ACRO"
      },
      {
        "code": "185",
        "serie": "ACRO"
      }
    ],
    "confirmations": [
      "C3-V1",
      "C3-V2",
      "C3-V3",
      "C3-V4",
      "C3-V5"
    ],
    "validations": {
      "C3-TC-1": [
        "71enjambe",
        "60enjambe",
        "128biche"
      ],
      "C3-TC-2": [
        "148",
        "155",
        "178",
        "148+",
        "105",
        "154",
        "185"
      ],
      "C3-TC-3": [
        "185"
      ],
      "C3-V1": [
        "105"
      ],
      "C3-V2": [
        "148",
        "155",
        "178"
      ],
      "C3-V3": [
        "71enjambe"
      ],
      "C3-V4": [
        "185"
      ],
      "C3-V5": [
        "155",
        "148+",
        "105",
        "154",
        "185"
      ]
    },
    "remarques": [
      "« 1 acro avec double rotation » : double salto arrière groupé (105), après la rondade « + ».",
      "LAE de 3 éléments différents dont 1 P6 : rondade, flic-flac, salto arrière avec 1/2 tour (178).",
      "Mouvement à 12 éléments, le maximum du niveau."
    ]
  }
];
